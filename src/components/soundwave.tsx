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
}

const variants: Record<Variant, VariantSpec> = {
  // Rides low in the header band, beneath the wordmark and navigation —
  // mirroring the mark, where the wave sits under the lion.
  header: {
    viewH: 44,
    midY: 33,
    fade: [14, 50, 86, 100],
    waves: [
      { period: 96, amplitude: 7, opacity: 0.5, width: 1.5, className: "soundwave-a" },
      { period: 132, amplitude: 5, opacity: 0.34, width: 1.2, className: "soundwave-b" },
      { period: 68, amplitude: 3.5, opacity: 0.24, width: 1, className: "soundwave-c" },
    ],
  },
  // The hero carries it at full strength, directly under the lion, so
  // the brand mark reads as one living thing.
  hero: {
    viewH: 64,
    midY: 32,
    fade: [8, 50, 92, 100],
    waves: [
      { period: 104, amplitude: 17, opacity: 0.95, width: 2.4, className: "soundwave-a" },
      { period: 146, amplitude: 12, opacity: 0.65, width: 1.9, className: "soundwave-b" },
      { period: 74, amplitude: 8, opacity: 0.45, width: 1.4, className: "soundwave-c" },
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
      </defs>

      <g mask={`url(#${maskId})`}>
        {spec.waves.map((wave) => (
          <g key={wave.className} className={wave.className}>
            <path
              d={wavePath(VIEW_W * 2, wave.period, wave.amplitude, spec.midY)}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={wave.width}
              strokeLinecap="round"
              opacity={wave.opacity}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}
