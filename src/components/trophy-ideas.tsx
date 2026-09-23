"use client";

import Image from "next/image";
import { BadgeIcon } from "@/components/icons";
import { trophyColor } from "@/components/trophy-stand";

// Three ways a trophy could look, to be chosen between.
//
// What they have in common, because it is what was asked for: the disc
// is back, it is large, and the brand's lion is on it. What differs is
// what the disc is mounted in - and that decides whether the thing
// reads as a medal, a cup, or an object on a shelf.
//
// All three are drawn, not pictures: one SVG each, coloured by the
// trophy's own colour, so every badge gets one without any art being
// made for it.

interface Props {
  id: string;
  icon: string;
  won: boolean;
  /** The face size. The stand and ribbon scale with it. */
  size?: number;
}

/** The lion, embossed into the face of a disc. */
function LionFace({ won, size }: { won: boolean; size: number }) {
  return (
    <span
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ width: size * 0.62, filter: won ? "drop-shadow(0 1px 1px rgba(0,0,0,0.45))" : "grayscale(1)" }}
    >
      <Image src="/logo-mark.png" alt="" width={320} height={256} className="h-auto w-full" style={{ opacity: won ? 0.95 : 0.4 }} />
    </span>
  );
}

/**
 * A - THE MEDAL.
 *
 * The disc as a medal on a ribbon: the lion in the middle, the badge's
 * own symbol as a small emblem at the foot, and the rim struck in the
 * seven colours. The most trophy-like at the smallest size, which
 * matters because most of them are seen in a grid.
 */
export function MedalIdea({ id, icon, won, size = 168 }: Props) {
  const color = `var(--color-${trophyColor(id)})`;
  return (
    <span className="relative flex flex-col items-center" style={{ width: size }}>
      {/* the ribbon, behind */}
      <span aria-hidden className="relative -mb-4 flex h-10 w-full justify-center">
        <span
          className="absolute left-1/2 top-0 h-12 w-7 -translate-x-[120%] -skew-x-[14deg]"
          style={{ background: won ? `linear-gradient(180deg, ${color}, color-mix(in oklab, ${color} 35%, #000 65%))` : "linear-gradient(180deg,#2a3450,#141c33)" }}
        />
        <span
          className="absolute left-1/2 top-0 h-12 w-7 translate-x-[20%] skew-x-[14deg]"
          style={{ background: won ? `linear-gradient(180deg, color-mix(in oklab, ${color} 70%, #fff 30%), color-mix(in oklab, ${color} 45%, #000 55%))` : "linear-gradient(180deg,#36426a,#141c33)" }}
        />
      </span>

      <span
        className="relative grid place-items-center rounded-full"
        style={{
          width: size,
          height: size,
          background: won
            ? `conic-gradient(from 210deg, var(--color-storytelling), var(--color-figurative), var(--color-acting), var(--color-structure), var(--color-mindset), var(--color-body-language), var(--color-advanced), var(--color-storytelling))`
            : "conic-gradient(from 210deg,#2a3450,#151e39,#2a3450)",
          padding: size * 0.055,
          boxShadow: won ? `0 0 34px -8px ${color}, inset 0 2px 0 rgba(255,255,255,0.35)` : "inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
      >
        <span
          className="relative grid size-full place-items-center rounded-full"
          style={{
            background: won
              ? `radial-gradient(120% 120% at 30% 20%, color-mix(in oklab, ${color} 45%, #0b1120 55%), #080d1a 75%)`
              : "radial-gradient(120% 120% at 30% 20%, #1b2440, #0a0f1f 75%)",
            boxShadow: "inset 0 0 26px rgba(0,0,0,0.75)",
          }}
        >
          <LionFace won={won} size={size} />
          {/* the badge's own symbol, struck at the foot of the disc */}
          <span
            className="absolute bottom-[9%] left-1/2 -translate-x-1/2"
            style={{ color: won ? color : "#3c496e", opacity: won ? 0.95 : 0.6 }}
          >
            <BadgeIcon name={icon} className="size-5" />
          </span>
        </span>
      </span>
    </span>
  );
}

/**
 * B - THE CUP, WITH THE MEDAL SET INTO IT.
 *
 * Keeps the silhouette everybody reads instantly as "trophy" - bowl,
 * stem, plinth - and makes the bowl's face the disc, with the lion on
 * it. The most obviously a trophy from across a room, and the most
 * work at small sizes.
 */
export function CupIdea({ id, icon, won, size = 150 }: Props) {
  const color = `var(--color-${trophyColor(id)})`;
  const metal = won
    ? `linear-gradient(90deg, color-mix(in oklab, ${color} 20%, #000 80%), color-mix(in oklab, ${color} 90%, #fff 10%) 38%, ${color} 55%, color-mix(in oklab, ${color} 25%, #000 75%))`
    : "linear-gradient(90deg,#141c33,#3a4770 38%,#2a3450 55%,#141c33)";
  return (
    <span className="relative flex flex-col items-center" style={{ width: size * 1.5 }}>
      <span className="relative flex items-center justify-center" style={{ width: size * 1.5, height: size }}>
        {/* The handles, pinned to the bowl's sides and tucked behind
            it, so they read as attached rather than as two rings
            standing next to a disc. */}
        {(["left", "right"] as const).map((side) => (
          <span
            key={side}
            aria-hidden
            className="absolute top-1/2 -translate-y-1/2"
            style={{
              [side]: size * 0.12,
              width: size * 0.26,
              height: size * 0.5,
              borderTop: `${size * 0.055}px solid`,
              borderBottom: `${size * 0.055}px solid`,
              [side === "left" ? "borderLeft" : "borderRight"]: `${size * 0.055}px solid`,
              borderRadius: side === "left" ? "999px 0 0 999px" : "0 999px 999px 0",
              color: won ? color : "#33406a",
              opacity: won ? 0.8 : 0.4,
            }}
          />
        ))}

        {/* the bowl, which is the disc */}
        <span
          className="relative z-10 grid shrink-0 place-items-center rounded-full"
          style={{
            width: size,
            height: size,
            padding: size * 0.05,
            background: won
              ? `conic-gradient(from 200deg, color-mix(in oklab, ${color} 80%, #fff 20%), ${color}, color-mix(in oklab, ${color} 35%, #000 65%), ${color})`
              : "conic-gradient(from 200deg,#36426a,#151e39,#36426a)",
            boxShadow: won ? `0 0 30px -8px ${color}` : "none",
          }}
        >
          <span
            className="relative grid size-full place-items-center rounded-full"
            style={{
              background: won
                ? `radial-gradient(120% 120% at 30% 18%, color-mix(in oklab, ${color} 38%, #0b1120 62%), #080d1a 78%)`
                : "radial-gradient(120% 120% at 30% 18%, #1b2440, #0a0f1f 78%)",
              boxShadow: "inset 0 0 22px rgba(0,0,0,0.7)",
            }}
          >
            <LionFace won={won} size={size} />
            <span className="absolute bottom-[8%] left-1/2 -translate-x-1/2" style={{ color: won ? color : "#3c496e" }}>
              <BadgeIcon name={icon} className="size-4" />
            </span>
          </span>
        </span>
      </span>

      {/* stem and plinth */}
      <span aria-hidden style={{ width: size * 0.1, height: size * 0.16, background: metal, marginTop: -size * 0.01 }} />
      <span aria-hidden className="rounded-[50%]" style={{ width: size * 0.28, height: size * 0.06, background: metal }} />
      <span aria-hidden style={{ width: size * 0.44, height: size * 0.045, borderRadius: 3, background: metal }} />
      <span
        aria-hidden
        style={{
          width: size * 0.72,
          height: size * 0.11,
          borderRadius: 4,
          background: won ? `linear-gradient(180deg, color-mix(in oklab, ${color} 55%, #000 45%), #0a1020)` : "linear-gradient(180deg,#1e2a4b,#0a1020)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
        }}
      />
    </span>
  );
}

/**
 * C - THE COIN ON ITS EDGE.
 *
 * A thick disc standing on a small base, turned a few degrees so its
 * milled edge shows. Reads as an object with weight rather than a
 * sticker, holds up at any size, and is the only one of the three that
 * looks like something you would keep on a shelf rather than wear.
 */
export function CoinIdea({ id, icon, won, size = 160 }: Props) {
  const color = `var(--color-${trophyColor(id)})`;
  const depth = size * 0.11;
  return (
    <span className="relative flex flex-col items-center" style={{ width: size * 1.1 }}>
      <span className="relative" style={{ width: size, height: size, perspective: 700 }}>
        {/* the milled edge, behind and offset */}
        <span
          aria-hidden
          className="absolute rounded-full"
          style={{
            inset: 0,
            transform: `translate(${depth * 0.55}px, ${depth * 0.35}px)`,
            background: won
              ? `repeating-linear-gradient(90deg, color-mix(in oklab, ${color} 55%, #000 45%) 0 3px, color-mix(in oklab, ${color} 20%, #000 80%) 3px 6px)`
              : "repeating-linear-gradient(90deg,#26314f 0 3px,#151d33 3px 6px)",
          }}
        />
        <span
          className="absolute grid place-items-center rounded-full"
          style={{
            inset: 0,
            padding: size * 0.05,
            background: won
              ? `conic-gradient(from 215deg, color-mix(in oklab, ${color} 85%, #fff 15%), ${color}, color-mix(in oklab, ${color} 30%, #000 70%), ${color})`
              : "conic-gradient(from 215deg,#36426a,#151e39,#36426a)",
            boxShadow: won ? `0 0 38px -10px ${color}, inset 0 2px 0 rgba(255,255,255,0.3)` : "inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <span
            className="relative grid size-full place-items-center rounded-full"
            style={{
              background: won
                ? `radial-gradient(130% 130% at 28% 18%, color-mix(in oklab, ${color} 42%, #0b1120 58%), #070c17 76%)`
                : "radial-gradient(130% 130% at 28% 18%, #1b2440, #070c17 76%)",
              boxShadow: "inset 0 0 28px rgba(0,0,0,0.8)",
            }}
          >
            <LionFace won={won} size={size} />
            <span
              className="absolute bottom-[10%] left-1/2 flex -translate-x-1/2 items-center gap-1"
              style={{ color: won ? color : "#3c496e" }}
            >
              <BadgeIcon name={icon} className="size-4" />
            </span>
          </span>
        </span>
      </span>

      {/* the base it stands in */}
      <span
        aria-hidden
        className="-mt-2 rounded-[4px]"
        style={{
          width: size * 0.62,
          height: size * 0.09,
          background: won ? `linear-gradient(180deg, color-mix(in oklab, ${color} 45%, #000 55%), #0a1020)` : "linear-gradient(180deg,#1e2a4b,#0a1020)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
        }}
      />
      <span
        aria-hidden
        className="rounded-[50%] blur-md"
        style={{ width: size * 0.8, height: size * 0.07, background: won ? color : "rgba(30,42,75,0.8)", opacity: won ? 0.35 : 0.18 }}
      />
    </span>
  );
}
