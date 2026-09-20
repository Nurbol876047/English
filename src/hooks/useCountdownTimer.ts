'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type TimerFrameListener = (progress: number, remainingMs: number) => void;

interface Options {
  /** Срабатывает один раз, когда время вышло */
  onExpire?: () => void;
}

/**
 * Обратный отсчёт на requestAnimationFrame. Кадры не трогают React-state:
 * подписчики (`subscribe`) получают progress 0..1 напрямую — TimerBar
 * двигает transform без перерисовок. В state попадают только целые
 * секунды (`secondsLeft`). Пока вкладка скрыта (document.hidden) —
 * таймер стоит, и время «не утекает» в фоне.
 */
export function useCountdownTimer({ onExpire }: Options = {}) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);

  const frameRef = useRef<number | null>(null);
  const durationRef = useRef(0);
  const remainingRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const listeners = useRef(new Set<TimerFrameListener>());
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const emit = useCallback(() => {
    const progress = durationRef.current > 0 ? Math.max(0, remainingRef.current / durationRef.current) : 0;
    listeners.current.forEach((l) => l(progress, remainingRef.current));
    setSecondsLeft((prev) => {
      const next = Math.ceil(remainingRef.current / 1000);
      return next === prev ? prev : next;
    });
  }, []);

  const cancelFrame = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    lastTsRef.current = null;
  }, []);

  const stop = useCallback(() => {
    cancelFrame();
    setRunning(false);
  }, [cancelFrame]);

  // Кадр хранится в ref: сам себя планирует, поэтому не может быть обычной const в области рендера
  const tickRef = useRef<(ts: number) => void>(() => {});
  useEffect(() => {
    tickRef.current = (ts: number) => {
      frameRef.current = null;
      if (lastTsRef.current !== null) remainingRef.current -= ts - lastTsRef.current;
      lastTsRef.current = ts;
      if (remainingRef.current <= 0) {
        remainingRef.current = 0;
        emit();
        setRunning(false);
        onExpireRef.current?.();
        return;
      }
      emit();
      frameRef.current = requestAnimationFrame((t) => tickRef.current(t));
    };
  }, [emit]);

  const resume = useCallback(() => {
    if (frameRef.current !== null || remainingRef.current <= 0) return;
    lastTsRef.current = null;
    frameRef.current = requestAnimationFrame((t) => tickRef.current(t));
  }, []);

  const start = useCallback(
    (durationMs: number) => {
      cancelFrame();
      durationRef.current = durationMs;
      remainingRef.current = durationMs;
      setRunning(true);
      emit();
      if (!document.hidden) frameRef.current = requestAnimationFrame((t) => tickRef.current(t));
    },
    [cancelFrame, emit],
  );

  const subscribe = useCallback((listener: TimerFrameListener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  // Пауза в фоне: rAF там и так не идёт, но время между кадрами не должно засчитаться
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) cancelFrame();
      else if (remainingRef.current > 0 && durationRef.current > 0) resume();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [cancelFrame, resume]);

  useEffect(() => cancelFrame, [cancelFrame]);

  return { secondsLeft, running, start, stop, subscribe };
}
