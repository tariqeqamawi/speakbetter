"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { pointAt, type RoadLayout } from "./road-geometry";

// A checkpoint as a portal: a vortex swirling in its phase's neon, the
// challenge's number floating at its centre, a lit ring round it and a
// banner above with the challenge's name. The one you are on turns fast
// and bright; the passed ones turn calmly; the locked ones barely turn,
// grey, the way a door that is shut looks shut.

export type PortalState = "done" | "here" | "ahead" | "locked";

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// The vortex: bands winding inward round the centre, drawn from polar
// coordinates, turning with time, bright at the rim and white-hot at
// the core - a hole in the world rather than a picture of one.
const FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uSpeed;
  uniform float uPower;
  uniform float uFade;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    if (r > 1.0) discard;
    float a = atan(p.y, p.x);
    float swirl = a * 3.0 + (1.0 - r) * 9.0 - uTime * uSpeed;
    float bands = 0.5 + 0.5 * sin(swirl);
    float fine = 0.5 + 0.5 * sin(swirl * 2.7 + uTime * uSpeed * 0.6);
    float rim = smoothstep(0.55, 1.0, r);
    float core = smoothstep(0.45, 0.0, r);
    vec3 col = uColor * (0.15 + bands * 0.9 + fine * 0.25) * (0.35 + rim * 0.9);
    col += mix(uColor, vec3(1.0), 0.55) * core * 0.65;
    col *= uPower;
    float alpha = smoothstep(1.0, 0.94, r) * uFade;
    gl_FragColor = vec4(col, alpha);
  }
`;

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** The number, floating at the eye of the vortex. */
function numberTex(n: number, state: PortalState) {
  return canvasTex(256, 256, (g) => {
    // A dark eye for the number to sit in, so it reads against the
    // brightest part of the vortex.
    const eye = g.createRadialGradient(128, 128, 20, 128, 128, 120);
    eye.addColorStop(0, "rgba(3,6,14,0.85)");
    eye.addColorStop(0.7, "rgba(3,6,14,0.6)");
    eye.addColorStop(1, "rgba(3,6,14,0)");
    g.fillStyle = eye;
    g.fillRect(0, 0, 256, 256);
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = "800 150px system-ui, sans-serif";
    g.shadowColor = "rgba(0,0,0,0.85)";
    g.shadowBlur = 24;
    g.fillStyle = state === "locked" ? "#5a6282" : "#ffffff";
    g.fillText(String(n), 128, 138);
  });
}

/** The banner above the portal: the challenge's name, and its score once
 *  passed. */
function bannerTex(title: string, hex: string, state: PortalState, score?: number) {
  return canvasTex(1024, 200, (g) => {
    const dim = state === "locked";
    g.beginPath();
    g.roundRect(6, 6, 1012, 188, 40);
    g.fillStyle = "rgba(4,8,18,0.88)";
    g.fill();
    g.lineWidth = 6;
    g.strokeStyle = dim ? "#3a4260" : hex;
    g.stroke();
    g.textBaseline = "middle";
    let x = 44;
    if (state === "done" && score !== undefined) {
      g.fillStyle = hex;
      g.font = "800 64px system-ui, sans-serif";
      g.fillText(String(score), x, 102);
      x += g.measureText(String(score)).width + 28;
      g.fillStyle = "#3a4260";
      g.fillRect(x - 14, 52, 4, 96);
      x += 16;
    }
    g.fillStyle = dim ? "#6a7390" : "#f4f6ff";
    g.font = "700 56px system-ui, sans-serif";
    let text = title;
    const room = 1000 - x - 30;
    while (g.measureText(text).width > room && text.length > 6) text = text.slice(0, -2).trimEnd() + "…";
    g.fillText(text, x, 102);
  });
}

export function Portal({
  road,
  s,
  n,
  title,
  state,
  colour,
  score,
}: {
  road: RoadLayout;
  s: number;
  n: number;
  title: string;
  state: PortalState;
  colour: THREE.Color;
  score?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.MeshBasicMaterial>(null);
  const bannerMat = useRef<THREE.MeshBasicMaterial>(null);
  const numMat = useRef<THREE.MeshBasicMaterial>(null);
  const { position, facing } = useMemo(() => {
    const p = pointAt(road, s).add(new THREE.Vector3(0, 3.3, 0));
    return { position: p, facing: pointAt(road, s - 1).add(new THREE.Vector3(0, 3.3, 0)) };
  }, [road, s]);
  useEffect(() => {
    group.current?.lookAt(facing);
  }, [facing]);

  const hex = `#${colour.getHexString()}`;
  const locked = state === "locked" || state === "ahead";
  const grey = useMemo(() => new THREE.Color("#4a5270"), []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: locked ? grey.clone() : colour.clone() },
          uSpeed: { value: state === "here" ? 3.2 : state === "done" ? 1.4 : 0.4 },
          uPower: { value: state === "here" ? 1.05 : state === "done" ? 0.8 : 0.3 },
          uFade: { value: 1 },
        },
      }),
    [colour, grey, locked, state],
  );
  const numMap = useMemo(() => numberTex(n, locked ? "locked" : state), [n, locked, state]);
  const banner = useMemo(() => bannerTex(title, hex, locked ? "locked" : state, score), [title, hex, locked, state, score]);

  /* eslint-disable react-hooks/immutability */
  useFrame(({ clock, camera }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
    const d = camera.position.distanceTo(position);
    // Thin out as you arrive, so you go through the portal, not into it.
    const near = THREE.MathUtils.smoothstep(d, 3, 10);
    material.uniforms.uFade.value = near;
    if (numMat.current) numMat.current.opacity = near;
    if (bannerMat.current) bannerMat.current.opacity = THREE.MathUtils.smoothstep(d, 9, 16);
    if (ring.current && state === "here") {
      const k = 0.6 + Math.sin(clock.elapsedTime * 2.4) * 0.4;
      ring.current.color.copy(colour).lerp(new THREE.Color("#ffffff"), k);
    }
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <group ref={group} position={position}>
      <mesh material={material}>
        <circleGeometry args={[2.4, 64]} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[1.9, 1.9]} />
        <meshBasicMaterial ref={numMat} map={numMap} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[2.5, 0.09, 12, 72]} />
        <meshBasicMaterial ref={ring} color={locked ? grey : state === "here" ? "#ffffff" : colour} toneMapped={false} />
      </mesh>
      <mesh position={[0, 3.35, 0]}>
        <planeGeometry args={[5.6, 1.09]} />
        <meshBasicMaterial ref={bannerMat} map={banner} transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}
