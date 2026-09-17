/**
 * Банк предложений для упражнения «Word Order».
 * Слова хранятся уже разбитыми — так пунктуация остаётся «приклеенной»
 * к нужному слову (например, "tomorrow." или "Have"), и проверка порядка
 * работает посимвольно.
 */

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2';

export type GrammarTopic =
  | 'present simple'
  | 'present continuous'
  | 'past simple'
  | 'present perfect'
  | 'future simple'
  | 'modal verbs'
  | 'questions'
  | 'conditionals'
  | 'passive voice'
  | 'reported speech'
  | 'comparatives';

export interface Sentence {
  id: string;
  level: CefrLevel;
  topic: GrammarTopic;
  words: readonly string[];
  /** Перевод — подсказка в HUD */
  translation: string;
}

export const SENTENCES: readonly Sentence[] = [
  // Все предложения — по вселенной «Аватар: Легенда об Аанге»: стихии, маги, Аппа, Момо,
  // Храм Воздуха, Народ Огня. Грамматические темы и уровни — как в обычном курсе.

  // ── A1 ───────────────────────────────────────────────────────────────
  { id: 'a1-01', level: 'A1', topic: 'present simple', words: ['Aang', 'loves', 'his', 'sky', 'bison.'], translation: 'Аанг любит своего небесного бизона.' },
  { id: 'a1-02', level: 'A1', topic: 'present simple', words: ['Katara', 'bends', 'water', 'every', 'day.'], translation: 'Катара покоряет воду каждый день.' },
  { id: 'a1-03', level: 'A1', topic: 'present continuous', words: ['Appa', 'is', 'flying', 'over', 'the', 'sea.'], translation: 'Аппа летит над морем.' },
  { id: 'a1-04', level: 'A1', topic: 'questions', words: ['Where', 'is', 'the', 'Avatar?'], translation: 'Где Аватар?' },
  { id: 'a1-05', level: 'A1', topic: 'modal verbs', words: ['Can', 'Toph', 'see', 'with', 'her', 'feet?'], translation: 'Тоф может видеть ногами?' },
  { id: 'a1-06', level: 'A1', topic: 'present simple', words: ['Momo', 'eats', 'a', 'moon', 'peach.'], translation: 'Момо ест лунный персик.' },

  // ── A2 ───────────────────────────────────────────────────────────────
  { id: 'a2-01', level: 'A2', topic: 'past simple', words: ['Zuko', 'chased', 'the', 'Avatar', 'last', 'winter.'], translation: 'Зуко преследовал Аватара прошлой зимой.' },
  { id: 'a2-02', level: 'A2', topic: 'future simple', words: ['Aang', 'will', 'master', 'all', 'four', 'elements.'], translation: 'Аанг овладеет всеми четырьмя стихиями.' },
  { id: 'a2-03', level: 'A2', topic: 'comparatives', words: ['Appa', 'is', 'bigger', 'than', 'Momo.'], translation: 'Аппа больше, чем Момо.' },
  { id: 'a2-04', level: 'A2', topic: 'questions', words: ['When', 'does', 'the', 'Fire', 'Nation', 'attack?'], translation: 'Когда нападает Народ Огня?' },
  { id: 'a2-05', level: 'A2', topic: 'modal verbs', words: ['You', 'should', 'drink', 'some', 'jasmine', 'tea.'], translation: 'Тебе стоит выпить жасминового чая.' },

  // ── B1 ───────────────────────────────────────────────────────────────
  { id: 'b1-01', level: 'B1', topic: 'present perfect', words: ['Aang', 'has', 'never', 'been', 'to', 'Ba', 'Sing', 'Se.'], translation: 'Аанг никогда не был в Ба Синг Се.' },
  { id: 'b1-02', level: 'B1', topic: 'present perfect', words: ['Katara', 'has', 'just', 'healed', 'his', 'wound.'], translation: 'Катара только что исцелила его рану.' },
  { id: 'b1-03', level: 'B1', topic: 'conditionals', words: ['If', 'Aang', 'fails,', 'the', 'world', 'will', 'burn.'], translation: 'Если Аанг потерпит неудачу, мир сгорит.' },
  { id: 'b1-04', level: 'B1', topic: 'passive voice', words: ['The', 'temple', 'was', 'destroyed', 'by', 'the', 'Fire', 'Nation.'], translation: 'Храм был разрушен Народом Огня.' },
  { id: 'b1-05', level: 'B1', topic: 'reported speech', words: ['Iroh', 'said', 'that', 'tea', 'was', 'important.'], translation: 'Айро сказал, что чай — это важно.' },

  // ── B2 ───────────────────────────────────────────────────────────────
  { id: 'b2-01', level: 'B2', topic: 'conditionals', words: ['If', 'Zuko', 'had', 'listened,', 'he', 'would', 'have', 'stayed.'], translation: 'Если бы Зуко послушал, он бы остался.' },
  { id: 'b2-02', level: 'B2', topic: 'passive voice', words: ['The', 'city', 'is', 'being', 'defended', 'by', 'earthbenders.'], translation: 'Город защищают маги земли.' },
  { id: 'b2-03', level: 'B2', topic: 'reported speech', words: ['She', 'asked', 'me', 'where', 'the', 'Avatar', 'was.'], translation: 'Она спросила меня, где Аватар.' },
  { id: 'b2-04', level: 'B2', topic: 'present perfect', words: ['They', 'have', 'been', 'training', 'since', 'sunrise.'], translation: 'Они тренируются с рассвета.' },
  { id: 'b2-05', level: 'B2', topic: 'comparatives', words: ['The', 'stronger', 'the', 'bender,', 'the', 'calmer', 'the', 'mind.'], translation: 'Чем сильнее маг, тем спокойнее разум.' },
];

/** Все грамматические темы в банке (для счётчика «X/Y тем освоено») */
export const ALL_TOPICS: readonly GrammarTopic[] = Array.from(
  new Set(SENTENCES.map((s) => s.topic)),
);

/** Сколько правильных предложений подряд нужно, чтобы тема считалась освоенной */
export const MASTERY_THRESHOLD = 3;

/** Случайное предложение, не совпадающее с предыдущим */
export function pickRandomSentence(excludeId?: string): Sentence {
  const pool = SENTENCES.filter((s) => s.id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Перемешать слова так, чтобы порядок гарантированно отличался от исходного */
export function shuffleWords(words: readonly string[]): string[] {
  if (words.length < 2) return [...words];
  const result = [...words];
  let attempts = 0;
  do {
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    attempts++;
  } while (attempts < 10 && result.every((w, i) => w === words[i]));
  return result;
}
