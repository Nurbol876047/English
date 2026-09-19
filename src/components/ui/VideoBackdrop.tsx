'use client';

import { useEffect, useRef } from 'react';

interface Props {
  src: string;
  poster?: string;
  /** Затемнение поверх видео, 0..1 — чтобы текст и плашки читались */
  dim?: number;
}

/**
 * Зацикленное видео на заднем плане. Лежит под 3D-сценой (у Canvas должен
 * быть прозрачный фон). Поверх — затемнение и виньетка к краям.
 */
export function VideoBackdrop({ src, poster, dim = 0.45 }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  // Браузер может проигнорировать autoplay (фоновая вкладка, политика автовоспроизведения) —
  // запускаем вручную; muted-видео разрешено играть без жеста пользователя.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();
    v.addEventListener('canplay', tryPlay);
    document.addEventListener('visibilitychange', tryPlay);
    return () => {
      v.removeEventListener('canplay', tryPlay);
      document.removeEventListener('visibilitychange', tryPlay);
    };
  }, [src]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black" aria-hidden>
      {/* На узких экранах видео не воспроизводим (экономия батареи/трафика) — остаётся постер */}
      {poster && (
        <div className="absolute inset-0 bg-cover bg-center md:hidden" style={{ backgroundImage: `url(${poster})` }} />
      )}
      <video
        ref={ref}
        className="absolute inset-0 w-full h-full object-cover hidden md:block"
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
      />
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${dim})` }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.85)_100%)]" />
    </div>
  );
}
