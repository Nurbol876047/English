'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSortWordsStore, type SortRoundResult } from '@/store/sortWordsStore';
import { playChime, playError, playSuccess } from '@/lib/hand/audio';

export type SortCompleteHandler = (result: SortRoundResult) => void;

/** Пауза между решением и вылетом следующего слова */
const NEXT_WORD_DELAY_MS = 350;
/** Сколько длится отскок после ошибки */
const REJECT_MS = 550;
/** Шаг обновления таймера в HUD */
const TICK_MS = 250;

/**
 * Жизненный цикл раунда: старт, очередь слов, таймер, звуки, завершение,
 * колбэк интеграции. Логика проверки — в сторе (sortWord), она же
 * используется мобильным 2D-режимом.
 */
export function useSortExercise(onExerciseComplete?: SortCompleteHandler) {
  const activeSet = useSortWordsStore((s) => s.activeSet);
  const roundState = useSortWordsStore((s) => s.roundState);
  const score = useSortWordsStore((s) => s.score);
  const streak = useSortWordsStore((s) => s.streak);
  const timeLeftMs = useSortWordsStore((s) => s.timeLeftMs);
  const correctCount = useSortWordsStore((s) => s.correctCount);
  const wrongCount = useSortWordsStore((s) => s.wrongCount);
  const totalWords = useSortWordsStore((s) => s.totalWords);
  const masteredCount = useSortWordsStore((s) => s.masteredSets.length);
  const lastResult = useSortWordsStore((s) => s.lastResult);
  const startRound = useSortWordsStore((s) => s.startRound);
  const onCompleteRef = useRef(onExerciseComplete);

  useEffect(() => {
    onCompleteRef.current = onExerciseComplete;
  }, [onExerciseComplete]);

  // первый раунд
  useEffect(() => {
    if (useSortWordsStore.getState().roundState === 'idle') startRound();
  }, [startRound]);

  // таймер
  useEffect(() => {
    if (roundState !== 'playing') return;
    const id = setInterval(() => useSortWordsStore.getState().tick(performance.now()), TICK_MS);
    return () => clearInterval(id);
  }, [roundState]);

  // реакции на события стора: звуки, отскок, следующее слово
  useEffect(
    () =>
      useSortWordsStore.subscribe((s, prev) => {
        if (s.feedback && s.feedback !== prev.feedback) {
          if (s.feedback.kind === 'correct') playChime();
          else if (s.feedback.kind === 'wrong') playError();
        }
        const w = s.currentWord;
        if (w?.state === 'rejected' && prev.currentWord?.state !== 'rejected') {
          setTimeout(() => useSortWordsStore.getState().onRejectEnd(), REJECT_MS);
        }
        // слово улетело → через паузу вылетает следующее
        if (w === null && prev.currentWord !== null && s.roundState === 'playing') {
          setTimeout(() => useSortWordsStore.getState().spawnNext(), NEXT_WORD_DELAY_MS);
        }
      }),
    [],
  );

  // завершение раунда → колбэк платформы
  useEffect(() => {
    if (roundState !== 'finished' || !lastResult) return;
    if (lastResult.passed) playSuccess();
    onCompleteRef.current?.(lastResult);
  }, [roundState, lastResult]);

  const restart = useCallback(() => startRound(useSortWordsStore.getState().activeSet?.id), [startRound]);
  const nextSet = useCallback(() => startRound(), [startRound]);

  return { activeSet, roundState, score, streak, timeLeftMs, correctCount, wrongCount, totalWords, masteredCount, lastResult, restart, nextSet };
}
