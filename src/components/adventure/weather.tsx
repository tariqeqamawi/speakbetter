"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AHEAD, pointAt, victoryStart, type RoadLayout, type Travel } from "./road-geometry";

// THE WEATHER OF EACH SECTION - a little air you can see, and only where
// you are, so it tells you where you are without cluttering the road:
//
// - S: a green aurora hanging in the sky ahead.
// - T: cyan dust drifting across the land.
// - O: golden sparks, like pollen, drifting slowly down.
// - R: embers floating up, red and orange.
// - Y: neon rain, magenta and violet, streaking down through the city.
//
// Each fades in as you cross into its section and out as you leave. A
// few hundred points at most; nothing at all for anyone who has asked
// their device for less motion.

interface Stretch {
  id: string;
  from: number;
  to: number;
}

/** How far inside a section s is: 0 outside, easing to 1 within. */
function inside(sp: Stretch | undefined, s: number): number {
  if (!sp) return 0;
  return THREE.MathUtils.smoothstep(s, sp.from, sp.from + 80) * (1 - THREE.MathUtils.smoothstep(s, sp.to - 80, sp.to));
}

/** A soft round dot, for points that glow rather than square pixels. */
let dotTex: THREE.Texture | null = null;
function dot() {
  if (dotTex || typeof document === "undefined") return dotTex;
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.5)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  dotTex = new THREE.CanvasTexture(c);
  return dotTex;
}

/** A drift of particles round the traveller, in one section. */
function Drift({
  road,
  travel,
  stretch,
  count,
  colours,
  size,
  rise,
  wind,
  low,
  high,
}: {
  road: RoadLayout;
  travel: Travel;
  stretch: Stretch | undefined;
  count: number;
  colours: string[];
  size: number;
  /** Upward speed, units a second. */
  rise: number;
  /** Sideways drift, units a second. */
  wind: number;
  /** Height band above the ground the particles live in. */
  low: number;
  high: number;
}) {
  const R = 46; // how far round the traveller they live
  const { geo, vel } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      c.set(colours[i % colours.length]).multiplyScalar(1.4);
      col.set([c.r, c.g, c.b], i * 3);
      // Parked far away until the section is reached.
      pos.set([0, -1e5, 0], i * 3);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const vel = new Float32Array(count * 2);
    // (Seeded, so the same drift every time.)
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < count; i++) vel.set([0.6 + rnd() * 0.8, rnd() * Math.PI * 2], i * 2);
    return { geo, vel };
  }, [count, colours]);
  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size,
        map: dot(),
        vertexColors: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [size],
  );
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );
  const centre = useMemo(() => new THREE.Vector3(), []);
  const placed = useRef(false);

  /* eslint-disable react-hooks/immutability -- particles, moved every frame */
  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const here = travel.s + AHEAD;
    const w = inside(stretch, here);
    mat.opacity = w * 0.75;
    if (w <= 0.001) {
      placed.current = false;
      return;
    }
    pointAt(road, here + 25, centre);
    const pos = (geo.attributes.position as THREE.BufferAttribute).array as Float32Array;
    const t = clock.elapsedTime;
    const spawn = (i: number, anyHeight: boolean) => {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * R;
      pos[i * 3] = centre.x + Math.cos(a) * r;
      pos[i * 3 + 1] = centre.y + (anyHeight ? low + Math.random() * (high - low) : rise < 0 ? high : low);
      pos[i * 3 + 2] = centre.z + Math.sin(a) * r;
    };
    for (let i = 0; i < count; i++) {
      if (!placed.current) {
        spawn(i, true);
        continue;
      }
      const k = vel[i * 2];
      const ph = vel[i * 2 + 1];
      pos[i * 3] += (wind * k + Math.sin(t * 0.7 + ph) * 0.6) * dt;
      pos[i * 3 + 1] += rise * k * dt;
      pos[i * 3 + 2] += Math.cos(t * 0.5 + ph) * 0.6 * dt;
      const dx = pos[i * 3] - centre.x;
      const dz = pos[i * 3 + 2] - centre.z;
      // Left behind, or risen out of sight: back into the air round you.
      const y = pos[i * 3 + 1] - centre.y;
      if (dx * dx + dz * dz > R * R || y > high + 10 || y < low - 4) spawn(i, rise === 0);
    }
    placed.current = true;
    (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });
  /* eslint-enable react-hooks/immutability */

  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

const AURORA_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
// Curtains of light: soft vertical streaks that sway along a slow wave,
// brightest along their lower hem, fading upward and at the ends.
const AURORA_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uAlpha;
  varying vec2 vUv;
  void main() {
    float x = vUv.x;
    float hem = 0.25 + 0.12 * sin(x * 9.0 + uTime * 0.25) + 0.06 * sin(x * 23.0 - uTime * 0.4);
    float y = vUv.y - hem;
    float band = smoothstep(-0.05, 0.02, y) * exp(-max(y, 0.0) * 3.2);
    float streak = 0.55 + 0.45 * sin(x * 140.0 + sin(x * 11.0 + uTime * 0.3) * 6.0);
    float ends = smoothstep(0.0, 0.2, x) * smoothstep(1.0, 0.8, x);
    vec3 col = mix(vec3(0.12, 0.95, 0.55), vec3(0.2, 0.7, 0.95), smoothstep(0.1, 0.7, y));
    gl_FragColor = vec4(col, band * streak * ends * uAlpha);
  }
`;

/** A faint aurora hanging in the sky ahead, over S. */
function Aurora({ travel, stretch }: { travel: Travel; stretch: Stretch | undefined }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: AURORA_VERT,
        fragmentShader: AURORA_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        fog: false,
        uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 } },
      }),
    [],
  );
  useEffect(() => () => mat.dispose(), [mat]);
  const mesh = useRef<THREE.Mesh>(null);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  /* eslint-disable react-hooks/immutability -- a sky curtain, placed every frame */
  useFrame(({ clock, camera }) => {
    const w = inside(stretch, travel.s + AHEAD);
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uAlpha.value = w * 1.1;
    const m = mesh.current;
    if (!m) return;
    m.visible = w > 0.001;
    if (!m.visible) return;
    // Always ahead of you, high in the sky, far off.
    camera.getWorldDirection(fwd).setY(0).normalize();
    m.position.copy(camera.position).addScaledVector(fwd, 460);
    m.position.y = camera.position.y + 170;
    m.lookAt(camera.position.x, m.position.y, camera.position.z);
  });
  /* eslint-enable react-hooks/immutability */
  return (
    <mesh ref={mesh} material={mat} frustumCulled={false} renderOrder={-1}>
      <planeGeometry args={[1800, 320]} />
    </mesh>
  );
}

/** Neon rain: soft, blurred streaks falling fast through the air round
 *  you - each drop one point drawn as a smear of light, out of focus,
 *  rather than a hard line. */
function Rain({ road, travel, stretch, count, colours }: { road: RoadLayout; travel: Travel; stretch: Stretch | undefined; count: number; colours: string[] }) {
  const R = 40;
  const TOP = 46;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      c.set(colours[i % colours.length]).multiplyScalar(1.6);
      col.set([c.r, c.g, c.b], i * 3);
      pos.set([0, -1e5, 0], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [count, colours]);
  // The smear: a tall soft streak, feathered at every edge - a drop seen
  // through a lens, out of focus, not drawn.
  const streak = useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g2 = c.getContext("2d")!;
    const img = g2.createImageData(64, 64);
    for (let y = 0; y < 64; y++)
      for (let x = 0; x < 64; x++) {
        const dx = (x - 31.5) / 3.2;
        const dy = (y - 36) / 24;
        const a = Math.exp(-dx * dx) * Math.exp(-dy * dy * 1.6) * (y < 36 ? 0.75 : 1);
        const k = (y * 64 + x) * 4;
        img.data[k] = img.data[k + 1] = img.data[k + 2] = 255;
        img.data[k + 3] = Math.round(255 * Math.min(1, a));
      }
    g2.putImageData(img, 0, 0);
    return new THREE.CanvasTexture(c);
  }, []);
  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        map: streak,
        // (Pixels on screen, not world units: near the camera a sized-by-
        // distance drop grew to fill half the view, and the overdraw of
        // two hundred of them was the cost.)
        size: 22,
        sizeAttenuation: false,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [streak],
  );
  useEffect(() => () => streak?.dispose(), [streak]);
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );
  const centre = useMemo(() => new THREE.Vector3(), []);
  const placed = useRef(false);
  /* eslint-disable react-hooks/immutability -- particles, moved every frame */
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const w = inside(stretch, travel.s + AHEAD);
    mat.opacity = w;
    if (w <= 0.001) {
      placed.current = false;
      return;
    }
    pointAt(road, travel.s + AHEAD + 18, centre);
    const p = (geo.attributes.position as THREE.BufferAttribute).array as Float32Array;
    for (let i = 0; i < count; i++) {
      let y = p[i * 3 + 1] - 34 * dt;
      if (!placed.current || y < centre.y - 2 || (p[i * 3] - centre.x) ** 2 + (p[i * 3 + 2] - centre.z) ** 2 > R * R) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * R;
        p[i * 3] = centre.x + Math.cos(a) * r;
        p[i * 3 + 2] = centre.z + Math.sin(a) * r;
        y = centre.y + (placed.current ? TOP : Math.random() * TOP);
      }
      p[i * 3 + 1] = y;
    }
    placed.current = true;
    (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });
  /* eslint-enable react-hooks/immutability */
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

export function SectionWeather({ road, travel, spans }: { road: RoadLayout; travel: Travel; spans: Stretch[] }) {
  const still = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const find = (id: string) => spans.find((s) => s.id === id);
  const embers = useMemo(() => ["#ff4a2b", "#ff9500", "#ffb347"], []);
  const dust = useMemo(() => ["#22d9f5", "#9befff"], []);
  const pollen = useMemo(() => ["#ffd60a", "#ffe98a", "#ffb800"], []);
  const neon = useMemo(() => ["#f53de0", "#b04bff", "#ff6ad5"], []);
  const y = find("Y");
  const yRain = y ? { ...y, to: Math.min(y.to, victoryStart(road)) } : undefined;
  if (still) return null;
  return (
    <group>
      <Aurora travel={travel} stretch={find("S")} />
      {/* (Thinned out - about half - so at speed the air isn't so full
          of motes that the streaks at the edges of the view are lost.) */}
      <Drift road={road} travel={travel} stretch={find("T")} count={80} colours={dust} size={0.7} rise={0} wind={3.2} low={1} high={18} />
      <Drift road={road} travel={travel} stretch={find("O")} count={130} colours={pollen} size={0.8} rise={-1.4} wind={1.2} low={0} high={30} />
      <Drift road={road} travel={travel} stretch={find("R")} count={65} colours={embers} size={0.8} rise={3.2} wind={0.6} low={0} high={34} />
      {/* (Not over the victory stretch: the city there is busy enough.) */}
      <Rain road={road} travel={travel} stretch={yRain} count={210} colours={neon} />
    </group>
  );
}
