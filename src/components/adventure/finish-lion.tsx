"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { pointAt, seeded, type RoadLayout } from "./road-geometry";

// THE FINISH: a giant neon lion's head - the Speak Better mascot - over
// the end of the road, roaring, its mouth wide open. The road runs
// straight into its mouth, and that's the finish line.
//
// Built front-on so it reads as a lion from far down the road: a mane of
// flame-shaped blades fanning out around the face - magenta at the top,
// through purple, to blue at the sides - an orange face with fierce white
// eyes, fangs, and the open mouth a lit tunnel you drive into. Every
// shape edged in brighter neon; sparks drift off the mane.
//
// (In its own frame: +z faces the traveller coming up the road, y is up,
// and the road's surface at the finish is y = 0.)

const MAGENTA = new THREE.Color("#F53DE0");
const PURPLE = new THREE.Color("#8B5CF6");
const BLUE = new THREE.Color("#2F6BF2");
const CYAN = new THREE.Color("#22D9F5");

/** The mane's colour by angle round the face: magenta at the top, purple
 *  at the sides, blue and then cyan low down. */
function maneColour(angle: number, out = new THREE.Color()) {
  const u = Math.sin(angle);
  if (u > 0.3) return out.copy(PURPLE).lerp(MAGENTA, (u - 0.3) / 0.7);
  if (u > -0.2) return out.copy(BLUE).lerp(PURPLE, (u + 0.2) / 0.5);
  return out.copy(CYAN).lerp(BLUE, THREE.MathUtils.clamp((u + 0.6) / 0.4, 0, 1));
}

/** The whole head, scaled up: the mouth then wide enough to drive into. */
const LION_SCALE = 1.35;
/** The head's centre, above the road. */
const C = new THREE.Vector2(0, 30);
/** The mane: where the blades fan from, and how far round they go. */
const MANE_R = 24;
const MANE_FROM = -0.62;
const MANE_TO = Math.PI + 0.62;

function blade(len: number, base: number) {
  const s = new THREE.Shape();
  s.moveTo(-base / 2, 0);
  s.quadraticCurveTo(-base * 0.45, len * 0.62, base * 0.3, len);
  s.quadraticCurveTo(base * 0.15, len * 0.45, base / 2, 0);
  s.lineTo(-base / 2, 0);
  return s;
}

/** Everything but the sparks, built once: the fills (vertex-coloured, one
 *  mesh) and the neon edges (one set of lines). */
function buildLion() {
  const fills: THREE.BufferGeometry[] = [];
  const edges: number[] = [];
  const edgeCols: number[] = [];
  const tmp = new THREE.Color();
  const colourGeo = (g: THREE.BufferGeometry, c: THREE.Color | ((y: number, x: number) => THREE.Color)) => {
    const pos = g.getAttribute("position");
    const col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const k = typeof c === "function" ? c(pos.getY(i), pos.getX(i)) : c;
      col.set([k.r, k.g, k.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const flat = g.index ? g.toNonIndexed() : g;
    flat.deleteAttribute("uv");
    flat.deleteAttribute("normal");
    fills.push(flat);
  };
  const outline = (pts: THREE.Vector2[], m: THREE.Matrix4, c: THREE.Color, closed = true) => {
    const v = new THREE.Vector3();
    const w = new THREE.Vector3();
    const n = closed ? pts.length : pts.length - 1;
    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      v.set(a.x, a.y, 0).applyMatrix4(m);
      w.set(b.x, b.y, 0).applyMatrix4(m);
      edges.push(v.x, v.y, v.z, w.x, w.y, w.z);
      edgeCols.push(c.r, c.g, c.b, c.r, c.g, c.b);
    }
  };
  const m = new THREE.Matrix4();

  // THE MANE: two layers of blades, the back one longer.
  const rand = seeded(23);
  for (const [layer, count, z, lo, hi, base] of [
    [0, 22, -7, 54, 70, 17],
    [1, 20, -4, 36, 46, 14],
  ] as const) {
    for (let i = 0; i < count; i++) {
      const a = MANE_FROM + ((MANE_TO - MANE_FROM) * (i + (layer ? 0.5 : 0))) / (count - (layer ? 0 : 1));
      if (a > MANE_TO) continue;
      const len = lo + rand() * (hi - lo);
      const sh = blade(len, base);
      // Swept a little, like the logo's mane - each blade curling back.
      m.makeTranslation(C.x + Math.cos(a) * MANE_R, C.y + Math.sin(a) * MANE_R, z)
        .multiply(new THREE.Matrix4().makeRotationZ(a - Math.PI / 2 + 0.18));
      const g = new THREE.ShapeGeometry(sh, 6).applyMatrix4(m);
      const col = maneColour(a).clone();
      colourGeo(g, (y, x) => tmp.copy(col).multiplyScalar(0.72 + 0.28 * Math.min(1, Math.hypot(x - C.x, y - C.y) / 80)));
      outline(sh.getPoints(8), m, col.clone().lerp(new THREE.Color("#ffffff"), 0.15).multiplyScalar(1.2));
    }
  }

  // THE FACE, with the mouth cut out of it.
  const face = new THREE.Shape(
    (
      [
        [0, 60], [12, 59], [20, 55], [26, 46], [29, 34], [28, 22], [24, 10], [18, 0], [12, -6], [0, -8],
        [-12, -6], [-18, 0], [-24, 10], [-28, 22], [-29, 34], [-26, 46], [-20, 55], [-12, 59],
      ] as const
    ).map(([x, y]) => new THREE.Vector2(x, y)),
  );
  const mouth = new THREE.Path();
  const MW = 13;
  const MB = -1;
  const MT = 21;
  mouth.moveTo(-MW + 5, MB);
  mouth.lineTo(MW - 5, MB);
  mouth.quadraticCurveTo(MW, MB, MW, MB + 5);
  mouth.lineTo(MW, MT - 5);
  mouth.quadraticCurveTo(MW, MT, MW - 5, MT);
  mouth.lineTo(-MW + 5, MT);
  mouth.quadraticCurveTo(-MW, MT, -MW, MT - 5);
  mouth.lineTo(-MW, MB + 5);
  mouth.quadraticCurveTo(-MW, MB, -MW + 5, MB);
  face.holes.push(mouth);
  const orangeTop = new THREE.Color("#FFA23A");
  const orangeLow = new THREE.Color("#FF5A2B");
  const faceGeo = new THREE.ExtrudeGeometry(face, { depth: 6, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 1.2, bevelSegments: 2, curveSegments: 8 });
  colourGeo(faceGeo, (y) => tmp.copy(orangeLow).lerp(orangeTop, THREE.MathUtils.clamp((y + 8) / 68, 0, 1)).multiplyScalar(0.62));
  m.makeTranslation(0, 0, 6 + 1.3);
  outline(face.getPoints(8), m, new THREE.Color("#FFC04A").multiplyScalar(1.25));
  outline(mouth.getPoints(8), m, new THREE.Color("#FF4FD8").multiplyScalar(1.3));

  // The ears, behind the face, pink inside.
  for (const sx of [-1, 1]) {
    const ear = new THREE.CircleGeometry(8.5, 24).translate(sx * 22, 57, -1);
    colourGeo(ear, tmp.copy(orangeTop).multiplyScalar(0.6));
    const inner = new THREE.CircleGeometry(4.6, 20).translate(sx * 22, 57.5, -0.6);
    colourGeo(inner, tmp.copy(MAGENTA).multiplyScalar(0.7));
  }

  // The nose, and the bridge of light up from it.
  const nose = new THREE.Shape([new THREE.Vector2(-7, 30), new THREE.Vector2(7, 30), new THREE.Vector2(0, 22)]);
  const noseGeo = new THREE.ExtrudeGeometry(nose, { depth: 2, bevelEnabled: false }).translate(0, 0, 7.4);
  colourGeo(noseGeo, new THREE.Color("#5A1030"));
  m.makeTranslation(0, 0, 9.5);
  outline(nose.getPoints(), m, new THREE.Color("#FF7A3A").multiplyScalar(1.2));
  outline([new THREE.Vector2(0, 30), new THREE.Vector2(0, 50)], m, new THREE.Color("#FFD27A").multiplyScalar(1.1), false);

  // Fierce eyes: slanted slits of white light under heavy brows.
  for (const sx of [-1, 1]) {
    const eye = new THREE.Shape(
      [
        [sx * 19, 40],
        [sx * 7, 36],
        [sx * 9, 41.5],
        [sx * 17, 43],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
    );
    const eg = new THREE.ShapeGeometry(eye).translate(0, 0, 7.6);
    colourGeo(eg, new THREE.Color("#FFF6E0"));
    m.makeTranslation(0, 0, 7.8);
    outline(
      [new THREE.Vector2(sx * 22, 47), new THREE.Vector2(sx * 5, 40)],
      m,
      new THREE.Color("#FFD27A").multiplyScalar(1.2),
      false,
    );
  }

  // Fangs, top and bottom, either side of the way in.
  for (const sx of [-1, 1]) {
    const up = new THREE.ConeGeometry(2.2, 7, 4).rotateZ(Math.PI).translate(sx * 8.8, MT - 3.2, 6.5);
    colourGeo(up, new THREE.Color("#FFFFFF").multiplyScalar(0.9));
    const lo = new THREE.ConeGeometry(1.8, 5, 4).translate(sx * 9.2, MB + 2.2, 6.5);
    colourGeo(lo, new THREE.Color("#FFFFFF").multiplyScalar(0.9));
  }

  const lines = new THREE.BufferGeometry();
  lines.setAttribute("position", new THREE.Float32BufferAttribute(edges, 3));
  lines.setAttribute("color", new THREE.Float32BufferAttribute(edgeCols, 3));
  return { fills, lines, mouth: { w: MW, b: MB, t: MT } };
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
    float fly = life * (10.0 + aSeed * 16.0);
    vec3 p = vec3(dir * (uR + fly), (aSeed - 0.5) * 6.0);
    p.y += life * life * 8.0;
    vCol = aCol;
    vFade = (1.0 - life) * smoothstep(0.0, 0.08, life);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (3.0 + aSeed * 4.0) * (260.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const SPARK_FRAG = /* glsl */ `
  varying vec3 vCol;
  varying float vFade;
  void main() {
    vec2 q = gl_PointCoord - 0.5;
    float a = exp(-dot(q, q) * 18.0) * vFade;
    gl_FragColor = vec4(vCol * 1.5 * a, a);
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
    const { fills, lines, mouth } = buildLion();
    const fill = new THREE.Mesh(mergeFlat(fills), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, side: THREE.DoubleSide }));
    fills.forEach((g) => g.dispose());
    const edge = new THREE.LineSegments(lines, new THREE.LineBasicMaterial({ vertexColors: true, toneMapped: false }));
    return { fill, edge, mouth };
  }, []);

  // The throat: a short tunnel behind the mouth, dark red inside, a
  // warm light at the end of it.
  const throat = useMemo(() => {
    const { w, b, t } = lion.mouth;
    const r = Math.max(w, (t - b) / 2) + 0.5;
    const geo = new THREE.CylinderGeometry(r, r * 0.8, 44, 32, 1, true).rotateX(Math.PI / 2).translate(0, (b + t) / 2, -18);
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#3a0b22"), side: THREE.BackSide, toneMapped: false });
    const light = new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffd9a0"), toneMapped: false });
    return { geo, mat, light, r: r * 0.8, y: (b + t) / 2 };
  }, [lion]);

  const label = useMemo(() => (typeof document === "undefined" ? null : finishLabel(cols)), [cols]);

  const sparks = useMemo(() => {
    const N = 420;
    const ang = new Float32Array(N);
    const seed = new Float32Array(N);
    const col = new Float32Array(N * 3);
    const pos = new Float32Array(N * 3);
    const rand = seeded(11);
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      ang[i] = MANE_FROM + rand() * (MANE_TO - MANE_FROM);
      seed[i] = rand();
      maneColour(ang[i], c);
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
      uniforms: { uTime: { value: 0 }, uR: { value: MANE_R + 48 } },
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
      lion.fill.geometry.dispose();
      (lion.fill.material as THREE.Material).dispose();
      lion.edge.geometry.dispose();
      (lion.edge.material as THREE.Material).dispose();
      throat.geo.dispose();
      throat.mat.dispose();
      throat.light.dispose();
      label?.dispose();
      sparks.geometry.dispose();
      (sparks.material as THREE.Material).dispose();
    },
    [lion, throat, label, sparks],
  );

  /* eslint-disable react-hooks/immutability -- colours and a uniform, set every frame */
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // It breathes: the fills and the neon swelling and settling, the
    // edges a beat behind - as if it's about to roar.
    const k = 0.5 + 0.5 * Math.sin(t * 1.6);
    (lion.fill.material as THREE.MeshBasicMaterial).color.setScalar(0.9 + 0.3 * k);
    (lion.edge.material as THREE.LineBasicMaterial).color.setScalar(0.85 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.6 - 0.9)));
    throat.light.color.setRGB(1, 0.85, 0.63).multiplyScalar(0.28 + 0.1 * k);
    (sparks.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <group ref={group} position={position} scale={LION_SCALE}>
      <primitive object={lion.fill} />
      <primitive object={lion.edge} />
      <mesh geometry={throat.geo} material={throat.mat} />
      <mesh position={[0, throat.y, -39]} material={throat.light}>
        <circleGeometry args={[throat.r, 32]} />
      </mesh>
      <primitive object={sparks} position={[C.x, C.y, -6]} />
      {label && (
        <mesh position={[0, C.y + MANE_R + 72, -6]}>
          <planeGeometry args={[46, 11.5]} />
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
