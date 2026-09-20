'use client';

import { motion } from 'framer-motion';
import type { CefrLevel } from '@/lib/elemental-match/words';

interface Props {
  word: string;
  level: CefrLevel;
  roundIndex: number;
  totalRounds: number;
}

/** Текущее слово — крупно по центру, fade+scale при смене */
export function WordCard({ word, level, roundIndex, totalRounds }: Props) {
  return (
    <motion.div
      key={word}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="text-center"
    >
      <p className="text-white/45 text-xs uppercase tracking-widest">
        Round {roundIndex + 1} / {totalRounds} · {level}
      </p>
      <h2 className="mt-3 text-5xl md:text-6xl font-bold text-white tracking-wide break-words">{word}</h2>
      <p className="mt-3 text-white/55 text-sm">Pick the meaning before time runs out</p>
    </motion.div>
  );
}
