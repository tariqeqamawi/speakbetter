"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Classmate, CoachPost, Fireflies, Scenery } from "./world-extras";
import { Portal } from "./portal";
import { Bloom, GateSparks, Sky } from "./fx";
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
  varying float vLift;
  varying vec2 vGrid;
  varying float vS;
  varying vec3 vNeon;
  varying vec3 vWorld;
  varying float vDepth;
  void main() {
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
  varying float vLift;
  varying vec2 vGrid;
  varying float vS;
  varying vec3 vNeon;
  varying vec3 vWorld;
  varying float vDepth;
  void main() {
    // Distance to the nearest grid edge, in screen pixels.
    vec2 g = vGrid / 2.0;
    vec2 w = fwidth(g);
    vec2 f = abs(fract(g - 0.5) - 0.5) / max(w, vec2(1e-4));
    float px = min(f.x, f.y);
    float core = 1.0 - smoothstep(0.0, 1.4, px);
    float halo = exp(-px * 0.5);
    float haloWide = exp(-px * 0.22);

    // The wave: rolling out from the traveller along the road, again and
    // again, a soft band a few squares deep.
    float front = uFrom + mod(uTime, 4.0) * 55.0;
    float d = vS - front;
    float wave = exp(-d * d / 60.0) * (1.0 - smoothstep(180.0, 220.0, front - uFrom));
    // A faint afterglow behind it, fading as it goes.
    float wake = (d < 0.0 ? exp(d / 18.0) : 0.0) * 0.35 * (1.0 - smoothstep(180.0, 220.0, front - uFrom));

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
    vec3 albedo = vec3(0.010, 0.014, 0.030);
    vec3 col = albedo * (0.35 * hemi + 0.9 * diff) * ao;
    col += vec3(0.05, 0.06, 0.12) * spec * ao;
    col += uHorizon * fres * 0.22 * ao;
    col += vNeon * (0.035 * haloWide + 0.05 * (wave + wake)) * ao;

    // The light itself.
    float rest = 0.02 * halo + 0.16 * core;
    float lit = (wave + wake) * (1.2 * core + 0.5 * halo + 0.25 * haloWide);
    col += vNeon * (rest + lit * 1.6);

    // Air: haze deepening with distance, and mist lying in the low
    // ground far off, tinted by the phase's light.
    float fog = 1.0 - exp(-uFogDensity * uFogDensity * vDepth * vDepth);
    float mist = exp(-max(vLift + 1.0, 0.0) * 0.16) * smoothstep(30.0, 170.0, vDepth) * 0.6;
    vec3 haze = mix(uFog, vNeon * 0.22, 0.3);
    col = mix(col, haze, mist);
    gl_FragColor = vec4(mix(col, uFog, fog), 1.0);
  }
`;

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
    // The neon of each vertex: the colour its edges glow in.
    const neon = new Float32Array(n * 3);
    const p = new THREE.Vector3();
    const side = new THREE.Vector3();
    const phase = new THREE.Color();
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
        const v = r * (COLS + 1) + k;
        pos.set([x, y, z], v * 3);
        grid.set([r, k], v * 2);
        along[v] = s;
        lift[v] = y - p.y;
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
          uFog: { value: new THREE.Color("#0a1030") },
          uFogDensity: { value: 0.0046 },
          uHorizon: { value: new THREE.Color("#3a3f8f") },
        },
      }),
    [],
  );

  // Each wave starts from wherever the traveller is when it sets off.
  const lastLoop = useRef(-1);
  /* eslint-disable react-hooks/immutability */
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    material.uniforms.uTime.value = t;
    const loop = Math.floor(t / 4);
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
        <meshBasicMaterial vertexColors transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
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
    if (travel.portal) {
      // The dive: the camera sweeps down to the portal's height and in
      // to its mouth, looking straight into the vortex.
      const k = THREE.MathUtils.smoothstep((performance.now() - travel.portal.since) / 1700, 0, 1);
      pointAt(road, travel.portal.s - 2.2 - (1 - k) * 12, pos);
      pointAt(road, travel.portal.s, at);
      eye.set(pos.x, pos.y + 3.3 + (1 - k) * 4, pos.z);
      look.set(at.x, at.y + 3.3, at.z);
      camera.position.lerp(eye, 1 - Math.pow(0.0005, dt));
      camera.lookAt(look);
      return;
    }
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
      // No filmic tone mapping: it greyed every bright colour, the
      // student's photo included. The glow comes from the bloom, not the
      // grade, so photos show as uploaded and the neon stays pure.
      flat
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 62, near: 0.1, far: 900, position: [0, 3, 6] }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.FogExp2("#0a1030", 0.0046);
      }}
    >
      <hemisphereLight args={["#8090d0", "#0a0f20", 2.2]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[40, 80, 30]} intensity={1.4} color="#c8d2ff" />
      <Stars />
      <Terrain road={road} spans={spans} travel={travel} />
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
      <GateSparks
        road={road}
        travel={travel}
        gates={spans.slice(1).map((sp, k) => ({ s: sp.from, from: spans[k].color, to: sp.color }))}
      />
      <Sky />
      <Bloom />
      <Scenery road={road} spans={spans} />
      {coachSpots(road).map((cs, i) => (
        <CoachPost key={i} road={road} s={cs} side={i % 2 ? -1 : 1} travel={travel} talking={talkingCoach === i} />
      ))}
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
        />
      ))}
      <FinishGate road={road} spans={spans} />
      <Rig road={road} travel={travel} onMove={onMove} />
    </Canvas>
  );
}

export { layoutRoad };
