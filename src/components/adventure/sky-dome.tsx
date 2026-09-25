"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// A painted sky around the whole world - planets, a nebula, a galaxy -
// on a great cylinder that travels with the camera, so it is always
// infinitely far away: the planets never get nearer however far you go,
// only swing across the view as the road turns, the way a moon follows a
// car. The picture wraps four times round (mirrored at the joins, so
// there is no seam), each copy a quarter of the circle - which puts the
// planets low enough to be in view, and big - with one copy centred on
// the way the road sets off.

const RADIUS = 1000;

export function SkyDome({ image }: { image: string }) {
  const mesh = useRef<THREE.Mesh>(null);
  const map = useMemo(() => {
    const t = new THREE.TextureLoader().load(image);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.MirroredRepeatWrapping;
    t.repeat.set(4, 1);
    t.offset.set(0.5, 0);
    t.anisotropy = 8;
    return t;
  }, [image]);
  const geo = useMemo(() => {
    // A quarter of the circle is π·R/2 wide; the picture is about 21:9,
    // so it stands about 670 tall - from a little below the horizon to a
    // third of the way up the sky, the part the camera sees.
    const h = (Math.PI * RADIUS) / 2 / 2.33;
    const g = new THREE.CylinderGeometry(RADIUS, RADIUS, h, 128, 1, true);
    g.translate(0, h / 2 - 90, 0);
    return g;
  }, []);
  useFrame(({ camera }) => {
    mesh.current?.position.copy(camera.position);
  });
  return (
    // Drawn first and never in front of anything: the backdrop to it all.
    <mesh ref={mesh} geometry={geo} renderOrder={-10} frustumCulled={false}>
      <meshBasicMaterial map={map} side={THREE.BackSide} depthTest={false} depthWrite={false} fog={false} toneMapped={false} />
    </mesh>
  );
}
