'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Select } from '@react-three/postprocessing';
import * as THREE from 'three';
import { trailBuffer } from '@/hooks/sort-words/useSortController';
import { useSortWordsStore } from '@/store/sortWordsStore';

const FADE_MS = 300;

function createTrailLine(): THREE.Line {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(trailBuffer.capacity * 3), 3));
  geometry.setDrawRange(0, 0);
  const material = new THREE.LineBasicMaterial({ color: '#facc15', transparent: true, opacity: 0, toneMapped: false });
  const line = new THREE.Line(geometry, material);
  line.frustumCulled = false;
  return line;
}

/**
 * След ладони в режиме swipe: линия по последним позициям курсора,
 * гаснет за 300 мс. Буфер точек мутируется контроллером, здесь только
 * перекладываем его в BufferGeometry — без React-state.
 */
export function SwipeTrail3D() {
  const group = useRef<THREE.Group>(null);
  const lineRef = useRef<THREE.Line | null>(null);

  // Линию создаём императивно и вешаем на группу — так её можно мутировать
  // в useFrame, не нарушая правила чистоты рендера
  useEffect(() => {
    const g = group.current;
    if (!g) return;
    const line = createTrailLine();
    lineRef.current = line;
    g.add(line);
    return () => {
      lineRef.current = null;
      g.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    };
  }, []);

  useFrame(() => {
    const line = lineRef.current;
    if (!line) return;
    const st = useSortWordsStore.getState();
    const geometry = line.geometry;
    const material = line.material as THREE.LineBasicMaterial;
    const now = performance.now();
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    let n = 0;
    let newest = 0;
    // точки от старой к новой; берём только не старше FADE_MS
    for (let i = trailBuffer.count - 1; i >= 0; i--) {
      const idx = ((trailBuffer.head - 1 - i + trailBuffer.capacity * 2) % trailBuffer.capacity) * 3;
      const t = trailBuffer.points[idx + 2];
      if (now - t > FADE_MS) continue;
      pos.setXYZ(n, trailBuffer.points[idx], trailBuffer.points[idx + 1], 0.6);
      newest = t;
      n++;
    }
    pos.needsUpdate = true;
    geometry.setDrawRange(0, n);
    const visible = st.controlMode === 'swipe' && n > 1;
    material.opacity = visible ? Math.max(0, 1 - (now - newest) / FADE_MS) * 0.9 : 0;
  });

  return (
    <Select enabled>
      <group ref={group} />
    </Select>
  );
}
