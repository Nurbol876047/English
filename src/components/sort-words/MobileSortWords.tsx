'use client';

import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { BASKET_HEX, useSortWordsStore } from '@/store/sortWordsStore';

/**
 * 2D-режим для мобильных: слово в центре, три кнопки-категории снизу.
 * Тап по категории или drag плашки в её сторону (влево / вверх / вправо).
 * Проверка — та же store.sortWord.
 */
export function MobileSortWords() {
  const word = useSortWordsStore((s) => s.currentWord);
  const baskets = useSortWordsStore((s) => s.baskets);
  const sortWord = useSortWordsStore((s) => s.sortWord);
  const onArrive = useSortWordsStore((s) => s.onArrive);
  const onFlightEnd = useSortWordsStore((s) => s.onFlightEnd);

  const canAct = word?.state === 'waiting';

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (!canAct) return;
    const { x, y } = info.offset;
    if (y < -80 && Math.abs(x) < 120) sortWord(1);
    else if (x < -80) sortWord(0);
    else if (x > 80) sortWord(2);
  };

  const target = word?.state === 'flying' && word.targetBasket !== null ? word.targetBasket : null;
  const flyX = target === null ? 0 : (target - 1) * 130;

  return (
    <div className="absolute inset-0 flex flex-col justify-end items-center gap-10 px-4 pb-40">
      <div className="h-32 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {word && (
            <motion.div
              key={word.id}
              drag={canAct}
              dragSnapToOrigin
              onDragEnd={onDragEnd}
              onAnimationComplete={() => {
                if (word.state === 'incoming') onArrive();
                if (word.state === 'flying') onFlightEnd();
              }}
              initial={{ opacity: 0, scale: 0.5, y: -60 }}
              animate={
                word.state === 'flying'
                  ? { opacity: 0, scale: 0.4, x: flyX, y: 200, transition: { duration: 0.45 } }
                  : word.state === 'rejected'
                    ? { opacity: 1, scale: 1, x: [0, -10, 10, -8, 8, 0], y: 0, transition: { duration: 0.45 } }
                    : { opacity: 1, scale: 1, x: 0, y: 0, transition: { duration: 0.35 } }
              }
              exit={{ opacity: 0 }}
              className={`px-6 py-4 rounded-2xl border text-xl font-semibold backdrop-blur-md select-none touch-none ${
                word.state === 'rejected' ? 'border-red-400/70 bg-red-500/20 text-red-100' : 'border-white/25 bg-white/10 text-white'
              }`}
            >
              {word.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-3 gap-2 w-full max-w-md">
        {baskets.map((b) => (
          <button
            key={b.index}
            onClick={() => canAct && sortWord(b.index)}
            className="h-16 rounded-2xl border backdrop-blur-md text-sm font-semibold transition-transform active:scale-95"
            style={{ borderColor: `${BASKET_HEX[b.color]}99`, backgroundColor: `${BASKET_HEX[b.color]}22`, color: BASKET_HEX[b.color] }}
          >
            {b.label}
            <span className="block text-xs opacity-60 font-normal">{b.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
