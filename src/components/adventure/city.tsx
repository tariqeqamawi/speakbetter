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

interface Tower {
  pos: THREE.Vector3;
  w: number;
  d: number;
  h: number;
}

export function City({ road, color }: { road: RoadLayout; color: string }) {
  const towers = useMemo(() => {
    const rand = seeded(77);
    const out: Tower[] = [];
    const p = new THREE.Vector3();
    const side = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    // The city itself, well beyond the end of the land - you travel
    // towards it for the whole last phase and never reach it. A grid of
    // blocks, tallest at the centre.
    const past = road.length + 160;
    const centre = pointAt(road, road.length).clone();
    pointAt(road, road.length, p);
    sideAt(road, road.length, side);
    tangent.set(side.z, 0, -side.x);
    centre.addScaledVector(tangent, past - road.length + 140);
    for (let a = -11; a <= 11; a++)
      for (let b = 0; b < 16; b++) {
        if (rand() < 0.2) continue;
        const across = a * 22 + (rand() - 0.5) * 8;
        const along = past - road.length + b * 22 + (rand() - 0.5) * 8;
        const pos = p.clone().addScaledVector(side, across).addScaledVector(tangent, along);
        const toCentre = pos.distanceTo(centre);
        const tall = 1 - THREE.MathUtils.smoothstep(toCentre, 20, 190);
        out.push({ pos, w: 9 + rand() * 9, d: 9 + rand() * 9, h: 30 + tall * 150 + rand() * 40 });
      }
    return out;
  }, [road]);

  const bodies = useRef<THREE.InstancedMesh>(null);
  const tops = useRef<THREE.InstancedMesh>(null);
  // Every tower's outline as one set of lines: the edges of each box,
  // lit in the phase's neon - the same light as the land.
  const edges = useMemo(() => {
    const box = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
    const unit = box.attributes.position.array as Float32Array;
    const out = new Float32Array(unit.length * towers.length);
    towers.forEach((t, i) => {
      for (let k = 0; k < unit.length; k += 3) {
        out[i * unit.length + k] = t.pos.x + unit[k] * t.w;
        out[i * unit.length + k + 1] = t.pos.y - 2 + (unit[k + 1] + 0.5) * t.h;
        out[i * unit.length + k + 2] = t.pos.z + unit[k + 2] * t.d;
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(out, 3));
    return g;
  }, [towers]);

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
    const side = sideAt(road, road.length);
    const centre = pointAt(road, road.length).addScaledVector(new THREE.Vector3(side.z, 0, -side.x), 330);
    return Array.from({ length: CARS }, () => ({
      cx: centre.x + (rand() - 0.5) * 180,
      cz: centre.z + (rand() - 0.5) * 180,
      y: centre.y + 20 + rand() * 110,
      rx: 40 + rand() * 130,
      rz: 30 + rand() * 110,
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
  const plaza = useMemo(() => {
    const p = pointAt(road, road.length);
    const side = sideAt(road, road.length);
    return p.addScaledVector(new THREE.Vector3(side.z, 0, -side.x), 330);
  }, [road]);

  return (
    <group>
      <mesh position={[plaza.x, plaza.y - 2.2, plaza.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[260, 64]} />
        <meshBasicMaterial color="#03050c" fog={false} />
      </mesh>
      <instancedMesh ref={bodies} args={[undefined, undefined, towers.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#03050c" fog={false} />
      </instancedMesh>
      <lineSegments geometry={edges} frustumCulled={false}>
        <lineBasicMaterial color={new THREE.Color(color).multiplyScalar(1.6)} toneMapped={false} fog={false} />
      </lineSegments>
      {/* A beacon on every roof, in the phase's colour. */}
      <instancedMesh ref={tops} args={[undefined, undefined, towers.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={new THREE.Color(color).multiplyScalar(2.2)} toneMapped={false} fog={false} />
      </instancedMesh>
      <lineSegments geometry={trails} frustumCulled={false}>
        <lineBasicMaterial vertexColors transparent opacity={0.9} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </lineSegments>
      <points geometry={heads} frustumCulled={false}>
        <pointsMaterial size={2.2} vertexColors toneMapped={false} transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </points>
    </group>
  );
}
