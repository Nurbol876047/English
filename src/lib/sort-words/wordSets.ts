/**
 * Банк наборов для «Sort the Words».
 *
 * ПРАВИЛО ПРИ ДОБАВЛЕНИИ: слово должно однозначно принадлежать ровно одной
 * из трёх категорий набора. Слова-омонимы, попадающие в две категории
 * («run» — noun и verb, «light» — noun и adjective, «work» — noun и verb),
 * в банк не включать — упражнение проверяет категорию автоматически и не
 * умеет принимать два ответа.
 */

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2';
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
  /** Подсказка (показывается после ошибки) */
  hint?: string;
}

export interface WordSet {
  id: string;
  title: string;
  level: CefrLevel;
  kind: SetKind;
  /** Ровно 3 категории — по числу корзин */
  categories: readonly [Category, Category, Category];
  words: readonly SetWord[];
}

const c = (id: string, label: string, color: BasketColor): Category => ({ id, label, color });
const w = (text: string, category: string, hint?: string): SetWord => ({ text, category, hint });

export const WORD_SETS: readonly WordSet[] = [
  // Все наборы — по вселенной «Аватар: Легенда об Аанге» (стихии, маги, Аппа, Момо,
  // Храм Воздуха, Народ Огня); грамматические категории и уровни — как в обычном курсе.
  {
    id: 'parts-of-speech',
    title: 'Parts of speech',
    level: 'A2',
    kind: 'grammar',
    categories: [c('noun', 'Noun', 'sky'), c('verb', 'Verb', 'violet'), c('adj', 'Adjective', 'emerald')],
    words: [
      w('Avatar', 'noun'), w('bison', 'noun'), w('temple', 'noun'), w('scroll', 'noun'), w('lotus', 'noun'),
      w('bend', 'verb'), w('meditate', 'verb'), w('glide', 'verb'), w('freeze', 'verb'), w('ignite', 'verb'),
      w('brave', 'adj'), w('ancient', 'adj'), w('fierce', 'adj'), w('calm', 'adj'), w('mighty', 'adj'),
    ],
  },
  {
    id: 'tense-forms',
    title: 'Tense forms',
    level: 'A2',
    kind: 'grammar',
    categories: [c('present', 'Present', 'sky'), c('past', 'Past', 'violet'), c('future', 'Future', 'emerald')],
    words: [
      w('Aang flies', 'present'), w('is bending', 'present'), w('we train', 'present'), w('Katara heals', 'present'), w('are gliding', 'present'),
      w('Aang flew', 'past'), w('was bending', 'past'), w('we trained', 'past'), w('Katara healed', 'past'), w('froze', 'past'),
      w('will fly', 'future'), w('is going to bend', 'future'), w('will train', 'future'), w("she'll heal", 'future'), w('will freeze', 'future'),
    ],
  },
  {
    id: 'verb-types',
    title: 'Regular · Irregular · Modal',
    level: 'B1',
    kind: 'grammar',
    categories: [c('regular', 'Regular', 'sky'), c('irregular', 'Irregular', 'violet'), c('modal', 'Modal', 'emerald')],
    words: [
      w('trained', 'regular'), w('healed', 'regular'), w('glided', 'regular'), w('meditated', 'regular'), w('guarded', 'regular'),
      w('bent', 'irregular'), w('flew', 'irregular'), w('froze', 'irregular'), w('fought', 'irregular'), w('taught', 'irregular'),
      w('can', 'modal'), w('must', 'modal'), w('should', 'modal'), w('might', 'modal'), w('could', 'modal'),
    ],
  },
  {
    id: 'noun-types',
    title: 'Countable · Uncountable · Plural-only',
    level: 'B1',
    kind: 'grammar',
    categories: [c('countable', 'Countable', 'sky'), c('uncountable', 'Uncountable', 'violet'), c('plural', 'Plural-only', 'emerald')],
    words: [
      w('bison', 'countable'), w('temple', 'countable'), w('scroll', 'countable'), w('mask', 'countable'), w('lantern', 'countable'),
      w('water', 'uncountable'), w('fire', 'uncountable'), w('air', 'uncountable'), w('wisdom', 'uncountable'), w('energy', 'uncountable'),
      w('goggles', 'plural'), w('trousers', 'plural'), w('clothes', 'plural'), w('scissors', 'plural'), w('binoculars', 'plural'),
    ],
  },
  {
    id: 'food-animals-transport',
    title: 'Food · Animals · Transport',
    level: 'A1',
    kind: 'vocabulary',
    categories: [c('food', 'Food', 'sky'), c('animals', 'Animals', 'violet'), c('transport', 'Transport', 'emerald')],
    words: [
      w('cactus juice', 'food'), w('fire flakes', 'food'), w('seaweed noodles', 'food'), w('moon peach', 'food'), w('jasmine tea', 'food'),
      w('sky bison', 'animals'), w('lemur', 'animals'), w('badgermole', 'animals'), w('turtle duck', 'animals'), w('polar bear dog', 'animals'),
      w('airship', 'transport'), w('war balloon', 'transport'), w('glider', 'transport'), w('canoe', 'transport'), w('tank train', 'transport'),
    ],
  },
  {
    id: 'body-clothes-house',
    title: 'Body · Clothes · Temple',
    level: 'A1',
    kind: 'vocabulary',
    categories: [c('body', 'Body', 'sky'), c('clothes', 'Clothes', 'violet'), c('house', 'Temple', 'emerald')],
    words: [
      w('hand', 'body'), w('knee', 'body'), w('shoulder', 'body'), w('forehead', 'body'), w('nose', 'body'),
      w('robe', 'clothes'), w('headband', 'clothes'), w('boots', 'clothes'), w('cloak', 'clothes'), w('mask', 'clothes'),
      w('courtyard', 'house'), w('gate', 'house'), w('hall', 'house'), w('roof', 'house'), w('garden', 'house'),
    ],
  },
  {
    id: 'emotions-weather-jobs',
    title: 'Emotions · Weather · Roles',
    level: 'A2',
    kind: 'vocabulary',
    categories: [c('emotions', 'Emotions', 'sky'), c('weather', 'Weather', 'violet'), c('jobs', 'Roles', 'emerald')],
    words: [
      w('angry', 'emotions'), w('calm', 'emotions'), w('proud', 'emotions'), w('afraid', 'emotions'), w('hopeful', 'emotions'),
      w('blizzard', 'weather'), w('thunderstorm', 'weather'), w('foggy', 'weather'), w('sunny', 'weather'), w('windy', 'weather'),
      w('firebender', 'jobs'), w('healer', 'jobs'), w('warrior', 'jobs'), w('monk', 'jobs'), w('general', 'jobs'),
    ],
  },
  {
    id: 'prepositions',
    title: 'Prepositions: time · place · movement',
    level: 'B1',
    kind: 'grammar',
    categories: [c('time', 'Time', 'sky'), c('place', 'Place', 'violet'), c('movement', 'Movement', 'emerald')],
    words: [
      w('at dawn', 'time'), w('during the eclipse', 'time'), w('since the war', 'time'), w('on that day', 'time'), w('in a hundred years', 'time'),
      w('under the ice', 'place'), w('inside the temple', 'place'), w('behind the wall', 'place'), w('on the bison', 'place'), w('beside the fire', 'place'),
      w('into the Spirit World', 'movement'), w('across the sea', 'movement'), w('through the wall', 'movement'), w('towards the palace', 'movement'), w('out of the iceberg', 'movement'),
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
