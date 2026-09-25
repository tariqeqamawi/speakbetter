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
/** Road before the first checkpoint, and after the last before the gate. */
export const LEAD_IN = 26;
export const LEAD_OUT = 60;
/** How far ahead of the camera the traveller walks. Everything that
 *  says "where you are" reads the traveller, not the camera. */
export const AHEAD = 17;
/** How far before a phase's first checkpoint its gate stands. */
export const GATE_BEFORE = 17;

/** Height of the road itself: long, low swells. */
export function roadRise(z: number): number {
  return Math.sin(z / 95) * 3.2 + Math.sin(z / 37) * 0.9;
}

/** The road's wander left and right. Gentle in world space - a few
 *  units reads as a real bend once it is in perspective. */
export function roadWander(z: number): number {
  return Math.sin(z / 70) * 16 + Math.sin(z / 27) * 4;
}

export interface RoadLayout {
  curve: THREE.CatmullRomCurve3;
  /** Total length of the road, in world units. */
  length: number;
  /** Distance along the road of each checkpoint, in order. */
  stops: number[];
  /** Distance of the finish gate. */
  finish: number;
}

export function layoutRoad(checkpoints: number): RoadLayout {
  const reach = LEAD_IN + (checkpoints - 1) * SPACING + LEAD_OUT + 60;
  const pts: THREE.Vector3[] = [];
  // Sampled densely enough that arc length along the curve and distance
  // along -z stay close - so SPACING means what it says.
  for (let z = 0; z <= reach; z += 6) pts.push(new THREE.Vector3(roadWander(z), roadRise(z), -z));
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  curve.arcLengthDivisions = 2000;
  const length = curve.getLength();
  const stops = Array.from({ length: checkpoints }, (_, i) => LEAD_IN + i * SPACING);
  const finish = LEAD_IN + (checkpoints - 1) * SPACING + LEAD_OUT;
  return { curve, length, stops, finish };
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

/** Where Coach stands at the roadside, by distance: near the start, and
 *  twice further on. Shared by the world (which draws him) and the page
 *  (which plays his line as the traveller comes level). */
export function coachSpots(road: RoadLayout): number[] {
  const n = road.stops.length;
  return [road.stops[0] - 6, road.stops[Math.round(n * 0.4)] + 10, road.stops[Math.round(n * 0.75)] + 10];
}
