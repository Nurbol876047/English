import type { SpeakingWord } from './words';

/** Расстояние Левенштейна — для терпимости к акценту и ошибкам распознавания */
export function levenshtein(a: string, b: string): number {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let left = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = Math.min(prev[j] + 1, left + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev[j - 1] = left;
      left = cur;
    }
    prev[b.length] = left;
  }
  return prev[b.length];
}

export function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9'\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Грубая «фонетическая» нормализация: как слово звучит, а не как пишется.
 * ph→f, ck/c/q→k, двойные буквы схлопываем, немая e на конце и т.п.
 * Так "mutha" ≈ "mother", "brekfast" ≈ "breakfast", "teef" ≈ "teeth".
 */
export function phonetic(word: string): string {
  return normalize(word)
    .replace(/\s+/g, '')
    .replace(/ph/g, 'f')
    .replace(/ck/g, 'k')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/[cq]/g, 'k')
    .replace(/x/g, 'ks')
    .replace(/wh/g, 'w')
    .replace(/gh/g, '')
    .replace(/th/g, 't')
    .replace(/sh/g, 's')
    .replace(/ough/g, 'o')
    .replace(/(.)\1+/g, '$1')
    .replace(/e$/g, '')
    .replace(/([aeiouy])[aeiouy]+/g, '$1'); // группы гласных схлопываем: "ee"/"ea"/"ai" звучат как одна
}

/** Похожесть 0..1 по Левенштейну */
function similarity(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

/** Лучшая похожесть цели с любым словом / парой / тройкой слов из транскрипта */
function bestMatch(transcript: string, target: string): number {
  const words = normalize(transcript).split(' ').filter(Boolean);
  const tNorm = normalize(target).replace(/\s+/g, '');
  const tPhon = phonetic(target);
  let best = 0;
  const consider = (chunk: string) => {
    best = Math.max(best, similarity(chunk.replace(/\s+/g, ''), tNorm), similarity(phonetic(chunk), tPhon));
  };
  consider(words.join(' '));
  for (let n = 1; n <= 3; n++) for (let i = 0; i + n <= words.length; i++) consider(words.slice(i, i + n).join(' '));
  return best;
}

export interface Evaluation {
  ok: boolean;
  /** 0..1 — насколько похоже на цель (для отладки/подсказки) */
  score: number;
}

/**
 * Мягкая проверка: засчитываем, если сказанное «по звучанию» достаточно похоже
 * на цель (или на то, как распознаватель обычно её слышит). Порог зависит от
 * длины слова — у коротких слов одна буква меняет смысл, у длинных нет.
 */
export function evaluate(transcript: string, entry: SpeakingWord): Evaluation {
  const candidates = [entry.word, ...(entry.aliases ?? [])];
  const score = Math.max(...candidates.map((c) => bestMatch(transcript, c)));
  // 1–2 неверные буквы — засчитываем; совсем другое слово — нет
  const len = normalize(entry.word).replace(/\s+/g, '').length;
  const threshold = len <= 3 ? 0.67 : len <= 7 ? 0.6 : 0.65;
  return { ok: score >= threshold, score };
}
