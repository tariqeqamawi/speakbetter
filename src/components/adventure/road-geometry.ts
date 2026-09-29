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
export const SPACING = 224;
/** Road before the first checkpoint - open land to travel before the
 *  first challenge, so you set off into the world rather than arriving
 *  at a door - and after the last before the gate. */
export const LEAD_IN = 220;
/** After the last challenge: the victory stretch - a dense run of towers
 *  lit in every section's colour - and then the finish. */
export const LEAD_OUT = 1150;
/** After the skyscraper: the victory stretch, run up at mid-height through
 *  the city of every colour, to the finish. */
export const VICTORY_LEN = 2200;
/** Where the victory stretch begins, after the last challenge. */
export const VICTORY_AFTER = 60;
/** How far ahead of the camera the traveller walks. Everything that
 *  says "where you are" reads the traveller, not the camera. */
export const AHEAD = 17;

/** Half the road's width - wide, like a racing track, so there is room
 *  to sweep down it. */
export const ROAD_HALF = 4.4;

/** How far the road leans into its bend at s, in radians - a little
 *  everywhere, most in O's sweeps and R's plunge. Positive when the road
 *  turns right (its left edge lifted). */
export function tiltAt(road: RoadLayout, s: number): number {
  const lean = Math.max(-0.22, Math.min(0.22, road.bendAt(s) * 30));
  return (lean * (0.4 + 0.6 * road.bankAt(s)) + road.sweepTilt(s)) * (1 - road.flatAt(s)) * (1 - road.stuntAt(s));
}

/** How much higher than the road's middle a point d across it sits, once
 *  the road leans into its bend (d to the right is positive). */
export function bankLift(road: RoadLayout, s: number, d: number): number {
  return -d * tiltAt(road, s);
}
/** How far before a phase's first checkpoint its gate stands. */
export const GATE_BEFORE = 80;

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
  /** The great banked sweeps at each change of colour: extra lean, in
   *  radians, on top of the ordinary lean into a bend. */
  sweepTilt: (s: number) => number;
  /** How far across the road the traveller rides at s - up the high
   *  side of a banked sweep and back to the middle. */
  rideAt: (s: number) => number;
  /** 1 where the road runs flat and level (the auditorium), 0 elsewhere. */
  flatAt: (s: number) => number;
  /** The loop-the-loop and the corkscrew. */
  stunts: Stunt[];
  /** 1 inside a stunt (easing in and out), 0 elsewhere. */
  stuntAt: (s: number) => number;
  /** The road's frame at each sample, DS apart along it: its flat side
   *  (the heading's), its rolled side and its up (both leaning with the
   *  loop and the corkscrew), and the ground beneath it. */
  frames: { ds: number; side: Float32Array; rside: Float32Array; up: Float32Array; ground: Float32Array };
  /** Where the road runs high above the land on pylons, and how high. */
  skyways: { a: number; b: number; h: number }[];
  liftAt: (s: number) => number;
}

/** A stretch where the road leaves the ground: a vertical loop, or a
 *  corkscrew barrel roll over a gap in the land. */
export interface Stunt {
  kind: "loop" | "corkscrew" | "climb" | "tower";
  /** Where it starts, and its length along the road. */
  a: number;
  len: number;
}

type V3 = [number, number, number];
function norm(v: V3): V3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}
function cross(a: V3, b: V3): V3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** A stunt's shape in its own frame - forward, side, up from where it
 *  starts - sampled by distance along it: the road's point, its rolled
 *  side and up, and the ground's point beneath. */
/** The speaker climb's size: the flat run in, the climb, the height it
 *  reaches between the two speaker stacks, the level run across between
 *  them, and the way back down. */
export const CLIMB = { LEAD: 12, UP: 72, H: 46, TOP: 46, DOWN: 90 };
/** THE SKYSCRAPER at the end of Y: how tall it is, the length of its roof,
 *  the height the road comes down to on the far side, and how far along
 *  (from where the stunt starts) its near and far faces stand. */
export const TOWER = { H: 190, TOP: 26, MID: 58, NEAR: 40, FAR: 98 };
/** The city weave: how hard the road swings (radians), and how long each
 *  swing is (a full left-and-right every 2*pi*K along the road). */
export const WEAVE = { A: 0.72, K: 30 };
/** The loop's size: its radius, how far it drifts forward, and sideways. */
export const LOOP = { R: 40, D: 96, W: 18 };

function stuntShape(kind: Stunt["kind"]) {
  const N = 2400;
  const pos: V3[] = [];
  const ground: [number, number][] = [];
  const upRaw: V3[] = [];
  // THE SPEAKER CLIMB: up a steep ramp between two great speaker stacks
  // (monuments.tsx), level across between them near their tops, and
  // down a long slope on the far side. (Forward, side, up.)
  const climb =
    kind === "tower"
      ? (() => {
          // Up the near face of the skyscraper, over its roof, straight
          // down the far face - gathering speed - and out level at
          // mid-height. (Forward, side, up.)
          const { H, TOP, MID } = TOWER;
          const pts: THREE.Vector3[] = [];
          const arc = (cx: number, cz: number, r: number, a0: number, a1: number) => {
            for (let k = 1; k <= 8; k++) {
              const a = a0 + ((a1 - a0) * k) / 8;
              pts.push(new THREE.Vector3(cx + r * Math.cos(a), 0, cz + r * Math.sin(a)));
            }
          };
          for (let x = 0; x <= 16; x += 4) pts.push(new THREE.Vector3(x, 0, 0));
          arc(16, 24, 24, -Math.PI / 2, 0);
          for (let z = 30; z <= H - 22; z += 6) pts.push(new THREE.Vector3(40, 0, z));
          arc(56, H - 16, 16, Math.PI, Math.PI / 2);
          for (let x = 60; x <= 56 + TOP - 4; x += 4) pts.push(new THREE.Vector3(x, 0, H));
          arc(56 + TOP, H - 16, 16, Math.PI / 2, 0);
          for (let z = H - 22; z >= MID + 30; z -= 6) pts.push(new THREE.Vector3(98, 0, z));
          arc(122, MID + 24, 24, Math.PI, 1.5 * Math.PI);
          for (let x = 126; x <= 160; x += 4) pts.push(new THREE.Vector3(x, 0, MID));
          return new THREE.CatmullRomCurve3(pts, false, "centripetal");
        })()
      : kind === "climb"
      ? (() => {
          const { LEAD, UP, H, TOP, DOWN } = CLIMB;
          const pts: THREE.Vector3[] = [];
          const ease = (k: number) => THREE.MathUtils.smootherstep(k, 0, 1);
          for (let x = 0; x < LEAD; x += 3) pts.push(new THREE.Vector3(x, 0, 0));
          for (let x = 0; x < UP; x += 3) pts.push(new THREE.Vector3(LEAD + x, 0, H * ease(x / UP)));
          for (let x = 0; x < TOP; x += 3) pts.push(new THREE.Vector3(LEAD + UP + x, 0, H));
          for (let x = 0; x <= DOWN; x += 3) pts.push(new THREE.Vector3(LEAD + UP + TOP + x, 0, H * (1 - ease(x / DOWN))));
          const xe = LEAD + UP + TOP + DOWN;
          for (let x = 3; x <= 18; x += 3) pts.push(new THREE.Vector3(xe + x, 0, 0));
          return new THREE.CatmullRomCurve3(pts, false, "centripetal");
        })()
      : null;
  for (let k = 0; k <= N; k++) {
    const v = k / N;
    if (climb) {
      const p = climb.getPoint(v);
      const t = climb.getTangent(v);
      pos.push([p.x, p.y, p.z]);
      ground.push([p.x, 0]);
      upRaw.push([-t.z, 0, t.x]);
    } else if (kind === "loop") {
      // Up and over, upside down at the top, down and out a road's width
      // to the side - drifting forward a little so it opens like a real
      // coaster loop.
      const { R, D, W } = LOOP;
      const th = v * Math.PI * 2;
      const lat = W * THREE.MathUtils.smootherstep(v, 0, 1);
      pos.push([R * Math.sin(th) + D * v, lat, R * (1 - Math.cos(th))]);
      ground.push([D * v, lat]);
      upRaw.push([-Math.sin(th), 0, Math.cos(th)]);
    } else {
      // A barrel roll around a line above the road: out over the gap,
      // all the way round, and down onto the far side.
      // One full roll, long and slow, over a wide gap.
      const B = 170;
      const Rc = 11;
      const ph = Math.PI * 2 * THREE.MathUtils.smootherstep(v, 0, 1);
      pos.push([B * v, Rc * Math.sin(ph), Rc * (1 - Math.cos(ph))]);
      ground.push([B * v, 0]);
      upRaw.push([0, -Math.sin(ph), Math.cos(ph)]);
    }
  }
  const arc = [0];
  for (let k = 1; k <= N; k++)
    arc.push(arc[k - 1] + Math.hypot(pos[k][0] - pos[k - 1][0], pos[k][1] - pos[k - 1][1], pos[k][2] - pos[k - 1][2]));
  const L = arc[N];
  const at = (d: number) => {
    let lo = 0;
    let hi = N;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (arc[mid] <= d) lo = mid;
      else hi = mid;
    }
    const t = arc[hi] > arc[lo] ? (d - arc[lo]) / (arc[hi] - arc[lo]) : 0;
    const mix = (a: number[], b: number[]) => a.map((x, i) => x + (b[i] - x) * t);
    const p = mix(pos[lo], pos[hi]) as V3;
    const tan = norm([pos[hi][0] - pos[lo][0], pos[hi][1] - pos[lo][1], pos[hi][2] - pos[lo][2]]);
    const ur = mix(upRaw[lo], upRaw[hi]) as V3;
    const dot = ur[0] * tan[0] + ur[1] * tan[1] + ur[2] * tan[2];
    const up = norm([ur[0] - dot * tan[0], ur[1] - dot * tan[1], ur[2] - dot * tan[2]]);
    // (Forward x up = side, as on the flat.)
    const side = norm(cross(tan, up));
    const g = mix(ground[lo], ground[hi]) as [number, number];
    return { p, side, up, g };
  };
  return { L, at };
}

/** Stretch i of the road: between checkpoint i-1 (or the start) and
 *  checkpoint i (or the finish). Every sixth, from the sixth, ends in the
 *  stage and the auditorium (megastructures.tsx, structurePlan) - where
 *  the road runs flat. */
export function venueStretch(i: number): boolean {
  return i % 3 === 2 && i % 6 !== 2;
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

/** How much longer the road is than its first design: the land between
 *  challenges doubled, because travelling it is a pleasure - the bends,
 *  swells and the plunge stretched to match rather than repeated. */
const STRETCH = 4;

/** The calm "3D" view's road: no stunts, no skyways, no dips - the same
 *  land, gentler, seen from above like a map. */
export interface RoadOptions {
  calm?: boolean;
}

export function layoutRoad(checkpoints: number, phaseOf: string[] = [], opts: RoadOptions = {}): RoadLayout {
  const calm = Boolean(opts.calm);
  // Room for the stunts: the stretch before the first checkpoint of Y
  // (the corkscrew, the way into the finale) and one in the middle of O
  // (the loop) are made longer.
  const yFirstI = phaseOf.indexOf("Y");
  const oIdx = phaseOf.map((ph, i) => (ph === "O" && phaseOf[i - 1] === "O" ? i : -1)).filter((i) => i > 0 && !venueStretch(i));
  const loopI = oIdx.length && !calm ? oIdx[Math.floor(oIdx.length / 2)] : -1;
  const EXTRA: Record<number, number> = {};
  if (yFirstI > 0 && !calm) EXTRA[yFirstI] = 200;
  if (loopI > 0) EXTRA[loopI] = 270;
  // The speaker climb: the first stretch within T (kept clear for it).
  const climbI = calm ? -1 : phaseOf.findIndex((ph, i) => i > 0 && ph === "T" && phaseOf[i - 1] === "T" && i % 2 === 1 && !venueStretch(i));
  if (climbI > 0) EXTRA[climbI] = 260;
  // The wave skyway through the city: the last stretch of Y, into the
  // last challenge - a long ride of its own, weaving round the giant
  // mics and headphones and through the towers, then sloping gently down
  // to the last portal and on into the victory stretch.
  // (The last one that isn't the stage and auditorium's stretch.)
  let waveI = -1;
  for (let i = checkpoints - 1; i > yFirstI && yFirstI > 0 && !calm; i--)
    if (phaseOf[i] === "Y" && phaseOf[i - 1] === "Y" && !venueStretch(i)) {
      waveI = i;
      break;
    }
  if (waveI > 0) EXTRA[waveI] = 640;
  const stops: number[] = [];
  for (let i = 0, at = LEAD_IN; i < checkpoints; i++) {
    at += i > 0 ? SPACING + (EXTRA[i] ?? 0) : 0;
    stops.push(at);
  }
  // After the last challenge: the skyscraper, and the long victory run
  // at mid-height beyond it (not in the calm view, which keeps to the old
  // stretch of land).
  const towerShape = calm || checkpoints < 2 ? null : stuntShape("tower");
  const TOWER_AFTER = 36;
  const finish = stops[checkpoints - 1] + (towerShape ? TOWER_AFTER + towerShape.L + VICTORY_LEN : LEAD_OUT);
  const reach = finish + 80;
  const ranges = phaseRanges(stops, phaseOf, finish);
  /** How much of phase `id` is under distance s: 1 inside it, easing
   *  in and out over a stretch either side of its boundaries. */
  const weight = (id: string, s: number) => {
    const r = ranges.find((x) => x.id === id);
    if (!r) return 0;
    const EASE = (id === "R" ? 40 : 26) * STRETCH;
    return THREE.MathUtils.smoothstep(s, r.from - EASE, r.from + EASE) * (1 - THREE.MathUtils.smoothstep(s, r.to - EASE, r.to + EASE));
  };
  const from = (id: string) => ranges.find((x) => x.id === id)?.from ?? 0;

  // THE AUDITORIUM runs flat and level: from just before the stage to the
  // checkpoint after the seats.
  const marks = [0, ...stops, finish];
  const flats: { a: number; b: number }[] = [];
  for (let i = 0; i < marks.length - 1; i++)
    if (venueStretch(i)) flats.push({ a: (marks[i] + marks[i + 1]) / 2 - 30, b: marks[i + 1] + 5 });
  const flatAt = (s: number) =>
    flats.reduce(
      (m, f) => Math.max(m, THREE.MathUtils.smoothstep(s, f.a - 30, f.a) * (1 - THREE.MathUtils.smoothstep(s, f.b, f.b + 30))),
      0,
    );

  // THE GREAT SWEEPS: at each change of colour the road throws itself
  // into a big banked turn - left at one, right at the next - leaning
  // hard, the traveller riding up the high side of it and back down.
  // Placed in the open land before each new colour's gate, clear of the
  // checkpoints either side.
  const gates: number[] = [];
  for (let i = 1; i < stops.length; i++) if (phaseOf[i] && phaseOf[i] !== phaseOf[i - 1]) gates.push(stops[i] - GATE_BEFORE);
  const SWEEP_A = 1.15; // how far it turns, radians

  // THE STUNTS. A loop-the-loop in the middle of O's sweeping curves, and
  // at the way into R - Reveal Deeper Truths - the road runs off a cliff,
  // corkscrews over a gap in the land and lands on the red side.
  const DS = 3;
  const stunts: (Stunt & { shape: ReturnType<typeof stuntShape> })[] = [];
  if (loopI > 0) {
    const shape = stuntShape("loop");
    const mid = (marks[loopI] + marks[loopI + 1]) / 2;
    stunts.push({ kind: "loop", a: Math.round((mid - shape.L / 2) / DS) * DS, len: shape.L, shape });
  }
  if (climbI > 0) {
    const shape = stuntShape("climb");
    const mid = (marks[climbI] + marks[climbI + 1]) / 2;
    stunts.push({ kind: "climb", a: Math.round((mid - shape.L / 2) / DS) * DS, len: shape.L, shape });
  }
  const corkGate = yFirstI > 0 ? stops[yFirstI] - GATE_BEFORE : -1;
  if (yFirstI > 0 && !calm) {
    const shape = stuntShape("corkscrew");
    stunts.push({ kind: "corkscrew", a: Math.round((stops[yFirstI] - GATE_BEFORE - 12 - shape.L) / DS) * DS, len: shape.L, shape });
  }
  const towerAt = towerShape ? Math.round((stops[checkpoints - 1] + TOWER_AFTER) / DS) * DS : -1;
  if (towerShape) stunts.push({ kind: "tower", a: towerAt, len: towerShape.L, shape: towerShape });
  stunts.sort((p, q) => p.a - q.a);
  // The victory city is level ground.
  if (towerShape) flats.push({ a: towerAt, b: reach + 200 });
  // Level going in and coming out.
  for (const z of stunts) flats.push({ a: z.a, b: z.a + z.len });
  const stuntAt = (s: number) =>
    stunts.reduce(
      (m, z) => Math.max(m, THREE.MathUtils.smoothstep(s, z.a - 15, z.a) * (1 - THREE.MathUtils.smoothstep(s, z.a + z.len, z.a + z.len + 15))),
      0,
    );

  // SKYWAYS: now and then the road leaves the ground altogether - lifted
  // high on pylons, running between the towers, the land far below - and
  // comes back down before the next challenge. Through T, and above all
  // through Y, into the city.
  const skyways: { a: number; b: number; h: number; wave?: boolean }[] = [];
  for (let i = 1; i < stops.length && !calm; i++) {
    const ph = phaseOf[i];
    if (ph !== phaseOf[i - 1] || venueStretch(i) || i === yFirstI || i === loopI || i === climbI) continue;
    if ((ph === "T" && i % 2 === 1) || ph === "Y" || (ph === "S" && i === 2))
      skyways.push({ a: stops[i - 1] + 30, b: stops[i] - 30, h: ph === "Y" ? 52 : ph === "T" ? 36 : 26, wave: i === waveI });
  }
  // (The weave comes down slowly: a long, gentle slope, not a drop.)
  const rampOut = (w: { a: number; b: number; wave?: boolean }) => (w.wave ? 170 : Math.min(70, (w.b - w.a) / 2.5));
  // Off the skyscraper at mid-height, and on at that height all the way
  // to the finish, floating through the victory city.
  const victorySky = towerShape ? { a: towerAt + towerShape.L, b: reach + 1, h: TOWER.MID } : null;
  const liftAt = (s: number) =>
    victorySky && s >= victorySky.a
      ? victorySky.h
      : skyways.reduce((m, w) => {
      if (s <= w.a || s >= w.b) return m;
      const ramp = Math.min(70, (w.b - w.a) / 2.5);
      const env = THREE.MathUtils.smootherstep(s, w.a, w.a + ramp) * (1 - THREE.MathUtils.smoothstep(s, w.b - rampOut(w), w.b));
      return Math.max(m, w.h * env);
    }, 0);

  // (No banked sweep where the corkscrew is.)
  const sweeps = gates
    .filter((g) => g !== corkGate)
    // Long - from just past the last checkpoint of one colour to just
    // short of the first of the next.
    .map((g, k) => ({ a: g - 135, b: g + 52, dir: k % 2 ? 1 : -1 }));
  /** 0 before a sweep, 1 after it, easing through it. */
  const sweepTurn = (s: number) => sweeps.reduce((h, w) => h + w.dir * SWEEP_A * THREE.MathUtils.smootherstep(s, w.a, w.b), 0);
  /** How deep into its sweep s is: 0 at the ends, 1 at the middle. */
  const sweepShape = (s: number) =>
    sweeps.reduce((m, w) => (s > w.a && s < w.b ? Math.sin((Math.PI * (s - w.a)) / (w.b - w.a)) * w.dir : m), 0);
  const sweepTilt = (s: number) => sweepShape(s) * 0.72;
  const rideAt = (s: number) => {
    const k = sweepShape(s);
    // Up the high side: a turn to the right lifts the left edge.
    return -Math.sign(k) * Math.pow(Math.abs(k), 1.5) * (ROAD_HALF - 1.2);
  };

  // THE CITY WEAVE: on the long skyway through Y the road swings left and
  // right between the towers - banking hard into each turn - rather than
  // going up and down.
  const weaveSky = skyways.find((w) => w.wave);
  // Only where the skyway has finished climbing and before it comes down:
  // the weave is all left and right, the road level through it.
  const weaveRamp = weaveSky ? Math.min(70, (weaveSky.b - weaveSky.a) / 2.5) : 0;
  const weaveOut = weaveSky ? rampOut(weaveSky) : 0;
  const weaveAt = (s: number) =>
    weaveSky
      ? THREE.MathUtils.smoothstep(s, weaveSky.a + weaveRamp + 5, weaveSky.a + weaveRamp + 45) *
        (1 - THREE.MathUtils.smoothstep(s, weaveSky.b - weaveOut - 45, weaveSky.b - weaveOut - 5))
      : 0;
  const weave = (s: number) => (weaveSky ? WEAVE.A * Math.sin((s - weaveSky.a) / WEAVE.K) * weaveAt(s) : 0);
  const heading = (s: number) => {
    // The same bends, drawn out over the longer road.
    const u = s / STRETCH;
    const gentle = 0.23 * Math.sin(u / 70) + 0.15 * Math.sin(u / 27);
    const wO = weight("O", s);
    const sweep = 0.62 * Math.sin((s - from("O")) / (58 * STRETCH));
    return gentle * (1 - wO) + sweep * wO + sweepTurn(s) + weave(s);
  };
  const slope = (s: number) => {
    // Drawn out the same way, and gentler for it: the hills a little
    // higher than they were (x1.3), not twice as high.
    const u = s / STRETCH;
    const k = 1.8 / STRETCH;
    const swell = ((3.2 / 95) * Math.cos(u / 95) + (0.9 / 37) * Math.cos(u / 37)) * k * STRETCH;
    const wT = weight("T", s);
    const wO = weight("O", s);
    const wR = weight("R", s);
    const wY = weight("Y", s);
    const rest = Math.max(0, 1 - wT - wR - wY);
    // Y: over the mountains - up one and down it, up the next and down
    // it - before the plain.
    // (Y's mountains are gone: the city is flat, and the road weaves
    // through it on a skyway instead.)
    const peaks = 0;
    // DIPS, the way Extreme-G's tracks dropped away and climbed: now and
    // then the road falls into a hollow and shoots up the far side to the
    // horizon. They come in runs (the slow envelope), with calm between,
    // and leave R's plunge and Y's peaks to themselves.
    // Deep and often - a rollercoaster: plunges into hollows and climbs
    // that lift you to the horizon, a short calm between runs.
    const run = 0.35 + 0.65 * Math.max(0, Math.sin(s / 330 + 1.2));
    const dips = calm ? 0 : 0.21 * Math.sin(s / 42) * run * (1 - wR) * (1 - wY);
    return (swell * rest * (1 - wO * 0.6) + (0.17 * wT - 0.9 * wR + peaks * wY) * k + dips) * (1 - flatAt(s));
  };

  // Through a stunt the heading holds where it went in, and afterwards
  // carries on from there - no jump where the road comes back down.
  const deltas = stunts.map((z) => heading(z.a + z.len) - heading(z.a));
  const headingEff = (s: number) => {
    let shift = 0;
    for (let k = 0; k < stunts.length; k++) {
      const z = stunts[k];
      if (s >= z.a + z.len) shift += deltas[k];
      else if (s >= z.a) return heading(z.a) - shift;
    }
    return heading(s) - shift;
  };

  const pts: THREE.Vector3[] = [];
  const n = Math.floor(reach / DS) + 1;
  const fSide = new Float32Array(n * 3);
  const fRside = new Float32Array(n * 3);
  const fUp = new Float32Array(n * 3);
  const fGround = new Float32Array(n * 3);
  let x = 0;
  let y = 0;
  let z = 0;
  let entry: { x: number; y: number; z: number; h: number } | null = null;
  for (let i = 0; i < n; i++) {
    const s = i * DS;
    const st = stunts.find((q) => s >= q.a && s < q.a + q.len);
    if (st) {
      // In a stunt: placed from where it began, in its own shape.
      if (!entry) entry = { x, y, z, h: headingEff(st.a) };
      const F: V3 = [Math.sin(entry.h), 0, -Math.cos(entry.h)];
      const S: V3 = [Math.cos(entry.h), 0, Math.sin(entry.h)];
      const w = (l: V3 | number[]): V3 => [F[0] * l[0] + S[0] * l[1], l[2], F[2] * l[0] + S[2] * l[1]];
      const q = st.shape.at(s - st.a);
      const off = w(q.p);
      pts.push(new THREE.Vector3(entry.x + off[0], entry.y + off[1], entry.z + off[2]));
      fSide.set(S, i * 3);
      fRside.set(w(q.side), i * 3);
      fUp.set(w(q.up), i * 3);
      const g = w([q.g[0], q.g[1], 0]);
      fGround.set([entry.x + g[0], entry.y, entry.z + g[2]], i * 3);
      // Leaving it next step: carry on from where it comes out.
      if (s + DS >= st.a + st.len) {
        const out = st.shape.at(st.len);
        const o = w(out.p);
        const rest = s + DS - (st.a + st.len);
        x = entry.x + o[0] + F[0] * rest;
        // (Off the skyscraper the ground stays where it was; the road
        // stays up at mid-height on the victory skyway.)
        y = st.kind === "tower" ? entry.y : entry.y + o[1];
        z = entry.z + o[2] + F[2] * rest;
        entry = null;
      }
      continue;
    }
    pts.push(new THREE.Vector3(x, y + liftAt(s), z));
    const h = headingEff(s);
    fSide.set([Math.cos(h), 0, Math.sin(h)], i * 3);
    fRside.set([Math.cos(h), 0, Math.sin(h)], i * 3);
    fUp.set([0, 1, 0], i * 3);
    fGround.set([x, y, z], i * 3);
    const m = slope(s);
    // A 3D step of DS, so the length along the road is the distance.
    const flat = DS / Math.sqrt(1 + m * m);
    x += Math.sin(h) * flat;
    z -= Math.cos(h) * flat;
    y += m * flat;
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  curve.arcLengthDivisions = 6000;
  const length = curve.getLength();
  const bendAt = (s: number) => (headingEff(s + 4) - headingEff(s - 4)) / 8;
  const bankAt = (s: number) => Math.min(1, weight("O", s) + weight("R", s) + weaveAt(s) * 0.6);
  return {
    curve,
    length,
    stops,
    finish,
    bendAt,
    bankAt,
    sweepTilt,
    rideAt,
    flatAt,
    stunts: stunts.map(({ kind, a, len }) => ({ kind, a, len })),
    stuntAt,
    skyways,
    liftAt,
    frames: { ds: DS, side: fSide, rside: fRside, up: fUp, ground: fGround },
  };
}


/** Point on the road at distance s. */
export function pointAt(road: RoadLayout, s: number, out = new THREE.Vector3()): THREE.Vector3 {
  return road.curve.getPointAt(THREE.MathUtils.clamp(s / road.length, 0, 1), out);
}

/** One of the road's per-sample frames, at distance s. */
function frameAt(road: RoadLayout, arr: Float32Array, s: number, out: THREE.Vector3): THREE.Vector3 {
  const n = arr.length / 3 - 1;
  const f = THREE.MathUtils.clamp(s / road.frames.ds, 0, n);
  const i = Math.min(n - 1, Math.floor(f));
  const t = f - i;
  return out.set(
    arr[i * 3] + (arr[i * 3 + 3] - arr[i * 3]) * t,
    arr[i * 3 + 1] + (arr[i * 3 + 4] - arr[i * 3 + 1]) * t,
    arr[i * 3 + 2] + (arr[i * 3 + 5] - arr[i * 3 + 2]) * t,
  );
}

/** The road's sideways direction at distance s (flat, unit length) -
 *  "right" for a traveller facing along the road. Level even on the
 *  loop and the corkscrew: the land's side, not the rolling road's. */
export function sideAt(road: RoadLayout, s: number, out = new THREE.Vector3()): THREE.Vector3 {
  return frameAt(road, road.frames.side, s, out).normalize();
}

/** Which way is up for the road at s - straight up on the land; round
 *  toward the centre on the loop, rolling over on the corkscrew. */
export function upAt(road: RoadLayout, s: number, out = new THREE.Vector3()): THREE.Vector3 {
  return frameAt(road, road.frames.up, s, out).normalize();
}

/** The ground beneath the road at s - the road itself, except where it
 *  leaves the land for a stunt. */
export function groundAt(road: RoadLayout, s: number, out = new THREE.Vector3()): THREE.Vector3 {
  return frameAt(road, road.frames.ground, s, out);
}

const tmpS = new THREE.Vector3();
const tmpU = new THREE.Vector3();
/** A point on the road's surface: d across it (right positive), h above
 *  it - following the lean into bends, and the loop and the corkscrew. */
export function surfaceAt(road: RoadLayout, s: number, d: number, h: number, out = new THREE.Vector3()): THREE.Vector3 {
  pointAt(road, s, out);
  frameAt(road, road.frames.rside, s, tmpS).normalize();
  upAt(road, s, tmpU);
  const r = tiltAt(road, s);
  const c = Math.cos(r);
  const sn = Math.sin(r);
  // The side and up, rolled by the lean (a small lean: the old lift).
  return out
    .addScaledVector(tmpS, d * c + h * sn)
    .addScaledVector(tmpU, -d * sn + h * c);
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
  /** Where the phone's tilt asks the camera to look, in radians: yaw
   *  turns the view left and right, pitch lifts it toward the distance.
   *  Set by the road's tilt listener, eased by the camera. */
  look = { yaw: 0, pitch: 0 };
  /** How fast it feels, 0 at rest to 1 flat out - eased by the camera,
   *  read by the motion blur and the wind. */
  feel = 0;
  /** Flat out for a while (0-1): the sparks fly and the camera drops in
   *  tight behind the traveller. Set by the camera. */
  boost = 0;
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
  /** On a loop or a corkscrew: the least speed allowed (0 elsewhere).
   *  Set by the camera. Nobody stops halfway round a loop, upside down -
   *  they can go faster, never stop or turn back, until they're through. */
  floor = 0;
  /** One frame: glide, or coast with friction. */
  step(k: number, max: number) {
    if (this.portal) return;
    // (A jump by letter glides straight past; this is for travelling.)
    if (this.floor > 0 && this.target === null) this.v = Math.max(this.v, this.floor);
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

/** Where s is on the journey, counted in challenges: 2.5 is halfway from
 *  the second checkpoint to the third. The calm road and the full ride
 *  are laid out to different lengths, so switching between them carries
 *  this across rather than a distance. */
export function progressAt(road: RoadLayout, s: number): number {
  const marks = [0, ...road.stops, road.finish];
  for (let i = 0; i < marks.length - 1; i++)
    if (s < marks[i + 1] || i === marks.length - 2) return i + THREE.MathUtils.clamp((s - marks[i]) / Math.max(1, marks[i + 1] - marks[i]), 0, 1);
  return 0;
}

/** The distance along this road for a progress from progressAt. */
export function sAtProgress(road: RoadLayout, p: number): number {
  const marks = [0, ...road.stops, road.finish];
  const i = THREE.MathUtils.clamp(Math.floor(p), 0, marks.length - 2);
  return marks[i] + (marks[i + 1] - marks[i]) * THREE.MathUtils.clamp(p - i, 0, 1);
}

/** Where the victory stretch begins: past the skyscraper, where there is
 *  one; else a little after the last challenge. */
export function victoryStart(road: RoadLayout): number {
  const tower = road.stunts.find((z) => z.kind === "tower");
  return tower ? tower.a + tower.len : road.stops[road.stops.length - 1] + VICTORY_AFTER;
}
