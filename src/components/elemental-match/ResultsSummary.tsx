'use client';

import { motion } from 'framer-motion';
import { Flame, RotateCcw, Trophy } from 'lucide-react';

interface Props {
  correctCount: number;
  totalRounds: number;
  bestStreak: number;
  masteredCount: number;
  totalWords: number;
  onPlayAgain: () => void;
}

/** Экран итогов после сессии */
export function ResultsSummary({ correctCount, totalRounds, bestStreak, masteredCount, totalWords, onPlayAgain }: Props) {
  const ratio = correctCount / totalRounds;
  const title = ratio >= 0.9 ? 'Master of all elements!' : ratio >= 0.6 ? 'Well played!' : 'Keep training!';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22 }}
      className="text-center"
    >
      <p className="text-white/45 text-xs uppercase tracking-widest">Session complete</p>
      <h2 className="mt-2 text-3xl md:text-4xl font-bold text-white">{title}</h2>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Correct" value={`${correctCount} / ${totalRounds}`} cls="text-[#5fd88f]" />
        <Stat label="Best streak" value={String(bestStreak)} cls="text-orange-300" icon={<Flame size={18} />} />
        <Stat label="Mastered" value={`${masteredCount} / ${totalWords}`} cls="text-yellow-300" icon={<Trophy size={18} />} />
      </div>

      <button
        type="button"
        onClick={onPlayAgain}
        className="mt-7 inline-flex items-center gap-2 rounded-2xl border border-[#6c8cff]/60 bg-[#6c8cff]/25 px-6 py-3 text-white font-semibold hover:bg-[#6c8cff]/40 transition-colors"
      >
        <RotateCcw size={18} /> Play again
      </button>
    </motion.div>
  );
}

function Stat({ label, value, cls, icon }: { label: string; value: string; cls: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#151a26]/70 px-3 py-4">
      <p className={`text-2xl md:text-3xl font-bold flex items-center justify-center gap-1.5 ${cls}`}>
        {icon}
        {value}
      </p>
      <p className="mt-1 text-xs text-white/50 uppercase tracking-wider">{label}</p>
    </div>
  );
}
