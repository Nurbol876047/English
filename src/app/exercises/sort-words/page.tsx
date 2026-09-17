'use client';

import { useCallback } from 'react';
import { SortWordsExercise } from '@/components/sort-words/SortWordsExercise';
import { VideoBackdrop } from '@/components/ui/VideoBackdrop';
import type { SortRoundResult } from '@/store/sortWordsStore';

export default function SortWordsPage() {
  // Результат раунда уходит в общий прогресс платформы — подключить API здесь
  const handleComplete = useCallback((result: SortRoundResult) => {
    console.info('[sort-words] round complete', result);
  }, []);

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-[#0b0e14]">
      <VideoBackdrop src="/videos/bg-sort-words.mp4" poster="/videos/bg-sort-words-poster.jpg" dim={0.35} />
      <SortWordsExercise onExerciseComplete={handleComplete} />
    </main>
  );
}
