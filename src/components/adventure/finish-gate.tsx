"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { pointAt, seeded, type RoadLayout } from "./road-geometry";

/** "FINISH", drawn once onto a canvas: white letters with a glow that
 *  runs through every section's colour. */
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
  // The glow, twice over, then the letters.
  g.shadowColor = "rgba(255,255,255,0.9)";
  for (const blur of [60, 28]) {
    g.shadowBlur = blur;
    g.fillStyle = grad;
    g.fillText("FINISH", 512, 132);
  }
  g.shadowBlur = 0;
  g.fillStyle = "#ffffff";
  g.fillText("FINISH", 512, 132);
  // A coloured core inside each white letter, so the bloom doesn't turn
  // the word into one white glare.
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

// The sparks pouring off the finish arch: each leaves a point on the arch,
// drifts out and up and fades, and is reborn - all in the shader, so a few
// hundred cost nothing.
const FINISH_SPARK_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uR;
  attribute float aAngle;
  attribute float aSeed;
  attribute vec3 aCol;
  varying vec3 vCol;
  varying float vFade;
  void main() {
    float life = fract(uTime * (0.22 + aSeed * 0.25) + aSeed * 7.0);
    vec2 dir = vec2(cos(aAngle), sin(aAngle));
    float fly = life * (5.0 + aSeed * 7.0);
    vec3 p = vec3(dir * (uR + fly * 0.6), (aSeed - 0.5) * 2.0 + sin(aSeed * 40.0) * fly);
    p.y += life * life * 4.0;
    vCol = aCol;
    vFade = (1.0 - life) * smoothstep(0.0, 0.08, life);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (2.0 + aSeed * 3.0) * (260.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const FINISH_SPARK_FRAG = /* glsl */ `
  varying vec3 vCol;
  varying float vFade;
  void main() {
    vec2 q = gl_PointCoord - 0.5;
    float a = exp(-dot(q, q) * 18.0) * vFade;
    gl_FragColor = vec4(vCol * 1.6 * a, a);
  }
`;

/** THE FINISH: a great arch of light over the road in all five colours,
 *  the colours chasing round it, sparks pouring off it, a ring of light
 *  behind it and FINISH written above - the victory stretch's last word. */
export function FinishGate({ road, cols: given }: { road: RoadLayout; cols: THREE.Color[] }) {
  const R = 12;
  const { position, facing } = useMemo(() => {
    const p = pointAt(road, road.finish);
    return { position: p, facing: pointAt(road, road.finish - 1) };
  }, [road]);
  const group = useRef<THREE.Group>(null);
  useEffect(() => {
    group.current?.lookAt(facing.x, position.y, facing.z);
  }, [facing, position]);
  const cols = given;
  // The arch in many short segments, so the colours can chase round it.
  const SEG = 40;
  const A0 = -0.22;
  const A1 = Math.PI + 0.22;
  const segs = useMemo(
    () =>
      Array.from({ length: SEG }, (_, i) => {
        const mat = new THREE.MeshBasicMaterial({ toneMapped: false });
        const geo = new THREE.TorusGeometry(R, 0.55, 10, 6, (A1 - A0) / SEG + 0.01);
        return { mat, geo, rot: A0 + ((A1 - A0) * i) / SEG };
      }),
    [A0, A1],
  );
  const halo = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    [],
  );
  const label = useMemo(() => (typeof document === "undefined" ? null : finishLabel(cols)), [cols]);
  const sparks = useMemo(() => {
    const N = 520;
    const ang = new Float32Array(N);
    const seed = new Float32Array(N);
    const col = new Float32Array(N * 3);
    const pos = new Float32Array(N * 3);
    const rand = seeded(11);
    for (let i = 0; i < N; i++) {
      ang[i] = A0 + rand() * (A1 - A0);
      seed[i] = rand();
      const c = cols[Math.floor(((ang[i] - A0) / (A1 - A0)) * cols.length) % cols.length] ?? cols[0];
      col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aAngle", new THREE.BufferAttribute(ang, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aCol", new THREE.BufferAttribute(col, 3));
    const m = new THREE.ShaderMaterial({
      vertexShader: FINISH_SPARK_VERT,
      fragmentShader: FINISH_SPARK_FRAG,
      uniforms: { uTime: { value: 0 }, uR: { value: R } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const pts = new THREE.Points(g, m);
    pts.frustumCulled = false;
    return pts;
  }, [cols, A0, A1]);
  useEffect(
    () => () => {
      segs.forEach((s) => {
        s.mat.dispose();
        s.geo.dispose();
      });
      halo.dispose();
      label?.dispose();
      sparks.geometry.dispose();
      (sparks.material as THREE.Material).dispose();
    },
    [segs, halo, label, sparks],
  );
  const tmp = useMemo(() => new THREE.Color(), []);
  /* eslint-disable react-hooks/immutability -- colours and a uniform, set every frame */
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const n = cols.length;
    segs.forEach((s, i) => {
      // The colours chase round the arch, a bright pulse riding them.
      const u = (i / SEG) * n - t * 0.8;
      const k = Math.floor(u);
      const f = u - k;
      const a = cols[((k % n) + n) % n];
      const b = cols[(((k + 1) % n) + n) % n];
      const pulse = 1.1 + 0.9 * Math.pow(0.5 + 0.5 * Math.sin(t * 3 - i * 0.5), 6);
      s.mat.color.copy(tmp.copy(a).lerp(b, THREE.MathUtils.smoothstep(f, 0.6, 1))).multiplyScalar(pulse);
    });
    halo.opacity = 0.18 + 0.1 * Math.sin(t * 2.2);
    (sparks.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
  });
  /* eslint-enable react-hooks/immutability */
  return (
    <group ref={group} position={position}>
      {segs.map((s, i) => (
        <mesh key={i} geometry={s.geo} material={s.mat} rotation={[0, 0, s.rot]} />
      ))}
      {/* A soft ring of light behind it. */}
      <mesh material={halo} position={[0, 0, -1.2]} rotation={[0, 0, A0]}>
        <torusGeometry args={[R + 1.6, 1.4, 8, 64, A1 - A0]} />
      </mesh>
      <mesh material={halo} position={[0, 0, 1.2]} rotation={[0, 0, A0]}>
        <torusGeometry args={[R - 1.4, 0.35, 8, 64, A1 - A0]} />
      </mesh>
      <primitive object={sparks} />
      {label && (
        <mesh position={[0, R + 5.2, 0]}>
          <planeGeometry args={[22, 5.5]} />
          {/* Dimmed, so it glows rather than glares. */}
          <meshBasicMaterial map={label} color="#b4b4b4" transparent toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}
      {[-R * Math.cos(A0), R * Math.cos(A0)].map((x) => (
        <mesh key={x} position={[x, -0.4, 0]}>
          <cylinderGeometry args={[1.1, 1.5, 1.2, 16]} />
          <meshStandardMaterial color="#1a2340" />
        </mesh>
      ))}
    </group>
  );
}


/** How long the ring tunnel into the finish is. */
export const FINISH_TUNNEL = 720;
const RING_GAP = 4.5;

const RING_VERT = /* glsl */ `
  attribute float aK;
  varying float vK;
  void main() {
    vK = aK;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;
// Each ring its colour from the palette, the colours chasing down the
// tunnel toward the finish, a bright pulse racing through them.
const RING_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCols[5];
  varying float vK;
  void main() {
    float u = vK * 0.35 - uTime * 2.2;
    float f = fract(u / 5.0) * 5.0;
    int i = int(floor(f));
    vec3 a = uCols[0];
    vec3 b = uCols[1];
    for (int k = 0; k < 5; k++) {
      if (k == i) a = uCols[k];
      if (k == (i + 1) - (i + 1) / 5 * 5) b = uCols[k];
    }
    vec3 c = mix(a, b, smoothstep(0.7, 1.0, fract(f)));
    float pulse = 0.75 + 0.8 * pow(0.5 + 0.5 * sin(vK * 0.5 - uTime * 9.0), 8.0);
    gl_FragColor = vec4(c * pulse, 1.0);
  }
`;

// THE VORTEX at the tunnel's end: a funnel of every section's colour
// spiralling away into the distance, spinning - the challenge portals'
// swirl, in all the colours, drawn down a long cone so it seems to go on
// for ever.
const VORTEX_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const VORTEX_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCols[5];
  varying vec2 vUv;
  void main() {
    // Round the funnel, and down it (0 at its mouth, 1 far off).
    float around = vUv.x;
    float deep = 1.0 - vUv.y;
    float sw = around * 3.0 + deep * 9.0 - uTime * 1.3;
    float f = fract(sw / 5.0) * 5.0;
    int i = int(floor(f));
    vec3 a = uCols[0];
    vec3 b = uCols[1];
    for (int k = 0; k < 5; k++) {
      if (k == i) a = uCols[k];
      if (k == (i + 1) - (i + 1) / 5 * 5) b = uCols[k];
    }
    vec3 c = mix(a, b, smoothstep(0.55, 1.0, fract(f)));
    float streak = 0.55 + 0.45 * sin(sw * 6.2831853 * 2.0);
    // Brighter into the depths, to a white-hot eye.
    float glow = 0.45 + 0.8 * pow(deep, 3.0);
    vec3 col = mix(c * streak * glow, vec3(1.0), smoothstep(0.94, 1.0, deep) * 0.8);
    gl_FragColor = vec4(col, 1.0);
  }
`;

/** THE WAY INTO THE FINISH: a tunnel of rings, one after another, tight -
 *  every section's colour chasing down it and a pulse of light racing
 *  through - that you shoot along like a jump to hyperspace. FINISH hangs
 *  over its far end. */
export function FinishTunnel({ road, cols }: { road: RoadLayout; cols: THREE.Color[] }) {
  const rings = useMemo(() => {
    const n = Math.floor(FINISH_TUNNEL / RING_GAP);
    const geo = new THREE.TorusGeometry(11, 0.32, 8, 64);
    const k = new Float32Array(n);
    for (let i = 0; i < n; i++) k[i] = i;
    geo.setAttribute("aK", new THREE.InstancedBufferAttribute(k, 1));
    const palette = [0, 1, 2, 3, 4].map((i) => (cols[i] ?? cols[0] ?? new THREE.Color("#ffffff")).clone().multiplyScalar(1.3));
    const mat = new THREE.ShaderMaterial({
      vertexShader: RING_VERT,
      fragmentShader: RING_FRAG,
      uniforms: { uTime: { value: 0 }, uCols: { value: palette } },
      toneMapped: false,
    });
    const mesh = new THREE.InstancedMesh(geo, mat, n);
    const o = new THREE.Object3D();
    const p = new THREE.Vector3();
    const q = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const s = road.finish - FINISH_TUNNEL + i * RING_GAP;
      pointAt(road, s, p);
      pointAt(road, s + 1, q);
      o.position.set(p.x, p.y + 3.5, p.z);
      o.lookAt(q.x, q.y + 3.5, q.z);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    return mesh;
  }, [road, cols]);
  useEffect(
    () => () => {
      rings.geometry.dispose();
      (rings.material as THREE.Material).dispose();
    },
    [rings],
  );
  /* eslint-disable react-hooks/immutability -- a uniform, set every frame */
  useFrame(({ clock }) => {
    (rings.material as THREE.ShaderMaterial).uniforms.uTime.value = clock.elapsedTime;
  });
  /* eslint-enable react-hooks/immutability */
  const label = useMemo(() => (typeof document === "undefined" ? null : finishLabel(cols)), [cols]);
  useEffect(() => () => label?.dispose(), [label]);
  const vortex = useMemo(() => {
    const palette = [0, 1, 2, 3, 4].map((i) => (cols[i] ?? cols[0] ?? new THREE.Color("#ffffff")).clone().multiplyScalar(0.9));
    // A long open cone, its mouth round the road and its tip far beyond,
    // lying along the road (its axis along -z in the group's frame).
    const geo = new THREE.ConeGeometry(11.5, 150, 64, 24, true).rotateX(-Math.PI / 2).translate(0, 0, -75);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VORTEX_VERT,
      fragmentShader: VORTEX_FRAG,
      uniforms: { uTime: { value: 0 }, uCols: { value: palette } },
      side: THREE.BackSide,
      toneMapped: false,
    });
    return new THREE.Mesh(geo, mat);
  }, [cols]);
  useEffect(
    () => () => {
      vortex.geometry.dispose();
      (vortex.material as THREE.Material).dispose();
    },
    [vortex],
  );
  /* eslint-disable react-hooks/immutability -- the vortex, turned every frame */
  useFrame(({ clock }) => {
    (vortex.material as THREE.ShaderMaterial).uniforms.uTime.value = clock.elapsedTime;
    vortex.rotation.z = clock.elapsedTime * 0.6;
  });
  /* eslint-enable react-hooks/immutability */
  const { position, facing } = useMemo(() => ({ position: pointAt(road, road.finish), facing: pointAt(road, road.finish - 1) }), [road]);
  const group = useRef<THREE.Group>(null);
  useEffect(() => {
    group.current?.lookAt(facing.x, position.y, facing.z);
  }, [facing, position]);
  return (
    <>
      <primitive object={rings} />
      {/* (The group looks back down the road: +z toward the traveller.) */}
      <group ref={group} position={position}>
        <group position={[0, 3.5, 0]}>
          <primitive object={vortex} />
        </group>
        {label && (
          <mesh position={[0, 24, 0]}>
            <planeGeometry args={[56, 14]} />
            <meshBasicMaterial map={label} color="#d0d0d0" transparent toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    </>
  );
}
