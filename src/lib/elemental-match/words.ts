/**
 * Банк слов для «Elemental Match» — quiz на скорость: слово → правильное
 * значение (короткий синоним/определение по-английски) + вручную подобранные
 * дистракторы, похожие по смыслу или по форме. Лексика — из мира «Аватара»
 * (стихии, честь, равновесие, странствия), уровни — как в обычном курсе.
 */

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2';

export interface MatchWord {
  id: string;
  word: string;
  correctAnswer: string;
  /** Проверенные вручную неверные варианты — не синонимы правильного ответа */
  distractors: readonly string[];
  level: CefrLevel;
}

export const WORDS: readonly MatchWord[] = [
  // ── A1 ──
  { id: 'brave', word: 'brave', correctAnswer: 'not afraid', distractors: ['very tired', 'angry', 'quiet'], level: 'A1' },
  { id: 'calm', word: 'calm', correctAnswer: 'quiet and relaxed', distractors: ['very fast', 'loud', 'cold'], level: 'A1' },
  { id: 'wise', word: 'wise', correctAnswer: 'having good judgment', distractors: ['very old', 'rich', 'wide'], level: 'A1' },
  { id: 'glide', word: 'glide', correctAnswer: 'move smoothly through the air', distractors: ['fall down', 'run fast', 'shout'], level: 'A1' },
  { id: 'gentle', word: 'gentle', correctAnswer: 'kind and soft', distractors: ['strong and hard', 'general', 'strict'], level: 'A1' },
  { id: 'journey', word: 'journey', correctAnswer: 'a long trip', distractors: ['a short nap', 'a big meal', 'a diary'], level: 'A1' },
  { id: 'enemy', word: 'enemy', correctAnswer: 'someone who fights against you', distractors: ['a close friend', 'a teacher', 'energy'], level: 'A1' },

  // ── A2 ──
  { id: 'ancient', word: 'ancient', correctAnswer: 'very old', distractors: ['very new', 'very small', 'angry'], level: 'A2' },
  { id: 'fierce', word: 'fierce', correctAnswer: 'wild and violent', distractors: ['gentle and kind', 'fair', 'fast'], level: 'A2' },
  { id: 'mighty', word: 'mighty', correctAnswer: 'very strong', distractors: ['very weak', 'maybe', 'tiny'], level: 'A2' },
  { id: 'wisdom', word: 'wisdom', correctAnswer: 'deep knowledge and good judgment', distractors: ['a wish', 'a kingdom', 'great speed'], level: 'A2' },
  { id: 'honor', word: 'honor', correctAnswer: 'respect and good reputation', distractors: ['a horn', 'hunger', 'a large house'], level: 'A2' },
  { id: 'balance', word: 'balance', correctAnswer: 'a state where all sides are equal', distractors: ['a big ball', 'a dance', 'a fight'], level: 'A2' },
  { id: 'wander', word: 'wander', correctAnswer: 'walk around without a clear goal', distractors: ['wonder about something', 'sleep deeply', 'build a wall'], level: 'A2' },
  { id: 'loyal', word: 'loyal', correctAnswer: 'always supporting someone', distractors: ['royal', 'lonely', 'lazy'], level: 'A2' },
  { id: 'courage', word: 'courage', correctAnswer: 'bravery', distractors: ['a garage', 'anger', 'a message'], level: 'A2' },
  { id: 'vanish', word: 'vanish', correctAnswer: 'disappear suddenly', distractors: ['appear', 'polish', 'punish'], level: 'A2' },

  // ── B1 ──
  { id: 'banish', word: 'banish', correctAnswer: 'send someone away as a punishment', distractors: ['welcome home', 'vanish', 'forgive'], level: 'B1' },
  { id: 'destiny', word: 'destiny', correctAnswer: 'what will happen to you in the future', distractors: ['a destination', 'a dynasty', 'density'], level: 'B1' },
  { id: 'harmony', word: 'harmony', correctAnswer: 'peaceful agreement', distractors: ['harm', 'a ceremony', 'a melody only'], level: 'B1' },
  { id: 'betray', word: 'betray', correctAnswer: 'be disloyal to someone who trusts you', distractors: ['protect', 'portray', 'delay'], level: 'B1' },
  { id: 'fragile', word: 'fragile', correctAnswer: 'easily broken', distractors: ['very strong', 'fragrant', 'flexible'], level: 'B1' },
  { id: 'reckless', word: 'reckless', correctAnswer: 'not caring about danger', distractors: ['careful', 'restless', 'wrecked'], level: 'B1' },
  { id: 'humble', word: 'humble', correctAnswer: 'not proud', distractors: ['arrogant', 'a bumble bee', 'hungry'], level: 'B1' },
  { id: 'restore', word: 'restore', correctAnswer: 'bring back to the original state', distractors: ['destroy', 'a store', 'ignore'], level: 'B1' },
  { id: 'conquer', word: 'conquer', correctAnswer: 'take control by force', distractors: ['surrender', 'concur', 'question'], level: 'B1' },

  // ── B2 ──
  { id: 'resilient', word: 'resilient', correctAnswer: 'able to recover quickly', distractors: ['easily hurt', 'resident', 'reluctant'], level: 'B2' },
  { id: 'serene', word: 'serene', correctAnswer: 'calm and peaceful', distractors: ['severe', 'a siren', 'anxious'], level: 'B2' },
  { id: 'fury', word: 'fury', correctAnswer: 'extreme anger', distractors: ['fur', 'a jury', 'deep joy'], level: 'B2' },
  { id: 'exile', word: 'exile', correctAnswer: 'being forced to live away from home', distractors: ['an exit', 'an example', 'a celebration'], level: 'B2' },
  { id: 'tyrant', word: 'tyrant', correctAnswer: 'a cruel ruler', distractors: ['a tired giant', 'a kind king', 'a tire'], level: 'B2' },
  { id: 'redeem', word: 'redeem', correctAnswer: 'make up for past mistakes', distractors: ['redo homework', 'refuse', 'dream again'], level: 'B2' },
];

export const WORD_BY_ID: ReadonlyMap<string, MatchWord> = new Map(WORDS.map((w) => [w.id, w]));
