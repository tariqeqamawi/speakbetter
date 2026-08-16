// Player controls, drawn in the same stroke-only language as the rest
// of the interface.

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function PlayFillIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M8.5 5.4a1 1 0 0 1 1.53-.85l8.2 6.6a1 1 0 0 1 0 1.7l-8.2 6.6a1 1 0 0 1-1.53-.85V5.4Z" />
    </svg>
  );
}

export function PauseFillIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <rect x="7" y="5" width="3.6" height="14" rx="1.2" />
      <rect x="13.4" y="5" width="3.6" height="14" rx="1.2" />
    </svg>
  );
}

/** Captions - a frame with subtitle lines. */
export function CaptionsIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="2.75" y="5.25" width="18.5" height="13.5" rx="2.5" />
      <path d="M9.5 10.5a2.25 2.25 0 1 0 0 3M17 10.5a2.25 2.25 0 1 0 0 3" />
    </svg>
  );
}

/** Playback speed - a gauge needle. */
export function SpeedIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4.4 17.5a8.5 8.5 0 1 1 15.2 0" />
      <path d="m12 12.5 3.75-3.25" />
      <circle cx="12" cy="13.25" r="1.15" />
    </svg>
  );
}

/** Landscape zoom - push in, keeping the wide frame. */
export function ZoomLandscapeIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="2.75" y="6.5" width="18.5" height="11" rx="2" />
      <path d="M9 12h6M12 9.5v5" />
    </svg>
  );
}

/** Portrait zoom - crop to a tall frame. */
export function ZoomPortraitIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="7.5" y="2.75" width="9" height="18.5" rx="2" />
      <path d="M9.75 12h4.5M12 9.75v4.5" />
    </svg>
  );
}

/** Return to the default framing - a plain, unzoomed frame. */
export function ResetFrameIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.25" y="5.75" width="17.5" height="12.5" rx="2" />
    </svg>
  );
}

/** Enter fullscreen - corners pushing outward. */
export function FullscreenIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M8.75 3.25H5.5a2.25 2.25 0 0 0-2.25 2.25v3.25M15.25 3.25h3.25a2.25 2.25 0 0 1 2.25 2.25v3.25M8.75 20.75H5.5a2.25 2.25 0 0 1-2.25-2.25v-3.25M15.25 20.75h3.25a2.25 2.25 0 0 0 2.25-2.25v-3.25" />
    </svg>
  );
}

/** Leave fullscreen - corners pulling inward. */
export function ExitFullscreenIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.25 8.75H6.5a2.25 2.25 0 0 0 2.25-2.25V3.25M20.75 8.75H17.5a2.25 2.25 0 0 1-2.25-2.25V3.25M3.25 15.25H6.5a2.25 2.25 0 0 1 2.25 2.25v3.25M20.75 15.25H17.5a2.25 2.25 0 0 0-2.25 2.25v3.25" />
    </svg>
  );
}
