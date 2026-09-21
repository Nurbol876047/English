/**
 * Банк вопросов для «Elemental Match» — quiz «Choose the correct answer»
 * для 4 класса. Пять тем + смешанный тест; в каждом вопросе — предложение
 * с пропуском (или простой вопрос), один верный ответ и два неверных.
 * Вопросы и варианты — ровно как в методичке, ничего не генерируем.
 */

export type Topic = 'Present Simple' | 'My Daily Routine' | 'Days of the Week' | 'My Family and Friends' | 'Food' | 'Mixed Test';

export interface MatchWord {
  id: string;
  /** Текст задания: предложение с пропуском «___» или вопрос */
  word: string;
  correctAnswer: string;
  /** Ровно два неверных варианта — из методички */
  distractors: readonly string[];
  topic: Topic;
}

const q = (id: string, topic: Topic, word: string, correctAnswer: string, ...distractors: string[]): MatchWord => ({
  id,
  topic,
  word,
  correctAnswer,
  distractors,
});

export const WORDS: readonly MatchWord[] = [
  // ── 1. Present Simple ──
  q('ps-1', 'Present Simple', 'I ___ to school every day.', 'go', 'goes', 'going'),
  q('ps-2', 'Present Simple', 'She ___ English at school.', 'studies', 'study', 'studying'),
  q('ps-3', 'Present Simple', 'They ___ football after school.', 'play', 'plays', 'playing'),
  q('ps-4', 'Present Simple', 'He ___ milk every morning.', 'drinks', 'drink', 'drinking'),
  q('ps-5', 'Present Simple', 'We ___ TV in the evening.', 'watch', 'watches', 'watching'),

  // ── 2. My Daily Routine ──
  q('dr-1', 'My Daily Routine', 'I ___ up at 7 o’clock.', 'get', 'gets', 'getting'),
  q('dr-2', 'My Daily Routine', 'I brush my ___.', 'teeth', 'school', 'breakfast'),
  q('dr-3', 'My Daily Routine', 'I have breakfast in the ___.', 'morning', 'night', 'afternoon'),
  q('dr-4', 'My Daily Routine', 'I go to school at ___ o’clock.', 'seven', 'twelve', 'ten'),
  q('dr-5', 'My Daily Routine', 'I go to bed in the ___.', 'evening', 'morning', 'afternoon'),

  // ── 3. Days of the Week ──
  q('dw-1', 'Days of the Week', 'What day comes after Monday?', 'Tuesday', 'Sunday', 'Friday'),
  q('dw-2', 'Days of the Week', 'What day comes after Wednesday?', 'Thursday', 'Monday', 'Saturday'),
  q('dw-3', 'Days of the Week', 'What day comes before Friday?', 'Thursday', 'Sunday', 'Saturday'),
  q('dw-4', 'Days of the Week', 'The first day of the school week is usually ___.', 'Monday', 'Saturday', 'Sunday'),
  q('dw-5', 'Days of the Week', 'What day comes after Saturday?', 'Sunday', 'Friday', 'Monday'),

  // ── 4. My Family and Friends ──
  q('ff-1', 'My Family and Friends', 'My mother’s daughter is my ___.', 'sister', 'brother', 'father'),
  q('ff-2', 'My Family and Friends', 'My father’s son is my ___.', 'brother', 'mother', 'grandmother'),
  q('ff-3', 'My Family and Friends', 'My mother’s husband is my ___.', 'father', 'uncle', 'brother'),
  q('ff-4', 'My Family and Friends', 'My father’s mother is my ___.', 'grandmother', 'sister', 'aunt'),
  q('ff-5', 'My Family and Friends', 'A person I like and play with is my ___.', 'friend', 'teacher', 'father'),

  // ── 5. Food ──
  q('fd-1', 'Food', 'I like ___.', 'pizza', 'water', 'juice'),
  q('fd-2', 'Food', 'We drink ___.', 'milk', 'bread', 'cheese'),
  q('fd-3', 'Food', 'An apple is a ___.', 'fruit', 'drink', 'vegetable'),
  q('fd-4', 'Food', 'A carrot is a ___.', 'vegetable', 'fruit', 'drink'),
  q('fd-5', 'Food', 'We eat soup with a ___.', 'spoon', 'pencil', 'book'),

  // ── ⭐ Mixed Test ──
  q('mx-1', 'Mixed Test', 'She ___ to school every day.', 'goes', 'go', 'going'),
  q('mx-2', 'Mixed Test', 'What day comes after Friday?', 'Saturday', 'Sunday', 'Thursday'),
  q('mx-3', 'Mixed Test', 'I brush my ___ every morning.', 'teeth', 'school', 'milk'),
  q('mx-4', 'Mixed Test', 'My father’s daughter is my ___.', 'sister', 'brother', 'uncle'),
  q('mx-5', 'Mixed Test', 'Bananas are ___.', 'fruit', 'drinks', 'vegetables'),
  q('mx-6', 'Mixed Test', 'We ___ breakfast in the morning.', 'have', 'has', 'having'),
  q('mx-7', 'Mixed Test', 'He ___ football on Sunday.', 'plays', 'play', 'playing'),
  q('mx-8', 'Mixed Test', 'What day comes before Monday?', 'Sunday', 'Friday', 'Saturday'),
  q('mx-9', 'Mixed Test', 'We drink ___.', 'juice', 'rice', 'bread'),
  q('mx-10', 'Mixed Test', 'My mother’s husband is my ___.', 'father', 'brother', 'uncle'),
];

export const WORD_BY_ID: ReadonlyMap<string, MatchWord> = new Map(WORDS.map((w) => [w.id, w]));
