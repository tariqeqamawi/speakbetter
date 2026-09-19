// The soundwave from the brand mark, animated. Three waves stroked with
// the category-color gradient, scrolling at different speeds so they
// drift in and out of phase and never visibly repeat.
//
// Each path is drawn across twice the viewBox width and animated by
// exactly one width, so the loop is seamless.

const VIEW_W = 400;

type Variant = "header" | "hero" | "coach";

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
  /** Edge fade stops - the header has to clear the logo and nav links. */
  fade: [number, number, number, number];
  /** Half-height of the lens the waves are clipped to, or 0 for none.
   *  In the brand mark the wave is a cluster of wide ribbons that swell
   *  in the middle and taper to points at both ends; clipping the
   *  scrolling waves to that silhouette gives the same shape while
   *  leaving the motion underneath untouched. */
  lens: number;
}

const variants: Record<Variant, VariantSpec> = {
  // Rides low in the header band, beneath the wordmark and navigation -
  // mirroring the mark, where the wave sits under the lion.
  // Rides low in the header band, beneath the wordmark and navigation.
  // It spans the whole page rather than sitting under the mark, so it
  // stays a thin scrolling line - no lens, no ribbon weight.
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
  // inside a tapered lens - the wave as the logo draws it.
  hero: {
    // Tall enough to hold the crests, the troughs, and the halo around
    // them - a shorter box clipped the tops off the waves.
    viewH: 80,
    midY: 40,
    fade: [4, 46, 94, 100],
    // Clear of the waves' full reach at the center, so nothing is cut
    // where the band is fullest; the taper does its work out toward
    // the points instead.
    lens: 27,
    // Thinner and more transparent than they look: each ribbon is drawn
    // twice - a blurred halo under a sharper core - so the color is
    // see-through everywhere and blooms where ribbons cross.
    waves: [
      { period: 104, amplitude: 13, opacity: 0.34, width: 7, className: "soundwave-a" },
      { period: 146, amplitude: 9.5, opacity: 0.3, width: 5.5, className: "soundwave-b" },
      { period: 74, amplitude: 6, opacity: 0.26, width: 4, className: "soundwave-c" },
    ],
  },
  // Under the talking lion, at a third of the hero's width: the same
  // ribbons drawn heavier and brighter, so at that size they read as
  // the logo's wave - a band of color - and not three threads.
  coach: {
    viewH: 80,
    midY: 40,
    fade: [3, 40, 96, 100],
    lens: 30,
    waves: [
      { period: 96, amplitude: 15, opacity: 0.6, width: 12, className: "soundwave-a" },
      { period: 138, amplitude: 11, opacity: 0.55, width: 9.5, className: "soundwave-b" },
      { period: 70, amplitude: 7.5, opacity: 0.5, width: 7, className: "soundwave-c" },
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

/**
 * The header wave, built to cost nothing per frame.
 *
 * The first version was one SVG: three groups scrolling under an SVG
 * mask. A transform on an SVG group isn't handed to the compositor,
 * and a mask means the whole masked area is re-rasterized every frame
 * - at the full width of a desktop window, sixty times a second, for
 * the life of every page. It was the choppiness at the top of the
 * screen. So the header is three separate SVGs, one wave each, moved
 * as HTML elements (which the compositor animates on its own thread,
 * with no paint at all), and the edge fade is a CSS mask on the
 * wrapper, which is composited too. Same picture; the main thread
 * never hears about it.
 */
function HeaderWave({ className }: { className: string }) {
  const spec = variants.header;
  const gradientId = "soundwave-spectrum-header";
  const [f0, f1, f2, f3] = spec.fade;
  const fade = `linear-gradient(to right, transparent 0%, rgba(0,0,0,0.85) ${f0}%, #000 ${f1}%, rgba(0,0,0,0.85) ${f2}%, transparent ${f3}%)`;
  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ maskImage: fade, WebkitMaskImage: fade }}
      aria-hidden
    >
      <svg width="0" height="0" className="absolute" aria-hidden>
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
        </defs>
      </svg>
      {spec.waves.map((wave) => (
        <svg
          key={wave.className}
          className={`absolute inset-y-0 left-0 h-full w-[200%] ${wave.className}`}
          viewBox={`0 0 ${VIEW_W * 2} ${spec.viewH}`}
          preserveAspectRatio="none"
        >
          <path
            d={wavePath(VIEW_W * 2, wave.period, wave.amplitude, spec.midY)}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={wave.width}
            strokeLinecap="round"
            opacity={wave.opacity}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ))}
    </div>
  );
}

export function Soundwave({
  variant = "header",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  if (variant === "header") return <HeaderWave className={className} />;
  const spec = variants[variant];
  const gradientId = `soundwave-spectrum-${variant}`;
  const clipId = `soundwave-lens-${variant}`;
  // The fade at both ends, as a CSS mask on the wrapper; the lens as a
  // clip on it too. Both are fixed to the viewport while the ribbons
  // scroll beneath - and each ribbon is its own svg moved by a
  // compositor transform, so nothing is repainted as it moves. (One
  // svg with the ribbons scrolling inside it under a mask and a clip
  // repainted the whole thing every frame.)
  const [f0, f1, f2, f3] = spec.fade;
  const fade = `linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.85) ${f0}%, #000 ${f1}%, rgba(0,0,0,0.85) ${f2}%, transparent ${f3}%)`;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        WebkitMaskImage: fade,
        maskImage: fade,
        clipPath: spec.lens > 0 ? `url(#${clipId})` : undefined,
      }}
      aria-hidden
    >
      <svg width="0" height="0" className="absolute" aria-hidden>
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
          {spec.lens > 0 && (
            <clipPath id={clipId} clipPathUnits="objectBoundingBox">
              <path d={lensPath(VIEW_W, spec.midY, spec.lens)} transform={`scale(${1 / VIEW_W} ${1 / spec.viewH})`} />
            </clipPath>
          )}
        </defs>
      </svg>
      {spec.waves.map((wave) => {
        const d = wavePath(VIEW_W * 2, wave.period, wave.amplitude, spec.midY);
        return (
          <svg
            key={wave.className}
            className={`absolute inset-y-0 left-0 h-full w-[200%] ${wave.className}`}
            viewBox={`0 0 ${VIEW_W * 2} ${spec.viewH}`}
            preserveAspectRatio="none"
            // Overlaps brighten instead of muddying, the way the mark's
            // ribbons go pale where they cross.
            style={spec.lens > 0 ? { mixBlendMode: "screen" } : undefined}
          >
            {/* The halo: two wider, fainter passes of the ribbon rather
                than a blur, which would be re-blurred as it moved. */}
            {spec.lens > 0 && (
              <>
                <path d={d} fill="none" stroke={`url(#${gradientId})`} strokeWidth={wave.width * 3.2} strokeLinecap="round" opacity={wave.opacity * 0.18} />
                <path d={d} fill="none" stroke={`url(#${gradientId})`} strokeWidth={wave.width * 1.9} strokeLinecap="round" opacity={wave.opacity * 0.4} />
              </>
            )}
            <path d={d} fill="none" stroke={`url(#${gradientId})`} strokeWidth={wave.width} strokeLinecap="round" opacity={wave.opacity} />
          </svg>
        );
      })}
    </div>
  );
}
