"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Classmate, CoachPost, Fireflies, Scenery, ScoreTag } from "./world-extras";
import { AHEAD, PhaseGate, RoadsideComment, RoadsideTrophy, Traveller } from "./world-details";
import { GATE_BEFORE, coachSpots, hills, layoutRoad, pointAt, seeded, sideAt, type RoadLayout, type Travel } from "./road-geometry";

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
  /** The trophy won here, shown at the roadside once passed. */
  trophy?: string;
  /** Something another student said about this challenge. */
  comment?: { name: string; body: string };
  /** Its best score, once passed. */
  score?: number;
  /** Other students standing at this checkpoint right now. */
  classmates?: string[];
}

export interface WorldPhase {
  id: string;
  name: string;
  /** Hex - three.js cannot read CSS variables. */
  color: string;
}

const NAVY = new THREE.Color("#070c18");
/** The land: dark glass, the navy of the app all but black. */
const GLASS = new THREE.Color("#060a17");

/** Where each phase's stretch of road starts and ends, by distance. */
function phaseSpans(road: RoadLayout, stops: WorldStop[], phases: WorldPhase[]) {
  return phases.map((p) => {
    const idx = stops.map((s, i) => (s.phase === p.id ? i : -1)).filter((i) => i >= 0);
    const first = road.stops[idx[0]] ?? 0;
    const last = road.stops[idx[idx.length - 1]] ?? 0;
    return { ...p, from: first - GATE_BEFORE, to: last + GATE_BEFORE, col: new THREE.Color(p.color) };
  });
}

type Span = ReturnType<typeof phaseSpans>[number];

/** The ground's colour at a distance along the road: the phase it is
 *  in, blended into the next across the boundary so the land shades
 *  from one colour into the next rather than stepping. */
function colourAt(spans: Span[], s: number, out: THREE.Color): THREE.Color {
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

/** The land either side of the road, and a faint neon grid over it. */
function Terrain({ road, spans }: { road: RoadLayout; spans: Span[] }) {
  const { mesh, lines } = useMemo(() => {
    const ROW = 3; // world units between rows along the road
    const COLS = 64;
    const HALF = 170; // how far the land runs out either side
    const rows = Math.ceil(road.length / ROW);
    const pos = new Float32Array((rows + 1) * (COLS + 1) * 3);
    const col = new Float32Array((rows + 1) * (COLS + 1) * 3);
    // The neon of each vertex: the colour its edges are drawn in.
    const neon = new Float32Array((rows + 1) * (COLS + 1) * 3);
    const p = new THREE.Vector3();
    const side = new THREE.Vector3();
    const phase = new THREE.Color();
    const c = new THREE.Color();
    for (let r = 0; r <= rows; r++) {
      const s = Math.min(r * ROW, road.length);
      pointAt(road, s, p);
      sideAt(road, s, side);
      colourAt(spans, s, phase);
      for (let k = 0; k <= COLS; k++) {
        const d = (k / COLS - 0.5) * 2 * HALF;
        const x = p.x + side.x * d;
        const z = p.z + side.z * d;
        // Flat under the road, rising into hills away from it.
        const away = THREE.MathUtils.smoothstep(Math.abs(d), 5, 70);
        const h = hills(x, z);
        const y = p.y - 0.2 + away * (h * 34 - 4) + away * away * 6;
        const i = (r * (COLS + 1) + k) * 3;
        pos[i] = x;
        pos[i + 1] = y;
        pos[i + 2] = z;
        // Near the road the land takes the phase's colour; out in the
        // hills it falls back towards night, with the ridges catching
        // a little of it.
        const near = 1 - THREE.MathUtils.smoothstep(Math.abs(d), 4, 90);
        const ridge = THREE.MathUtils.smoothstep(h, 0.55, 0.85) * away;
        // The faces are dark glass - navy all but black, with only a
        // breath of the phase in them - and the light is in the edges:
        // the phase's neon, brightest near the road and on the ridges.
        c.copy(GLASS).lerp(phase, 0.04 + near * 0.05 + ridge * 0.06);
        col[i] = c.r;
        col[i + 1] = c.g;
        col[i + 2] = c.b;
        const glowK = 0.55 + near * 0.7 + ridge * 0.5;
        neon[i] = phase.r * glowK;
        neon[i + 1] = phase.g * glowK;
        neon[i + 2] = phase.b * glowK;
      }
    }
    const idx: number[] = [];
    for (let r = 0; r < rows; r++)
      for (let k = 0; k < COLS; k++) {
        const a = r * (COLS + 1) + k;
        const b = a + COLS + 1;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();

    // The wireframe: the edges of the land's polygons - along, across
    // and one diagonal of every cell, on a grid two cells wide so the
    // triangles read as facets rather than a haze - in the phase's neon.
    const lp: number[] = [];
    const lc: number[] = [];
    const push = (a: number, b: number) => {
      for (const v of [a, b]) {
        lp.push(pos[v * 3], pos[v * 3 + 1] + 0.04, pos[v * 3 + 2]);
        lc.push(neon[v * 3], neon[v * 3 + 1], neon[v * 3 + 2]);
      }
    };
    const at = (r: number, k: number) => r * (COLS + 1) + k;
    for (let r = 0; r + 2 <= rows; r += 2)
      for (let k = 0; k + 2 <= COLS; k += 2) {
        push(at(r, k), at(r, k + 2));
        push(at(r, k), at(r + 2, k));
        push(at(r, k + 2), at(r + 2, k));
      }
    const lgeo = new THREE.BufferGeometry();
    lgeo.setAttribute("position", new THREE.Float32BufferAttribute(lp, 3));
    lgeo.setAttribute("color", new THREE.Float32BufferAttribute(lc, 3));
    return { mesh: geo, lines: lgeo };
  }, [road, spans]);

  return (
    <group>
      <mesh geometry={mesh}>
        {/* Both sides: the strip is built along the road, and which way
            its faces point depends on which way the road is turning. */}
        <meshStandardMaterial vertexColors flatShading roughness={0.28} metalness={0.75} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments geometry={lines}>
        <lineBasicMaterial vertexColors transparent opacity={0.85} toneMapped={false} />
      </lineSegments>
    </group>
  );
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
  const phase = new THREE.Color();
  const c = new THREE.Color();
  for (let r = 0; r <= rows; r++) {
    const s = Math.min(r * STEP, road.length);
    pointAt(road, s, p);
    sideAt(road, s, side);
    colour(colourAt(spans, s, phase), c);
    for (const d of [from, to]) {
      pos.push(p.x + side.x * d, p.y + lift, p.z + side.z * d);
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

/** The road: dark surface, faint edges, and the lit line down the
 *  middle that the traveller follows. */
function Road({ road, spans, trail }: { road: RoadLayout; spans: Span[]; trail: THREE.BufferGeometry[] }) {
  const g = useMemo(
    () => ({
      surface: ribbon(road, spans, -3.2, 3.2, 0, (ph, o) => o.set("#101a33").lerp(ph, 0.12)),
      glow: ribbon(road, spans, -1.6, 1.6, 0.03, (ph, o) => o.copy(ph).multiplyScalar(0.7)),
      // The road ahead, not yet travelled: a faint guide line.
      line: ribbon(road, spans, -0.12, 0.12, 0.05, (ph, o) => o.copy(ph).multiplyScalar(0.45)),
      left: ribbon(road, spans, -3.2, -3.0, 0.04, (ph, o) => o.copy(ph).multiplyScalar(0.7)),
      right: ribbon(road, spans, 3.0, 3.2, 0.04, (ph, o) => o.copy(ph).multiplyScalar(0.7)),
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
      <mesh geometry={trail[0]}>
        <meshBasicMaterial vertexColors transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
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
    </group>
  );
}

/** A soft round glow, drawn once and reused for every halo. */
function glowTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.35)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function canvasTex(size: number, draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** The disc's face: dark glass with the challenge's number in its
 *  phase's neon - white on the one you are on, dim on the locked. */
function numberFace(n: number, hex: string, state: WorldStop["state"]) {
  return canvasTex(512, (g) => {
    const grad = g.createRadialGradient(256, 200, 20, 256, 256, 256);
    grad.addColorStop(0, "#1a2544");
    grad.addColorStop(1, "#050914");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(256, 256, 256, 0, Math.PI * 2);
    g.fill();
    const ink = state === "locked" ? "#3a4260" : state === "here" ? "#ffffff" : state === "ahead" ? "#8a93ad" : hex;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = ink;
    g.shadowColor = state === "locked" ? "transparent" : hex;
    g.shadowBlur = 40;
    g.font = "800 250px system-ui, sans-serif";
    g.fillText(String(n), 256, 280);
    g.shadowBlur = 0;
    g.font = "700 38px system-ui, sans-serif";
    g.fillStyle = state === "locked" ? "#3a4260" : "#aab3cc";
    g.fillText(state === "locked" ? "LOCKED" : state === "done" ? "PASSED" : "CHALLENGE", 256, 108);
  });
}

/** The challenge's name, written round a circle, repeated to close it,
 *  for the ring that turns around the disc. */
function titleRing(title: string, hex: string, dim: boolean) {
  return canvasTex(1024, (g) => {
    g.translate(512, 512);
    g.font = "700 50px system-ui, sans-serif";
    g.fillStyle = dim ? "#4a5270" : hex;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const R = 450;
    const unit = `${title.toUpperCase()}   •   `;
    const circ = 2 * Math.PI * R;
    const reps = Math.max(1, Math.floor(circ / g.measureText(unit).width));
    const text = unit.repeat(reps);
    // Spread the characters evenly round the whole circle.
    const widths = [...text].map((ch) => g.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0);
    let a = -Math.PI / 2;
    [...text].forEach((ch, i) => {
      const w = (widths[i] / total) * Math.PI * 2;
      g.save();
      g.rotate(a + w / 2);
      g.translate(0, -R);
      g.fillText(ch, 0, 0);
      g.restore();
      a += w;
    });
  });
}

/** A checkpoint: a ring standing over the road with the challenge's
 *  number in it and its name turning round it, facing the traveller -
 *  a portal you pass through. */
function Checkpoint({
  road,
  s,
  n,
  stop,
  colour,
  glow,
}: {
  road: RoadLayout;
  s: number;
  n: number;
  stop: WorldStop;
  colour: THREE.Color;
  glow: THREE.Texture;
}) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.MeshBasicMaterial>(null);
  const face = useRef<THREE.MeshBasicMaterial>(null);
  const halo = useRef<THREE.MeshBasicMaterial>(null);
  const words = useRef<THREE.Mesh>(null);
  const wordsMat = useRef<THREE.MeshBasicMaterial>(null);
  const { position, facing } = useMemo(() => {
    const p = pointAt(road, s).add(new THREE.Vector3(0, 3.3, 0));
    const ahead = pointAt(road, s - 1).add(new THREE.Vector3(0, 3.3, 0));
    return { position: p, facing: ahead };
  }, [road, s]);

  useEffect(() => {
    group.current?.lookAt(facing);
  }, [facing]);

  const lit = stop.state === "done" || stop.state === "here";
  const hex = `#${colour.getHexString()}`;
  const ringColour = stop.state === "locked" ? new THREE.Color("#3a4260") : stop.state === "here" ? new THREE.Color("#ffffff") : colour;
  const faceMap = useMemo(() => numberFace(n, hex, stop.state), [n, hex, stop.state]);
  const ringMap = useMemo(() => titleRing(stop.title, hex, stop.state === "locked"), [stop.title, hex, stop.state]);

  const haloOpacity = stop.state === "locked" ? 0.08 : lit ? 0.55 : 0.28;
  useFrame(({ clock, camera }, dt) => {
    // The one you are on breathes.
    if (stop.state === "here" && ring.current) {
      const k = 0.75 + Math.sin(clock.elapsedTime * 2.4) * 0.25;
      ring.current.color.copy(colour).lerp(new THREE.Color("#ffffff"), k);
    }
    // The name turns slowly round the disc.
    if (words.current) words.current.rotation.z -= dt * 0.25;
    // Close up, the face thins to nothing and only the ring is left,
    // so you travel through the checkpoint instead of into a wall.
    const near = THREE.MathUtils.smoothstep(camera.position.distanceTo(position), 3, 11);
    if (face.current) face.current.opacity = near;
    // The name goes sooner: at its size, passing overhead, it would
    // sweep across the road in giant letters.
    if (wordsMat.current) wordsMat.current.opacity = THREE.MathUtils.smoothstep(camera.position.distanceTo(position), 12, 22);
    if (halo.current) halo.current.opacity = haloOpacity * near;
  });

  return (
    <group ref={group} position={position}>
      {/* The halo behind it. */}
      <mesh position={[0, 0, -0.08]}>
        <planeGeometry args={[9, 9]} />
        <meshBasicMaterial
          ref={halo}
          map={glow}
          color={ringColour}
          transparent
          opacity={haloOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* The number. */}
      <mesh>
        <circleGeometry args={[2.35, 48]} />
        <meshBasicMaterial ref={face} transparent map={faceMap} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[2.5, 0.13, 12, 64]} />
        <meshBasicMaterial ref={ring} color={ringColour} toneMapped={false} />
      </mesh>
      {/* The name, turning round the outside of the ring. */}
      <mesh ref={words} position={[0, 0, 0.05]}>
        <planeGeometry args={[7.4, 7.4]} />
        <meshBasicMaterial ref={wordsMat} map={ringMap} transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** The finish: an arch over the road in all five phase colours. */
function FinishGate({ road, spans }: { road: RoadLayout; spans: Span[] }) {
  const { position, facing } = useMemo(() => {
    const p = pointAt(road, road.finish);
    return { position: p, facing: pointAt(road, road.finish - 1) };
  }, [road]);
  const group = useRef<THREE.Group>(null);
  useEffect(() => {
    group.current?.lookAt(facing.x, position.y, facing.z);
  }, [facing, position]);
  return (
    <group ref={group} position={position}>
      {spans.map((sp, i) => {
        const a0 = (Math.PI * i) / spans.length;
        const a1 = (Math.PI * (i + 1)) / spans.length;
        return (
          <mesh key={sp.id} position={[0, 0, 0]} rotation={[0, 0, a0]}>
            <torusGeometry args={[5.5, 0.28, 12, 24, a1 - a0]} />
            <meshBasicMaterial color={sp.col} toneMapped={false} />
          </mesh>
        );
      })}
      {[-5.5, 5.5].map((x) => (
        <mesh key={x} position={[x, -0.2, 0]}>
          <boxGeometry args={[0.5, 0.6, 0.5]} />
          <meshStandardMaterial color="#1a2340" />
        </mesh>
      ))}
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
function Rig({
  road,
  travel,
  onMove,
}: {
  road: RoadLayout;
  travel: Travel;
  onMove: (s: number) => void;
}) {
  const { camera } = useThree();
  const eye = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const at = useMemo(() => new THREE.Vector3(), []);
  const last = useRef(-1);

  useFrame((_, dt) => {
    travel.step(Math.min(dt, 0.05) * 60, road.finish + 10);
    const s = travel.s;
    pointAt(road, s, pos);
    // Up above the road and behind the traveller, looking down the road
    // past them - high enough to see the land run off to the horizon.
    pointAt(road, s + AHEAD + 22, at);
    eye.set(pos.x, pos.y + 7.5, pos.z);
    look.set(at.x, at.y + 1.2, at.z);
    camera.position.lerp(eye, 1 - Math.pow(0.001, dt));
    camera.lookAt(look);
    if (Math.abs(s - last.current) > 0.25) {
      last.current = s;
      onMove(s);
    }
  });
  return null;
}

export function AdventureWorld({
  stops,
  phases,
  travel,
  onMove,
  avatar = "/lion-head.png",
  talkingCoach = null,
}: {
  stops: WorldStop[];
  phases: WorldPhase[];
  /** Where the camera is and how fast it is going - owned by the page,
   *  so the controls around the canvas can move it. */
  travel: Travel;
  onMove: (s: number) => void;
  /** The student's own picture, on the traveller. */
  avatar?: string;
  /** Which roadside Coach is speaking right now, if any. */
  talkingCoach?: number | null;
}) {
  const road = useMemo(() => layoutRoad(stops.length), [stops.length]);
  const spans = useMemo(() => phaseSpans(road, stops, phases), [road, stops, phases]);
  const glow = useMemo(() => (typeof document === "undefined" ? null : glowTexture()), []);
  const phaseCol = useMemo(() => new Map(phases.map((p) => [p.id, new THREE.Color(p.color)])), [phases]);
  const trail = useMemo(
    () => [
      ribbon(road, spans, -1.3, 1.3, 0.06, (ph, o) => o.copy(ph).multiplyScalar(0.9)),
      ribbon(road, spans, -0.3, 0.3, 0.08, (ph, o) => o.copy(ph).lerp(new THREE.Color("#ffffff"), 0.35).multiplyScalar(1.6)),
    ],
    [road, spans],
  );
  const colourAlong = useMemo(() => {
    const c = new THREE.Color();
    return (s: number) => colourAt(spans, s, c);
  }, [spans]);

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 62, near: 0.1, far: 900, position: [0, 3, 6] }}
      onCreated={({ scene }) => {
        scene.background = NAVY.clone();
        scene.fog = new THREE.FogExp2("#070c18", 0.0055);
      }}
    >
      <hemisphereLight args={["#8090d0", "#0a0f20", 2.2]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[40, 80, 30]} intensity={1.4} color="#c8d2ff" />
      <Stars />
      <Terrain road={road} spans={spans} />
      <Road road={road} spans={spans} trail={trail} />
      {spans.map((sp) => (
        <PhaseGate key={sp.id} road={road} s={Math.max(4, sp.from)} letter={sp.id} name={sp.name} colour={sp.color} />
      ))}
      {stops.map((stop, i) =>
        stop.trophy && stop.state === "done" ? (
          <RoadsideTrophy key={`t-${stop.slug}`} road={road} s={road.stops[i] + 6} side={i % 2 ? -1 : 1} image={stop.trophy} />
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
      <Scenery road={road} spans={spans} />
      {coachSpots(road).map((cs, i) => (
        <CoachPost key={i} road={road} s={cs} side={i % 2 ? -1 : 1} travel={travel} talking={talkingCoach === i} />
      ))}
      {stops.map((stop, i) =>
        stop.state === "done" && stop.score !== undefined ? (
          <ScoreTag key={`s-${stop.slug}`} road={road} s={road.stops[i]} score={stop.score} color={phaseCol.get(stop.phase)?.getStyle() ?? "#fff"} />
        ) : null,
      )}
      {stops.flatMap((stop, i) =>
        (stop.classmates ?? []).map((name, k) => (
          <Classmate
            key={`m-${stop.slug}-${k}`}
            road={road}
            s={road.stops[i] - 2 + k * 1.6}
            offset={(k % 2 ? 1 : -1) * (4 + k)}
            name={name}
            color={phaseCol.get(stop.phase)?.getStyle() ?? "#fff"}
          />
        )),
      )}
      <Traveller road={road} travel={travel} image={avatar} trail={trail} colourAt={colourAlong} />
      {glow &&
        stops.map((stop, i) => (
          <Checkpoint
            key={stop.slug}
            road={road}
            s={road.stops[i]}
            n={i + 1}
            stop={stop}
            colour={phaseCol.get(stop.phase) ?? new THREE.Color("#ffffff")}
            glow={glow}
          />
        ))}
      <FinishGate road={road} spans={spans} />
      <Rig road={road} travel={travel} onMove={onMove} />
    </Canvas>
  );
}

export { layoutRoad };
