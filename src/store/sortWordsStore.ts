import { create } from 'zustand';
import {
  PASS_RATIO,
  SET_MASTERY_THRESHOLD,
  getSet,
  pickRandomSet,
  shuffle,
  type BasketColor,
  type SetWord,
  type WordSet,
} from '@/lib/sort-words/wordSets';
import { EMPTY_CURSOR, type Feedback, type GrabSource, type HandCursor, type ParticleBurst, type Vec3Tuple } from '@/lib/hand/types';
import type { HandTrackingStatus } from '@/hooks/hand/useMediaPipeHands';

export type ControlMode = 'pinch' | 'swipe';
export type WordState = 'incoming' | 'waiting' | 'grabbed' | 'flying' | 'rejected';
export type RoundState = 'idle' | 'playing' | 'finished';
export type SortResult = 'correct' | 'wrong';

export interface ActiveWord extends SetWord {
  id: string;
  state: WordState;
  /** Корзина, куда летит слово (state === 'flying') */
  targetBasket: number | null;
  /** Полёт по ошибке (hard-mode) — засчитан как неверный */
  flewWrong: boolean;
  /** Когда слово стало 'waiting' — для бонуса за скорость */
  shownAt: number;
}

export interface Basket {
  index: number;
  id: string;
  label: string;
  color: BasketColor;
  position: Vec3Tuple;
  count: number;
}

export interface SortRoundResult {
  setId: string;
  total: number;
  correct: number;
  wrong: number;
  score: number;
  timeSpentMs: number;
  controlMode: ControlMode;
  passed: boolean;
}

/** Отладка свайпа (dev-only HUD) */
export interface SwipeDebug {
  speed: number;
  angle: number;
}

interface SortWordsState {
  // ── раунд ────────────────────────────────────────────────
  activeSet: WordSet | null;
  queue: SetWord[];
  currentWord: ActiveWord | null;
  baskets: Basket[];
  roundState: RoundState;
  roundStartedAt: number;
  timeLimitMs: number;
  timeLeftMs: number;
  hardMode: boolean;
  score: number;
  streak: number;
  correctCount: number;
  wrongCount: number;
  totalWords: number;
  bestTimeMs: number | null;

  // ── прогресс ─────────────────────────────────────────────
  setProgress: Record<string, number>;
  masteredSets: string[];
  lastResult: SortRoundResult | null;

  // ── ввод ─────────────────────────────────────────────────
  controlMode: ControlMode;
  cursor: HandCursor;
  grabSource: GrabSource;
  hoverBasket: number | null;
  /** Корзина-«прицел» при движении ладони в режиме swipe */
  aimBasket: number | null;
  cameraStatus: HandTrackingStatus;
  swipeDebug: SwipeDebug;

  // ── эффекты ──────────────────────────────────────────────
  bursts: ParticleBurst[];
  feedback: Feedback | null;

  // ── actions ──────────────────────────────────────────────
  startRound: (setId?: string) => void;
  spawnNext: () => void;
  finishRound: () => void;
  tick: (now: number) => void;
  setControlMode: (mode: ControlMode) => void;
  setHardMode: (on: boolean) => void;
  setCursor: (cursor: Partial<HandCursor>) => void;
  setHoverBasket: (index: number | null) => void;
  setAimBasket: (index: number | null) => void;
  setCameraStatus: (status: HandTrackingStatus) => void;
  setSwipeDebug: (d: SwipeDebug) => void;
  grabWord: (source: Exclude<GrabSource, null>) => boolean;
  /** Отпустить без корзины — слово возвращается в ожидание */
  releaseWord: () => void;
  /** Отправить текущее слово в корзину. Возвращает результат проверки */
  sortWord: (basketIndex: number) => SortResult | null;
  /** Слово прилетело в точку ожидания (incoming → waiting) */
  onArrive: () => void;
  /** Слово долетело до корзины (вызывает сцена по окончании анимации) */
  onFlightEnd: () => void;
  /** Отскок после ошибки закончился — слово снова ждёт */
  onRejectEnd: () => void;
  removeBurst: (id: number) => void;
  clearFeedback: (id: number) => void;
}

const BASKET_X: readonly number[] = [-3.6, 0, 3.6];
export const BASKET_Y = -2.2;
export const WAIT_POINT: Vec3Tuple = [0, 0.8, 0];
export const ROUND_TIME_MS = 60_000;

export const BASKET_HEX: Record<BasketColor, string> = {
  sky: '#38bdf8',
  violet: '#a78bfa',
  emerald: '#34d399',
};

let burstSeq = 0;
let feedbackSeq = 0;
let wordSeq = 0;

export const useSortWordsStore = create<SortWordsState>((set, get) => ({
  activeSet: null,
  queue: [],
  currentWord: null,
  baskets: [],
  roundState: 'idle',
  roundStartedAt: 0,
  timeLimitMs: ROUND_TIME_MS,
  timeLeftMs: ROUND_TIME_MS,
  hardMode: false,
  score: 0,
  streak: 0,
  correctCount: 0,
  wrongCount: 0,
  totalWords: 0,
  bestTimeMs: null,

  setProgress: {},
  masteredSets: [],
  lastResult: null,

  controlMode: 'pinch',
  cursor: EMPTY_CURSOR,
  grabSource: null,
  hoverBasket: null,
  aimBasket: null,
  cameraStatus: 'idle',
  swipeDebug: { speed: 0, angle: 0 },

  bursts: [],
  feedback: null,

  startRound: (setId) => {
    const activeSet = (setId ? getSet(setId) : undefined) ?? pickRandomSet(get().activeSet?.id);
    const queue = shuffle(activeSet.words);
    set({
      activeSet,
      queue,
      currentWord: null,
      baskets: activeSet.categories.map((cat, index) => ({
        index,
        id: cat.id,
        label: cat.label,
        color: cat.color,
        position: [BASKET_X[index], BASKET_Y, 0] as const,
        count: 0,
      })),
      roundState: 'playing',
      roundStartedAt: performance.now(),
      timeLeftMs: get().timeLimitMs,
      score: 0,
      streak: 0,
      correctCount: 0,
      wrongCount: 0,
      totalWords: queue.length,
      bestTimeMs: null,
      lastResult: null,
      grabSource: null,
      hoverBasket: null,
      aimBasket: null,
      feedback: null,
    });
    get().spawnNext();
  },

  spawnNext: () => {
    const { queue, roundState, currentWord } = get();
    if (roundState !== 'playing' || currentWord) return;
    if (queue.length === 0) {
      get().finishRound();
      return;
    }
    const [next, ...rest] = queue;
    set({
      queue: rest,
      currentWord: { ...next, id: `w${++wordSeq}`, state: 'incoming', targetBasket: null, flewWrong: false, shownAt: performance.now() },
    });
  },

  finishRound: () => {
    const s = get();
    if (s.roundState !== 'playing' || !s.activeSet) return;
    const passed = s.correctCount / Math.max(1, s.totalWords) >= PASS_RATIO;
    const prev = s.setProgress[s.activeSet.id] ?? 0;
    const next = passed ? prev + 1 : 0;
    const mastered = new Set(s.masteredSets);
    if (next >= SET_MASTERY_THRESHOLD) mastered.add(s.activeSet.id);
    set({
      roundState: 'finished',
      currentWord: null,
      grabSource: null,
      hoverBasket: null,
      aimBasket: null,
      setProgress: { ...s.setProgress, [s.activeSet.id]: next },
      masteredSets: Array.from(mastered),
      lastResult: {
        setId: s.activeSet.id,
        total: s.totalWords,
        correct: s.correctCount,
        wrong: s.wrongCount,
        score: s.score,
        timeSpentMs: Math.round(performance.now() - s.roundStartedAt),
        controlMode: s.controlMode,
        passed,
      },
    });
  },

  tick: (now) => {
    const s = get();
    if (s.roundState !== 'playing') return;
    const left = Math.max(0, s.timeLimitMs - (now - s.roundStartedAt));
    set({ timeLeftMs: left });
    if (left <= 0) get().finishRound();
  },

  setControlMode: (controlMode) => set({ controlMode, hoverBasket: null, aimBasket: null }),
  setHardMode: (hardMode) => set({ hardMode }),
  setCursor: (partial) => set((s) => ({ cursor: { ...s.cursor, ...partial } })),
  setHoverBasket: (index) => {
    if (get().hoverBasket !== index) set({ hoverBasket: index });
  },
  setAimBasket: (index) => {
    if (get().aimBasket !== index) set({ aimBasket: index });
  },
  setCameraStatus: (cameraStatus) => set({ cameraStatus }),
  setSwipeDebug: (swipeDebug) => set({ swipeDebug }),

  grabWord: (source) => {
    const { currentWord, roundState } = get();
    if (roundState !== 'playing' || !currentWord || currentWord.state !== 'waiting') return false;
    set({ currentWord: { ...currentWord, state: 'grabbed' }, grabSource: source });
    return true;
  },

  releaseWord: () => {
    const { currentWord } = get();
    if (!currentWord || currentWord.state !== 'grabbed') return;
    set({ currentWord: { ...currentWord, state: 'waiting' }, grabSource: null, hoverBasket: null });
  },

  sortWord: (basketIndex) => {
    const s = get();
    const word = s.currentWord;
    const basket = s.baskets[basketIndex];
    if (!word || !basket || s.roundState !== 'playing') return null;
    if (word.state !== 'waiting' && word.state !== 'grabbed') return null;

    const correct = word.category === basket.id;
    const base = { grabSource: null, hoverBasket: null, aimBasket: null } as const;

    if (correct) {
      const reactionMs = performance.now() - word.shownAt;
      const bonus = reactionMs < 2000 ? 5 : 0;
      set({
        ...base,
        currentWord: { ...word, state: 'flying', targetBasket: basketIndex },
        score: s.score + 10 + bonus,
        streak: s.streak + 1,
        correctCount: s.correctCount + 1,
        bestTimeMs: s.bestTimeMs === null ? reactionMs : Math.min(s.bestTimeMs, reactionMs),
        feedback: { kind: 'correct', text: bonus ? 'Correct! +15' : 'Correct! +10', id: ++feedbackSeq },
      });
      return 'correct';
    }

    const hint = word.hint ? ` — ${word.hint}` : '';
    const wrongPatch = {
      ...base,
      score: Math.max(0, s.score - 5),
      streak: 0,
      wrongCount: s.wrongCount + 1,
      feedback: { kind: 'wrong' as const, text: `“${word.text}” is not ${basket.label}${hint}`, id: ++feedbackSeq },
      bursts: [
        ...s.bursts,
        { id: ++burstSeq, position: s.hardMode ? basket.position : WAIT_POINT, color: '#ef4444', createdAt: performance.now() },
      ],
    };
    if (s.hardMode) {
      // hard-mode: слово улетает в неправильную корзину и второго шанса нет
      set({ ...wrongPatch, currentWord: { ...word, state: 'flying', targetBasket: basketIndex, flewWrong: true } });
    } else {
      set({ ...wrongPatch, currentWord: { ...word, state: 'rejected' } });
    }
    return 'wrong';
  },

  onArrive: () => {
    const word = get().currentWord;
    if (!word || word.state !== 'incoming') return;
    set({ currentWord: { ...word, state: 'waiting', shownAt: performance.now() } });
  },

  onFlightEnd: () => {
    const s = get();
    const word = s.currentWord;
    if (!word || word.state !== 'flying' || word.targetBasket === null) return;
    const basket = s.baskets[word.targetBasket];
    set({
      currentWord: null,
      baskets: s.baskets.map((b) => (b.index === basket.index ? { ...b, count: b.count + 1 } : b)),
      bursts: word.flewWrong
        ? s.bursts
        : [...s.bursts, { id: ++burstSeq, position: basket.position, color: BASKET_HEX[basket.color], createdAt: performance.now() }],
    });
  },

  onRejectEnd: () => {
    const word = get().currentWord;
    if (!word || word.state !== 'rejected') return;
    set({ currentWord: { ...word, state: 'waiting', shownAt: performance.now() } });
  },

  removeBurst: (id) => set((s) => ({ bursts: s.bursts.filter((b) => b.id !== id) })),
  clearFeedback: (id) => set((s) => (s.feedback?.id === id ? { feedback: null } : {})),
}));
