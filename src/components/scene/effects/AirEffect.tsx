import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';

/**
 * Магия воздуха — торнадо по той же схеме, что земля / огонь / вода:
 * инстансированные полупрозрачные пряди воздуха поднимаются по спирали.
 * Форма — классическая воронка: узкая у земли, плавно расширяется кверху.
 * Ближе к оси воздух крутится быстрее (как в настоящем вихре), пряди
 * вытянуты вдоль движения. Плюс подхваченный с земли мусор (листья, пыль),
 * который кружит у основания, и пыльное кольцо на земле.
 *
 * Полосы бледные и полупрозрачные, обычное смешение — вихрь читается как
 * форма, а не как белое пятно.
 */

const WISPS = 1800;
const DEBRIS = 220;

/** Детерминированный ПСЧ (mulberry32) — раскладка стабильна и без Math.random в рендере */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HEIGHT = 7;

/** Радиус воронки на высоте h (0..HEIGHT): узкая внизу, широкая вверху */
function funnelRadius(h: number): number {
  const u = Math.max(0, h) / HEIGHT;
  return 0.6 + Math.pow(u, 1.6) * 3.4;
}

const WISP_PALETTE = ['#e8f1f8', '#d3e3ee', '#c5d7e4', '#f2f7fb', '#b9cbd8'];
const DEBRIS_PALETTE = ['#6b8e3a', '#8a6d3b', '#4f6b2e', '#a3865a'];

export default function AirEffect() {
  const wispsRef = useRef<THREE.InstancedMesh>(null);
  const debrisRef = useRef<THREE.InstancedMesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const noise3D = useMemo(() => createNoise3D(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const wisps = useMemo(() => {
    const rnd = seeded(31);
    const temp = [];
    for (let i = 0; i < WISPS; i++) {
      temp.push({
        angle: rnd() * Math.PI * 2,
        phase: rnd(),
        rise: 0.12 + rnd() * 0.16, // циклов подъёма в секунду
        // 0 — у самой стенки воронки, 1 — чуть внутрь; вихрь полый в центре
        depth: rnd() * 0.35,
        length: 0.5 + rnd() * 0.9,
        thickness: 0.03 + rnd() * 0.04,
        color: WISP_PALETTE[Math.floor(rnd() * WISP_PALETTE.length)],
        alphaSeed: rnd(),
      });
    }
    return temp;
  }, []);

  const debris = useMemo(() => {
    const rnd = seeded(64);
    const temp = [];
    for (let i = 0; i < DEBRIS; i++) {
      temp.push({
        angle: rnd() * Math.PI * 2,
        phase: rnd(),
        speed: 0.18 + rnd() * 0.2,
        size: 0.05 + rnd() * 0.07,
        tumble: (rnd() - 0.5) * 8,
        color: DEBRIS_PALETTE[Math.floor(rnd() * DEBRIS_PALETTE.length)],
      });
    }
    return temp;
  }, []);

  const wispColors = useMemo(() => {
    const arr = new Float32Array(WISPS * 3);
    const c = new THREE.Color();
    wisps.forEach((w, i) => c.set(w.color).toArray(arr, i * 3));
    return arr;
  }, [wisps]);

  const debrisColors = useMemo(() => {
    const arr = new Float32Array(DEBRIS * 3);
    const c = new THREE.Color();
    debris.forEach((d, i) => c.set(d.color).toArray(arr, i * 3));
    return arr;
  }, [debris]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // ── пряди воздуха ──
    const wm = wispsRef.current;
    if (wm) {
      wisps.forEach((w, i) => {
        const t = (time * w.rise + w.phase) % 1; // 0 низ → 1 верх
        const h = t * HEIGHT - 0.4;
        const r = funnelRadius(h) * (1 - w.depth);
        // угловая скорость выше у оси и у земли — как в настоящем вихре
        const omega = 2.2 + 3.5 / (0.6 + r);
        const angle = w.angle + time * omega;

        const nX = noise3D(r, h * 0.5, time * 0.6) * 0.25;
        const nY = noise3D(h, angle * 0.3, time * 0.4) * 0.3;

        const x = Math.cos(angle) * r + nX;
        const z = Math.sin(angle) * r + nX * 0.5;
        dummy.position.set(x, h + nY, z);

        // вытянуть вдоль касательной к спирали, слегка наклонить вверх по подъёму
        dummy.rotation.set(0, -angle, 0.18);
        // тонкая у земли и на самом верху, плотнее посередине
        const vis = Math.pow(Math.sin(t * Math.PI), 0.5);
        const len = w.length * (0.6 + r * 0.25) * vis;
        dummy.scale.set(len, w.thickness * vis, w.thickness * 2 * vis);

        dummy.updateMatrix();
        wm.setMatrixAt(i, dummy.matrix);
      });
      wm.instanceMatrix.needsUpdate = true;
    }

    // ── мусор: подхватывается у земли, кружит и вылетает наверху ──
    const dm = debrisRef.current;
    if (dm) {
      debris.forEach((d, i) => {
        const life = (time * d.speed + d.phase) % 1;
        const h = life * HEIGHT * 0.8 - 0.3;
        const r = funnelRadius(h) * 0.9 + 0.2;
        const angle = d.angle + time * (2.5 + 3 / (0.6 + r));
        dummy.position.set(Math.cos(angle) * r, h, Math.sin(angle) * r);
        const s = d.size * Math.pow(Math.sin(life * Math.PI), 0.4);
        dummy.scale.set(s, s * 0.25, s * 0.7); // плоский листок
        dummy.rotation.set(time * d.tumble, -angle, time * d.tumble * 0.6);
        dummy.updateMatrix();
        dm.setMatrixAt(i, dummy.matrix);
      });
      dm.instanceMatrix.needsUpdate = true;
    }

    // ── пыльное кольцо на земле медленно крутится и «дышит» ──
    if (ringRef.current) {
      ringRef.current.rotation.z = -time * 0.8;
      const s = 1 + Math.sin(time * 2.5) * 0.05 + noise3D(time * 0.5, 1, 1) * 0.04;
      ringRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group>
      <instancedMesh ref={wispsRef} args={[undefined, undefined, WISPS]}>
        <capsuleGeometry args={[0.5, 1, 2, 6]}>
          <instancedBufferAttribute attach="attributes-color" args={[wispColors, 3]} />
        </capsuleGeometry>
        {/* обычное смешение с низкой прозрачностью — без засветки */}
        <meshBasicMaterial vertexColors transparent opacity={0.15} depthWrite={false} />
      </instancedMesh>

      <instancedMesh ref={debrisRef} args={[undefined, undefined, DEBRIS]}>
        <boxGeometry args={[1, 1, 1]}>
          <instancedBufferAttribute attach="attributes-color" args={[debrisColors, 3]} />
        </boxGeometry>
        <meshStandardMaterial vertexColors roughness={0.9} flatShading />
      </instancedMesh>

      {/* пыльное кольцо у основания воронки */}
      <mesh ref={ringRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 1.4, 64]} />
        <meshBasicMaterial color="#cfd8dc" transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}
