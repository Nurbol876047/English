'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, TimerOff, XCircle } from 'lucide-react';
import type { RoundOutcome } from '@/hooks/useElementalMatchGame';

interface Props {
  outcome: RoundOutcome;
  correctAnswer: string;
}

/** Короткая вспышка результата раунда: ✅ / ❌ (+ правильный ответ) / ⏱ время вышло */
export function RoundFeedback({ outcome, correctAnswer }: Props) {
  const cls = outcome.correct
    ? 'bg-[#5fd88f]/20 border-[#5fd88f]/60 text-emerald-50'
    : outcome.timedOut
      ? 'bg-amber-500/20 border-amber-400/60 text-amber-50'
      : 'bg-[#ff6b6b]/20 border-[#ff6b6b]/60 text-red-50';
  const Icon = outcome.correct ? CheckCircle2 : outcome.timedOut ? TimerOff : XCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      className={`flex items-center gap-3 rounded-2xl border px-5 py-3 backdrop-blur-xl shadow-2xl ${cls}`}
    >
      <Icon size={22} />
      <div className="text-left">
        <p className="font-semibold">{outcome.correct ? 'Correct!' : outcome.timedOut ? '⏱ Time’s up' : 'Not quite'}</p>
        {!outcome.correct && (
          <p className="text-sm opacity-80">
            Correct answer: <span className="font-medium">{correctAnswer}</span>
          </p>
        )}
      </div>
    </motion.div>
  );
}
