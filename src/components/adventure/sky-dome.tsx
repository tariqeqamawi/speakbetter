"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LOOK } from "./look";

// A painted sky around the whole world - planets, a nebula, a galaxy -
// on a great dome that travels with the camera, so it is always
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
//
// A DOME, not the cylinder it was: the cylinder stopped a third of the
// way up the sky, and looking up - climbing between the speakers, or at
// the aurora - showed its edge. The picture keeps exactly the place it
// had (each direction looks up the picture where it met the cylinder),
// and above its top edge the sky carries on: the picture fades into deep
// space and the stars run on to the very top.
//
// Two sections paint their own sky into it as you travel through them:
// S, an aurora - curtains of green light hanging all round the sky, now
// whole however high you look; and T, Train Your Instrument, a voice
// drawn across the sky - a vast glowing waveform circling the horizon,
// swelling and falling like speech.

const RADIUS = 1000;
/** How tall the picture stood on the old cylinder: a quarter of the
 *  circle wide (π·R/2), the picture about 21:9 - so about 670, from 90
 *  below the eye to a third of the way up the sky. */
const PIC_H = (Math.PI * RADIUS) / 2 / 2.33;

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
  // The big planet in the picture, as an ellipse in texture space
  // (centre u, v; radius u, v) - no star is drawn over its disc.
  uniform vec4 uPlanet;
  uniform float uCurve;
  uniform float uGlow;
  // Where the cylinder stood: its height, and its foot below the eye.
  uniform float uH;
  uniform float uFoot;
  // How much of each section's sky is showing (0-1).
  uniform float uAurora;
  uniform float uWave;
  varying vec2 vUv;
  varying vec3 vDir;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }

  void main() {
    vec3 d = normalize(vDir);
    // Where this direction met the old cylinder: round it by its bearing,
    // up it by the height it reached at the cylinder's radius.
    float u = atan(d.x, d.z) / 6.2831853;
    u = u < 0.0 ? u + 1.0 : u;
    float elev = asin(clamp(d.y, -1.0, 1.0));
    float horiz = max(length(d.xz), 1e-4);
    float v = (d.y / horiz * ${RADIUS.toFixed(1)} + uFoot) / uH;
    // The picture, wrapped and mirrored as a MirroredRepeat texture would.
    vec2 uv = vec2(u, clamp(v, 0.0, 1.0)) * uRepeat + uOffset;
    float m = mod(uv.x, 2.0);
    uv.x = m < 1.0 ? m : 2.0 - m;
    vec3 sky = pow(texture2D(uMap, uv).rgb, vec3(uCurve));
    // Above the picture's top the sky goes on into deep space: the last
    // stretch of the picture fades into the dark, so there is no edge.
    sky *= 1.0 - smoothstep(0.8, 1.0, v);
    sky += vec3(0.004, 0.005, 0.014) * smoothstep(0.85, 1.1, v);
    // Only the brightest of it lifted past the bloom's threshold, so the
    // planet's lit edge and the nebula's heart glow and the rest stays dark.
    sky += sky * smoothstep(0.3, 0.75, dot(sky, vec3(0.299, 0.587, 0.114))) * uGlow;

    // Stars (a sparse sky - the picture behind is the point; halved twice
    // since): one per many cells of a grid on the direction, placed at
    // random inside its cell, drawn a pixel or two wide at any distance.
    vec3 p = normalize(vDir) * 420.0;
    vec3 cell = floor(p);
    float h = hash(cell);
    float star = 0.0;
    // (Half again since: with the dust, the speed lines and the blur
    // there's enough going on.)
    if (h > 0.99715) {
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
    // Nor anywhere on the planet - its dark side included, which the
    // brightness test alone let stars sprinkle across.
    float onPlanet = 1.0 - smoothstep(1.0, 1.12, length((uv - uPlanet.xy) / uPlanet.zw));
    star *= 1.0 - onPlanet;
    vec3 col = sky + vec3(0.8, 0.85, 1.0) * star;

    // S - THE AURORA: curtains hanging all round the sky, their hem
    // swaying a little above the horizon, streaked upward, fading high.
    if (uAurora > 0.001) {
      float x = u * 6.2831853;
      float hem = 0.2 + 0.07 * sin(x * 3.0 + uTime * 0.25) + 0.035 * sin(x * 8.0 - uTime * 0.4);
      float y = elev - hem;
      float band = smoothstep(-0.03, 0.015, y) * exp(-max(y, 0.0) * 4.0);
      float streak = 0.55 + 0.45 * sin(x * 70.0 + sin(x * 6.0 + uTime * 0.3) * 6.0);
      // Brighter in two great arcs, fainter between them.
      float arcs = 0.45 + 0.55 * pow(0.5 + 0.5 * sin(x * 2.0 + 0.6), 1.5);
      vec3 ac = mix(vec3(0.12, 0.95, 0.55), vec3(0.2, 0.7, 0.95), smoothstep(0.0, 0.45, y));
      col += ac * band * streak * arcs * uAurora * 0.55;
    }

    // T - A VOICE ACROSS THE SKY: a waveform circling the horizon, the
    // shape of speech - bursts and pauses - travelling slowly round,
    // drawn as a glowing line with a soft halo.
    if (uWave > 0.001) {
      float x = u * 6.2831853;
      float envl = pow(0.5 + 0.5 * sin(x * 5.0 - uTime * 0.35), 2.0) * (0.6 + 0.4 * sin(x * 13.0 + uTime * 0.5));
      float w = 0.24 + 0.075 * envl * sin(x * 60.0 - uTime * 1.6) * cos(x * 23.0 + uTime * 0.7);
      float dist = abs(elev - w);
      float line = exp(-dist * dist * 9000.0);
      float halo = exp(-dist * dist * 600.0) * 0.25;
      col += vec3(0.25, 0.9, 1.0) * (line * 1.4 + halo) * uWave;
    }
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function SkyDome({
  image,
  aurora,
  wave,
}: {
  image: string;
  /** How much of S's aurora is showing, read every frame (0-1). */
  aurora?: () => number;
  /** How much of T's waveform is showing, read every frame (0-1). */
  wave?: () => number;
}) {
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
        uPlanet: { value: new THREE.Vector4(0.579, 0.25, 0.185, 0.43) },
        uCurve: { value: LOOK.sky },
        uGlow: { value: LOOK.skyGlow },
        uH: { value: PIC_H },
        uFoot: { value: 90 },
        uAurora: { value: 0 },
        uWave: { value: 0 },
      },
    });
  }, [image]);
  // The whole sphere round the camera; the shader works out the picture
  // from each direction.
  const geo = useMemo(() => new THREE.SphereGeometry(RADIUS, 96, 48), []);
  /* eslint-disable react-hooks/immutability */
  useFrame(({ camera, clock }) => {
    mesh.current?.position.copy(camera.position);
    material.uniforms.uTime.value = clock.elapsedTime;
    // The painted sky drifts, very slowly, so it's alive but never busy.
    material.uniforms.uOffset.value.x = 0.5 + clock.elapsedTime * 0.00012;
    material.uniforms.uAurora.value = aurora?.() ?? 0;
    material.uniforms.uWave.value = wave?.() ?? 0;
  });
  /* eslint-enable react-hooks/immutability */
  return (
    // Drawn first and never in front of anything: the backdrop to it all.
    <mesh ref={mesh} geometry={geo} material={material} renderOrder={-10} frustumCulled={false} />
  );
}
