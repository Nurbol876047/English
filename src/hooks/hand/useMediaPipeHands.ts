'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Hands, Results } from '@mediapipe/hands';
import {
  EmaSmoother3,
  PinchDetector,
  isFullHand,
  pinchRatio,
  pinchStrengthFromRatio,
  type HandLandmarks,
  type Handedness,
} from '@/lib/hand/handGeometry';

/** Один обработанный кадр руки */
export interface HandFrame {
  landmarks: HandLandmarks;
  handedness: Handedness;
  isPinching: boolean;
  pinchStrength: number;
  timestamp: number;
}

export type HandTrackingStatus = 'idle' | 'loading' | 'tracking' | 'no-hand' | 'unavailable';

export type HandFrameListener = (frame: HandFrame | null) => void;

export interface HandTracking {
  status: HandTrackingStatus;
  error: string | null;
  /** Последний кадр — читать из rAF-циклов без ре-рендера React */
  frameRef: React.RefObject<HandFrame | null>;
  /** Подписка на каждый обработанный кадр (null — рука потеряна) */
  subscribe: (listener: HandFrameListener) => () => void;
  /** <video>, куда выводится камера — нужен оверлею */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  start: () => void;
  stop: () => void;
}

const MP_VERSION = '0.4.1675469240';
const MP_CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${MP_VERSION}`;
/** Ограничиваем детекцию ~22 fps: этого хватает для плавного UX, а CPU экономится вдвое */
const TARGET_FPS = 22;

type HandsCtor = new (config: { locateFile: (file: string) => string }) => Hands;

/**
 * Загрузка конструктора Hands. Сначала пробуем npm-пакет через динамический
 * import (не попадает в SSR-бандл и не блокирует первую отрисовку). Пакет
 * собран как UMD, и в некоторых сборках `Hands` из него приходит undefined —
 * тогда подгружаем тот же скрипт с CDN и берём window.Hands.
 */
async function loadHandsCtor(): Promise<HandsCtor> {
  const w = window as unknown as { Hands?: HandsCtor };
  try {
    const mod = await import('@mediapipe/hands');
    const ctor = (mod as unknown as { Hands?: HandsCtor }).Hands ?? w.Hands;
    if (ctor) return ctor;
  } catch {
    /* падаем в CDN-fallback */
  }
  if (w.Hands) return w.Hands;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${MP_CDN}/hands.js`;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Не удалось загрузить MediaPipe Hands с CDN'));
    document.head.appendChild(script);
  });
  if (!w.Hands) throw new Error('MediaPipe Hands не инициализировался');
  return w.Hands;
}

export function useMediaPipeHands(autoStart = true): HandTracking {
  const [status, setStatus] = useState<HandTrackingStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameRef = useRef<HandFrame | null>(null);
  const listeners = useRef(new Set<HandFrameListener>());
  const handsRef = useRef<Hands | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);
  /** Номер сессии запуска: React StrictMode в dev вызывает start→stop→start,
   *  и первый (уже отменённый) запуск не должен перехватывать <video> */
  const sessionRef = useRef(0);
  const pinch = useRef(new PinchDetector());
  const smoother = useRef(new EmaSmoother3(0.5));

  const subscribe = useCallback((listener: HandFrameListener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const emit = useCallback((frame: HandFrame | null) => {
    frameRef.current = frame;
    listeners.current.forEach((l) => l(frame));
  }, []);

  const onResults = useCallback(
    (results: Results) => {
      const raw = results.multiHandLandmarks?.[0];
      if (!raw || !isFullHand(raw)) {
        pinch.current.reset();
        smoother.current.reset();
        setStatus((s) => (s === 'tracking' ? 'no-hand' : s));
        emit(null);
        return;
      }
      // Сглаживаем только кончик указательного пальца (им управляем курсором);
      // остальные точки идут в оверлей как есть.
      const tip = smoother.current.push(raw[8]);
      const landmarks = raw.map((p, i) => (i === 8 ? { x: tip.x, y: tip.y, z: tip.z } : p)) as unknown as HandLandmarks;
      const ratio = pinchRatio(landmarks);
      const handednessLabel = results.multiHandedness?.[0]?.label ?? 'Right';
      setStatus('tracking');
      emit({
        landmarks,
        handedness: handednessLabel,
        isPinching: pinch.current.update(ratio),
        pinchStrength: pinchStrengthFromRatio(ratio),
        timestamp: performance.now(),
      });
    },
    [emit],
  );

  const stop = useCallback(() => {
    runningRef.current = false;
    sessionRef.current++;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    handsRef.current?.close().catch(() => undefined);
    handsRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    emit(null);
    setStatus('idle');
  }, [emit]);

  const start = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    const session = ++sessionRef.current;
    const alive = () => runningRef.current && sessionRef.current === session;
    setStatus('loading');
    setError(null);

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Браузер не поддерживает доступ к камере');
      }
      const video = videoRef.current;
      if (!video) throw new Error('Video element не смонтирован');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (!alive()) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      if (!alive()) return;

      const HandsCtor = await loadHandsCtor();
      if (!alive()) return;
      const hands = new HandsCtor({ locateFile: (file) => `${MP_CDN}/${file}` });
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
        // selfieMode выключен: зеркалим координаты сами при маппинге в сцену
        selfieMode: false,
      });
      hands.onResults(onResults);
      handsRef.current = hands;
      // Первый send прогревает WASM/модель (может занять 1–3 с)
      await hands.send({ image: video });
      if (!alive()) return;
      setStatus('no-hand');

      // Отдельный rAF-цикл, не связанный с useFrame сцены: детекция руки
      // тяжёлая, и её ритм не должен зависеть от рендера Three.js.
      let last = 0;
      let busy = false;
      const interval = 1000 / TARGET_FPS;
      const loop = (now: number) => {
        if (!alive()) return;
        rafRef.current = requestAnimationFrame(loop);
        if (busy || now - last < interval || video.readyState < 2) return;
        last = now;
        busy = true;
        hands
          .send({ image: video })
          .catch(() => undefined)
          .finally(() => {
            busy = false;
          });
      };
      rafRef.current = requestAnimationFrame(loop);
    })().catch((e: unknown) => {
      if (!alive()) return; // отменённая сессия — не показываем её ошибки
      const msg = e instanceof Error ? e.message : String(e);
      const denied = /NotAllowed|Permission|denied/i.test(msg);
      setError(denied ? 'Доступ к камере отклонён — используйте мышь или тач' : msg);
      setStatus('unavailable');
      runningRef.current = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    });
  }, [onResults]);

  useEffect(() => {
    if (autoStart) start();
    return stop;
  }, [autoStart, start, stop]);

  return { status, error, frameRef, subscribe, videoRef, start, stop };
}
