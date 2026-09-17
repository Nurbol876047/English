'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useWordOrderStore, type ExerciseResult } from '@/store/wordOrderStore';
import { playChime, playError, playSuccess } from '@/lib/hand/audio';

export type ExerciseCompleteHandler = (result: ExerciseResult) => void;

/** Пауза после собранного предложения перед следующим раундом */
const NEXT_ROUND_DELAY_MS = 1800;
/** Сколько плашка «трясётся» после ошибки, прежде чем вернуться в лоток */
const ERROR_SHAKE_MS = 550;

/**
 * Жизненный цикл упражнения: старт раунда, звуки и таймеры на события
 * стора, переход к следующему предложению, колбэк интеграции с платформой.
 * Сама проверка порядка живёт в сторе (dropTile) — она нужна и 3D-сцене,
 * и мобильному 2D-режиму.
 */
export function useSentenceExercise(onExerciseComplete?: ExerciseCompleteHandler) {
  const sentence = useWordOrderStore((s) => s.sentence);
  const roundState = useWordOrderStore((s) => s.roundState);
  const streak = useWordOrderStore((s) => s.streak);
  const masteredCount = useWordOrderStore((s) => s.masteredTopics.length);
  const totalTopics = useWordOrderStore((s) => s.totalTopics);
  const startRound = useWordOrderStore((s) => s.startRound);
  const onCompleteRef = useRef(onExerciseComplete);
  useEffect(() => {
    onCompleteRef.current = onExerciseComplete;
  }, [onExerciseComplete]);

  // первый раунд
  useEffect(() => {
    if (useWordOrderStore.getState().roundState === 'idle') startRound();
  }, [startRound]);

  // звук + сброс «тряски» по результату броска
  useEffect(
    () =>
      useWordOrderStore.subscribe((s, prev) => {
        if (s.feedback && s.feedback !== prev.feedback) {
          if (s.feedback.kind === 'correct') playChime();
          else if (s.feedback.kind === 'complete') playSuccess();
          else if (s.feedback.kind === 'wrong') playError();
        }
        const errored = s.tiles.filter((t) => t.state === 'error' && prev.tiles.find((p) => p.id === t.id)?.state !== 'error');
        errored.forEach((t) => setTimeout(() => useWordOrderStore.getState().clearTileError(t.id), ERROR_SHAKE_MS));
      }),
    [],
  );

  // завершение раунда → колбэк платформы → следующий раунд
  useEffect(() => {
    if (roundState !== 'complete') return;
    const result = useWordOrderStore.getState().getRoundResult();
    if (result) onCompleteRef.current?.(result);
    const t = setTimeout(() => startRound(), NEXT_ROUND_DELAY_MS);
    return () => clearTimeout(t);
  }, [roundState, startRound]);

  const skip = useCallback(() => startRound(), [startRound]);

  return { sentence, roundState, streak, masteredCount, totalTopics, skip };
}
