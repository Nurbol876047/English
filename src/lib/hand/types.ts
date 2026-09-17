/**
 * Общие типы для упражнений с управлением рукой (Word Order, Sort the Words).
 * Каждый модуль держит эти сущности в своём zustand-сторе, а общие
 * компоненты (курсор, частицы, баннер) получают их через props.
 */

export type Vec3Tuple = readonly [number, number, number];

export interface HandCursor {
  x: number;
  y: number;
  z: number;
  visible: boolean;
  pinching: boolean;
  /** 0..1 — насколько плотно сомкнуты пальцы */
  pinchStrength: number;
}

export const EMPTY_CURSOR: HandCursor = { x: 0, y: 0, z: 0, visible: false, pinching: false, pinchStrength: 0 };

export interface ParticleBurst {
  id: number;
  position: Vec3Tuple;
  color: string;
  createdAt: number;
}

export type FeedbackKind = 'correct' | 'wrong' | 'occupied' | 'complete';

export interface Feedback {
  kind: FeedbackKind;
  text: string;
  id: number;
}

/** Источник ввода, который сейчас «держит» объект */
export type GrabSource = 'hand' | 'pointer' | null;
