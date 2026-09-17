'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useWordOrderStore } from '@/store/wordOrderStore';

/**
 * Упрощённый 2D-режим для мобильных: без 3D-сцены и трекинга руки.
 * Тап по слову кладёт его в первую свободную ячейку — проверка та же
 * (store.dropTile), поэтому streak/прогресс считаются одинаково.
 */
export function MobileWordOrder() {
  const tiles = useWordOrderStore((s) => s.tiles);
  const slots = useWordOrderStore((s) => s.slots);
  const grabTile = useWordOrderStore((s) => s.grabTile);
  const dropTile = useWordOrderStore((s) => s.dropTile);

  const placeNext = (tileId: string) => {
    const target = slots.find((s) => s.tileId === null);
    if (!target) return;
    if (grabTile(tileId, 'pointer')) dropTile(tileId, target.index);
  };

  const wordOf = (tileId: string | null) => tiles.find((t) => t.id === tileId)?.word ?? '';

  return (
    <div className="absolute inset-0 flex flex-col justify-start gap-12 px-4 pt-72 pb-32">
      {/* Ячейки */}
      <div className="flex flex-wrap justify-center gap-2">
        {slots.map((slot) => (
          <div
            key={slot.index}
            className={`min-w-[3.2rem] h-12 px-3 rounded-xl border flex items-center justify-center text-base font-medium transition-colors ${
              slot.tileId ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100' : 'border-white/20 bg-white/5 text-white/30'
            }`}
          >
            {slot.tileId ? wordOf(slot.tileId) : slot.index + 1}
          </div>
        ))}
      </div>

      {/* Лоток слов */}
      <div className="flex flex-wrap justify-center gap-2">
        <AnimatePresence>
          {tiles
            .filter((t) => t.state !== 'placed')
            .map((tile) => (
              <motion.button
                key={tile.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={
                  tile.state === 'error'
                    ? { opacity: 1, scale: 1, x: [0, -8, 8, -6, 6, 0], transition: { duration: 0.45 } }
                    : { opacity: 1, scale: 1, x: 0 }
                }
                exit={{ opacity: 0, scale: 0.6 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => placeNext(tile.id)}
                className={`h-12 px-4 rounded-xl border text-base font-medium backdrop-blur-md ${
                  tile.state === 'error'
                    ? 'border-red-400/70 bg-red-500/20 text-red-100'
                    : 'border-white/20 bg-white/10 text-white active:bg-white/20'
                }`}
              >
                {tile.word}
              </motion.button>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
