import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';

const COUNT = 1500;

export default function WaterEffect() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const noise3D = useMemo(() => createNoise3D(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < COUNT; i++) {
      const t = i / COUNT;
      const angle = t * Math.PI * 20; 
      temp.push({
        angle,
        phase: Math.random() * Math.PI * 2,
        speed: 1.5 + Math.random() * 1.5, // Natural speed
      });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    particles.forEach((p, i) => {
      // Flow upwards continuously
      const flowTime = (time * p.speed + p.phase) % 10;
      const t = flowTime / 10; // 0 to 1
      
      const angle = p.angle + time * 3; 
      // Classic tornado/vortex shape: narrow base, wide top
      const radius = 0.5 + Math.pow(t, 2) * 3.0;
      const height = t * 8 - 1;

      // Add noise for turbulence
      const nX = noise3D(radius, angle, time * 0.5) * 0.5;
      const nZ = noise3D(angle, height, time * 0.5) * 0.5;

      dummy.position.set(
        Math.cos(angle) * radius + nX,
        height,
        Math.sin(angle) * radius + nZ
      );

      // Drops are thicker in the middle, taper at ends
      const scale = 0.15 * Math.sin(t * Math.PI) + 0.05;
      
      dummy.rotation.y = -angle; // follow the curve
      dummy.scale.set(scale, scale, scale * 2); // stretch along flow direction
      
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} castShadow receiveShadow>
      <sphereGeometry args={[1, 16, 16]} />
      <meshPhysicalMaterial 
        color="#81d4fa" 
        emissive="#0277bd"
        emissiveIntensity={0.3}
        transmission={0.95} 
        transparent
        opacity={1} 
        metalness={0.1} 
        roughness={0.1} 
        ior={1.33} 
        thickness={0.5}
      />
    </instancedMesh>
  );
}
