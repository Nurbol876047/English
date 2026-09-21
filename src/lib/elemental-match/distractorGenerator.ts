import { WORDS, type MatchWord } from './words';

export const OPTIONS_PER_ROUND = 3;

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Дистракторы к вопросу: сначала — из методички (у каждого вопроса их ровно
 * два, поэтому обычно этого хватает). Если вдруг меньше нужного — добираем
 * правильными ответами ДРУГИХ вопросов той же темы. Ничего не генерируем.
 */
export function pickDistractors(word: MatchWord, count = OPTIONS_PER_ROUND - 1, random: () => number = Math.random): string[] {
  const own = shuffle(word.distractors, random).slice(0, count);
  if (own.length >= count) return own;

  const taken = new Set([word.correctAnswer, ...own]);
  const sameTopic = WORDS.filter((w) => w.id !== word.id && w.topic === word.topic && !taken.has(w.correctAnswer));
  const anyTopic = WORDS.filter((w) => w.id !== word.id && !taken.has(w.correctAnswer));
  const pool = sameTopic.length >= count - own.length ? sameTopic : anyTopic;
  const extra = shuffle(pool, random)
    .map((w) => w.correctAnswer)
    .filter((a, i, arr) => arr.indexOf(a) === i)
    .slice(0, count - own.length);
  return [...own, ...extra];
}

export interface RoundOptions {
  options: string[];
  correctIndex: number;
}

/** 1 правильный + дистракторы в случайном порядке */
export function buildOptions(word: MatchWord, random: () => number = Math.random): RoundOptions {
  const options = shuffle([word.correctAnswer, ...pickDistractors(word, OPTIONS_PER_ROUND - 1, random)], random);
  return { options, correctIndex: options.indexOf(word.correctAnswer) };
}

/**
 * Выбор следующего вопроса: взвешенный случайный выбор — проваленные вопросы
 * выпадают чаще (лёгкий spaced repetition), но не сразу: последние
 * показанные исключаем, чтобы вопрос не вернулся в следующем же раунде.
 */
export function pickNextWord(
  failCounts: Readonly<Record<string, number>>,
  recentIds: readonly string[],
  random: () => number = Math.random,
): MatchWord {
  const cooldown = new Set(recentIds.slice(-3));
  let pool = WORDS.filter((w) => !cooldown.has(w.id));
  if (pool.length === 0) pool = [...WORDS];
  const weights = pool.map((w) => 1 + 2 * Math.min(failCounts[w.id] ?? 0, 3));
  let r = random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}
