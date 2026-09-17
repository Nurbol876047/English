'use client';

import { useMemo } from 'react';
import { DEFAULT_SWIPE_CONFIG, SwipeDetector, type SwipeConfig } from '@/lib/sort-words/swipeGeometry';

/**
 * Экземпляр детектора свайпа, живущий столько же, сколько компонент.
 * Вся логика — в SwipeDetector (lib/sort-words/swipeGeometry.ts).
 */
export function useSwipeDetector(config: Partial<SwipeConfig> = {}): SwipeDetector {
  // конфиг стабилен на время жизни — пересоздаём только при смене ключевых порогов
  return useMemo(
    () => new SwipeDetector({ ...DEFAULT_SWIPE_CONFIG, ...config }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.onSpeed, config.offSpeed, config.aimSpeed, config.cooldownMs, config.windowSize, config.lookback, config.minOpenRatio],
  );
}
