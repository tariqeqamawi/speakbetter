"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { pointAt, seeded, sideAt, type RoadLayout } from "./road-geometry";

// Your Impact's destination: a city of light on the horizon, where the
// road ends. Dark glass towers with lit windows and a beacon on every
// roof, flying cars weaving between them trailing light - the place a
// voice reaches once it has learned to carry. It stands beyond the
// finish arch, with outskirts rising either side of the last stretch,
// so the whole of the final phase is spent travelling towards it.

function windowsTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, 64, 256);
  const rand = seeded(9);
  const lit = ["#ffd9f7", "#f53de0", "#22d9f5", "#ffffff", "#ffd60a"];
  for (let y = 4; y < 256; y += 8)
    for (let x = 4; x < 64; x += 10) {
      if (rand() < 0.42) continue;
      g.fillStyle = lit[Math.floor(rand() * lit.length)];
      g.globalAlpha = 0.35 + rand() * 0.65;
      g.fillRect(x, y, 5, 4);
    }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  // Many storeys to a tower, not a few giant windows.
  t.repeat.set(3, 6);
  return t;
}

interface Tower {
  pos: THREE.Vector3;
  w: number;
  d: number;
  h: number;
}

export function City({ road, start, color }: { road: RoadLayout; start: number; color: string }) {
  const towers = useMemo(() => {
    const rand = seeded(77);
    const out: Tower[] = [];
    const p = new THREE.Vector3();
    const side = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    // The city itself, beyond the finish: a grid of blocks with the road's
    // line left open, tallest at the centre.
    const centre = pointAt(road, road.finish + 150);
    pointAt(road, road.finish + 40, p);
    sideAt(road, road.finish + 40, side);
    tangent.set(side.z, 0, -side.x);
    for (let a = -9; a <= 9; a++)
      for (let b = 0; b < 14; b++) {
        if (rand() < 0.18) continue;
        const across = a * 18 + (rand() - 0.5) * 6;
        if (Math.abs(across) < 16 && b < 3) continue;
        const along = 20 + b * 20 + (rand() - 0.5) * 6;
        const pos = p.clone().addScaledVector(side, across).addScaledVector(tangent, along);
        const toCentre = pos.distanceTo(centre);
        const tall = 1 - THREE.MathUtils.smoothstep(toCentre, 20, 190);
        out.push({ pos, w: 7 + rand() * 7, d: 7 + rand() * 7, h: 18 + tall * 110 + rand() * 30 });
      }
    // Outskirts: towers far off either side of the final stretch, thicker
    // and taller as the road nears the city.
    for (let s = start; s < road.finish; s += 9) {
      pointAt(road, s, p);
      sideAt(road, s, side);
      const k = THREE.MathUtils.smoothstep(s, start, road.finish);
      for (const dir of [-1, 1]) {
        if (rand() > 0.35 + k * 0.5) continue;
        const across = dir * (95 + rand() * 80);
        out.push({ pos: p.clone().addScaledVector(side, across), w: 6 + rand() * 6, d: 6 + rand() * 6, h: 10 + k * 60 + rand() * 25 });
      }
    }
    return out;
  }, [road, start]);

  const bodies = useRef<THREE.InstancedMesh>(null);
  const tops = useRef<THREE.InstancedMesh>(null);
  const windows = useMemo(() => (typeof document === "undefined" ? null : windowsTexture()), []);

  // Place the towers once they exist.
  useEffect(() => {
    {
      const m = bodies.current;
      const r = tops.current;
      if (!m || !r) return;
      const o = new THREE.Object3D();
      towers.forEach((t, i) => {
        o.position.set(t.pos.x, t.pos.y + t.h / 2 - 2, t.pos.z);
        o.scale.set(t.w, t.h, t.d);
        o.rotation.set(0, 0, 0);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
        o.position.set(t.pos.x, t.pos.y + t.h - 2 + 1.4, t.pos.z);
        o.scale.set(0.9, 0.9, 0.9);
        o.updateMatrix();
        r.setMatrixAt(i, o.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
      r.instanceMatrix.needsUpdate = true;
    }
  }, [towers]);

  // Flying cars: lights on long loops between the towers, each with a
  // streak of light behind it.
  const CARS = 70;
  const cars = useMemo(() => {
    const rand = seeded(31);
    const centre = pointAt(road, road.finish + 110);
    return Array.from({ length: CARS }, () => ({
      cx: centre.x + (rand() - 0.5) * 180,
      cz: centre.z + (rand() - 0.5) * 180,
      y: centre.y + 12 + rand() * 70,
      rx: 30 + rand() * 90,
      rz: 20 + rand() * 70,
      speed: (0.05 + rand() * 0.12) * (rand() < 0.5 ? -1 : 1),
      phase: rand() * Math.PI * 2,
      col: new THREE.Color(["#22d9f5", "#f53de0", "#ffffff", "#ffd60a"][Math.floor(rand() * 4)]).multiplyScalar(2),
    }));
  }, [road]);
  const trails = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(CARS * 6), 3));
    const col = new Float32Array(CARS * 6);
    cars.forEach((c, i) => {
      col.set([c.col.r, c.col.g, c.col.b, 0, 0, 0], i * 6);
    });
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [cars]);
  const heads = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(CARS * 3), 3));
    const col = new Float32Array(CARS * 3);
    cars.forEach((c, i) => col.set([c.col.r, c.col.g, c.col.b], i * 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [cars]);

  /* eslint-disable react-hooks/immutability */
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const tp = (trails.attributes.position as THREE.BufferAttribute).array as Float32Array;
    const hp = (heads.attributes.position as THREE.BufferAttribute).array as Float32Array;
    cars.forEach((c, i) => {
      const a = c.phase + t * c.speed;
      const b = a - c.speed * 1.6;
      const x = c.cx + Math.cos(a) * c.rx;
      const z = c.cz + Math.sin(a) * c.rz;
      const y = c.y + Math.sin(a * 2) * 3;
      hp.set([x, y, z], i * 3);
      tp.set([x, y, z, c.cx + Math.cos(b) * c.rx, c.y + Math.sin(b * 2) * 3, c.cz + Math.sin(b) * c.rz], i * 6);
    });
    (trails.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (heads.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });
  /* eslint-enable react-hooks/immutability */

  // The city's ground: the land stops where the road does, so the city
  // stands on its own dark plaza, reaching out past the edge of the map.
  const plaza = useMemo(() => pointAt(road, road.finish + 170), [road]);

  return (
    <group>
      <mesh position={[plaza.x, plaza.y - 2.2, plaza.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[210, 64]} />
        <meshStandardMaterial color="#03050c" metalness={0.9} roughness={0.35} />
      </mesh>
      <instancedMesh ref={bodies} args={[undefined, undefined, towers.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#05070f"
          metalness={0.85}
          roughness={0.25}
          emissive="#ffffff"
          emissiveMap={windows ?? undefined}
          emissiveIntensity={0.8}
        />
      </instancedMesh>
      {/* A beacon on every roof, in the phase's colour. */}
      <instancedMesh ref={tops} args={[undefined, undefined, towers.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={new THREE.Color(color).multiplyScalar(2.2)} toneMapped={false} />
      </instancedMesh>
      <lineSegments geometry={trails} frustumCulled={false}>
        <lineBasicMaterial vertexColors transparent opacity={0.9} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      <points geometry={heads} frustumCulled={false}>
        <pointsMaterial size={1.4} vertexColors toneMapped={false} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
}
