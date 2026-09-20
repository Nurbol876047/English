import { WORDS, type MatchWord } from './words';

export const OPTIONS_PER_ROUND = 4;

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Дистракторы к слову: сначала — вручную проверенные из банка (они похожи
 * по смыслу/форме и заведомо не синонимы). Если их меньше нужного —
 * добираем правильными ответами ДРУГИХ слов того же уровня: это реальные
 * значения других слов, поэтому семантически с целью они не совпадают.
 * Ничего не генерируем автоматически.
 */
export function pickDistractors(word: MatchWord, count = OPTIONS_PER_ROUND - 1, random: () => number = Math.random): string[] {
  const own = shuffle(word.distractors, random).slice(0, count);
  if (own.length >= count) return own;

  const taken = new Set([word.correctAnswer, ...own]);
  const sameLevel = WORDS.filter((w) => w.id !== word.id && w.level === word.level && !taken.has(w.correctAnswer));
  const anyLevel = WORDS.filter((w) => w.id !== word.id && !taken.has(w.correctAnswer));
  const pool = sameLevel.length >= count - own.length ? sameLevel : anyLevel;
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
 * Выбор следующего слова: взвешенный случайный выбор — проваленные слова
 * выпадают чаще (лёгкий spaced repetition), но не сразу: последние
 * показанные исключаем, чтобы слово не вернулось в следующем же раунде.
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
