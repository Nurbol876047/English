'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, CameraOff, Flame, Hand, Loader2, MousePointer2, SkipForward, Trophy } from 'lucide-react';
import type { HandTrackingStatus } from '@/hooks/hand/useMediaPipeHands';
import type { Sentence } from '@/lib/word-order/sentences';

interface Props {
  sentence: Sentence | null;
  streak: number;
  masteredCount: number;
  totalTopics: number;
  cameraStatus: HandTrackingStatus;
  cameraError: string | null;
  onSkip: () => void;
  onToggleCamera: () => void;
  /** В мобильном 2D-режиме камера не используется */
  showCamera: boolean;
}

const CAMERA_LABEL: Record<HandTrackingStatus, { text: string; cls: string; Icon: typeof Camera }> = {
  idle: { text: 'Камера выключена', cls: 'text-white/50', Icon: CameraOff },
  loading: { text: 'Инициализация…', cls: 'text-amber-300', Icon: Loader2 },
  tracking: { text: 'Отслеживание активно', cls: 'text-emerald-300', Icon: Hand },
  'no-hand': { text: 'Покажите руку в кадр', cls: 'text-sky-300', Icon: Camera },
  unavailable: { text: 'Камера недоступна', cls: 'text-red-300', Icon: CameraOff },
};

const card = 'bg-white/[0.07] backdrop-blur-md rounded-2xl border border-white/15 shadow-xl';

export function HUD({ sentence, streak, masteredCount, totalTopics, cameraStatus, cameraError, onSkip, onToggleCamera, showCamera }: Props) {
  const cam = CAMERA_LABEL[cameraStatus];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 z-10">
      {/* Верх */}
      <div className="flex justify-between items-start gap-3">
        <div className={`${card} px-3 py-2 md:p-4 pointer-events-auto flex items-center gap-3`}>
          <Link href="/" className="text-white/50 hover:text-white transition-colors" title="На главную">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-sky-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
              Lingova
            </h1>
            <p className="text-white/60 text-xs md:text-sm mt-0.5 whitespace-nowrap">Word Order — Hand Control</p>
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
            <span className="text-white/50 text-[10px] md:text-xs uppercase tracking-wider">Mastered</span>
            <span className="text-2xl md:text-3xl font-bold text-white flex items-center gap-1.5 whitespace-nowrap">
              <Trophy size={18} className="text-yellow-300/80" />
              {masteredCount} / {totalTopics}
            </span>
          </div>
        </div>
      </div>

      {/* Задание */}
      {sentence && (
        <motion.div
          key={sentence.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-36 md:top-28 left-1/2 -translate-x-1/2 text-center max-w-[92vw]"
        >
          <p className="text-white/50 text-xs uppercase tracking-widest">
            {sentence.level} · {sentence.topic}
          </p>
          <p className="text-white/90 text-base md:text-lg mt-1">Соберите предложение: «{sentence.translation}»</p>
        </motion.div>
      )}

      {/* Низ: статус камеры + кнопка; справа оставляем место под превью камеры */}
      <div className={`flex items-end gap-3 ${showCamera ? 'mr-48' : ''}`}>
        <div className={`${card} px-4 py-3 pointer-events-auto max-w-xs`}>
          {showCamera ? (
            <button onClick={onToggleCamera} className={`flex items-center gap-2 text-sm ${cam.cls}`} title="Включить / выключить камеру">
              <cam.Icon size={18} className={cameraStatus === 'loading' ? 'animate-spin' : ''} />
              <span>{cam.text}</span>
            </button>
          ) : (
            <span className="flex items-center gap-2 text-sm text-sky-300">
              <MousePointer2 size={18} /> Режим касаний
            </span>
          )}
          {cameraError && <p className="text-white/50 text-xs mt-1">{cameraError}</p>}
          {showCamera && cameraStatus === 'tracking' && (
            <p className="text-white/40 text-xs mt-1">Сожмите большой и указательный палец, чтобы взять слово</p>
          )}
          {showCamera && cameraStatus !== 'tracking' && !cameraError && (
            <p className="text-white/40 text-xs mt-1">Мышь и тач тоже работают</p>
          )}
        </div>

        <button
          onClick={onSkip}
          className={`${card} px-4 py-3 pointer-events-auto flex items-center gap-2 text-sm text-white/70 hover:text-white hover:bg-white/15 transition-colors whitespace-nowrap`}
        >
          <SkipForward size={16} /> Другое предложение
        </button>
      </div>
    </div>
  );
}
