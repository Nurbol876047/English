'use client';

import { useEffect, useRef } from 'react';
import { useWordOrderStore } from '@/store/wordOrderStore';
import { EmaSmoother3 } from '@/lib/hand/handGeometry';
import { useHandProjection } from '@/hooks/hand/useHandProjection';
import type { HandFrame, HandTracking } from '@/hooks/hand/useMediaPipeHands';

/** Радиус захвата плашки вокруг курсора (в мировых единицах) */
const GRAB_RADIUS = 0.9;
/** Радиус, в котором ячейка «принимает» плашку */
const SLOT_RADIUS = 1.0;

/**
 * Контроллер grab / move / release. Работает внутри <Canvas>, потому что
 * ему нужна камера сцены для проекции.
 *
 * Два источника ввода:
 *  - рука (кадры MediaPipe) — pinch = захват, разжатие = отпускание;
 *  - мышь/тач (fallback) — pointerdown на плашке (см. WordTile3D) = захват,
 *    pointerup где угодно = отпускание.
 */
export function usePinchDragController(hand: Pick<HandTracking, 'subscribe'> | null): void {
  // Проекция руки/мыши на плоскость взаимодействия z=0 — общий хук
  const { projectLandmark, projectPointer, camera, gl } = useHandProjection();
  const smoother = useRef(new EmaSmoother3(0.35));
  const wasPinching = useRef(false);

  const nearestTileId = (x: number, y: number): string | null => {
    const { tiles } = useWordOrderStore.getState();
    let best: string | null = null;
    let bestD = GRAB_RADIUS;
    for (const t of tiles) {
      if (t.state !== 'tray') continue;
      const d = Math.hypot(t.homePosition[0] - x, t.homePosition[1] - y);
      if (d < bestD) {
        bestD = d;
        best = t.id;
      }
    }
    return best;
  };

  const nearestSlotIndex = (x: number, y: number): number | null => {
    const { slots } = useWordOrderStore.getState();
    let best: number | null = null;
    let bestD = SLOT_RADIUS;
    for (const s of slots) {
      const d = Math.hypot(s.position[0] - x, s.position[1] - y);
      if (d < bestD) {
        bestD = d;
        best = s.index;
      }
    }
    return best;
  };

  const updateHover = (x: number, y: number) => {
    const st = useWordOrderStore.getState();
    st.setHoverSlot(st.grabbedTileId ? nearestSlotIndex(x, y) : null);
  };

  const release = (source: 'hand' | 'pointer') => {
    const st = useWordOrderStore.getState();
    if (!st.grabbedTileId || st.grabSource !== source) return;
    st.dropTile(st.grabbedTileId, nearestSlotIndex(st.cursor.x, st.cursor.y));
  };

  // ── Рука ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hand) return;
    const onFrame = (frame: HandFrame | null) => {
      const st = useWordOrderStore.getState();
      if (!frame) {
        if (wasPinching.current) release('hand');
        wasPinching.current = false;
        smoother.current.reset();
        if (st.cursor.visible) st.setCursor({ visible: false, pinching: false, pinchStrength: 0 });
        return;
      }

      // Кончик указательного пальца → плоскость сцены (зеркалирование и
      // NDC — внутри useHandProjection)
      const p = projectLandmark(frame.landmarks[8]);
      if (!p) return;
      const s = smoother.current.push({ x: p.x, y: p.y, z: p.z });

      // Пока плашку тащат мышью/тачем, рука курсор не двигает — иначе два
      // источника ввода дерутся за одну точку и плашка падает не туда.
      if (st.grabSource === 'pointer') {
        wasPinching.current = frame.isPinching;
        return;
      }

      st.setCursor({ x: s.x, y: s.y, z: s.z, visible: true, pinching: frame.isPinching, pinchStrength: frame.pinchStrength });

      // Фронт щипка → захват ближайшей плашки; спад → отпускание
      if (frame.isPinching && !wasPinching.current) {
        const id = nearestTileId(s.x, s.y);
        if (id) st.grabTile(id, 'hand');
      } else if (!frame.isPinching && wasPinching.current) {
        release('hand');
      }
      wasPinching.current = frame.isPinching;
      updateHover(s.x, s.y);
    };
    return hand.subscribe(onFrame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hand, camera]);

  // ── Мышь / тач (fallback) ───────────────────────────────────────────
  useEffect(() => {
    const el = gl.domElement;
    const onMove = (e: PointerEvent) => {
      const st = useWordOrderStore.getState();
      // пока рука ведёт курсор, мышь не вмешивается
      if (st.grabSource === 'hand') return;
      const p = projectPointer(e.clientX, e.clientY);
      if (!p) return;
      // 3D-кольцо в режиме мыши показываем только пока тащим плашку —
      // иначе на экране два курсора (системный и наш)
      st.setCursor({ x: p.x, y: p.y, z: p.z, visible: st.grabSource === 'pointer' });
      updateHover(p.x, p.y);
    };
    const onUp = () => release('pointer');
    el.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, camera]);
}
