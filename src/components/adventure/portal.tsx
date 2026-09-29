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
  uniform float uCore;
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
    col += mix(uColor, vec3(1.0), 0.55) * core * 0.65 * uCore;
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
  t.anisotropy = 8;
  return t;
}

/** A soft round pool of light, for the road under a portal. */
let poolTex: THREE.Texture | null = null;
function pool() {
  if (poolTex || typeof document === "undefined") return poolTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,0.85)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.35)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  poolTex = new THREE.CanvasTexture(c);
  return poolTex;
}

/** The rim of a portal that can't be entered yet. */
const SHUT_RIM = new THREE.Color("#2b303b");

/** The number, floating at the eye of the vortex. */
function numberTex(n: number, state: PortalState) {
  return canvasTex(256, 256, (g) => {
    // A solid dark disc for the number to sit in - the vortex glows
    // around it, not through it - and a plain white number, no glow, so
    // it reads even when you're moving fast.
    g.beginPath();
    g.arc(128, 128, 104, 0, Math.PI * 2);
    g.fillStyle = "rgb(5,8,16)";
    g.fill();
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = "800 132px system-ui, sans-serif";
    g.fillStyle = state === "locked" ? "#5a6282" : "#ffffff";
    g.fillText(String(n), 128, 138);
  });
}

/** The banner above the portal: the challenge's name, and its score once
 *  passed. */
/** The calm view's name on the road: big, up to two lines, white with a
 *  dark edge so it reads on any colour of road from high above. */
function flatNameTex(title: string, hex: string, shut: boolean) {
  return canvasTex(1024, 320, (g) => {
    g.font = "800 104px system-ui, sans-serif";
    // Two lines, split where they come out most even; then the size that
    // fits the longer one across.
    const words = title.split(/\s+/);
    let lines = [title];
    let best = g.measureText(title).width;
    for (let i = 1; i < words.length && best > 940; i++) {
      const pair = [words.slice(0, i).join(" "), words.slice(i).join(" ")];
      const w = Math.max(...pair.map((l) => g.measureText(l).width));
      if (w < best) {
        best = w;
        lines = pair;
      }
    }
    g.font = `800 ${Math.floor(Math.min(104, (104 * 940) / best))}px system-ui, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineJoin = "round";
    const ys = lines.length === 1 ? [160] : [100, 222];
    lines.forEach((l, i) => {
      g.lineWidth = 22;
      g.strokeStyle = "rgba(4,8,18,0.92)";
      g.strokeText(l, 512, ys[i]);
      g.fillStyle = shut ? "#8a93ad" : "#ffffff";
      g.fillText(l, 512, ys[i]);
    });
    // A bar of the section's colour under it.
    g.fillStyle = shut ? "#3a4260" : hex;
    g.fillRect(412, lines.length === 1 ? 240 : 296, 200, 14);
  });
}

function bannerTex(title: string, hex: string, state: PortalState, score?: number, dormant = false) {
  return canvasTex(1024, 200, (g) => {
    const dim = state === "locked" && !dormant;
    g.beginPath();
    g.roundRect(6, 6, 1012, 188, 40);
    g.fillStyle = "rgb(4,8,18)";
    g.fill();
    g.lineWidth = 6;
    g.strokeStyle = dim ? "#3a4260" : dormant ? `${hex}80` : hex;
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
    g.fillStyle = dim ? "#6a7390" : dormant ? "#aab2c8" : "#f4f6ff";
    g.font = "700 56px system-ui, sans-serif";
    let text = title;
    const room = 1000 - x - 30;
    while (g.measureText(text).width > room && text.length > 6) text = text.slice(0, -2).trimEnd() + "…";
    g.fillText(text, x, 102);
  });
}

/** The calm view's portals lie flat on the road, three times the size,
 *  so from high above each one is a full circle you can't miss. */
export const PORTAL_FLAT_SCALE = 3;
export const PORTAL_FLAT_Y = 1.1;
/** How high a standing portal's centre is above the road - clear of it
 *  even where the road rises into a dip beyond. */
export const PORTAL_Y = 3.7;

export function Portal({
  road,
  s,
  n,
  title,
  state,
  colour,
  score,
  dormant = false,
  flat = false,
}: {
  road: RoadLayout;
  s: number;
  n: number;
  title: string;
  state: PortalState;
  colour: THREE.Color;
  score?: number;
  /** In a section the student has not reached yet: its ring in the
   *  section's colour and its name, and nothing else - no vortex, no
   *  number. Only the section they are in has live portals. */
  dormant?: boolean;
  /** The calm view: flat on the road, facing up, and three times the size. */
  flat?: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.MeshBasicMaterial>(null);
  const bannerMat = useRef<THREE.MeshBasicMaterial>(null);
  const numMat = useRef<THREE.MeshBasicMaterial>(null);
  const { position, facing } = useMemo(() => {
    const y = flat ? PORTAL_FLAT_Y : PORTAL_Y;
    const p = pointAt(road, s).add(new THREE.Vector3(0, y, 0));
    const f = pointAt(road, s - 1).add(new THREE.Vector3(0, y, 0));
    // (Flat: turned only about the upright, so it lies level.)
    if (flat) f.y = p.y;
    return { position: p, facing: f };
  }, [road, s, flat]);
  useEffect(() => {
    group.current?.lookAt(facing);
  }, [facing]);

  const hex = `#${colour.getHexString()}`;
  // Can't be entered yet - in a section not reached, or locked: near-black
  // and grey, so the open ones stand out. Open and not yet done: a white
  // rim and a bright eye - obvious. Done: rimmed in its section's colour.
  const ahead = state === "locked" || state === "ahead";
  const shut = dormant || ahead;
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
          uColor: {
            value: shut
              ? new THREE.Color("#0c0f16")
              : state === "here"
                ? colour.clone().lerp(new THREE.Color("#ffffff"), 0.55)
                : colour.clone(),
          },
          uSpeed: { value: shut ? 0.15 : state === "here" ? 3.2 : 1.4 },
          uPower: { value: shut ? 0.45 : state === "here" ? 1.15 : 0.85 },
          uFade: { value: 1 },
          // A shut portal has no light at its eye.
          uCore: { value: shut ? 0 : 1 },
        },
      }),
    [colour, shut, state],
  );
  const numMap = useMemo(() => numberTex(n, ahead ? "locked" : state), [n, ahead, state]);
  const banner = useMemo(() => bannerTex(title, hex, state, score, dormant), [title, hex, state, score, dormant]);
  const flatName = useMemo(() => (flat ? flatNameTex(title, hex, shut) : null), [flat, title, hex, shut]);

  /* eslint-disable react-hooks/immutability */
  useFrame(({ clock, camera }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
    const d = camera.position.distanceTo(position);
    // Thin out as you arrive, so you go through the portal, not into it.
    const near = flat ? 1 : THREE.MathUtils.smoothstep(d, 3, 10);
    material.uniforms.uFade.value = near;
    if (numMat.current) numMat.current.opacity = dormant ? 0 : near;
    // The name: faint far off, fully solid as you come up to the portal
    // so it reads clearly beside you, and gone as you pass through.
    if (bannerMat.current)
      bannerMat.current.opacity = (1 - THREE.MathUtils.smoothstep(d, 16, 34)) * THREE.MathUtils.smoothstep(d, 2.5, 5);
    // The one to do breathes, white all but a touch.
    if (ring.current && state === "here" && !dormant) {
      const k = 0.85 + Math.sin(clock.elapsedTime * 2.4) * 0.15;
      ring.current.color.copy(colour).lerp(new THREE.Color("#ffffff"), k);
    }
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <group ref={group} position={position}>
      {/* (Flat: the disc laid face up, the number's top pointing on down
          the road, and all of it three times the size.) */}
      <group rotation={flat ? [-Math.PI / 2, 0, 0] : [0, 0, 0]} scale={flat ? PORTAL_FLAT_SCALE : 1}>
      <mesh material={material}>
        <circleGeometry args={[2.4, 64]} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[1.9, 1.9]} />
        <meshBasicMaterial ref={numMat} map={numMap} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[2.5, 0.09, 12, 72]} />
        <meshBasicMaterial
          ref={ring}
          color={shut ? SHUT_RIM : state === "here" ? "#ffffff" : colour}
          toneMapped={false}
        />
      </mesh>
      {/* The portal lights the road beneath it: a pool of its glow on the
          ground, white under an open one, its colour under a done one -
          like light on wet tarmac. None under a shut one. */}
      </group>
      {!shut && !flat && (
        <mesh position={[0, 0.05 - PORTAL_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[9, 9]} />
          <meshBasicMaterial
            map={pool()}
            color={state === "here" ? "#ffffff" : colour}
            transparent
            opacity={state === "here" ? 0.55 : 0.35}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      )}
      {/* The calm view: the challenge's name laid flat on the road just
          beyond the portal, big enough to read from high above, its top
          pointing on down the road. */}
      {flat && (
        <mesh position={[0, 1.2 - PORTAL_FLAT_Y, -(2.5 * PORTAL_FLAT_SCALE + 8)]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[46, 14.4]} />
          {/* (Not hidden by the land where it runs past the road's edges.) */}
          <meshBasicMaterial map={flatName} transparent opacity={0.96} depthTest={false} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      )}
      {!flat && (
      <mesh position={[0, 3.35, 0]}>
        <planeGeometry args={[5.6, 1.09]} />
        <meshBasicMaterial ref={bannerMat} map={banner} transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      )}
    </group>
  );
}
