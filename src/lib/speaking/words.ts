/**
 * Банк слов для упражнения «Speaking»: ученик видит одно слово из мира
 * «Аватара» и произносит его вслух. Проверяется только это слово —
 * с допуском на акцент и на то, как распознаватель обычно «слышит» имена.
 */

export type Nation = 'water' | 'earth' | 'fire' | 'air' | 'all';

export interface SpeakingWord {
  id: string;
  word: string;
  /** Транскрипция — подсказка, как произносить */
  ipa: string;
  /** Что это — короткое пояснение по-английски */
  hint: string;
  nation: Nation;
  /** Как распознаватель обычно «слышит» слово — тоже засчитываем */
  aliases?: readonly string[];
}

export const NATION_LABEL: Record<Nation, string> = {
  water: 'Water Tribe',
  earth: 'Earth Kingdom',
  fire: 'Fire Nation',
  air: 'Air Nomads',
  all: 'Four Nations',
};

export const WORDS: readonly SpeakingWord[] = [
  // ── Персонажи ──
  { id: 'aang', word: 'Aang', ipa: '/ɑːŋ/', hint: 'The last airbender and the Avatar', nation: 'air', aliases: ['ang', 'ung', 'on', 'aung'] },
  { id: 'katara', word: 'Katara', ipa: '/kəˈtɑːrə/', hint: 'A waterbender from the South Pole', nation: 'water', aliases: ['catarrh', 'katarah', 'cattara', 'cutara'] },
  { id: 'sokka', word: 'Sokka', ipa: '/ˈsɑːkə/', hint: 'Katara’s brother with a boomerang', nation: 'water', aliases: ['soka', 'socca', 'sucker', 'soccer'] },
  { id: 'toph', word: 'Toph', ipa: '/tɒf/', hint: 'The blind earthbender', nation: 'earth', aliases: ['toff', 'tof', 'tough', 'top'] },
  { id: 'zuko', word: 'Zuko', ipa: '/ˈzuːkoʊ/', hint: 'The banished prince of the Fire Nation', nation: 'fire', aliases: ['zucco', 'zuco', 'suko', 'zuke'] },
  { id: 'azula', word: 'Azula', ipa: '/əˈzuːlə/', hint: 'Zuko’s sister, a princess with blue fire', nation: 'fire', aliases: ['azoola', 'asula', 'a zula'] },
  { id: 'iroh', word: 'Iroh', ipa: '/ˈaɪroʊ/', hint: 'Zuko’s wise uncle who loves tea', nation: 'fire', aliases: ['iro', 'arrow', 'eero', 'i row'] },
  { id: 'appa', word: 'Appa', ipa: '/ˈɑːpə/', hint: 'Aang’s giant flying sky bison', nation: 'air', aliases: ['apa', 'upper', 'oppa', 'ah pa'] },
  { id: 'momo', word: 'Momo', ipa: '/ˈmoʊmoʊ/', hint: 'A small winged lemur', nation: 'air', aliases: ['mo mo', 'mormo', 'moe moe'] },
  { id: 'suki', word: 'Suki', ipa: '/ˈsuːki/', hint: 'Leader of the Kyoshi Warriors', nation: 'earth', aliases: ['sookie', 'sukey', 'sue key', 'sookey'] },
  { id: 'bumi', word: 'Bumi', ipa: '/ˈbuːmi/', hint: 'The crazy old king of Omashu', nation: 'earth', aliases: ['boomi', 'boomy', 'bhoomi', 'boo me'] },
  { id: 'ozai', word: 'Ozai', ipa: '/oʊˈzaɪ/', hint: 'The Fire Lord who wants to rule the world', nation: 'fire', aliases: ['ozi', 'o sigh', 'ozzie', 'oh zai'] },

  // ── Слова мира «Аватара» ──
  { id: 'avatar', word: 'Avatar', ipa: '/ˈævətɑːr/', hint: 'The one who can bend all four elements', nation: 'all', aliases: ['avatar', 'avitar'] },
  { id: 'water', word: 'water', ipa: '/ˈwɔːtər/', hint: 'The element of the Water Tribe', nation: 'water', aliases: ['water', 'watter'] },
  { id: 'earth', word: 'earth', ipa: '/ɜːrθ/', hint: 'The element of the Earth Kingdom', nation: 'earth', aliases: ['earth', 'irth', 'urf'] },
  { id: 'fire', word: 'fire', ipa: '/ˈfaɪər/', hint: 'The element of the Fire Nation', nation: 'fire', aliases: ['fire', 'fyre', 'fya'] },
  { id: 'air', word: 'air', ipa: '/er/', hint: 'The element of the Air Nomads', nation: 'air', aliases: ['air', 'err', 'heir'] },
  { id: 'waterbender', word: 'waterbender', ipa: '/ˈwɔːtərˌbendər/', hint: 'A person who can bend water', nation: 'water', aliases: ['water bender', 'waterbender'] },
  { id: 'firebender', word: 'firebender', ipa: '/ˈfaɪərˌbendər/', hint: 'A person who can bend fire', nation: 'fire', aliases: ['fire bender', 'firebender'] },
  { id: 'earthbender', word: 'earthbender', ipa: '/ˈɜːrθˌbendər/', hint: 'A person who can bend earth', nation: 'earth', aliases: ['earth bender', 'earthbender'] },
  { id: 'airbender', word: 'airbender', ipa: '/ˈerˌbendər/', hint: 'A person who can bend air', nation: 'air', aliases: ['air bender', 'airbender'] },
  { id: 'bison', word: 'bison', ipa: '/ˈbaɪsən/', hint: 'Appa is a sky bison', nation: 'air', aliases: ['bison', 'bisen'] },
  { id: 'lemur', word: 'lemur', ipa: '/ˈliːmər/', hint: 'Momo is a winged lemur', nation: 'air', aliases: ['lemur', 'lemer', 'leemer'] },
  { id: 'glider', word: 'glider', ipa: '/ˈɡlaɪdər/', hint: 'Aang flies on it', nation: 'air', aliases: ['glider', 'glidder'] },
  { id: 'boomerang', word: 'boomerang', ipa: '/ˈbuːməræŋ/', hint: 'Sokka’s favorite weapon', nation: 'water', aliases: ['boomerang', 'boomer rang'] },
  { id: 'temple', word: 'temple', ipa: '/ˈtempəl/', hint: 'Aang grew up in the Southern Air Temple', nation: 'air', aliases: ['temple', 'tempel'] },
  { id: 'lightning', word: 'lightning', ipa: '/ˈlaɪtnɪŋ/', hint: 'Azula can shoot it', nation: 'fire', aliases: ['lightning', 'lightening'] },
  { id: 'omashu', word: 'Omashu', ipa: '/oʊˈmɑːʃuː/', hint: 'King Bumi’s city', nation: 'earth', aliases: ['omashu', 'oh ma shoe', 'omashoo'] },
];

export function pickRandomWord(excludeId?: string): SpeakingWord {
  const pool = WORDS.filter((w) => w.id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)];
}
