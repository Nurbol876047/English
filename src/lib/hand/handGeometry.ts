/**
 * Геометрия руки: типы landmark-данных MediaPipe, расчёт pinch
 * и сглаживание координат.
 *
 * Все вычисления pinch ведутся в НОРМАЛИЗОВАННЫХ координатах кадра видео
 * (0..1), а не в 3D-пространстве сцены — так детекция не зависит от камеры
 * сцены и от того, как мы проецируем руку в мир.
 */

export interface HandLandmark {
  /** 0..1 по ширине кадра */
  x: number;
  /** 0..1 по высоте кадра */
  y: number;
  /** относительная глубина (условные единицы, меньше — ближе к камере) */
  z: number;
}

/** Ровно 21 точка руки MediaPipe */
export type HandLandmarks = readonly HandLandmark[] & { readonly length: 21 };

export type Handedness = 'Left' | 'Right';

/** Индексы ключевых landmark'ов (по спецификации MediaPipe Hands) */
export const LM = {
  WRIST: 0,
  THUMB_TIP: 4,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
} as const;

/** Соединения скелета руки — копия HAND_CONNECTIONS из MediaPipe, чтобы
 *  оверлей камеры не зависел от загрузки самого пакета. */
export const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
];

function dist2D(a: HandLandmark, b: HandLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/**
 * Относительное расстояние щипка.
 *
 * Расстояние «большой палец – указательный» само по себе зависит от того,
 * насколько далеко пользователь от камеры (рука дальше → все расстояния
 * меньше). Поэтому нормализуем его на размер ладони — расстояние
 * «запястье – основание среднего пальца» (landmark 0 → 9). Получаем
 * безразмерный коэффициент: ~0.8–1.2 для раскрытой руки, ~0.15–0.3 для
 * сомкнутых пальцев — одинаковый на любой дистанции.
 */
export function pinchRatio(lm: HandLandmarks): number {
  const palm = dist2D(lm[LM.WRIST], lm[LM.MIDDLE_MCP]);
  if (palm < 1e-4) return 1;
  return dist2D(lm[LM.THUMB_TIP], lm[LM.INDEX_TIP]) / palm;
}

/** 0 — пальцы разведены, 1 — плотно сомкнуты */
export function pinchStrengthFromRatio(ratio: number): number {
  const OPEN = 0.7;
  const CLOSED = 0.2;
  return Math.min(1, Math.max(0, (OPEN - ratio) / (OPEN - CLOSED)));
}

/**
 * Детектор щипка с гистерезисом: включается при ratio < ON, выключается
 * только при ratio > OFF. Без гистерезиса на границе порога захват бы
 * «дребезжал» (grab/release несколько раз за секунду).
 */
export class PinchDetector {
  private pinching = false;

  constructor(
    private readonly onThreshold = 0.35,
    private readonly offThreshold = 0.5,
  ) {}

  update(ratio: number): boolean {
    if (!this.pinching && ratio < this.onThreshold) this.pinching = true;
    else if (this.pinching && ratio > this.offThreshold) this.pinching = false;
    return this.pinching;
  }

  reset(): void {
    this.pinching = false;
  }

  get isPinching(): boolean {
    return this.pinching;
  }
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Экспоненциальное скользящее среднее для 3D-вектора.
 * alpha ~0.3–0.4: достаточно, чтобы убрать дрожание трекинга MediaPipe,
 * но не настолько, чтобы курсор заметно отставал от руки.
 */
export class EmaSmoother3 {
  private value: Vec3 | null = null;

  constructor(private readonly alpha = 0.35) {}

  push(next: Vec3): Vec3 {
    if (!this.value) {
      this.value = { ...next };
    } else {
      const a = this.alpha;
      this.value.x += (next.x - this.value.x) * a;
      this.value.y += (next.y - this.value.y) * a;
      this.value.z += (next.z - this.value.z) * a;
    }
    return { ...this.value };
  }

  reset(): void {
    this.value = null;
  }
}

/** Runtime-проверка, что MediaPipe вернул все 21 точку */
export function isFullHand(lm: readonly HandLandmark[]): lm is HandLandmarks {
  return lm.length === 21;
}
