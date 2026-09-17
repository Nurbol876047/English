'use client';

import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Select } from '@react-three/postprocessing';
import * as THREE from 'three';
import { BASKET_HEX, useSortWordsStore, type Basket } from '@/store/sortWordsStore';

interface Props {
  basket: Basket;
}

const RADIUS = 1.15;
const HEIGHT = 1.1;

/**
 * Корзина-категория: полупрозрачный «колодец» (открытый цилиндр) с
 * светящимся ободком. Подсвечивается, когда над ней захваченное слово
 * (hoverBasket) или когда ладонь движется в её сторону (aimBasket).
 * Клик по корзине — самый простой способ отсортировать слово мышью.
 */
export function Basket3D({ basket }: Props) {
  const hovered = useSortWordsStore((s) => s.hoverBasket === basket.index);
  const aimed = useSortWordsStore((s) => s.aimBasket === basket.index);
  const active = hovered || aimed;
  const hex = BASKET_HEX[basket.color];

  const group = useRef<THREE.Group>(null);
  const rim = useRef<THREE.LineSegments>(null);
  const wall = useRef<THREE.Mesh>(null);
  const floor = useRef<THREE.Mesh>(null);
  const lastCount = useRef(basket.count);
  const pulseStart = useRef<number | null>(null);

  const color = useMemo(() => new THREE.Color(hex), [hex]);
  const dim = useMemo(() => new THREE.Color(hex).multiplyScalar(0.45), [hex]);
  const rimGeometry = useMemo(() => new THREE.EdgesGeometry(new THREE.TorusGeometry(RADIUS, 0.03, 6, 48)), []);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const k = 1 - Math.exp(-dt * 10);

    // вспышка при попадании: счётчик вырос → короткий импульс масштаба
    if (basket.count !== lastCount.current) {
      lastCount.current = basket.count;
      pulseStart.current = state.clock.elapsedTime;
    }
    let pulse = 0;
    if (pulseStart.current !== null) {
      const t = state.clock.elapsedTime - pulseStart.current;
      pulse = t < 0.4 ? Math.sin((t / 0.4) * Math.PI) * 0.18 : 0;
    }
    const targetScale = (active ? 1.08 : 1) + pulse;
    g.scale.setScalar(g.scale.x + (targetScale - g.scale.x) * k);

    if (rim.current) {
      const m = rim.current.material as THREE.LineBasicMaterial;
      m.color.lerp(active ? color : dim, k);
    }
    if (wall.current) {
      const m = wall.current.material as THREE.MeshStandardMaterial;
      m.opacity += ((active ? 0.45 : 0.22) - m.opacity) * k;
      m.emissiveIntensity += ((active ? 1.4 : 0.35) + pulse * 4 - m.emissiveIntensity) * k;
    }
    if (floor.current) {
      const m = floor.current.material as THREE.MeshBasicMaterial;
      m.opacity += ((active ? 0.5 : 0.25) - m.opacity) * k;
    }
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const st = useSortWordsStore.getState();
    if (st.currentWord?.state === 'waiting') st.sortWord(basket.index);
  };

  return (
    <group position={basket.position}>
      <group ref={group}>
        {/* стенки колодца — открытый цилиндр, виден изнутри и снаружи */}
        <mesh ref={wall} position={[0, -HEIGHT / 2, 0]} onClick={onClick}>
          <cylinderGeometry args={[RADIUS, RADIUS * 0.85, HEIGHT, 48, 1, true]} />
          <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={0.35} transparent opacity={0.22} side={THREE.DoubleSide} roughness={0.6} />
        </mesh>
        {/* дно */}
        <mesh ref={floor} position={[0, -HEIGHT, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[RADIUS * 0.85, 48]} />
          <meshBasicMaterial color={hex} transparent opacity={0.25} />
        </mesh>
        {/* светящийся ободок — только он попадает в bloom */}
        <Select enabled={active}>
          <lineSegments ref={rim} geometry={rimGeometry} rotation={[Math.PI / 2, 0, 0]}>
            <lineBasicMaterial color={dim} toneMapped={false} />
          </lineSegments>
        </Select>
      </group>

      <Text position={[0, 0.55, 0]} fontSize={0.34} color={hex} anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor="#0b0e14">
        {basket.label}
      </Text>
      {/* счётчик — на передней стенке, чтобы не уходить за нижний край экрана */}
      <Text position={[0, -0.45, RADIUS * 0.95]} fontSize={0.26} color="#e2e8f0" anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor="#0b0e14">
        {String(basket.count)}
      </Text>
    </group>
  );
}
