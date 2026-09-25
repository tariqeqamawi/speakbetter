"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AHEAD, pointAt, sideAt, type RoadLayout, type Travel } from "./road-geometry";

// What stands on and beside the road: the traveller and the neon line
// they leave behind them, the gates between the phases, the trophies
// won at checkpoints already passed, and what other students said.

export { AHEAD } from "./road-geometry";

/** Draw on a canvas once and hand it to the GPU as a texture - how every
 *  word in this world is written, since three.js has no text of its own. */
function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  draw(g);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function wrap(g: CanvasRenderingContext2D, text: string, width: number, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (g.measureText(next).width > width && line) {
      lines.push(line);
      line = w;
      if (lines.length === max) break;
    } else line = next;
  }
  if (lines.length < max && line) lines.push(line);
  if (lines.length === max && words.join(" ").length > lines.join(" ").length) {
    lines[max - 1] = lines[max - 1].replace(/\s*\S*$/, "") + "…";
  }
  return lines;
}

/** Fade anything in as the traveller approaches and out once it is behind. */
function nearness(camera: THREE.Camera, at: THREE.Vector3, close = 4, far = 120) {
  const d = camera.position.distanceTo(at);
  return THREE.MathUtils.smoothstep(d, close, close + 6) * (1 - THREE.MathUtils.smoothstep(d, far * 0.6, far));
}

/** The traveller: a disc with the student's picture, floating along the
 *  road, and the lit line it has drawn from the start to where it is. */
export function Traveller({
  road,
  travel,
  image,
  trail,
  colourAt,
}: {
  road: RoadLayout;
  travel: Travel;
  image: string;
  /** The road-hugging ribbons to reveal up to the traveller. */
  trail: THREE.BufferGeometry[];
  colourAt: (s: number) => THREE.Color;
}) {
  const disc = useRef<THREE.Group>(null);
  const ring = useRef<THREE.MeshBasicMaterial>(null);
  const map = useMemo(() => {
    const t = new THREE.TextureLoader().load(image);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [image]);
  const p = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock, camera }) => {
    const s = Math.min(travel.s + AHEAD, road.finish);
    pointAt(road, s, p);
    const bob = Math.sin(clock.elapsedTime * 2) * 0.12;
    if (travel.portal && disc.current) {
      // Through the portal: drawn into the eye of the vortex, turning
      // and shrinking to nothing.
      const k = THREE.MathUtils.smoothstep((performance.now() - travel.portal.since) / 1300, 0, 1);
      const eye = pointAt(road, travel.portal.s).add(new THREE.Vector3(0, 3.3, 0));
      disc.current.position.copy(p.setY(p.y + 1.3)).lerp(eye, k);
      disc.current.lookAt(camera.position);
      disc.current.rotateZ(k * 8);
      disc.current.scale.setScalar(Math.max(0.001, 1 - k * k));
      return;
    }
    disc.current?.scale.setScalar(1);
    disc.current?.position.set(p.x, p.y + 1.3 + bob, p.z);
    disc.current?.lookAt(camera.position);
    const c = colourAt(s);
    // A solid rim in the phase's colour, kept below the glow's threshold
    // so nothing blooms over the photo.
    ring.current?.color.copy(c).multiplyScalar(0.6);
    // Reveal the trail up to the traveller: the ribbons are built in
    // equal steps along the road, six indices a step.
    const upTo = Math.floor(s / TRAIL_STEP) * 6;
    for (const geo of trail) geo.setDrawRange(0, upTo);
  });

  return (
    <group ref={disc}>
      {/* The student's own photo, exactly as they uploaded it: full
          strength, no glow on or around it. */}
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[0.95, 48]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <torusGeometry args={[1.02, 0.1, 12, 48]} />
        <meshBasicMaterial ref={ring} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Step of the trail ribbons, in world units. */
export const TRAIL_STEP = 1.5;

/** The way into a phase: a wall of its colour standing across the
 *  road and the land either side - translucent, brightest at the ground
 *  and fading upward, with light running up it - that you pass straight
 *  through into the new colour. */
const WALL_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const WALL_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uFade;
  varying vec2 vUv;
  void main() {
    float rise = pow(1.0 - vUv.y, 1.6);
    float streak = 0.5 + 0.5 * sin(vUv.x * 140.0 + sin(vUv.x * 13.0) * 4.0);
    float run = 0.5 + 0.5 * sin(vUv.y * 22.0 - uTime * 3.0 + vUv.x * 30.0);
    float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
    float a = (0.03 + 0.15 * rise + 0.1 * streak * run * rise) * edge * uFade;
    gl_FragColor = vec4(uColor * (0.8 + 0.8 * rise), a);
  }
`;

export function ColourWall({ road, s, colour }: { road: RoadLayout; s: number; colour: string }) {
  const group = useRef<THREE.Group>(null);
  const { position, facing } = useMemo(() => ({ position: pointAt(road, s), facing: pointAt(road, s - 1) }), [road, s]);
  useEffect(() => {
    group.current?.lookAt(facing.x, position.y, facing.z);
  }, [facing, position]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: WALL_VERT,
        fragmentShader: WALL_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: new THREE.Color(colour) }, uTime: { value: 0 }, uFade: { value: 1 } },
      }),
    [colour],
  );
  /* eslint-disable react-hooks/immutability */
  useFrame(({ clock, camera }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
    // Thinner as you reach it, so passing through is a wash of colour,
    // not a blank screen.
    // Only near the threshold: invisible from a distance, rising as you
    // come up to it, thinning as you pass through.
    const d = camera.position.distanceTo(position);
    material.uniforms.uFade.value = (1 - THREE.MathUtils.smoothstep(d, 18, 34)) * THREE.MathUtils.smoothstep(d, 3, 10);
  });
  /* eslint-enable react-hooks/immutability */
  return (
    <group ref={group} position={position}>
      <mesh position={[0, 11, 0]} material={material}>
        <planeGeometry args={[120, 26]} />
      </mesh>
    </group>
  );
}

/** A trophy won at a checkpoint, standing at the roadside on a small
 *  lit plinth - what you pass on the way back up the road. */
export function RoadsideTrophy({ road, s, side, image }: { road: RoadLayout; s: number; side: number; image: string }) {
  const sprite = useRef<THREE.Sprite>(null);
  const mat = useRef<THREE.SpriteMaterial>(null);
  const map = useMemo(() => {
    const t = new THREE.TextureLoader().load(image);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [image]);
  const at = useMemo(() => {
    const p = pointAt(road, s);
    const dir = sideAt(road, s);
    return p.add(dir.multiplyScalar(side * 7.5));
  }, [road, s, side]);
  useFrame(({ camera }) => {
    if (mat.current) mat.current.opacity = nearness(camera, at);
  });
  return (
    <group position={at}>
      <sprite ref={sprite} position={[0, 2.2, 0]} scale={[3.2, 4.25, 1]}>
        <spriteMaterial ref={mat} map={map} transparent depthWrite={false} toneMapped={false} />
      </sprite>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.8, 32]} />
        <meshBasicMaterial color="#ffd89a" transparent opacity={0.18} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** What another student said about this stretch, on a card beside the
 *  road - white, like the quotes on the landing page. */
export function RoadsideComment({
  road,
  s,
  side,
  name,
  body,
}: {
  road: RoadLayout;
  s: number;
  side: number;
  name: string;
  body: string;
}) {
  const mat = useRef<THREE.SpriteMaterial>(null);
  const map = useMemo(
    () =>
      canvasTexture(640, 300, (g) => {
        // Dark glass with a lit edge, like everything else on the road -
        // a white card glows like a lamp once the scene is blooming.
        roundRect(g, 6, 6, 628, 250, 34);
        g.fillStyle = "rgba(6,10,23,0.9)";
        g.fill();
        g.lineWidth = 4;
        g.strokeStyle = "rgba(160,180,230,0.7)";
        g.stroke();
        g.fillStyle = "rgba(6,10,23,0.9)";
        // The tail of the bubble, pointing at the road.
        g.beginPath();
        const tx = side < 0 ? 470 : 170;
        g.moveTo(tx - 26, 254);
        g.lineTo(tx + (side < 0 ? 40 : -40), 296);
        g.lineTo(tx + 26, 254);
        g.fill();
        g.fillStyle = "#ff9a3c";
        g.font = "700 30px system-ui, sans-serif";
        g.fillText(name, 38, 62);
        g.font = "500 30px system-ui, sans-serif";
        g.fillStyle = "#c9d1e8";
        wrap(g, `“${body}”`, 560, 4).forEach((line, i) => g.fillText(line, 38, 112 + i * 40));
      }),
    [name, body, side],
  );
  const at = useMemo(() => {
    const p = pointAt(road, s);
    const dir = sideAt(road, s);
    // Close to the road, at eye height, so they can be read in passing.
    return p.add(dir.multiplyScalar(side * 5.2)).add(new THREE.Vector3(0, 3.1, 0));
  }, [road, s, side]);
  useFrame(({ camera, clock }) => {
    if (!mat.current) return;
    mat.current.opacity = nearness(camera, at, 5, 90);
    mat.current.rotation = Math.sin(clock.elapsedTime * 0.8 + s) * 0.02;
  });
  return (
    <sprite position={at} scale={[6.4, 3, 1]}>
      <spriteMaterial ref={mat} map={map} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  );
}
