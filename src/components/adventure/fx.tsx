"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { pointAt, seeded, sideAt, surfaceAt, type RoadLayout, type Travel, AHEAD } from "./road-geometry";

// The look: Tron rather than arcade. The land is dark glass and every
// line of light is bright enough to bloom - to bleed a soft glow into
// the dark around it, the way a real neon tube or LED strip does - so
// the lines read as light, not as coloured strokes.

/** Bloom over the whole scene: only what is bright glows, so the dark
 *  glass stays dark and the neon comes alive. Takes over rendering from
 *  the default loop (the priority-1 frame callback). */
export function Bloom({
  strength = 0.6,
  radius = 0.25,
  threshold = 0.78,
  travel,
}: {
  strength?: number;
  radius?: number;
  threshold?: number;
  /** When given, the picture blurs outward from the middle as it goes
   *  faster (Travel.feel) - sharp at rest. */
  travel?: Travel;
}) {
  const { gl, scene, camera, size } = useThree();
  const { composer, blur } = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), strength, radius, threshold));
    // Fewer samples on a phone, so it stays smooth.
    const fine = typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
    const blur = new ShaderPass(speedBlur(fine ? 10 : 6));
    blur.enabled = false;
    c.addPass(blur);
    c.addPass(new OutputPass());
    return { composer: c, blur };
    // Rebuilt only if the renderer or scene change; size is set below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera, strength, radius, threshold]);
  useEffect(() => {
    composer.setPixelRatio(Math.min(gl.getPixelRatio(), 1.5));
    composer.setSize(size.width, size.height);
  }, [composer, gl, size]);
  useEffect(() => () => composer.dispose(), [composer]);
  /* eslint-disable react-hooks/immutability -- the pass is three.js's, set every frame */
  useFrame((_, dt) => {
    // Nothing blurs until you're really moving, and the pass costs
    // nothing while it's off.
    const k = travel ? Math.max(0, (travel.feel - 0.25) / 0.75) : 0;
    blur.enabled = k > 0.01;
    // (The edges of the view blur at speed; the middle stays sharp.)
    // (Half as much again as it was, more still flat out: the rush at
    // top speed should be felt at the edges.)
    blur.uniforms.uAmount.value = k * k * 0.11 + (travel?.boost ?? 0) * 0.12;
    composer.render(dt);
  }, 1);
  /* eslint-enable react-hooks/immutability */
  return null;
}

/** SPARKS off the back of the traveller, flat out: once you've held top
 *  speed for a second and a half (Travel.boost), hot sparks spray from
 *  under the disc, low along the lit road, skittering back toward you -
 *  never up into the sky. */
export function SpeedSparks({
  road,
  travel,
  colourAt,
}: {
  road: RoadLayout;
  travel: Travel;
  colourAt: (s: number) => THREE.Color;
}) {
  // (About half what it was: with fewer sparks, the speed streaks at the
  // edges of the view read through them.)
  const N = 220;
  const LIFE = 0.6;
  const { geo, vel, age, ground } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    const age = new Float32Array(N).fill(LIFE);
    return { geo, vel: new Float32Array(N * 3), age, ground: new Float32Array(N) };
  }, []);
  const next = useRef(0);
  const debt = useRef(0);
  const lastS = useRef(travel.s);
  const p = useMemo(() => new THREE.Vector3(), []);
  const q = useMemo(() => new THREE.Vector3(), []);
  const side = useMemo(() => new THREE.Vector3(), []);
  const hot = useMemo(() => new THREE.Color(), []);
  const spot = useMemo(() => new THREE.Vector3(), []);
  // Round, soft-edged points - not squares.
  const dot = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.4, "rgba(255,255,255,0.6)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  }, []);
  useEffect(() => () => dot.dispose(), [dot]);
  useEffect(() => () => geo.dispose(), [geo]);

  /* eslint-disable react-hooks/immutability -- particles, moved every frame */
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const pos = (geo.attributes.position as THREE.BufferAttribute).array as Float32Array;
    const col = (geo.attributes.color as THREE.BufferAttribute).array as Float32Array;
    const s = travel.s + AHEAD;
    // New sparks, as many as the boost asks for.
    debt.current += travel.portal ? 0 : travel.boost * 160 * dt;
    if (debt.current >= 1) {
      pointAt(road, s, p);
      pointAt(road, s + 1, q);
      sideAt(road, s, side);
      const fwd = q.sub(p).normalize();
      // The road's real speed under the traveller, per second.
      const worldV = dt > 0 ? (travel.s - lastS.current) / dt : 0;
      hot.copy(colourAt(s)).lerp(new THREE.Color("#fff3c4"), 0.6).multiplyScalar(2);
      while (debt.current >= 1) {
        debt.current -= 1;
        const i = next.current;
        next.current = (i + 1) % N;
        const across = (Math.random() - 0.5) * 1.0 + road.rideAt(s);
        surfaceAt(road, s, across, 0.06, spot);
        pos[i * 3] = spot.x;
        pos[i * 3 + 1] = spot.y;
        pos[i * 3 + 2] = spot.z;
        // Carried forward at most of your speed, so they fall behind you
        // slowly enough to see - streaming past either side of the
        // camera; thrown out sideways and up.
        // Carried forward slower than you, so they stream back past you
        // and down the screen, fanning out low over the road.
        const keep = 0.55 + Math.random() * 0.15;
        const out = (Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random() * 3.2);
        vel[i * 3] = fwd.x * worldV * keep + side.x * out;
        vel[i * 3 + 1] = Math.random() * 0.35;
        vel[i * 3 + 2] = fwd.z * worldV * keep + side.z * out;
        // (In the air on a stunt: nothing to bounce off - they fall.)
        ground[i] = road.stuntAt(s) > 0 ? -1e9 : spot.y - 0.01;
        age[i] = 0;
        col[i * 3] = hot.r;
        col[i * 3 + 1] = hot.g;
        col[i * 3 + 2] = hot.b;
      }
    }
    for (let i = 0; i < N; i++) {
      if (age[i] >= LIFE) {
        col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 0;
        continue;
      }
      age[i] += dt;
      vel[i * 3 + 1] -= 22 * dt;
      pos[i * 3] += vel[i * 3] * dt;
      pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
      pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      // A bounce off the road.
      if (pos[i * 3 + 1] < ground[i]) {
        pos[i * 3 + 1] = ground[i];
        vel[i * 3 + 1] *= -0.35;
      }
      const fade = 0.96;
      col[i * 3] *= fade;
      col[i * 3 + 1] *= fade;
      col[i * 3 + 2] *= fade;
    }
    lastS.current = travel.s;
    (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (geo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial map={dot} alphaTest={0.01} size={0.13} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}

/** MOTION BLUR at speed: each pixel is smeared along the line from the
 *  middle of the view (a little above centre, where the road runs to),
 *  more the further out it is - the centre stays sharp, the edges rush. */
function speedBlur(samples: number) {
  return {
    uniforms: {
      tDiffuse: { value: null },
      uAmount: { value: 0 },
      uCentre: { value: new THREE.Vector2(0.5, 0.56) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse;
      uniform float uAmount;
      uniform vec2 uCentre;
      varying vec2 vUv;
      const int N = ${samples};
      void main() {
        vec2 dir = vUv - uCentre;
        // Only the edges blur - the middle, where you're looking, stays
        // sharp - and they darken a touch, as if rushing past.
        float far = pow(smoothstep(0.26, 0.78, length(dir)), 1.4);
        // The middle, where the view stays sharp: one read, not ten.
        if (far < 0.002) { gl_FragColor = vec4(texture2D(tDiffuse, vUv).rgb, 1.0); return; }
        vec2 step = dir * uAmount * far / float(N);
        vec4 sum = vec4(0.0);
        for (int i = 0; i < N; i++) sum += texture2D(tDiffuse, vUv - step * float(i));
        gl_FragColor = vec4((sum / float(N)).rgb * (1.0 - far * min(uAmount * 2.0, 0.28)), 1.0);
      }
    `,
  };
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
