'use client';

import { useCallback } from 'react';
import { WordOrderExercise } from '@/components/word-order/WordOrderExercise';
import { VideoBackdrop } from '@/components/ui/VideoBackdrop';
import type { ExerciseResult } from '@/store/wordOrderStore';

export default function WordOrderPage() {
  // Здесь модуль отдаёт результат в общий прогресс платформы.
  // Пока — лог в консоль; подключить API прогресса Lingova в этом месте.
  const handleComplete = useCallback((result: ExerciseResult) => {
    console.info('[word-order] exercise complete', result);
  }, []);

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-[#0b0e14]">
      <VideoBackdrop src="/videos/bg-word-order.mp4" poster="/videos/bg-word-order-poster.jpg" dim={0.6} />
      <WordOrderExercise onExerciseComplete={handleComplete} />
    </main>
  );
}
