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
  const halo = useRef<THREE.SpriteMaterial>(null);
  const map = useMemo(() => {
    const t = new THREE.TextureLoader().load(image);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [image]);
  const glow = useMemo(
    () =>
      canvasTexture(128, 128, (g) => {
        const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, "rgba(255,255,255,1)");
        grad.addColorStop(0.3, "rgba(255,255,255,0.4)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = grad;
        g.fillRect(0, 0, 128, 128);
      }),
    [],
  );
  const p = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock, camera }) => {
    const s = Math.min(travel.s + AHEAD, road.finish);
    pointAt(road, s, p);
    const bob = Math.sin(clock.elapsedTime * 2) * 0.12;
    disc.current?.position.set(p.x, p.y + 1.3 + bob, p.z);
    disc.current?.lookAt(camera.position);
    const c = colourAt(s);
    ring.current?.color.copy(c);
    halo.current?.color.copy(c);
    // Reveal the trail up to the traveller: the ribbons are built in
    // equal steps along the road, six indices a step.
    const upTo = Math.floor(s / TRAIL_STEP) * 6;
    for (const geo of trail) geo.setDrawRange(0, upTo);
  });

  return (
    <group ref={disc}>
      <sprite scale={[4, 4, 1]}>
        <spriteMaterial ref={halo} map={glow} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
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

/** The gate into a phase: two lit pillars, a line of light across the
 *  road, and a banner overhead with the phase's letter and name. You
 *  cannot cross from one colour into the next without passing under
 *  one. */
export function PhaseGate({
  road,
  s,
  letter,
  name,
  colour,
}: {
  road: RoadLayout;
  s: number;
  letter: string;
  name: string;
  colour: string;
}) {
  const group = useRef<THREE.Group>(null);
  const bannerMat = useRef<THREE.MeshBasicMaterial>(null);
  const banner = useMemo(
    () =>
      canvasTexture(1024, 180, (g) => {
        roundRect(g, 4, 4, 1016, 172, 30);
        g.fillStyle = "rgba(7,12,24,0.92)";
        g.fill();
        g.lineWidth = 6;
        g.strokeStyle = colour;
        g.stroke();
        g.fillStyle = colour;
        g.font = "800 120px system-ui, sans-serif";
        g.textBaseline = "middle";
        g.fillText(letter, 48, 96);
        g.fillStyle = "#f4f6ff";
        g.font = "700 56px system-ui, sans-serif";
        let text = name.toUpperCase();
        while (g.measureText(text).width > 800 && text.length > 4) text = text.slice(0, -2) + "…";
        g.fillText(text, 170, 94);
      }),
    [letter, name, colour],
  );
  const { position, facing } = useMemo(() => ({ position: pointAt(road, s), facing: pointAt(road, s - 1) }), [road, s]);
  useEffect(() => {
    group.current?.lookAt(facing.x, position.y, facing.z);
  }, [facing, position]);
  const c = useMemo(() => new THREE.Color(colour), [colour]);
  // Readable on the way in; gone before it passes overhead, where it
  // would fill the screen with a few giant letters.
  useFrame(({ camera }) => {
    if (bannerMat.current) bannerMat.current.opacity = THREE.MathUtils.smoothstep(camera.position.distanceTo(position), 12, 24);
  });
  return (
    <group ref={group} position={position}>
      {[-4.6, 4.6].map((x) => (
        <mesh key={x} position={[x, 4, 0]}>
          <boxGeometry args={[0.45, 8, 0.45]} />
          <meshBasicMaterial color={c} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, 8.3, 0]}>
        <planeGeometry args={[11.5, 2.02]} />
        <meshBasicMaterial ref={bannerMat} map={banner} transparent side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {/* The threshold, laid across the road. */}
      <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9.2, 0.5]} />
        <meshBasicMaterial color={c} toneMapped={false} side={THREE.DoubleSide} />
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
        roundRect(g, 6, 6, 628, 250, 34);
        g.fillStyle = "#f7f8fc";
        g.fill();
        // The tail of the bubble, pointing at the road.
        g.beginPath();
        const tx = side < 0 ? 470 : 170;
        g.moveTo(tx - 26, 254);
        g.lineTo(tx + (side < 0 ? 40 : -40), 296);
        g.lineTo(tx + 26, 254);
        g.fill();
        g.fillStyle = "#101a33";
        g.font = "700 30px system-ui, sans-serif";
        g.fillText(name, 38, 62);
        g.font = "500 30px system-ui, sans-serif";
        g.fillStyle = "#28324f";
        wrap(g, `“${body}”`, 560, 4).forEach((line, i) => g.fillText(line, 38, 112 + i * 40));
      }),
    [name, body, side],
  );
  const at = useMemo(() => {
    const p = pointAt(road, s);
    const dir = sideAt(road, s);
    return p.add(dir.multiplyScalar(side * 8)).add(new THREE.Vector3(0, 4.2, 0));
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
