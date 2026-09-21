'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { buildOptions, pickNextWord } from '@/lib/elemental-match/distractorGenerator';
import type { MatchWord } from '@/lib/elemental-match/words';
import { useElementalMatchStore } from '@/store/elementalMatchStore';
import { useCountdownTimer } from './useCountdownTimer';

/** Время на ответ — надо успеть прочитать предложение */
export const TIMER_DURATION_MS = 15000;
/** Раундов в одной сессии */
export const ROUNDS_PER_SESSION = 10;
/** Сколько показывать результат раунда перед следующим */
export const FEEDBACK_MS = 900;

export type GamePhase = 'question' | 'feedback' | 'summary';

export interface Round {
  index: number;
  word: MatchWord;
  options: string[];
  correctIndex: number;
}

export interface RoundOutcome {
  correct: boolean;
  timedOut: boolean;
  selectedIndex: number | null;
}

export interface ElementalMatchResult {
  correctCount: number;
  totalRounds: number;
  bestStreak: number;
  masteredWordIds: string[];
}

export type ExerciseCompleteHandler = (result: ElementalMatchResult) => void;

/**
 * Вся логика раунда: слово → варианты → таймер → ответ/тайм-аут →
 * короткий фидбек → следующий раунд; после ROUNDS_PER_SESSION — итоги.
 */
export function useElementalMatchGame(onExerciseComplete?: ExerciseCompleteHandler) {
  const recordAnswer = useElementalMatchStore((s) => s.recordAnswer);
  const resetSession = useElementalMatchStore((s) => s.resetSession);

  const [phase, setPhase] = useState<GamePhase>('question');
  const [round, setRound] = useState<Round>(() => makeRound(0, []));
  const [outcome, setOutcome] = useState<RoundOutcome | null>(null);

  const recentIds = useRef<string[]>([round.word.id]);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onExerciseComplete);
  useEffect(() => {
    onCompleteRef.current = onExerciseComplete;
  }, [onExerciseComplete]);

  const finishRound = useCallback(
    (selectedIndex: number | null, timedOut: boolean) => {
      const correct = selectedIndex === round.correctIndex;
      recordAnswer(round.word.id, correct);
      setOutcome({ correct, timedOut, selectedIndex });
      setPhase('feedback');
    },
    [recordAnswer, round],
  );

  const timer = useCountdownTimer({ onExpire: () => finishRound(null, true) });
  const timerStart = timer.start;
  const timerStop = timer.stop;

  // Каждый новый вопрос — запуск таймера
  useEffect(() => {
    if (phase !== 'question') return;
    timerStart(TIMER_DURATION_MS);
    return timerStop;
  }, [phase, round.index, timerStart, timerStop]);

  // Фидбек показываем FEEDBACK_MS, затем следующий раунд или итоги
  useEffect(() => {
    if (phase !== 'feedback') return;
    feedbackTimer.current = setTimeout(() => {
      feedbackTimer.current = null;
      const nextIndex = round.index + 1;
      if (nextIndex >= ROUNDS_PER_SESSION) {
        const s = useElementalMatchStore.getState();
        onCompleteRef.current?.({
          correctCount: s.correctCount,
          totalRounds: ROUNDS_PER_SESSION,
          bestStreak: s.bestStreak,
          masteredWordIds: [...s.masteredWords],
        });
        setPhase('summary');
        return;
      }
      const next = makeRound(nextIndex, recentIds.current);
      recentIds.current = [...recentIds.current, next.word.id].slice(-5);
      setOutcome(null);
      setRound(next);
      setPhase('question');
    }, FEEDBACK_MS);
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      feedbackTimer.current = null;
    };
  }, [phase, round.index]);

  const answer = useCallback(
    (index: number) => {
      if (phase !== 'question') return;
      timerStop();
      finishRound(index, false);
    },
    [phase, timerStop, finishRound],
  );

  const playAgain = useCallback(() => {
    resetSession();
    const first = makeRound(0, recentIds.current);
    recentIds.current = [...recentIds.current, first.word.id].slice(-5);
    setOutcome(null);
    setRound(first);
    setPhase('question');
  }, [resetSession]);

  return {
    phase,
    round,
    outcome,
    answer,
    playAgain,
    secondsLeft: timer.secondsLeft,
    subscribeTimer: timer.subscribe,
    totalRounds: ROUNDS_PER_SESSION,
  };
}

function makeRound(index: number, recentIds: readonly string[]): Round {
  const failCounts = useElementalMatchStore.getState().failCounts;
  const word = pickNextWord(failCounts, recentIds);
  const { options, correctIndex } = buildOptions(word);
  return { index, word, options, correctIndex };
}
