'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Flame, Timer, Trophy, Zap } from 'lucide-react';
import { TIMER_DURATION_MS, useElementalMatchGame, type ExerciseCompleteHandler } from '@/hooks/useElementalMatchGame';
import { useElementalMatchStore } from '@/store/elementalMatchStore';
import { WORDS } from '@/lib/elemental-match/words';
import { TimerBar } from './TimerBar';
import { WordCard } from './WordCard';
import { OptionButton, type OptionState } from './OptionButton';
import { RoundFeedback } from './RoundFeedback';
import { ResultsSummary } from './ResultsSummary';

interface Props {
  /** Точка интеграции с общим прогрессом платформы Lingova */
  onExerciseComplete?: ExerciseCompleteHandler;
}

const card = 'bg-white/[0.07] backdrop-blur-md rounded-2xl border border-white/15 shadow-xl';

/** Корневой компонент: HUD + карточка вопроса / итоги */
export function ElementalMatchGame({ onExerciseComplete }: Props) {
  const game = useElementalMatchGame(onExerciseComplete);
  const streak = useElementalMatchStore((s) => s.streak);
  const bestStreak = useElementalMatchStore((s) => s.bestStreak);
  const correctCount = useElementalMatchStore((s) => s.correctCount);
  const masteredCount = useElementalMatchStore((s) => s.masteredWords.length);

  const { round, outcome, phase } = game;
  const answered = phase !== 'question';

  const optionState = (i: number): OptionState => {
    if (!outcome) return 'idle';
    if (i === round.correctIndex) return 'correct';
    if (i === outcome.selectedIndex) return 'wrong';
    return 'dimmed';
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-6 z-10">
      {/* Верх */}
      <div className="flex justify-between items-start gap-3">
        <div className={`${card} px-3 py-2 md:p-4 flex items-center gap-3`}>
          <Link href="/" className="text-white/50 hover:text-white transition-colors" title="Back to the arena">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#6c8cff] via-sky-300 to-emerald-300 bg-clip-text text-transparent">
              Lingova
            </h1>
            <p className="text-white/60 text-xs md:text-sm mt-0.5 whitespace-nowrap flex items-center gap-1.5">
              <Zap size={14} className="text-[#6c8cff]" /> Elemental Match
            </p>
          </div>
        </div>

        <div className="flex gap-2 md:gap-3">
          <div className={`${card} px-3 py-2 md:px-4 md:py-3 flex flex-col items-end`}>
            <span className="text-white/50 text-[10px] md:text-xs uppercase tracking-wider">Streak</span>
            <span className="text-2xl md:text-3xl font-bold text-white flex items-center gap-1.5">
              <Flame size={20} className={streak > 2 ? 'text-orange-400 animate-pulse' : 'text-white/25'} />
              {streak}
            </span>
          </div>
          <div className={`${card} px-3 py-2 md:px-4 md:py-3 flex flex-col items-end`}>
            <span className="text-white/50 text-[10px] md:text-xs uppercase tracking-wider">Correct</span>
            <span className="text-2xl md:text-3xl font-bold text-white whitespace-nowrap">
              {correctCount} / {game.totalRounds}
            </span>
          </div>
          <div className={`${card} px-3 py-2 md:px-4 md:py-3 hidden sm:flex flex-col items-end`}>
            <span className="text-white/50 text-[10px] md:text-xs uppercase tracking-wider">Time</span>
            <span className={`text-2xl md:text-3xl font-bold flex items-center gap-1.5 tabular-nums ${phase === 'question' && game.secondsLeft <= 2 ? 'text-[#ff6b6b]' : 'text-white'}`}>
              <Timer size={20} className="text-white/40" />
              {phase === 'question' ? game.secondsLeft : '–'}
            </span>
          </div>
        </div>
      </div>

      {/* Центр */}
      <div className="flex-1 min-h-0 flex items-center justify-center py-4 overflow-y-auto">
        <div className={`${card} w-full max-w-2xl px-5 py-6 md:px-10 md:py-8 my-auto relative`}>
          {phase === 'summary' ? (
            <ResultsSummary
              correctCount={correctCount}
              totalRounds={game.totalRounds}
              bestStreak={bestStreak}
              masteredCount={masteredCount}
              totalWords={WORDS.length}
              onPlayAgain={game.playAgain}
            />
          ) : (
            <>
              <WordCard word={round.word.word} topic={round.word.topic} roundIndex={round.index} totalRounds={game.totalRounds} />

              <div className="mt-5">
                <TimerBar subscribe={game.subscribeTimer} />
              </div>

              <motion.div
                key={round.index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                className="mt-6 grid grid-cols-1 gap-3"
              >
                {round.options.map((opt, i) => (
                  <OptionButton key={`${round.index}-${i}`} label={`${'ABC'[i]}) ${opt}`} state={optionState(i)} disabled={answered} onSelect={() => game.answer(i)} />
                ))}
              </motion.div>

              {/* Вспышка результата поверх карточки */}
              <div className="pointer-events-none absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2">
                <AnimatePresence>{outcome && <RoundFeedback outcome={outcome} correctAnswer={round.word.correctAnswer} />}</AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Низ */}
      <div className="flex items-end justify-between gap-3">
        <div className={`${card} px-4 py-3 max-w-xs text-xs text-white/50`}>
          Choose the correct answer. You have {Math.round(TIMER_DURATION_MS / 1000)} seconds per question — missed questions come back later.
        </div>
        <div className={`${card} px-4 py-3 text-xs text-white/50 hidden sm:flex items-center gap-2`}>
          <Trophy size={14} className="text-yellow-300/80" /> Mastered {masteredCount} / {WORDS.length}
        </div>
      </div>
    </div>
  );
}
