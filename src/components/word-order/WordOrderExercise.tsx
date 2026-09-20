'use client';

import { useEffect, useState } from 'react';
import { useMediaPipeHands } from '@/hooks/hand/useMediaPipeHands';
import { useSentenceExercise, type ExerciseCompleteHandler } from '@/hooks/word-order/useSentenceExercise';
import { useIsMobile } from '@/hooks/hand/useIsMobile';
import { useWordOrderStore } from '@/store/wordOrderStore';
import { WordOrderScene } from './WordOrderScene';
import { CameraFeedOverlay } from '@/components/hand/CameraFeedOverlay';
import { HUD } from './HUD';
import { FeedbackBanner } from '@/components/hand/FeedbackBanner';
import { MobileWordOrder } from './MobileWordOrder';

interface Props {
  /** Точка интеграции с общим прогрессом платформы Lingova */
  onExerciseComplete?: ExerciseCompleteHandler;
}

/** Десктоп: 3D-сцена + трекинг руки (с fallback на мышь) */
function DesktopExercise({ onExerciseComplete }: Props) {
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const hand = useMediaPipeHands(cameraEnabled);
  const ex = useSentenceExercise(onExerciseComplete);
  const setCameraStatus = useWordOrderStore((s) => s.setCameraStatus);
  const feedback = useWordOrderStore((s) => s.feedback);
  const clearFeedback = useWordOrderStore((s) => s.clearFeedback);

  // Стор знает, ведёт ли курсор рука — чтобы мышь не перебивала трекинг
  useEffect(() => {
    setCameraStatus(hand.status);
  }, [hand.status, setCameraStatus]);

  return (
    <>
      <div className="absolute inset-0">
        <WordOrderScene hand={hand.status === 'tracking' || hand.status === 'no-hand' ? hand : null} />
      </div>
      <HUD
        sentence={ex.sentence}
        streak={ex.streak}
        masteredCount={ex.masteredCount}
        totalTopics={ex.totalTopics}
        cameraStatus={hand.status}
        cameraError={hand.error}
        onSkip={ex.skip}
        onToggleCamera={() => setCameraEnabled((v) => !v)}
        showCamera
      />
      <CameraFeedOverlay hand={hand} />
      <FeedbackBanner feedback={feedback} onClear={clearFeedback} />
    </>
  );
}

/** Мобильные: упрощённый 2D-режим без камеры */
function MobileExercise({ onExerciseComplete }: Props) {
  const ex = useSentenceExercise(onExerciseComplete);
  const feedback = useWordOrderStore((s) => s.feedback);
  const clearFeedback = useWordOrderStore((s) => s.clearFeedback);
  return (
    <>
      <MobileWordOrder />
      <HUD
        sentence={ex.sentence}
        streak={ex.streak}
        masteredCount={ex.masteredCount}
        totalTopics={ex.totalTopics}
        cameraStatus="idle"
        cameraError={null}
        onSkip={ex.skip}
        onToggleCamera={() => undefined}
        showCamera={false}
      />
      <FeedbackBanner feedback={feedback} onClear={clearFeedback} />
    </>
  );
}

export function WordOrderExercise({ onExerciseComplete }: Props) {
  const isMobile = useIsMobile();

  // В dev выставляем стор в window — удобно для отладки и e2e-прогонов
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as unknown as { __wordOrderStore?: typeof useWordOrderStore }).__wordOrderStore = useWordOrderStore;
    }
  }, []);
  if (isMobile === null) {
    return <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">Loading…</div>;
  }
  return isMobile ? <MobileExercise onExerciseComplete={onExerciseComplete} /> : <DesktopExercise onExerciseComplete={onExerciseComplete} />;
}
