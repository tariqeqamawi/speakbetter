"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// A painted sky around the whole world - planets, a nebula, a galaxy -
// on a great cylinder that travels with the camera, so it is always
// infinitely far away: the planets never get nearer however far you go,
// only swing across the view as the road turns, the way a moon follows a
// car. The picture wraps four times round (mirrored at the joins, so
// there is no seam), each copy a quarter of the circle - which puts the
// planets low enough to be in view, and big - with one copy centred on
// the way the road sets off.
//
// Stars are drawn into the same sky, over the picture: sharp points,
// some twinkling, that fade out wherever the picture is bright - so they
// sit behind the planets and the nebula, never in front of them.

const RADIUS = 1000;

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vDir;
  void main() {
    vUv = uv;
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2 uRepeat;
  uniform vec2 uOffset;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vDir;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }

  void main() {
    // The picture, wrapped and mirrored as a MirroredRepeat texture would.
    vec2 uv = vUv * uRepeat + uOffset;
    float m = mod(uv.x, 2.0);
    uv.x = m < 1.0 ? m : 2.0 - m;
    vec3 sky = texture2D(uMap, uv).rgb;

    // Stars: one per few cells of a grid on the direction, placed at
    // random inside its cell, drawn a pixel or two wide at any distance.
    vec3 p = normalize(vDir) * 420.0;
    vec3 cell = floor(p);
    float h = hash(cell);
    float star = 0.0;
    if (h > 0.93) {
      vec3 at = cell + vec3(hash(cell + 1.3), hash(cell + 2.7), hash(cell + 4.1));
      float px = length(p - at) / max(length(fwidth(p)), 1e-4);
      float size = mix(0.6, 1.6, fract(h * 37.0));
      float twinkle = 0.65 + 0.35 * sin(uTime * (0.6 + fract(h * 91.0) * 2.0) + h * 50.0);
      star = smoothstep(size + 0.9, size * 0.3, px) * mix(0.35, 1.0, fract(h * 13.0)) * twinkle;
    }
    // Behind whatever the picture shows: none over a lit planet or the
    // bright heart of the nebula.
    float lum = dot(sky, vec3(0.299, 0.587, 0.114));
    star *= 1.0 - smoothstep(0.06, 0.2, lum);
    gl_FragColor = vec4(sky + vec3(0.8, 0.85, 1.0) * star, 1.0);
  }
`;

export function SkyDome({ image }: { image: string }) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useMemo(() => {
    const t = new THREE.TextureLoader().load(image);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      side: THREE.BackSide,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uMap: { value: t },
        uRepeat: { value: new THREE.Vector2(4, 1) },
        uOffset: { value: new THREE.Vector2(0.5, 0) },
        uTime: { value: 0 },
      },
    });
  }, [image]);
  const geo = useMemo(() => {
    // A quarter of the circle is π·R/2 wide; the picture is about 21:9,
    // so it stands about 670 tall - from a little below the horizon to a
    // third of the way up the sky, the part the camera sees.
    const h = (Math.PI * RADIUS) / 2 / 2.33;
    const g = new THREE.CylinderGeometry(RADIUS, RADIUS, h, 128, 1, true);
    g.translate(0, h / 2 - 90, 0);
    return g;
  }, []);
  /* eslint-disable react-hooks/immutability */
  useFrame(({ camera, clock }) => {
    mesh.current?.position.copy(camera.position);
    material.uniforms.uTime.value = clock.elapsedTime;
  });
  /* eslint-enable react-hooks/immutability */
  return (
    // Drawn first and never in front of anything: the backdrop to it all.
    <mesh ref={mesh} geometry={geo} material={material} renderOrder={-10} frustumCulled={false} />
  );
}
