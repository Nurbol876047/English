/**
 * Банк предложений для упражнения «Word Order» — 4 класс, пять тем из
 * методички. Каждое предложение — это верный ответ на соответствующее
 * задание «Choose the correct answer», ученик собирает его из слов.
 * Слова хранятся уже разбитыми — так пунктуация остаётся «приклеенной»
 * к нужному слову (например, "day." или "I"), и проверка порядка
 * работает посимвольно.
 */

export type GrammarTopic = 'Present Simple' | 'My Daily Routine' | 'Days of the Week' | 'My Family and Friends' | 'Food';

export interface Sentence {
  id: string;
  topic: GrammarTopic;
  words: readonly string[];
  /** Подсказка в HUD — перевод предложения на казахский */
  hint: string;
}

export const SENTENCES: readonly Sentence[] = [
  // ── 1. Present Simple ──
  { id: 'ps-1', topic: 'Present Simple', words: ['I', 'go', 'to', 'school', 'every', 'day.'], hint: 'Мен күнде мектепке барамын.' },
  { id: 'ps-2', topic: 'Present Simple', words: ['She', 'studies', 'English', 'at', 'school.'], hint: 'Ол мектепте ағылшын тілін оқиды.' },
  { id: 'ps-3', topic: 'Present Simple', words: ['They', 'play', 'football', 'after', 'school.'], hint: 'Олар мектептен кейін футбол ойнайды.' },
  { id: 'ps-4', topic: 'Present Simple', words: ['He', 'drinks', 'milk', 'every', 'morning.'], hint: 'Ол күнде таңертең сүт ішеді.' },
  { id: 'ps-5', topic: 'Present Simple', words: ['We', 'watch', 'TV', 'in', 'the', 'evening.'], hint: 'Біз кешке теледидар көреміз.' },

  // ── 2. My Daily Routine ──
  { id: 'dr-1', topic: 'My Daily Routine', words: ['I', 'get', 'up', 'at', '7', 'o’clock.'], hint: 'Мен сағат жетіде тұрамын.' },
  { id: 'dr-2', topic: 'My Daily Routine', words: ['I', 'brush', 'my', 'teeth.'], hint: 'Мен тісімді тазалаймын.' },
  { id: 'dr-3', topic: 'My Daily Routine', words: ['I', 'have', 'breakfast', 'in', 'the', 'morning.'], hint: 'Мен таңертең таңғы ас ішемін.' },
  { id: 'dr-4', topic: 'My Daily Routine', words: ['I', 'go', 'to', 'school', 'at', 'seven', 'o’clock.'], hint: 'Мен сағат жетіде мектепке барамын.' },
  { id: 'dr-5', topic: 'My Daily Routine', words: ['I', 'go', 'to', 'bed', 'in', 'the', 'evening.'], hint: 'Мен кешке ұйықтауға жатамын.' },

  // ── 3. Days of the Week ──
  { id: 'dw-1', topic: 'Days of the Week', words: ['Tuesday', 'comes', 'after', 'Monday.'], hint: 'Сейсенбі дүйсенбіден кейін келеді.' },
  { id: 'dw-2', topic: 'Days of the Week', words: ['Thursday', 'comes', 'after', 'Wednesday.'], hint: 'Бейсенбі сәрсенбіден кейін келеді.' },
  { id: 'dw-3', topic: 'Days of the Week', words: ['Thursday', 'comes', 'before', 'Friday.'], hint: 'Бейсенбі жұмадан бұрын келеді.' },
  { id: 'dw-4', topic: 'Days of the Week', words: ['Monday', 'is', 'the', 'first', 'day.'], hint: 'Дүйсенбі — бірінші күн.' },
  { id: 'dw-5', topic: 'Days of the Week', words: ['Sunday', 'comes', 'after', 'Saturday.'], hint: 'Жексенбі сенбіден кейін келеді.' },

  // ── 4. My Family and Friends ──
  { id: 'ff-1', topic: 'My Family and Friends', words: ['My', 'mother’s', 'daughter', 'is', 'my', 'sister.'], hint: 'Анамның қызы — менің әпкем.' },
  { id: 'ff-2', topic: 'My Family and Friends', words: ['My', 'father’s', 'son', 'is', 'my', 'brother.'], hint: 'Әкемнің ұлы — менің ағам.' },
  { id: 'ff-3', topic: 'My Family and Friends', words: ['My', 'mother’s', 'husband', 'is', 'my', 'father.'], hint: 'Анамның күйеуі — менің әкем.' },
  { id: 'ff-4', topic: 'My Family and Friends', words: ['My', 'father’s', 'mother', 'is', 'my', 'grandmother.'], hint: 'Әкемнің анасы — менің әжем.' },
  { id: 'ff-5', topic: 'My Family and Friends', words: ['I', 'play', 'with', 'my', 'friend.'], hint: 'Мен досыммен ойнаймын.' },

  // ── 5. Food ──
  { id: 'fd-1', topic: 'Food', words: ['I', 'like', 'pizza.'], hint: 'Маған пицца ұнайды.' },
  { id: 'fd-2', topic: 'Food', words: ['We', 'drink', 'milk.'], hint: 'Біз сүт ішеміз.' },
  { id: 'fd-3', topic: 'Food', words: ['An', 'apple', 'is', 'a', 'fruit.'], hint: 'Алма — жеміс.' },
  { id: 'fd-4', topic: 'Food', words: ['A', 'carrot', 'is', 'a', 'vegetable.'], hint: 'Сәбіз — көкөніс.' },
  { id: 'fd-5', topic: 'Food', words: ['We', 'eat', 'soup', 'with', 'a', 'spoon.'], hint: 'Біз сорпаны қасықпен ішеміз.' },
];

/** Все темы в банке (для счётчика «X/Y тем освоено») */
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
