'use client';

import { motion } from 'framer-motion';

export type OptionState = 'idle' | 'correct' | 'wrong' | 'dimmed';

interface Props {
  label: string;
  state: OptionState;
  disabled: boolean;
  onSelect: () => void;
}

const STATE_CLS: Record<OptionState, string> = {
  idle: 'bg-[#151a26]/80 border-white/15 text-white hover:border-[#6c8cff]/70 hover:bg-[#1b2233]/90',
  correct: 'bg-[#5fd88f]/20 border-[#5fd88f] text-white shadow-[0_0_24px_rgba(95,216,143,0.35)]',
  wrong: 'bg-[#ff6b6b]/20 border-[#ff6b6b] text-white shadow-[0_0_24px_rgba(255,107,107,0.3)]',
  dimmed: 'bg-[#151a26]/50 border-white/10 text-white/40',
};

/** Кнопка варианта: крупная тап-зона, подсветка верно/неверно после ответа */
export function OptionButton({ label, state, disabled, onSelect }: Props) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={`min-h-14 w-full rounded-2xl border-2 px-4 py-3 text-base md:text-lg font-medium backdrop-blur-md transition-colors duration-200 disabled:cursor-default ${STATE_CLS[state]}`}
    >
      {label}
    </motion.button>
  );
}
