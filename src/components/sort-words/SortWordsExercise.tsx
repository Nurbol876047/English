'use client';

import { useEffect, useState } from 'react';
import { useMediaPipeHands } from '@/hooks/hand/useMediaPipeHands';
import { useIsMobile } from '@/hooks/hand/useIsMobile';
import { useSortExercise, type SortCompleteHandler } from '@/hooks/sort-words/useSortExercise';
import { useSortWordsStore } from '@/store/sortWordsStore';
import { WORD_SETS } from '@/lib/sort-words/wordSets';
import { CameraFeedOverlay } from '@/components/hand/CameraFeedOverlay';
import { FeedbackBanner } from '@/components/hand/FeedbackBanner';
import { SortWordsScene } from './SortWordsScene';
import { HUD } from './HUD';
import { MobileSortWords } from './MobileSortWords';

interface Props {
  /** Точка интеграции с общим прогрессом платформы Lingova */
  onExerciseComplete?: SortCompleteHandler;
}

function useSharedHud(onExerciseComplete?: SortCompleteHandler) {
  const ex = useSortExercise(onExerciseComplete);
  const feedback = useSortWordsStore((s) => s.feedback);
  const clearFeedback = useSortWordsStore((s) => s.clearFeedback);
  const controlMode = useSortWordsStore((s) => s.controlMode);
  const setControlMode = useSortWordsStore((s) => s.setControlMode);
  const timeLimitMs = useSortWordsStore((s) => s.timeLimitMs);
  const bestTimeMs = useSortWordsStore((s) => s.bestTimeMs);
  const hardMode = useSortWordsStore((s) => s.hardMode);
  const setHardMode = useSortWordsStore((s) => s.setHardMode);
  return { ex, feedback, clearFeedback, controlMode, setControlMode, timeLimitMs, bestTimeMs, hardMode, setHardMode };
}

function DesktopExercise({ onExerciseComplete }: Props) {
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const hand = useMediaPipeHands(cameraEnabled);
  const { ex, feedback, clearFeedback, controlMode, setControlMode, timeLimitMs, bestTimeMs, hardMode, setHardMode } = useSharedHud(onExerciseComplete);
  const setCameraStatus = useSortWordsStore((s) => s.setCameraStatus);
  const swipeDebug = useSortWordsStore((s) => s.swipeDebug);

  useEffect(() => {
    setCameraStatus(hand.status);
  }, [hand.status, setCameraStatus]);

  return (
    <>
      <div className="absolute inset-0">
        <SortWordsScene hand={hand.status === 'tracking' || hand.status === 'no-hand' ? hand : null} />
      </div>
      <HUD
        activeSet={ex.activeSet}
        score={ex.score}
        streak={ex.streak}
        timeLeftMs={ex.timeLeftMs}
        timeLimitMs={timeLimitMs}
        answered={ex.correctCount + ex.wrongCount}
        total={ex.totalWords}
        masteredCount={ex.masteredCount}
        totalSets={WORD_SETS.length}
        cameraStatus={hand.status}
        cameraError={hand.error}
        controlMode={controlMode}
        onControlMode={setControlMode}
        onToggleCamera={() => setCameraEnabled((v) => !v)}
        onNextSet={ex.nextSet}
        onRestart={ex.restart}
        showCamera
        result={ex.roundState === 'finished' ? ex.lastResult : null}
        bestTimeMs={bestTimeMs}
        hardMode={hardMode}
        onHardMode={setHardMode}
        swipeDebug={process.env.NODE_ENV === 'development' ? swipeDebug : undefined}
      />
      <CameraFeedOverlay hand={hand} />
      <FeedbackBanner feedback={feedback} onClear={clearFeedback} />
    </>
  );
}

function MobileExercise({ onExerciseComplete }: Props) {
  const { ex, feedback, clearFeedback, controlMode, setControlMode, timeLimitMs, bestTimeMs, hardMode, setHardMode } = useSharedHud(onExerciseComplete);
  return (
    <>
      <MobileSortWords />
      <HUD
        activeSet={ex.activeSet}
        score={ex.score}
        streak={ex.streak}
        timeLeftMs={ex.timeLeftMs}
        timeLimitMs={timeLimitMs}
        answered={ex.correctCount + ex.wrongCount}
        total={ex.totalWords}
        masteredCount={ex.masteredCount}
        totalSets={WORD_SETS.length}
        cameraStatus="idle"
        cameraError={null}
        controlMode={controlMode}
        onControlMode={setControlMode}
        onToggleCamera={() => undefined}
        onNextSet={ex.nextSet}
        onRestart={ex.restart}
        showCamera={false}
        result={ex.roundState === 'finished' ? ex.lastResult : null}
        bestTimeMs={bestTimeMs}
        hardMode={hardMode}
        onHardMode={setHardMode}
      />
      <FeedbackBanner feedback={feedback} onClear={clearFeedback} />
    </>
  );
}

export function SortWordsExercise({ onExerciseComplete }: Props) {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as unknown as { __sortWordsStore?: typeof useSortWordsStore }).__sortWordsStore = useSortWordsStore;
    }
  }, []);

  if (isMobile === null) {
    return <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">Loading…</div>;
  }
  return isMobile ? <MobileExercise onExerciseComplete={onExerciseComplete} /> : <DesktopExercise onExerciseComplete={onExerciseComplete} />;
}
