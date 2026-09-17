'use client';

import { useCallback, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { HandLandmark, HandLandmarks } from '@/lib/hand/handGeometry';

/**
 * Проекция 2D-координат (руки из MediaPipe или мыши) на плоскость
 * взаимодействия сцены z = 0. Общая часть для всех «ручных» упражнений.
 *
 *  1. Нормализованные координаты кадра (0..1) → NDC (-1..1).
 *     Кадр фронтальной камеры зеркальный, поэтому X инвертируем:
 *     пользователь двигает руку вправо → курсор идёт вправо.
 *  2. Луч из камеры через точку NDC пересекаем с плоскостью z = 0 —
 *     то же, что unproject() + продление до нужной глубины.
 */
export function useHandProjection() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  /** NDC → точка на плоскости z=0 (возвращает переиспользуемый вектор!) */
  const projectNdc = useCallback(
    (ndcX: number, ndcY: number): THREE.Vector3 | null => {
      ndc.set(ndcX, ndcY);
      raycaster.setFromCamera(ndc, camera);
      return raycaster.ray.intersectPlane(plane, hit) ? hit : null;
    },
    [camera, ndc, raycaster, plane, hit],
  );

  /** Нормализованная точка кадра камеры (уже с учётом зеркала) → сцена */
  const projectLandmark = useCallback(
    (p: HandLandmark): THREE.Vector3 | null => projectNdc((1 - p.x) * 2 - 1, 1 - p.y * 2),
    [projectNdc],
  );

  /** Центр ладони — среднее запястья и оснований пальцев; стабильнее кончика
   *  пальца при быстрых взмахах */
  const palmCenter = useCallback((lm: HandLandmarks): HandLandmark => {
    const idx = [0, 5, 9, 13, 17];
    let x = 0;
    let y = 0;
    let z = 0;
    for (const i of idx) {
      x += lm[i].x;
      y += lm[i].y;
      z += lm[i].z;
    }
    return { x: x / idx.length, y: y / idx.length, z: z / idx.length };
  }, []);

  /** Клиентские координаты pointer-события → сцена */
  const projectPointer = useCallback(
    (clientX: number, clientY: number): THREE.Vector3 | null => {
      const r = gl.domElement.getBoundingClientRect();
      return projectNdc(((clientX - r.left) / r.width) * 2 - 1, -(((clientY - r.top) / r.height) * 2 - 1));
    },
    [gl, projectNdc],
  );

  return { projectNdc, projectLandmark, projectPointer, palmCenter, camera, gl };
}
