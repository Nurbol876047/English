'use client';

import { useEffect, useRef, useState } from 'react';
import { useElementStore } from '@/store/elementStore';

// Видео на элемент. Запускается поверх сцены, когда элемент активируется
// (кнопкой или голосом), и исчезает сразу по окончании ролика.
const ELEMENT_VIDEOS: Partial<Record<string, { src: string; glow: string }>> = {
  // Видео стихий временно отключены — раскомментировать, чтобы вернуть
  // water: { src: '/videos/water.mp4', glow: 'shadow-[0_0_60px_rgba(56,189,248,0.35)]' },
  // fire: { src: '/videos/fire.mp4', glow: 'shadow-[0_0_60px_rgba(249,115,22,0.4)]' },
};

export const ElementVideo = () => {
  const [current, setCurrent] = useState<{ src: string; glow: string } | null>(null);
  const src = current?.src ?? null;
  const videoRef = useRef<HTMLVideoElement>(null);

  // Активация элемента → показать его видео (если оно есть)
  useEffect(
    () =>
      useElementStore.subscribe((s, prev) => {
        if (s.activeElement === prev.activeElement) return;
        const next = s.activeElement ? ELEMENT_VIDEOS[s.activeElement] : undefined;
        if (next) setCurrent(next);
      }),
    [],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    video.currentTime = 0;
    video.play().catch(() => setCurrent(null));
  }, [src]);

  if (!current) return null;

  return (
    // Зона между верхним HUD и кнопками элементов — видео центрируется в ней и не перекрывает кнопки
    <div className="absolute inset-x-0 top-[130px] bottom-[36%] z-20 flex items-center justify-center pointer-events-none">
      <video
        ref={videoRef}
        src={current.src}
        className={`max-h-full w-auto max-w-[min(60vw,720px)] aspect-video object-cover rounded-3xl border border-white/20 ${current.glow}`}
        playsInline
        onEnded={() => setCurrent(null)}
      />
    </div>
  );
};
