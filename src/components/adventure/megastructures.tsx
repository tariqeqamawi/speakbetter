"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ROAD_HALF, pointAt, seeded, sideAt, type RoadLayout } from "./road-geometry";

// SCALE. On the tracks of Extreme-G the road ran between things far
// bigger than you - towers, gantries, tunnels - and passing them is what
// made you feel small and fast. So the road here runs through a city:
//
// - TOWERS, back from the road: stepped skyscrapers, needles with a disc
//   near the top, obelisks, twin towers joined by a skybridge, stacked
//   cantilevers, ringed cylinders - in the app's dark blue glass, lit
//   only by the sky catching their edges. A few throw a slow searchlight
//   into the night.
// - ARCHES and RING GATES standing across the road, glowing in the
//   section's colour, that you pass under.
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
  void main() {
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
  void main() {
    vec3 N = normalize(vN);
    vec3 V = normalize(vV);
    float fres = pow(1.0 - abs(dot(N, V)), 3.0);
    float side = 0.5 + 0.5 * dot(N, normalize(vec3(-0.3, 0.6, -0.5)));
    float floors = smoothstep(0.9, 1.0, fract(vH / 3.2)) * 0.22;
    vec3 col = vec3(0.03, 0.055, 0.12) * (0.55 + 0.8 * side)
      + vec3(0.22, 0.36, 0.75) * fres * 0.5
      + vec3(0.18, 0.3, 0.62) * floors * (0.35 + fres);
    float fog = 1.0 - exp(-uFogD * uFogD * vDepth * vDepth);
    gl_FragColor = vec4(mix(col, uFog, fog * 0.5), 1.0);
  }
`;

type Kind = "box" | "cyl" | "cyl6" | "cone4" | "cone8";
const KINDS: Kind[] = ["box", "cyl", "cyl6", "cone4", "cone8"];
function unitGeo(k: Kind): THREE.BufferGeometry {
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

/** The city's towers as parts: each part a primitive, positioned. */
function buildCity(road: RoadLayout, rand: () => number) {
  const parts: Record<Kind, THREE.Matrix4[]> = { box: [], cyl: [], cyl6: [], cone4: [], cone8: [] };
  const towers: Tower[] = [];
  const p = new THREE.Vector3();
  const side = new THREE.Vector3();
  const ahead = new THREE.Vector3();
  const anchor = new THREE.Object3D();
  const local = new THREE.Object3D();
  const m = new THREE.Matrix4();
  for (const st of openStretches(road)) {
    for (let s = st.from; s < st.to; s += 55 + rand() * 30) {
      const sd = rand() < 0.5 ? -1 : 1;
      const d = sd * (ROAD_HALF + 18 + rand() * 55);
      pointAt(road, s, p);
      sideAt(road, s, side);
      pointAt(road, s + 2, ahead);
      anchor.position.set(p.x + side.x * d, p.y - 30, p.z + side.z * d);
      anchor.lookAt(ahead.x + side.x * d, anchor.position.y, ahead.z + side.z * d);
      anchor.rotateY((rand() - 0.5) * 0.8);
      anchor.updateMatrix();
      const w = 6 + rand() * 8;
      const h = 70 + rand() * 110;
      /** A part at (x, y, z) in the tower's own frame, sized sx*sy*sz. */
      const put = (k: Kind, x: number, y: number, z: number, sx: number, sy: number, sz: number, ry = 0) => {
        local.position.set(x, y, z);
        local.rotation.set(0, ry, 0);
        local.scale.set(sx, sy, sz);
        local.updateMatrix();
        parts[k].push(m.multiplyMatrices(anchor.matrix, local.matrix).clone());
      };
      const type = Math.floor(rand() * 6);
      let top = h;
      if (type === 0) {
        // Stepped skyscraper with a spire.
        put("box", 0, h * 0.275, 0, w, h * 0.55, w * 0.8);
        put("box", 0, h * 0.625, 0, w * 0.72, h * 0.15 + h * 0.0, w * 0.6);
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
      } else {
        // Ringed cylinder with a cone.
        put("cyl", 0, h * 0.45, 0, w, h * 0.9, w);
        for (const k of [0.35, 0.6, 0.82]) put("cyl", 0, h * k, 0, w * 1.45, 1.4, w * 1.45);
        put("cone8", 0, h * 1.0, 0, w, h * 0.2, w);
        top = h * 1.1;
      }
      towers.push({ s, d, top: top - 30 });
    }
  }
  return { parts, towers };
}

function City({ road }: { road: RoadLayout }) {
  const { parts, towers } = useMemo(() => buildCity(road, seeded(97)), [road]);
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
        const mesh = new THREE.InstancedMesh(unitGeo(k), material, parts[k].length);
        parts[k].forEach((mx, i) => mesh.setMatrixAt(i, mx));
        mesh.instanceMatrix.needsUpdate = true;
        mesh.frustumCulled = false;
        return mesh;
      }),
    [parts, material],
  );
  useEffect(
    () => () => {
      meshes.forEach((m) => {
        m.geometry.dispose();
        m.dispose();
      });
      material.dispose();
    },
    [meshes, material],
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

function Gates({ road, colourAt, arches }: { road: RoadLayout; colourAt: ColourAt; arches: { s: number; ring: boolean }[] }) {
  const squares = arches.filter((a) => !a.ring);
  const circles = arches.filter((a) => a.ring);
  const archDark = useInstanced(
    squares.length * 3,
    useMemo(() => new THREE.BoxGeometry(1, 1, 1), []),
    useMemo(
      () => new THREE.ShaderMaterial({ vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, uniforms: { uFog: { value: new THREE.Color("#060b1c") }, uFogD: { value: 0.0024 } } }),
      [],
    ),
  );
  const archLight = useInstanced(
    squares.length * 3,
    useMemo(() => new THREE.BoxGeometry(1, 1, 1), []),
    useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []),
  );
  const rings = useInstanced(
    circles.length * 2,
    useMemo(() => new THREE.TorusGeometry(1, 0.035, 8, 64), []),
    useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []),
  );

  useEffect(() => {
    const p = new THREE.Vector3();
    const side = new THREE.Vector3();
    const ahead = new THREE.Vector3();
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    const at = (s: number, d: number, y: number) => {
      pointAt(road, s, p);
      sideAt(road, s, side);
      pointAt(road, s + 2, ahead);
      o.position.set(p.x + side.x * d, p.y + y, p.z + side.z * d);
      o.rotation.set(0, 0, 0);
      o.scale.set(1, 1, 1);
      o.lookAt(ahead.x + side.x * d, o.position.y, ahead.z + side.z * d);
    };
    const put = (m: THREE.InstancedMesh, i: number, colour?: THREE.Color) => {
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      if (colour) m.setColorAt(i, colour);
    };
    let r = 0;
    circles.forEach((ar) => {
      c.copy(colourAt(ar.s)).multiplyScalar(1.5);
      for (const [k, radius] of [
        [0, 15],
        [1, 12.5],
      ] as const) {
        at(ar.s + k * 3, 0, radius - 3);
        o.scale.set(radius, radius, radius * 3);
        put(rings, r++, k === 0 ? c : c.clone().multiplyScalar(0.75));
      }
    });
    let a = 0;
    squares.forEach((ar) => {
      c.copy(colourAt(ar.s)).multiplyScalar(1.5);
      const W = ROAD_HALF + 5;
      const H = 20;
      for (const d of [-W, W]) {
        at(ar.s, d, H / 2 - 4);
        o.scale.set(3, H + 8, 3);
        put(archDark, a);
        at(ar.s, d - Math.sign(d) * 1.55, H / 2 - 4);
        o.scale.set(0.25, H + 8, 3.1);
        put(archLight, a, c);
        a++;
      }
      at(ar.s, 0, H + 1.5);
      o.scale.set(W * 2 + 3, 3, 3);
      put(archDark, a);
      at(ar.s, 0, H - 0.05);
      o.scale.set(W * 2, 0.25, 3.1);
      put(archLight, a, c);
      a++;
    });
    for (const m of [archDark, archLight, rings]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }, [road, colourAt, circles, squares, archDark, archLight, rings]);

  return (
    <group>
      <primitive object={archDark} />
      <primitive object={archLight} />
      <primitive object={rings} />
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
    float ringD = (fract(along / 7.0) - 0.5) * 7.0;
    float ring = exp(-ringD * ringD * 6.0);
    float stripD = (fract(around * 8.0) - 0.5) / 8.0 * 50.0;
    float strip = exp(-stripD * stripD * 8.0) * 0.55;
    vec2 cell = floor(vec2(along * 1.2, around * 90.0));
    float h = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
    vec2 f = fract(vec2(along * 1.2, around * 90.0)) - 0.5;
    float star = step(0.93, h) * exp(-dot(f, f) * 30.0) * (0.5 + 0.5 * sin(uTime * (1.0 + h * 3.0) + h * 50.0));
    vec3 base = vec3(0.015, 0.025, 0.06);
    vec3 col = base + uColor * (ring * 1.4 + strip) + vec3(0.8, 0.85, 1.0) * star * 0.9;
    // Ends fade in, so the mouth is a glow rather than a hard edge.
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

export function Megastructures({ road, colourAt }: { road: RoadLayout; colourAt: ColourAt }) {
  const plan = useMemo(() => {
    const arches: { s: number; ring: boolean }[] = [];
    const tunnels: { from: number; to: number }[] = [];
    openStretches(road).forEach((st, i) => {
      const mid = (st.from + st.to) / 2;
      // Every third stretch a tube, the others an arch or a ring gate.
      if (i % 3 === 2 && st.to - st.from > 100) {
        const half = Math.min(70, (st.to - st.from) / 2 - 5);
        tunnels.push({ from: mid - half, to: mid + half });
      } else arches.push({ s: mid, ring: i % 3 === 1 });
    });
    return { arches, tunnels };
  }, [road]);
  return (
    <group>
      <City road={road} />
      <Gates road={road} colourAt={colourAt} arches={plan.arches} />
      <Tubes road={road} colourAt={colourAt} tunnels={plan.tunnels} />
    </group>
  );
}
