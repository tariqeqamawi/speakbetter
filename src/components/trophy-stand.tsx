"use client";

import { BadgeIcon } from "@/components/icons";

// A trophy: a cup, drawn.
//
// It began as the badge's medallion mounted in a ring, which still read
// as a medal wearing a frame - a sticker with handles. This is the
// shape everybody pictures when they hear the word: a wide bowl on a
// stem on a plinth, two handles, the rim catching the light, and the
// badge's own symbol engraved on the bowl the way a real cup is.
//
// Nothing here is a picture. The cup is one SVG colored by
// `currentColor`, so all forty-odd badges become trophies without any
// art being drawn for them, and each wears its own color at any size.
//
// Won, it's metal in its color with a sheen traveling across it. Not
// yet won, it's the same cup in dull pewter - you can see exactly what
// you haven't won, which is the whole point of a case with empty
// stands in it.

/** Each trophy owns one of the seven colors, settled by its id so it
 *  never changes between visits. */
const COLORS = ["storytelling", "figurative", "acting", "structure", "mindset", "body-language", "advanced"] as const;

export function trophyColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return COLORS[hash % COLORS.length];
}

const CUP = { sm: "h-16", md: "h-24", lg: "h-56 sm:h-64" } as const;
const ETCH = { sm: "size-4", md: "size-6", lg: "size-14 sm:size-16" } as const;

export function TrophyStand({
  id,
  icon,
  won,
  size = "md",
  flip = false,
  pedestal = true,
  className = "",
}: {
  id: string;
  icon: string;
  won: boolean;
  size?: "sm" | "md" | "lg";
  /** Let the sheen travel across the cup, as though it were turning
   *  under the light. On for the one standing in the case. */
  flip?: boolean;
  /** Draw the pool of light under the cup. Off in the case, where the
   *  podium is the stage's and only the cup standing on it changes. */
  pedestal?: boolean;
  className?: string;
}) {
  const color = `var(--color-${trophyColor(id)})`;
  // Gradient ids have to be unique per trophy on the page.
  const uid = `t${id.replace(/[^a-zA-Z0-9]/g, "")}${size}`;

  return (
    <span
      className={`relative flex flex-col items-center ${className}`}
      style={{ color: won ? color : "#5a688f" }}
    >
      <span className="relative flex flex-col items-center">
        <svg
          viewBox="0 0 120 176"
          className={`${CUP[size]} w-auto ${won ? "" : "opacity-75"}`}
          role="img"
          aria-label={won ? "Trophy, won" : "Trophy, not yet won"}
        >
          <defs>
            {/* The metal: a bright edge, the body in its color, a dark
                side where it turns away from the light. */}
            <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#000" stopOpacity="0.45" />
              <stop offset="14%" stopColor="currentColor" stopOpacity="0.85" />
              <stop offset="30%" stopColor="#fff" stopOpacity="0.5" />
              <stop offset="48%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="72%" stopColor="currentColor" stopOpacity="0.75" />
              <stop offset="88%" stopColor="#000" stopOpacity="0.35" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.7" />
              <stop offset="35%" stopColor="#fff" stopOpacity="0.85" />
              <stop offset="70%" stopColor="currentColor" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id={`${uid}-base`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fff" stopOpacity="0" />
              <stop offset="50%" stopColor="#fff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <clipPath id={`${uid}-bowl`}>
              <path d="M26 30 H94 C94 74 80 100 60 106 C40 100 26 74 26 30 Z" />
            </clipPath>
          </defs>

          {/* The handles, behind the bowl so they read as attached. */}
          <path
            d="M27 38 C4 40 4 84 30 86"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.75"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M93 38 C116 40 116 84 90 86"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.75"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* The bowl. */}
          <path d="M26 30 H94 C94 74 80 100 60 106 C40 100 26 74 26 30 Z" fill={`url(#${uid}-body)`} />

          {/* The light traveling across it, clipped to the bowl. */}
          {flip && won && (
            <g clipPath={`url(#${uid}-bowl)`}>
              <rect className="trophy-sheen" x="-60" y="26" width="40" height="84" fill={`url(#${uid}-sheen)`} />
            </g>
          )}

          {/* The rim, catching the light. */}
          <rect x="22" y="24" width="76" height="10" rx="5" fill={`url(#${uid}-rim)`} />

          {/* Stem, knop, and the plinth it stands on. */}
          <path d="M53 106 H67 L64 128 H56 Z" fill={`url(#${uid}-body)`} />
          <ellipse cx="60" cy="130" rx="13" ry="4.5" fill={`url(#${uid}-rim)`} />
          <path d="M44 134 H76 L82 150 H38 Z" fill={`url(#${uid}-base)`} />
          <rect x="32" y="150" width="56" height="11" rx="3" fill={`url(#${uid}-rim)`} />
          <rect x="26" y="161" width="68" height="7" rx="3" fill={`url(#${uid}-base)`} />
        </svg>

        {/* The engraving: the badge's own symbol, cut into the bowl.
            Drawn over the cup rather than inside the SVG, because an
            icon is an <svg> of its own and nesting one loses its size.
            The bowl's middle is 50% across and 36% down. */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[36%] -translate-x-1/2 -translate-y-1/2"
          style={{ color: "#0a0f1f", opacity: won ? 0.5 : 0.35, filter: "drop-shadow(0 1px 0 rgba(255,255,255,0.28))" }}
        >
          <BadgeIcon name={icon} className={ETCH[size]} />
        </span>
      </span>

      {/* The pool of light it stands in, where the trophy stands alone
          rather than in the case (which lights its own podium). */}
      {pedestal && (
        <span
          aria-hidden
          className="-mt-1 rounded-[50%] blur-md"
          style={{
            width: size === "lg" ? "11rem" : size === "md" ? "4.5rem" : "3rem",
            height: size === "lg" ? "1.1rem" : "0.5rem",
            background: won ? color : "rgba(30,42,75,0.8)",
            opacity: won ? 0.4 : 0.2,
          }}
        />
      )}
    </span>
  );
}
