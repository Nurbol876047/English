'use client';

import { motion } from 'framer-motion';
import type { Topic } from '@/lib/elemental-match/words';

interface Props {
  word: string;
  topic: Topic;
  roundIndex: number;
  totalRounds: number;
}

/** Текущий вопрос — крупно по центру, fade+scale при смене */
export function WordCard({ word, topic, roundIndex, totalRounds }: Props) {
  return (
    <motion.div
      key={word}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="text-center"
    >
      <p className="text-white/45 text-xs uppercase tracking-widest">
        Round {roundIndex + 1} / {totalRounds} · {topic}
      </p>
      <h2 className="mt-3 text-2xl md:text-4xl font-bold text-white leading-snug break-words">{word}</h2>
      <p className="mt-3 text-white/55 text-sm">Choose the correct answer</p>
    </motion.div>
  );
}
