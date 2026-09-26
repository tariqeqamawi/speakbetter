import * as THREE from "three";

// The shape of the S.T.O.R.Y. road, in world units, shared by everything
// that stands on it - the terrain, the lit line, the checkpoints, the
// camera. One curve, so nothing can drift off the road it belongs to.
//
// The road runs away from the start along -z, wandering left and right
// and rising and falling a little, so the camera always has a bend to
// look round and a crest to come over. Everything else is placed by
// distance along the road ("s", in world units from the start), never
// by x/z, so re-tuning the wander moves the whole world together.

/** World units between one checkpoint and the next. Long enough that
 *  reaching the next one is a short journey, not a flick. */
export const SPACING = 56;
/** Road before the first checkpoint - open land to travel before the
 *  first challenge, so you set off into the world rather than arriving
 *  at a door - and after the last before the gate. */
export const LEAD_IN = 90;
export const LEAD_OUT = 60;
/** How far ahead of the camera the traveller walks. Everything that
 *  says "where you are" reads the traveller, not the camera. */
export const AHEAD = 17;
/** How far before a phase's first checkpoint its gate stands. */
export const GATE_BEFORE = 32;

export interface RoadLayout {
  curve: THREE.CatmullRomCurve3;
  /** Total length of the road, in world units. */
  length: number;
  /** Distance along the road of each checkpoint, in order. */
  stops: number[];
  /** Distance of the finish gate. */
  finish: number;
  /** How sharply the road is turning at a distance, radians per unit -
   *  what the camera banks into, and what keeps the land from folding. */
  bendAt: (s: number) => number;
  /** How much the camera may bank at a distance: only where the story
   *  wants the motion - the curves of O and the plunge of R. */
  bankAt: (s: number) => number;
}

// THE ROAD IS DRIVEN, NOT DRAWN. It is built the way a car travels:
// from a heading and a slope at every step, so each phase can shape the
// journey through it:
//   S  gentle swells and easy bends - setting out
//   T  a long climb, up through the terraces
//   O  big sweeping S-curves, banking into each one
//   R  the road falls away - a steep plunge into the depths
//   Y  level again, out through a pass between the last mountains
//      onto the plain, where the city is waiting
// Built step by step, its length is exactly the distance travelled, so
// a checkpoint SPACING along the road is SPACING along it.

/** Where each phase runs along the road, from which checkpoints are in
 *  it: boundaries halfway between the last of one and first of the next. */
export function phaseRanges(stops: number[], phaseOf: string[], finish: number) {
  const ids = [...new Set(phaseOf)];
  return ids.map((id, k) => {
    const first = phaseOf.indexOf(id);
    const last = phaseOf.lastIndexOf(id);
    const prevLast = k > 0 ? phaseOf.lastIndexOf(ids[k - 1]) : -1;
    const nextFirst = k < ids.length - 1 ? phaseOf.indexOf(ids[k + 1]) : -1;
    const from = prevLast < 0 ? 0 : (stops[prevLast] + stops[first]) / 2;
    const to = nextFirst < 0 ? finish + 400 : (stops[last] + stops[nextFirst]) / 2;
    return { id, from, to };
  });
}

export function layoutRoad(checkpoints: number, phaseOf: string[] = []): RoadLayout {
  const stops = Array.from({ length: checkpoints }, (_, i) => LEAD_IN + i * SPACING);
  const finish = LEAD_IN + (checkpoints - 1) * SPACING + LEAD_OUT;
  const reach = finish + 80;
  const ranges = phaseRanges(stops, phaseOf, finish);
  /** How much of phase `id` is under distance s: 1 inside it, easing
   *  in and out over a stretch either side of its boundaries. */
  const weight = (id: string, s: number) => {
    const r = ranges.find((x) => x.id === id);
    if (!r) return 0;
    const EASE = id === "R" ? 40 : 26;
    return THREE.MathUtils.smoothstep(s, r.from - EASE, r.from + EASE) * (1 - THREE.MathUtils.smoothstep(s, r.to - EASE, r.to + EASE));
  };
  const from = (id: string) => ranges.find((x) => x.id === id)?.from ?? 0;

  const heading = (s: number) => {
    const gentle = 0.23 * Math.sin(s / 70) + 0.15 * Math.sin(s / 27);
    const wO = weight("O", s);
    const sweep = 0.62 * Math.sin((s - from("O")) / 58);
    return gentle * (1 - wO) + sweep * wO;
  };
  const slope = (s: number) => {
    const swell = (3.2 / 95) * Math.cos(s / 95) + (0.9 / 37) * Math.cos(s / 37);
    const wT = weight("T", s);
    const wO = weight("O", s);
    const wR = weight("R", s);
    const wY = weight("Y", s);
    const rest = Math.max(0, 1 - wT - wR - wY);
    // Y: over the mountains - up one and down it, up the next and down
    // it - before the plain.
    const peaks = 0.5 * Math.sin(((s - from("Y")) / 100) * Math.PI * 2);
    return swell * rest * (1 - wO * 0.6) + 0.17 * wT - 0.9 * wR + peaks * wY;
  };

  const pts: THREE.Vector3[] = [];
  const DS = 3;
  let x = 0;
  let y = 0;
  let z = 0;
  for (let s = 0; s <= reach; s += DS) {
    pts.push(new THREE.Vector3(x, y, z));
    const h = heading(s);
    const m = slope(s);
    // A 3D step of DS, so the length along the road is the distance.
    const flat = DS / Math.sqrt(1 + m * m);
    x += Math.sin(h) * flat;
    z -= Math.cos(h) * flat;
    y += m * flat;
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  curve.arcLengthDivisions = 3000;
  const length = curve.getLength();
  const bendAt = (s: number) => (heading(s + 4) - heading(s - 4)) / 8;
  const bankAt = (s: number) => Math.min(1, weight("O", s) + weight("R", s));
  return { curve, length, stops, finish, bendAt, bankAt };
}

const tmpT = new THREE.Vector3();

/** Point on the road at distance s. */
export function pointAt(road: RoadLayout, s: number, out = new THREE.Vector3()): THREE.Vector3 {
  return road.curve.getPointAt(THREE.MathUtils.clamp(s / road.length, 0, 1), out);
}

/** The road's sideways direction at distance s (flat, unit length) -
 *  "right" for a traveller facing along the road. */
export function sideAt(road: RoadLayout, s: number, out = new THREE.Vector3()): THREE.Vector3 {
  road.curve.getTangentAt(THREE.MathUtils.clamp(s / road.length, 0, 1), tmpT);
  return out.set(-tmpT.z, 0, tmpT.x).normalize();
}

/** Small, fast, deterministic value noise - the hills. Not a library:
 *  it only has to look like land, and it has to look the same every
 *  time somebody opens the page. */
function hash(x: number, y: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
}
function smooth(t: number) {
  return t * t * (3 - 2 * t);
}
export function noise(x: number, y: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  const u = smooth(xf), v = smooth(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function hills(x: number, y: number): number {
  return noise(x * 0.02, y * 0.02) * 0.6 + noise(x * 0.05, y * 0.05) * 0.3 + noise(x * 0.13, y * 0.13) * 0.1;
}

/** Where the traveller is on the road and how fast they are moving.
 *
 *  A small object that moves itself, shared by the controls around the
 *  canvas (which push it) and the camera inside it (which steps it each
 *  frame) - so neither has to reach into the other. */
export class Travel {
  s: number;
  v = 0;
  target: number | null = null;
  /** Going through a portal: which one, and since when (ms). While set,
   *  the camera and the traveller dive into it and nothing else moves. */
  portal: { s: number; since: number } | null = null;
  constructor(start: number) {
    this.s = start;
  }
  /** A nudge from a drag, the wheel or a key. */
  push(dv: number, blend = 1) {
    this.target = null;
    this.v = this.v * blend + dv;
  }
  /** Glide to a distance - a jump. */
  goTo(s: number) {
    this.target = s;
    this.v = 0;
  }
  /** Be at a distance, at once - still, and out of any portal. */
  jump(s: number) {
    this.s = s;
    this.v = 0;
    this.target = null;
    this.portal = null;
  }
  /** Be at a distance, keeping what else is going on (the demo's glide). */
  place(s: number) {
    this.s = s;
  }
  enterPortal(s: number) {
    this.portal = { s, since: performance.now() };
    this.v = 0;
    this.target = null;
  }
  /** One frame: glide, or coast with friction. */
  step(k: number, max: number) {
    if (this.portal) return;
    if (this.target !== null) {
      this.s += (this.target - this.s) * (1 - Math.pow(0.9, k));
      if (Math.abs(this.target - this.s) < 0.05) this.target = null;
    } else {
      this.s += this.v * k;
      this.v *= Math.pow(0.9, k);
    }
    this.s = Math.min(max, Math.max(0, this.s));
  }
}

/** A seeded random number generator, so the same sky every time. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Where Coach speaks, by distance: at the very start, and twice further
 *  on. The page plays his line as the traveller reaches each. */
export function coachSpots(road: RoadLayout): number[] {
  const n = road.stops.length;
  return [40, road.stops[Math.round(n * 0.4)] + 10, road.stops[Math.round(n * 0.75)] + 10];
}

/** How far through S.T.O.R.Y. the student has really got: the index of
 *  the furthest section they have opened. Sections after it are only
 *  previewed. */
export function reachedPhase(stops: { state: string; phase: string }[], phases: { id: string }[]): number {
  // The furthest section with a challenge open or passed - challenges in
  // an open section can be taken in any order, so it is not simply the
  // section of the first one not yet passed.
  let furthest = 0;
  for (const st of stops) {
    if (st.state !== "here" && st.state !== "done") continue;
    furthest = Math.max(furthest, phases.findIndex((p) => p.id === st.phase));
  }
  return furthest;
}
