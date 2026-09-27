"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ROAD_HALF, bankLift, pointAt, seeded, sideAt, type RoadLayout } from "./road-geometry";

// SCALE. On the tracks of Extreme-G the road ran between things far
// bigger than you - towers, gantries, tunnels - and passing them is what
// made you feel small and fast. So the road here runs between them too:
//
// - MONOLITHS: dark slabs a hundred units tall standing back from the
//   road, their edges lined in the section's colour, a beacon on top.
//   A few throw a slow searchlight into the sky.
// - ARCHES: great gateways standing across the road that you pass under.
// - TUNNELS: a run of lit frames close around the road - at speed they
//   strobe past like the inside of a machine.
//
// All of it sits in the long open stretches between challenges, never
// at a portal, and is drawn in a handful of instanced meshes so it costs
// almost nothing.

type ColourAt = (s: number) => THREE.Color;

/** Where along the road the big things may stand: the open middle of
 *  each stretch between two challenges (and before the first). */
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

export function Megastructures({ road, colourAt }: { road: RoadLayout; colourAt: ColourAt }) {
  const plan = useMemo(() => {
    const rand = seeded(97);
    const stretches = openStretches(road);
    const slabs: { s: number; d: number; w: number; h: number; t: number; rot: number }[] = [];
    const arches: { s: number; ring: boolean }[] = [];
    const tunnels: { from: number; to: number }[] = [];
    stretches.forEach((st, i) => {
      // Monoliths every 60-90 units, alternating sides, some near, most far.
      for (let s = st.from; s < st.to; s += 60 + rand() * 30) {
        const side = rand() < 0.5 ? -1 : 1;
        slabs.push({
          s,
          d: side * (ROAD_HALF + 16 + rand() * 50),
          w: 5 + rand() * 7,
          h: 60 + rand() * 110,
          t: 4 + rand() * 5,
          rot: (rand() - 0.5) * 0.5,
        });
      }
      const mid = (st.from + st.to) / 2;
      // Every third stretch a tunnel, the others an arch or a ring gate.
      if (i % 3 === 2 && st.to - st.from > 110) tunnels.push({ from: mid - 40, to: mid + 40 });
      else arches.push({ s: mid, ring: i % 3 === 1 });
    });
    return { slabs, arches, tunnels };
  }, [road]);

  // MONOLITHS: body, two edge strips, a beacon.
  const slabBody = useInstanced(
    plan.slabs.length,
    useMemo(() => new THREE.BoxGeometry(1, 1, 1), []),
    useMemo(() => new THREE.MeshStandardMaterial({ color: "#0b1022", roughness: 0.55, metalness: 0.6 }), []),
  );
  const slabEdge = useInstanced(
    plan.slabs.length * 2,
    useMemo(() => new THREE.BoxGeometry(1, 1, 1), []),
    useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []),
  );
  const beacon = useInstanced(
    plan.slabs.length,
    useMemo(() => new THREE.SphereGeometry(1, 10, 8), []),
    useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []),
  );
  // ARCHES: two pillars and a lintel, dark, lined in light.
  const archDark = useInstanced(
    plan.arches.filter((a) => !a.ring).length * 3,
    useMemo(() => new THREE.BoxGeometry(1, 1, 1), []),
    useMemo(() => new THREE.MeshStandardMaterial({ color: "#0d1328", roughness: 0.5, metalness: 0.6 }), []),
  );
  const archLight = useInstanced(
    plan.arches.filter((a) => !a.ring).length * 3,
    useMemo(() => new THREE.BoxGeometry(1, 1, 1), []),
    useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []),
  );
  const rings = useInstanced(
    plan.arches.filter((a) => a.ring).length * 2,
    useMemo(() => new THREE.TorusGeometry(1, 0.035, 8, 64), []),
    useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []),
  );
  // TUNNELS: a frame every 5 units - posts, roof, and a light strip.
  const FRAME = 5;
  const frameCount = plan.tunnels.reduce((n, t) => n + Math.floor((t.to - t.from) / FRAME) + 1, 0);
  const tunnelDark = useInstanced(
    frameCount * 3,
    useMemo(() => new THREE.BoxGeometry(1, 1, 1), []),
    useMemo(() => new THREE.MeshStandardMaterial({ color: "#0a0f20", roughness: 0.5, metalness: 0.7 }), []),
  );
  const tunnelLight = useInstanced(
    frameCount * 3,
    useMemo(() => new THREE.BoxGeometry(1, 1, 1), []),
    useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []),
  );

  useEffect(() => {
    const p = new THREE.Vector3();
    const side = new THREE.Vector3();
    const ahead = new THREE.Vector3();
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    const put = (m: THREE.InstancedMesh, i: number, colour?: THREE.Color) => {
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      if (colour) m.setColorAt(i, colour);
    };
    /** Stand o at s, d across the road, height y above it, facing along it. */
    const at = (s: number, d: number, y: number) => {
      pointAt(road, s, p);
      sideAt(road, s, side);
      pointAt(road, s + 2, ahead);
      o.position.set(p.x + side.x * d, p.y + y, p.z + side.z * d);
      o.rotation.set(0, 0, 0);
      o.scale.set(1, 1, 1);
      o.lookAt(ahead.x + side.x * d, o.position.y, ahead.z + side.z * d);
    };

    plan.slabs.forEach((sl, i) => {
      c.copy(colourAt(sl.s)).multiplyScalar(1.4);
      // Sunk well into the ground so the hills never show its foot.
      const base = -30;
      at(sl.s, sl.d, base + sl.h / 2);
      o.rotateY(sl.rot);
      o.scale.set(sl.w, sl.h, sl.t);
      put(slabBody, i);
      // A strip of light down the edge facing the road, and the other.
      const face = Math.sign(sl.d) * -1;
      for (const [k, e] of [
        [0, face],
        [1, -face],
      ] as const) {
        at(sl.s, sl.d, base + sl.h / 2);
        o.rotateY(sl.rot);
        o.translateX(e * (sl.w / 2 + 0.05));
        o.scale.set(0.25, sl.h, k === 0 ? sl.t + 0.1 : sl.t * 0.3);
        put(slabEdge, i * 2 + k, k === 0 ? c : c.clone().multiplyScalar(0.6));
      }
      at(sl.s, sl.d, base + sl.h + 1.2);
      o.scale.setScalar(0.9);
      put(beacon, i, c.clone().lerp(new THREE.Color("#ffffff"), 0.4).multiplyScalar(1.4));
    });

    let a = 0;
    let r = 0;
    plan.arches.forEach((ar) => {
      c.copy(colourAt(ar.s)).multiplyScalar(1.5);
      if (ar.ring) {
        // Two great rings standing over the road, one inside the other.
        for (const [k, radius] of [
          [0, 15],
          [1, 12.5],
        ] as const) {
          at(ar.s + k * 3, 0, radius - 3);
          o.scale.setScalar(radius);
          o.scale.z = radius * 3;
          put(rings, r++, k === 0 ? c : c.clone().multiplyScalar(0.7));
        }
        return;
      }
      const W = ROAD_HALF + 5;
      const H = 20;
      for (const d of [-W, W]) {
        at(ar.s, d, H / 2 - 4);
        o.scale.set(3, H + 8, 3);
        put(archDark, a);
        at(ar.s, d - Math.sign(d) * 1.55, H / 2 - 4);
        o.scale.set(0.2, H + 8, 3.1);
        put(archLight, a, c);
        a++;
      }
      at(ar.s, 0, H + 1.5);
      o.scale.set(W * 2 + 3, 3, 3);
      put(archDark, a);
      at(ar.s, 0, H - 0.05);
      o.scale.set(W * 2, 0.2, 3.1);
      put(archLight, a, c);
      a++;
    });

    let t = 0;
    plan.tunnels.forEach((tn) => {
      for (let s = tn.from; s <= tn.to; s += FRAME) {
        c.copy(colourAt(s)).multiplyScalar(1.3);
        const W = ROAD_HALF + 1.6;
        const H = 7.5;
        for (const d of [-W, W]) {
          at(s, d, H / 2 - 0.5 + bankLift(road, s, d));
          o.scale.set(0.6, H + 1, 1.2);
          put(tunnelDark, t);
          at(s, d - Math.sign(d) * 0.32, H / 2 - 0.5 + bankLift(road, s, d));
          o.scale.set(0.08, H + 1, 0.5);
          put(tunnelLight, t, c);
          t++;
        }
        at(s, 0, H + 0.2);
        o.scale.set(W * 2 + 0.6, 0.6, 1.2);
        put(tunnelDark, t);
        at(s, 0, H - 0.12);
        o.scale.set(W * 2, 0.08, 0.5);
        put(tunnelLight, t, c);
        t++;
      }
    });

    for (const m of [slabBody, slabEdge, beacon, archDark, archLight, rings, tunnelDark, tunnelLight]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }, [plan, road, colourAt, slabBody, slabEdge, beacon, archDark, archLight, rings, tunnelDark, tunnelLight]);

  return (
    <group>
      {[slabBody, slabEdge, beacon, archDark, archLight, rings, tunnelDark, tunnelLight].map((m) => (
        <primitive key={m.uuid} object={m} />
      ))}
      <Searchlights road={road} slabs={plan.slabs} colourAt={colourAt} />
    </group>
  );
}

/** From the tallest few monoliths, a slow beam of light swinging across
 *  the sky - the glare of the place, at night. */
function Searchlights({
  road,
  slabs,
  colourAt,
}: {
  road: RoadLayout;
  slabs: { s: number; d: number; h: number }[];
  colourAt: ColourAt;
}) {
  const beams = useMemo(() => {
    const tall = slabs.filter((_, i) => i % 5 === 0);
    const p = new THREE.Vector3();
    const side = new THREE.Vector3();
    return tall.map((sl, i) => {
      pointAt(road, sl.s, p);
      sideAt(road, sl.s, side);
      return {
        pos: new THREE.Vector3(p.x + side.x * sl.d, p.y - 30 + sl.h + 1, p.z + side.z * sl.d),
        colour: colourAt(sl.s).clone().lerp(new THREE.Color("#ffffff"), 0.35),
        phase: i * 1.7,
      };
    });
  }, [road, slabs, colourAt]);
  const geo = useMemo(() => {
    // A long thin cone pointing up from its tip.
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
        uniforms: { uColor: { value: new THREE.Color() } },
        vertexShader: /* glsl */ `
          varying float vUp;
          void main() {
            vUp = position.y / 260.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying float vUp;
          void main() {
            float a = 0.09 * pow(1.0 - clamp(vUp, 0.0, 1.0), 1.8);
            gl_FragColor = vec4(uColor, a);
          }
        `,
      }),
    [],
  );
  const mats = useMemo(
    () =>
      beams.map((b) => {
        const m = mat.clone();
        m.uniforms.uColor.value = b.colour;
        return m;
      }),
    [beams, mat],
  );
  useEffect(() => () => mats.forEach((m) => m.dispose()), [mats]);
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    group.current?.children.forEach((child, i) => {
      const b = beams[i];
      child.rotation.set(Math.sin(t * 0.23 + b.phase) * 0.45, 0, Math.cos(t * 0.17 + b.phase) * 0.45);
    });
  });
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <group ref={group}>
      {beams.map((b, i) => (
        <mesh key={i} position={b.pos} geometry={geo} material={mats[i]} />
      ))}
    </group>
  );
}
