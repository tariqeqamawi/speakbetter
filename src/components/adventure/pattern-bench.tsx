"use client";

import { useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { hills } from "./road-geometry";
import { Bloom } from "./fx";

// A bench for the land's patterns of light: one patch of hills, the
// camera drifting over it, and a switch between the candidates - so a
// pattern can be judged moving, at the size it will be seen, before it
// goes anywhere near the road.

export const PATTERNS = [
  { id: 0, key: "grid", name: "Square grid", phase: "Now: S, T, Y", color: "#22d9f5", note: "The grid as it is today - squares of light, the land's default." },
  { id: 1, key: "dots", name: "Dots", phase: "Now: O · Own Your Stories", color: "#ffd60a", note: "A point of light where the lines would cross - a starfield laid over the dunes." },
  { id: 2, key: "lattice", name: "Uneven lattice", phase: "Now: R · Reveal Deeper Truths", color: "#ff4a2b", note: "The grid bent by slow waves, a diagonal through each cell - a web, no two cells alike." },
  { id: 3, key: "ripples", name: "Ripples", phase: "Proposed: S · Start With Awareness", color: "#1fe890", note: "Rings spreading slowly outward from points in the land, like a first breath - or a stone into still water." },
  { id: 4, key: "wave", name: "Sound wave", phase: "Proposed: T · Train Your Instrument", color: "#22d9f5", note: "Lines along the land that ripple like a waveform, the ripple travelling down them - a voice being tuned." },
  { id: 5, key: "radial", name: "Radiating lines", phase: "Proposed: Y · Your Impact", color: "#f53de0", note: "Lines fanning out from a point far ahead, all pointing the way - towards the city, towards the audience." },
  { id: 6, key: "hex", name: "Hexagons", phase: "Alternative for any phase", color: "#ff9500", note: "A honeycomb of light - more engineered, more futuristic than squares." },
  { id: 7, key: "contours", name: "Contour lines", phase: "Alternative for R or S", color: "#d11149", note: "Lines of equal height, like a topographic map - the shape of the land drawn by its own light." },
] as const;

const VERT = /* glsl */ `
  varying vec2 vGrid;
  varying vec3 vWorld;
  varying float vH;
  void main() {
    vGrid = position.xz / 3.0;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    vH = position.y;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const FRAG = /* glsl */ `
  uniform int uPattern;
  uniform vec3 uColor;
  uniform float uTime;
  varying vec2 vGrid;
  varying vec3 vWorld;
  varying float vH;

  // Distance, in screen pixels, from a value to its nearest whole step.
  float lineDist(float v) {
    return abs(fract(v - 0.5) - 0.5) / max(fwidth(v), 1e-4);
  }

  void main() {
    vec2 g = vGrid / 2.0;
    vec2 w = max(fwidth(g), vec2(1e-4));
    float px;
    float boost = 1.0;
    float tight = 0.0;
    if (uPattern == 0) {
      vec2 f = abs(fract(g - 0.5) - 0.5) / w;
      px = min(f.x, f.y);
    } else if (uPattern == 1) {
      vec2 d = (fract(g + 0.5) - 0.5) / w;
      px = max(length(d) - 2.2, 0.0);
      boost = 3.2; tight = 1.0;
    } else if (uPattern == 2) {
      vec2 b = g + 0.28 * vec2(sin(g.y * 1.3 + g.x * 0.4), sin(g.x * 1.1 - g.y * 0.6));
      vec2 wb = max(fwidth(b), vec2(1e-4));
      vec2 fb = abs(fract(b - 0.5) - 0.5) / wb;
      px = min(min(fb.x, fb.y), lineDist(b.x - b.y * 0.7));
    } else if (uPattern == 3) {
      // Rings round a few centres, slowly spreading.
      vec2 c1 = vec2(6.0, -10.0), c2 = vec2(-12.0, -26.0), c3 = vec2(14.0, -40.0);
      float r = min(min(length(g - c1), length(g - c2)), length(g - c3));
      px = lineDist(r * 0.9 - uTime * 0.25);
    } else if (uPattern == 4) {
      // Lines across the land, each a waveform, the ripple travelling.
      float y = g.y + 0.35 * sin(g.x * 1.6 - uTime * 1.2) * sin(g.x * 0.37 + g.y * 0.2);
      px = lineDist(y);
    } else if (uPattern == 5) {
      // Rays from a point far ahead, and rings of distance across them.
      vec2 v = g - vec2(0.0, -80.0);
      float ang = atan(v.x, -v.y) * 90.0;
      px = min(lineDist(ang), lineDist(length(v) * 0.5) * 1.8);
    } else if (uPattern == 6) {
      // Hexagons: distance to the nearest hex edge.
      vec2 p = g * 1.1;
      vec2 s = vec2(1.0, 1.7320508);
      vec2 a = mod(p, s) - s * 0.5;
      vec2 b = mod(p - s * 0.5, s) - s * 0.5;
      vec2 h = dot(a, a) < dot(b, b) ? a : b;
      h = abs(h);
      float e = 0.5 - max(dot(h, normalize(s)), h.x);
      px = e / max(fwidth(p.x), 1e-4);
    } else {
      // Contours: lines of equal height.
      // Flat ground has no contours: nothing to measure there.
      float fw = fwidth(vH);
      px = fw < 1e-3 ? 99.0 : lineDist(vH * 0.35 + 0.5);
    }
    float core = 1.0 - smoothstep(0.0, 1.4, px);
    float halo = exp(-px * mix(0.5, 1.4, tight));
    float haloWide = exp(-px * mix(0.22, 0.9, tight));

    // The wave of light rolling through, as on the road.
    float front = mod(uTime, 4.0) * 20.0;
    float d = -vGrid.y * 3.0 / 3.0 - front * 3.0;
    float wave = exp(-d * d / 60.0);

    vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
    if (n.y < 0.0) n = -n;
    vec3 L = normalize(vec3(-0.25, 0.75, -0.6));
    vec3 col = vec3(0.010, 0.014, 0.030) * (0.35 + 0.9 * max(dot(n, L), 0.0));
    col += uColor * 0.035 * haloWide;
    float rest = (0.02 * halo + 0.16 * core) * boost;
    float lit = wave * (1.2 * core + 0.5 * halo + 0.25 * haloWide);
    col += uColor * (rest + lit * 1.6);
    float fog = 1.0 - exp(-0.00003 * dot(vWorld - cameraPosition, vWorld - cameraPosition));
    gl_FragColor = vec4(mix(col, vec3(0.024, 0.043, 0.11), fog), 1.0);
  }
`;

function Land({ pattern, color }: { pattern: number; color: string }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(260, 260, 180, 180);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const away = THREE.MathUtils.smoothstep(Math.abs(x), 6, 60);
      p.setY(i, away * (hills(x, z) * 30 - 4) + away * away * 6);
    }
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        side: THREE.DoubleSide,
        uniforms: { uPattern: { value: 0 }, uColor: { value: new THREE.Color() }, uTime: { value: 0 } },
      }),
    [],
  );
  /* eslint-disable react-hooks/immutability */
  useFrame(({ clock, camera }) => {
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uPattern.value = pattern;
    (mat.uniforms.uColor.value as THREE.Color).set(color);
    // Drift slowly forward over the land, as if travelling the road.
    const z = 60 - ((clock.elapsedTime * 3) % 60);
    camera.position.set(0, 8, z);
    camera.lookAt(0, 1.5, z - 30);
  });
  /* eslint-enable react-hooks/immutability */
  return <mesh geometry={geo} material={mat} />;
}

export function PatternBench() {
  const [at, setAt] = useState(3);
  const p = PATTERNS[at];
  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-navy-700 bg-[#03060d] sm:aspect-video">
        <Canvas flat dpr={[1, 1.5]} camera={{ fov: 62, near: 0.1, far: 600 }} onCreated={({ scene }) => (scene.background = new THREE.Color("#060b1c"))}>
          <Land pattern={p.id} color={p.color} />
          <Bloom />
        </Canvas>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-1 bg-gradient-to-b from-[#070c18]/90 to-transparent p-4 pb-10 text-center">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.3em]" style={{ color: p.color }}>
            {p.phase}
          </span>
          <span className="text-xl font-bold text-ink">{p.name}</span>
        </div>
      </div>
      <p className="text-center text-sm text-ink-muted text-balance">{p.note}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PATTERNS.map((q, i) => (
          <button
            key={q.key}
            type="button"
            onClick={() => setAt(i)}
            aria-pressed={i === at}
            className="rounded-xl border px-3 py-2.5 text-left text-sm transition-colors"
            style={{ borderColor: i === at ? q.color : "var(--color-navy-600)", background: i === at ? `${q.color}1f` : undefined }}
          >
            <span className="block font-bold text-ink">{q.name}</span>
            <span className="block text-[0.7rem] text-ink-faint">{q.phase}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
