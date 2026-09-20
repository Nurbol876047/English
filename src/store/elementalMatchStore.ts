import { create } from 'zustand';

/** Сколько верных ответов подряд по слову, чтобы считать его освоенным */
export const MASTERY_STREAK = 2;

interface ElementalMatchState {
  streak: number;
  bestStreak: number;
  roundsPlayed: number;
  correctCount: number;
  masteredWords: string[];
  /** Сколько раз слово провалено — для приоритета в выборе следующего */
  failCounts: Record<string, number>;
  /** Верных подряд по каждому слову — для masteredWords */
  wordStreaks: Record<string, number>;
  recordAnswer: (wordId: string, correct: boolean) => void;
  /** Новая сессия: счётчики раунда в ноль, прогресс по словам остаётся */
  resetSession: () => void;
}

export const useElementalMatchStore = create<ElementalMatchState>((set) => ({
  streak: 0,
  bestStreak: 0,
  roundsPlayed: 0,
  correctCount: 0,
  masteredWords: [],
  failCounts: {},
  wordStreaks: {},

  recordAnswer: (wordId, correct) =>
    set((s) => {
      const streak = correct ? s.streak + 1 : 0;
      const wordStreak = correct ? (s.wordStreaks[wordId] ?? 0) + 1 : 0;
      const mastered =
        wordStreak >= MASTERY_STREAK && !s.masteredWords.includes(wordId) ? [...s.masteredWords, wordId] : s.masteredWords;
      return {
        streak,
        bestStreak: Math.max(s.bestStreak, streak),
        roundsPlayed: s.roundsPlayed + 1,
        correctCount: s.correctCount + (correct ? 1 : 0),
        masteredWords: correct ? mastered : mastered.filter((id) => id !== wordId),
        // Верный ответ снижает приоритет слова, неверный — повышает
        failCounts: { ...s.failCounts, [wordId]: correct ? Math.max(0, (s.failCounts[wordId] ?? 0) - 1) : (s.failCounts[wordId] ?? 0) + 1 },
        wordStreaks: { ...s.wordStreaks, [wordId]: wordStreak },
      };
    }),

  resetSession: () => set({ streak: 0, roundsPlayed: 0, correctCount: 0 }),
}));
