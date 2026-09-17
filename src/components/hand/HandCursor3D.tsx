'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { HandCursor } from '@/lib/hand/types';

export interface CursorSnapshot extends HandCursor {
  /** Что-то захвачено — кольцо становится жёлтым */
  grabbing: boolean;
}

interface Props {
  /** Вызывается каждый кадр из useFrame — без React-state */
  read: () => CursorSnapshot;
}

/**
 * 3D-курсор — точка, где система «видит» указательный палец (или мышь).
 * Кольцо сжимается по мере схлопывания щипка, чтобы пользователь видел,
 * когда захват вот-вот сработает.
 */
export function HandCursor3D({ read }: Props) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const dot = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const c = read();
    g.visible = c.visible;
    if (!c.visible) return;
    const k = 1 - Math.exp(-dt * 25);
    g.position.x += (c.x - g.position.x) * k;
    g.position.y += (c.y - g.position.y) * k;
    g.position.z = 0.8;

    if (ring.current) {
      ring.current.scale.setScalar(1 - c.pinchStrength * 0.55);
      (ring.current.material as THREE.MeshBasicMaterial).color.set(c.grabbing ? '#facc15' : c.pinching ? '#60a5fa' : '#e2e8f0');
    }
    if (dot.current) {
      (dot.current.material as THREE.MeshBasicMaterial).color.set(c.grabbing ? '#facc15' : '#ffffff');
    }
  });

  return (
    <group ref={group} visible={false}>
      <mesh ref={ring}>
        <ringGeometry args={[0.16, 0.2, 32]} />
        <meshBasicMaterial color="#e2e8f0" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={dot}>
        <circleGeometry args={[0.05, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
