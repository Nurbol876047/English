'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Select } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useWordOrderStore, type Slot } from '@/store/wordOrderStore';

interface Props {
  slot: Slot;
  spacing: number;
}

const C_IDLE = new THREE.Color('#334155');
const C_HOVER = new THREE.Color('#60a5fa');
const C_FILLED = new THREE.Color('#22c55e');

/**
 * Ячейка предложения: светящаяся outline-рамка (EdgesGeometry).
 * Подсвечивается ярче, когда захваченная плашка подведена близко
 * (hoverSlotIndex), и становится зелёной, когда заполнена.
 */
export function SlotZone3D({ slot, spacing }: Props) {
  const hovered = useWordOrderStore((s) => s.hoverSlotIndex === slot.index);
  const filled = slot.tileId !== null;
  const edges = useRef<THREE.LineSegments>(null);
  const fill = useRef<THREE.Mesh>(null);
  const w = Math.min(1.55, spacing - 0.15);

  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, 0.78)), [w]);

  useFrame((state, dt) => {
    const e = edges.current;
    if (!e) return;
    const k = 1 - Math.exp(-dt * 10);
    const m = e.material as THREE.LineBasicMaterial;
    m.color.lerp(filled ? C_FILLED : hovered ? C_HOVER : C_IDLE, k);
    // мягкая пульсация пустой ячейки — намёк «сюда»
    const pulse = filled ? 1 : 1 + Math.sin(state.clock.elapsedTime * 2 + slot.index) * 0.02;
    const target = hovered ? 1.1 : pulse;
    e.scale.setScalar(e.scale.x + (target - e.scale.x) * k);
    if (fill.current) {
      const fm = fill.current.material as THREE.MeshBasicMaterial;
      fm.opacity += ((hovered ? 0.6 : 0.3) - fm.opacity) * k;
    }
  });

  return (
    <group position={slot.position}>
      <mesh ref={fill} position={[0, 0, -0.01]}>
        <planeGeometry args={[w, 0.78]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.3} />
      </mesh>
      {/* В bloom попадает только подсвеченная / заполненная рамка */}
      <Select enabled={hovered || filled}>
        <lineSegments ref={edges} geometry={edgesGeometry}>
          <lineBasicMaterial color={C_IDLE} toneMapped={false} />
        </lineSegments>
      </Select>
      {!filled && (
        <Text position={[0, 0, 0.02]} fontSize={0.22} color="#475569" anchorX="center" anchorY="middle">
          {String(slot.index + 1)}
        </Text>
      )}
    </group>
  );
}
