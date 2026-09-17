'use client';

import { useEffect, useRef } from 'react';
import { HAND_CONNECTIONS } from '@/lib/hand/handGeometry';
import type { HandTracking } from '@/hooks/hand/useMediaPipeHands';

interface Props {
  hand: HandTracking;
}

/**
 * Маленькое превью камеры в углу + скелет руки (21 точка и связи) на
 * <canvas> поверх видео. Контейнер зеркалится через CSS — пользователь
 * видит себя как в зеркале, а landmark'и рисуем в «сырых» координатах кадра.
 */
export function CameraFeedOverlay({ hand }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { videoRef, frameRef, status } = hand;
  const active = status === 'tracking' || status === 'no-hand' || status === 'loading';

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      const frame = frameRef.current;
      if (!frame) return;
      const lm = frame.landmarks;

      ctx.lineWidth = 3;
      ctx.strokeStyle = frame.isPinching ? 'rgba(250,204,21,0.9)' : 'rgba(96,165,250,0.8)';
      ctx.beginPath();
      for (const [a, b] of HAND_CONNECTIONS) {
        ctx.moveTo(lm[a].x * w, lm[a].y * h);
        ctx.lineTo(lm[b].x * w, lm[b].y * h);
      }
      ctx.stroke();

      lm.forEach((p, i) => {
        const tip = i === 4 || i === 8;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, tip ? 7 : 4, 0, Math.PI * 2);
        ctx.fillStyle = tip ? '#facc15' : 'rgba(255,255,255,0.85)';
        ctx.fill();
      });
      // линия щипка
      ctx.beginPath();
      ctx.moveTo(lm[4].x * w, lm[4].y * h);
      ctx.lineTo(lm[8].x * w, lm[8].y * h);
      ctx.strokeStyle = frame.isPinching ? '#facc15' : 'rgba(250,204,21,0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active, videoRef, frameRef]);

  return (
    <div
      className={`absolute bottom-4 right-4 w-44 aspect-[4/3] rounded-xl overflow-hidden border border-white/15 bg-black/60 shadow-xl transition-opacity ${
        active ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ transform: 'scaleX(-1)' }}
    >
      {/* video всегда в DOM — хук вешает на него поток камеры */}
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-70" muted playsInline />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
