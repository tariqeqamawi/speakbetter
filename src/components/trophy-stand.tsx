"use client";

import { BadgeMedal } from "@/components/badge-medal";

// A trophy, not a sticker: the medallion art mounted in a ring, on a
// stem, on a plinth, with the student's name for it on the base. The
// art itself is the neon medal that was drawn for each badge - it
// stays the face of the trophy, and everything around it is drawn
// here, so all forty-four become trophies without redrawing any of
// them.
//
// Won, it wears its colour and shines; locked, it's the same shape in
// dull metal - you can see exactly what you haven't won, which is the
// whole point of a case with empty stands in it.

/** Each trophy owns one of the seven colours, settled by its id so it
 *  never changes between visits. */
const COLORS = ["storytelling", "figurative", "acting", "structure", "mindset", "body-language", "advanced"] as const;

export function trophyColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return COLORS[hash % COLORS.length];
}

export function TrophyStand({
  id,
  icon,
  won,
  size = "md",
  flip = false,
  className = "",
}: {
  id: string;
  icon: string;
  won: boolean;
  size?: "sm" | "md" | "lg";
  /** Turn on its stand, showing the lion on the back of the medal. */
  flip?: boolean;
  className?: string;
}) {
  const color = `var(--color-${trophyColor(id)})`;
  const medal = size === "lg" ? "size-40 sm:size-48" : size === "md" ? "size-20" : "size-14";
  const wrap = size === "lg" ? "w-56 sm:w-64" : size === "md" ? "w-28" : "w-20";
  return (
    <span className={`relative flex flex-col items-center ${wrap} ${className}`} style={{ color: won ? color : "var(--color-ink-faint)" }}>
      {/* the cup: two handles either side of the medal */}
      <span className="relative flex items-center justify-center">
        <Handle side="left" size={size} won={won} />
        <span
          className={`relative grid place-items-center rounded-full ${won ? "" : "opacity-55 grayscale"}`}
          style={{
            padding: size === "lg" ? 10 : 6,
            background: won
              ? `conic-gradient(from 210deg, color-mix(in oklab, ${color} 70%, #fff 30%), ${color}, color-mix(in oklab, ${color} 40%, #000 60%), ${color})`
              : "conic-gradient(from 210deg, #2a3450, #151e39, #2a3450)",
            boxShadow: won ? `0 0 26px -6px ${color}, inset 0 1px 0 rgba(255,255,255,0.35)` : "inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          <span className={`${flip ? "trophy-coin" : ""} grid`}>
            <span className="trophy-face">
              <BadgeMedal id={id} icon={icon} earned={won} className={medal} />
            </span>
            {flip && (
              <span className="trophy-face trophy-face-back">
                <span className={`grid ${medal} place-items-center rounded-full border border-navy-600 bg-navy-950`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-mark.png" alt="" className={`w-2/3 ${won ? "" : "opacity-40 grayscale"}`} />
                </span>
              </span>
            )}
          </span>
        </span>
        <Handle side="right" size={size} won={won} />
      </span>

      {/* the stem and the plinth */}
      <span
        className={`${size === "lg" ? "h-8 w-5" : size === "md" ? "h-4 w-2.5" : "h-3 w-2"} -mt-1`}
        style={{
          background: won
            ? `linear-gradient(90deg, color-mix(in oklab, ${color} 30%, #000 70%), ${color}, color-mix(in oklab, ${color} 25%, #000 75%))`
            : "linear-gradient(90deg, #131b33, #263254, #131b33)",
        }}
      />
      <span
        className={`${size === "lg" ? "h-3 w-28" : size === "md" ? "h-1.5 w-14" : "h-1 w-10"} rounded-[3px]`}
        style={{
          background: won
            ? `linear-gradient(90deg, color-mix(in oklab, ${color} 25%, #000 75%), color-mix(in oklab, ${color} 85%, #fff 15%), color-mix(in oklab, ${color} 25%, #000 75%))`
            : "linear-gradient(90deg, #131b33, #2a3450, #131b33)",
          boxShadow: won ? `0 6px 18px -8px ${color}` : "none",
        }}
      />
      <span
        className={`${size === "lg" ? "h-4 w-40" : size === "md" ? "h-2 w-20" : "h-1.5 w-14"} rounded-[4px]`}
        style={{
          background: won
            ? `linear-gradient(180deg, color-mix(in oklab, ${color} 60%, #000 40%), color-mix(in oklab, ${color} 15%, #000 85%))`
            : "linear-gradient(180deg, #1e2a4b, #0a1020)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
        }}
      />
    </span>
  );
}

/** A cup's handle, drawn as a ring cut in half. */
function Handle({ side, size, won }: { side: "left" | "right"; size: "sm" | "md" | "lg"; won: boolean }) {
  const dim = size === "lg" ? "h-16 w-8" : size === "md" ? "h-8 w-4" : "h-6 w-3";
  return (
    <span
      aria-hidden
      className={`${dim} ${side === "left" ? "-mr-1.5" : "-ml-1.5"} ${won ? "" : "opacity-50"}`}
      style={{
        borderTop: "3px solid currentColor",
        borderBottom: "3px solid currentColor",
        [side === "left" ? "borderLeft" : "borderRight"]: "3px solid currentColor",
        borderRadius: side === "left" ? "999px 0 0 999px" : "0 999px 999px 0",
        opacity: won ? 0.85 : 0.4,
      }}
    />
  );
}
