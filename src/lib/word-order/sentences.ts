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
  /** Подсказка в HUD (по-английски): вопрос или контекст из сцены, на который отвечает предложение */
  hint: string;
}

export const SENTENCES: readonly Sentence[] = [
  // Все предложения — по вселенной «Аватар: Легенда об Аанге»: стихии, маги, Аппа, Момо,
  // Храм Воздуха, Народ Огня. Подсказка — по-английски, не выдаёт порядок слов напрямую.

  // ── A1 ───────────────────────────────────────────────────────────────
  { id: 'a1-01', level: 'A1', topic: 'present simple', words: ['Aang', 'loves', 'his', 'sky', 'bison.'], hint: 'How does Aang feel about Appa?' },
  { id: 'a1-02', level: 'A1', topic: 'present simple', words: ['Katara', 'bends', 'water', 'every', 'day.'], hint: 'What does Katara practice daily?' },
  { id: 'a1-03', level: 'A1', topic: 'present continuous', words: ['Appa', 'is', 'flying', 'over', 'the', 'sea.'], hint: 'Where is Appa right now?' },
  { id: 'a1-04', level: 'A1', topic: 'questions', words: ['Where', 'is', 'the', 'Avatar?'], hint: 'Zuko wants to find the last airbender.' },
  { id: 'a1-05', level: 'A1', topic: 'modal verbs', words: ['Can', 'Toph', 'see', 'with', 'her', 'feet?'], hint: 'Ask about the blind earthbender’s special sense.' },
  { id: 'a1-06', level: 'A1', topic: 'present simple', words: ['Momo', 'eats', 'a', 'moon', 'peach.'], hint: 'What is the winged lemur having for lunch?' },
  { id: 'a1-07', level: 'A1', topic: 'present simple', words: ['Sokka', 'has', 'a', 'boomerang.'], hint: 'What is Sokka’s favorite weapon?' },
  { id: 'a1-08', level: 'A1', topic: 'present continuous', words: ['Iroh', 'is', 'making', 'jasmine', 'tea.'], hint: 'What is Uncle Iroh doing in the tea shop?' },

  // ── A2 ───────────────────────────────────────────────────────────────
  { id: 'a2-01', level: 'A2', topic: 'past simple', words: ['Zuko', 'chased', 'the', 'Avatar', 'last', 'winter.'], hint: 'What did the banished prince do last winter?' },
  { id: 'a2-02', level: 'A2', topic: 'future simple', words: ['Aang', 'will', 'master', 'all', 'four', 'elements.'], hint: 'What is the Avatar’s destiny?' },
  { id: 'a2-03', level: 'A2', topic: 'comparatives', words: ['Appa', 'is', 'bigger', 'than', 'Momo.'], hint: 'Compare the sky bison and the lemur.' },
  { id: 'a2-04', level: 'A2', topic: 'questions', words: ['When', 'does', 'the', 'Fire', 'Nation', 'attack?'], hint: 'Ask about the day of Sozin’s Comet.' },
  { id: 'a2-05', level: 'A2', topic: 'modal verbs', words: ['You', 'should', 'drink', 'some', 'jasmine', 'tea.'], hint: 'Uncle Iroh gives Zuko some advice.' },
  { id: 'a2-06', level: 'A2', topic: 'past simple', words: ['Aang', 'woke', 'up', 'in', 'an', 'iceberg.'], hint: 'Where did Katara and Sokka find the Avatar?' },
  { id: 'a2-07', level: 'A2', topic: 'future simple', words: ['Sozin’s', 'Comet', 'will', 'return', 'this', 'summer.'], hint: 'Why is the Fire Nation so confident?' },

  // ── B1 ───────────────────────────────────────────────────────────────
  { id: 'b1-01', level: 'B1', topic: 'present perfect', words: ['Aang', 'has', 'never', 'been', 'to', 'Ba', 'Sing', 'Se.'], hint: 'Has the Avatar visited the great Earth Kingdom city?' },
  { id: 'b1-02', level: 'B1', topic: 'present perfect', words: ['Katara', 'has', 'just', 'healed', 'his', 'wound.'], hint: 'What did the waterbender do a moment ago?' },
  { id: 'b1-03', level: 'B1', topic: 'conditionals', words: ['If', 'Aang', 'fails,', 'the', 'world', 'will', 'burn.'], hint: 'What happens if the Avatar loses to the Fire Lord?' },
  { id: 'b1-04', level: 'B1', topic: 'passive voice', words: ['The', 'temple', 'was', 'destroyed', 'by', 'the', 'Fire', 'Nation.'], hint: 'What happened to the Southern Air Temple? (passive)' },
  { id: 'b1-05', level: 'B1', topic: 'reported speech', words: ['Iroh', 'said', 'that', 'tea', 'was', 'important.'], hint: 'Report Uncle Iroh’s words: “Tea is important.”' },
  { id: 'b1-06', level: 'B1', topic: 'present perfect', words: ['Toph', 'has', 'invented', 'metalbending.'], hint: 'What new bending art exists thanks to Toph?' },

  // ── B2 ───────────────────────────────────────────────────────────────
  { id: 'b2-01', level: 'B2', topic: 'conditionals', words: ['If', 'Zuko', 'had', 'listened,', 'he', 'would', 'have', 'stayed.'], hint: 'Zuko left Ba Sing Se. Imagine the past differently.' },
  { id: 'b2-02', level: 'B2', topic: 'passive voice', words: ['The', 'city', 'is', 'being', 'defended', 'by', 'earthbenders.'], hint: 'What is happening at the walls of Ba Sing Se? (passive)' },
  { id: 'b2-03', level: 'B2', topic: 'reported speech', words: ['She', 'asked', 'me', 'where', 'the', 'Avatar', 'was.'], hint: 'Report Azula’s question: “Where is the Avatar?”' },
  { id: 'b2-04', level: 'B2', topic: 'present perfect', words: ['They', 'have', 'been', 'training', 'since', 'sunrise.'], hint: 'How long have Aang and Katara been practicing?' },
  { id: 'b2-05', level: 'B2', topic: 'comparatives', words: ['The', 'stronger', 'the', 'bender,', 'the', 'calmer', 'the', 'mind.'], hint: 'A lesson from the Air Nomads about strength and calm.' },
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
