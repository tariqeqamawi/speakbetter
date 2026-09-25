"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AHEAD, pointAt, seeded, sideAt, type RoadLayout, type Travel } from "./road-geometry";

// Your Impact's destination: a far-future city of light on the horizon,
// beyond the end of the land, never reached. Tall tapering spires, each
// with elliptical halos floating round its upper reaches and a beacon
// at its point, outlined in all seven of the app's colours, and flying
// cars weaving between them trailing light - the place a voice reaches
// once it has learned to carry.

/** The seven, brighter than the swatches so they bloom. */
const SPECTRUM = ["#ffd60a", "#ff9500", "#ff4a2b", "#f53de0", "#1fe890", "#22d9f5", "#d11149"];

interface Tower {
  pos: THREE.Vector3;
  /** Radius at the base. */
  r: number;
  h: number;
  color: THREE.Color;
  /** Floating halos: height up the spire (0-1), width, tilt. */
  rings: { at: number; w: number; tilt: number }[];
}

// THE TOWERS GLOW, THEY ARE NOT DRAWN. Lit outlines made the city look
// built out of lines. Each spire is dark glass with a soft light inside
// it in its own colour - brightest at the foot, fading as it rises - and
// a band of light climbing it slowly, the same cascading light that
// rolls through the land.
const SPIRE_VERT = /* glsl */ `
  varying vec3 vColor;
  varying float vY;
  varying vec3 vN;
  varying vec3 vView;
  varying float vSeed;
  void main() {
    // three declares instanceColor itself, once the colours are set.
    #ifdef USE_INSTANCING_COLOR
      vColor = instanceColor;
    #else
      vColor = vec3(1.0);
    #endif
    vY = position.y + 0.5;
    vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix * instanceMatrix) * normal);
    vView = normalize(cameraPosition - w.xyz);
    vSeed = fract(instanceMatrix[3].x * 0.013 + instanceMatrix[3].z * 0.007);
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const SPIRE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;
  varying vec3 vColor;
  varying float vY;
  varying vec3 vN;
  varying vec3 vView;
  varying float vSeed;
  void main() {
    float body = 0.14 + 0.5 * pow(1.0 - vY, 2.0);
    float rim = pow(1.0 - abs(dot(normalize(vN), vView)), 2.5) * 0.55;
    float band = mod(uTime * 0.12 + vSeed * 3.0, 1.4) - 0.2;
    float climb = exp(-pow((vY - band) / 0.07, 2.0)) * 0.9;
    vec3 col = vColor * (body + rim + climb);
    gl_FragColor = vec4(col * uReveal, 1.0);
  }
`;

/** An ellipse of light floating round a spire. */
function ringLines(t: Tower, ring: Tower["rings"][number], out: number[], col: number[]) {
  const N = 40;
  const y = t.pos.y - 2 + t.h * ring.at;
  const rx = t.r * (1 - ring.at) + ring.w;
  const rz = rx * 0.55;
  const c = t.color;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2;
    const a1 = ((i + 1) / N) * Math.PI * 2;
    for (const a of [a0, a1]) {
      const x = Math.cos(a) * rx;
      const z = Math.sin(a) * rz;
      out.push(t.pos.x + x, y + z * Math.sin(ring.tilt), t.pos.z + z * Math.cos(ring.tilt));
      col.push(c.r * 1.3, c.g * 1.3, c.b * 1.3);
    }
  }
}

export function City({ road, travel, revealFrom }: { road: RoadLayout; travel: Travel; revealFrom: number }) {
  const root = useRef<THREE.Group>(null);
  const fades = useRef<(THREE.Material & { opacity: number } | null)[]>([]);
  const towers = useMemo(() => {
    const rand = seeded(77);
    const out: Tower[] = [];
    const p = new THREE.Vector3();
    const side = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    // The city itself, well beyond the end of the land - you travel
    // towards it for the whole last phase and never reach it. A grid of
    // blocks, tallest at the centre.
    const past = road.length + 160;
    const centre = pointAt(road, road.length).clone();
    pointAt(road, road.length, p);
    sideAt(road, road.length, side);
    tangent.set(side.z, 0, -side.x);
    centre.addScaledVector(tangent, past - road.length + 140);
    for (let a = -11; a <= 11; a++)
      for (let b = 0; b < 16; b++) {
        if (rand() < 0.2) continue;
        const across = a * 22 + (rand() - 0.5) * 8;
        const along = past - road.length + b * 22 + (rand() - 0.5) * 8;
        const pos = p.clone().addScaledVector(side, across).addScaledVector(tangent, along);
        const toCentre = pos.distanceTo(centre);
        const tall = 1 - THREE.MathUtils.smoothstep(toCentre, 20, 190);
        const h = 40 + tall * 190 + rand() * 50;
        const rings = Array.from({ length: 1 + Math.floor(rand() * 3) }, () => ({
          at: 0.55 + rand() * 0.35,
          w: 3 + rand() * 7,
          tilt: (rand() - 0.5) * 0.35,
        }));
        out.push({
          pos,
          r: 5 + rand() * 6,
          h,
          color: new THREE.Color(SPECTRUM[Math.floor(rand() * SPECTRUM.length)]).multiplyScalar(1.5),
          rings,
        });
      }
    return out;
  }, [road]);

  const bodies = useRef<THREE.InstancedMesh>(null);
  const tops = useRef<THREE.InstancedMesh>(null);
  // Every spire's outline, and every floating halo, as two sets of lines
  // in the spires' own colours - the same light as the land.
  const spireMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SPIRE_VERT,
        fragmentShader: SPIRE_FRAG,
        uniforms: { uTime: { value: 0 }, uReveal: { value: 0 } },
      }),
    [],
  );
  const { halos } = useMemo(() => {
    const hp: number[] = [];
    const hc: number[] = [];
    towers.forEach((t) => {
      t.rings.forEach((r) => ringLines(t, r, hp, hc));
    });
    const h = new THREE.BufferGeometry();
    h.setAttribute("position", new THREE.Float32BufferAttribute(hp, 3));
    h.setAttribute("color", new THREE.Float32BufferAttribute(hc, 3));
    return { halos: h };
  }, [towers]);
  const halosGroup = useRef<THREE.Group>(null);

  // Place the towers once they exist. (Writing into three's objects is
  // what this effect is for.)
  /* eslint-disable react-hooks/immutability */
  useEffect(() => {
    {
      const m = bodies.current;
      const r = tops.current;
      if (!m || !r) return;
      const o = new THREE.Object3D();
      towers.forEach((t, i) => {
        o.position.set(t.pos.x, t.pos.y + t.h / 2 - 2, t.pos.z);
        o.scale.set(t.r, t.h, t.r);
        o.rotation.set(0, 0, 0);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
        m.setColorAt(i, t.color);
        r.setColorAt(i, t.color);
        o.position.set(t.pos.x, t.pos.y + t.h - 2 + 1.2, t.pos.z);
        o.scale.set(1.3, 1.3, 1.3);
        o.updateMatrix();
        r.setMatrixAt(i, o.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
      r.instanceMatrix.needsUpdate = true;
      if (r.instanceColor) r.instanceColor.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      // Recompiled now that it has colours to read.
      spireMat.needsUpdate = true;
    }
  }, [towers, spireMat]);
  /* eslint-enable react-hooks/immutability */

  // Flying cars: lights on long loops between the towers, each with a
  // streak of light behind it.
  const CARS = 70;
  const cars = useMemo(() => {
    const rand = seeded(31);
    const side = sideAt(road, road.length);
    const centre = pointAt(road, road.length).addScaledVector(new THREE.Vector3(side.z, 0, -side.x), 330);
    return Array.from({ length: CARS }, () => ({
      cx: centre.x + (rand() - 0.5) * 180,
      cz: centre.z + (rand() - 0.5) * 180,
      y: centre.y + 20 + rand() * 110,
      rx: 40 + rand() * 130,
      rz: 30 + rand() * 110,
      speed: (0.05 + rand() * 0.12) * (rand() < 0.5 ? -1 : 1),
      phase: rand() * Math.PI * 2,
      col: new THREE.Color(["#22d9f5", "#f53de0", "#ffffff", "#ffd60a"][Math.floor(rand() * 4)]).multiplyScalar(2),
    }));
  }, [road]);
  const trails = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(CARS * 6), 3));
    const col = new Float32Array(CARS * 6);
    cars.forEach((c, i) => {
      col.set([c.col.r, c.col.g, c.col.b, 0, 0, 0], i * 6);
    });
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [cars]);
  const heads = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(CARS * 3), 3));
    const col = new Float32Array(CARS * 3);
    cars.forEach((c, i) => col.set([c.col.r, c.col.g, c.col.b], i * 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [cars]);

  /* eslint-disable react-hooks/immutability */
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // The halos float: the whole set rising and falling a little.
    if (halosGroup.current) halosGroup.current.position.y = Math.sin(t * 0.5) * 2.5;
    // Hidden until the traveller is through the pass into Your Impact,
    // then revealed over the next stretch of road.
    const k = THREE.MathUtils.smoothstep(travel.s + AHEAD, revealFrom, revealFrom + 90);
    spireMat.uniforms.uTime.value = t;
    spireMat.uniforms.uReveal.value = k;
    if (root.current) root.current.visible = k > 0.001;
    for (const m of fades.current) if (m) m.opacity = k * (m.userData.base ?? 1);
    const tp = (trails.attributes.position as THREE.BufferAttribute).array as Float32Array;
    const hp = (heads.attributes.position as THREE.BufferAttribute).array as Float32Array;
    cars.forEach((c, i) => {
      const a = c.phase + t * c.speed;
      const b = a - c.speed * 1.6;
      const x = c.cx + Math.cos(a) * c.rx;
      const z = c.cz + Math.sin(a) * c.rz;
      const y = c.y + Math.sin(a * 2) * 3;
      hp.set([x, y, z], i * 3);
      tp.set([x, y, z, c.cx + Math.cos(b) * c.rx, c.y + Math.sin(b * 2) * 3, c.cz + Math.sin(b) * c.rz], i * 6);
    });
    (trails.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (heads.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });
  /* eslint-enable react-hooks/immutability */

  // The city's ground: the land stops where the road does, so the city
  // stands on its own dark plaza, reaching out past the edge of the map.
  const plaza = useMemo(() => {
    const p = pointAt(road, road.length);
    const side = sideAt(road, road.length);
    return p.addScaledVector(new THREE.Vector3(side.z, 0, -side.x), 330);
  }, [road]);

  return (
    <group ref={root}>
      <mesh position={[plaza.x, plaza.y - 2.2, plaza.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[260, 64]} />
        <meshBasicMaterial color="#03050c" fog={false} />
      </mesh>
      <instancedMesh ref={bodies} args={[undefined, undefined, towers.length]} frustumCulled={false}>
        <coneGeometry args={[1, 1, 24]} />
        <primitive object={spireMat} attach="material" />
      </instancedMesh>
      {/* The halos, soft: faint rings of light, not drawn outlines. */}
      <group ref={halosGroup}>
        <lineSegments geometry={halos} frustumCulled={false}>
          <lineBasicMaterial
            ref={(m) => {
              fades.current[0] = m;
              if (m) m.userData.base = 0.45;
            }}
            vertexColors
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
            fog={false}
          />
        </lineSegments>
      </group>
      {/* A beacon at every point, in its spire's colour. */}
      <instancedMesh ref={tops} args={[undefined, undefined, towers.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial
          ref={(m) => {
            fades.current[1] = m;
          }}
          transparent
          toneMapped={false}
          fog={false}
        />
      </instancedMesh>
      <lineSegments geometry={trails} frustumCulled={false}>
        <lineBasicMaterial
          ref={(m) => {
            fades.current[2] = m;
            if (m) m.userData.base = 0.9;
          }}
          vertexColors
          transparent
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </lineSegments>
      <points geometry={heads} frustumCulled={false}>
        <pointsMaterial
          ref={(m) => {
            fades.current[3] = m;
          }}
          size={2.2}
          vertexColors
          toneMapped={false}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
        />
      </points>
    </group>
  );
}
