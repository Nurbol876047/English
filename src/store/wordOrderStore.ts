import { create } from 'zustand';
import {
  ALL_TOPICS,
  MASTERY_THRESHOLD,
  pickRandomSentence,
  shuffleWords,
  type GrammarTopic,
  type Sentence,
} from '@/lib/word-order/sentences';

import type { Feedback, GrabSource, HandCursor, ParticleBurst, Vec3Tuple } from '@/lib/hand/types';

export type { Feedback, HandCursor, ParticleBurst, Vec3Tuple };

export type TileState = 'tray' | 'grabbed' | 'placed' | 'error';

export interface WordTile {
  id: string;
  word: string;
  /** Позиция в лотке (куда плашка возвращается) */
  homePosition: Vec3Tuple;
  state: TileState;
  /** Индекс ячейки, если плашка размещена */
  slotIndex: number | null;
}

export interface Slot {
  index: number;
  position: Vec3Tuple;
  tileId: string | null;
}


export type RoundState = 'idle' | 'playing' | 'complete';

export type DropResult = 'correct' | 'wrong' | 'occupied';

export interface ExerciseResult {
  sentenceId: string;
  correct: boolean;
  timeSpentMs: number;
  attemptCount: number;
}

export type CameraStatus = 'idle' | 'loading' | 'tracking' | 'no-hand' | 'unavailable';

interface WordOrderState {
  // ── раунд ────────────────────────────────────────────────
  sentence: Sentence | null;
  tiles: WordTile[];
  slots: Slot[];
  roundState: RoundState;
  roundStartedAt: number;
  wrongDrops: number;

  // ── прогресс ─────────────────────────────────────────────
  streak: number;
  /** Сколько правильных раундов подряд по каждой теме */
  topicProgress: Partial<Record<GrammarTopic, number>>;
  masteredTopics: GrammarTopic[];
  totalTopics: number;

  // ── ввод ─────────────────────────────────────────────────
  cursor: HandCursor;
  grabbedTileId: string | null;
  /** Кто держит плашку — рука или мышь/тач. Нужно, чтобы отпускание щипка
   *  не сбрасывало плашку, которую тащат мышью, и наоборот. */
  grabSource: GrabSource;
  hoverSlotIndex: number | null;
  cameraStatus: CameraStatus;
  /** Ширина видимой области сцены на плоскости z=0 — для раскладки */
  viewportWidth: number;

  // ── эффекты ──────────────────────────────────────────────
  bursts: ParticleBurst[];
  feedback: Feedback | null;

  // ── actions ──────────────────────────────────────────────
  startRound: (excludeId?: string) => void;
  relayout: (viewportWidth: number) => void;
  setCursor: (cursor: Partial<HandCursor>) => void;
  setCameraStatus: (status: CameraStatus) => void;
  grabTile: (tileId: string, source: 'hand' | 'pointer') => boolean;
  setHoverSlot: (index: number | null) => void;
  dropTile: (tileId: string, slotIndex: number | null) => DropResult | null;
  clearTileError: (tileId: string) => void;
  removeBurst: (id: number) => void;
  clearFeedback: (id: number) => void;
  /** Снимок результата раунда для onExerciseComplete */
  getRoundResult: () => ExerciseResult | null;
}

let burstSeq = 0;
let feedbackSeq = 0;

// Тёплая «золотая» подсветка, чтобы отличаться от зелёного успеха
const BURST_CORRECT = '#4ade80';

/**
 * Раскладка: ячейки — верхняя треть, лоток слов — дуга в нижней трети.
 * Расстояние между элементами подбирается под ширину экрана, чтобы длинные
 * предложения (8 слов) влезали и на узких окнах.
 */
function computeLayout(count: number, viewportWidth: number): { slots: Vec3Tuple[]; homes: Vec3Tuple[] } {
  const usable = viewportWidth * 0.9;
  const spacing = Math.min(1.7, usable / Math.max(count, 1));
  const startX = -((count - 1) * spacing) / 2;

  const slots: Vec3Tuple[] = [];
  const homes: Vec3Tuple[] = [];
  for (let i = 0; i < count; i++) {
    const x = startX + i * spacing;
    slots.push([x, 1.9, 0]);
    // дуга: крайние плашки чуть выше и дальше, центральные — ниже и ближе
    const t = count > 1 ? (i / (count - 1)) * 2 - 1 : 0;
    homes.push([x, -2.2 + t * t * 0.45, -t * t * 0.6]);
  }
  return { slots, homes };
}

export const useWordOrderStore = create<WordOrderState>((set, get) => ({
  sentence: null,
  tiles: [],
  slots: [],
  roundState: 'idle',
  roundStartedAt: 0,
  wrongDrops: 0,

  streak: 0,
  topicProgress: {},
  masteredTopics: [],
  totalTopics: ALL_TOPICS.length,

  cursor: { x: 0, y: 0, z: 0, visible: false, pinching: false, pinchStrength: 0 },
  grabbedTileId: null,
  grabSource: null,
  hoverSlotIndex: null,
  cameraStatus: 'idle',
  viewportWidth: 12,

  bursts: [],
  feedback: null,

  startRound: (excludeId) => {
    const sentence = pickRandomSentence(excludeId ?? get().sentence?.id);
    const shuffled = shuffleWords(sentence.words);
    const { slots, homes } = computeLayout(sentence.words.length, get().viewportWidth);
    set({
      sentence,
      tiles: shuffled.map((word, i) => ({
        id: `${sentence.id}-${i}`,
        word,
        homePosition: homes[i],
        state: 'tray',
        slotIndex: null,
      })),
      slots: slots.map((position, index) => ({ index, position, tileId: null })),
      roundState: 'playing',
      roundStartedAt: performance.now(),
      wrongDrops: 0,
      grabbedTileId: null,
      grabSource: null,
      hoverSlotIndex: null,
      feedback: null,
    });
  },

  relayout: (viewportWidth) => {
    const { tiles, slots } = get();
    if (Math.abs(viewportWidth - get().viewportWidth) < 0.01) return;
    const { slots: sp, homes } = computeLayout(slots.length, viewportWidth);
    set({
      viewportWidth,
      slots: slots.map((s, i) => ({ ...s, position: sp[i] })),
      tiles: tiles.map((t, i) => ({ ...t, homePosition: homes[i] })),
    });
  },

  setCursor: (partial) => set((s) => ({ cursor: { ...s.cursor, ...partial } })),

  setCameraStatus: (cameraStatus) => set({ cameraStatus }),

  grabTile: (tileId, source) => {
    const { tiles, grabbedTileId, roundState } = get();
    if (roundState !== 'playing' || grabbedTileId) return false;
    const tile = tiles.find((t) => t.id === tileId);
    // размещённые плашки уже проверены и зафиксированы — их не трогаем
    if (!tile || tile.state !== 'tray') return false;
    set({
      grabbedTileId: tileId,
      grabSource: source,
      tiles: tiles.map((t) => (t.id === tileId ? { ...t, state: 'grabbed' } : t)),
    });
    return true;
  },

  setHoverSlot: (index) => {
    if (get().hoverSlotIndex !== index) set({ hoverSlotIndex: index });
  },

  dropTile: (tileId, slotIndex) => {
    const { tiles, slots, sentence } = get();
    const tile = tiles.find((t) => t.id === tileId);
    if (!tile || !sentence || tile.state !== 'grabbed') return null;

    const base = { grabbedTileId: null, grabSource: null, hoverSlotIndex: null } as const;

    // Отпустили мимо ячеек — тихо возвращаем в лоток
    if (slotIndex === null) {
      set({ ...base, tiles: tiles.map((t) => (t.id === tileId ? { ...t, state: 'tray' } : t)) });
      return null;
    }

    const slot = slots[slotIndex];
    if (slot.tileId !== null) {
      set({
        ...base,
        tiles: tiles.map((t) => (t.id === tileId ? { ...t, state: 'tray' } : t)),
        feedback: { kind: 'occupied', text: 'Ячейка уже занята', id: ++feedbackSeq },
      });
      return 'occupied';
    }

    // Сравниваем по тексту слова, а не по id плашки — в предложении могут
    // быть одинаковые слова ("the ... the"), любое из них подходит.
    const correct = sentence.words[slotIndex] === tile.word;

    if (!correct) {
      set({
        ...base,
        wrongDrops: get().wrongDrops + 1,
        streak: 0,
        topicProgress: { ...get().topicProgress, [sentence.topic]: 0 },
        tiles: tiles.map((t) => (t.id === tileId ? { ...t, state: 'error' } : t)),
        feedback: { kind: 'wrong', text: `«${tile.word}» сюда не подходит`, id: ++feedbackSeq },
      });
      return 'wrong';
    }

    const newSlots = slots.map((s) => (s.index === slotIndex ? { ...s, tileId } : s));
    const newTiles = tiles.map((t) => (t.id === tileId ? { ...t, state: 'placed' as const, slotIndex } : t));
    const complete = newSlots.every((s) => s.tileId !== null);

    let progressPatch: Partial<WordOrderState> = {};
    if (complete) {
      const roundCorrect = get().wrongDrops === 0;
      const prev = get().topicProgress[sentence.topic] ?? 0;
      const next = roundCorrect ? prev + 1 : 0;
      const mastered = new Set(get().masteredTopics);
      if (next >= MASTERY_THRESHOLD) mastered.add(sentence.topic);
      progressPatch = {
        roundState: 'complete',
        streak: roundCorrect ? get().streak + 1 : 0,
        topicProgress: { ...get().topicProgress, [sentence.topic]: next },
        masteredTopics: Array.from(mastered),
        feedback: {
          kind: 'complete',
          text: roundCorrect ? 'Отлично! Предложение собрано' : 'Собрано — но были ошибки',
          id: ++feedbackSeq,
        },
      };
    }

    set({
      ...base,
      slots: newSlots,
      tiles: newTiles,
      bursts: [
        ...get().bursts,
        { id: ++burstSeq, position: slot.position, color: BURST_CORRECT, createdAt: performance.now() },
      ],
      ...(complete ? {} : { feedback: { kind: 'correct', text: 'Верно!', id: ++feedbackSeq } }),
      ...progressPatch,
    });
    return 'correct';
  },

  clearTileError: (tileId) =>
    set((s) => ({
      tiles: s.tiles.map((t) => (t.id === tileId && t.state === 'error' ? { ...t, state: 'tray' } : t)),
    })),

  removeBurst: (id) => set((s) => ({ bursts: s.bursts.filter((b) => b.id !== id) })),

  clearFeedback: (id) => set((s) => (s.feedback?.id === id ? { feedback: null } : {})),

  getRoundResult: () => {
    const { sentence, roundStartedAt, wrongDrops } = get();
    if (!sentence) return null;
    return {
      sentenceId: sentence.id,
      correct: wrongDrops === 0,
      timeSpentMs: Math.round(performance.now() - roundStartedAt),
      attemptCount: wrongDrops + 1,
    };
  },
}));
