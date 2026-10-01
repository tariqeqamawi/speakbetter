"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Fireflies, Scenery } from "./world-extras";
import { Megastructures, structurePlan } from "./megastructures";
import { SectionWeather } from "./weather";
import { PORTAL_FLAT_SCALE, PORTAL_FLAT_Y, PORTAL_Y, Portal } from "./portal";
import { SkyDome } from "./sky-dome";
import { City } from "./city";
import { Bloom, GateSparks, Sky, SpeedSparks } from "./fx";
import { LOOK } from "./look";
import { FinishTunnel } from "./finish-gate";
import { AHEAD, ColourWall, RoadsideComment, RoadsideTrophy, Traveller } from "./world-details";
import { GATE_BEFORE, victoryStart, hills, layoutRoad, pointAt, reachedPhase, seeded, sideAt, type RoadLayout, type Travel, ROAD_HALF, bankLift, tiltAt, groundAt, surfaceAt, upAt } from "./road-geometry";

// The S.T.O.R.Y. adventure as a world you travel through.
//
// WHY REAL 3D. The road it replaces was drawn flat and made to look
// deep, which works until you want anything to stand in the landscape:
// hills, a gate, a banner coming at you, Coach at the roadside. Here
// there is a camera on the road, a road under it, land either side and
// fog in the distance, and everything else is simply placed on the road
// at a distance and left to the camera to show.
//
// ONE CONTINUOUS LAND. The five phases are not five scenes; the ground
// changes colour as you pass from one stretch into the next, the way a
// landscape does - the road is one road from the first checkpoint to
// the finish gate.
//
// DRAG DOWN TO GO FORWARD. On a road you pull the world towards you:
// dragging a thumb down the screen (or scrolling down) moves you along
// it, with a little momentum so it glides rather than steps.

export interface WorldStop {
  slug: string;
  title: string;
  /** Which phase of S.T.O.R.Y. it belongs to. */
  phase: string;
  state: "done" | "here" | "ahead" | "locked";
  /** Still shown inside the checkpoint's ring. */
  image: string;
  /** This checkpoint's trophy, beside its portal - a silhouette until won. */
  trophy?: string;
  /** Whether it has been won (pass at 75+); worked out from state and
   *  score when not given. */
  trophyWon?: boolean;
  /** Something another student said about this challenge. */
  comment?: { name: string; body: string };
  /** Its best score, once passed. */
  score?: number;
  /** Other students standing at this checkpoint right now. */
  classmates?: { name: string; avatar?: string }[];
}

export interface WorldPhase {
  id: string;
  name: string;
  /** Hex - three.js cannot read CSS variables. */
  color: string;
}


/** A section's colour brightened until it's as luminous as O's yellow -
 *  yellow was the only colour bright enough to bloom, which is why O's
 *  lights shimmered and the rest sat flat. Hue kept; only the light
 *  turned up. */
function glowing(c: THREE.Color): THREE.Color {
  const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  return c.multiplyScalar(THREE.MathUtils.clamp(0.66 / Math.max(lum, 0.01), 1, 2.4));
}

/** Where each phase's stretch of road starts and ends, by distance. */
function phaseSpans(road: RoadLayout, stops: WorldStop[], phases: WorldPhase[]) {
  return phases.map((p) => {
    const idx = stops.map((s, i) => (s.phase === p.id ? i : -1)).filter((i) => i >= 0);
    const first = road.stops[idx[0]] ?? 0;
    const last = road.stops[idx[idx.length - 1]] ?? 0;
    return { ...p, from: first - GATE_BEFORE, to: last + GATE_BEFORE, col: glowing(new THREE.Color(p.color)) };
  }).map((sp, _, all) => ({
    ...sp,
    // Past the last challenge: the victory stretch, in every colour.
    victory: victoryStart(road),
    all: all.map((x) => x.col),
  }));
}

type Span = ReturnType<typeof phaseSpans>[number];
const tmpVictory = new THREE.Color();

/** The ground's colour at a distance along the road: the phase it is
 *  in, blended into the next across the boundary so the land shades
 *  from one colour into the next rather than stepping. */
function colourAt(spans: Span[], s: number, out: THREE.Color): THREE.Color {
  // THE VICTORY STRETCH: after the last challenge the land and its lights
  // run through every section's colour in turn - green, cyan, gold, red,
  // magenta, and round again - all the way to the finish.
  const last = spans[spans.length - 1];
  if (last && s > last.victory) {
    const n = last.all.length;
    const u = (s - last.victory) / 26;
    const i = Math.floor(u);
    const mix = tmpVictory.copy(last.all[i % n]).lerp(last.all[(i + 1) % n], THREE.MathUtils.smoothstep(u - i, 0.55, 1));
    return out.copy(last.col).lerp(mix, THREE.MathUtils.smoothstep(s, last.victory, last.victory + 30));
  }
  const BLEND = 14;
  for (let i = 0; i < spans.length; i++) {
    const a = spans[i];
    const b = spans[i + 1];
    if (s <= a.to - BLEND / 2 || !b) {
      if (s < a.from && i > 0) continue;
      return out.copy(a.col);
    }
    if (s < b.from + BLEND / 2) {
      const t = THREE.MathUtils.smoothstep(s, a.to - BLEND / 2, b.from + BLEND / 2);
      return out.copy(a.col).lerp(b.col, t);
    }
  }
  return out.copy(spans[spans.length - 1].col);
}

/** Which phases' land lies at a distance along the road: the one you
 *  are in, and - across a boundary - the next, with how far into it. A
 *  wider blend than the colour's, so one landform grows into the next
 *  over a stretch of road instead of changing at a line. */
function landAt(spans: Span[], s: number): [string, string, number] {
  const BLEND = 44;
  for (let i = 0; i < spans.length; i++) {
    const a = spans[i];
    const b = spans[i + 1];
    if (!b) return [a.id, a.id, 0];
    const mid = (a.to + b.from) / 2;
    if (s < mid - BLEND / 2) return [a.id, a.id, 0];
    if (s < mid + BLEND / 2) return [a.id, b.id, THREE.MathUtils.smoothstep(s, mid - BLEND / 2, mid + BLEND / 2)];
  }
  return [spans[spans.length - 1].id, spans[spans.length - 1].id, 0];
}

// EACH PHASE IS ITS OWN LAND. The same ground everywhere made the
// phases one landscape in five colours; each has its own shape now,
// chosen for what the phase is about, and they blend over a stretch of
// road at every boundary:
//   S  Start With Awareness  soft, low rolling meadows - calm and open
//   T  Train Your Instrument terraces rising in steps, like a stage or
//                            the levels of a mixing desk
//   O  Own Your Stories      long flowing dunes, like pages or waves
//   R  Reveal Deeper Truths  tall jagged peaks and deep valleys
//   Y  Your Impact           a wide open plain, and on the horizon a
//                            city of light you travel towards (city.tsx)
// Every profile is flat under the road (away = 0) and rises from it.
function landform(id: string, x: number, z: number, away: number, u = 0.5): number {
  const h = hills(x, z);
  switch (id) {
    case "S":
      return away * (h * 16 - 2.5) + away * away * 3;
    case "T": {
      const raw = away * (h * 34 - 4) + away * away * 6;
      const q = raw / 3.6;
      return (Math.floor(q) + THREE.MathUtils.smoothstep(Math.abs(q % 1), 0.82, 1)) * 3.6;
    }
    case "O": {
      const dune = Math.pow(0.5 + 0.5 * Math.sin(x * 0.06 + z * 0.045 + h * 3.2), 2);
      return away * (dune * 18 + h * 8 - 3) + away * away * 4;
    }
    case "R": {
      // THE SOUND-WAVE CANYON: walls either side of the road, standing
      // back from it, their height rising and falling along the way like
      // the bars of a giant waveform - peaks and troughs you drive
      // between, down into Reveal Deeper Truths.
      const ridge = 1 - Math.abs(2 * h - 1);
      const bar = Math.abs(Math.sin(u * Math.PI * 16));
      const env = (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(u * Math.PI * 5.3 + 1))) * (0.6 + 0.4 * Math.sin(u * Math.PI * 11.7));
      const wall = THREE.MathUtils.smoothstep(away, 0.12, 0.42);
      return away * (Math.pow(ridge, 1.6) * 14 - 5) + wall * (10 + bar * env * 62) + away * away * 10;
    }
    case "Y": {
      // A pass first - the last mountains standing either side of the
      // road, hiding what is beyond - then the plain opening out.
      const pass = 1 - THREE.MathUtils.smoothstep(u, 0.12, 0.42);
      const ridge = 1 - Math.abs(2 * h - 1);
      return away * (h * 5 - 1.5) + pass * away * (Math.pow(ridge, 1.3) * 70 + 18);
    }
    default:
      return away * (h * 34 - 4) + away * away * 6;
  }
}

/** Each land's pattern of light (see pattern() in the shader). */
const PATTERN: Record<string, number> = { S: 3, T: 4, O: 1, R: 6, Y: 2 };

// THE LAND'S LIGHT. The grid is not drawn as lines - a 1-pixel line is a
// stroke of colour however bright it is, and cannot glow. It is worked
// out in the land's own surface, per pixel: the distance to the nearest
// edge of the grid, turned into a sharp core and a soft falloff round
// it, the way light spreads from an LED tube. At rest the grid is only a
// faint glow. Every few seconds a wave of light rolls out from the
// traveller down the road and across the land, lighting every edge it
// passes full bright, and lets them settle back behind it.
const TERRAIN_VERT = /* glsl */ `
  attribute vec2 aGrid;
  attribute float aS;
  attribute vec3 aNeon;
  attribute float aLift;
  attribute vec3 aPattern;
  varying float vLift;
  varying vec3 vPattern;
  varying vec2 vGrid;
  varying float vS;
  varying vec3 vNeon;
  varying vec3 vWorld;
  varying float vDepth;
  void main() {
    vPattern = aPattern;
    vGrid = aGrid;
    vS = aS;
    vNeon = aNeon;
    vLift = aLift;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vec4 mv = viewMatrix * world;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const TERRAIN_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uFrom;
  uniform vec3 uFog;
  uniform float uFogDensity;
  uniform vec3 uHorizon;
  uniform float uTarget;
  uniform vec3 uMe;
  uniform float uFeel;
  uniform float uSurface;
  uniform float uSheen;
  uniform float uWash;
  uniform float uGain;
  varying float vLift;
  varying vec3 vPattern;
  varying vec2 vGrid;
  varying float vS;
  varying vec3 vNeon;
  varying vec3 vWorld;
  varying float vDepth;

  // Distance in screen pixels from a value to its nearest whole step.
  float lineDist(float v) {
    return abs(fract(v - 0.5) - 0.5) / max(fwidth(v), 1e-4);
  }

  // THE PATTERN OF LIGHT for one land, by number:
  //   0 square grid          3 ripples        (S)
  //   1 dots          (O)    4 sound wave     (T)
  //   2 hexagons      (Y)    5 radiating      (spare)
  //   6 uneven lattice (R)
  // Each returns the distance to its nearest lit feature in screen
  // pixels, so the same LED glow works for all of them.
  float gTwinkle = 1.0;
  float pattern(int id, vec2 g) {
    if (id == 1) {
      // Twice as many points as the grid has crossings - and alive: each
      // twinkles at its own pace, and now and then one flares bright, a
      // field of stars rather than a pattern of holes.
      // (Half as many along the road as across it: the rows of studs
      // running away from you were so close they merged into one glow
      // at speed.)
      vec2 d2 = g * vec2(1.0, 2.0);
      vec2 cell = floor(d2 + 0.5);
      float h = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
      float tw = 0.5 + 0.5 * sin(uTime * (0.8 + h * 2.2) + h * 40.0);
      float flare = pow(max(sin(uTime * 0.35 + h * 60.0), 0.0), 40.0) * 3.0;
      gTwinkle = 0.25 + 1.1 * tw * tw + flare;
      vec2 d = (fract(d2 + 0.5) - 0.5) / max(fwidth(d2), vec2(1e-4));
      return max(length(d) - 1.8 - flare * 0.8, 0.0);
    }
    if (id == 2) {
      vec2 p = g * 1.7;
      vec2 k = vec2(1.0, 1.7320508);
      vec2 a = mod(p, k) - k * 0.5;
      vec2 b = mod(p - k * 0.5, k) - k * 0.5;
      vec2 h = abs(dot(a, a) < dot(b, b) ? a : b);
      float e = 0.5 - max(dot(h, normalize(k)), h.x);
      return e / max(fwidth(p.x), 1e-4);
    }
    if (id == 3) {
      // Rings spreading slowly from centres scattered through the land:
      // the nearest centre of the 3x3 cells round this one.
      vec2 cell = floor(g / 9.0);
      float r = 1e9;
      for (int i = -1; i <= 1; i++)
        for (int j = -1; j <= 1; j++) {
          vec2 c = cell + vec2(float(i), float(j));
          vec2 o = fract(sin(vec2(dot(c, vec2(127.1, 311.7)), dot(c, vec2(269.5, 183.3)))) * 43758.5453);
          r = min(r, length(g - (c + 0.2 + o * 0.6) * 9.0));
        }
      // (Spaced a third wider than they were - fewer rings, each clearer.)
      return lineDist(r * 0.6 - uTime * 0.25);
    }
    if (id == 4) {
      // Lines across the land, each a waveform, the ripple travelling -
      // half as many as the grid has rows, so at speed they flash past
      // one by one rather than blurring into a single sheet of light.
      float y = g.x * 0.5 + 0.35 * sin(g.y * 1.6 - uTime * 1.2) * sin(g.y * 0.37 + g.x * 0.2);
      return lineDist(y);
    }
    if (id == 5) {
      // Rays converging on the city far ahead, and rungs across them.
      vec2 v = vec2((vGrid.y - 32.0) * 5.3, vS - uTarget);
      float ang = atan(v.x, -v.y) * 70.0;
      return min(lineDist(ang), lineDist(vS / 6.0));
    }
    if (id == 6) {
      // The grid bent by slow waves so no two cells match, a diagonal
      // through each - a web, not a table.
      vec2 b = g + 0.28 * vec2(sin(g.y * 1.3 + g.x * 0.4), sin(g.x * 1.1 - g.y * 0.6));
      vec2 fb = abs(fract(b - 0.5) - 0.5) / max(fwidth(b), vec2(1e-4));
      return min(min(fb.x, fb.y), lineDist(b.x - b.y * 0.7));
    }
    vec2 f = abs(fract(g - 0.5) - 0.5) / max(fwidth(g), vec2(1e-4));
    return min(f.x, f.y);
  }

  void main() {
    // (vPattern: this land's pattern, the next land's, how far into it -
    // blended across each boundary.)
    vec2 g = vGrid / 2.0;
    vec2 w = max(fwidth(g), vec2(1e-4));
    int pa = int(vPattern.x + 0.5);
    int pb = int(vPattern.y + 0.5);
    float px = pa == pb ? pattern(pa, g) : mix(pattern(pa, g), pattern(pb, g), vPattern.z);
    // How much of this is dots - they need a tighter, brighter glow.
    float dotsK = (pa == 1 ? 1.0 - vPattern.z : 0.0) + (pb == 1 ? vPattern.z : 0.0);
    if (pa == 1 && pb == 1) dotsK = 1.0;
    float core = 1.0 - smoothstep(0.0, 1.4, px);
    // Dots sit much closer together on screen than lines do, so their
    // glow is kept tight - spread as wide as a line's, the field of
    // points merges into a haze.
    // Where the grid is finer than the screen can draw - far off, or
    // seen along flat ground at a low angle - its lines crowd together
    // and their glows merge into a solid sheet. Fade it out there, the
    // way a renderer filters a texture in the distance.
    float crowd = 1.0 - smoothstep(0.18, 0.55, max(w.x, w.y));
    float halo = exp(-px * mix(0.5, 1.4, dotsK));
    float haloWide = exp(-px * mix(0.22, 0.9, dotsK));

    // The wave: rolling out from the traveller along the road every eight
    // seconds (half as often as it was - less on screen), a soft band a
    // few squares deep.
    float front = uFrom + mod(uTime, 8.0) * 55.0;
    float d = vS - front;
    float wave = exp(-d * d / 60.0) * (1.0 - smoothstep(180.0, 220.0, front - uFrom));
    // A faint afterglow behind it, fading as it goes.
    float wake = (d < 0.0 ? exp(d / 18.0) : 0.0) * 0.35 * (1.0 - smoothstep(180.0, 220.0, front - uFrom));
    // (Quieter while you're moving - then the ripples below are the show.)
    wave *= 1.0 - 0.6 * uFeel;
    wake *= 1.0 - 0.6 * uFeel;

    // THE GROUND REACTS TO YOU: rings of light spreading out across the
    // land from the traveller, one after another, stronger the faster you
    // go and gone when you stop.
    float dm = length(vWorld.xz - uMe.xz);
    float rip = 0.0;
    for (int k = 0; k < 3; k++) {
      float r = mod(uTime * 34.0 + float(k) * 30.0, 90.0);
      float dd = dm - r;
      rip += exp(-dd * dd / 26.0) * (1.0 - r / 90.0);
    }
    rip *= uFeel;

    // THE SURFACE, lit the way a renderer with global illumination
    // would light it - approximated, because a phone cannot trace rays:
    //   occlusion  valleys sit in soft shadow, ridges stand in the light
    //   key light  a cool moon from high behind the hills
    //   bounce     the grid's own neon spilling onto the glass round it,
    //              and far more of it where the wave is passing
    //   fresnel    slopes seen at a glancing angle mirror the horizon glow
    //   specular   a tight highlight on each facet - glass, not paint
    vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
    if (n.y < 0.0) n = -n;
    vec3 V = normalize(cameraPosition - vWorld);
    vec3 L = normalize(vec3(-0.25, 0.75, -0.6));
    float ao = mix(0.3, 1.0, smoothstep(-3.0, 16.0, vLift));
    float hemi = 0.5 + 0.5 * n.y;
    float diff = max(dot(n, L), 0.0);
    float fres = pow(1.0 - max(dot(n, V), 0.0), 4.0);
    float spec = pow(max(dot(n, normalize(L + V)), 0.0), 70.0);
    vec3 albedo = vec3(0.010, 0.014, 0.030) * uSurface;
    vec3 col = albedo * (0.35 * hemi + 0.9 * diff) * ao;
    col += vec3(0.05, 0.06, 0.12) * uSurface * spec * ao;
    col += uHorizon * fres * uSheen * ao;
    col += vNeon * (uWash * haloWide * crowd + 0.05 * (wave + wake)) * ao;

    // The light itself.
    // A dot is a point, not a line: it needs more light to read.
    float rest = (0.02 * halo + 0.16 * core) * mix(1.0, 3.2 * gTwinkle, dotsK);
    float lit = (wave + wake) * (1.2 * core + 0.5 * halo + 0.25 * haloWide) + rip * (1.6 * core + 0.7 * halo + 0.3 * haloWide);
    col += vNeon * (rest + lit * 1.6) * crowd * uGain;

    // SHIMMER, in every land - what made O's dots the best thing on the
    // road: at some of the grid's crossings a point of light twinkles at
    // its own pace, now and then flaring. (O has its own field of dots.)
    vec2 sc = floor(g + 0.5);
    float sh = fract(sin(dot(sc, vec2(12.9898, 78.233))) * 43758.5453);
    float stw = pow(0.5 + 0.5 * sin(uTime * (0.8 + sh * 2.2) + sh * 40.0), 6.0)
      + pow(max(sin(uTime * 0.35 + sh * 60.0), 0.0), 40.0) * 3.0;
    vec2 sd = (fract(g + 0.5) - 0.5) / max(fwidth(g), vec2(1e-4));
    float spark = exp(-max(length(sd) - 1.3, 0.0) * 1.1) * step(0.45, sh);
    col += vNeon * spark * stw * 1.1 * crowd * (1.0 - dotsK) * uGain;

    float fog = 1.0 - exp(-uFogDensity * uFogDensity * vDepth * vDepth);
    // DEPTH: the far land sinks into a dark haze - graded, never a wall -
    // so near and far read apart instead of everything equally sharp.
    gl_FragColor = vec4(mix(col, uFog, fog * 0.93), 1.0);
  }
`;

/** A section's colour as a THREE.Color, made once. */
const tints = new Map<string, THREE.Color>();
function tintOf(hex: string): THREE.Color {
  let c = tints.get(hex);
  if (!c) tints.set(hex, (c = new THREE.Color(hex)));
  return c;
}

/** The land either side of the road, with its grid of light. */
function Terrain({ road, spans, travel }: { road: RoadLayout; spans: Span[]; travel: Travel }) {
  const geo = useMemo(() => {
    const ROW = 3; // world units between rows along the road
    const COLS = 64;
    const HALF = 170; // how far the land runs out either side
    const rows = Math.ceil(road.length / ROW);
    const n = (rows + 1) * (COLS + 1);
    const pos = new Float32Array(n * 3);
    const grid = new Float32Array(n * 2);
    const along = new Float32Array(n);
    const lift = new Float32Array(n);
    const pattern = new Float32Array(n * 3);
    // The neon of each vertex: the colour its edges glow in.
    const neon = new Float32Array(n * 3);
    const p = new THREE.Vector3();
    const side = new THREE.Vector3();
    const phase = new THREE.Color();
    for (let r = 0; r <= rows; r++) {
      const s = Math.min(r * ROW, road.length);
      groundAt(road, s, p);
      sideAt(road, s, side);
      colourAt(spans, s, phase);
      // THE GAP: under the corkscrew the land falls away into a chasm the
      // road crosses in the air.
      const gap = road.stunts
        .filter((z) => z.kind === "corkscrew")
        .reduce((m, z) => Math.max(m, THREE.MathUtils.smoothstep(s, z.a - 10, z.a + 12) * (1 - THREE.MathUtils.smoothstep(s, z.a + z.len - 12, z.a + z.len + 10))), 0);
      // On the inside of a bend the land cannot reach further than the
      // bend's radius, or it folds back over itself.
      const bend = road.bendAt(s);
      const inside = bend === 0 ? 1e9 : 0.85 / Math.abs(bend);
      const span = spans.find((sp) => s >= sp.from && s < sp.to);
      const u = span ? (s - span.from) / Math.max(1, span.to - span.from) : 0.5;
      for (let k = 0; k <= COLS; k++) {
        let d = (k / COLS - 0.5) * 2 * HALF;
        // (A positive bend turns right, and the side vector points right.)
        if (Math.sign(d) === Math.sign(bend) && Math.abs(d) > inside) d = Math.sign(d) * (inside + (Math.abs(d) - inside) * 0.08);
        const x = p.x + side.x * d;
        const z = p.z + side.z * d;
        // Flat under the road, rising into hills away from it.
        const away = THREE.MathUtils.smoothstep(Math.abs(d), ROAD_HALF + 1.6, 70);
        const h = hills(x, z);
        const [la, lb, lt] = landAt(spans, s);
        const rise = la === lb ? landform(la, x, z, away, u) : THREE.MathUtils.lerp(landform(la, x, z, away, u), landform(lb, x, z, away, u), lt);
        // Near the road the land leans with it, so the banked road never
        // sinks into the ground on the inside of a bend.
        const lean = bankLift(road, s, d) * (1 - THREE.MathUtils.smoothstep(Math.abs(d), ROAD_HALF, ROAD_HALF + 8));
        // Level ground round the auditorium, so its seats sit flat.
        const levelled =
          rise *
          (1 - road.flatAt(s) * (1 - THREE.MathUtils.smoothstep(Math.abs(d), 40, 75))) *
          // Under a skyway the land lies low, so the road clearly flies.
          (1 - Math.min(1, road.liftAt(s) / 18) * (1 - THREE.MathUtils.smoothstep(Math.abs(d), 70, 130)));
        const chasm = gap * 70 * (1 - THREE.MathUtils.smoothstep(Math.abs(d), 45, 85));
        const y = p.y - 0.2 + levelled + lean - chasm;
        const v = r * (COLS + 1) + k;
        pos.set([x, y, z], v * 3);
        grid.set([r, k], v * 2);
        along[v] = s;
        lift[v] = y - p.y;
        // O's dunes carry dots; R's peaks an uneven lattice.
        pattern.set([PATTERN[la] ?? 0, PATTERN[lb] ?? 0, lt], v * 3);
        // Brightest near the road and along the ridges.
        const near = 1 - THREE.MathUtils.smoothstep(Math.abs(d), 4, 90);
        const ridge = THREE.MathUtils.smoothstep(h, 0.55, 0.85) * away;
        const k2 = 0.6 + near * 0.5 + ridge * 0.4;
        neon.set([phase.r * k2, phase.g * k2, phase.b * k2], v * 3);
      }
    }
    const idx: number[] = [];
    for (let r = 0; r < rows; r++)
      for (let k = 0; k < COLS; k++) {
        const a = r * (COLS + 1) + k;
        const b = a + COLS + 1;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aGrid", new THREE.BufferAttribute(grid, 2));
    g.setAttribute("aS", new THREE.BufferAttribute(along, 1));
    g.setAttribute("aNeon", new THREE.BufferAttribute(neon, 3));
    g.setAttribute("aLift", new THREE.BufferAttribute(lift, 1));
    g.setAttribute("aPattern", new THREE.BufferAttribute(pattern, 3));
    g.setIndex(idx);
    return g;
  }, [road, spans]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: TERRAIN_VERT,
        fragmentShader: TERRAIN_FRAG,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uFrom: { value: 0 },
          uFog: { value: new THREE.Color(LOOK.haze) },
          uSurface: { value: LOOK.surface },
          uSheen: { value: LOOK.sheen },
          uWash: { value: LOOK.wash },
          uGain: { value: LOOK.gain },
          uFogDensity: { value: 0.0042 },
          uHorizon: { value: new THREE.Color("#3a3f8f") },
          // Where Your Impact's rays converge: the city, far past the road.
          uTarget: { value: road.length + 330 },
          uMe: { value: new THREE.Vector3() },
          uFeel: { value: 0 },
        },
      }),
    [road.length],
  );

  // Each wave starts from wherever the traveller is when it sets off.
  const lastLoop = useRef(-1);
  /* eslint-disable react-hooks/immutability */
  const hazeTarget = useMemo(() => new THREE.Color(), []);
  useFrame(({ clock, scene }) => {
    // THE AIR OF EACH SECTION: the haze over the far land leans toward
    // the colour of the section you're in - green mist in S, cyan in T,
    // gold in O - easing across as you cross from one to the next.
    {
      const here = travel.s + AHEAD;
      const sp = spans.find((x) => here >= x.from && here < x.to) ?? spans[0];
      if (sp) {
        hazeTarget.set(LOOK.haze).lerp(tintOf(sp.color), LOOK.hazeTint);
        const u = material.uniforms.uFog.value as THREE.Color;
        u.lerp(hazeTarget, 0.03);
        const fog = scene.fog as THREE.FogExp2 | null;
        if (fog) fog.color.copy(u);
      }
    }
    const t = clock.elapsedTime;
    material.uniforms.uTime.value = t;
    // Where the ripples start from, and how strong they are.
    pointAt(road, travel.s + AHEAD, material.uniforms.uMe.value as THREE.Vector3);
    material.uniforms.uFeel.value = Math.min(1, travel.feel * 1.3);

    const loop = Math.floor(t / 8);
    if (loop !== lastLoop.current) {
      lastLoop.current = loop;
      material.uniforms.uFrom.value = travel.s + 6;
    }
  });
  /* eslint-enable react-hooks/immutability */

  return <mesh geometry={geo} material={material} />;
}

/** A ribbon laid along the road between two lateral offsets. */
function ribbon(
  road: RoadLayout,
  spans: Span[],
  from: number,
  to: number,
  lift: number,
  colour: (phase: THREE.Color, out: THREE.Color) => THREE.Color,
) {
  const STEP = 1.5;
  const rows = Math.ceil(road.length / STEP);
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const p = new THREE.Vector3();
  const side = new THREE.Vector3();
  const q = new THREE.Vector3();
  const phase = new THREE.Color();
  const c = new THREE.Color();
  for (let r = 0; r <= rows; r++) {
    const s = Math.min(r * STEP, road.length);
    pointAt(road, s, p);
    sideAt(road, s, side);
    colour(colourAt(spans, s, phase), c);
    for (const d of [from, to]) {
      surfaceAt(road, s, d, lift, q);
      pos.push(q.x, q.y, q.z);
      col.push(c.r, c.g, c.b);
    }
    if (r < rows) {
      const a = r * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  return geo;
}

/** Short dashes along the road at the given offsets across it. */
function dashes(road: RoadLayout, spans: Span[], at: number[]) {
  const EVERY = 7;
  const LONG = 2.6;
  const W = 0.09;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const q = new THREE.Vector3();
  const c = new THREE.Color();
  for (let s = 4; s + LONG < road.length; s += EVERY) {
    colourAt(spans, s, c).multiplyScalar(0.8);
    for (const d of at) {
      const base = pos.length / 3;
      for (const ss of [s, s + LONG])
        for (const dd of [d - W, d + W]) {
          surfaceAt(road, ss, dd, 0.045, q);
          pos.push(q.x, q.y, q.z);
          col.push(c.r, c.g, c.b);
        }
      idx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  return geo;
}

/** THE LIGHTS ALONG THE ROAD. Low glowing posts on both edges, close
 *  together and evenly spaced, in the colour of their section - still,
 *  they mark the road; moving, they flash past one after another, the
 *  way the barrier lights did on the tracks of Extreme-G. Most of the
 *  feeling of speed comes from these. */
function EdgeLights({ road, spans }: { road: RoadLayout; spans: Span[] }) {
  const EVERY = 5;
  const mesh = useMemo(() => {
    const count = Math.floor((road.length - 4) / EVERY) * 2;
    const geo = new THREE.BoxGeometry(0.18, 0.42, 0.75);
    const mat = new THREE.MeshBasicMaterial({ toneMapped: false });
    const m = new THREE.InstancedMesh(geo, mat, count);
    const p = new THREE.Vector3();
    const side = new THREE.Vector3();
    const ahead = new THREE.Vector3();
    const c = new THREE.Color();
    const o = new THREE.Object3D();
    let i = 0;
    for (let s = 4; i < count; s += EVERY) {
      pointAt(road, s, p);
      sideAt(road, s, side);
      pointAt(road, s + 1, ahead);
      colourAt(spans, s, c).multiplyScalar(1.35);
      for (const d of [-(ROAD_HALF + 0.35), ROAD_HALF + 0.35]) {
        surfaceAt(road, s, d, 0.3, o.position);
        surfaceAt(road, s + 1, d, 0.3, ahead);
        upAt(road, s, o.up);
        o.lookAt(ahead);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
        m.setColorAt(i, c);
        i++;
      }
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.frustumCulled = false;
    return m;
  }, [road, spans]);
  useEffect(
    () => () => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      mesh.dispose();
    },
    [mesh],
  );
  return <primitive object={mesh} />;
}

/** The road: dark surface, faint edges, and the lit line down the
 *  middle that the traveller follows. */
function Road({ road, spans, trail }: { road: RoadLayout; spans: Span[]; trail: THREE.BufferGeometry[] }) {
  const g = useMemo(
    () => ({
      surface: ribbon(road, spans, -ROAD_HALF, ROAD_HALF, 0, (ph, o) => o.set(LOOK.road).lerp(ph, LOOK.roadTint)),
      glow: ribbon(road, spans, -1.8, 1.8, 0.03, (ph, o) => o.copy(ph).multiplyScalar(LOOK.mid)),
      // The road ahead, not yet travelled: a faint guide line.
      line: ribbon(road, spans, -0.12, 0.12, 0.05, (ph, o) => o.copy(ph).multiplyScalar(0.45 * LOOK.gain)),
      left: ribbon(road, spans, -ROAD_HALF, -ROAD_HALF + 0.2, 0.04, (ph, o) => o.copy(ph).multiplyScalar(0.7 * LOOK.gain)),
      right: ribbon(road, spans, ROAD_HALF - 0.2, ROAD_HALF, 0.04, (ph, o) => o.copy(ph).multiplyScalar(0.7 * LOOK.gain)),
      // Lane marks: dashes a third of the way out each side, which pour
      // toward you at speed.
      lanes: dashes(road, spans, [-ROAD_HALF / 2.2, ROAD_HALF / 2.2]),
    }),
    [road, spans],
  );
  return (
    <group>
      <mesh geometry={g.surface}>
        <meshStandardMaterial vertexColors roughness={0.6} metalness={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={g.glow}>
        <meshBasicMaterial vertexColors transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={g.line}>
        <meshBasicMaterial vertexColors toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      {/* The neon the traveller leaves behind - drawn only as far as
          they have gone (world-details.tsx, Traveller). */}
      <mesh geometry={trail[2]}>
        <meshBasicMaterial vertexColors transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={trail[0]}>
        <meshBasicMaterial vertexColors transparent opacity={0.42} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={trail[1]}>
        <meshBasicMaterial vertexColors toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={g.left}>
        <meshBasicMaterial vertexColors toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={g.right}>
        <meshBasicMaterial vertexColors toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={g.lanes}>
        <meshBasicMaterial vertexColors transparent opacity={0.55} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <EdgeLights road={road} spans={spans} />
    </group>
  );
}

/** A sky full of stars - a few thousand points far away. */
function Stars() {
  const geo = useMemo(() => {
    const n = 2200;
    const p = new Float32Array(n * 3);
    const rand = seeded(7);
    for (let i = 0; i < n; i++) {
      const u = rand() * Math.PI * 2;
      const v = rand() * 0.45 + 0.04;
      const r = 700;
      p[i * 3] = Math.cos(u) * Math.cos(v) * r;
      p[i * 3 + 1] = Math.sin(v) * r;
      p[i * 3 + 2] = Math.sin(u) * Math.cos(v) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial size={1.6} sizeAttenuation={false} color="#c8d3ff" transparent opacity={0.75} fog={false} />
    </points>
  );
}

/** The camera, riding the road. */
/** Which view a switch is coming from, or going to. */
export type ViewMode = "2d" | "3d" | "4d";

function Rig({
  road,
  travel,
  onMove,
  limit,
  calm = false,
  arrive = null,
  leaveTo = null,
}: {
  road: RoadLayout;
  travel: Travel;
  /** Just switched here from another view: the camera starts where that
   *  view's camera was - high over the map, or down behind the traveller -
   *  and glides into its own place. */
  arrive?: ViewMode | null;
  /** Switching away: the camera glides to where the next view's will be
   *  (right up over the road, for the flat map) while that view fades in. */
  leaveTo?: ViewMode | null;
  /** The calm "3D" view: high up and looking down on the road, like a
   *  map come to life - no speed effects, no shake, no lean. */
  calm?: boolean;
  /** As far as the traveller may go. */
  limit: number;
  onMove: (s: number) => void;
}) {
  const { camera, gl } = useThree();
  const eye = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const at = useMemo(() => new THREE.Vector3(), []);
  const across = useMemo(() => new THREE.Vector3(), []);
  const sEye = useMemo(() => new THREE.Vector3(), []);
  const sLook = useMemo(() => new THREE.Vector3(), []);
  const offset = useMemo(() => new THREE.Vector3(), []);
  const last = useRef(-1);
  const lastAt = useRef(0);
  const roll = useRef(0);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const speed = useRef(0);
  const tubes = useMemo(() => structurePlan(road).tunnels, [road]);
  const topFor = useRef(0);
  const prevS = useRef(travel.s);
  const prevPos = useMemo(() => new THREE.Vector3(), []);
  const moved = useMemo(() => new THREE.Vector3(), []);
  const carried = useRef(false);
  const stillFor = useRef(0);
  const idle = useRef(0);
  // For anyone who has asked for less motion: no swoop, no shake.
  const still = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  // THE SWITCH BETWEEN VIEWS: where each view's camera sits, so this one
  // can start from the last one's place, or head for the next one's.
  const lookCur = useMemo(() => new THREE.Vector3(), []);
  const since = useRef(-1);
  const poseTmp = useMemo(() => new THREE.Vector3(), []);
  const pose = (view: ViewMode, tS: number, e: THREE.Vector3, l: THREE.Vector3) => {
    if (view === "2d") {
      // Straight up over the road ahead, looking down on it like the map.
      pointAt(road, tS + 45, l);
      pointAt(road, tS + 43, poseTmp);
      e.copy(poseTmp).sub(l).setY(0).normalize().multiplyScalar(6).add(l);
      e.y = l.y + 230;
    } else if (view === "3d") {
      pointAt(road, tS - 50, e).setY(e.y + 95);
      pointAt(road, tS + 40, l);
    } else {
      pointAt(road, tS - AHEAD, e).setY(e.y + 7.5);
      pointAt(road, tS + 26, l).setY(l.y + 1.2);
    }
  };
  /** How the camera eases toward its place: slowly while a switch is under
   *  way, briskly the rest of the time. */
  const settle = (frameDt: number) => {
    // (The first frames after a new canvas appears can report a long
    // step; the glide must not jump to the end on one.)
    const dt = Math.min(frameDt, 1 / 30);
    since.current = since.current < 0 ? 0 : since.current + dt;
    const moving = leaveTo !== null || (arrive !== null && since.current < 1.8);
    return { k: 1 - Math.pow(moving && !still ? 0.035 : 0.001, dt), moving: moving && !still };
  };

  /* eslint-disable react-hooks/immutability -- the camera is three.js's, moved every frame */
  useFrame((_, dt) => {
    // Arriving from another view: start the camera where that one's was.
    if (since.current < 0 && arrive && !still) {
      pose(arrive, travel.s + AHEAD, camera.position, lookCur);
      camera.lookAt(lookCur);
    }
    // Leaving: no more travel - the road holds still under the camera.
    if (leaveTo) {
      travel.v = 0;
      travel.target = null;
    }
    // The road is magnetic: stop anywhere on the loop or the corkscrew,
    // upside down if you like, and go back the way you came.
    travel.floor = 0;
    travel.step(Math.min(dt, 0.05) * 60, limit);
    const s = travel.s;
    if (travel.portal) {
      // The dive: the camera sweeps down to the portal's height and in
      // to its mouth, looking straight into the vortex.
      const k = THREE.MathUtils.smoothstep((performance.now() - travel.portal.since) / 1700, 0, 1);
      pointAt(road, travel.portal.s - 2.2 - (1 - k) * 12, pos);
      pointAt(road, travel.portal.s, at);
      eye.set(pos.x, pos.y + PORTAL_Y + (1 - k) * 4, pos.z);
      look.set(at.x, at.y + PORTAL_Y, at.z);
      camera.position.lerp(eye, 1 - Math.pow(0.0005, dt));
      camera.up.set(0, 1, 0);
      camera.lookAt(look);
      carried.current = false;
      return;
    }
    // How fast it feels, eased so it swells and settles rather than
    // snapping - it drives the camera's height, the view's width, the
    // blur, the streaks and the wind.
    // Measured from how far the road actually moved this frame, not the
    // speed asked for - held at the end of the open road, nothing rushes.
    const rate = dt > 0 ? Math.abs(s - prevS.current) / (dt * 60) : 0;
    prevS.current = s;
    const moving = Math.abs(travel.v) > 0.01 || travel.target !== null ? Math.min(rate, 4) : 0;
    const pace = Math.min(1, moving / 1.6);
    speed.current += (pace - speed.current) * Math.min(1, dt * 2.5);
    const f = still ? 0 : speed.current;
    travel.feel = speed.current;
    // FLAT OUT for a second and a half: the sparks fly, and the camera
    // drops in tight and low behind the traveller.
    topFor.current = moving > 2.3 ? topFor.current + dt : 0;
    const boostTo = topFor.current > 1.5 ? 1 : 0;
    travel.boost += (boostTo - travel.boost) * Math.min(1, dt * (boostTo ? 1.6 : 3));
    const b = still ? 0 : travel.boost;
    // STANDING STILL for a moment: the camera floats slowly up, to look
    // down on more of the road; it comes back down as soon as you move.
    stillFor.current = Math.abs(travel.v) < 0.02 && travel.target === null ? stillFor.current + dt : 0;
    // (Not in or beside a tube: floating up there would put the camera
    // through its roof.)
    const tubeNear = tubes.some((t) => s + AHEAD > t.from - 25 && s < t.to + 5);
    const idleTo = stillFor.current > 1.2 && !tubeNear && road.stuntAt(s + AHEAD) === 0 ? 1 : 0;
    idle.current += (idleTo - idle.current) * Math.min(1, dt * (idleTo ? 0.45 : 3));
    const up = idle.current;
    // At rest: up above the road and behind the traveller, looking down
    // the road past them. Flying: down low and in close behind them, the
    // road pouring toward you, the way the camera rode behind the bikes
    // in Extreme-G - lower and closer still once the sparks fly.
    // (Pulled in only so far: any closer and, on a phone above all, the
    // disc fills the view and you can't see where you're going.)
    // Flat out, the camera stays low but drops back - the chase camera
    // straining to keep up - while the view widens and the blur and
    // streaks come on hard.
    const tS = s + AHEAD;
    if (calm) {
      // THE CALM VIEW: high above and behind the traveller, looking down
      // the road ahead - the whole stretch laid out like a map.
      // (Steep enough that the portals lying flat on the road read as
      // circles.)
      pointAt(road, tS - 50, pos);
      pointAt(road, tS + 40, at);
      eye.copy(pos).setY(pos.y + 95);
      look.copy(at);
      if (carried.current) camera.position.add(moved.copy(pos).sub(prevPos));
      prevPos.copy(pos);
      carried.current = true;
      if (leaveTo) pose(leaveTo, tS, eye, look);
      const sw = settle(dt);
      camera.position.lerp(eye, sw.k);
      camera.up.set(0, 1, 0);
      if (sw.moving) lookCur.lerp(look, sw.k);
      else lookCur.copy(look);
      camera.lookAt(lookCur);
      travel.feel = 0;
      travel.boost = 0;
      const cam = camera as THREE.PerspectiveCamera;
      if (cam.fov !== 55) {
        cam.fov = 55;
        cam.updateProjectionMatrix();
      }
      (gl.domElement.closest<HTMLElement>("[role=application]") ?? gl.domElement.parentElement)?.style.setProperty("--road-speed", "0");
      (gl.domElement.closest<HTMLElement>("[role=application]") ?? gl.domElement.parentElement)?.style.setProperty("--road-boost", "0");
      const now = performance.now();
      if (Math.abs(s - last.current) > 0.25 && (now - lastAt.current > 100 || Math.abs(travel.v) < 0.3)) {
        last.current = s;
        lastAt.current = now;
        onMove(s);
      }
      return;
    }
    const cut = false;
    // Elsewhere "up" stays up - the camera never rolls over. Where the
    // road leaves the land (the corkscrew), it follows the line of the
    // ground beneath instead of the rolling road.
    const posS = s + f * 2 - b * 4 - up * 5;
    const atS = s + AHEAD + 26 - f * 2 - up * 9;
    if (road.stuntAt(posS) > 0) groundAt(road, posS, pos);
    else pointAt(road, posS, pos);
    if (road.stuntAt(atS) > 0) groundAt(road, atS, at);
    else pointAt(road, atS, at);
    eye.copy(pos).setY(pos.y + 7.5 - f * 3 - b * 0.4 + up * 6.5);
    look.copy(at).setY(at.y + 1.2 + f * 0.6);
    camera.up.set(0, 1, 0);
    // Through a banked sweep, the camera follows the traveller up the
    // side of it.
    const ride = road.rideAt(s + AHEAD);
    if (ride !== 0) {
      sideAt(road, s + AHEAD, across);
      eye.addScaledVector(across, ride * 0.7);
      eye.y += bankLift(road, s + AHEAD, ride * 0.7);
      look.addScaledVector(across, ride * 0.5);
    }
    // ON A STUNT the camera stays right behind the traveller, riding the
    // track the way the rest of the road does: back along it and out from
    // its surface. Up the speaker climb it stays upright; round the loop
    // and through the corkscrew it turns over with the track, like a
    // camera on the car behind on a coaster - so you go round with them,
    // always looking on down the road. Stop halfway and it waits; go back
    // and it goes back with them.
    const stunt = road.stunts.find((z) => tS > z.a - 25 && tS < z.a + z.len + 25);
    if (stunt) {
      const k = THREE.MathUtils.smoothstep(tS, stunt.a - 25, stunt.a) * (1 - THREE.MathUtils.smoothstep(tS, stunt.a + stunt.len, stunt.a + stunt.len + 25));
      const bs = tS - AHEAD;
      const rise = stunt.kind === "climb" ? 7.5 : 5.5;
      // (Up the skyscraper, looking further on, so over the roof the view
      // is of the sky and the city - not the road filling the screen.)
      const on = 10;
      pointAt(road, bs, sEye).addScaledVector(upAt(road, bs, across), rise);
      pointAt(road, tS + on, sLook).addScaledVector(upAt(road, tS + on, across), 1.2);
      if (stunt.kind !== "climb") {
        // The camera's up turns with the track's, blended in and out - the
        // track's up where the camera is, where the traveller is and where
        // it's looking, together: so where the road turns sharply (the
        // foot and the shoulders of the monolith) the view never looks
        // straight along its own up, and never flips.
        upAt(road, bs, across);
        offset.copy(across);
        offset.add(upAt(road, tS, across));
        offset.add(upAt(road, tS + on, across));
        camera.up.set(0, 1, 0).lerp(offset.normalize(), k).normalize();
      }
      // Blended in and out over the way in and the way out.
      offset.subVectors(eye, pos);
      eye.lerp(sEye, k);
      look.lerp(sLook, k);
      pos.subVectors(eye, offset);
    }
    // Carried along with the road as it moves, then eased toward the
    // spot - so at speed the camera keeps its place behind the traveller
    // rather than trailing far behind, and only the changes of height
    // and distance glide.
    if (carried.current) camera.position.add(moved.copy(pos).sub(prevPos));
    prevPos.copy(pos);
    carried.current = true;
    if (leaveTo) {
      pose(leaveTo, tS, eye, look);
      camera.up.set(0, 1, 0);
    }
    const sw = settle(dt);
    if (cut) camera.position.copy(eye);
    else camera.position.lerp(eye, sw.k);
    if (sw.moving) lookCur.lerp(look, sw.k);
    else lookCur.copy(look);
    camera.lookAt(lookCur);
    // At speed the road shakes the camera - harder flat out.
    if (f > 0.55 && !still) {
      const k = (f - 0.55) / 0.45;
      const t = performance.now() / 1000;
      const amp = 0.05 * k + 0.07 * b;
      camera.position.y += (Math.sin(t * 37) * 0.6 + Math.sin(t * 23.3) * 0.4) * amp;
      camera.position.x += (Math.sin(t * 29.7) * 0.6 + Math.sin(t * 51.1) * 0.4) * amp * 0.8;
    }
    // Looking around: the phone's tilt swings the view side to side and
    // lifts it toward the horizon, eased so it glides rather than jitters.
    // Only once the traveller has been completely still for half a
    // second, and eased very gently; the moment they move, it glides back
    // to straight ahead and stays there.
    const looking = stillFor.current > 0.5 && !leaveTo;
    const glide = 1 - Math.pow(looking ? 0.35 : 0.02, dt);
    yaw.current += ((looking ? travel.look.yaw : 0) - yaw.current) * glide;
    pitch.current += ((looking ? travel.look.pitch : 0) - pitch.current) * glide;
    camera.rotateY(yaw.current);
    camera.rotateX(pitch.current);
    // The view widens as you go faster and settles as you slow; the page
    // draws faint streaks past the edges from the same number.
    const cam = camera as THREE.PerspectiveCamera;
    const fov = 62 + f * 12 + b * 12;
    if (Math.abs(cam.fov - fov) > 0.05) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    (gl.domElement.closest<HTMLElement>("[role=application]") ?? gl.domElement.parentElement)?.style.setProperty("--road-speed", f.toFixed(3));
    (gl.domElement.closest<HTMLElement>("[role=application]") ?? gl.domElement.parentElement)?.style.setProperty("--road-boost", b.toFixed(3));
    // Lean into the bends with the road - more the faster you go.
    // (Up to the steep lean of the great sweeps.)
    const target = THREE.MathUtils.clamp(tiltAt(road, s + AHEAD) * (0.9 + f * 0.5), -0.85, 0.85);
    roll.current += (target - roll.current) * Math.min(1, dt * 2.5);
    camera.rotateZ(roll.current);
    // Tell the page where we are - but at speed only ten times a second,
    // not every frame: each report redraws the page's controls, and at
    // full speed that was what slowed the road down.
    const now = performance.now();
    if (Math.abs(s - last.current) > 0.25 && (now - lastAt.current > 100 || Math.abs(travel.v) < 0.3)) {
      last.current = s;
      lastAt.current = now;
      onMove(s);
    }
  });
  /* eslint-enable react-hooks/immutability */
  return null;
}

/** Which checkpoint's portal is at this point on the screen (client
 *  pixels), or null. */
export type PickPortal = (clientX: number, clientY: number) => number | null;

/** Answers PickPortal by projecting each portal onto the screen: its
 *  centre, and its radius at that distance. */
function Picker({
  road,
  pickRef,
  far = 70,
  flat = false,
}: {
  road: RoadLayout;
  pickRef: React.RefObject<PickPortal | null>;
  far?: number;
  /** The calm view's portals: lying flat on the road, three times the size. */
  flat?: boolean;
}) {
  const { camera, gl } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const p = new THREE.Vector3();
    const toP = new THREE.Vector3();
    const forward = new THREE.Vector3();
    pickRef.current = (cx, cy) => {
      const rect = gl.domElement.getBoundingClientRect();
      cam.getWorldDirection(forward);
      let best: number | null = null;
      let bestD = Infinity;
      road.stops.forEach((s, i) => {
        pointAt(road, s, p).y += flat ? PORTAL_FLAT_Y : PORTAL_Y;
        toP.subVectors(p, cam.position);
        const d = toP.length();
        // In front, near enough to be seen, not so near it has faded
        // for the traveller to pass through.
        if (toP.dot(forward) <= 0 || d > far || d < 4) return;
        const r = ((flat ? 2.5 * PORTAL_FLAT_SCALE : 2.5) / (d * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)))) * (rect.height / 2);
        p.project(cam);
        const x = rect.left + ((p.x + 1) / 2) * rect.width;
        const y = rect.top + ((1 - p.y) / 2) * rect.height;
        if (Math.hypot(cx - x, cy - y) < r * 1.15 && d < bestD) {
          best = i;
          bestD = d;
        }
      });
      return best;
    };
    return () => {
      pickRef.current = null;
    };
  }, [camera, gl, road, pickRef, far, flat]);
  return null;
}

function AdventureWorldInner({
  stops,
  phases,
  travel,
  onMove,
  onLost,
  avatar = "/lion-head.png",
  pickRef,
  limit,
  skyImage,
  active = true,
  calm = false,
  arrive = null,
  leaveTo = null,
}: {
  stops: WorldStop[];
  phases: WorldPhase[];
  /** Where the camera is and how fast it is going - owned by the page,
   *  so the controls around the canvas can move it. */
  travel: Travel;
  onMove: (s: number) => void;
  /** The browser took the graphics back (a phone short of memory): the
   *  page above rebuilds the scene. */
  onLost?: () => void;
  /** The student's own picture, on the traveller. */
  avatar?: string;
  /** Filled in with a way to ask which checkpoint's portal is under a
   *  point on the screen - the page owns the pointer (it drags the road),
   *  so taps are worked out there and asked here. */
  pickRef?: React.RefObject<PickPortal | null>;
  /** As far along the road as the traveller may go - short of the finish
   *  until every challenge is done. Past the finish when not given. */
  limit?: number;
  /** A painted sky of planets to travel under, in place of plain stars. */
  skyImage?: string;
  /** Draw frames at all - false while the road is scrolled out of view,
   *  so it costs nothing when nobody can see it. */
  active?: boolean;
  /** The calm "3D" view: no stunts or skyways, seen from high above. */
  calm?: boolean;
  /** Switching views: the view just left, or the one being switched to. */
  arrive?: ViewMode | null;
  leaveTo?: ViewMode | null;
}) {
  const road = useMemo(() => layoutRoad(stops.length, stops.map((s) => s.phase), { calm }), [stops, calm]);
  const spans = useMemo(() => phaseSpans(road, stops, phases), [road, stops, phases]);
  const finishCols = useMemo(() => spans.map((sp) => sp.col.clone()), [spans]);
  const phaseCol = useMemo(() => new Map(phases.map((p) => [p.id, new THREE.Color(p.color)])), [phases]);
  // The section the student is in; every one after it is dormant.
  const reached = reachedPhase(stops, phases);
  const trail = useMemo(
    () => [
      ribbon(road, spans, -1.5, 1.5, 0.06, (ph, o) => o.copy(ph).multiplyScalar(1.0)),
      ribbon(road, spans, -0.3, 0.3, 0.08, (ph, o) => o.copy(ph).lerp(new THREE.Color("#ffffff"), 0.35).multiplyScalar(1.7)),
      // A wide soft glow round the trail, so the road you've driven reads
      // from high up on the skyways, looking back.
      ribbon(road, spans, -3.4, 3.4, 0.055, (ph, o) => o.copy(ph).multiplyScalar(0.9)),
    ],
    [road, spans],
  );
  const colourAlong = useMemo(() => {
    const c = new THREE.Color();
    return (s: number) => colourAt(spans, s, c);
  }, [spans]);
  // A fresh colour each call, for things built once and kept.
  const colourFixed = useMemo(() => (s: number) => colourAt(spans, s, new THREE.Color()), [spans]);

  // THE POWER RING round the traveller: one colour for every section the
  // student has opened by passing challenges - green, then green and
  // cyan, and so on to all five, which glow. Earned, never driven into:
  // travelling ahead to look adds nothing. (?ring-preview on the URL
  // shows it following the road instead, to see what it will look like.)
  const powerColours = useMemo(() => phases.map((p) => new THREE.Color(p.color)), [phases]);
  // Previewed on the vercel.app address (and with ?ring-preview anywhere);
  // on speakbetter.app, only colours truly earned.
  const preview =
    typeof window !== "undefined" &&
    (new URLSearchParams(window.location.search).has("ring-preview") || window.location.hostname.endsWith(".vercel.app"));
  const powerCount = useMemo(
    () =>
      preview
        ? (s: number) => {
            let n = 1;
            spans.forEach((sp, i) => {
              if (s >= sp.from) n = i + 1;
            });
            return n;
          }
        : () => Math.max(1, reached + 1),
    [preview, spans, reached],
  );

  return (
    <Canvas
      // No filmic tone mapping: it greyed every bright colour, the
      // student's photo included. The glow comes from the bloom, not the
      // grade, so photos show as uploaded and the neon stays pure.
      flat
      // (On a phone, one pixel per pixel: the bloom and the blur each keep
      // copies of the frame, and a sharper frame is several times the
      // memory - what was running phones out of it near the end.)
      dpr={typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches ? [1, 1.75] : [1, 1]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 62, near: 0.1, far: 1200, position: [0, 3, 6] }}
      onCreated={({ scene, gl }) => {
        scene.fog = new THREE.FogExp2(LOOK.haze, 0.0038);
        // Lost graphics: say so, rather than leaving a frozen black frame.
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onLost?.();
        });
      }}
    >
      <hemisphereLight args={["#8090d0", "#05070f", LOOK.lights[0]]} />
      <ambientLight intensity={LOOK.lights[1]} />
      <directionalLight position={[40, 80, 30]} intensity={LOOK.lights[2]} color="#c8d2ff" />
      {skyImage ? <SkyDome image={skyImage} /> : <Stars />}
      <Terrain road={road} spans={spans} travel={travel} />
      <Road road={road} spans={spans} trail={trail} />
      {/* A wall at each threshold between phases - none at the start:
          you begin already in the first. */}
      {spans.slice(1).map((sp) => (
        <ColourWall key={sp.id} road={road} s={sp.from} colour={sp.color} />
      ))}
      {/* Each checkpoint's trophy beside its portal: a silhouette until
          won, so you can see what passing it earns - on the side away
          from its comment card. */}
      {stops.map((stop, i) =>
        stop.trophy ? (
          <RoadsideTrophy
            key={`t-${stop.slug}`}
            road={road}
            s={road.stops[i] + 1.5}
            side={i % 2 ? -1 : 1}
            image={stop.trophy}
            won={stop.trophyWon ?? (stop.state === "done" && (stop.score ?? 0) >= 75)}
            colour={phaseCol.get(stop.phase) ?? new THREE.Color("#ffffff")}
          />
        ) : null,
      )}
      {stops.map((stop, i) =>
        stop.comment ? (
          <RoadsideComment
            key={`c-${stop.slug}`}
            road={road}
            s={road.stops[i] + 17}
            side={i % 2 ? 1 : -1}
            name={stop.comment.name}
            body={stop.comment.body}
          />
        ) : null,
      )}
      <Fireflies road={road} spans={spans} />
      <GateSparks
        road={road}
        travel={travel}
        gates={spans.slice(1).map((sp, k) => ({ s: sp.from, from: spans[k].color, to: sp.color }))}
      />
      <Sky />
      <Bloom travel={travel} strength={LOOK.bloom} threshold={LOOK.threshold} radius={LOOK.spread} />
      <Scenery road={road} spans={spans} />
      {spans.find((sp) => sp.id === "Y") && (
        <City road={road} travel={travel} revealFrom={spans.find((sp) => sp.id === "Y")!.from + 240} />
      )}
      <Megastructures
        road={road}
        colourAt={colourFixed}
        dense={spans.find((sp) => sp.id === "Y")}
        victory={spans[spans.length - 1]?.victory}
        calm={calm}
      />
      <Traveller
        road={road}
        travel={travel}
        image={avatar}
        trail={trail}
        colourAt={colourAlong}
        powers={powerColours}
        powerCount={powerCount}
        scale={calm ? 3 : 1}
      />
      {!calm && <SpeedSparks road={road} travel={travel} colourAt={colourAlong} />}
      <SectionWeather road={road} travel={travel} spans={spans} />
      {stops.map((stop, i) => (
        <Portal
          key={stop.slug}
          road={road}
          s={road.stops[i]}
          n={i + 1}
          title={stop.title}
          state={stop.state}
          colour={phaseCol.get(stop.phase) ?? new THREE.Color("#ffffff")}
          score={stop.score}
          dormant={phases.findIndex((p) => p.id === stop.phase) > reached}
          flat={calm}
        />
      ))}
      <FinishTunnel road={road} cols={finishCols} />
      <Rig road={road} travel={travel} onMove={onMove} limit={limit ?? road.finish + 10} calm={calm} arrive={arrive} leaveTo={leaveTo} />
      {pickRef && <Picker road={road} pickRef={pickRef} far={calm ? 240 : 70} flat={calm} />}
    </Canvas>
  );
}

export { layoutRoad };

/** The world, redrawn by React only when its inputs change. The page
 *  above re-renders ten times a second as the traveller moves (to update
 *  its own controls); the scene moves itself every frame and needn't be
 *  walked through by React each of those times. */
export const AdventureWorld = memo(AdventureWorldInner);
