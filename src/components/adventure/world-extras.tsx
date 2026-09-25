"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { pointAt, seeded, sideAt, type RoadLayout, type Travel, AHEAD } from "./road-geometry";

// The life of the road: Coach waiting at the roadside, fireflies in each
// phase's colour, scenery that makes each stretch a different place,
// the other students travelling it with you, and the score each passed
// checkpoint earned.

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let glowTex: THREE.Texture | null = null;
function glow() {
  glowTex ??= canvasTexture(128, 128, (g) => {
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.3, "rgba(255,255,255,0.35)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
  });
  return glowTex;
}

/** Coach at the roadside: the talking lion on a lit plinth, turned to
 *  the road. As the traveller comes level he rises and glows, and while
 *  his line is being said his mouth moves - the same 28 frames the lion
 *  talks with everywhere else in the app (public/lion-mouth.webp). */
const MOUTH_FRAMES = 28;
export function CoachPost({
  road,
  s,
  side,
  travel,
  talking,
}: {
  road: RoadLayout;
  s: number;
  side: number;
  travel: Travel;
  talking: boolean;
}) {
  const lion = useRef<THREE.Sprite>(null);
  const halo = useRef<THREE.SpriteMaterial>(null);
  const map = useMemo(() => {
    const t = new THREE.TextureLoader().load("/lion-mouth.webp");
    t.colorSpace = THREE.SRGBColorSpace;
    t.repeat.set(1, 1 / MOUTH_FRAMES);
    t.offset.set(0, (MOUTH_FRAMES - 1) / MOUTH_FRAMES);
    return t;
  }, []);
  const mouth = useRef({ frame: 0, target: 0, next: 0, open: false });
  // The frame loop steps the mouth and slides the texture to its frame -
  // per-frame state and a texture's offset, both meant to change here.
  /* eslint-disable react-hooks/immutability */
  const at = useMemo(() => pointAt(road, s).add(sideAt(road, s).multiplyScalar(side * 6.5)), [road, s, side]);
  useFrame(({ clock }, dt) => {
    const d = Math.abs(travel.s + AHEAD - s);
    const on = talking ? 1 : 1 - THREE.MathUtils.smoothstep(d, 4, 22);
    const t = clock.elapsedTime;
    if (lion.current) {
      const k = 1 + on * 0.25;
      lion.current.scale.set(4.4 * k, 3.43 * k, 1);
      lion.current.position.y = 3.2 + on * 1.2 + Math.sin(t * 1.5) * 0.15;
    }
    if (halo.current) halo.current.opacity = 0.25 + on * 0.6;
    // Talking: open on a syllable, shut between them - about two opens a
    // second with a little randomness, never the same shape twice.
    const m = mouth.current;
    if (talking && t > m.next) {
      m.open = !m.open;
      m.target = m.open ? 8 + Math.random() * 13 : Math.random() * 3;
      m.next = t + (m.open ? 0.16 + Math.random() * 0.14 : 0.07 + Math.random() * 0.06);
    } else if (!talking) m.target = 0;
    m.frame += (m.target - m.frame) * Math.min(1, dt * 22);
    const f = Math.round(THREE.MathUtils.clamp(m.frame, 0, MOUTH_FRAMES - 1));
    map.offset.y = (MOUTH_FRAMES - 1 - f) / MOUTH_FRAMES;
  });
  /* eslint-enable react-hooks/immutability */
  return (
    <group position={at}>
      <sprite position={[0, 3.2, -0.1]} scale={[8, 8, 1]}>
        <spriteMaterial ref={halo} map={glow()} color="#ff9a3c" transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
      <sprite ref={lion} position={[0, 3.2, 0]}>
        <spriteMaterial map={map} transparent toneMapped={false} />
      </sprite>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[1.3, 1.5, 1, 24]} />
        <meshStandardMaterial color="#1a2340" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.15, 1.3, 32]} />
        <meshBasicMaterial color="#ff9a3c" toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Fireflies: points of each phase's colour rising slowly from the land
 *  along its stretch of road, and starting again at the bottom. */
export function Fireflies({ road, spans }: { road: RoadLayout; spans: { from: number; to: number; color: string }[] }) {
  const N = 900;
  const { geo, base, speed } = useMemo(() => {
    const rand = seeded(11);
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const base = new Float32Array(N * 3);
    const speed = new Float32Array(N);
    const p = new THREE.Vector3();
    const side = new THREE.Vector3();
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const sp = spans[i % spans.length];
      const s = sp.from + rand() * (sp.to - sp.from);
      pointAt(road, s, p);
      sideAt(road, s, side);
      const off = (rand() < 0.5 ? -1 : 1) * (5 + rand() * 40);
      base[i * 3] = p.x + side.x * off;
      base[i * 3 + 1] = p.y + rand() * 14;
      base[i * 3 + 2] = p.z + side.z * off;
      speed[i] = 0.4 + rand() * 0.9;
      c.set(sp.color);
      col.set([c.r * 1.6, c.g * 1.6, c.b * 1.6], i * 3);
    }
    pos.set(base);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return { geo, base, speed };
  }, [road, spans]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Moving the points is what a frame loop is for; the geometry is
    // built once and its buffer rewritten in place.
    /* eslint-disable react-hooks/immutability */
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const a = pos.array as Float32Array;
    for (let i = 0; i < N; i++) {
      a[i * 3] = base[i * 3] + Math.sin(t * 0.5 + i) * 0.6;
      a[i * 3 + 1] = base[i * 3 + 1] + ((t * speed[i]) % 16);
      a[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.4 + i * 1.3) * 0.6;
    }
    pos.needsUpdate = true;
    /* eslint-enable react-hooks/immutability */
  });
  return (
    <points geometry={geo}>
      <pointsMaterial
        size={0.55}
        map={glow()}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

/** Places along a phase's stretch, off the road on either side. */
function placesFor(road: RoadLayout, from: number, to: number, n: number, seed: number, near = 9, far = 34) {
  const rand = seeded(seed);
  const out: { pos: THREE.Vector3; rot: number; scale: number }[] = [];
  const side = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const s = from + ((i + rand() * 0.8) / n) * (to - from);
    const p = pointAt(road, s);
    sideAt(road, s, side);
    const d = (i % 2 ? 1 : -1) * (near + rand() * (far - near));
    out.push({ pos: p.add(side.multiplyScalar(d)), rot: rand() * Math.PI * 2, scale: 0.7 + rand() * 0.7 });
  }
  return out;
}

/** S - Start With Awareness: a quiet grove of low trees with glowing
 *  crystals among them. Where somebody first looks inward. */
function Grove({ road, from, to, color }: SceneProps) {
  const spots = useMemo(() => placesFor(road, from, to, 26, 21), [road, from, to]);
  const c = new THREE.Color(color);
  // Glass trees outlined in light, the way the land is.
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.ConeGeometry(1.3, 3, 7)), []);
  return (
    <group>
      {spots.map((sp, i) =>
        i % 3 === 2 ? (
          <mesh key={i} position={[sp.pos.x, sp.pos.y + 1.4 * sp.scale, sp.pos.z]} rotation={[0.2, sp.rot, 0.1]} scale={sp.scale}>
            <octahedronGeometry args={[1.1, 0]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
        ) : (
          <group key={i} position={sp.pos} scale={sp.scale * 1.4}>
            <mesh position={[0, 0.8, 0]}>
              <cylinderGeometry args={[0.18, 0.25, 1.6, 6]} />
              <meshStandardMaterial color="#2a1f18" />
            </mesh>
            <mesh position={[0, 2.6, 0]}>
              <coneGeometry args={[1.3, 3, 7]} />
              <meshStandardMaterial color="#060a17" metalness={0.8} roughness={0.25} flatShading />
            </mesh>
            <lineSegments position={[0, 2.6, 0]} geometry={edges}>
              <lineBasicMaterial color={c} toneMapped={false} />
            </lineSegments>
          </group>
        ),
      )}
    </group>
  );
}

/** T - Train Your Instrument: a sound system - equaliser columns rising
 *  and falling out of the ground to a beat nobody plays. */
function Equaliser({ road, from, to, color }: SceneProps) {
  const spots = useMemo(() => placesFor(road, from, to, 16, 31, 10, 30), [road, from, to]);
  const bars = useRef<THREE.InstancedMesh>(null);
  const COLS = 5;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const m = bars.current;
    if (!m) return;
    const t = clock.elapsedTime;
    spots.forEach((sp, i) => {
      for (let k = 0; k < COLS; k++) {
        const h = 1 + Math.abs(Math.sin(t * (2 + k * 0.7) + i * 1.7 + k)) * 5 * sp.scale;
        dummy.position.set(sp.pos.x + (k - 2) * 0.9, sp.pos.y + h / 2, sp.pos.z);
        dummy.rotation.set(0, sp.rot, 0);
        dummy.scale.set(0.6, h, 0.6);
        dummy.updateMatrix();
        m.setMatrixAt(i * COLS + k, dummy.matrix);
      }
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={bars} args={[undefined, undefined, spots.length * COLS]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.85} />
    </instancedMesh>
  );
}

/** O - Own Your Stories: open books drifting in the air above the land,
 *  pages lifting. */
function Library({ road, from, to, color }: SceneProps) {
  const spots = useMemo(() => placesFor(road, from, to, 22, 41, 8, 30), [road, from, to]);
  const group = useRef<THREE.Group>(null);
  const cover = new THREE.Color(color).multiplyScalar(0.6);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    group.current?.children.forEach((b, i) => {
      b.position.y = spots[i].pos.y + 4 + Math.sin(t * 0.8 + i) * 0.8;
      b.rotation.y = spots[i].rot + t * 0.15;
      (b.children[1] as THREE.Object3D).rotation.z = 0.5 + Math.sin(t * 1.3 + i) * 0.15;
      (b.children[2] as THREE.Object3D).rotation.z = -0.5 - Math.sin(t * 1.3 + i) * 0.15;
    });
  });
  return (
    <group ref={group}>
      {spots.map((sp, i) => (
        <group key={i} position={sp.pos} scale={sp.scale * 1.3}>
          <mesh>
            <boxGeometry args={[0.12, 0.08, 1.6]} />
            <meshStandardMaterial color={cover} />
          </mesh>
          {[1, -1].map((dir) => (
            <group key={dir}>
              <mesh position={[dir * 0.62, 0, 0]}>
                <boxGeometry args={[1.2, 0.05, 1.5]} />
                <meshBasicMaterial color={color} transparent opacity={0.55} toneMapped={false} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

/** R - Reveal Deeper Truths: a theatre - spotlights on tall stands,
 *  their beams sweeping the land. */
function Theatre({ road, from, to, color }: SceneProps) {
  const spots = useMemo(() => placesFor(road, from, to, 12, 51, 10, 26), [road, from, to]);
  const heads = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    heads.current?.children.forEach((h, i) => {
      h.rotation.z = Math.sin(t * 0.6 + i * 1.9) * 0.45;
      h.rotation.x = 0.25 + Math.cos(t * 0.5 + i) * 0.15;
    });
  });
  return (
    <group>
      {spots.map((sp, i) => (
        <mesh key={`p${i}`} position={[sp.pos.x, sp.pos.y + 4, sp.pos.z]}>
          <cylinderGeometry args={[0.12, 0.18, 8, 8]} />
          <meshStandardMaterial color="#232a44" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      <group ref={heads}>
        {spots.map((sp, i) => (
          <group key={i} position={[sp.pos.x, sp.pos.y + 8.2, sp.pos.z]}>
            <mesh>
              <cylinderGeometry args={[0.45, 0.6, 0.9, 12]} />
              <meshStandardMaterial color="#1a1f33" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* The beam: a long open cone of light hanging down. */}
            <mesh position={[0, -6, 0]}>
              <coneGeometry args={[3, 12, 24, 1, true]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.14}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** Y - Your Impact: broadcast towers, rings of signal rolling out from
 *  them across the land - a voice reaching people. */
function Broadcast({ road, from, to, color }: SceneProps) {
  const spots = useMemo(() => placesFor(road, from, to, 8, 61, 14, 34), [road, from, to]);
  const rings = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    rings.current?.children.forEach((r, i) => {
      const k = ((t * 0.5 + i * 0.33) % 1 + 1) % 1;
      r.scale.setScalar(1 + k * 9);
      ((r as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.55;
    });
  });
  return (
    <group>
      {spots.map((sp, i) => (
        <group key={i} position={sp.pos}>
          <mesh position={[0, 5, 0]}>
            <cylinderGeometry args={[0.1, 0.9, 10, 4, 1, true]} />
            <meshBasicMaterial color={color} wireframe toneMapped={false} />
          </mesh>
          <mesh position={[0, 10.3, 0]}>
            <sphereGeometry args={[0.4, 12, 12]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
        </group>
      ))}
      <group ref={rings}>
        {spots.flatMap((sp, i) =>
          [0, 1, 2].map((k) => (
            <mesh key={`${i}-${k}`} position={[sp.pos.x, sp.pos.y + 0.4, sp.pos.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.9, 1, 48]} />
              <meshBasicMaterial color={color} transparent depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
          )),
        )}
      </group>
    </group>
  );
}

interface SceneProps {
  road: RoadLayout;
  from: number;
  to: number;
  color: string;
}

const SCENERY: Record<string, (p: SceneProps) => React.ReactElement> = {
  S: Grove,
  T: Equaliser,
  O: Library,
  R: Theatre,
  Y: Broadcast,
};

export function Scenery({ road, spans }: { road: RoadLayout; spans: { id: string; from: number; to: number; color: string }[] }) {
  return (
    <group>
      {spans.map((sp) => {
        const Scene = SCENERY[sp.id];
        return Scene ? <Scene key={sp.id} road={road} from={sp.from} to={sp.to} color={sp.color} /> : null;
      })}
    </group>
  );
}

/** Another student, standing at the checkpoint they are on: a small lit
 *  disc with their initials, bobbing at the roadside. */
export function Classmate({ road, s, offset, name, color }: { road: RoadLayout; s: number; offset: number; name: string; color: string }) {
  const sprite = useRef<THREE.Sprite>(null);
  const map = useMemo(
    () =>
      canvasTexture(256, 256, (g) => {
        g.beginPath();
        g.arc(128, 128, 110, 0, Math.PI * 2);
        g.fillStyle = "#101a33";
        g.fill();
        g.lineWidth = 16;
        g.strokeStyle = color;
        g.stroke();
        g.fillStyle = "#ffffff";
        g.font = "800 96px system-ui, sans-serif";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(
          name
            .split(/\s+/)
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          128,
          134,
        );
      }),
    [name, color],
  );
  const at = useMemo(() => pointAt(road, s).add(sideAt(road, s).multiplyScalar(offset)), [road, s, offset]);
  useFrame(({ clock }) => {
    if (sprite.current) sprite.current.position.y = 1.6 + Math.sin(clock.elapsedTime * 2 + offset) * 0.2;
  });
  return (
    <group position={at}>
      <sprite ref={sprite} scale={[1.6, 1.6, 1]}>
        <spriteMaterial map={map} transparent toneMapped={false} />
      </sprite>
      <sprite position={[0, 1.6, -0.05]} scale={[3.2, 3.2, 1]}>
        <spriteMaterial map={glow()} color={color} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
    </group>
  );
}

/** A passed checkpoint's score, on a tag above its ring. */
export function ScoreTag({ road, s, score, color }: { road: RoadLayout; s: number; score: number; color: string }) {
  const map = useMemo(
    () =>
      canvasTexture(256, 128, (g) => {
        g.beginPath();
        g.roundRect(8, 8, 240, 112, 56);
        g.fillStyle = color;
        g.fill();
        g.fillStyle = "#070c18";
        g.font = "800 72px system-ui, sans-serif";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(String(score), 128, 70);
      }),
    [score, color],
  );
  const at = useMemo(() => pointAt(road, s).add(new THREE.Vector3(0, 6.6, 0)), [road, s]);
  return (
    <sprite position={at} scale={[2.2, 1.1, 1]}>
      <spriteMaterial map={map} transparent toneMapped={false} />
    </sprite>
  );
}
