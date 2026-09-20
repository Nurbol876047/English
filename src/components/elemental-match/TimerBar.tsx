'use client';

import { useEffect, useRef } from 'react';
import type { TimerFrameListener } from '@/hooks/useCountdownTimer';

interface Props {
  subscribe: (listener: TimerFrameListener) => () => void;
}

/**
 * Тонкая полоса таймера. Двигается через transform: scaleX прямо в DOM
 * из кадров таймера — без React-перерисовок, поэтому не дёргается при
 * быстрой смене раундов. Цвет плавно уходит из зелёного в красный.
 */
export function TimerBar({ subscribe }: Props) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      subscribe((progress) => {
        const el = barRef.current;
        if (!el) return;
        el.style.transform = `scaleX(${progress})`;
        // hue 140 (зелёный) → 0 (красный)
        el.style.backgroundColor = `hsl(${Math.round(140 * progress)} 75% 60%)`;
      }),
    [subscribe],
  );

  return (
    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden" aria-hidden>
      <div ref={barRef} className="h-full w-full origin-left rounded-full will-change-transform" style={{ backgroundColor: '#5fd88f' }} />
    </div>
  );
}
