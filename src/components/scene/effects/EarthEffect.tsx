import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';

/**
 * Магия земли — каменный вихрь, по той же схеме, что вода / огонь / ветер:
 * инстансированные частицы непрерывно поднимаются по спирали, вихрь узкий
 * у основания и широкий кверху. Только вместо капель — угловатые обломки
 * камня, которые кувыркаются в полёте; часть из них — светящиеся зелёные
 * осколки (энергия земли), плюс пыль и кольцо-разлом у основания.
 */

const ROCKS = 900;
const DUST = 1200;

const GLOW = '#8bc34a';

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

const STONE_PALETTE = ['#b8a48c', '#9c8871', '#c9b69e', '#857463', '#a89680'];

export default function EarthEffect() {
  const rocksRef = useRef<THREE.InstancedMesh>(null);
  const dustRef = useRef<THREE.Points>(null);
  const crackRef = useRef<THREE.Mesh>(null);
  const noise3D = useMemo(() => createNoise3D(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const rocks = useMemo(() => {
    const rnd = seeded(11);
    const temp = [];
    for (let i = 0; i < ROCKS; i++) {
      const glowing = rnd() > 0.82;
      temp.push({
        angle: (i / ROCKS) * Math.PI * 24, // несколько витков спирали
        phase: rnd() * Math.PI * 2,
        speed: 0.9 + rnd() * 0.9, // камни тяжелее капель — поднимаются медленнее
        size: glowing ? 0.05 + rnd() * 0.07 : 0.07 + rnd() * 0.15,
        // неравномерный масштаб — обломок, а не шарик
        sx: 0.7 + rnd() * 0.6,
        sy: 0.5 + rnd() * 0.5,
        sz: 0.8 + rnd() * 0.7,
        tumble: (rnd() - 0.5) * 6,
        glowing,
        color: glowing ? GLOW : STONE_PALETTE[Math.floor(rnd() * STONE_PALETTE.length)],
      });
    }
    return temp;
  }, []);

  // цвет каждого обломка — статичный instanceColor
  const colorArray = useMemo(() => {
    const arr = new Float32Array(ROCKS * 3);
    const c = new THREE.Color();
    rocks.forEach((r, i) => {
      c.set(r.color);
      if (r.glowing) c.multiplyScalar(2.2); // > 1 → подхватит bloom (порог 1)
      c.toArray(arr, i * 3);
    });
    return arr;
  }, [rocks]);

  const dustSeeds = useMemo(() => {
    const rnd = seeded(23);
    return Array.from({ length: DUST }, () => ({
      angle: rnd() * Math.PI * 2,
      phase: rnd(),
      speed: 0.15 + rnd() * 0.25,
      spread: rnd(),
    }));
  }, []);
  const dustArray = useMemo(() => new Float32Array(DUST * 3), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // ── каменный вихрь ──
    const mesh = rocksRef.current;
    if (mesh) {
      rocks.forEach((r, i) => {
        // непрерывный поток снизу вверх, как у воды: t 0..1 за цикл
        const flow = (time * r.speed + r.phase) % 10;
        const t = flow / 10;

        const angle = r.angle + time * 2.2;
        // узкое основание, широкая вершина
        const radius = 0.5 + Math.pow(t, 1.6) * 2.8;
        const height = t * 6 - 0.5;

        const nX = noise3D(radius, angle, time * 0.4) * 0.6;
        const nZ = noise3D(angle, height, time * 0.4) * 0.6;

        dummy.position.set(Math.cos(angle) * radius + nX, height, Math.sin(angle) * radius + nZ);

        // появляются из земли и рассыпаются наверху
        const life = Math.pow(Math.sin(t * Math.PI), 0.6);
        const s = r.size * life;
        dummy.scale.set(s * r.sx, s * r.sy, s * r.sz);
        dummy.rotation.set(time * r.tumble + i, -angle + time * r.tumble * 0.5, i * 0.7);

        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }

    // ── пыль — тот же вихрь, но шире и легче ──
    if (dustRef.current) {
      const pos = dustRef.current.geometry.attributes.position as THREE.BufferAttribute;
      dustSeeds.forEach((d, i) => {
        const life = (time * d.speed + d.phase) % 1;
        const angle = d.angle + time * 1.4 + life * 4;
        const radius = 0.8 + life * 3.6 + d.spread * 0.8;
        pos.setXYZ(i, Math.cos(angle) * radius, -0.3 + life * 6.5, Math.sin(angle) * radius);
      });
      pos.needsUpdate = true;
    }

    // ── кольцо-разлом у основания пульсирует ──
    if (crackRef.current) {
      const m = crackRef.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 1.8 + Math.sin(time * 3) * 0.7;
      crackRef.current.rotation.z = time * 0.15;
    }
  });

  return (
    <group>
      <instancedMesh ref={rocksRef} args={[undefined, undefined, ROCKS]} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 0]}>
          <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
        </icosahedronGeometry>
        <meshStandardMaterial vertexColors roughness={0.95} metalness={0.05} flatShading toneMapped={false} />
      </instancedMesh>

      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustArray, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#b9a58f" size={0.05} transparent opacity={0.5} depthWrite={false} sizeAttenuation />
      </points>

      {/* светящаяся трещина у основания вихря */}
      <mesh ref={crackRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.05, 6]} />
        <meshStandardMaterial color={GLOW} emissive={GLOW} emissiveIntensity={2} toneMapped={false} transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
