'use client';

import { useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import { Select } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useWordOrderStore, type WordTile } from '@/store/wordOrderStore';

interface Props {
  tile: WordTile;
}

const TILE_H = 0.62;
const TILE_D = 0.14;

const COLORS = {
  tray: new THREE.Color('#1c2333'),
  grabbed: new THREE.Color('#2b3a5c'),
  placed: new THREE.Color('#123d2a'),
  error: new THREE.Color('#4a1b22'),
} as const;

const EMISSIVE = {
  tray: new THREE.Color('#000000'),
  grabbed: new THREE.Color('#3b82f6'),
  placed: new THREE.Color('#22c55e'),
  error: new THREE.Color('#ef4444'),
} as const;

function tileWidth(word: string): number {
  return Math.max(0.85, 0.19 * word.length + 0.36);
}

/**
 * Плашка со словом. Позиция/масштаб анимируются вручную в useFrame
 * (экспоненциальный lerp): захваченная плашка «догоняет» курсор с лёгким
 * отставанием, размещённая — плавно садится в ячейку, ошибочная — трясётся.
 */
export function WordTile3D({ tile }: Props) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const errorStart = useRef<number | null>(null);
  const width = tileWidth(tile.word);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const st = useWordOrderStore.getState();

    let target: readonly [number, number, number];
    let z = 0;
    if (tile.state === 'grabbed') {
      target = [st.cursor.x, st.cursor.y, 0];
      z = 0.5; // приподнимаем над плоскостью, чтобы плашка «висела» в руке
    } else if (tile.state === 'placed' && tile.slotIndex !== null) {
      target = st.slots[tile.slotIndex].position;
    } else {
      target = tile.homePosition;
    }

    // lerp с постоянной времени: одинаково плавно при любом fps
    const k = 1 - Math.exp(-dt * (tile.state === 'grabbed' ? 14 : 8));
    g.position.x += (target[0] - g.position.x) * k;
    g.position.y += (target[1] - g.position.y) * k;
    g.position.z += (target[2] + z - g.position.z) * k;

    // shake при ошибке: затухающая синусоида по X
    if (tile.state === 'error') {
      if (errorStart.current === null) errorStart.current = state.clock.elapsedTime;
      const t = state.clock.elapsedTime - errorStart.current;
      g.position.x += Math.sin(t * 45) * 0.09 * Math.max(0, 1 - t * 1.8);
    } else {
      errorStart.current = null;
    }

    // длинные слова ужимаются под шаг раскладки, чтобы не наезжать на соседей;
    // в руке плашка наоборот увеличивается
    let targetScale = 1;
    if (tile.state === 'grabbed') targetScale = 1.18;
    else if (st.slots.length > 1) {
      const spacing = Math.abs(st.slots[1].position[0] - st.slots[0].position[0]);
      targetScale = Math.min(1, (spacing - 0.2) / width);
    }
    const s = g.scale.x + (targetScale - g.scale.x) * (1 - Math.exp(-dt * 12));
    g.scale.setScalar(s);

    // лёгкий «дыхательный» наклон у захваченной плашки
    const targetRot = tile.state === 'grabbed' ? Math.sin(state.clock.elapsedTime * 3) * 0.06 : 0;
    g.rotation.z += (targetRot - g.rotation.z) * k;

    if (mat.current) {
      mat.current.color.lerp(COLORS[tile.state], k);
      mat.current.emissive.lerp(EMISSIVE[tile.state], k);
      const ei = tile.state === 'grabbed' ? 0.9 : tile.state === 'placed' ? 0.5 : tile.state === 'error' ? 1.2 : 0;
      mat.current.emissiveIntensity += (ei - mat.current.emissiveIntensity) * k;
    }
  });

  // Fallback на мышь/тач: R3F даёт pointer-события прямо на mesh
  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const st = useWordOrderStore.getState();
    if (st.grabTile(tile.id, 'pointer')) {
      st.setCursor({ x: e.point.x, y: e.point.y, z: 0, visible: true });
    }
  };

  const grabbed = tile.state === 'grabbed';

  return (
    <group ref={group} position={tile.homePosition}>
      {/* Select включает плашку в selective bloom только пока она в руке / ошибочна */}
      <Select enabled={grabbed || tile.state === 'error'}>
        <RoundedBox
          args={[width, TILE_H, TILE_D]}
          radius={0.1}
          smoothness={4}
          onPointerDown={onPointerDown}
          onPointerOver={() => {
            if (tile.state === 'tray') document.body.style.cursor = 'grab';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
        >
          <meshStandardMaterial ref={mat} color={COLORS.tray} roughness={0.35} metalness={0.4} />
        </RoundedBox>
      </Select>
      <Text
        position={[0, 0, TILE_D / 2 + 0.01]}
        fontSize={0.25}
        color="#f1f5f9"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.008}
        outlineColor="#0b0e14"
      >
        {tile.word}
      </Text>
    </group>
  );
}
