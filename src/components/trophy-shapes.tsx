"use client";

import { BadgeIcon } from "@/components/icons";
import { trophyColor } from "@/components/trophy-stand";

// The badge's own symbol IS the trophy.
//
// A disc is a disc whatever is printed on it: forty-four of them on a
// shelf are forty-four identical circles, and the thing that makes one
// trophy different from another has to be read rather than seen. A
// flame, a microphone, a star, a pair of hands - those have their own
// silhouettes, and a shelf of them can be taken in at a glance.
//
// So the symbol is cut out large, given thickness by stacking copies
// of itself behind the face, lit from the top left, and stood on
// something. The line art already drawn for every badge does all the
// work; nothing new has to be made for a forty-fifth.

interface Props {
  id: string;
  icon: string;
  won: boolean;
  size?: number;
}

/**
 * The symbol with depth: copies of itself stepping back and down into
 * shadow, and the lit face on top.
 */
function Solid({ icon, color, size, won }: { icon: string; color: string; size: number; won: boolean }) {
  const layers = Math.max(4, Math.round(size / 22));
  const step = size * 0.013;
  return (
    <span className="relative block" style={{ width: size, height: size }}>
      {Array.from({ length: layers }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute inset-0 grid place-items-center"
          style={{
            transform: `translate(${(layers - i) * step}px, ${(layers - i) * step * 1.15}px)`,
            color: won ? `color-mix(in oklab, ${color} ${18 + i * 4}%, #05080f 82%)` : "#0d1424",
          }}
        >
          <BadgeIcon name={icon} className="size-full" />
        </span>
      ))}

      {/* the lit face */}
      <span
        className="absolute inset-0 grid place-items-center"
        style={{
          color: won ? color : "#4b5a86",
          filter: won
            ? `drop-shadow(0 0 ${size * 0.14}px color-mix(in oklab, ${color} 70%, transparent)) drop-shadow(0 ${size * 0.02}px 0 rgba(255,255,255,0.35))`
            : "none",
        }}
      >
        <BadgeIcon name={icon} className="size-full" />
      </span>

    </span>
  );
}

/**
 * H - THE SYMBOL ON A PLINTH.
 *
 * Cut out, stood up, lit. The silhouette is the whole identity, so a
 * shelf of forty-four is forty-four different shapes rather than
 * forty-four circles.
 */
export function ShapeOnPlinth({ id, icon, won, size = 128 }: Props) {
  const color = `var(--color-${trophyColor(id)})`;
  const metal = won
    ? `linear-gradient(180deg, color-mix(in oklab, ${color} 55%, #fff 45%), color-mix(in oklab, ${color} 50%, #000 50%))`
    : "linear-gradient(180deg,#39456d,#141c33)";
  return (
    <span className="flex flex-col items-center" style={{ width: size * 1.5 }}>
      <Solid icon={icon} color={color} size={size} won={won} />
      <span aria-hidden className="-mt-[4%] rounded-[3px]" style={{ width: size * 0.7, height: size * 0.055, background: metal }} />
      <span
        aria-hidden
        style={{
          width: size * 0.56,
          height: size * 0.1,
          background: won ? `linear-gradient(180deg, color-mix(in oklab, ${color} 30%, #000 70%), #070c17)` : "linear-gradient(180deg,#1b2440,#070c17)",
        }}
      />
      <span aria-hidden className="rounded-[4px]" style={{ width: size * 0.82, height: size * 0.06, background: metal, boxShadow: "0 10px 26px -10px rgba(0,0,0,0.9)" }} />
      <span
        aria-hidden
        className="rounded-[50%] blur-md"
        style={{ width: size, height: size * 0.1, background: won ? color : "rgba(30,42,75,0.8)", opacity: won ? 0.4 : 0.16 }}
      />
    </span>
  );
}

/**
 * I - THE SYMBOL IN A RING.
 *
 * The same cut-out shape, held inside an open ring on a post - the
 * silhouette still reads, and the ring gives every trophy a shared
 * frame so a shelf of them lines up.
 */
export function ShapeInRing({ id, icon, won, size = 118 }: Props) {
  const color = `var(--color-${trophyColor(id)})`;
  const metal = won
    ? `conic-gradient(from 210deg, color-mix(in oklab, ${color} 80%, #fff 20%), ${color}, color-mix(in oklab, ${color} 25%, #000 75%), ${color})`
    : "conic-gradient(from 210deg,#3a4770,#151e39,#3a4770)";
  return (
    <span className="flex flex-col items-center" style={{ width: size * 1.7 }}>
      <span
        className="relative grid place-items-center rounded-full"
        style={{
          width: size * 1.45,
          height: size * 1.45,
          padding: size * 0.07,
          background: metal,
          boxShadow: won ? `0 0 ${size * 0.3}px -${size * 0.07}px ${color}, inset 0 2px 0 rgba(255,255,255,0.4)` : "inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
      >
        <span
          className="grid size-full place-items-center rounded-full"
          style={{ background: "radial-gradient(120% 120% at 30% 18%, #131c33, #05080f 78%)", boxShadow: "inset 0 0 28px rgba(0,0,0,0.85)" }}
        >
          <Solid icon={icon} color={color} size={size * 0.72} won={won} />
        </span>
      </span>
      <span aria-hidden style={{ width: size * 0.1, height: size * 0.2, background: metal, marginTop: -size * 0.02 }} />
      <span aria-hidden className="rounded-[4px]" style={{ width: size * 0.72, height: size * 0.07, background: metal, boxShadow: "0 10px 26px -10px rgba(0,0,0,0.9)" }} />
      <span
        aria-hidden
        className="rounded-[50%] blur-md"
        style={{ width: size, height: size * 0.1, background: won ? color : "rgba(30,42,75,0.8)", opacity: won ? 0.4 : 0.16 }}
      />
    </span>
  );
}

/**
 * J - THE SYMBOL UNDER A LIGHT.
 *
 * The cut-out on a tapered column with a cone coming down over it.
 * For the one trophy standing alone in the case, where the shape gets
 * to be the only thing on screen.
 */
export function ShapeUnderLight({ id, icon, won, size = 124 }: Props) {
  const color = `var(--color-${trophyColor(id)})`;
  const metal = won
    ? `linear-gradient(90deg, color-mix(in oklab, ${color} 20%, #000 80%), color-mix(in oklab, ${color} 85%, #fff 15%) 42%, ${color} 58%, color-mix(in oklab, ${color} 22%, #000 78%))`
    : "linear-gradient(90deg,#141c33,#3a4770 42%,#26304f 58%,#141c33)";
  return (
    <span
      className="relative flex flex-col items-center overflow-hidden rounded-2xl bg-navy-950 px-4 pb-4 pt-10"
      style={{ width: size * 2 }}
    >
      <span aria-hidden className="trophy-spot pointer-events-none absolute inset-x-0 top-0" style={{ height: size * 2.2 }} />
      <span
        aria-hidden
        className="trophy-lamp pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl"
        style={{ width: size * 0.5, height: size * 0.5, background: won ? color : "rgba(231,233,242,0.5)" }}
      />
      <span className="relative">
        <Solid icon={icon} color={color} size={size} won={won} />
      </span>
      <span aria-hidden className="relative" style={{ width: size * 0.11, height: size * 0.26, background: metal, marginTop: -size * 0.02 }} />
      <span aria-hidden className="relative rounded-[4px]" style={{ width: size * 0.78, height: size * 0.07, background: metal }} />
      <span
        aria-hidden
        className="relative"
        style={{ width: size * 0.95, height: size * 0.045, borderRadius: 3, background: won ? `color-mix(in oklab, ${color} 30%, #000 70%)` : "#131b33" }}
      />
      <span
        aria-hidden
        className="relative mt-2 rounded-[50%] blur-md"
        style={{ width: size * 1.15, height: size * 0.1, background: won ? color : "rgba(30,42,75,0.8)", opacity: won ? 0.4 : 0.16 }}
      />
    </span>
  );
}
