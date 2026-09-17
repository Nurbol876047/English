'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Ban, Sparkles } from 'lucide-react';
import type { Feedback } from '@/lib/hand/types';

const STYLE = {
  correct: { cls: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-100', Icon: CheckCircle2, ttl: 1200 },
  complete: { cls: 'bg-emerald-500/25 border-emerald-300/60 text-emerald-50', Icon: Sparkles, ttl: 1800 },
  wrong: { cls: 'bg-red-500/20 border-red-400/50 text-red-100', Icon: XCircle, ttl: 1600 },
  occupied: { cls: 'bg-amber-500/20 border-amber-400/50 text-amber-100', Icon: Ban, ttl: 1400 },
} as const;

interface Props {
  feedback: Feedback | null;
  onClear: (id: number) => void;
}

/** Всплывающий баннер результата проверки — сам гаснет по таймеру */
export function FeedbackBanner({ feedback, onClear: clearFeedback }: Props) {
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => clearFeedback(feedback.id), STYLE[feedback.kind].ttl);
    return () => clearTimeout(t);
  }, [feedback, clearFeedback]);

  return (
    <div className="absolute left-1/2 bottom-32 md:bottom-auto md:top-[38%] -translate-x-1/2 pointer-events-none z-20">
      <AnimatePresence mode="wait">
        {feedback && (
          <motion.div
            key={feedback.id}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl ${STYLE[feedback.kind].cls}`}
          >
            {(() => {
              const Icon = STYLE[feedback.kind].Icon;
              return <Icon size={22} />;
            })()}
            <span className="font-medium">{feedback.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
