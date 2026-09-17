'use client';

import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { EffectComposer, SelectiveBloom, ChromaticAberration, Selection } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useWordOrderStore } from '@/store/wordOrderStore';
import { usePinchDragController } from '@/hooks/word-order/usePinchDragController';
import type { HandTracking } from '@/hooks/hand/useMediaPipeHands';
import { WordTile3D } from './WordTile3D';
import { SlotZone3D } from './SlotZone3D';
import { HandCursor3D } from '@/components/hand/HandCursor3D';
import { ParticleBursts } from '@/components/hand/ParticleBurst3D';

const BG = '#0b0e14';

interface Props {
  hand: Pick<HandTracking, 'subscribe'> | null;
  /** Отключить пост-процессинг (слабые GPU) */
  effects?: boolean;
}

/** Внутренняя часть — всё, чему нужен контекст R3F */
function SceneContent({ hand, effects }: { hand: Props['hand']; effects: boolean }) {
  usePinchDragController(hand);
  const keyLight = useRef<THREE.DirectionalLight>(null);
  const fillLight = useRef<THREE.AmbientLight>(null);

  const viewport = useThree((s) => s.viewport);
  const relayout = useWordOrderStore((s) => s.relayout);
  const tiles = useWordOrderStore((s) => s.tiles);
  const slots = useWordOrderStore((s) => s.slots);
  const bursts = useWordOrderStore((s) => s.bursts);
  const removeBurst = useWordOrderStore((s) => s.removeBurst);

  // Ширина видимой области на плоскости z=0 → раскладка ячеек и лотка
  useEffect(() => {
    relayout(viewport.width);
  }, [viewport.width, relayout]);

  const spacing = slots.length > 1 ? Math.abs(slots[1].position[0] - slots[0].position[0]) : 1.7;

  return (
    <>
      <ambientLight ref={fillLight} intensity={0.6} />
      <directionalLight ref={keyLight} position={[4, 6, 8]} intensity={1.4} />
      <pointLight position={[-6, -2, 4]} intensity={8} color="#3b82f6" />
      <pointLight position={[6, 4, 4]} intensity={6} color="#a855f7" />

      {slots.map((slot) => (
        <SlotZone3D key={slot.index} slot={slot} spacing={spacing} />
      ))}
      {tiles.map((tile) => (
        <WordTile3D key={tile.id} tile={tile} />
      ))}
      <ParticleBursts bursts={bursts} onDone={removeBurst} />
      <HandCursor3D
        read={() => {
          const st = useWordOrderStore.getState();
          return { ...st.cursor, grabbing: st.grabbedTileId !== null };
        }}
      />

      {effects && (
        <EffectComposer multisampling={0}>
          {/* selective: светятся только объекты внутри <Select enabled>, lights нужны эффекту для перерисовки выбранных */}
          <SelectiveBloom
            lights={[keyLight, fillLight]}
            mipmapBlur
            luminanceThreshold={0.15}
            luminanceSmoothing={0.3}
            intensity={1.6}
            radius={0.6}
          />
          <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={[0.0008, 0.0008]} radialModulation modulationOffset={0.4} />
        </EffectComposer>
      )}
    </>
  );
}

/**
 * Корневой Canvas упражнения: камера, свет, туман, selective bloom.
 * Selection/Select из @react-three/postprocessing — это обёртка над
 * слоями Three.js (layers): в bloom-проход попадают только объекты,
 * обёрнутые в <Select enabled>, а не вся сцена.
 */
export function WordOrderScene({ hand, effects = true }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 45, near: 0.1, far: 60 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
      // Фон прозрачный — под сценой VideoBackdrop. Туман оставляем лёгким:
      // он подкрашивает дальние объекты в цвет фона и даёт глубину
      onCreated={({ scene }) => {
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
