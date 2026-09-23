"use client";

import { BadgeMedal } from "@/components/badge-medal";
import { trophyColor } from "@/components/trophy-stand";

// The original medallions, mounted as trophies.
//
// The art for all forty-four badges already exists and is the most
// characterful thing in the app - each one its own little painting,
// each one its own colours. Nothing drawn from scratch was ever going
// to beat it. So these four ideas change nothing about the medallion
// and only ask the same question four ways: what is it standing in?
//
// All four are CSS - a real perspective, a real tilt, an edge built
// from stacked layers, a specular sweep, a reflection on the floor.
// No new art, no 3D library, and every badge gets one for free.

interface Props {
  id: string;
  icon: string;
  won: boolean;
  size?: number;
}

/** The disc itself, given thickness and a moving gleam. */
function Disc({ id, icon, won, size, tilt = 0 }: Props & { size: number; tilt?: number }) {
  const color = `var(--color-${trophyColor(id)})`;
  // The edge: a stack of thin copies behind the face, each pushed a
  // little further back, which is what gives it real depth when the
  // whole thing is tilted.
  const layers = 7;
  return (
    <span
      className="relative block"
      style={{ width: size, height: size, transformStyle: "preserve-3d", transform: `rotateX(${tilt}deg)` }}
    >
      {Array.from({ length: layers }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            transform: `translateZ(${-(i + 1) * (size * 0.012)}px)`,
            background: won
              ? `linear-gradient(90deg, color-mix(in oklab, ${color} 15%, #000 85%), color-mix(in oklab, ${color} 75%, #fff 25%) 40%, ${color} 58%, color-mix(in oklab, ${color} 18%, #000 82%))`
              : "linear-gradient(90deg,#10182c,#39456d 40%,#26304f 58%,#10182c)",
          }}
        />
      ))}

      {/* the face - the badge's own art, untouched */}
      <span className="absolute inset-0 grid place-items-center rounded-full" style={{ transform: "translateZ(1px)" }}>
        <BadgeMedal id={id} icon={icon} earned={won} className="size-full" />
      </span>

      {/* the rim, catching light all the way round */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          transform: "translateZ(2px)",
          boxShadow: won
            ? `inset 0 0 0 ${Math.max(2, size * 0.02)}px color-mix(in oklab, ${color} 70%, #fff 30%), inset 0 ${size * 0.03}px ${size * 0.06}px rgba(255,255,255,0.28), inset 0 -${size * 0.04}px ${size * 0.08}px rgba(0,0,0,0.5)`
            : `inset 0 0 0 ${Math.max(2, size * 0.02)}px #3a4770, inset 0 -${size * 0.04}px ${size * 0.08}px rgba(0,0,0,0.5)`,
        }}
      />

      {/* the gleam: a bar of light travelling across the face */}
      {won && (
        <span aria-hidden className="absolute inset-0 overflow-hidden rounded-full" style={{ transform: "translateZ(3px)" }}>
          <span className="trophy-gleam absolute -left-1/2 top-[-30%] h-[160%] w-1/3" />
        </span>
      )}
    </span>
  );
}

/** The pool of light a trophy stands in. */
function Pool({ color, won, width }: { color: string; won: boolean; width: number }) {
  return (
    <span
      aria-hidden
      className="rounded-[50%] blur-md"
      style={{ width, height: width * 0.14, background: won ? color : "rgba(30,42,75,0.8)", opacity: won ? 0.42 : 0.18 }}
    />
  );
}

/**
 * D - ON A PLINTH.
 *
 * The medallion standing upright on a stepped block, tilted a few
 * degrees back so the light catches the top of it, with its own
 * reflection on the floor. The quietest of the four; the closest to
 * something actually standing on a shelf.
 */
export function PlinthMount({ id, icon, won, size = 150 }: Props) {
  const color = `var(--color-${trophyColor(id)})`;
  const metal = won
    ? `linear-gradient(180deg, color-mix(in oklab, ${color} 60%, #fff 40%), color-mix(in oklab, ${color} 55%, #000 45%))`
    : "linear-gradient(180deg,#39456d,#141c33)";
  return (
    <span className="flex flex-col items-center" style={{ width: size * 1.25, perspective: size * 6 }}>
      <span style={{ filter: won ? `drop-shadow(0 0 ${size * 0.16}px color-mix(in oklab, ${color} 55%, transparent))` : "none" }}>
        <Disc id={id} icon={icon} won={won} size={size} tilt={10} />
      </span>
      {/* the reflection, fading out */}
      <span
        aria-hidden
        className="-mt-[1px] block overflow-hidden"
        style={{
          width: size,
          height: size * 0.3,
          opacity: won ? 0.3 : 0.12,
          transform: "scaleY(-1)",
          maskImage: "linear-gradient(180deg, rgba(0,0,0,0.9), transparent)",
          WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.9), transparent)",
        }}
      >
        <BadgeMedal id={id} icon={icon} earned={won} className="w-full" />
      </span>
      <span aria-hidden className="-mt-[6%] rounded-[3px]" style={{ width: size * 0.74, height: size * 0.06, background: metal }} />
      <span aria-hidden style={{ width: size * 0.62, height: size * 0.12, background: won ? `linear-gradient(180deg, color-mix(in oklab, ${color} 35%, #000 65%), #080d1a)` : "linear-gradient(180deg,#1b2440,#080d1a)" }} />
      <span aria-hidden className="rounded-[4px]" style={{ width: size * 0.86, height: size * 0.07, background: metal, boxShadow: "0 10px 26px -10px rgba(0,0,0,0.9)" }} />
      <Pool color={color} won={won} width={size} />
    </span>
  );
}

/**
 * E - IN AN OPEN RING.
 *
 * The way a collector actually displays a coin: held at its edge in an
 * open metal ring on a post, so light gets behind it. The medallion is
 * framed rather than sitting on something, which makes it read as the
 * valuable part.
 */
export function RingMount({ id, icon, won, size = 140 }: Props) {
  const color = `var(--color-${trophyColor(id)})`;
  const metal = won
    ? `conic-gradient(from 210deg, color-mix(in oklab, ${color} 80%, #fff 20%), ${color}, color-mix(in oklab, ${color} 25%, #000 75%), ${color})`
    : "conic-gradient(from 210deg,#3a4770,#151e39,#3a4770)";
  return (
    <span className="flex flex-col items-center" style={{ width: size * 1.4, perspective: size * 6 }}>
      <span
        className="relative grid place-items-center rounded-full"
        style={{
          width: size * 1.16,
          height: size * 1.16,
          padding: size * 0.08,
          background: metal,
          boxShadow: won ? `0 0 ${size * 0.26}px -${size * 0.06}px ${color}, inset 0 2px 0 rgba(255,255,255,0.4)` : "inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
      >
        {/* the dark well the medallion is held in */}
        <span className="relative grid size-full place-items-center rounded-full bg-navy-950" style={{ boxShadow: "inset 0 0 26px rgba(0,0,0,0.85)" }}>
          <Disc id={id} icon={icon} won={won} size={size * 0.92} />
        </span>
      </span>
      <span aria-hidden style={{ width: size * 0.1, height: size * 0.2, background: metal, marginTop: -size * 0.03 }} />
      <span aria-hidden className="rounded-[4px]" style={{ width: size * 0.7, height: size * 0.08, background: metal, boxShadow: "0 10px 26px -10px rgba(0,0,0,0.9)" }} />
      <Pool color={color} won={won} width={size} />
    </span>
  );
}

/**
 * F - UNDER A SPOTLIGHT.
 *
 * The medallion raised on a tapered column with a cone of light coming
 * down over it. The most theatrical, and the one that suits the single
 * trophy standing in the case rather than the forty on the shelf.
 */
export function SpotlightMount({ id, icon, won, size = 140 }: Props) {
  const color = `var(--color-${trophyColor(id)})`;
  const metal = won
    ? `linear-gradient(90deg, color-mix(in oklab, ${color} 20%, #000 80%), color-mix(in oklab, ${color} 85%, #fff 15%) 42%, ${color} 58%, color-mix(in oklab, ${color} 22%, #000 78%))`
    : "linear-gradient(90deg,#141c33,#3a4770 42%,#26304f 58%,#141c33)";
  return (
    <span className="relative flex flex-col items-center overflow-hidden rounded-2xl bg-navy-950 px-4 pb-4 pt-8" style={{ width: size * 1.9, perspective: size * 6 }}>
      {/* the cone */}
      <span aria-hidden className="trophy-spot pointer-events-none absolute inset-x-0 top-0" style={{ height: size * 2 }} />
      <span
        aria-hidden
        className="trophy-lamp pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl"
        style={{ width: size * 0.5, height: size * 0.5, background: won ? color : "rgba(231,233,242,0.5)" }}
      />
      <span className="relative" style={{ filter: won ? `drop-shadow(0 0 ${size * 0.2}px color-mix(in oklab, ${color} 60%, transparent))` : "none" }}>
        <Disc id={id} icon={icon} won={won} size={size} tilt={8} />
      </span>
      <span aria-hidden className="relative" style={{ width: size * 0.12, height: size * 0.26, background: metal, marginTop: -size * 0.02 }} />
      <span aria-hidden className="relative rounded-[4px]" style={{ width: size * 0.8, height: size * 0.08, background: metal }} />
      <span aria-hidden className="relative" style={{ width: size * 0.95, height: size * 0.05, borderRadius: 3, background: won ? `color-mix(in oklab, ${color} 30%, #000 70%)` : "#131b33" }} />
      <span className="relative pt-2">
        <Pool color={color} won={won} width={size * 1.1} />
      </span>
    </span>
  );
}

/**
 * G - LYING BACK ON A WEDGE.
 *
 * Tilted well back, the way a medal sits in a presentation case, so
 * the whole face is lit and the thickness of the disc is obvious. The
 * most three-dimensional of the four and the best at small sizes,
 * because the silhouette stays a circle.
 */
export function WedgeMount({ id, icon, won, size = 150 }: Props) {
  const color = `var(--color-${trophyColor(id)})`;
  return (
    <span className="flex flex-col items-center" style={{ width: size * 1.3, perspective: size * 4 }}>
      <span style={{ filter: won ? `drop-shadow(0 ${size * 0.06}px ${size * 0.12}px rgba(0,0,0,0.65)) drop-shadow(0 0 ${size * 0.16}px color-mix(in oklab, ${color} 50%, transparent))` : "none" }}>
        <Disc id={id} icon={icon} won={won} size={size} tilt={26} />
      </span>
      {/* the wedge it leans on */}
      <span
        aria-hidden
        className="-mt-[14%]"
        style={{
          width: size * 0.92,
          height: size * 0.2,
          background: won
            ? `linear-gradient(180deg, color-mix(in oklab, ${color} 45%, #000 55%), #070c17)`
            : "linear-gradient(180deg,#1b2440,#070c17)",
          clipPath: "polygon(8% 0, 92% 0, 100% 100%, 0 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22)",
        }}
      />
      <Pool color={color} won={won} width={size * 1.05} />
    </span>
  );
}
