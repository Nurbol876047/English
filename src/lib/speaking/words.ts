/**
 * Банк слов для упражнения «Speaking»: ученик видит одно простое слово
 * (4 класс, пять тем из методички), его транскрипцию и перевод на казахский —
 * и произносит слово вслух. Проверяется только это слово, с допуском на акцент
 * и на то, как распознаватель обычно «слышит» слово.
 */

export type Topic = 'grammar' | 'routine' | 'days' | 'family' | 'food';

export interface SpeakingWord {
  id: string;
  word: string;
  /** Транскрипция — подсказка, как произносить */
  ipa: string;
  /** Перевод на казахский */
  translation: string;
  /** Короткий пример по-английски — контекст для ученика и для проверки */
  hint: string;
  topic: Topic;
  /** Как распознаватель обычно «слышит» слово — тоже засчитываем */
  aliases?: readonly string[];
}

export const TOPIC_LABEL: Record<Topic, string> = {
  grammar: 'Present Simple',
  routine: 'My Daily Routine',
  days: 'Days of the Week',
  family: 'My Family and Friends',
  food: 'Food',
};

const s = (id: string, word: string, ipa: string, translation: string, hint: string, topic: Topic, aliases?: readonly string[]): SpeakingWord => ({
  id,
  word,
  ipa,
  translation,
  hint,
  topic,
  aliases,
});

export const WORDS: readonly SpeakingWord[] = [
  // ── Слова из таблицы методички ──
  s('go', 'go', '/ɡəʊ/', 'бару', 'I go to school.', 'grammar', ['goh', 'gow']),
  s('school', 'school', '/skuːl/', 'мектеп', 'I go to school every day.', 'routine', ['skool', 'scool']),
  s('morning', 'morning', '/ˈmɔːnɪŋ/', 'таң', 'I have breakfast in the morning.', 'routine', ['mourning', 'mornin']),
  s('breakfast', 'breakfast', '/ˈbrekfəst/', 'таңғы ас', 'We have breakfast in the morning.', 'routine', ['brekfast', 'break fast']),
  s('day', 'day', '/deɪ/', 'күн', 'Monday is the first day.', 'days', ['dey', 'they']),
  s('monday', 'Monday', '/ˈmʌndeɪ/', 'дүйсенбі', 'The first day of the school week.', 'days', ['mundy', 'mun day', 'monday']),
  s('family', 'family', '/ˈfæməli/', 'отбасы', 'My family and friends.', 'family', ['famly', 'fam ily']),
  s('mother', 'mother', '/ˈmʌðə/', 'ана', 'My mother’s husband is my father.', 'family', ['mutha', 'muther', 'other']),
  s('father', 'father', '/ˈfɑːðə/', 'әке', 'My father’s son is my brother.', 'family', ['fatha', 'farther', 'fother']),
  s('friend', 'friend', '/frend/', 'дос', 'I play with my friend.', 'family', ['frend', 'friend']),
  s('food', 'food', '/fuːd/', 'тағам', 'Pizza is my favourite food.', 'food', ['fud', 'foot']),
  s('apple', 'apple', '/ˈæpəl/', 'алма', 'An apple is a fruit.', 'food', ['apel', 'appel', 'a pull']),
  s('milk', 'milk', '/mɪlk/', 'сүт', 'We drink milk.', 'food', ['milc', 'mil']),
  s('bread', 'bread', '/bred/', 'нан', 'We eat bread.', 'food', ['bred', 'brad']),
  s('like', 'like', '/laɪk/', 'ұнату', 'I like pizza.', 'grammar', ['lik', 'lyke']),

  // ── Слова из заданий по тем же темам ──
  s('play', 'play', '/pleɪ/', 'ойнау', 'They play football after school.', 'grammar', ['plei', 'pley']),
  s('drink', 'drink', '/drɪŋk/', 'ішу', 'He drinks milk every morning.', 'grammar', ['drenk', 'drinc']),
  s('watch', 'watch', '/wɒtʃ/', 'көру', 'We watch TV in the evening.', 'grammar', ['wotch', 'woch', 'what']),
  s('study', 'study', '/ˈstʌdi/', 'оқу', 'She studies English at school.', 'grammar', ['stady', 'studdy']),
  s('teeth', 'teeth', '/tiːθ/', 'тістер', 'I brush my teeth.', 'routine', ['teef', 'teet', 'tees']),
  s('evening', 'evening', '/ˈiːvnɪŋ/', 'кеш', 'I go to bed in the evening.', 'routine', ['evning', 'eve ning']),
  s('seven', 'seven', '/ˈsevən/', 'жеті', 'I get up at seven o’clock.', 'routine', ['sevn', 'sevin']),
  s('tuesday', 'Tuesday', '/ˈtjuːzdeɪ/', 'сейсенбі', 'Tuesday comes after Monday.', 'days', ['tusday', 'choose day', 'tuesdae']),
  s('friday', 'Friday', '/ˈfraɪdeɪ/', 'жұма', 'Thursday comes before Friday.', 'days', ['fry day', 'fridae']),
  s('sunday', 'Sunday', '/ˈsʌndeɪ/', 'жексенбі', 'Sunday comes after Saturday.', 'days', ['sun day', 'sundae', 'sundy']),
  s('sister', 'sister', '/ˈsɪstə/', 'әпке', 'My mother’s daughter is my sister.', 'family', ['sista', 'sistar']),
  s('brother', 'brother', '/ˈbrʌðə/', 'аға', 'My father’s son is my brother.', 'family', ['brotha', 'bruther', 'bother']),
  s('grandmother', 'grandmother', '/ˈɡrænˌmʌðə/', 'әже', 'My father’s mother is my grandmother.', 'family', ['grand mother', 'granmother', 'grandmutha']),
  s('pizza', 'pizza', '/ˈpiːtsə/', 'пицца', 'I like pizza.', 'food', ['peetza', 'pitsa', 'pizza']),
  s('juice', 'juice', '/dʒuːs/', 'шырын', 'We drink juice.', 'food', ['joos', 'juce', 'jews']),
  s('fruit', 'fruit', '/fruːt/', 'жеміс', 'Bananas are fruit.', 'food', ['froot', 'frut']),
  s('carrot', 'carrot', '/ˈkærət/', 'сәбіз', 'A carrot is a vegetable.', 'food', ['carot', 'karrot', 'carat']),
  s('spoon', 'spoon', '/spuːn/', 'қасық', 'We eat soup with a spoon.', 'food', ['spun', 'spoon']),
];

export function pickRandomWord(excludeId?: string): SpeakingWord {
  const pool = WORDS.filter((w) => w.id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)];
}
