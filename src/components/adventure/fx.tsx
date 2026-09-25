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

/** At every boundary between two phases, a curtain of sparks rising
 *  across the road - the old colour on one side, the new on the other -
 *  that flares as the traveller goes through it. */
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
  const PER = 260;
  const N = PER * gates.length;
  const mat = useRef<THREE.PointsMaterial>(null);
  const { geo, base, speed, gateOf } = useMemo(() => {
    const rand = seeded(5);
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const base = new Float32Array(N * 3);
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
        const across = (rand() - 0.5) * 11;
        const along = (rand() - 0.5) * 3;
        base[i * 3] = p.x + side.x * across + side.z * along;
        base[i * 3 + 1] = p.y + rand() * 0.5;
        base[i * 3 + 2] = p.z + side.z * across - side.x * along;
        speed[i] = 0.8 + rand() * 1.6;
        gateOf[i] = gi;
        const c = (rand() < 0.5 ? a : b).clone().multiplyScalar(1.8);
        col.set([c.r, c.g, c.b], i * 3);
      }
    });
    pos.set(base);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return { geo, base, speed, gateOf };
  }, [road, gates, N]);

  /* eslint-disable react-hooks/immutability */
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const here = travel.s + AHEAD;
    const arr = (geo.attributes.position as THREE.BufferAttribute).array as Float32Array;
    for (let i = 0; i < N; i++) {
      // Near the traveller the sparks rise faster and higher - a flare
      // as the boundary is crossed.
      const flare = 1 + 2.5 * (1 - THREE.MathUtils.smoothstep(Math.abs(here - gates[gateOf[i]].s), 0, 14));
      const h = ((t * speed[i] * flare + i * 0.37) % 9) * (0.8 + flare * 0.3);
      arr[i * 3] = base[i * 3] + Math.sin(t * 1.3 + i) * 0.25;
      arr[i * 3 + 1] = base[i * 3 + 1] + h;
      arr[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t + i * 0.7) * 0.25;
    }
    (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <points geometry={geo}>
      <pointsMaterial ref={mat} size={0.22} vertexColors transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}
