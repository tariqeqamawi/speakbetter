"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { pointAt, seeded, sideAt, type RoadLayout, type Travel, AHEAD } from "./road-geometry";

// The look: Tron rather than arcade. The land is dark glass and every
// line of light is bright enough to bloom - to bleed a soft glow into
// the dark around it, the way a real neon tube or LED strip does - so
// the lines read as light, not as coloured strokes.

/** Bloom over the whole scene: only what is bright glows, so the dark
 *  glass stays dark and the neon comes alive. Takes over rendering from
 *  the default loop (the priority-1 frame callback). */
export function Bloom({ strength = 0.6, radius = 0.25, threshold = 0.78 }) {
  const { gl, scene, camera, size } = useThree();
  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), strength, radius, threshold));
    c.addPass(new OutputPass());
    return c;
    // Rebuilt only if the renderer or scene change; size is set below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera, strength, radius, threshold]);
  useEffect(() => {
    composer.setPixelRatio(Math.min(gl.getPixelRatio(), 1.5));
    composer.setSize(size.width, size.height);
  }, [composer, gl, size]);
  useEffect(() => () => composer.dispose(), [composer]);
  useFrame((_, dt) => composer.render(dt), 1);
  return null;
}

/** The sky: black overhead, falling to a deep glow at the horizon - the
 *  light of a city you cannot see yet. */
export function Sky() {
  const { scene } = useThree();
  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 512;
    const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, "#02040a");
    grad.addColorStop(0.42, "#050a1a");
    grad.addColorStop(0.58, "#0d1a3a");
    grad.addColorStop(0.66, "#1a1a44");
    grad.addColorStop(1, "#03060d");
    g.fillStyle = grad;
    g.fillRect(0, 0, 4, 512);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    // The scene is three.js's to change; that is what this is for.
    // eslint-disable-next-line react-hooks/immutability
    scene.background = t;
    return () => t.dispose();
  }, [scene]);
  return null;
}

/** Crossing from one phase into the next: a quick burst of sparks in
 *  the old colour and the new, thrown up and out from the road as the
 *  traveller goes through - then gone. Nothing stands at the boundary
 *  otherwise; the solid colour wash (ColourWall) marks it. */
export function GateSparks({
  road,
  gates,
  travel,
}: {
  road: RoadLayout;
  /** Where each gate stands, and the colours it divides. */
  gates: { s: number; from: string; to: string }[];
  travel: Travel;
}) {
  const PER = 160;
  const N = PER * gates.length;
  const BURST = 1.3; // seconds
  const mat = useRef<THREE.PointsMaterial>(null);
  const { geo, base, dir, speed, gateOf, tint } = useMemo(() => {
    const rand = seeded(5);
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const tint = new Float32Array(N * 3);
    const base = new Float32Array(N * 3);
    const dir = new Float32Array(N * 3);
    const speed = new Float32Array(N);
    const gateOf = new Uint8Array(N);
    const p = new THREE.Vector3();
    const side = new THREE.Vector3();
    const a = new THREE.Color();
    const b = new THREE.Color();
    gates.forEach((gt, gi) => {
      pointAt(road, gt.s, p);
      sideAt(road, gt.s, side);
      a.set(gt.from);
      b.set(gt.to);
      for (let k = 0; k < PER; k++) {
        const i = gi * PER + k;
        const across = (rand() - 0.5) * 8;
        base[i * 3] = p.x + side.x * across;
        base[i * 3 + 1] = p.y + 0.3;
        base[i * 3 + 2] = p.z + side.z * across;
        // Out to the sides and up, in a fan.
        const out = (rand() - 0.5) * 2;
        dir[i * 3] = side.x * out;
        dir[i * 3 + 1] = 1.2 + rand() * 1.6;
        dir[i * 3 + 2] = side.z * out;
        speed[i] = 4 + rand() * 6;
        gateOf[i] = gi;
        const c = (rand() < 0.5 ? a : b).clone().multiplyScalar(1.9);
        tint.set([c.r, c.g, c.b], i * 3);
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return { geo, base, dir, speed, gateOf, tint };
  }, [road, gates, N]);

  // When each gate was last crossed, and which side the traveller was on.
  const since = useRef<number[]>([]);
  const wasPast = useRef<boolean[]>([]);

  /* eslint-disable react-hooks/immutability */
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const here = travel.s + AHEAD;
    gates.forEach((gt, gi) => {
      const past = here > gt.s;
      if (wasPast.current[gi] !== undefined && past !== wasPast.current[gi]) since.current[gi] = t;
      wasPast.current[gi] = past;
    });
    const pos = (geo.attributes.position as THREE.BufferAttribute).array as Float32Array;
    const col = (geo.attributes.color as THREE.BufferAttribute).array as Float32Array;
    for (let i = 0; i < N; i++) {
      const start = since.current[gateOf[i]];
      const age = start === undefined ? BURST : t - start;
      const k = age / BURST;
      const on = k < 1 ? 1 - k * k : 0;
      const d = age * speed[i];
      pos[i * 3] = base[i * 3] + dir[i * 3] * d;
      pos[i * 3 + 1] = base[i * 3 + 1] + dir[i * 3 + 1] * d - 4 * age * age;
      pos[i * 3 + 2] = base[i * 3 + 2] + dir[i * 3 + 2] * d;
      col[i * 3] = tint[i * 3] * on;
      col[i * 3 + 1] = tint[i * 3 + 1] * on;
      col[i * 3 + 2] = tint[i * 3 + 2] * on;
    }
    (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (geo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <points geometry={geo}>
      <pointsMaterial ref={mat} size={0.26} vertexColors transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}
