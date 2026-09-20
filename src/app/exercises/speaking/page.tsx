'use client';

import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { SpeakingResult } from '@/components/speaking/SpeakingExercise';
import { VideoBackdrop } from '@/components/ui/VideoBackdrop';

// Только на клиенте: персонаж выбирается случайно, а Web Speech API есть лишь в браузере
const SpeakingExercise = dynamic(
  () => import('@/components/speaking/SpeakingExercise').then((m) => m.SpeakingExercise),
  { ssr: false, loading: () => <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">Loading…</div> },
);

export default function SpeakingPage() {
  // Результат попытки уходит в общий прогресс платформы — подключить API здесь
  const handleComplete = useCallback((result: SpeakingResult) => {
    console.info('[speaking] attempt', result);
  }, []);

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-[#0b0e14]">
      <VideoBackdrop src="/videos/bg-speaking.mp4" poster="/videos/bg-speaking-poster.jpg" dim={0.5} />
      <SpeakingExercise onExerciseComplete={handleComplete} />
    </main>
  );
}
