'use client';

import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, SelectiveBloom, ChromaticAberration, Selection } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useSortWordsStore } from '@/store/sortWordsStore';
import { useSortController } from '@/hooks/sort-words/useSortController';
import type { HandTracking } from '@/hooks/hand/useMediaPipeHands';
import { HandCursor3D } from '@/components/hand/HandCursor3D';
import { ParticleBursts } from '@/components/hand/ParticleBurst3D';
import { Basket3D } from './Basket3D';
import { FlyingWord3D } from './FlyingWord3D';
import { SwipeTrail3D } from './SwipeTrail3D';

const BG = '#0b0e14';

interface Props {
  hand: Pick<HandTracking, 'subscribe'> | null;
  effects?: boolean;
}

function SceneContent({ hand, effects }: { hand: Props['hand']; effects: boolean }) {
  useSortController(hand);
  const keyLight = useRef<THREE.DirectionalLight>(null);
  const fillLight = useRef<THREE.AmbientLight>(null);

  const baskets = useSortWordsStore((s) => s.baskets);
  const word = useSortWordsStore((s) => s.currentWord);
  const bursts = useSortWordsStore((s) => s.bursts);
  const removeBurst = useSortWordsStore((s) => s.removeBurst);

  return (
    <>
      <ambientLight ref={fillLight} intensity={0.6} />
      <directionalLight ref={keyLight} position={[4, 6, 8]} intensity={1.4} />
      <pointLight position={[-6, -2, 4]} intensity={8} color="#38bdf8" />
      <pointLight position={[6, 2, 4]} intensity={6} color="#a78bfa" />

      {baskets.map((b) => (
        <Basket3D key={b.index} basket={b} />
      ))}
      {/* key по id — при смене слова RoundedBox/Text пересоздаются один раз */}
      {word && <FlyingWord3D key={word.id} word={word} />}
      <SwipeTrail3D />
      <ParticleBursts bursts={bursts} onDone={removeBurst} />
      <HandCursor3D
        read={() => {
          const st = useSortWordsStore.getState();
          return { ...st.cursor, grabbing: st.currentWord?.state === 'grabbed' };
        }}
      />

      {effects && (
        <EffectComposer multisampling={0}>
          <SelectiveBloom lights={[keyLight, fillLight]} mipmapBlur luminanceThreshold={0.15} luminanceSmoothing={0.3} intensity={1.5} radius={0.6} />
          <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={[0.0008, 0.0008]} radialModulation modulationOffset={0.4} />
        </EffectComposer>
      )}
    </>
  );
}

/**
 * Canvas упражнения. Камера чуть выше и смотрит вниз на корзины; фон
 * прозрачный — под сценой видеофон с тремя потоками под цвета корзин.
 */
export function SortWordsScene({ hand, effects = true }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 1.5, 9], fov: 45, near: 0.1, far: 60 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: true, premultipliedAlpha: false }}
      onCreated={({ scene, camera }) => {
        camera.lookAt(0, -0.4, 0);
        scene.fog = new THREE.FogExp2(BG, 0.03);
      }}
      className="touch-none"
    >
      <Suspense fallback={null}>
        <Selection>
          <SceneContent hand={hand} effects={effects} />
        </Selection>
      </Suspense>
    </Canvas>
  );
}
