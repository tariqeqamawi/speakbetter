"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { pointAt, seeded, type RoadLayout } from "./road-geometry";

// THE FINISH: the Speak Better lion, in 3D, at the end of the road - the
// logo's head in profile, roaring: an orange face with its snout pushed
// forward, the jaw hanging open, and the mane swept back behind it in
// layered curving blades - pink-magenta at the top, through purple, to
// blue underneath. Every piece edged in brighter neon. The head is turned
// three-quarters to the road, its open mouth facing the traveller, and
// the road runs straight into the mouth: that's the finish line.
//
// Kept to a modest size, so the city beyond it still shows.
//
// Built in the head's own frame, like the logo: +x the way the snout
// points, y up, z across the head. The mouth's corner is the origin - the
// finish point on the road.

const ORANGE_HI = new THREE.Color("#FFA51F");
const ORANGE_LO = new THREE.Color("#FF5F14");
const CHEEK = new THREE.Color("#F2451E");
const JAW = new THREE.Color("#FF6A1A");
const THROAT = new THREE.Color("#4A0620");
const HEAD_EDGE = new THREE.Color("#FFD24A");

/** The mane's layers, top to bottom, as in the logo: where each blade
 *  leaves the back of the head, which way it points (degrees; 180 is
 *  straight back), its length and width, and its colour. */
const MANE: [number, number, number, number, number, string][] = [
  [2, 40, 158, 44, 17, "#FF2E8A"],
  [-8, 38, 172, 50, 19, "#F5249E"],
  [-15, 31, 186, 52, 20, "#D92BD8"],
  [-20, 21, 202, 50, 19, "#A62FEA"],
  [-23, 9, 218, 48, 18, "#7B34EE"],
  [-23, -3, 234, 44, 17, "#5540EA"],
  [-19, -13, 252, 40, 16, "#3A55EE"],
  [-12, -20, 270, 34, 14, "#2F74F2"],
];

/** How far the head is turned from straight at the road: enough to show
 *  its profile, not so much the mouth turns away. */
const TURN = 0.8;
/** Where along the snout the road enters the mouth. */
const ENTRY = 10;

type Pt = [number, number];
const v2 = (pts: Pt[]) => pts.map(([x, y]) => new THREE.Vector2(x, y));

/** One swept blade of mane: a curved crescent, pointed at the tip. */
function blade(L: number, W: number) {
  const n = 14;
  const top: THREE.Vector2[] = [];
  const bot: THREE.Vector2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    // The spine curls round as it goes, like the logo's.
    const x = L * t;
    const y = 0.42 * L * t * t;
    const dx = L;
    const dy = 0.84 * L * t;
    const len = Math.hypot(dx, dy);
    const nx = -dy / len;
    const ny = dx / len;
    const w = (W / 2) * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.1)), 0.8) * (1 - 0.8 * t);
    // (Fuller on the outside of the curl.)
    top.push(new THREE.Vector2(x - nx * w * 1.3, y - ny * w * 1.3));
    bot.push(new THREE.Vector2(x + nx * w * 0.7, y + ny * w * 0.7));
  }
  return new THREE.Shape([...top, ...bot.reverse()]);
}

function buildLion() {
  const fills: THREE.BufferGeometry[] = [];
  const edges: number[] = [];
  const edgeCols: number[] = [];
  const tmp = new THREE.Color();
  /** Colour a geometry (by height, if given a function), keep only what
   *  one merged mesh needs, and trace its neon edges. */
  const add = (
    g: THREE.BufferGeometry,
    col: THREE.Color | ((x: number, y: number) => THREE.Color),
    edge: THREE.Color | null,
    angle = 30,
  ) => {
    const flat = g.index ? g.toNonIndexed() : g;
    const pos = flat.getAttribute("position");
    const c = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const k = typeof col === "function" ? col(pos.getX(i), pos.getY(i)) : col;
      c.set([k.r, k.g, k.b], i * 3);
    }
    flat.setAttribute("color", new THREE.BufferAttribute(c, 3));
    flat.deleteAttribute("uv");
    flat.deleteAttribute("normal");
    fills.push(flat);
    if (edge) {
      const e = new THREE.EdgesGeometry(g, angle);
      const p = e.getAttribute("position");
      for (let i = 0; i < p.count; i++) {
        edges.push(p.getX(i), p.getY(i), p.getZ(i));
        edgeCols.push(edge.r, edge.g, edge.b);
      }
      e.dispose();
    }
  };
  const extrude = (pts: Pt[] | THREE.Shape, depth: number, z = 0) =>
    new THREE.ExtrudeGeometry(Array.isArray(pts) ? new THREE.Shape(v2(pts)) : pts, {
      depth,
      bevelEnabled: false,
      curveSegments: 10,
    }).translate(0, 0, z - depth / 2);

  // THE HEAD: brow and snout, pushed forward over the open mouth.
  const upper = extrude(
    [
      [-14, 13], [-18, 22], [-16, 32], [-9, 39], [1, 41], [9, 38], [15, 31], [22, 24],
      [26, 19], [25, 15], [19, 13.5], [8, 13], [-14, 13],
    ],
    21,
  );
  add(upper, (_x, y) => tmp.copy(ORANGE_LO).lerp(ORANGE_HI, THREE.MathUtils.clamp((y - 13) / 26, 0, 1)), HEAD_EDGE);
  // The snout's bridge, narrower and standing proud of the face.
  const snout = extrude(
    [
      [4, 30], [15, 29], [22, 24], [26, 19], [25, 16], [12, 17], [4, 22],
    ],
    11,
  ).translate(0, 0.4, 0);
  add(snout, (_x, y) => tmp.copy(ORANGE_LO).lerp(ORANGE_HI, THREE.MathUtils.clamp((y - 13) / 20, 0, 1)).multiplyScalar(1.08), HEAD_EDGE);
  // The lower jaw, hanging open: its top the mouth's floor, just under
  // the road.
  const jaw = extrude(
    [
      [-12, -1], [6, -1], [17, -0.5], [21, 2], [20, -3], [13, -7], [2, -10], [-12, -10],
    ],
    19,
  );
  add(jaw, JAW, HEAD_EDGE);
  // The cheek and throat behind the mouth, down into the neck, the
  // darker orange-red of the logo's.
  const cheek = extrude(
    [
      [-28, 14], [-14, 13], [-12, -1], [-12, -10], [-6, -18], [-13, -27], [-26, -22], [-31, -4],
    ],
    22,
  );
  add(cheek, CHEEK, HEAD_EDGE);
  // (The back of the throat is squared to the road instead: FinishLion.)
  // The ears, both sides, pink inside.
  for (const z of [-7.5, 7.5]) {
    add(new THREE.CylinderGeometry(6, 6, 3, 24).rotateX(Math.PI / 2).translate(-7, 40, z), ORANGE_HI.clone().multiplyScalar(0.95), HEAD_EDGE);
    add(new THREE.CylinderGeometry(3.4, 3.4, 3.2, 20).rotateX(Math.PI / 2).translate(-6.5, 40.4, z + Math.sign(z) * 0.2), new THREE.Color("#FF4F8F"), null);
  }
  // Fierce eyes, both sides: slanted white slits under a heavy brow.
  for (const side of [-1, 1]) {
    const z = side * 10.56;
    const eye = new THREE.ShapeGeometry(new THREE.Shape(v2([[6, 29.5], [14.5, 27.5], [15.5, 29.5], [8, 32.5]])));
    if (side < 0) eye.rotateY(Math.PI).scale(-1, 1, 1);
    add(eye.translate(0, 0, z), new THREE.Color("#FFF1B8").multiplyScalar(0.95), null);
    edges.push(4, 34, z, 16, 30.5, z);
    edgeCols.push(HEAD_EDGE.r * 1.3, HEAD_EDGE.g * 1.3, HEAD_EDGE.b * 1.3, HEAD_EDGE.r * 1.3, HEAD_EDGE.g * 1.3, HEAD_EDGE.b * 1.3);
  }
  // Fangs, top and bottom, either side of the way in.
  const white = new THREE.Color("#FFF4E0").multiplyScalar(0.85);
  for (const z of [-6, 6]) {
    add(new THREE.ConeGeometry(1.5, 5, 6).rotateZ(Math.PI).translate(22.5, 11, z), white, null);
    add(new THREE.ConeGeometry(1.3, 4, 6).translate(18.5, 1.2, z), white, null);
  }

  // THE MANE: the logo's layered blades, swept back and down behind the
  // head, in three layers across it - the middle one longest - so it has
  // depth from whichever side it's seen.
  const rand = seeded(23);
  for (const [layer, z, grow, depth, flare] of [
    [0, -13, 0.86, 3, -0.3],
    [1, -6.5, 1.0, 3, -0.14],
    [2, 0, 1.15, 4, 0],
    [3, 6.5, 1.0, 3, 0.14],
    [4, 13, 0.86, 3, 0.3],
  ] as const) {
    MANE.forEach(([x, y, deg, L, W, hex], i) => {
      const a = THREE.MathUtils.degToRad(deg + (layer - 2) * 3 + (rand() - 0.5) * 4);
      const g = new THREE.ExtrudeGeometry(blade(L * grow * 1.25, W * 1.3), { depth, bevelEnabled: false, curveSegments: 8 })
        .translate(0, 0, -depth / 2)
        // (Pointing back, its curl turns downward; the outer layers
        // flaring out to the sides, so the mane is full from the front.)
        .rotateZ(a)
        .rotateX(flare)
        .translate(x, y, z - i * 0.05);
      const c = new THREE.Color(hex);
      // Deepest near the head, full colour out at the tips.
      const root = new THREE.Vector2(x, y);
      add(
        g,
        (px, py) => tmp.copy(c).multiplyScalar(0.62 + 0.38 * Math.min(1, Math.hypot(px - root.x, py - root.y) / (L * 0.8))),
        c.clone().lerp(new THREE.Color("#ffffff"), 0.2).multiplyScalar(1.35),
      );
    });
  }

  const lines = new THREE.BufferGeometry();
  lines.setAttribute("position", new THREE.Float32BufferAttribute(edges, 3));
  lines.setAttribute("color", new THREE.Float32BufferAttribute(edgeCols, 3));
  return { fill: mergeFlat(fills), lines, disposeParts: () => fills.forEach((f) => f.dispose()) };
}

// Sparks drifting off the mane: each leaves a point on its edge, drifts
// out and up and fades, and is reborn - all in the shader.
const SPARK_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uR;
  attribute float aAngle;
  attribute float aSeed;
  attribute vec3 aCol;
  varying vec3 vCol;
  varying float vFade;
  void main() {
    float life = fract(uTime * (0.16 + aSeed * 0.2) + aSeed * 7.0);
    vec2 dir = vec2(cos(aAngle), sin(aAngle));
    float fly = life * (8.0 + aSeed * 12.0);
    vec3 p = vec3(dir.x * (uR + fly), dir.y * (uR + fly), (aSeed - 0.5) * 16.0);
    p.y += life * life * 6.0;
    vCol = aCol;
    vFade = (1.0 - life) * smoothstep(0.0, 0.08, life);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (3.0 + aSeed * 4.0) * (220.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const SPARK_FRAG = /* glsl */ `
  varying vec3 vCol;
  varying float vFade;
  void main() {
    vec2 q = gl_PointCoord - 0.5;
    float a = exp(-dot(q, q) * 18.0) * vFade;
    gl_FragColor = vec4(vCol * 1.4 * a, a);
  }
`;

/** "FINISH", drawn once onto a canvas: white letters glowing through
 *  every section's colour. */
function finishLabel(cols: THREE.Color[]) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.font = "900 170px system-ui, -apple-system, 'Segoe UI', sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  const grad = g.createLinearGradient(140, 0, 884, 0);
  cols.forEach((col, i) => grad.addColorStop(i / Math.max(1, cols.length - 1), `#${col.clone().multiplyScalar(0.8).getHexString()}`));
  g.shadowColor = "rgba(255,255,255,0.9)";
  for (const blur of [60, 28]) {
    g.shadowBlur = blur;
    g.fillStyle = grad;
    g.fillText("FINISH", 512, 132);
  }
  g.shadowBlur = 0;
  g.fillStyle = "#ffffff";
  g.fillText("FINISH", 512, 132);
  g.save();
  g.globalCompositeOperation = "source-atop";
  g.fillStyle = grad;
  g.globalAlpha = 0.55;
  g.fillText("FINISH", 512, 132);
  g.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function FinishLion({ road, cols }: { road: RoadLayout; cols: THREE.Color[] }) {
  const { position, facing } = useMemo(() => {
    const p = pointAt(road, road.finish);
    return { position: p, facing: pointAt(road, road.finish - 1) };
  }, [road]);
  const group = useRef<THREE.Group>(null);
  useEffect(() => {
    group.current?.lookAt(facing.x, position.y, facing.z);
  }, [facing, position]);

  const lion = useMemo(() => {
    const { fill, lines, disposeParts } = buildLion();
    disposeParts();
    const mesh = new THREE.Mesh(fill, new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, side: THREE.DoubleSide }));
    const edge = new THREE.LineSegments(lines, new THREE.LineBasicMaterial({ vertexColors: true, toneMapped: false }));
    return { mesh, edge };
  }, []);
  const throatLight = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffb070"), toneMapped: false }), []);
  const throatWall = useMemo(() => new THREE.MeshBasicMaterial({ color: THROAT, side: THREE.DoubleSide, toneMapped: false }), []);

  const label = useMemo(() => (typeof document === "undefined" ? null : finishLabel(cols)), [cols]);

  const sparks = useMemo(() => {
    const N = 300;
    const ang = new Float32Array(N);
    const seed = new Float32Array(N);
    const col = new Float32Array(N * 3);
    const pos = new Float32Array(N * 3);
    const rand = seeded(11);
    for (let i = 0; i < N; i++) {
      // Off the back and top of the mane, in the head's own plane.
      ang[i] = THREE.MathUtils.degToRad(80 + rand() * 190);
      seed[i] = rand();
      const c = new THREE.Color(MANE[Math.min(MANE.length - 1, Math.floor(((ang[i] - 1.4) / 3.3) * MANE.length))]?.[5] ?? "#F53DE0");
      col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aAngle", new THREE.BufferAttribute(ang, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aCol", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.ShaderMaterial({
      vertexShader: SPARK_VERT,
      fragmentShader: SPARK_FRAG,
      uniforms: { uTime: { value: 0 }, uR: { value: 48 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const pts = new THREE.Points(g, mat);
    pts.frustumCulled = false;
    return pts;
  }, []);

  useEffect(
    () => () => {
      lion.mesh.geometry.dispose();
      (lion.mesh.material as THREE.Material).dispose();
      lion.edge.geometry.dispose();
      (lion.edge.material as THREE.Material).dispose();
      throatLight.dispose();
      throatWall.dispose();
      label?.dispose();
      sparks.geometry.dispose();
      (sparks.material as THREE.Material).dispose();
    },
    [lion, throatLight, throatWall, label, sparks],
  );

  /* eslint-disable react-hooks/immutability -- colours and a uniform, set every frame */
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // It breathes, as if about to roar: the neon swelling and settling.
    const k = 0.5 + 0.5 * Math.sin(t * 1.6);
    (lion.edge.material as THREE.LineBasicMaterial).color.setScalar(0.85 + 0.35 * k);
    throatLight.color.setRGB(1, 0.62, 0.3).multiplyScalar(0.75 + 0.3 * k);
    (sparks.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
  });
  /* eslint-enable react-hooks/immutability */

  // (The head's +x - its snout - toward the traveller, turned a little to
  // show its profile.)
  return (
    <group ref={group} position={position}>
      <group position={[-ENTRY * Math.sin(TURN), 0, 0]} rotation={[0, -Math.PI / 2 + TURN, 0]}>
        <primitive object={lion.mesh} />
        <primitive object={lion.edge} />
        <primitive object={sparks} position={[-10, 14, 0]} />
      </group>
      {/* The back of its throat, square across the road just past where
          the traveller stops - so going in, the mouth closes round you
          rather than the road running on beyond it. */}
      <mesh position={[0, -6, -14]} material={throatWall}>
        <planeGeometry args={[24, 40]} />
      </mesh>
      <mesh position={[0, 6.5, -13.8]} material={throatLight}>
        <circleGeometry args={[4.2, 32]} />
      </mesh>
      {label && (
        <mesh position={[0, 62, -8]}>
          <planeGeometry args={[34, 8.5]} />
          <meshBasicMaterial map={label} color="#b4b4b4" transparent toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

/** Non-indexed, position + colour only: joined into one geometry. */
function mergeFlat(geos: THREE.BufferGeometry[]) {
  let n = 0;
  for (const g of geos) n += g.getAttribute("position").count;
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  let o = 0;
  for (const g of geos) {
    const p = g.getAttribute("position") as THREE.BufferAttribute;
    const c = g.getAttribute("color") as THREE.BufferAttribute;
    pos.set(p.array as Float32Array, o * 3);
    col.set(c.array as Float32Array, o * 3);
    o += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return out;
}
