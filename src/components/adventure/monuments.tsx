"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CLIMB, ROAD_HALF, TOWER, groundAt, pointAt, sideAt, type RoadLayout } from "./road-geometry";

// THE MONUMENTS - three landmarks of speaking, far bigger than anything
// else in the city, so it takes long enough to pass them for the penny
// to drop: "wait - is that a microphone?"
//
// - PODCAST MICS, the broadcast kind, standing upright like towers
//   either side of the road: a base, a tall stand, a yoke, the body with
//   its foam windscreen on top and grille rings, and a band of light round
//   its middle like the on-air light - the same size as the buildings, so
//   the shape reads from far off.
// - A PAIR OF SPEAKER STACKS, one either side of the road: big woofers
//   low, tweeters at the top, all pulsing to a beat.
// - HEADPHONES as an archway: the headband spans the road, the cups
//   stand either side, the cushions and the inside of the band glowing.
//
// Dark glass like the rest of the city, rimmed in white light so the
// shapes read against the sky; the glowing parts in the section's colour.

export interface MonumentPlan {
  /** The podcast mics, standing like towers: where, and which side. */
  mic?: { s: number; side: number }[];
  /** The speaker the road climbs: where the climb begins. */
  speakers?: { a: number };
  /** Every great arch of the road is a pair of headphones. */
  headphones?: number[];
  /** The skyscraper the road climbs at the end of Y: where its stunt starts. */
  tower?: { a: number };
  /** The two giant faces, either side of the road, talking to each other. */
  faces?: number;
  /** Podcast mics on boom arms, leaning out over the road from one side. */
  booms?: { s: number; side: number }[];
}

type ColourAt = (s: number) => THREE.Color;

const RIM_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = cameraPosition - wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const RIM_FRAG = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec3 N = normalize(vN);
    vec3 V = normalize(vV);
    float fres = pow(1.0 - abs(dot(N, V)), 3.5);
    float side = 0.5 + 0.5 * dot(N, normalize(vec3(-0.3, 0.6, -0.5)));
    // Black, like the real thing - a glossy black with a cool sheen at
    // its edges so the shape still reads against the night.
    vec3 col = vec3(0.006, 0.007, 0.012) * (0.6 + 0.8 * side) + vec3(0.40, 0.48, 0.72) * (fres * 0.5);
    gl_FragColor = vec4(col, 1.0);
  }
`;

/** Stand a group at s along the road, d across, facing along it. */
function placeAt(g: THREE.Group, road: RoadLayout, s: number, d: number) {
  const p = groundAt(road, s);
  const side = sideAt(road, s);
  const ahead = groundAt(road, s + 4);
  g.position.set(p.x + side.x * d, p.y, p.z + side.z * d);
  g.lookAt(ahead.x + side.x * d, p.y, ahead.z + side.z * d);
}

export function Monuments({
  road,
  colourAt,
  plan,
  calm = false,
}: {
  road: RoadLayout;
  colourAt: ColourAt;
  plan: MonumentPlan;
  /** The calm view from above: no arches over the road to hide the traveller. */
  calm?: boolean;
}) {
  const glass = useMemo(() => new THREE.ShaderMaterial({ vertexShader: RIM_VERT, fragmentShader: RIM_FRAG }), []);

  const { scene, lit } = useMemo(() => {
    const root = new THREE.Group();
    const lit: THREE.MeshBasicMaterial[] = [];
    const glow = (c: THREE.Color) => {
      const m = new THREE.MeshBasicMaterial({ color: c.clone(), toneMapped: false });
      m.userData.base = c.clone();
      lit.push(m);
      return m;
    };
    const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.rotation.set(rx, ry, rz);
      return m;
    };
    // (In each group: -z runs along the road, x across it, y up.)

    for (const { s, side } of plan.mic ?? []) {
      const c = colourAt(s).clone().lerp(new THREE.Color("#ffffff"), 0.25).multiplyScalar(1.6);
      const g = new THREE.Group();
      const P = 62; // the stand's height, up to the yoke
      const R = 13; // the body's radius
      const L = 58; // the body's length
      const HEAD = 24; // the foam windscreen
      // Base and stand.
      g.add(mesh(new THREE.CylinderGeometry(15, 18, 4, 40), glass, 0, 2, 0));
      g.add(mesh(new THREE.CylinderGeometry(2.2, 2.8, P, 16), glass, 0, P / 2, 0));
      // The yoke: a U cradling the body.
      g.add(mesh(new THREE.BoxGeometry(R * 2 + 9, 3, 5), glass, 0, P, 0));
      for (const x of [-(R + 3.5), R + 3.5]) g.add(mesh(new THREE.BoxGeometry(2.6, 30, 5), glass, x, P + 15, 0));
      // The body, upright, leaning a little toward the road.
      const body = new THREE.Group();
      body.position.set(0, P + 4, 0);
      body.rotation.set(0, 0, side * 0.12);
      body.add(mesh(new THREE.CylinderGeometry(R, R * 0.9, L, 40), glass, 0, L / 2, 0));
      // THE ON-AIR BAND round its middle.
      body.add(mesh(new THREE.CylinderGeometry(R * 1.04, R * 1.04, 5, 48, 1, true), glow(c), 0, L * 0.42, 0));
      // The foam windscreen on top: fatter, rounded, ringed with light.
      body.add(mesh(new THREE.CylinderGeometry(R * 1.14, R * 1.1, HEAD, 40), glass, 0, L + HEAD / 2, 0));
      body.add(mesh(new THREE.SphereGeometry(R * 1.14, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), glass, 0, L + HEAD, 0));
      for (const y of [L + 3, L + HEAD / 2, L + HEAD - 3])
        body.add(mesh(new THREE.TorusGeometry(R * 1.16, 0.5, 8, 48), glow(c.clone().multiplyScalar(0.6)), 0, y, 0, Math.PI / 2));
      // The cable, dropping from its base.
      body.add(mesh(new THREE.CylinderGeometry(R * 0.5, R * 0.5, 4, 24), glass, 0, -2, 0));
      g.add(body);
      placeAt(g, road, s, side * (ROAD_HALF + 34));
      root.add(g);
    }

    const cupMat = new THREE.MeshStandardMaterial({ color: "#07080c", roughness: 0.35, metalness: 0.5 });
    // THE SPEAKER STACKS THE ROAD CLIMBS BETWEEN: one either side of the
    // road - a great subwoofer cabinet with a monitor speaker on top,
    // black, their cones glowing and pulsing - and the road rising up
    // between them to near their tops, across, and down the far side.
    if (plan.speakers) {
      const { a } = plan.speakers;
      const c = colourAt(a).clone().multiplyScalar(1.6);
      const { H } = CLIMB;
      // Where the road runs level between them: measured from the road
      // itself, so the stacks always stand either side of the top.
      const p0 = pointAt(road, a);
      let from = -1;
      let to = -1;
      for (let d = 0; d < 400; d += 1) {
        if (pointAt(road, a + d).y - p0.y > H - 0.8) {
          if (from < 0) from = d;
          to = d;
        } else if (from >= 0) break;
      }
      const mid = a + (from >= 0 ? (from + to) / 2 : 120);
      // The subwoofer, and the monitor on top of it.
      const SW = 32;
      const SH = 36;
      const SD = 30;
      const MW = 24;
      const MH = 22;
      const MD = 20;
      const cone = (g: THREE.Group, x: number, y: number, z: number, r: number) => {
        g.add(mesh(new THREE.TorusGeometry(r, r * 0.07, 10, 64), glow(c), x, y, z));
        g.add(mesh(new THREE.TorusGeometry(r * 0.62, r * 0.04, 8, 48), glow(c.clone().multiplyScalar(0.7)), x, y, z));
        g.add(mesh(new THREE.CircleGeometry(r * 0.3, 32), glow(c.clone().multiplyScalar(0.45)), x, y, z - 0.1, 0, Math.PI));
      };
      const seam = (g: THREE.Group, y0: number, w: number, h: number, z: number) => {
        for (const [x, y, sx, sy] of [
          [0, y0 + h, w, 0.5],
          [0, y0, w, 0.5],
          [-w / 2, y0 + h / 2, 0.5, h],
          [w / 2, y0 + h / 2, 0.5, h],
        ] as const)
          g.add(mesh(new THREE.BoxGeometry(sx, sy, 0.5), glow(c.clone().multiplyScalar(0.8)), x, y, z));
      };
      for (const side of [-1, 1]) {
        const outer = new THREE.Group();
        placeAt(outer, road, mid, side * (ROAD_HALF + 8 + SW / 2));
        // (Placed facing along the road: its local +x points back across
        // to the road on the right-hand side, away from it on the left.)
        const inward = side;
        const g = new THREE.Group();
        // Toed in a little, their fronts to the traveller coming up.
        g.rotation.y = -inward * 0.3;
        outer.add(g);
        // The subwoofer: one huge cone, and a port either side of it.
        const zs = -SD / 2 - 0.4;
        g.add(mesh(new THREE.BoxGeometry(SW, SH, SD), cupMat, 0, SH / 2, 0));
        cone(g, 0, SH * 0.48, zs, 12);
        for (const x of [-11.5, 11.5]) g.add(mesh(new THREE.TorusGeometry(2.2, 0.35, 8, 32), glow(c.clone().multiplyScalar(0.6)), x, SH * 0.14, zs));
        seam(g, 0, SW, SH, zs);
        // The monitor on top, tipped back a touch.
        const m = new THREE.Group();
        m.position.set(0, SH, -2);
        m.rotation.x = -0.12;
        const zm = -MD / 2 - 0.4;
        m.add(mesh(new THREE.BoxGeometry(MW, MH, MD), cupMat, 0, MH / 2, 0));
        cone(m, 0, MH * 0.38, zm, 7);
        cone(m, 0, MH * 0.8, zm, 2.6);
        seam(m, 0, MW, MH, zm);
        g.add(m);
        root.add(outer);
      }
    }

    // THE SKYSCRAPER the road climbs: dark glass, far taller than anything
    // around it, its corners and floors lit in every section's colour -
    // the road running straight up its near face, over its roof and down
    // its far face.
    if (plan.tower) {
      const { a } = plan.tower;
      const { H, NEAR, FAR } = TOWER;
      const cols = ["#1FE890", "#22D9F5", "#FFD60A", "#FF4A2B", "#F53DE0"].map((h) => new THREE.Color(h).multiplyScalar(1.5));
      const g = new THREE.Group();
      const p0 = pointAt(road, a);
      const ahead = pointAt(road, a + 2);
      g.position.copy(p0);
      g.lookAt(ahead.x, p0.y, ahead.z);
      const W = 44;
      const D = FAR - NEAR - 1.6;
      const zc = (NEAR + FAR) / 2;
      g.add(mesh(new THREE.BoxGeometry(W, H - 0.6, D), glass, 0, (H - 0.6) / 2, zc));
      // Its foot, down into the ground.
      g.add(mesh(new THREE.BoxGeometry(W + 6, 40, D + 6), glass, 0, -20, zc));
      // Lit corners.
      [
        [-W / 2, NEAR + 0.8],
        [W / 2, NEAR + 0.8],
        [-W / 2, FAR - 0.8],
        [W / 2, FAR - 0.8],
      ].forEach(([x, z], i) => g.add(mesh(new THREE.BoxGeometry(0.9, H, 0.9), glow(cols[i % cols.length]), x, H / 2, z)));
      // Bands of light round its floors, climbing through the colours.
      for (let y = 14, k = 0; y < H - 4; y += 12, k++) {
        const c = glow(cols[k % cols.length].clone().multiplyScalar(0.75));
        for (const x of [-W / 2 - 0.2, W / 2 + 0.2]) g.add(mesh(new THREE.BoxGeometry(0.4, 0.5, D), c, x, y, zc));
        // (On the faces the road runs up, only out at the edges.)
        for (const z of [NEAR + 0.6, FAR - 0.6]) for (const x of [-W / 2 + 8, W / 2 - 8]) g.add(mesh(new THREE.BoxGeometry(14, 0.5, 0.4), c, x, y, z));
      }
      // Light running up the faces the road climbs and comes down, either
      // side of it - so, on the way up, you see the height pour past.
      for (const z of [NEAR + 0.5, FAR - 0.5])
        [-15, -8.5, 8.5, 15].forEach((x, i) => g.add(mesh(new THREE.BoxGeometry(0.5, H, 0.3), glow(cols[(i + (z > zc ? 2 : 0)) % cols.length].clone().multiplyScalar(0.8)), x, H / 2, z)));
      // The roof's rim.
      for (const x of [-W / 2, W / 2]) g.add(mesh(new THREE.BoxGeometry(0.9, 0.9, D), glow(cols[4]), x, H, zc));
      root.add(g);
    }

    // PODCAST MICS ON BOOM ARMS: from a base beside the road, the arm
    // rises at an angle, bends at its elbow and reaches out over the road,
    // the mic hanging from its end and leaning on toward the far side -
    // like the studio arm over a desk, the size of a building.
    for (const { s, side } of plan.booms ?? []) {
      const c = colourAt(s).clone().lerp(new THREE.Color("#ffffff"), 0.2).multiplyScalar(1.6);
      const g = new THREE.Group();
      const ground = groundAt(road, s);
      // (Standing on the ground; where the road is up on a skyway, the
      // arm starts from the road's height on a tall post.)
      const lift = Math.max(0, pointAt(road, s).y - ground.y);
      placeAt(g, road, s, 0);
      const foot = new THREE.Vector3(side * (ROAD_HALF + 16), lift, 0);
      const elbow = new THREE.Vector3(side * (ROAD_HALF + 6), lift + 44, 0);
      const tip = new THREE.Vector3(-side * 2, lift + 36, 0);
      const bar = (a: THREE.Vector3, b: THREE.Vector3, r: number) => {
        const m = mesh(new THREE.CylinderGeometry(r, r, a.distanceTo(b), 12), glass, 0, 0, 0);
        m.position.copy(a).add(b).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
        g.add(m);
      };
      if (lift > 0) bar(new THREE.Vector3(foot.x, -2, 0), foot, 1.8);
      g.add(mesh(new THREE.CylinderGeometry(6, 7.5, 3, 24), glass, foot.x, foot.y + 1.5, 0));
      // The arm: two bars each way, as on the real thing, with springs of light.
      for (const dz of [-1.4, 1.4]) {
        bar(foot.clone().setZ(dz), elbow.clone().setZ(dz), 0.8);
        bar(elbow.clone().setZ(dz), tip.clone().setZ(dz), 0.7);
      }
      g.add(mesh(new THREE.TorusGeometry(2.4, 0.5, 8, 24), glow(c), elbow.x, elbow.y, 0));
      // The mic, hanging from the end, tipped toward the far side.
      const mic = new THREE.Group();
      mic.position.copy(tip);
      mic.rotation.z = side * 0.45;
      const R = 5;
      const L = 18;
      mic.add(mesh(new THREE.BoxGeometry(2, 5, 2), glass, 0, -2.5, 0));
      mic.add(mesh(new THREE.CylinderGeometry(R, R * 0.9, L, 32), glass, 0, -5 - L / 2, 0));
      mic.add(mesh(new THREE.SphereGeometry(R * 1.06, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), glass, 0, -5 - L, 0));
      mic.add(mesh(new THREE.CylinderGeometry(R * 1.05, R * 1.05, 2, 32, 1, true), glow(c), 0, -5 - L * 0.35, 0));
      for (const y of [-5 - L * 0.7, -5 - L * 0.85]) mic.add(mesh(new THREE.TorusGeometry(R * 1.02, 0.25, 6, 32), glow(c.clone().multiplyScalar(0.6)), 0, y, 0, Math.PI / 2));
      g.add(mic);
      root.add(g);
    }

    // HEADPHONES ARCHES - the road's great gateways. The band a dark
    // blue translucent glass, the ear cups black, the inside of the
    // band edged in light in the section's colour, the cushions glowing.
    const bandMat = new THREE.MeshPhysicalMaterial({
      color: "#10204a",
      transparent: true,
      opacity: 0.72,
      roughness: 0.15,
      metalness: 0.2,
      clearcoat: 1,
      emissive: "#0a1636",
      emissiveIntensity: 0.6,
    });
    for (const s of calm ? [] : (plan.headphones ?? [])) {
      const c = colourAt(s).clone().lerp(new THREE.Color("#ffffff"), 0.15).multiplyScalar(1.7);
      const g = new THREE.Group();
      const SPAN = ROAD_HALF + 20; // cups' centre from the road's middle
      const CUP_Y = 19;
      const BAND_Y = CUP_Y + 12;
      const T = 3.6; // band thickness
      // The band, arching over the road.
      g.add(mesh(new THREE.TorusGeometry(SPAN, T, 20, 120, Math.PI), bandMat, 0, BAND_Y, 0));
      // Light along both edges of its inside.
      for (const z of [-T * 0.8, T * 0.8])
        g.add(mesh(new THREE.TorusGeometry(SPAN - T * 0.75, 0.35, 8, 120, Math.PI), glow(c), 0, BAND_Y, z));
      // And a soft strip down the middle of the inside.
      g.add(mesh(new THREE.TorusGeometry(SPAN - T * 0.95, 0.9, 8, 120, Math.PI), glow(c.clone().multiplyScalar(0.35)), 0, BAND_Y, 0));
      for (const x of [-SPAN, SPAN]) {
        const inward = -Math.sign(x);
        // The slider from band to cup, black.
        g.add(mesh(new THREE.BoxGeometry(2.4, 14, 5), cupMat, x, CUP_Y + 7, 0));
        // The cup, black, facing in across the road.
        g.add(mesh(new THREE.CylinderGeometry(14, 14, 11, 48), cupMat, x, CUP_Y, 0, 0, 0, Math.PI / 2));
        // Its rim of light, and the cushion glowing on the inner face.
        g.add(mesh(new THREE.TorusGeometry(14, 0.5, 8, 64), glow(c), x - inward * 5.5, CUP_Y, 0, 0, Math.PI / 2));
        g.add(mesh(new THREE.TorusGeometry(10.5, 3, 14, 48), glow(c.clone().multiplyScalar(0.8)), x + inward * 6, CUP_Y, 0, 0, Math.PI / 2));
        g.add(mesh(new THREE.CircleGeometry(8, 36), glow(c.clone().multiplyScalar(0.3)), x + inward * 5.9, CUP_Y, 0, 0, inward * (Math.PI / 2)));
      }
      placeAt(g, road, s, 0);
      // (Where the road is up in the air, the arch stands over it there.)
      g.position.y = pointAt(road, s).y;
      root.add(g);
    }

    return { scene: root, lit };
  }, [road, colourAt, plan, glass, calm]);

  useEffect(
    () => () => {
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          if (o.material !== glass) (o.material as THREE.Material).dispose();
        }
      });
      glass.dispose();
    },
    [scene, glass],
  );

  // The glowing parts pulse, as if the sound is on.
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    lit.forEach((m, i) => {
      const k = 0.55 + 0.45 * Math.pow(0.5 + 0.5 * Math.sin(t * 4 + i * 0.7), 2);
      m.color.copy(m.userData.base as THREE.Color).multiplyScalar(k);
    });
  });

  return <primitive object={scene} />;
}
