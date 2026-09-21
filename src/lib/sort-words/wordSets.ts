/**
 * Банк наборов для «Sort the Words».
 *
 * ПРАВИЛО ПРИ ДОБАВЛЕНИИ: слово должно однозначно принадлежать ровно одной
 * из трёх категорий набора. Слова-омонимы, попадающие в две категории
 * («run» — noun и verb, «light» — noun и adjective, «work» — noun и verb),
 * в банк не включать — упражнение проверяет категорию автоматически и не
 * умеет принимать два ответа.
 */

export type SetKind = 'grammar' | 'vocabulary';

/** Цвета корзин — совпадают с потоками на видеофоне (sky / violet / emerald) */
export type BasketColor = 'sky' | 'violet' | 'emerald';

export interface Category {
  id: string;
  label: string;
  color: BasketColor;
}

export interface SetWord {
  text: string;
  /** id категории из набора */
  category: string;
  /** Подсказка (показывается после ошибки) — перевод на казахский */
  hint?: string;
}

export interface WordSet {
  id: string;
  title: string;
  kind: SetKind;
  /** Ровно 3 категории — по числу корзин */
  categories: readonly [Category, Category, Category];
  words: readonly SetWord[];
}

const c = (id: string, label: string, color: BasketColor): Category => ({ id, label, color });
const w = (text: string, category: string, hint?: string): SetWord => ({ text, category, hint });

export const WORD_SETS: readonly WordSet[] = [
  // Все наборы — 4 класс, лексика пяти тем из методички: Present Simple,
  // My Daily Routine, Days of the Week, My Family and Friends, Food.
  {
    id: 'family-food-days',
    title: 'Family · Food · Days of the week',
    kind: 'vocabulary',
    categories: [c('family', 'Family', 'sky'), c('food', 'Food', 'violet'), c('days', 'Days of the week', 'emerald')],
    words: [
      w('mother', 'family', 'ана'), w('father', 'family', 'әке'), w('sister', 'family', 'әпке'), w('brother', 'family', 'аға'), w('grandmother', 'family', 'әже'),
      w('apple', 'food', 'алма'), w('milk', 'food', 'сүт'), w('bread', 'food', 'нан'), w('pizza', 'food', 'пицца'), w('cheese', 'food', 'ірімшік'),
      w('Monday', 'days', 'дүйсенбі'), w('Tuesday', 'days', 'сейсенбі'), w('Friday', 'days', 'жұма'), w('Saturday', 'days', 'сенбі'), w('Sunday', 'days', 'жексенбі'),
    ],
  },
  {
    id: 'fruit-vegetables-drinks',
    title: 'Fruit · Vegetables · Drinks',
    kind: 'vocabulary',
    categories: [c('fruit', 'Fruit', 'sky'), c('vegetables', 'Vegetables', 'violet'), c('drinks', 'Drinks', 'emerald')],
    words: [
      w('apple', 'fruit', 'алма'), w('banana', 'fruit', 'банан'), w('orange', 'fruit', 'апельсин'), w('pear', 'fruit', 'алмұрт'), w('lemon', 'fruit', 'лимон'),
      w('carrot', 'vegetables', 'сәбіз'), w('potato', 'vegetables', 'картоп'), w('tomato', 'vegetables', 'қызанақ'), w('cabbage', 'vegetables', 'қырыққабат'), w('onion', 'vegetables', 'пияз'),
      w('milk', 'drinks', 'сүт'), w('juice', 'drinks', 'шырын'), w('water', 'drinks', 'су'), w('tea', 'drinks', 'шай'), w('lemonade', 'drinks', 'лимонад'),
    ],
  },
  {
    id: 'present-simple',
    title: 'Present Simple: I / we / they · he / she · when?',
    kind: 'grammar',
    categories: [c('base', 'I / we / they', 'sky'), c('s-form', 'He / she', 'violet'), c('when', 'When?', 'emerald')],
    words: [
      w('go', 'base', 'I go to school'), w('play', 'base', 'They play football'), w('drink', 'base', 'We drink milk'), w('watch', 'base', 'We watch TV'), w('like', 'base', 'I like pizza'),
      w('goes', 's-form', 'She goes to school'), w('plays', 's-form', 'He plays football'), w('drinks', 's-form', 'He drinks milk'), w('watches', 's-form', 'She watches TV'), w('studies', 's-form', 'She studies English'),
      w('every day', 'when', 'күнде'), w('in the morning', 'when', 'таңертең'), w('in the evening', 'when', 'кешке'), w('after school', 'when', 'мектептен кейін'), w('at 7 o’clock', 'when', 'сағат жетіде'),
    ],
  },
  {
    id: 'routine-school-family',
    title: 'Daily routine · School · Family and friends',
    kind: 'vocabulary',
    categories: [c('routine', 'Daily routine', 'sky'), c('school', 'School', 'violet'), c('family', 'Family and friends', 'emerald')],
    words: [
      w('get up', 'routine', 'тұру'), w('brush teeth', 'routine', 'тіс тазалау'), w('have breakfast', 'routine', 'таңғы ас ішу'), w('go to bed', 'routine', 'ұйықтауға жату'), w('wash face', 'routine', 'бет жуу'),
      w('book', 'school', 'кітап'), w('pen', 'school', 'қалам'), w('pencil', 'school', 'қарындаш'), w('desk', 'school', 'парта'), w('bag', 'school', 'сөмке'),
      w('mother', 'family', 'ана'), w('father', 'family', 'әке'), w('sister', 'family', 'әпке'), w('brother', 'family', 'аға'), w('friend', 'family', 'дос'),
    ],
  },
  {
    id: 'time-days-numbers',
    title: 'Time of day · Days of the week · Numbers',
    kind: 'vocabulary',
    categories: [c('time', 'Time of day', 'sky'), c('days', 'Days of the week', 'violet'), c('numbers', 'Numbers', 'emerald')],
    words: [
      w('morning', 'time', 'таң'), w('afternoon', 'time', 'түстен кейін'), w('evening', 'time', 'кеш'), w('night', 'time', 'түн'), w('noon', 'time', 'түс'),
      w('Monday', 'days', 'дүйсенбі'), w('Wednesday', 'days', 'сәрсенбі'), w('Thursday', 'days', 'бейсенбі'), w('Saturday', 'days', 'сенбі'), w('Sunday', 'days', 'жексенбі'),
      w('one', 'numbers', 'бір'), w('two', 'numbers', 'екі'), w('seven', 'numbers', 'жеті'), w('ten', 'numbers', 'он'), w('twelve', 'numbers', 'он екі'),
    ],
  },
];

export function getSet(id: string): WordSet | undefined {
  return WORD_SETS.find((s) => s.id === id);
}

export function pickRandomSet(excludeId?: string): WordSet {
  const pool = WORD_SETS.filter((s) => s.id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Пройденных раундов подряд, чтобы набор считался освоенным */
export const SET_MASTERY_THRESHOLD = 2;
/** Доля верных ответов, при которой раунд считается пройденным */
export const PASS_RATIO = 0.8;
