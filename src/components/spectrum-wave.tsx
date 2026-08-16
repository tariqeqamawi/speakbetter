"use client";

import { useId } from "react";
import { categories, type CategoryId } from "@/data/categories";

// The resonance trace, on its own so any spectrum can wear it: one
// continuous wave whose peaks sit over the colors they belong to,
// bleeding into each other where they meet. Heights are scaled against
// the loudest channel, so the shape reads at any spread; the caller
// shows the true numbers alongside.

const W = 700;
const H = 200;
const FLOOR = H - 4;
const CEILING = 18;

interface Pt {
  x: number;
  y: number;
}

/** A Catmull-Rom spline through the points, emitted as cubic beziers -
 *  the curve passes through every peak instead of merely approaching it,
 *  so a channel's height still reads as its true value. */
function smooth(points: Pt[]): string {
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    d +=
      ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}` +
      ` ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}` +
      ` ${p2.x} ${p2.y}`;
  }
  return d;
}

export function SpectrumWave({
  values,
  className = "h-48 w-full sm:h-56",
  animate = true,
}: {
  values: Record<CategoryId, number>;
  className?: string;
  animate?: boolean;
}) {
  // Unique per instance, so two waves on one page don't share defs.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const top = Math.max(...categories.map((c) => values[c.id] ?? 0), 1);

  const step = W / categories.length;
  const peaks: Pt[] = categories.map((cat, i) => ({
    x: step * (i + 0.5),
    y: FLOOR - ((values[cat.id] ?? 0) / top) * (FLOOR - CEILING),
  }));
  const points: Pt[] = [
    { x: -step * 0.6, y: FLOOR },
    ...peaks,
    { x: W + step * 0.6, y: FLOOR },
  ];
  const line = smooth(points);
  const area = `${line} L ${W + step} ${FLOOR + 40} L ${-step} ${FLOOR + 40} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={`relative ${className}`}
      aria-hidden
    >
      <defs>
        {/* Each peak sits over its own color, and the stops bleed into
            their neighbors between peaks. */}
        <linearGradient id={`trace-${uid}`} x1="0" y1="0" x2="1" y2="0">
          {categories.map((cat, i) => (
            <stop
              key={cat.id}
              offset={`${((i + 0.5) / categories.length) * 100}%`}
              stopColor={`var(--color-${cat.id})`}
            />
          ))}
        </linearGradient>
        <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.55" />
          <stop offset="100%" stopColor="white" stopOpacity="0.04" />
        </linearGradient>
        <mask id={`fade-${uid}`}>
          <rect width={W} height={H + 40} fill={`url(#fill-${uid})`} />
        </mask>
        <filter
          id={`glow-${uid}`}
          x="-10%"
          y="-30%"
          width="120%"
          height="180%"
        >
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/* Bleed: a heavily blurred copy under everything, so color spills
          past the line the way light does. */}
      <path
        d={area}
        fill={`url(#trace-${uid})`}
        opacity="0.5"
        filter={`url(#glow-${uid})`}
        className={animate ? "eq-wave-slow" : undefined}
      />
      {/* Body of the trace, fading out toward the floor. */}
      <path
        d={area}
        fill={`url(#trace-${uid})`}
        mask={`url(#fade-${uid})`}
        className={animate ? "eq-wave" : undefined}
      />
      {/* The line itself, twice: a glow and a crisp edge. */}
      <path
        d={line}
        fill="none"
        stroke={`url(#trace-${uid})`}
        strokeWidth="9"
        strokeLinecap="round"
        opacity="0.55"
        filter={`url(#glow-${uid})`}
        className={animate ? "eq-wave" : undefined}
      />
      <path
        d={line}
        fill="none"
        stroke={`url(#trace-${uid})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        className={animate ? "eq-wave" : undefined}
      />
    </svg>
  );
}
