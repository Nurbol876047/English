'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useElementStore } from '@/store/elementStore';
import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';

const Lights = () => {
  const activeElement = useElementStore((state) => state.activeElement);
  const targetColor = useRef(new THREE.Color('#ffffff'));
  const lightRef = useRef<THREE.PointLight>(null);
  const targetIntensity = useRef(0.5);

  useEffect(() => {
    switch (activeElement) {
      case 'water': 
        targetColor.current.set('#4fc3f7'); 
        targetIntensity.current = 5;
        break;
      case 'fire': 
        targetColor.current.set('#ff5722'); 
        targetIntensity.current = 8;
        break;
      case 'earth':
        // тёплый каменный свет; зелёное свечение даёт само кольцо-разлом
        targetColor.current.set('#e0c48f');
        targetIntensity.current = 3;
        break;
      case 'wind':
      case 'air': 
        targetColor.current.set('#eceff1'); 
        targetIntensity.current = 4;
        break;
      default: 
        targetColor.current.set('#ffffff'); 
        targetIntensity.current = 0.5;
        break;
    }
  }, [activeElement]);

  useFrame((state, delta) => {
    if (lightRef.current) {
      lightRef.current.color.lerp(targetColor.current, delta * 2);
      lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, targetIntensity.current, delta * 3);
    }
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 10, 5]} intensity={0.5} castShadow />
      <pointLight 
        ref={lightRef} 
        position={[0, 2, 0]} 
        intensity={0.5} 
        distance={15}
        color="#ffffff"
      />
    </>
  );
};

export const ArenaScene = () => {
  return (
    <div className="absolute inset-0">
      {/* Прозрачный фон: под сценой лежит VideoBackdrop */}
      <Canvas shadows camera={{ position: [0, 4, 10], fov: 45 }} gl={{ alpha: true, premultipliedAlpha: false }}>
        
        <Suspense fallback={
          <mesh>
            <boxGeometry />
            <meshBasicMaterial color="red" />
          </mesh>
        }>
          <Lights />
          {/* Платформа убрана — сцена стоит прямо на видеофоне; эффекты стихий спавнятся в центре */}

          {/* 3D-эффекты стихий отключены — вместо них играет фоновое видео (ElementBackdrop) */}

          
          <EffectComposer>
            <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Suspense>

        <CameraControls 
          makeDefault
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 2.2} 
          minDistance={5} 
          maxDistance={15} 
        />
      </Canvas>
    </div>
  );
};
