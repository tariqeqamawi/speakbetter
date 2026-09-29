"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ROAD_HALF, groundAt, pointAt, sideAt, type RoadLayout } from "./road-geometry";

// THE TWO FACES: two giant heads standing either side of the road on low
// plinths, in profile, facing each other across it - talking: rings of
// sound ripple over the road from one mouth to the other, and back.
//
// The head is a real 3D scan, cut down for phones (about 5,300 triangles)
// and drawn like a digital sculpture: dark faceted glass, the edges where
// its facets turn glowing in the section's colour. The scan's mouth is
// closed, so they speak through the rings.
//
// Model: "Infinite, 3D Head Scan" by Lee Perry-Smith (Infinite Realities),
// licensed CC BY 3.0 - https://creativecommons.org/licenses/by/3.0/ -
// based on a work at www.triplegangers.com; taken from the three.js
// examples (examples/models/gltf/LeePerrySmith), welded and simplified with
// gltf-transform. Credited on the About page.

const MODEL = "/models/lee-perry-smith-head.glb";
/** How tall a head stands, and the plinth under it. */
const HEAD_H = 46;
const PLINTH = 14;

let cached: Promise<THREE.BufferGeometry> | null = null;
/** The head's geometry, loaded once: scaled to HEAD_H, its chin-to-crown
 *  upright, facing +x, standing on y = 0. */
function loadHead() {
  if (!cached)
    cached = new GLTFLoader().loadAsync(MODEL).then((gltf) => {
      let geo: THREE.BufferGeometry | null = null;
      gltf.scene.traverse((o) => {
        if (!geo && o instanceof THREE.Mesh) geo = (o.geometry as THREE.BufferGeometry).clone();
      });
      const g = (geo ?? new THREE.BufferGeometry()) as THREE.BufferGeometry;
      // (The scan faces +z; turned to face +x.)
      g.rotateY(Math.PI / 2);
      g.computeBoundingBox();
      const box = g.boundingBox!;
      const k = HEAD_H / (box.max.y - box.min.y);
      g.translate(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
      g.scale(k, k, k);
      g.deleteAttribute("normal");
      const flat = g.index ? g.toNonIndexed() : g;
      flat.computeVertexNormals();
      return flat;
    });
  return cached;
}

export function TalkingFaces({ road, s, colourAt }: { road: RoadLayout; s: number; colourAt: (s: number) => THREE.Color }) {
  const [geo, setGeo] = useState<THREE.BufferGeometry | null>(null);
  useEffect(() => {
    let live = true;
    loadHead().then((g) => live && setGeo(g));
    return () => {
      live = false;
    };
  }, []);
  const edges = useMemo(() => (geo ? new THREE.EdgesGeometry(geo, 13) : null), [geo]);
  useEffect(() => () => edges?.dispose(), [edges]);
  const built = useMemo(() => {
    const colour = colourAt(s).clone().lerp(new THREE.Color("#ffffff"), 0.15);
    const skin = new THREE.MeshStandardMaterial({
      color: "#070a14",
      emissive: colour.clone().multiplyScalar(0.1),
      roughness: 0.25,
      metalness: 0.2,
      flatShading: true,
    });
    const wire = new THREE.LineBasicMaterial({ color: colour.clone().multiplyScalar(1.5), toneMapped: false, transparent: true, opacity: 0.85 });
    const plinthGlow = new THREE.MeshBasicMaterial({ color: colour.clone().multiplyScalar(1.4), toneMapped: false });
    const stone = new THREE.MeshBasicMaterial({ color: "#05070d" });
    // The rings of sound between them.
    const ringGeo = new THREE.TorusGeometry(1, 0.06, 6, 48);
    const ringMats = Array.from({ length: 5 }, () =>
      new THREE.MeshBasicMaterial({ color: colour.clone().multiplyScalar(1.4), transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }),
    );
    return { skin, wire, plinthGlow, stone, ringGeo, ringMats };
  }, [colourAt, s]);
  useEffect(
    () => () => {
      built.skin.dispose();
      built.wire.dispose();
      built.plinthGlow.dispose();
      built.stone.dispose();
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
      gap: ROAD_HALF + 36,
      mouthY: Math.max(PLINTH + HEAD_H * 0.3, pointAt(road, s).y - g.y + 12),
    };
  }, [road, s]);

  const rings = useRef<THREE.Group>(null);
   
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    rings.current?.children.forEach((r, i) => {
      // Out from one mouth to the other, then back - taking turns.
      const k = (t * 0.35 + i / 5) % 1;
      const dir = Math.floor(t * 0.35 + i / 5) % 2 ? 1 : -1;
      r.position.x = dir * (gap - 20) * (1 - 2 * k);
      r.scale.setScalar(2 + k * 7);
      built.ringMats[i].opacity = Math.sin(Math.PI * k) * 0.8;
    });
  });
   

  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {geo &&
        edges &&
        [-1, 1].map((sd) => (
          // Left of the road it faces right (+x); right of it, left.
          <group key={sd} position={[sd * gap, 0, 0]} rotation={[0, sd < 0 ? 0 : Math.PI, 0]}>
            <mesh position={[0, (PLINTH - 30) / 2, 0]} material={built.stone}>
              <cylinderGeometry args={[10, 14, PLINTH + 30, 8]} />
            </mesh>
            <mesh position={[0, PLINTH, 0]} rotation={[Math.PI / 2, 0, 0]} material={built.plinthGlow}>
              <torusGeometry args={[11, 0.25, 6, 48]} />
            </mesh>
            <group position={[0, PLINTH, 0]}>
              <mesh geometry={geo} material={built.skin} />
              <lineSegments geometry={edges} material={built.wire} />
            </group>
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
