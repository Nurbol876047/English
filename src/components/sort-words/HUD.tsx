'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Camera, CameraOff, Flame, Hand, Loader2, MousePointer2, RotateCcw, Shuffle, Skull, Star, Timer, Trophy } from 'lucide-react';
import type { HandTrackingStatus } from '@/hooks/hand/useMediaPipeHands';
import type { WordSet } from '@/lib/sort-words/wordSets';
import type { ControlMode, SortRoundResult, SwipeDebug } from '@/store/sortWordsStore';

interface Props {
  activeSet: WordSet | null;
  score: number;
  streak: number;
  timeLeftMs: number;
  timeLimitMs: number;
  answered: number;
  total: number;
  masteredCount: number;
  totalSets: number;
  cameraStatus: HandTrackingStatus;
  cameraError: string | null;
  controlMode: ControlMode;
  onControlMode: (m: ControlMode) => void;
  onToggleCamera: () => void;
  onNextSet: () => void;
  onRestart: () => void;
  showCamera: boolean;
  result: SortRoundResult | null;
  /** Лучшее время реакции за раунд, мс */
  bestTimeMs: number | null;
  hardMode: boolean;
  onHardMode: (on: boolean) => void;
  swipeDebug?: SwipeDebug;
}

const CAMERA_LABEL: Record<HandTrackingStatus, { text: string; cls: string; Icon: typeof Camera }> = {
  idle: { text: 'Camera off', cls: 'text-white/50', Icon: CameraOff },
  loading: { text: 'Starting up…', cls: 'text-amber-300', Icon: Loader2 },
  tracking: { text: 'Hand tracking active', cls: 'text-emerald-300', Icon: Hand },
  'no-hand': { text: 'Show your hand to the camera', cls: 'text-sky-300', Icon: Camera },
  unavailable: { text: 'Camera unavailable', cls: 'text-red-300', Icon: CameraOff },
};

const card = 'bg-white/[0.07] backdrop-blur-md rounded-2xl border border-white/15 shadow-xl';

export function HUD(p: Props) {
  const cam = CAMERA_LABEL[p.cameraStatus];
  const seconds = Math.ceil(p.timeLeftMs / 1000);
  const ratio = p.timeLimitMs > 0 ? p.timeLeftMs / p.timeLimitMs : 0;
  const urgent = p.timeLeftMs > 0 && p.timeLeftMs < 10_000;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 z-10">
      {/* Верх */}
      <div className="flex flex-wrap justify-between items-start gap-2 md:gap-3">
        <div className={`${card} px-3 py-2 md:p-4 pointer-events-auto flex items-center gap-3`}>
          <Link href="/" className="text-white/50 hover:text-white transition-colors" title="Back to the arena">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-sky-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
              Lingova
            </h1>
            <p className="text-white/60 text-xs md:text-sm mt-0.5 whitespace-nowrap">Sort the Words — Hand Control</p>
          </div>
        </div>

        <div className="flex gap-2 md:gap-3 ml-auto">
          <div className={`${card} px-3 py-2 md:px-4 md:py-3 flex flex-col items-end`}>
            <span className="text-white/50 text-[10px] md:text-xs uppercase tracking-wider">Score</span>
            <span className="text-2xl md:text-3xl font-bold text-white flex items-center gap-1.5">
              <Star size={18} className="text-yellow-300/80" />
              {p.score}
            </span>
          </div>
          <div className={`${card} px-3 py-2 md:px-4 md:py-3 flex flex-col items-end`}>
            <span className="text-white/50 text-[10px] md:text-xs uppercase tracking-wider">Streak</span>
            <span className="text-2xl md:text-3xl font-bold text-white flex items-center gap-1.5">
              <Flame size={20} className={p.streak > 2 ? 'text-orange-400 animate-pulse' : 'text-white/25'} />
              {p.streak}
            </span>
          </div>
          <div className={`${card} px-3 py-2 md:px-4 md:py-3 flex flex-col items-end min-w-[5.5rem]`}>
            <span className="text-white/50 text-[10px] md:text-xs uppercase tracking-wider">Time</span>
            <span className={`text-2xl md:text-3xl font-bold flex items-center gap-1.5 ${urgent ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              <Timer size={18} className={urgent ? 'text-red-400' : 'text-white/40'} />
              {seconds}
            </span>
            <div className="w-full h-1 rounded-full bg-white/10 mt-1 overflow-hidden">
              <div className={`h-full rounded-full transition-[width] duration-300 ${urgent ? 'bg-red-400' : 'bg-sky-400'}`} style={{ width: `${ratio * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Задание */}
      {p.activeSet && (
        <motion.div key={p.activeSet.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-44 md:top-28 left-1/2 -translate-x-1/2 text-center max-w-[92vw]">
          <p className="text-white/50 text-xs uppercase tracking-widest">
            {p.activeSet.kind === 'grammar' ? 'grammar' : 'vocabulary'} · mastered {p.masteredCount} / {p.totalSets}
          </p>
          <p className="text-white/90 text-base md:text-lg mt-1">
            Set: <span className="font-semibold">{p.activeSet.title}</span>
            <span className="text-white/50 ml-3">{p.answered} / {p.total}</span>
          </p>
        </motion.div>
      )}

      {/* Низ */}
      <div className={`flex items-end justify-between gap-3 ${p.showCamera ? 'mr-48' : ''}`}>
        <div className="flex items-end gap-3">
          <div className={`${card} px-4 py-3 pointer-events-auto max-w-xs`}>
            {p.showCamera ? (
              <button onClick={p.onToggleCamera} className={`flex items-center gap-2 text-sm ${cam.cls}`} title="Turn the camera on / off">
                <cam.Icon size={18} className={p.cameraStatus === 'loading' ? 'animate-spin' : ''} />
                <span>{cam.text}</span>
              </button>
            ) : (
              <span className="flex items-center gap-2 text-sm text-sky-300">
                <MousePointer2 size={18} /> Touch mode
              </span>
            )}
            {p.cameraError && <p className="text-white/50 text-xs mt-1">{p.cameraError}</p>}
            {p.showCamera && !p.cameraError && (
              <p className="text-white/40 text-xs mt-1">
                {p.controlMode === 'pinch' ? 'Pinch to grab a word and release it over a basket' : 'Swipe an open palm left, up or right'}
              </p>
            )}
            {p.swipeDebug && p.controlMode === 'swipe' && (
              <p className="text-amber-300/70 text-[10px] font-mono mt-1">
                v {p.swipeDebug.speed.toFixed(1)} · ∠ {p.swipeDebug.angle.toFixed(0)}°
              </p>
            )}
          </div>

          {p.showCamera && (
            <div className={`${card} p-1 pointer-events-auto flex text-sm`}>
              {(['pinch', 'swipe'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => p.onControlMode(m)}
                  className={`px-3 py-2 rounded-xl transition-colors ${p.controlMode === m ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
                >
                  {m === 'pinch' ? 'Pinch' : 'Swipe'}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-end gap-2 md:gap-3">
          <button
            onClick={() => p.onHardMode(!p.hardMode)}
            className={`${card} px-3 py-3 pointer-events-auto flex items-center gap-2 text-sm transition-colors ${p.hardMode ? 'text-red-300 bg-red-500/15' : 'text-white/50 hover:text-white'}`}
            title="Hard mode: no second chance — a wrong word flies away"
          >
            <Skull size={16} /> Hard
          </button>
          <button onClick={p.onNextSet} className={`${card} px-4 py-3 pointer-events-auto flex items-center gap-2 text-sm text-white/70 hover:text-white hover:bg-white/15 transition-colors whitespace-nowrap`}>
            <Shuffle size={16} /> Another set
          </button>
        </div>
      </div>

      {/* Экран результата */}
      <AnimatePresence>
        {p.result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto z-20"
          >
            <motion.div initial={{ scale: 0.92, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} className={`${card} p-8 w-[min(92vw,26rem)] text-center`}>
              <Trophy size={40} className={`mx-auto mb-3 ${p.result.passed ? 'text-yellow-300' : 'text-white/30'}`} />
              <h2 className="text-2xl font-bold text-white">{p.result.passed ? 'Round passed!' : 'Try again'}</h2>
              <p className="text-white/50 text-sm mt-1">{p.activeSet?.title}</p>
              <div className="grid grid-cols-3 gap-3 mt-6 text-white">
                <div><p className="text-3xl font-bold text-emerald-300">{p.result.correct}</p><p className="text-xs text-white/50">correct</p></div>
                <div><p className="text-3xl font-bold text-red-300">{p.result.wrong}</p><p className="text-xs text-white/50">wrong</p></div>
                <div><p className="text-3xl font-bold text-yellow-300">{p.result.score}</p><p className="text-xs text-white/50">score</p></div>
              </div>
              <p className="text-white/40 text-xs mt-4">
                {(p.result.timeSpentMs / 1000).toFixed(1)} s · mode: {p.result.controlMode}
                {p.bestTimeMs !== null && <> · best time {(p.bestTimeMs / 1000).toFixed(2)} s</>}
              </p>
              <div className="flex gap-3 mt-6">
                <button onClick={p.onRestart} className="flex-1 flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white rounded-xl py-3 transition-colors">
                  <RotateCcw size={16} /> Play again
                </button>
                <button onClick={p.onNextSet} className="flex-1 flex items-center justify-center gap-2 bg-sky-500/80 hover:bg-sky-500 text-white rounded-xl py-3 transition-colors">
                  <Shuffle size={16} /> Another set
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
