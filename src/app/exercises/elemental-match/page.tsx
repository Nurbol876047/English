'use client';

import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { ElementalMatchResult } from '@/hooks/useElementalMatchGame';
import { VideoBackdrop } from '@/components/ui/VideoBackdrop';

// Только на клиенте: первое слово выбирается случайно, иначе SSR и клиент разойдутся
const ElementalMatchGame = dynamic(
  () => import('@/components/elemental-match/ElementalMatchGame').then((m) => m.ElementalMatchGame),
  { ssr: false, loading: () => <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">Loading…</div> },
);

export default function ElementalMatchPage() {
  // Результат сессии уходит в общий прогресс платформы — подключить API здесь
  const handleComplete = useCallback((result: ElementalMatchResult) => {
    console.info('[elemental-match] session complete', result);
  }, []);

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-[#0b0e14]">
      <VideoBackdrop src="/videos/bg-elemental-match.mp4" poster="/videos/bg-elemental-match-poster.jpg" dim={0.55} />
      <ElementalMatchGame onExerciseComplete={handleComplete} />
    </main>
  );
}
