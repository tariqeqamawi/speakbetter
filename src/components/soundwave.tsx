// The soundwave from the brand mark, animated. Three waves stroked with
// the category-color gradient, scrolling at different speeds so they
// drift in and out of phase and never visibly repeat.
//
// Each path is drawn across twice the viewBox width and animated by
// exactly one width, so the loop is seamless.

const VIEW_W = 400;

type Variant = "header" | "hero";

interface WaveSpec {
  period: number;
  amplitude: number;
  opacity: number;
  width: number;
  className: string;
}

interface VariantSpec {
  viewH: number;
  midY: number;
  waves: WaveSpec[];
  /** Edge fade stops — the header has to clear the logo and nav links. */
  fade: [number, number, number, number];
  /** Half-height of the lens the waves are clipped to, or 0 for none.
   *  In the brand mark the wave is a cluster of wide ribbons that swell
   *  in the middle and taper to points at both ends; clipping the
   *  scrolling waves to that silhouette gives the same shape while
   *  leaving the motion underneath untouched. */
  lens: number;
}

const variants: Record<Variant, VariantSpec> = {
  // Rides low in the header band, beneath the wordmark and navigation —
  // mirroring the mark, where the wave sits under the lion.
  // Rides low in the header band, beneath the wordmark and navigation.
  // It spans the whole page rather than sitting under the mark, so it
  // stays a thin scrolling line — no lens, no ribbon weight.
  header: {
    viewH: 44,
    midY: 33,
    fade: [14, 50, 86, 100],
    lens: 0,
    waves: [
      { period: 96, amplitude: 7, opacity: 0.5, width: 1.5, className: "soundwave-a" },
      { period: 132, amplitude: 5, opacity: 0.34, width: 1.2, className: "soundwave-b" },
      { period: 68, amplitude: 3.5, opacity: 0.24, width: 1, className: "soundwave-c" },
    ],
  },
  // The hero carries it at full strength, directly under the lion, so
  // the brand mark reads as one living thing. Wide, translucent ribbons
  // inside a tapered lens — the wave as the logo draws it.
  hero: {
    // Tall enough to hold the crests, the troughs, and the halo around
    // them — a shorter box clipped the tops off the waves.
    viewH: 80,
    midY: 40,
    fade: [4, 46, 94, 100],
    // Clear of the waves' full reach at the center, so nothing is cut
    // where the band is fullest; the taper does its work out toward
    // the points instead.
    lens: 27,
    // Thinner and more transparent than they look: each ribbon is drawn
    // twice — a blurred halo under a sharper core — so the color is
    // see-through everywhere and blooms where ribbons cross.
    waves: [
      { period: 104, amplitude: 13, opacity: 0.34, width: 7, className: "soundwave-a" },
      { period: 146, amplitude: 9.5, opacity: 0.3, width: 5.5, className: "soundwave-b" },
      { period: 74, amplitude: 6, opacity: 0.26, width: 4, className: "soundwave-c" },
    ],
  },
};

/** A smooth wave across `width`, oscillating `amplitude` either side of `midY`. */
function wavePath(width: number, period: number, amplitude: number, midY: number) {
  const half = period / 2;
  const c1 = period * 0.2;
  const c2 = period * 0.3;
  let d = `M0 ${midY}`;
  for (let x = 0; x < width; x += period) {
    d += ` c ${c1} ${-amplitude} ${c2} ${-amplitude} ${half} 0`;
    d += ` c ${c1} ${amplitude} ${c2} ${amplitude} ${half} 0`;
  }
  return d;
}

/** The tapered silhouette the hero's waves live inside: a lens pointed
 *  at both ends and fullest at the center. A cubic peaks at three
 *  quarters of its control height, so the controls are lifted to hit
 *  the requested half-height exactly. */
function lensPath(width: number, midY: number, halfHeight: number) {
  const h = halfHeight / 0.75;
  // Controls pulled toward the center stretch the taper across a wider
  // span, so the band narrows over the outer quarter at each end rather
  // than pinching only at the very tip.
  const a = width * 0.33;
  const b = width * 0.67;
  return (
    `M0 ${midY}` +
    ` C ${a} ${midY - h} ${b} ${midY - h} ${width} ${midY}` +
    ` C ${b} ${midY + h} ${a} ${midY + h} 0 ${midY}` +
    " Z"
  );
}

export function Soundwave({
  variant = "header",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  const spec = variants[variant];
  const gradientId = `soundwave-spectrum-${variant}`;
  const fadeId = `soundwave-fade-${variant}`;
  const maskId = `soundwave-mask-${variant}`;
  const clipId = `soundwave-lens-${variant}`;
  const glowId = `soundwave-glow-${variant}`;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${VIEW_W} ${spec.viewH}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-storytelling)" />
          <stop offset="16%" stopColor="var(--color-figurative)" />
          <stop offset="33%" stopColor="var(--color-acting)" />
          <stop offset="50%" stopColor="var(--color-structure)" />
          <stop offset="67%" stopColor="var(--color-mindset)" />
          <stop offset="84%" stopColor="var(--color-body-language)" />
          <stop offset="100%" stopColor="var(--color-advanced)" />
        </linearGradient>
        <linearGradient id={fadeId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset={`${spec.fade[0]}%`} stopColor="white" stopOpacity="0.85" />
          <stop offset={`${spec.fade[1]}%`} stopColor="white" stopOpacity="1" />
          <stop offset={`${spec.fade[2]}%`} stopColor="white" stopOpacity="0.85" />
          <stop offset={`${spec.fade[3]}%`} stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id={maskId}>
          <rect
            x="0"
            y="0"
            width={VIEW_W}
            height={spec.viewH}
            fill={`url(#${fadeId})`}
          />
        </mask>
        {spec.lens > 0 && (
          <>
            <clipPath id={clipId}>
              <path d={lensPath(VIEW_W, spec.midY, spec.lens)} />
            </clipPath>
            {/* The halo that makes the ribbons read as light rather than
                paint. Kept off the header, where a blur would cost more
                than it's worth on a thin line. */}
            <filter
              id={glowId}
              x="-10%"
              y="-40%"
              width="120%"
              height="180%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur stdDeviation="3.2" />
            </filter>
          </>
        )}
      </defs>

      {/* The lens is fixed to the viewport while the waves scroll beneath
          it, so the taper stays put instead of travelling with them. */}
      <g clipPath={spec.lens > 0 ? `url(#${clipId})` : undefined}>
        <g mask={`url(#${maskId})`}>
          {spec.waves.map((wave) => {
            const d = wavePath(
              VIEW_W * 2,
              wave.period,
              wave.amplitude,
              spec.midY,
            );
            return (
              <g
                key={wave.className}
                className={wave.className}
                // Overlaps brighten instead of muddying, the way the mark's
                // ribbons go pale where they cross.
                style={spec.lens > 0 ? { mixBlendMode: "screen" } : undefined}
              >
                {spec.lens > 0 && (
                  <path
                    d={d}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={wave.width * 1.9}
                    strokeLinecap="round"
                    opacity={wave.opacity * 0.8}
                    filter={`url(#${glowId})`}
                  />
                )}
                <path
                  d={d}
                  fill="none"
                  stroke={`url(#${gradientId})`}
                  strokeWidth={wave.width}
                  strokeLinecap="round"
                  opacity={wave.opacity}
                />
              </g>
            );
          })}
        </g>
      </g>
    </svg>
  );
}
