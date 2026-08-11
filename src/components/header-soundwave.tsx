// The soundwave under the lion in the brand mark, brought into the
// header: three waves in the category colors, scrolling at different
// speeds so they drift in and out of phase and never visibly repeat.
//
// Each path is drawn across twice the viewBox width and animated by
// exactly one width, so the loop is seamless.

const VIEW_W = 400;
const VIEW_H = 44;

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

// In the brand mark the soundwave runs beneath the lion, so it rides
// low in the header band here too — under the wordmark and navigation
// rather than through them.
const MID_Y = 33;

const waves = [
  { period: 96, amplitude: 7, opacity: 0.5, width: 1.5, className: "soundwave-a" },
  { period: 132, amplitude: 5, opacity: 0.34, width: 1.2, className: "soundwave-b" },
  { period: 68, amplitude: 3.5, opacity: 0.24, width: 1, className: "soundwave-c" },
];

export function HeaderSoundwave() {
  return (
    <svg
      className="soundwave pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="soundwave-spectrum" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-storytelling)" />
          <stop offset="16%" stopColor="var(--color-figurative)" />
          <stop offset="33%" stopColor="var(--color-acting)" />
          <stop offset="50%" stopColor="var(--color-structure)" />
          <stop offset="67%" stopColor="var(--color-mindset)" />
          <stop offset="84%" stopColor="var(--color-body-language)" />
          <stop offset="100%" stopColor="var(--color-advanced)" />
        </linearGradient>
        {/* Fade the wave out at both ends so it never collides with the
            logo or the navigation. */}
        <linearGradient id="soundwave-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="14%" stopColor="white" stopOpacity="0.85" />
          <stop offset="50%" stopColor="white" stopOpacity="1" />
          <stop offset="86%" stopColor="white" stopOpacity="0.85" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="soundwave-mask">
          <rect
            x="0"
            y="0"
            width={VIEW_W}
            height={VIEW_H}
            fill="url(#soundwave-fade)"
          />
        </mask>
      </defs>

      <g mask="url(#soundwave-mask)">
        {waves.map((wave) => (
          <g key={wave.className} className={wave.className}>
            <path
              d={wavePath(VIEW_W * 2, wave.period, wave.amplitude, MID_Y)}
              fill="none"
              stroke="url(#soundwave-spectrum)"
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
