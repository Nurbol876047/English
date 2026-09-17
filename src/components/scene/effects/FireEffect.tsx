import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';

/**
 * Магия огня — огненный вихрь по той же схеме, что земля / вода / ветер:
 * инстансированные языки пламени непрерывно поднимаются по спирали.
 * В отличие от воды, огонь ШИРОКИЙ у основания и сужается кверху, а цвет
 * меняется по высоте: белое ядро → жёлтый → оранжевый → тёмно-красный →
 * гаснет. Плюс искры, разлетающиеся наружу, и раскалённое кольцо внизу.
 *
 * Частицы мелкие и полупрозрачные, чтобы аддитивное смешение давало
 * свечение, а не сплошное белое пятно.
 */

const FLAMES = 2200;
const SPARKS = 250;

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

// градиент пламени по высоте (t 0..1)
const C_CORE = new THREE.Color('#fff7d6');
const C_YELLOW = new THREE.Color('#ffca28');
const C_ORANGE = new THREE.Color('#ff6d00');
const C_RED = new THREE.Color('#b71c1c');
const C_DARK = new THREE.Color('#3e0a05');

function flameColor(t: number, out: THREE.Color): THREE.Color {
  if (t < 0.15) return out.copy(C_CORE).lerp(C_YELLOW, t / 0.15);
  if (t < 0.4) return out.copy(C_YELLOW).lerp(C_ORANGE, (t - 0.15) / 0.25);
  if (t < 0.7) return out.copy(C_ORANGE).lerp(C_RED, (t - 0.4) / 0.3);
  return out.copy(C_RED).lerp(C_DARK, (t - 0.7) / 0.3);
}

export default function FireEffect() {
  const flamesRef = useRef<THREE.InstancedMesh>(null);
  const sparksRef = useRef<THREE.InstancedMesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const noise3D = useMemo(() => createNoise3D(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorTmp = useMemo(() => new THREE.Color(), []);

  const flames = useMemo(() => {
    const rnd = seeded(5);
    const temp = [];
    for (let i = 0; i < FLAMES; i++) {
      temp.push({
        angle: (i / FLAMES) * Math.PI * 18,
        phase: rnd() * Math.PI * 2,
        speed: 1.6 + rnd() * 1.6, // огонь быстрее камня
        size: 0.07 + rnd() * 0.14,
        spread: rnd(), // 0 — у оси, 1 — на краю
        flicker: rnd() * 10,
      });
    }
    return temp;
  }, []);

  const sparks = useMemo(() => {
    const rnd = seeded(77);
    const temp = [];
    for (let i = 0; i < SPARKS; i++) {
      temp.push({
        angle: rnd() * Math.PI * 2,
        phase: rnd(),
        speed: 0.35 + rnd() * 0.4,
        drift: 1.5 + rnd() * 2.5, // насколько далеко улетает наружу
        size: 0.02 + rnd() * 0.03,
      });
    }
    return temp;
  }, []);

  const flameColors = useMemo(() => new Float32Array(FLAMES * 3), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // ── языки пламени ──
    const fm = flamesRef.current;
    if (fm) {
      flames.forEach((f, i) => {
        const flow = (time * f.speed + f.phase) % 6;
        const t = flow / 6;

        const angle = f.angle + time * 2.8;
        // широкое основание, сужается кверху; spread размазывает по толщине
        const radius = (0.55 + f.spread * 1.5) * Math.pow(1 - t, 1.4) + 0.08;
        const height = t * 6 - 0.3;

        const turb = 0.2 + t * 0.5; // выше — турбулентнее
        const nX = noise3D(f.flicker, height, time * 1.5) * turb;
        const nZ = noise3D(height, f.flicker, time * 1.5 + 50) * turb;

        dummy.position.set(Math.cos(angle) * radius + nX, height, Math.sin(angle) * radius + nZ);

        // вспыхивают у основания, гаснут наверху; лёгкое мерцание
        const life = Math.pow(Math.sin(t * Math.PI), 0.7) * (0.85 + Math.sin(time * 12 + f.flicker) * 0.15);
        const s = f.size * life;
        dummy.scale.set(s, s * 2.2, s); // вытянуты вверх — язык пламени
        dummy.rotation.set(nX * 0.5, -angle, nZ * 0.5);

        dummy.updateMatrix();
        fm.setMatrixAt(i, dummy.matrix);

        // ядро чуть ярче 1 → bloom подсвечивает только низ
        flameColor(t, colorTmp);
        if (t < 0.2) colorTmp.multiplyScalar(1.35);
        colorTmp.toArray(flameColors, i * 3);
      });
      fm.instanceMatrix.needsUpdate = true;
      if (fm.instanceColor) fm.instanceColor.needsUpdate = true;
    }

    // ── искры: вылетают из ядра, поднимаются и уносятся наружу ──
    const sm = sparksRef.current;
    if (sm) {
      sparks.forEach((sp, i) => {
        const life = (time * sp.speed + sp.phase) % 1;
        const angle = sp.angle + time * 1.2 + life * 2;
        const radius = 0.4 + life * sp.drift * 1.3;
        const y = life * 7 + Math.sin(life * 9 + i) * 0.2;
        dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
        const s = sp.size * (1 - life * 0.7);
        dummy.scale.set(s, s, s);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        sm.setMatrixAt(i, dummy.matrix);
      });
      sm.instanceMatrix.needsUpdate = true;
    }

    // ── раскалённое кольцо у основания ──
    if (ringRef.current) {
      const m = ringRef.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 2 + Math.sin(time * 6) * 0.5 + noise3D(time, 0, 0) * 0.4;
      const s = 1 + Math.sin(time * 4) * 0.03;
      ringRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group>
      <instancedMesh ref={flamesRef} args={[undefined, undefined, FLAMES]}>
        <sphereGeometry args={[1, 8, 8]}>
          <instancedBufferAttribute attach="attributes-color" args={[flameColors, 3]} />
        </sphereGeometry>
        <meshBasicMaterial vertexColors transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>

      <instancedMesh ref={sparksRef} args={[undefined, undefined, SPARKS]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color={[2.5, 1.4, 0.4]} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>

      {/* раскалённое кольцо у основания вихря */}
      <mesh ref={ringRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.3, 1.45, 48]} />
        <meshStandardMaterial color="#ff6d00" emissive="#ff8f00" emissiveIntensity={2} toneMapped={false} transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
