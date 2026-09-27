"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Monuments, type MonumentPlan } from "./monuments";
import { ROAD_HALF, groundAt, pointAt, seeded, sideAt, venueStretch, type RoadLayout } from "./road-geometry";

// SCALE. On the tracks of Extreme-G the road ran between things far
// bigger than you - towers, gantries, tunnels - and passing them is what
// made you feel small and fast. So the road here runs through a city:
//
// - TOWERS, back from the road: stepped skyscrapers, needles with a disc
//   near the top, obelisks, twin towers joined by a skybridge, stacked
//   cantilevers, ringed cylinders - in the app's dark blue glass, lit
//   only by the sky catching their edges. A few throw a slow searchlight
//   into the night.
// - GREAT ARCHES: glass walls across the road with a rounded opening
//   outlined in light, big enough to fill the view as you pass through.
// - CORRIDORS: rows of lit glass pillars either side, open to the sky.
// - TUBES: now and then the road runs into a long glass tube, rings and
//   strips of light around its walls and stars in the glass - flying
//   through it feels like flying through space.
//
// All of it sits in the long open stretches between challenges, never
// at a portal, and is drawn in a few instanced meshes so it costs little.

type ColourAt = (s: number) => THREE.Color;

/** The open middle of each stretch between two challenges. */
function openStretches(road: RoadLayout) {
  const marks = [0, ...road.stops, road.finish];
  const out: { from: number; to: number }[] = [];
  for (let i = 0; i < marks.length - 1; i++) {
    const from = marks[i] + 40;
    const to = marks[i + 1] - 40;
    if (to - from > 40) out.push({ from, to });
  }
  return out;
}

// ------------------------------------------------------------------ glass

const GLASS_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying float vH;
  varying float vDepth;
  varying vec3 vTint;
  void main() {
    // Each building its own tint of dark glass: blue, purple or green.
    float hh = fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453);
    vTint = hh < 0.4 ? vec3(0.16, 0.30, 0.78) : hh < 0.7 ? vec3(0.42, 0.20, 0.72) : vec3(0.12, 0.52, 0.50);
    vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
    vV = cameraPosition - wp.xyz;
    vH = wp.y;
    vec4 mv = viewMatrix * wp;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
// Dark blue glass, like the app's panels: deep navy, lighter where the
// surface turns away from you (fresnel), faint lines where the floors
// are - and a touch of haze with distance.
const GLASS_FRAG = /* glsl */ `
  uniform vec3 uFog;
  uniform float uFogD;
  varying vec3 vN;
  varying vec3 vV;
  varying float vH;
  varying float vDepth;
  varying vec3 vTint;
  void main() {
    vec3 N = normalize(vN);
    vec3 V = normalize(vV);
    float fres = pow(1.0 - abs(dot(N, V)), 3.0);
    float side = 0.5 + 0.5 * dot(N, normalize(vec3(-0.3, 0.6, -0.5)));
    float floors = smoothstep(0.9, 1.0, fract(vH / 3.2)) * 0.22;
    vec3 col = vTint * 0.12 * (0.55 + 0.8 * side)
      + vTint * fres * 0.42
      + vTint * floors * (0.3 + fres) * 0.9;
    float fog = 1.0 - exp(-uFogD * uFogD * vDepth * vDepth);
    gl_FragColor = vec4(mix(col, uFog, fog * 0.5), 1.0);
  }
`;

// THE PULSE: the glowing parts of the speaking landmarks - a mic's
// grille rings, a speaker's cones, the headphones' pads - beat with
// light in the colour of their section, each slightly out of step.
const PULSE_VERT = /* glsl */ `
  varying vec3 vCol;
  varying float vPhase;
  void main() {
    vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vCol = instanceColor;
    vPhase = (instanceMatrix[3].x + instanceMatrix[3].z) * 0.013;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const PULSE_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec3 vCol;
  varying float vPhase;
  void main() {
    float beat = pow(0.5 + 0.5 * sin(uTime * 4.2 + vPhase), 3.0);
    gl_FragColor = vec4(vCol * (0.35 + 1.4 * beat), 1.0);
  }
`;

type Kind = "box" | "cyl" | "cyl6" | "cone4" | "cone8" | "sphere" | "arc" | "gRing" | "gDisc" | "gSphere";
const KINDS: Kind[] = ["box", "cyl", "cyl6", "cone4", "cone8", "sphere", "arc", "gRing", "gDisc", "gSphere"];
/** The kinds that glow and pulse (the rest are glass). */
const GLOWS = new Set<Kind>(["gRing", "gDisc", "gSphere"]);
function unitGeo(k: Kind): THREE.BufferGeometry {
  if (k === "sphere") return new THREE.SphereGeometry(0.5, 20, 14);
  if (k === "arc") return new THREE.TorusGeometry(0.5, 0.06, 10, 40, Math.PI);
  if (k === "gRing") return new THREE.TorusGeometry(0.5, 0.05, 8, 48);
  if (k === "gDisc") return new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
  if (k === "gSphere") return new THREE.SphereGeometry(0.5, 16, 12);
  if (k === "box") return new THREE.BoxGeometry(1, 1, 1);
  if (k === "cyl") return new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
  if (k === "cyl6") return new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
  if (k === "cone4") return new THREE.ConeGeometry(0.5, 1, 4);
  return new THREE.ConeGeometry(0.5, 1, 10);
}

interface Tower {
  s: number;
  d: number;
  top: number;
}

/** Stretches of road where nothing tall may stand close: the arches,
 *  corridors and tubes, which need the space round the road. */
type Keep = { from: number; to: number }[];

/** The city's towers as parts: each part a primitive, positioned. Two
 *  rows - a near row lining the road, and a far row of taller spires and
 *  giants along the edges of the land - thickening into a real city
 *  through Y, where the road heads into the skyline. */
function buildCity(
  road: RoadLayout,
  rand: () => number,
  dense: { from: number; to: number } | undefined,
  keep: Keep,
  colourAt: ColourAt,
  clear: Keep = [],
) {
  const parts = Object.fromEntries(KINDS.map((k) => [k, [] as THREE.Matrix4[]])) as Record<Kind, THREE.Matrix4[]>;
  /** The speaking landmarks' glass, kept apart to be drawn with a white
   *  glow round their edges so the shapes read against the sky. */
  const lmParts = Object.fromEntries(KINDS.map((k) => [k, [] as THREE.Matrix4[]])) as Record<Kind, THREE.Matrix4[]>;
  /** Each glowing part's colour, in the same order as its matrices. */
  const tints = Object.fromEntries(KINDS.map((k) => [k, [] as THREE.Color[]])) as Record<Kind, THREE.Color[]>;
  const towers: Tower[] = [];
  const p = new THREE.Vector3();
  const side = new THREE.Vector3();
  const ahead = new THREE.Vector3();
  const anchor = new THREE.Object3D();
  const local = new THREE.Object3D();
  const m = new THREE.Matrix4();
  const inCity = (s: number) => (dense ? THREE.MathUtils.smoothstep(s, dense.from - 60, dense.from + 120) : 0);
  const kept = (s: number, d: number) =>
    (Math.abs(d) < 44 && keep.some((k) => s > k.from - 20 && s < k.to + 20)) || clear.some((k) => s > k.from && s < k.to);

  const tower = (s: number, d: number, w: number, h: number, type: number) => {
    groundAt(road, s, p);
    sideAt(road, s, side);
    groundAt(road, s + 2, ahead);
    anchor.position.set(p.x + side.x * d, p.y - 30, p.z + side.z * d);
    anchor.lookAt(ahead.x + side.x * d, anchor.position.y, ahead.z + side.z * d);
    anchor.rotateY((rand() - 0.5) * 0.8);
    anchor.updateMatrix();
    const glow = colourAt(s).clone();
    const put = (k: Kind, x: number, y: number, z: number, sx: number, sy: number, sz: number, ry = 0, rx = 0, rz = 0) => {
      local.position.set(x, y, z);
      local.rotation.set(rx, ry, rz);
      local.scale.set(sx, sy, sz);
      local.updateMatrix();
      const into = type >= 7 && !GLOWS.has(k) ? lmParts : parts;
      into[k].push(m.multiplyMatrices(anchor.matrix, local.matrix).clone());
      if (GLOWS.has(k)) tints[k].push(glow);
    };
    // Which way the road is, in this object's own frame - so a speaker's
    // front, or a mic's face, turns to the traveller.
    const face = d > 0 ? -Math.PI / 2 : Math.PI / 2;
    let top = h;
    if (type === 0) {
      // Stepped skyscraper with a spire.
      put("box", 0, h * 0.275, 0, w, h * 0.55, w * 0.8);
      put("box", 0, h * 0.625, 0, w * 0.72, h * 0.15, w * 0.6);
      put("box", 0, h * 0.775, 0, w * 0.48, h * 0.15, w * 0.4);
      put("cyl", 0, h * 0.95, 0, 0.6, h * 0.2, 0.6);
      top = h * 1.05;
    } else if (type === 1) {
      // Needle: a shaft, a disc near the top, a spire.
      put("cyl6", 0, h * 0.4, 0, w * 0.45, h * 0.8, w * 0.45);
      put("cyl", 0, h * 0.8, 0, w * 2, 3, w * 2);
      put("cyl", 0, h * 0.84, 0, w * 1.4, 2.5, w * 1.4);
      put("cone8", 0, h * 0.98, 0, w * 0.35, h * 0.3, w * 0.35);
      top = h * 1.13;
    } else if (type === 2) {
      // Obelisk.
      put("cone4", 0, h * 0.55, 0, w * 1.3, h * 1.1, w * 1.3, Math.PI / 4);
      top = h * 1.1;
    } else if (type === 3) {
      // Twin towers and a skybridge.
      put("box", -w * 0.65, h * 0.5, 0, w * 0.55, h, w * 0.55);
      put("box", w * 0.65, h * 0.45, 0, w * 0.55, h * 0.9, w * 0.55);
      put("box", 0, h * 0.7, 0, w * 1.9, 2.4, 2.2);
      put("box", 0, h * 0.5, 0, w * 1.9, 1.6, 1.6);
      put("cone4", -w * 0.65, h * 1.05, 0, w * 0.55, h * 0.1, w * 0.55, Math.PI / 4);
    } else if (type === 4) {
      // Stacked cantilevers.
      put("box", 0, h * 0.35, 0, w, h * 0.7, w);
      put("box", w * 0.45, h * 0.76, 0, w * 1.9, h * 0.12, w * 1.2);
      put("box", -w * 0.2, h * 0.9, 0, w * 0.9, h * 0.16, w * 0.9, 0.5);
      top = h * 0.98;
    } else if (type === 5) {
      // Ringed cylinder with a cone.
      put("cyl", 0, h * 0.45, 0, w, h * 0.9, w);
      for (const k of [0.35, 0.6, 0.82]) put("cyl", 0, h * k, 0, w * 1.45, 1.4, w * 1.45);
      put("cone8", 0, h * 1.0, 0, w, h * 0.2, w);
      top = h * 1.1;
    } else if (type === 7) {
      // A GIANT STAGE MICROPHONE on its stand: a tall pole, a tapering
      // handle, a ball grille ringed with pulsing light.
      put("cyl", 0, h * 0.3, 0, w * 0.12, h * 0.6, w * 0.12);
      put("cyl", 0, 1, 0, w * 1.6, 2, w * 1.6);
      put("cone8", 0, h * 0.69, 0, w * 0.5, h * 0.22, w * 0.5, 0, Math.PI);
      put("sphere", 0, h * 0.86, 0, w * 0.95, w * 0.95, w * 0.95);
      for (const k of [-0.18, 0, 0.18]) put("gRing", 0, h * 0.86 + k * w, 0, w * 0.97, w * 0.97, w * 0.97, 0, Math.PI / 2);
      top = h * 0.86 + w * 0.5;
    } else if (type === 8) {
      // A GIANT PODCAST MIC: a fat capsule held in a yoke on a stand,
      // its grille banded with light.
      put("cyl", 0, h * 0.25, 0, w * 0.2, h * 0.5, w * 0.2);
      put("box", 0, h * 0.5, 0, w * 1.5, w * 0.2, w * 0.3);
      put("box", -w * 0.7, h * 0.62, 0, w * 0.15, h * 0.26, w * 0.3);
      put("box", w * 0.7, h * 0.62, 0, w * 0.15, h * 0.26, w * 0.3);
      put("cyl", 0, h * 0.68, 0, w * 1.1, h * 0.3, w * 1.1, face, 0, 0.18);
      put("sphere", 0, h * 0.83, 0, w * 1.1, w * 1.1, w * 1.1);
      for (const k of [0.6, 0.66, 0.72, 0.78]) put("gRing", 0, h * k, 0, w * 1.12, w * 1.12, w * 1.12, 0, Math.PI / 2);
      top = h * 0.83 + w * 0.55;
    } else if (type === 9) {
      // GIANT HEADPHONES standing on end: the band an arch across the
      // sky, the cups either side glowing on their inner faces.
      const R = w * 2.4;
      put("box", 0, h * 0.25, 0, w * 0.5, h * 0.5, w * 0.5);
      put("arc", 0, h * 0.62, 0, R * 2, R * 2, R * 2, face);
      for (const sx of [-1, 1]) {
        // (Local x along the band, turned with it.)
        const cx = Math.cos(face) * sx * R;
        const cz = -Math.sin(face) * sx * R;
        put("cyl", cx, h * 0.62, cz, w * 1.5, w * 0.8, w * 1.5, face, 0, Math.PI / 2);
        put("gDisc", cx * 0.9, h * 0.62, cz * 0.9, w * 1.2, w * 0.08, w * 1.2, face, 0, Math.PI / 2);
      }
      top = h * 0.62 + R;
    } else if (type === 10) {
      // A GIANT SPEAKER STACK: two cabinets, one on the other, their
      // woofers and tweeters facing the road and pulsing to the beat.
      const cab = h * 0.45;
      for (const [y0, big] of [
        [0, true],
        [cab, false],
      ] as const) {
        put("box", 0, y0 + cab / 2, 0, w * 1.4, cab, w * 1.4, face);
        const cones = big ? [[0.3, 0.42]] : [[0.25, 0.28], [0.62, 0.2], [0.85, 0.1]];
        for (const [at, r] of cones) {
          const fx = Math.sin(face) * w * 0.72;
          const fz = Math.cos(face) * w * 0.72;
          put("gRing", fx, y0 + cab * at, fz, cab * r * 2, cab * r * 2, cab * r * 2, face);
          put("gDisc", fx * 0.99, y0 + cab * at, fz * 0.99, cab * r * 1.2, w * 0.04, cab * r * 1.2, face, Math.PI / 2);
        }
      }
      top = cab * 2;
    } else {
      // Spire: a slim hexagonal base rising into a long needle.
      put("cyl6", 0, h * 0.2, 0, w * 0.8, h * 0.4, w * 0.8);
      put("cone8", 0, h * 0.7, 0, w * 0.7, h * 0.6, w * 0.7);
      top = h;
    }
    towers.push({ s, d, top: top - 30 });
  };

  const end = road.finish;
  // THE NEAR ROW, lining the road.
  for (let s = 60; s < end; ) {
    const c = inCity(s);
    for (const sd of c > 0.3 ? [-1, 1] : [rand() < 0.5 ? -1 : 1]) {
      const d = sd * (ROAD_HALF + 20 + rand() * (c > 0.3 ? 30 : 45));
      if (kept(s, d)) continue;
      // One in six is a nod to speaking - a mic, headphones, a speaker
      // stack - that reads as a tower until you look again.
      const speaking = rand() < 0.17;
      tower(s, d, 6 + rand() * 9, (70 + rand() * 110) * (1 + c * 0.4), speaking ? 7 + Math.floor(rand() * 4) : Math.floor(rand() * 7));
    }
    s += THREE.MathUtils.lerp(28 + rand() * 24, 9 + rand() * 8, c);
  }
  // THE FAR ROW, along the edges of the land: taller, bigger, mostly
  // spires, needles and obelisks - the skyline you're always heading for.
  for (let s = 40; s < end; ) {
    const c = inCity(s);
    for (const sd of [-1, 1]) {
      if (rand() < 0.35 - c * 0.3) continue;
      if (clear.some((k) => s > k.from && s < k.to)) continue;
      const d = sd * (80 + rand() * 75);
      const type = rand() < 0.22 ? 7 + Math.floor(rand() * 4) : [1, 2, 6, 6, 5, 0, 3][Math.floor(rand() * 7)];
      tower(s, d, 10 + rand() * 14, 150 + rand() * 190, type);
    }
    s += THREE.MathUtils.lerp(40 + rand() * 35, 14 + rand() * 10, c);
  }
  return { parts, lmParts, tints, towers };
}

function City({ road, dense, keep, colourAt, clear }: { road: RoadLayout; dense?: { from: number; to: number }; keep: Keep; colourAt: ColourAt; clear: Keep }) {
  const { parts, lmParts, tints, towers } = useMemo(() => buildCity(road, seeded(97), dense, keep, colourAt, clear), [road, dense, keep, colourAt, clear]);
  // The landmarks' glass: the same dark glass, lit round its edges in
  // white, so a giant mic or a pair of headphones stands out.
  const rimmed = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: GLASS_VERT,
        fragmentShader: GLASS_FRAG.replace(
          "gl_FragColor = vec4(mix(col, uFog, fog * 0.5), 1.0);",
          "col = vec3(0.012, 0.013, 0.018) * (0.6 + 0.8 * side) + vec3(0.55, 0.62, 0.78) * pow(1.0 - abs(dot(N, V)), 2.2) * 0.6;\n    gl_FragColor = vec4(mix(col, uFog, fog * 0.5), 1.0);",
        ),
        uniforms: { uFog: { value: new THREE.Color("#060b1c") }, uFogD: { value: 0.0024 } },
      }),
    [],
  );
  const pulse = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: PULSE_VERT, fragmentShader: PULSE_FRAG, uniforms: { uTime: { value: 0 } } }),
    [],
  );
  /* eslint-disable react-hooks/immutability -- a shader uniform, set every frame */
  useFrame(({ clock }) => {
    pulse.uniforms.uTime.value = clock.elapsedTime;
  });
  /* eslint-enable react-hooks/immutability */
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: GLASS_VERT,
        fragmentShader: GLASS_FRAG,
        uniforms: { uFog: { value: new THREE.Color("#060b1c") }, uFogD: { value: 0.0024 } },
      }),
    [],
  );
  const meshes = useMemo(
    () =>
      KINDS.filter((k) => parts[k].length).map((k) => {
        const mesh = new THREE.InstancedMesh(unitGeo(k), GLOWS.has(k) ? pulse : material, parts[k].length);
        parts[k].forEach((mx, i) => mesh.setMatrixAt(i, mx));
        if (GLOWS.has(k)) {
          tints[k].forEach((c, i) => mesh.setColorAt(i, c));
          if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        }
        mesh.instanceMatrix.needsUpdate = true;
        mesh.frustumCulled = false;
        return mesh;
      }).concat(
        KINDS.filter((k) => lmParts[k].length).map((k) => {
          const mesh = new THREE.InstancedMesh(unitGeo(k), rimmed, lmParts[k].length);
          lmParts[k].forEach((mx, i) => mesh.setMatrixAt(i, mx));
          mesh.instanceMatrix.needsUpdate = true;
          mesh.frustumCulled = false;
          return mesh;
        }),
      ),
    [parts, lmParts, tints, material, pulse, rimmed],
  );
  useEffect(
    () => () => {
      meshes.forEach((m) => {
        m.geometry.dispose();
        m.dispose();
      });
      material.dispose();
      pulse.dispose();
      rimmed.dispose();
    },
    [meshes, material, pulse, rimmed],
  );
  return (
    <group>
      {meshes.map((m) => (
        <primitive key={m.uuid} object={m} />
      ))}
      <Searchlights road={road} towers={towers} />
    </group>
  );
}

// ----------------------------------------------------- arches and rings

function useInstanced(count: number, geo: THREE.BufferGeometry, mat: THREE.Material) {
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(geo, mat, Math.max(1, count));
    m.count = count;
    m.frustumCulled = false;
    return m;
  }, [count, geo, mat]);
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
      mesh.dispose();
    },
    [geo, mat, mesh],
  );
  return mesh;
}

/** CORRIDORS: two long rows of glass pillars either side of the road,
 *  open to the sky, each lit down its face and capped with a lamp - at
 *  speed they strobe past on both sides. */
function Corridors({ road, colourAt, runs }: { road: RoadLayout; colourAt: ColourAt; runs: { from: number; to: number }[] }) {
  const EVERY = 4.5;
  const count = runs.reduce((n, r) => n + (Math.floor((r.to - r.from) / EVERY) + 1) * 2, 0);
  const pillars = useInstanced(
    count,
    useMemo(() => new THREE.BoxGeometry(1, 1, 1), []),
    useMemo(
      () => new THREE.ShaderMaterial({ vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, uniforms: { uFog: { value: new THREE.Color("#060b1c") }, uFogD: { value: 0.0024 } } }),
      [],
    ),
  );
  const strips = useInstanced(
    count,
    useMemo(() => new THREE.BoxGeometry(1, 1, 1), []),
    useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []),
  );
  const lamps = useInstanced(
    count,
    useMemo(() => new THREE.SphereGeometry(1, 10, 8), []),
    useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []),
  );
  useEffect(() => {
    const p = new THREE.Vector3();
    const side = new THREE.Vector3();
    const ahead = new THREE.Vector3();
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    const white = new THREE.Color("#ffffff");
    let i = 0;
    const at = (s: number, d: number, y: number) => {
      pointAt(road, s, p);
      sideAt(road, s, side);
      pointAt(road, s + 2, ahead);
      o.position.set(p.x + side.x * d, p.y + y, p.z + side.z * d);
      o.rotation.set(0, 0, 0);
      o.scale.set(1, 1, 1);
      o.lookAt(ahead.x + side.x * d, o.position.y, ahead.z + side.z * d);
    };
    for (const r of runs) {
      for (let s = r.from; s <= r.to; s += EVERY) {
        c.copy(colourAt(s)).multiplyScalar(1.5);
        for (const d of [-(ROAD_HALF + 3), ROAD_HALF + 3]) {
          const H = 8;
          at(s, d, H / 2 - 0.6);
          o.scale.set(1.3, H, 1.3);
          o.updateMatrix();
          pillars.setMatrixAt(i, o.matrix);
          // The lit face, turned to the road.
          at(s, d - Math.sign(d) * 0.7, H / 2 - 0.6);
          o.scale.set(0.12, H - 1.5, 0.5);
          o.updateMatrix();
          strips.setMatrixAt(i, o.matrix);
          strips.setColorAt(i, c);
          at(s, d, H + 0.1);
          o.scale.setScalar(0.45);
          o.updateMatrix();
          lamps.setMatrixAt(i, o.matrix);
          lamps.setColorAt(i, c.clone().lerp(white, 0.5).multiplyScalar(1.3));
          i++;
        }
      }
    }
    for (const m of [pillars, strips, lamps]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }, [road, colourAt, runs, pillars, strips, lamps]);
  return (
    <group>
      <primitive object={pillars} />
      <primitive object={strips} />
      <primitive object={lamps} />
    </group>
  );
}

// ------------------------------------------------- stage and auditorium

/** THE VENUE: out of a tube and onto a STAGE - a wide glowing floor under
 *  a lighting truss, speaker stacks either side - and then out past the
 *  AUDIENCE: rows and rows of glowing seats either side of the road,
 *  raked up and away and turned back toward the stage, flashing past. */
function Venue({ road, colourAt, venues }: { road: RoadLayout; colourAt: ColourAt; venues: { stage: number; seatsTo: number }[] }) {
  const ROW = 2.6; // between rows of seats
  const SEAT = 1.35; // between seats in a row
  const FROM = ROAD_HALF + 2.5;
  const PER_ROW = 16;
  const rows = venues.reduce((n, v) => n + Math.max(0, Math.floor((v.seatsTo - v.stage - 14) / ROW)), 0);
  const seatCount = rows * PER_ROW * 2;
  const glass = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, uniforms: { uFog: { value: new THREE.Color("#060b1c") }, uFogD: { value: 0.0024 } } }),
    [],
  );
  const seats = useInstanced(seatCount, useMemo(() => new THREE.BoxGeometry(1, 1, 1), []), useMemo(() => glass.clone(), [glass]));
  const backs = useInstanced(seatCount, useMemo(() => new THREE.BoxGeometry(1, 1, 1), []), useMemo(() => glass.clone(), [glass]));
  // A thin line of light along the top of each seat back - row after row
  // of them flashing past.
  const rims = useInstanced(seatCount, useMemo(() => new THREE.BoxGeometry(1, 1, 1), []), useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []));
  const floor = useInstanced(venues.length, useMemo(() => new THREE.BoxGeometry(1, 1, 1), []), useMemo(() => glass.clone(), [glass]));
  const edges = useInstanced(venues.length * 3, useMemo(() => new THREE.BoxGeometry(1, 1, 1), []), useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []));
  const truss = useInstanced(venues.length * 3, useMemo(() => new THREE.BoxGeometry(1, 1, 1), []), useMemo(() => glass.clone(), [glass]));
  const spots = useInstanced(venues.length * 6, useMemo(() => new THREE.SphereGeometry(1, 12, 10), []), useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []));
  useEffect(() => () => glass.dispose(), [glass]);

  useEffect(() => {
    const p = new THREE.Vector3();
    const side = new THREE.Vector3();
    const ahead = new THREE.Vector3();
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    const white = new THREE.Color("#ffffff");
    const at = (s: number, d: number, y: number, back = false) => {
      pointAt(road, s, p);
      sideAt(road, s, side);
      pointAt(road, s + (back ? -2 : 2), ahead);
      o.position.set(p.x + side.x * d, p.y + y, p.z + side.z * d);
      o.rotation.set(0, 0, 0);
      o.scale.set(1, 1, 1);
      o.lookAt(ahead.x + side.x * d, o.position.y, ahead.z + side.z * d);
    };
    const put = (mesh: THREE.InstancedMesh, i: number, colour?: THREE.Color) => {
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      if (colour) mesh.setColorAt(i, colour);
    };
    let si = 0;
    venues.forEach((v, vi) => {
      c.copy(colourAt(v.stage)).multiplyScalar(1.5);
      // The stage floor, just under the road, wide and deep.
      const W = ROAD_HALF + 22;
      at(v.stage, 0, -0.35);
      o.scale.set(W * 2, 0.6, 16);
      put(floor, vi);
      // Its lit front edge and sides.
      at(v.stage + 8, 0, -0.02);
      o.scale.set(W * 2, 0.12, 0.3);
      put(edges, vi * 3, c);
      for (const [k, d] of [
        [1, -W],
        [2, W],
      ] as const) {
        at(v.stage, d, -0.02);
        o.scale.set(0.3, 0.12, 16);
        put(edges, vi * 3 + k, c);
      }
      // The lighting truss overhead, and its spotlights.
      for (const [k, d] of [
        [0, -W + 2],
        [1, W - 2],
      ] as const) {
        at(v.stage, d, 9);
        o.scale.set(0.8, 18, 0.8);
        put(truss, vi * 3 + k);
      }
      at(v.stage, 0, 18);
      o.scale.set(W * 2 - 2, 1, 1);
      put(truss, vi * 3 + 2);
      for (let k = 0; k < 6; k++) {
        at(v.stage, -W + 6 + k * ((W * 2 - 12) / 5), 17.2);
        o.scale.setScalar(0.7);
        put(spots, vi * 6 + k, c.clone().lerp(white, 0.5).multiplyScalar(1.05));
      }
      // THE AUDIENCE: rows of seats either side, raked upward away from
      // the stage and turned back to face it.
      for (let s = v.stage + 14; s + ROW <= v.seatsTo; s += ROW) {
        for (const sd of [-1, 1]) {
          for (let k = 0; k < PER_ROW; k++) {
            const d = sd * (FROM + k * SEAT);
            // The rows curve round toward the stage, the way an
            // auditorium's do - flat on the ground, the road through the
            // middle aisle.
            const curve = (k * SEAT) * (k * SEAT) * 0.012;
            at(s - curve, d, 0.3, true);
            o.scale.set(1.05, 0.25, 0.9);
            put(seats, si);
            at(s - curve + 0.45, d, 0.85, true);
            o.scale.set(1.05, 1.0, 0.14);
            put(backs, si);
            // A light along each seat's top edge - row after row of them.
            at(s - curve + 0.45, d, 1.38, true);
            o.scale.set(1.05, 0.07, 0.07);
            put(rims, si, c.clone().multiplyScalar(0.8));
            si++;
          }
        }
      }
    });
    for (const m of [seats, backs, rims, floor, edges, truss, spots]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }, [road, colourAt, venues, seats, backs, rims, floor, edges, truss, spots, FROM]);

  return (
    <group>
      {[seats, backs, rims, floor, edges, truss, spots].map((m) => (
        <primitive key={m.uuid} object={m} />
      ))}
    </group>
  );
}

// ------------------------------------------------------------- spotlights

/** UNDER THE SPOTLIGHTS: a line of lighting gantries over the road, each
 *  throwing beams down onto it that sway slowly - you drive from one pool
 *  of light into the next, like crossing a stage under the rig. */
function SpotlightRuns({ road, colourAt, runs }: { road: RoadLayout; colourAt: ColourAt; runs: { from: number; to: number }[] }) {
  const EVERY = 32;
  const H = 17;
  const rigs = useMemo(() => {
    const out: { s: number; d: number; phase: number }[] = [];
    runs.forEach((r) => {
      for (let s = r.from; s <= r.to; s += EVERY) for (const d of [-2.6, 2.6]) out.push({ s, d, phase: out.length * 1.3 });
    });
    return out;
  }, [runs]);
  const gantries = rigs.length / 2;
  const glass = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, uniforms: { uFog: { value: new THREE.Color("#060b1c") }, uFogD: { value: 0.0024 } } }),
    [],
  );
  const beams = useInstanced(gantries * 3, useMemo(() => new THREE.BoxGeometry(1, 1, 1), []), glass);
  const lamps = useInstanced(
    rigs.length,
    useMemo(() => new THREE.CylinderGeometry(0.5, 0.7, 1, 16), []),
    useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []),
  );
  // The beam: an open cone, brightest at the lamp, fading toward the road.
  const cones = useInstanced(
    rigs.length,
    useMemo(() => {
      const g = new THREE.ConeGeometry(1, 1, 24, 1, true);
      g.translate(0, -0.5, 0);
      return g;
    }, []),
    useMemo(
      () =>
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          vertexShader: /* glsl */ `
            varying float vDown;
            varying vec3 vCol;
            void main() {
              vDown = -position.y;
              vCol = instanceColor;
              gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: /* glsl */ `
            varying float vDown;
            varying vec3 vCol;
            void main() {
              gl_FragColor = vec4(vCol, 0.1 * (1.0 - vDown) + 0.02);
            }
          `,
        }),
      [],
    ),
  );
  const pools = useInstanced(
    rigs.length,
    useMemo(() => new THREE.CircleGeometry(1, 32).rotateX(-Math.PI / 2), []),
    useMemo(
      () => new THREE.MeshBasicMaterial({ map: poolTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
      [],
    ),
  );
  const colours = useMemo(() => rigs.map((r) => colourAt(r.s).clone().lerp(new THREE.Color("#fff6e0"), 0.6)), [rigs, colourAt]);
  const base = useMemo(() => {
    const p = new THREE.Vector3();
    const side = new THREE.Vector3();
    const ahead = new THREE.Vector3();
    return rigs.map((r) => {
      pointAt(road, r.s, p);
      sideAt(road, r.s, side);
      pointAt(road, r.s + 1, ahead);
      const fwd = ahead.clone().sub(p).setY(0).normalize();
      return { top: new THREE.Vector3(p.x + side.x * r.d, p.y + H - 0.8, p.z + side.z * r.d), ground: p.y + 0.06, side: side.clone(), fwd };
    });
  }, [road, rigs]);

  // The fixed parts: gantry posts and beam, the lamp housings.
  useEffect(() => {
    const p = new THREE.Vector3();
    const side = new THREE.Vector3();
    const ahead = new THREE.Vector3();
    const o = new THREE.Object3D();
    let b = 0;
    for (let g = 0; g < gantries; g++) {
      const s = rigs[g * 2].s;
      pointAt(road, s, p);
      sideAt(road, s, side);
      pointAt(road, s + 2, ahead);
      const W = ROAD_HALF + 4;
      for (const [d, y, sx, sy] of [
        [-W, H / 2, 0.9, H],
        [W, H / 2, 0.9, H],
        [0, H, W * 2 + 0.9, 0.9],
      ] as const) {
        o.position.set(p.x + side.x * d, p.y + y, p.z + side.z * d);
        o.rotation.set(0, 0, 0);
        o.scale.set(1, 1, 1);
        o.lookAt(ahead.x + side.x * d, o.position.y, ahead.z + side.z * d);
        o.scale.set(sx, sy, 0.9);
        o.updateMatrix();
        beams.setMatrixAt(b++, o.matrix);
      }
    }
    rigs.forEach((_, i) => {
      o.position.copy(base[i].top);
      o.rotation.set(0, 0, 0);
      o.scale.set(1.1, 1.2, 1.1);
      o.updateMatrix();
      lamps.setMatrixAt(i, o.matrix);
      lamps.setColorAt(i, colours[i].clone().multiplyScalar(1.6));
      cones.setColorAt(i, colours[i]);
      pools.setColorAt(i, colours[i].clone().multiplyScalar(0.65));
    });
    for (const m of [beams, lamps, cones, pools]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }, [road, rigs, gantries, base, colours, beams, lamps, cones, pools]);

  // The beams sway, and their pools of light move with them.
  const o = useMemo(() => new THREE.Object3D(), []);
  const q = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const down = useMemo(() => new THREE.Vector3(0, -1, 0), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const len = H - 0.8;
    rigs.forEach((r, i) => {
      const b = base[i];
      // Where the beam lands: swung across the road and a little along it.
      q.copy(b.top)
        .addScaledVector(b.side, Math.sin(t * 0.6 + r.phase) * 0.3 * len)
        .addScaledVector(b.fwd, Math.cos(t * 0.45 + r.phase * 0.7) * 0.12 * len);
      q.y = b.ground;
      dir.copy(q).sub(b.top).normalize();
      o.position.copy(b.top);
      o.quaternion.setFromUnitVectors(down, dir);
      const spread = 3.4;
      o.scale.set(spread, b.top.distanceTo(q), spread);
      o.updateMatrix();
      cones.setMatrixAt(i, o.matrix);
      o.position.copy(q);
      o.quaternion.identity();
      o.scale.set(spread * 1.25, 1, spread * 1.25);
      o.updateMatrix();
      pools.setMatrixAt(i, o.matrix);
    });
    for (const m of [cones, pools]) m.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {[beams, lamps, cones, pools].map((m) => (
        <primitive key={m.uuid} object={m} />
      ))}
    </group>
  );
}

/** A soft round pool of light, for the road under a spotlight. */
let poolTex: THREE.Texture | null = null;
function poolTexture() {
  if (poolTex || typeof document === "undefined") return poolTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.45)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  poolTex = new THREE.CanvasTexture(c);
  return poolTex;
}

// ---------------------------------------------------------------- cables

/** THE CABLE TANGLE: over one lifted stretch of road, three giant audio
 *  cables braid round it - over, under and through - each ending in a
 *  quarter-inch jack plug: a black grip, a steel shaft and a tip. The
 *  road weaves through them like a lead through a tangle. */
function Cables({ road, colourAt, runs }: { road: RoadLayout; colourAt: ColourAt; runs: { from: number; to: number }[] }) {
  const items = useMemo(() => {
    const cable = new THREE.MeshStandardMaterial({ color: "#0b0c10", roughness: 0.3, metalness: 0.35 });
    const steel = new THREE.MeshStandardMaterial({ color: "#c9ced8", roughness: 0.2, metalness: 1 });
    const meshes: THREE.Mesh[] = [];
    const p = new THREE.Vector3();
    const side = new THREE.Vector3();
    for (const r of runs) {
      const glow = new THREE.MeshBasicMaterial({ color: colourAt((r.from + r.to) / 2).clone().multiplyScalar(1.6), toneMapped: false });
      for (let k = 0; k < 3; k++) {
        const ph = (k * Math.PI * 2) / 3;
        const f = 1 / (22 + k * 5);
        const pts: THREE.Vector3[] = [];
        for (let s = r.from; s <= r.to; s += 3) {
          pointAt(road, s, p);
          sideAt(road, s, side);
          const t = (s - r.from) * f + ph;
          // A loose helix round the road: across it wide, over it and under.
          const d = Math.sin(t) * (ROAD_HALF + 5 + k * 1.5);
          const y = Math.cos(t) * (7 + k) + 1.5;
          pts.push(new THREE.Vector3(p.x + side.x * d, p.y + y, p.z + side.z * d));
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        meshes.push(new THREE.Mesh(new THREE.TubeGeometry(curve, pts.length * 3, 1.3, 14, false), cable));
        // A jack plug on each end, pointing away along the cable.
        for (const [u, dir] of [
          [0, -1],
          [1, 1],
        ] as const) {
          const at = curve.getPointAt(u);
          const tan = curve.getTangentAt(u).multiplyScalar(dir);
          const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
          const part = (geo: THREE.BufferGeometry, mat: THREE.Material, along: number) => {
            const m = new THREE.Mesh(geo, mat);
            m.quaternion.copy(q);
            m.position.copy(at).addScaledVector(tan, along);
            meshes.push(m);
          };
          part(new THREE.CylinderGeometry(1.5, 1.8, 3, 20), cable, 1.5); // strain relief
          part(new THREE.CylinderGeometry(2.3, 2.3, 7, 24), cable, 6.5); // the grip
          part(new THREE.TorusGeometry(2.3, 0.25, 8, 32).rotateX(Math.PI / 2), glow, 9.8); // a ring of light
          part(new THREE.CylinderGeometry(0.9, 0.9, 8, 20), steel, 14); // the shaft
          part(new THREE.CylinderGeometry(0.95, 0.95, 0.5, 20), cable, 16.2); // the insulating ring
          part(new THREE.SphereGeometry(0.95, 20, 12), steel, 18.4); // the tip
        }
      }
    }
    return { meshes, mats: [cable, steel] };
  }, [road, colourAt, runs]);
  useEffect(
    () => () => {
      items.meshes.forEach((m) => {
        m.geometry.dispose();
        if (!items.mats.includes(m.material as THREE.MeshStandardMaterial)) (m.material as THREE.Material).dispose();
      });
      items.mats.forEach((m) => m.dispose());
    },
    [items],
  );
  return (
    <group>
      {items.meshes.map((m) => (
        <primitive key={m.uuid} object={m} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------- pylons

/** Under a skyway: pairs of tall glass pylons from the land up to the
 *  road, a cross-beam under it, lit in the section's colour where they
 *  meet it - the road carried high between the towers. */
function Pylons({ road, colourAt }: { road: RoadLayout; colourAt: ColourAt }) {
  const EVERY = 22;
  const spots = useMemo(() => {
    const out: { s: number; lift: number }[] = [];
    for (const w of road.skyways)
      for (let s = w.a + 10; s < w.b - 10; s += EVERY) {
        const lift = road.liftAt(s);
        if (lift > 6) out.push({ s, lift });
      }
    return out;
  }, [road]);
  const glass = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, uniforms: { uFog: { value: new THREE.Color("#060b1c") }, uFogD: { value: 0.0024 } } }),
    [],
  );
  const posts = useInstanced(spots.length * 3, useMemo(() => new THREE.BoxGeometry(1, 1, 1), []), glass);
  const lights = useInstanced(spots.length * 2, useMemo(() => new THREE.BoxGeometry(1, 1, 1), []), useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []));
  useEffect(() => {
    const p = new THREE.Vector3();
    const side = new THREE.Vector3();
    const ahead = new THREE.Vector3();
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    let i = 0;
    let l = 0;
    for (const sp of spots) {
      pointAt(road, sp.s, p);
      sideAt(road, sp.s, side);
      pointAt(road, sp.s + 2, ahead);
      c.copy(colourAt(sp.s)).multiplyScalar(1.4);
      const place = (d: number, y: number, sx: number, sy: number, sz: number) => {
        o.position.set(p.x + side.x * d, y, p.z + side.z * d);
        o.rotation.set(0, 0, 0);
        o.scale.set(1, 1, 1);
        o.lookAt(ahead.x + side.x * d, y, ahead.z + side.z * d);
        o.scale.set(sx, sy, sz);
        o.updateMatrix();
      };
      const foot = p.y - sp.lift - 30;
      for (const d of [-(ROAD_HALF - 0.8), ROAD_HALF - 0.8]) {
        place(d, (foot + p.y - 0.6) / 2, 1.4, p.y - 0.6 - foot, 1.4);
        posts.setMatrixAt(i++, o.matrix);
        // A band of light where the pylon meets the road.
        place(d, p.y - 1.4, 1.5, 0.3, 1.5);
        lights.setMatrixAt(l, o.matrix);
        lights.setColorAt(l++, c);
      }
      place(0, p.y - 0.9, ROAD_HALF * 2, 0.7, 1.6);
      posts.setMatrixAt(i++, o.matrix);
    }
    for (const m of [posts, lights]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }, [road, colourAt, spots, posts, lights]);
  return (
    <group>
      <primitive object={posts} />
      <primitive object={lights} />
    </group>
  );
}

// ------------------------------------------------------------------ tubes

const TUBE_VERT = /* glsl */ `
  varying vec2 vUv;
  varying float vDepth;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
// Inside the tube: dark glass, rings of light around it every few
// metres, strips of light running its length, and stars in the glass -
// a few of them twinkling.
const TUBE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uLen;
  uniform float uTime;
  varying vec2 vUv;
  varying float vDepth;
  void main() {
    float along = vUv.x * uLen;
    float around = vUv.y;
    // A ring of light now and then - sparse.
    float ringD = (fract(along / 21.0) - 0.5) * 21.0;
    float ring = exp(-ringD * ringD * 3.0);
    // LAMPS in rows round the walls, like the lights along the road -
    // at speed they strobe past.
    vec2 q = vec2(along / 4.5, around * 12.0);
    vec2 fq = fract(q) - 0.5;
    float lamp = exp(-(fq.x * fq.x * 70.0 + fq.y * fq.y * 160.0));
    // And a few stars in the glass.
    vec2 cell = floor(vec2(along * 1.2, around * 90.0));
    float h = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
    vec2 f = fract(vec2(along * 1.2, around * 90.0)) - 0.5;
    float star = step(0.95, h) * exp(-dot(f, f) * 30.0) * (0.5 + 0.5 * sin(uTime * (1.0 + h * 3.0) + h * 50.0));
    vec3 base = vec3(0.015, 0.025, 0.06);
    vec3 col = base + uColor * (ring * 1.3 + lamp * 1.8) + vec3(0.8, 0.85, 1.0) * star * 0.8;
    float ends = smoothstep(0.0, 6.0, along) * smoothstep(uLen, uLen - 6.0, along);
    gl_FragColor = vec4(col * (0.35 + 0.65 * ends), 1.0);
  }
`;

function Tubes({ road, colourAt, tunnels }: { road: RoadLayout; colourAt: ColourAt; tunnels: { from: number; to: number }[] }) {
  const items = useMemo(
    () =>
      tunnels.map((tn) => {
        const pts: THREE.Vector3[] = [];
        for (let s = tn.from; s <= tn.to; s += 3) pts.push(pointAt(road, s).add(new THREE.Vector3(0, 3.4, 0)));
        const curve = new THREE.CatmullRomCurve3(pts);
        const len = tn.to - tn.from;
        const geo = new THREE.TubeGeometry(curve, Math.ceil(len / 1.5), 8.6, 40, false);
        const mat = new THREE.ShaderMaterial({
          vertexShader: TUBE_VERT,
          fragmentShader: TUBE_FRAG,
          side: THREE.DoubleSide,
          toneMapped: false,
          uniforms: {
            uColor: { value: colourAt((tn.from + tn.to) / 2).clone().multiplyScalar(1.2) },
            uLen: { value: len },
            uTime: { value: 0 },
          },
        });
        return { geo, mat };
      }),
    [road, colourAt, tunnels],
  );
  useEffect(
    () => () =>
      items.forEach((it) => {
        it.geo.dispose();
        it.mat.dispose();
      }),
    [items],
  );
  /* eslint-disable react-hooks/immutability -- shader uniforms, set every frame */
  useFrame(({ clock }) => {
    for (const it of items) it.mat.uniforms.uTime.value = clock.elapsedTime;
  });
  /* eslint-enable react-hooks/immutability */
  return (
    <group>
      {items.map((it, i) => (
        <mesh key={i} geometry={it.geo} material={it.mat} />
      ))}
    </group>
  );
}

// ------------------------------------------------------------ searchlights

/** From a few of the tallest towers, a slow beam of light swinging across
 *  the sky - the glare of the city at night. */
function Searchlights({ road, towers }: { road: RoadLayout; towers: Tower[] }) {
  const beams = useMemo(() => {
    const p = new THREE.Vector3();
    const side = new THREE.Vector3();
    return towers
      .filter((_, i) => i % 5 === 0)
      .map((t, i) => {
        pointAt(road, t.s, p);
        sideAt(road, t.s, side);
        return { pos: new THREE.Vector3(p.x + side.x * t.d, p.y + t.top + 1, p.z + side.z * t.d), phase: i * 1.7 };
      });
  }, [road, towers]);
  const geo = useMemo(() => {
    const g = new THREE.ConeGeometry(9, 260, 20, 1, true);
    g.translate(0, -130, 0);
    g.rotateX(Math.PI);
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          varying float vUp;
          void main() {
            vUp = position.y / 260.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying float vUp;
          void main() {
            float a = 0.07 * pow(1.0 - clamp(vUp, 0.0, 1.0), 1.8);
            gl_FragColor = vec4(vec3(0.7, 0.8, 1.0), a);
          }
        `,
      }),
    [],
  );
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    group.current?.children.forEach((child, i) => {
      const b = beams[i];
      child.rotation.set(Math.sin(t * 0.23 + b.phase) * 0.45, 0, Math.cos(t * 0.17 + b.phase) * 0.45);
    });
  });
  return (
    <group ref={group}>
      {beams.map((b, i) => (
        <mesh key={i} position={b.pos} geometry={geo} material={mat} />
      ))}
    </group>
  );
}

// ------------------------------------------------------------------- all

/** Where along the road each great structure stands - shared with the
 *  camera, which mustn't float up through a tube's roof. */
export function structurePlan(road: RoadLayout) {
  const arches: number[] = [];
  const corridors: { from: number; to: number }[] = [];
  const tunnels: { from: number; to: number }[] = [];
  const venues: { stage: number; seatsTo: number }[] = [];
  const spotRuns: { from: number; to: number }[] = [];
  openStretches(road).forEach((st, i) => {
    // A stretch with a loop or a corkscrew in it holds nothing else.
    if (road.stunts.some((z) => z.a < st.to + 40 && z.a + z.len > st.from - 40)) return;
    // Nor one where the road is up on a skyway.
    if (road.skyways.some((w) => w.a < st.to && w.b > st.from)) return;
    const mid = (st.from + st.to) / 2;
    const half = Math.min(60, (st.to - st.from) / 2 - 5);
    // In turn: a great arch, a corridor of lights, a tube.
    // (Every other arch is a run of spotlights instead.)
    if (i % 6 === 3) spotRuns.push({ from: mid - half, to: mid + half });
    else if (i % 3 === 0) arches.push(mid);
    else if (i % 3 === 1) corridors.push({ from: mid - half, to: mid + half });
    else if (!venueStretch(i)) tunnels.push({ from: mid - half, to: mid + half });
    else {
      // Out of a tube, onto a stage, and past the audience.
      const tubeTo = mid - 18;
      tunnels.push({ from: st.from + 2, to: tubeTo });
      venues.push({ stage: tubeTo + 10, seatsTo: st.to + 20 });
    }
  });
  const keep = [
    ...arches.map((s) => ({ from: s - 12, to: s + 12 })),
    ...corridors,
    ...tunnels,
    ...venues.map((v) => ({ from: v.stage - 10, to: v.seatsTo })),
    ...spotRuns,
    ...road.stunts.map((z) => ({ from: z.a - 20, to: z.a + z.len + 20 })),
  ];

  // THE MONUMENTS (monuments.tsx). The podcast mic beside the city's
  // skyway; the speakers either side of T's skyway; the headphones in
  // place of the second great arch.
  const monuments: MonumentPlan = {};
  const tallest = [...road.skyways].sort((p, q) => q.h - p.h)[0];
  if (tallest) monuments.mic = { s: (tallest.a + tallest.b) / 2, side: 1 };
  const mid = road.skyways.find((w) => w.h > 30 && w.h < 45);
  if (mid) monuments.speakers = { s: (mid.a + mid.b) / 2 };
  // Every great arch is now a giant pair of headphones.
  monuments.headphones = arches.splice(0, arches.length);
  /** Where the towers keep well clear, to let the monuments stand alone. */
  const clear = [monuments.mic, monuments.speakers]
    .filter((m): m is { s: number; side?: number } => Boolean(m))
    .map((m) => ({ from: m.s - 70, to: m.s + 70 }))
    .concat(monuments.headphones.map((s) => ({ from: s - 25, to: s + 25 })));
  return { arches, corridors, tunnels, venues, spotRuns, keep, monuments, clear };
}

export function Megastructures({
  road,
  colourAt,
  dense,
}: {
  road: RoadLayout;
  colourAt: ColourAt;
  /** Where the city is thickest: Y, heading into the skyline. */
  dense?: { from: number; to: number };
}) {
  const plan = useMemo(() => structurePlan(road), [road]);
  const cableRuns = useMemo(() => road.skyways.filter((w) => w.h < 30).map((w) => ({ from: w.a + 45, to: w.b - 45 })), [road]);
  const denseSpan = useMemo(() => (dense ? { from: dense.from, to: dense.to } : undefined), [dense]);
  return (
    <group>
      <City road={road} dense={denseSpan} keep={plan.keep} colourAt={colourAt} clear={plan.clear} />
      <Monuments road={road} colourAt={colourAt} plan={plan.monuments} />
      <Venue road={road} colourAt={colourAt} venues={plan.venues} />
      <Corridors road={road} colourAt={colourAt} runs={plan.corridors} />
      <Tubes road={road} colourAt={colourAt} tunnels={plan.tunnels} />
      <Pylons road={road} colourAt={colourAt} />
      {/* The cable tangle over the first skyway (the lowest). */}
      <Cables
        road={road}
        colourAt={colourAt}
        runs={cableRuns}
      />
      <SpotlightRuns road={road} colourAt={colourAt} runs={plan.spotRuns} />
    </group>
  );
}
