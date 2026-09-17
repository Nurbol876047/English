'use client';

import { useEffect, useRef } from 'react';
import { useSortWordsStore, WAIT_POINT } from '@/store/sortWordsStore';
import { EmaSmoother3 } from '@/lib/hand/handGeometry';
import { basketForDirection, isPalmOpen } from '@/lib/sort-words/swipeGeometry';
import { useHandProjection } from '@/hooks/hand/useHandProjection';
import { useSwipeDetector } from './useSwipeDetector';
import type { HandFrame, HandTracking } from '@/hooks/hand/useMediaPipeHands';

/** Радиус захвата слова вокруг курсора */
const GRAB_RADIUS = 1.0;
/** Ниже этой высоты курсор считается «над корзинами» */
const BASKET_ZONE_Y = -0.8;
/** Полуширина зоны корзины по X */
const BASKET_HALF_W = 1.6;

/** Точки следа ладони для SwipeTrail3D — мутируемый буфер, не React-state */
export interface TrailBuffer {
  points: Float32Array; // x, y, t подряд
  head: number;
  count: number;
  readonly capacity: number;
}

export const trailBuffer: TrailBuffer = { points: new Float32Array(16 * 3), head: 0, count: 0, capacity: 16 };

function pushTrail(x: number, y: number, t: number): void {
  const i = trailBuffer.head * 3;
  trailBuffer.points[i] = x;
  trailBuffer.points[i + 1] = y;
  trailBuffer.points[i + 2] = t;
  trailBuffer.head = (trailBuffer.head + 1) % trailBuffer.capacity;
  if (trailBuffer.count < trailBuffer.capacity) trailBuffer.count++;
}

/**
 * Единый контроллер ввода Sort the Words. Работает внутри <Canvas>.
 *
 * Режим pinch: щипок рядом со словом → захват → слово следует за курсором →
 *   разжатие над корзиной → sortWord.
 * Режим swipe: центр ладони → SwipeDetector → взмах влево/вверх/вправо →
 *   sortWord(0/1/2). Пока рука движется к корзине — «прицел» (aimBasket).
 * Мышь/тач: те же два режима — drag плашки (pointerdown в FlyingWord3D) и
 *   быстрое движение с зажатой кнопкой; плюс клик по корзине (Basket3D).
 */
export function useSortController(hand: Pick<HandTracking, 'subscribe'> | null): void {
  const { projectLandmark, projectPointer, palmCenter, camera, gl } = useHandProjection();
  const smoother = useRef(new EmaSmoother3(0.35));
  const wasPinching = useRef(false);
  const swipe = useSwipeDetector();
  const pointerSwipe = useSwipeDetector();
  const lastDebug = useRef(0);
  /** Кнопка мыши зажата — рука в это время не вмешивается (ни курсор, ни прицел) */
  const pointerPressed = useRef(false);

  const nearestBasket = (x: number, y: number): number | null => {
    if (y > BASKET_ZONE_Y) return null;
    const { baskets } = useSortWordsStore.getState();
    for (const b of baskets) if (Math.abs(b.position[0] - x) < BASKET_HALF_W) return b.index;
    return null;
  };

  const wordNear = (x: number, y: number): boolean => {
    const w = useSortWordsStore.getState().currentWord;
    return !!w && w.state === 'waiting' && Math.hypot(WAIT_POINT[0] - x, WAIT_POINT[1] - y) < GRAB_RADIUS;
  };

  const release = (source: 'hand' | 'pointer') => {
    const st = useSortWordsStore.getState();
    if (st.grabSource !== source || st.currentWord?.state !== 'grabbed') return;
    const b = nearestBasket(st.cursor.x, st.cursor.y);
    if (b === null) st.releaseWord();
    else st.sortWord(b);
  };

  const handleSwipeReading = (x: number, y: number, t: number, open: boolean, detector: typeof swipe) => {
    const st = useSortWordsStore.getState();
    const r = detector.push(x, y, t, open);
    pushTrail(x, y, t);
    if (process.env.NODE_ENV === 'development' && t - lastDebug.current > 100) {
      lastDebug.current = t;
      st.setSwipeDebug({ speed: r.speed, angle: r.angle });
    }
    const canAct = st.currentWord?.state === 'waiting';
    st.setAimBasket(canAct && r.aim ? basketForDirection(r.aim) : null);
    if (canAct && r.swipe) st.sortWord(basketForDirection(r.swipe));
  };

  // ── Рука ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hand) return;
    const onFrame = (frame: HandFrame | null) => {
      const st = useSortWordsStore.getState();
      if (!frame) {
        if (wasPinching.current) release('hand');
        wasPinching.current = false;
        smoother.current.reset();
        swipe.reset();
        if (st.cursor.visible) st.setCursor({ visible: false, pinching: false, pinchStrength: 0 });
        st.setAimBasket(null);
        return;
      }
      // пока плашку тащат мышью или мышь зажата (свайп мышью) — рука не вмешивается
      if (st.grabSource === 'pointer' || pointerPressed.current) {
        wasPinching.current = frame.isPinching;
        return;
      }

      if (st.controlMode === 'swipe') {
        // центр ладони стабильнее кончика пальца при быстрых взмахах
        const p = projectLandmark(palmCenter(frame.landmarks));
        if (!p) return;
        const s = smoother.current.push({ x: p.x, y: p.y, z: p.z });
        st.setCursor({ x: s.x, y: s.y, z: s.z, visible: true, pinching: false, pinchStrength: 0 });
        handleSwipeReading(s.x, s.y, frame.timestamp, isPalmOpen(frame.landmarks), swipe);
        return;
      }

      const p = projectLandmark(frame.landmarks[8]);
      if (!p) return;
      const s = smoother.current.push({ x: p.x, y: p.y, z: p.z });
      st.setCursor({ x: s.x, y: s.y, z: s.z, visible: true, pinching: frame.isPinching, pinchStrength: frame.pinchStrength });

      if (frame.isPinching && !wasPinching.current) {
        if (wordNear(s.x, s.y)) st.grabWord('hand');
      } else if (!frame.isPinching && wasPinching.current) {
        release('hand');
      }
      wasPinching.current = frame.isPinching;
      st.setHoverBasket(st.currentWord?.state === 'grabbed' ? nearestBasket(s.x, s.y) : null);
    };
    return hand.subscribe(onFrame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hand, camera]);

  // ── Мышь / тач ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = gl.domElement;
    const onDown = (e: PointerEvent) => {
      pointerPressed.current = true;
      pointerSwipe.reset();
      const p = projectPointer(e.clientX, e.clientY);
      if (p) pointerSwipe.push(p.x, p.y, e.timeStamp, true);
    };
    const onMove = (e: PointerEvent) => {
      const st = useSortWordsStore.getState();
      if (st.grabSource === 'hand') return;
      const p = projectPointer(e.clientX, e.clientY);
      if (!p) return;
      const grabbing = st.grabSource === 'pointer';
      st.setCursor({ x: p.x, y: p.y, z: p.z, visible: grabbing });
      if (grabbing) {
        st.setHoverBasket(nearestBasket(p.x, p.y));
      } else if (pointerPressed.current && st.controlMode === 'swipe') {
        // свайп мышью: быстрое движение с зажатой кнопкой, «ладонь» всегда открыта.
        // Браузер склеивает pointermove до одного на кадр — берём все
        // промежуточные точки, иначе при низком fps окно детектора не заполняется.
        const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
        const list = events.length > 0 ? events : [e];
        for (const ev of list) {
          const q = projectPointer(ev.clientX, ev.clientY);
          if (q) handleSwipeReading(q.x, q.y, ev.timeStamp, true, pointerSwipe);
        }
      }
    };
    const onUp = () => {
      pointerPressed.current = false;
      release('pointer');
      useSortWordsStore.getState().setAimBasket(null);
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, camera]);
}
