"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ROAD_HALF, groundAt, pointAt, sideAt, type RoadLayout } from "./road-geometry";

// THE TWO FACES: giant heads standing either side of the road, in profile,
// facing each other across it with their mouths open - talking. Low-poly on
// purpose, like a digital sculpture: a dark, glassy, faceted surface with
// every edge of every facet glowing in the section's colour. Over the road
// between their mouths, rings of sound ripple from one to the other, and
// back.
//
// Each head is a sphere of facets pushed and pulled into a face: the brow,
// the nose, lips round an open mouth, the chin, a neck down to the ground.
// (In a head's own frame +x is the way it faces, y up.)

const S = 26; // the head's size
/** A head in profile (x the way it faces, y up, in head-sizes): the back
 *  of the skull, forehead, brow, the eye's hollow, the nose, lips round
 *  an open mouth, chin, jaw, and the neck down to the ground. */
const PROFILE: [number, number][] = [
  [-0.95, 0.1], [-0.9, 0.5], [-0.6, 0.9], [-0.1, 1.05], [0.35, 0.95], [0.62, 0.7], [0.74, 0.46],
  [0.63, 0.34], [0.7, 0.24], [1.04, -0.02], [0.74, -0.09], [0.84, -0.21], [0.46, -0.25], [0.8, -0.52],
  [0.76, -0.66], [0.58, -0.82], [0.2, -0.88], [0.16, -1.45], [-0.36, -1.45], [-0.55, -0.62], [-0.86, -0.3],
];
const NECK = 1.45; // how far the neck runs below the head's centre
const LIFT = NECK * S; // the head's centre above the ground

/** How far the profile reaches from the head's centre at an angle. */
function reach(theta: number) {
  const dx = Math.cos(theta);
  const dy = Math.sin(theta);
  let best = 0;
  for (let i = 0; i < PROFILE.length; i++) {
    const [ax, ay] = PROFILE[i];
    const [bx, by] = PROFILE[(i + 1) % PROFILE.length];
    // Ray from the centre against the edge a-b.
    const ex = bx - ax;
    const ey = by - ay;
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = (ax * ey - ay * ex) / den;
    const u = (ax * dy - ay * dx) / den;
    if (t > 0 && u >= 0 && u <= 1) best = Math.max(best, t);
  }
  return best || 0.8;
}

/** A faceted head: a sphere of facets stretched so that, seen side-on, it
 *  is exactly the profile - and narrower toward the face and the neck. */
function headGeometry() {
  const g = new THREE.IcosahedronGeometry(1, 3);
  const p = g.getAttribute("position") as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const rho = Math.hypot(v.x, v.y);
    const theta = Math.atan2(v.y, v.x);
    const r = reach(theta);
    const x = Math.cos(theta) * r * rho;
    const y = Math.sin(theta) * r * rho;
    const width = 0.72 * (1 - 0.4 * THREE.MathUtils.smoothstep(x, 0.45, 1.05)) * (y < -0.85 ? 0.62 : 1);
    p.setXYZ(i, x * S, y * S, v.z * width * S);
  }
  g.computeVertexNormals();
  return g;
}

export function TalkingFaces({ road, s, colourAt }: { road: RoadLayout; s: number; colourAt: (s: number) => THREE.Color }) {
  const built = useMemo(() => {
    const colour = colourAt(s).clone().lerp(new THREE.Color("#ffffff"), 0.15);
    const geo = headGeometry();
    const edges = new THREE.EdgesGeometry(geo, 1);
    const skin = new THREE.MeshStandardMaterial({
      color: "#060912",
      emissive: colour.clone().multiplyScalar(0.05),
      roughness: 0.25,
      metalness: 0.6,
      flatShading: true,
      transparent: true,
      opacity: 0.88,
    });
    const wire = new THREE.LineBasicMaterial({ color: colour.clone().multiplyScalar(1.3), toneMapped: false, transparent: true, opacity: 0.9 });
    // The rings of sound between them.
    const ringGeo = new THREE.TorusGeometry(1, 0.06, 6, 48);
    const ringMats = Array.from({ length: 5 }, () =>
      new THREE.MeshBasicMaterial({ color: colour.clone().multiplyScalar(1.4), transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }),
    );
    return { geo, edges, skin, wire, ringGeo, ringMats };
  }, [colourAt, s]);
  useEffect(
    () => () => {
      built.geo.dispose();
      built.edges.dispose();
      built.skin.dispose();
      built.wire.dispose();
      built.ringGeo.dispose();
      built.ringMats.forEach((m) => m.dispose());
    },
    [built],
  );

  const { position, yaw, gap, mouthY } = useMemo(() => {
    const g = groundAt(road, s);
    const side = sideAt(road, s);
    return {
      position: g,
      // (The group's +x across the road, to the right.)
      yaw: Math.atan2(-side.z, side.x),
      gap: ROAD_HALF + 44,
      mouthY: Math.max(LIFT - 0.3 * S, pointAt(road, s).y - g.y + 12),
    };
  }, [road, s]);

  const rings = useRef<THREE.Group>(null);
   
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    rings.current?.children.forEach((r, i) => {
      // Out from one mouth to the other, then back - taking turns.
      const k = (t * 0.35 + i / 5) % 1;
      const dir = Math.floor(t * 0.35 + i / 5) % 2 ? 1 : -1;
      r.position.x = dir * (gap - 28) * (1 - 2 * k);
      r.scale.setScalar(2 + k * 7);
      built.ringMats[i].opacity = Math.sin(Math.PI * k) * 0.8;
    });
  });
   

  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {[-1, 1].map((sd) => (
        // Left of the road it faces right (+x); right of it, left.
        <group key={sd} position={[sd * gap, LIFT, 0]} rotation={[0, sd < 0 ? 0 : Math.PI, 0]}>
          <mesh geometry={built.geo} material={built.skin} />
          <lineSegments geometry={built.edges} material={built.wire} />
        </group>
      ))}
      <group ref={rings} position={[0, mouthY, 0]}>
        {built.ringMats.map((m, i) => (
          <mesh key={i} geometry={built.ringGeo} material={m} rotation={[0, Math.PI / 2, 0]} />
        ))}
      </group>
    </group>
  );
}
