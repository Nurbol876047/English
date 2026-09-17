/**
 * Синтезированные звуки через Web Audio API — без внешних аудиофайлов.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(
  ac: AudioContext,
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType,
  gain: number,
): void {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** Мягкий «колокольчик» — правильное слово */
export function playChime(): void {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 880, t, 0.35, 'sine', 0.18);
  tone(ac, 1320, t + 0.08, 0.4, 'sine', 0.12);
  tone(ac, 1760, t + 0.16, 0.5, 'triangle', 0.06);
}

/** Аккорд — предложение собрано */
export function playSuccess(): void {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ac, f, t + i * 0.09, 0.6, 'sine', 0.14));
}

/** Короткий низкий «бзз» — ошибка */
export function playError(): void {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 180, t, 0.18, 'sawtooth', 0.08);
  tone(ac, 140, t + 0.1, 0.22, 'sawtooth', 0.08);
}
