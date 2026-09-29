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

const S = 28; // the head's size
/** A head in profile (x the way it faces, y up, in head-sizes), round
 *  from the back of the skull: crown, forehead, brow ridge, the eye's
 *  hollow, the bridge and tip of the nose, nostril, the lips round an open
 *  mouth, chin, jaw, the throat and neck down to the ground, the nape and
 *  the back of the head. (Every point further round from the centre than
 *  the last, so each direction out from the middle meets it once.) */
const PROFILE: [number, number][] = [
  [-0.98, 0.05], [-0.96, 0.38], [-0.82, 0.7], [-0.55, 0.95], [-0.15, 1.08], [0.25, 1.04], [0.55, 0.86],
  [0.7, 0.62], [0.78, 0.42], [0.7, 0.33], [0.76, 0.25], [1.06, 0.0], [0.98, -0.06], [0.8, -0.1],
  [0.84, -0.15], [0.9, -0.2], [0.52, -0.21], [0.84, -0.42], [0.78, -0.5], [0.86, -0.62], [0.72, -0.78],
  [0.3, -0.86], [0.28, -1.0], [0.28, -1.5], [-0.34, -1.5], [-0.42, -0.9], [-0.78, -0.55], [-0.95, -0.25],
];
const NECK = 1.5; // how far the neck runs below the head's centre
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
  const g = new THREE.IcosahedronGeometry(1, 4);
  const p = g.getAttribute("position") as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const rho = Math.hypot(v.x, v.y);
    const theta = Math.atan2(v.y, v.x);
    const r = reach(theta);
    const x = Math.cos(theta) * r * rho;
    const y = Math.sin(theta) * r * rho;
    // Narrower toward the nose and lips, narrower still down the neck; and
    // an ear on each side, just behind the middle of the head.
    let width = 0.74 * (1 - 0.55 * THREE.MathUtils.smoothstep(x, 0.6, 1.06)) * (y < -0.85 ? 0.58 : 1);
    const ear = Math.exp(-((x + 0.14) ** 2) / 0.012 - ((y - 0.08) ** 2) / 0.03) * Math.max(0, Math.abs(v.z) - 0.5) * 2;
    width *= 1 + 0.35 * ear;
    // The eyes, set into the face either side of the nose.
    const eye = Math.exp(-((x - 0.6) ** 2) / 0.01 - ((y - 0.3) ** 2) / 0.004) * Math.exp(-((Math.abs(v.z) - 0.45) ** 2) / 0.02);
    const inX = 1 - 0.12 * eye;
    p.setXYZ(i, x * inX * S, y * S, v.z * width * S);
  }
  g.computeVertexNormals();
  return g;
}

export function TalkingFaces({ road, s, colourAt }: { road: RoadLayout; s: number; colourAt: (s: number) => THREE.Color }) {
  const built = useMemo(() => {
    const colour = colourAt(s).clone().lerp(new THREE.Color("#ffffff"), 0.15);
    const geo = headGeometry();
    // (Only the edges where the facets really turn, so the lines draw the
    // form rather than a mesh of noise.)
    const edges = new THREE.EdgesGeometry(geo, 9);
    const skin = new THREE.MeshStandardMaterial({
      color: "#060912",
      emissive: colour.clone().multiplyScalar(0.12),
      roughness: 0.25,
      metalness: 0.6,
      flatShading: true,
      transparent: true,
      opacity: 0.88,
    });
    const wire = new THREE.LineBasicMaterial({ color: colour.clone().multiplyScalar(1.8), toneMapped: false });
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
      gap: ROAD_HALF + 46,
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
