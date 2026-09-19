'use client';

import { useEffect, useRef, useState } from 'react';
import { useElementStore } from '@/store/elementStore';

// Полноэкранное видео стихии на заднем плане. Ложится поверх зацикленного
// VideoBackdrop, когда элемент активируется (кнопкой или голосом), и исчезает
// сразу по окончании ролика — под ним снова виден обычный фон.
const ELEMENT_BACKDROPS: Partial<Record<string, string>> = {
  water: '/videos/element-water-bg.mp4',
  fire: '/videos/element-fire-bg.mp4',
  earth: '/videos/element-earth-bg.mp4',
  wind: '/videos/element-wind-bg.mp4',
  air: '/videos/element-wind-bg.mp4',
};

interface Props {
  /** Затемнение поверх видео, 0..1 — чтобы HUD читался */
  dim?: number;
}

export const ElementBackdrop = ({ dim = 0.35 }: Props) => {
  const [src, setSrc] = useState<string | null>(null);
  // Ключ растёт при каждой активации — чтобы повторное нажатие той же стихии перезапускало ролик
  const [playKey, setPlayKey] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(
    () =>
      useElementStore.subscribe((s, prev) => {
        if (s.activeElement === prev.activeElement) return;
        const next = s.activeElement ? ELEMENT_BACKDROPS[s.activeElement] : undefined;
        if (!next) return;
        setSrc(next);
        setPlayKey((k) => k + 1);
      }),
    [],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    video.currentTime = 0;
    video.play().catch(() => setSrc(null));
  }, [src, playKey]);

  if (!src) return null;

  return (
    <div className="absolute inset-0 overflow-hidden bg-black" aria-hidden>
      <video
        key={playKey}
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src={src}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        onEnded={() => setSrc(null)}
        onError={() => setSrc(null)}
      />
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${dim})` }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.85)_100%)]" />
    </div>
  );
};
