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
  ghost,
  className = "h-48 w-full sm:h-56",
  animate = true,
  highlight,
  max,
}: {
  values: Record<CategoryId, number>;
  /** A second trace behind the first, drawn as a faint dashed outline -
   *  where the student started, under where they are now. Scaled on the
   *  same ceiling as the main trace, so the two can be compared. */
  ghost?: Record<CategoryId, number>;
  className?: string;
  animate?: boolean;
  /** Colors to make glow - the ones a challenge needs. Their column of
   *  the trace burns brighter and pools light under the peak. */
  highlight?: CategoryId[];
  /** A fixed top of the scale instead of the loudest channel - so two
   *  spectra shown in turn (before and after) share one scale and the
   *  growth shows. */
  max?: number;
}) {
  // Unique per instance, so two waves on one page don't share defs.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const top = max ?? Math.max(
    ...categories.map((c) => values[c.id] ?? 0),
    ...(ghost ? categories.map((c) => ghost[c.id] ?? 0) : []),
    1,
  );

  const step = W / categories.length;
  const traceOf = (vals: Record<CategoryId, number>) => {
    const peaks: Pt[] = categories.map((cat, i) => ({
      x: step * (i + 0.5),
      y: FLOOR - ((vals[cat.id] ?? 0) / top) * (FLOOR - CEILING),
    }));
    return smooth([{ x: -step * 0.6, y: FLOOR }, ...peaks, { x: W + step * 0.6, y: FLOOR }]);
  };
  const peaks: Pt[] = categories.map((cat, i) => ({
    x: step * (i + 0.5),
    y: FLOOR - ((values[cat.id] ?? 0) / top) * (FLOOR - CEILING),
  }));
  const line = traceOf(values);
  const ghostLine = ghost ? traceOf(ghost) : null;
  const area = `${line} L ${W + step} ${FLOOR + 40} L ${-step} ${FLOOR + 40} Z`;

  const defs = (
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
      <filter id={`glow-${uid}`} x="-10%" y="-30%" width="120%" height="180%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
    </defs>
  );

  return (
    <div className={`relative ${className}`} aria-hidden>
      {/* The breath is one transform on the whole drawing, so the blur
          underneath is rasterised once - animating the filtered paths
          themselves re-blurred every frame. */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className={`absolute inset-0 size-full origin-bottom will-change-transform ${animate ? "eq-wave" : ""}`}
      >
        {defs}
        {/* Bleed: a heavily blurred copy under everything, so color spills
            past the line the way light does. */}
        <path
          d={area}
          fill={`url(#trace-${uid})`}
          opacity="0.5"
          filter={`url(#glow-${uid})`}
        />
        {/* Body of the trace, fading out toward the floor. */}
        <path
          d={area}
          fill={`url(#trace-${uid})`}
          mask={`url(#fade-${uid})`}
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
        />
        <path
          d={line}
          fill="none"
          stroke={`url(#trace-${uid})`}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Where they started, behind: the same shape, dashed and pale,
            so the distance traveled is the gap between the two lines. */}
        {ghostLine && (
          <path
            d={ghostLine}
            fill="none"
            stroke="var(--color-ink-faint)"
            strokeWidth="2"
            strokeDasharray="10 9"
            strokeLinecap="round"
            opacity="0.75"
          />
        )}
      </svg>

      {/* The colors this challenge needs, lit from within: a pool of
          the color under the peak and the trace burning brighter across
          that column. Each is its own SVG on its own layer, so the pulse
          is a compositor opacity change - the blur is drawn once, not
          sixty times a second. */}
      {categories.map((cat, i) =>
        highlight?.includes(cat.id) ? (
          <svg
            key={cat.id}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="spectrum-needed absolute inset-0 size-full will-change-[opacity]"
            style={{ animationDelay: `${i * 0.35}s` }}
          >
            <defs>
              <filter id={`pool-${uid}-${cat.id}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="16" />
              </filter>
              <filter id={`glow-${uid}-${cat.id}`} x="-10%" y="-30%" width="120%" height="180%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
              <linearGradient id={`feather-${uid}-${cat.id}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="white" stopOpacity="0" />
                <stop offset="35%" stopColor="white" stopOpacity="1" />
                <stop offset="65%" stopColor="white" stopOpacity="1" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <mask id={`col-${uid}-${cat.id}`}>
                <rect
                  x={step * (i - 0.35)}
                  y={-40}
                  width={step * 1.7}
                  height={H + 80}
                  fill={`url(#feather-${uid}-${cat.id})`}
                />
              </mask>
            </defs>
            <ellipse
              cx={peaks[i].x}
              cy={Math.min(FLOOR - 10, peaks[i].y + (FLOOR - peaks[i].y) * 0.45)}
              rx={step * 0.55}
              ry={Math.max(28, (FLOOR - peaks[i].y) * 0.7)}
              fill={`var(--color-${cat.id})`}
              opacity="0.7"
              filter={`url(#pool-${uid}-${cat.id})`}
            />
            <path
              d={line}
              fill="none"
              stroke={`var(--color-${cat.id})`}
              strokeWidth="16"
              strokeLinecap="round"
              filter={`url(#glow-${uid}-${cat.id})`}
              mask={`url(#col-${uid}-${cat.id})`}
            />
          </svg>
        ) : null,
      )}
    </div>
  );
}
