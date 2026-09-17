'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ParticleBurst } from '@/lib/hand/types';

const COUNT = 70;
const LIFETIME = 0.9;

/** Один взрыв частиц (instanced mesh), сам удаляет себя из стора по истечении жизни */
function Burst({ burst, onDone }: { burst: ParticleBurst; onDone: (id: number) => void }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  // Скорости генерируются лениво на первом кадре (не в рендере — Math.random нечистый)
  const velocities = useRef<THREE.Vector3[] | null>(null);
  const start = useRef<number | null>(null);

  const initVelocities = (): THREE.Vector3[] => {
    const v: THREE.Vector3[] = [];
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const b = (Math.random() - 0.5) * Math.PI;
      const speed = 1.5 + Math.random() * 2.5;
      v.push(new THREE.Vector3(Math.cos(a) * Math.cos(b), Math.sin(a) * Math.cos(b), Math.sin(b)).multiplyScalar(speed));
    }
    return v;
  };

  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    if (start.current === null) start.current = state.clock.elapsedTime;
    if (!velocities.current) velocities.current = initVelocities();
    const vel = velocities.current;
    const t = state.clock.elapsedTime - start.current;
    if (t > LIFETIME) {
      onDone(burst.id);
      return;
    }
    const fade = 1 - t / LIFETIME;
    for (let i = 0; i < COUNT; i++) {
      const v = vel[i];
      dummy.position.set(
        burst.position[0] + v.x * t,
        burst.position[1] + v.y * t - 1.5 * t * t, // лёгкая гравитация
        burst.position[2] + v.z * t + 0.3,
      );
      dummy.scale.setScalar(0.1 * fade);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    (m.material as THREE.MeshBasicMaterial).opacity = fade;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={burst.color} transparent toneMapped={false} />
    </instancedMesh>
  );
}

interface Props {
  bursts: ParticleBurst[];
  /** Вызывается, когда взрыв отыграл — стор удаляет его из списка */
  onDone: (id: number) => void;
}

export function ParticleBursts({ bursts, onDone }: Props) {
  return (
    <>
      {bursts.map((b) => (
        <Burst key={b.id} burst={b} onDone={onDone} />
      ))}
    </>
  );
}
