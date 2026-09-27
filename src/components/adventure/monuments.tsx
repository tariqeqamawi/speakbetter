"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CLIMB, ROAD_HALF, groundAt, pointAt, sideAt, type RoadLayout } from "./road-geometry";

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
    float fres = pow(1.0 - abs(dot(N, V)), 2.2);
    float side = 0.5 + 0.5 * dot(N, normalize(vec3(-0.3, 0.6, -0.5)));
    // Black, like the real thing - a glossy black with a cool sheen at
    // its edges so the shape still reads against the night.
    vec3 col = vec3(0.012, 0.013, 0.018) * (0.6 + 0.8 * side) + vec3(0.55, 0.62, 0.78) * (fres * 0.55);
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

export function Monuments({ road, colourAt, plan }: { road: RoadLayout; colourAt: ColourAt; plan: MonumentPlan }) {
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
    // THE SPEAKER THE ROAD CLIMBS: a giant black cabinet standing across
    // the road, its face where the road turns straight up. The road runs
    // up the face, round the edge of the big woofer - glowing, pulsing -
    // over the top and down the back.
    if (plan.speakers) {
      const { a } = plan.speakers;
      const c = colourAt(a).clone().multiplyScalar(1.6);
      const { H, FACE, TOP, WOOF_Y, WOOF_R } = CLIMB;
      const W = 64;
      const D = TOP + 16;
      const g = new THREE.Group();
      // Stand at the start of the climb, facing along the road (+z ahead).
      const p0 = pointAt(road, a);
      const ahead = pointAt(road, a + 2);
      g.position.copy(p0);
      g.lookAt(ahead.x, p0.y, ahead.z);
      // Just behind the road where it turns up the face - measured from the
      // road itself, so the cabinet is always exactly under it.
      const F = ahead.clone().sub(p0).setY(0).normalize();
      let faceAt = FACE;
      for (let d = 0; d < 120; d += 0.5) {
        const q = pointAt(road, a + d);
        if (q.y - p0.y > 12) {
          faceAt = q.sub(p0).dot(F);
          break;
        }
      }
      const front = faceAt + 1.4;
      // The cabinet.
      g.add(mesh(new THREE.BoxGeometry(W, H - 0.6, D), cupMat, 0, (H - 0.6) / 2, front + D / 2));
      const zf = front - 0.4;
      const cone = (x: number, y: number, r: number) => {
        g.add(mesh(new THREE.TorusGeometry(r, r * 0.06, 10, 64), glow(c), x, y, zf));
        g.add(mesh(new THREE.TorusGeometry(r * 0.62, r * 0.035, 8, 48), glow(c.clone().multiplyScalar(0.7)), x, y, zf));
        g.add(mesh(new THREE.CircleGeometry(r * 0.3, 32), glow(c.clone().multiplyScalar(0.45)), x, y, zf - 0.1, 0, Math.PI));
      };
      // The woofer (the road swings round its edge), and the tweeters.
      cone(0, H * WOOF_Y, WOOF_R);
      cone(-15, H * 0.8, 6.5);
      cone(15, H * 0.8, 6.5);
      cone(0, H * 0.8, 3.5);
      // A seam of light round the cabinet's front edge.
      for (const [x, y, sx, sy] of [
        [0, H - 0.6, W, 0.6],
        [-W / 2, H / 2, 0.6, H],
        [W / 2, H / 2, 0.6, H],
      ] as const)
        g.add(mesh(new THREE.BoxGeometry(sx, sy, 0.6), glow(c.clone().multiplyScalar(0.8)), x, y, zf));
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
    for (const s of plan.headphones ?? []) {
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
      root.add(g);
    }

    return { scene: root, lit };
  }, [road, colourAt, plan, glass]);

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
