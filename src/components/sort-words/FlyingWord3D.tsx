'use client';

import { useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import { Select } from '@react-three/postprocessing';
import * as THREE from 'three';
import { BASKET_HEX, useSortWordsStore, WAIT_POINT, type ActiveWord } from '@/store/sortWordsStore';

interface Props {
  word: ActiveWord;
}

const SPAWN_Z = -12;
const INCOMING_S = 0.6;
const FLIGHT_S = 0.45;
const TILE_H = 0.7;
const TILE_D = 0.16;

const C_BASE = new THREE.Color('#1c2333');
const C_GRABBED = new THREE.Color('#2b3a5c');
const C_ERROR = new THREE.Color('#4a1b22');
const E_NONE = new THREE.Color('#000000');
const E_GRABBED = new THREE.Color('#3b82f6');
const E_ERROR = new THREE.Color('#ef4444');

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInQuad = (t: number) => t * t;

/**
 * Слово-плашка. Состояния и их анимации:
 *  incoming — вылет из глубины (z = -12) в точку ожидания, ease-out 0.6 с
 *  waiting  — парит: y += sin(t·2)·0.08, rotation.z = sin(t·1.3)·0.04
 *  grabbed  — следует за курсором с лагом (lerp speed 14), увеличена
 *  flying   — квадратичная Безье в корзину: P0 текущая позиция,
 *             P1 над корзиной [bx, 1.5, 0], P2 центр корзины [bx, -2.2, 0]
 *  rejected — красный shake на месте, затем обратно в waiting
 */
export function FlyingWord3D({ word }: Props) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const phaseStart = useRef<number | null>(null);
  const phase = useRef<ActiveWord['state'] | null>(null);
  const flightFrom = useRef(new THREE.Vector3());
  const width = Math.max(1.1, 0.2 * word.text.length + 0.5);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const st = useSortWordsStore.getState();
    const now = state.clock.elapsedTime;

    // фиксируем момент смены фазы
    if (phase.current !== word.state) {
      phase.current = word.state;
      phaseStart.current = now;
      if (word.state === 'flying') flightFrom.current.copy(g.position);
      if (word.state === 'incoming') g.position.set(WAIT_POINT[0], WAIT_POINT[1], SPAWN_Z);
    }
    const t = now - (phaseStart.current ?? now);
    const k = 1 - Math.exp(-dt * 14);

    switch (word.state) {
      case 'incoming': {
        const u = easeOutCubic(Math.min(1, t / INCOMING_S));
        g.position.set(WAIT_POINT[0], WAIT_POINT[1], SPAWN_Z + (0 - SPAWN_Z) * u);
        g.rotation.z = 0;
        if (u >= 1) st.onArrive();
        break;
      }
      case 'waiting': {
        g.position.x += (WAIT_POINT[0] - g.position.x) * k;
        g.position.y += (WAIT_POINT[1] + Math.sin(now * 2) * 0.08 - g.position.y) * k;
        g.position.z += (0 - g.position.z) * k;
        g.rotation.z = Math.sin(now * 1.3) * 0.04;
        break;
      }
      case 'grabbed': {
        g.position.x += (st.cursor.x - g.position.x) * k;
        g.position.y += (st.cursor.y - g.position.y) * k;
        g.position.z += (0.5 - g.position.z) * k;
        g.rotation.z += (Math.sin(now * 3) * 0.06 - g.rotation.z) * k;
        break;
      }
      case 'flying': {
        const basket = word.targetBasket !== null ? st.baskets[word.targetBasket] : null;
        if (!basket) break;
        const u = easeInQuad(Math.min(1, t / FLIGHT_S));
        const p0 = flightFrom.current;
        const p1x = basket.position[0];
        const p1y = 1.5;
        const p2x = basket.position[0];
        const p2y = basket.position[1];
        // B(u) = (1-u)²·P0 + 2(1-u)u·P1 + u²·P2
        const a = (1 - u) * (1 - u);
        const b = 2 * (1 - u) * u;
        const c = u * u;
        g.position.x = a * p0.x + b * p1x + c * p2x;
        g.position.y = a * p0.y + b * p1y + c * p2y;
        g.position.z = a * p0.z;
        g.rotation.z += (0.4 * (p2x >= p0.x ? -1 : 1) - g.rotation.z) * k;
        const s = 1 - u * 0.6;
        g.scale.setScalar(s);
        if (u >= 1) st.onFlightEnd();
        break;
      }
      case 'rejected': {
        g.position.x = WAIT_POINT[0] + Math.sin(t * 45) * 0.1 * Math.max(0, 1 - t * 1.8);
        g.position.y += (WAIT_POINT[1] - g.position.y) * k;
        break;
      }
    }

    if (word.state !== 'flying') {
      const target = word.state === 'grabbed' ? 1.18 : 1;
      g.scale.setScalar(g.scale.x + (target - g.scale.x) * (1 - Math.exp(-dt * 12)));
    }

    if (mat.current) {
      const isErr = word.state === 'rejected' || word.flewWrong;
      const isGrab = word.state === 'grabbed';
      mat.current.color.lerp(isErr ? C_ERROR : isGrab ? C_GRABBED : C_BASE, k);
      mat.current.emissive.lerp(isErr ? E_ERROR : isGrab ? E_GRABBED : E_NONE, k);
      const ei = isErr ? 1.2 : isGrab ? 0.9 : 0;
      mat.current.emissiveIntensity += (ei - mat.current.emissiveIntensity) * k;
    }
  });

  // Fallback на мышь/тач: захват плашки pointer-событием R3F
  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    const st = useSortWordsStore.getState();
    if (st.controlMode !== 'pinch') return; // в swipe-режиме pointerdown уходит контроллеру
    e.stopPropagation();
    if (st.grabWord('pointer')) st.setCursor({ x: e.point.x, y: e.point.y, z: 0, visible: true });
  };

  const glowColor = word.state === 'flying' && word.targetBasket !== null && !word.flewWrong
    ? BASKET_HEX[useSortWordsStore.getState().baskets[word.targetBasket].color]
    : undefined;

  return (
    <group ref={group} position={[WAIT_POINT[0], WAIT_POINT[1], SPAWN_Z]}>
      <Select enabled={word.state === 'grabbed' || word.state === 'rejected' || word.state === 'flying'}>
        <RoundedBox
          args={[width, TILE_H, TILE_D]}
          radius={0.12}
          smoothness={4}
          onPointerDown={onPointerDown}
          onPointerOver={() => {
            if (word.state === 'waiting') document.body.style.cursor = 'grab';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
        >
          <meshStandardMaterial ref={mat} color={C_BASE} emissive={glowColor ?? '#000000'} roughness={0.35} metalness={0.4} />
        </RoundedBox>
      </Select>
      <Text position={[0, 0, TILE_D / 2 + 0.01]} fontSize={0.3} color="#f1f5f9" anchorX="center" anchorY="middle" outlineWidth={0.008} outlineColor="#0b0e14">
        {word.text}
      </Text>
    </group>
  );
}
