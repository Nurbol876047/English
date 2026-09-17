/**
 * Геометрия свайпа: проверка «ладонь открыта» по landmark'ам и детектор
 * взмаха по истории позиций. Чистая логика без React — легко тестировать.
 */

import type { HandLandmarks } from '@/lib/hand/handGeometry';

export type SwipeDirection = 'left' | 'up' | 'right';

/**
 * Ладонь открыта, если ≥ 3 из 4 пальцев (указательный, средний, безымянный,
 * мизинец) вытянуты: кончик (8/12/16/20) дальше от запястья (0), чем
 * PIP-сустав (6/10/14/18). Считаем в нормализованных координатах кадра.
 * Большой палец не учитываем — его положение при взмахе нестабильно.
 */
export function isPalmOpen(lm: HandLandmarks): boolean {
  const wrist = lm[0];
  const fingers: ReadonlyArray<readonly [number, number]> = [
    [8, 6],
    [12, 10],
    [16, 14],
    [20, 18],
  ];
  let extended = 0;
  for (const [tip, pip] of fingers) {
    const dTip = Math.hypot(lm[tip].x - wrist.x, lm[tip].y - wrist.y);
    const dPip = Math.hypot(lm[pip].x - wrist.x, lm[pip].y - wrist.y);
    if (dTip > dPip) extended++;
  }
  return extended >= 3;
}

/** Направление по углу движения (градусы, 0 = вправо, 90 = вверх) */
export function directionFromAngle(deg: number): SwipeDirection | null {
  const a = ((deg % 360) + 360) % 360;
  if (a >= 150 && a <= 210) return 'left';
  if (a >= 60 && a <= 120) return 'up';
  if (a <= 30 || a >= 330) return 'right';
  return null; // диагонали и «вниз» игнорируем
}

export interface SwipeSample {
  x: number;
  y: number;
  t: number;
  open: boolean;
}

export interface SwipeConfig {
  /** размер окна в кадрах (~0.5 с при 22 fps) */
  windowSize: number;
  /** на сколько кадров назад смотрим для Δ */
  lookback: number;
  /** скорость начала жеста, мировых единиц/с */
  onSpeed: number;
  /** скорость, ниже которой жест считается законченным */
  offSpeed: number;
  /** скорость, с которой уже показываем «прицел» на корзину */
  aimSpeed: number;
  /** доля кадров окна с открытой ладонью */
  minOpenRatio: number;
  /** пауза после засчитанного свайпа, мс */
  cooldownMs: number;
}

export const DEFAULT_SWIPE_CONFIG: SwipeConfig = {
  windowSize: 12,
  lookback: 6,
  onSpeed: 6.0,
  offSpeed: 2.0,
  aimSpeed: 2.5,
  minOpenRatio: 0.7,
  cooldownMs: 600,
};

export interface SwipeReading {
  /** мгновенная скорость, ед/с */
  speed: number;
  /** угол движения, градусы */
  angle: number;
  /** куда сейчас направлено движение (для подсветки-прицела), если v > aimSpeed */
  aim: SwipeDirection | null;
  /** засчитанный на этом кадре свайп */
  swipe: SwipeDirection | null;
}

/**
 * Детектор взмаха по кольцевому буферу позиций.
 *
 * Алгоритм на каждом кадре:
 *   Δ = pos[now] − pos[now − lookback], v = |Δ| / Δt.
 *   Свайп засчитан, если v > onSpeed, ладонь была открыта на ≥ minOpenRatio
 *   кадров окна и направление попадает в один из трёх секторов.
 *   Гистерезис: после срабатывания ждём, пока v < offSpeed, — иначе один
 *   взмах засчитается несколько раз. Плюс cooldown, чтобы не поймать
 *   «возврат руки» в исходное положение как встречный свайп.
 *
 * Буфер фиксированного размера — аллокаций на кадр нет.
 */
export class SwipeDetector {
  private readonly buf: SwipeSample[];
  private head = 0;
  private count = 0;
  private armed = true;
  private cooldownUntil = 0;

  constructor(private readonly cfg: SwipeConfig = DEFAULT_SWIPE_CONFIG) {
    this.buf = Array.from({ length: cfg.windowSize }, () => ({ x: 0, y: 0, t: 0, open: false }));
  }

  reset(): void {
    this.count = 0;
    this.head = 0;
    this.armed = true;
  }

  private at(indexFromNewest: number): SwipeSample {
    // head указывает на следующую позицию записи; newest = head-1
    const i = (this.head - 1 - indexFromNewest + this.buf.length * 2) % this.buf.length;
    return this.buf[i];
  }

  push(x: number, y: number, t: number, open: boolean): SwipeReading {
    const s = this.buf[this.head];
    s.x = x;
    s.y = y;
    s.t = t;
    s.open = open;
    this.head = (this.head + 1) % this.buf.length;
    if (this.count < this.buf.length) this.count++;

    const empty: SwipeReading = { speed: 0, angle: 0, aim: null, swipe: null };
    if (this.count <= this.cfg.lookback) return empty;

    const newest = this.at(0);
    const old = this.at(this.cfg.lookback);
    const dt = (newest.t - old.t) / 1000;
    if (dt <= 0) return empty;

    const dx = newest.x - old.x;
    const dy = newest.y - old.y;
    const speed = Math.hypot(dx, dy) / dt;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const dir = directionFromAngle(angle);

    let openFrames = 0;
    const n = Math.min(this.count, this.cfg.windowSize);
    for (let i = 0; i < n; i++) if (this.at(i).open) openFrames++;
    const openOk = openFrames / n >= this.cfg.minOpenRatio;

    const aim = speed > this.cfg.aimSpeed && openOk ? dir : null;

    // гистерезис: перезаряжаемся только когда рука замедлилась
    if (!this.armed && speed < this.cfg.offSpeed) this.armed = true;

    let swipe: SwipeDirection | null = null;
    if (this.armed && t >= this.cooldownUntil && speed > this.cfg.onSpeed && openOk && dir) {
      swipe = dir;
      this.armed = false;
      this.cooldownUntil = t + this.cfg.cooldownMs;
    }
    return { speed, angle, aim, swipe };
  }
}

/** Индекс корзины по направлению: влево → 0, вверх → 1, вправо → 2 */
export function basketForDirection(dir: SwipeDirection): number {
  return dir === 'left' ? 0 : dir === 'up' ? 1 : 2;
}
