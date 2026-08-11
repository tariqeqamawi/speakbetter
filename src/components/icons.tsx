// Navigation icons — a matched set drawn on a 24×24 grid, stroke-only
// with round caps and joins, so they sit quietly in the interface and
// take their color from whatever they're placed on.

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Two figures side by side — other students. */
export function CommunityIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="9.5" cy="8" r="3.25" />
      <path d="M3.75 19.25c.55-3.15 2.85-5 5.75-5s5.2 1.85 5.75 5" />
      <path d="M16.5 5.6a3 3 0 0 1 0 5.55" />
      <path d="M17.6 14.6c2.05.45 3.4 2.05 3.9 4.65" />
    </svg>
  );
}

/** A target — each challenge is a task with a clear goal. */
export function ChallengesIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.75" />
      <circle cx="12" cy="12" r="1.15" />
    </svg>
  );
}

/** Stacked layers — the library of short lessons. */
export function SkillsIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.25 3.5 7.5 12 11.75 20.5 7.5 12 3.25Z" />
      <path d="m3.5 12 8.5 4.25L20.5 12" />
      <path d="m3.5 16.5 8.5 4.25 8.5-4.25" />
    </svg>
  );
}

/** A single figure — the student's own corner of the app. */
export function ProfileIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="8.25" r="3.75" />
      <path d="M4.75 20.25c.7-3.7 3.55-5.75 7.25-5.75s6.55 2.05 7.25 5.75" />
    </svg>
  );
}

// ── Supporting icons ──────────────────────────────────────────────────
// Same grid, same weight. Everything in the interface is drawn, never
// a filled emoji, so icons take the color of whatever they sit on.

export function GraduationCapIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 4 2.75 8.5 12 13l9.25-4.5L12 4Z" />
      <path d="M6.5 10.75v4.9c0 1.5 2.46 2.85 5.5 2.85s5.5-1.35 5.5-2.85v-4.9" />
      <path d="M21.25 8.5v5" />
    </svg>
  );
}

export function VideoIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="2.75" y="6" width="12.5" height="12" rx="2.5" />
      <path d="m15.25 10.5 6-3v9l-6-3" />
    </svg>
  );
}

/** Nested arcs — the color spectrum, drawn rather than colored in. */
export function SpectrumIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 17.5a9 9 0 0 1 18 0" />
      <path d="M6.75 17.5a5.25 5.25 0 0 1 10.5 0" />
      <path d="M10.5 17.5a1.5 1.5 0 0 1 3 0" />
    </svg>
  );
}

export function FilmIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="4.75" width="18" height="14.5" rx="2.5" />
      <path d="M7.5 4.75v14.5M16.5 4.75v14.5M3 12h18M3 8.4h4.5M3 15.6h4.5M16.5 8.4H21M16.5 15.6H21" />
    </svg>
  );
}

export function TrendingUpIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m3.5 16.5 5-5 3.5 3.5 6-6" />
      <path d="M15 9h3.5v3.5" />
    </svg>
  );
}

export function RepeatIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4.25 11.25V10a3.25 3.25 0 0 1 3.25-3.25h11" />
      <path d="m15.5 3.5 3.25 3.25L15.5 10" />
      <path d="M19.75 12.75V14a3.25 3.25 0 0 1-3.25 3.25h-11" />
      <path d="m8.5 20.5-3.25-3.25L8.5 14" />
    </svg>
  );
}

export function CheckCircleIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.75" />
      <path d="m8.25 12.25 2.5 2.5 5-5.5" />
    </svg>
  );
}

export function FlameIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5Z" />
    </svg>
  );
}

export function ZapIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M13.25 2.75 4.5 13.5h6.25l-.75 7.75 8.75-10.75H12.5l.75-7.75Z" />
    </svg>
  );
}

export function MedalIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="15" r="5.25" />
      <path d="M8.75 10.35 5.5 3.5h5l2 4.25M15.25 10.35 18.5 3.5h-5" />
    </svg>
  );
}

export function TrophyIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M7.5 3.75h9v5.5a4.5 4.5 0 0 1-9 0v-5.5Z" />
      <path d="M7.5 5.5H4.75v1.75A3.25 3.25 0 0 0 8 10.5M16.5 5.5h2.75v1.75a3.25 3.25 0 0 1-3.25 3.25" />
      <path d="M12 13.75v3.5M8.75 20.25h6.5M9.75 17.25h4.5l1 3h-6.5l1-3Z" />
    </svg>
  );
}

export function PlayIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M8.75 5.75 18 12l-9.25 6.25V5.75Z" />
    </svg>
  );
}

export function CheckIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m4.75 12.5 4.5 4.5 10-10.5" />
    </svg>
  );
}

export function CircleIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="7.75" />
    </svg>
  );
}

/** Badge artwork, keyed by the name stored on an earned badge. */
const badgeIcons = {
  film: FilmIcon,
  video: VideoIcon,
  "trending-up": TrendingUpIcon,
  repeat: RepeatIcon,
  "check-circle": CheckCircleIcon,
  spectrum: SpectrumIcon,
  flame: FlameIcon,
  zap: ZapIcon,
  medal: MedalIcon,
  trophy: TrophyIcon,
} as const;

export type BadgeIconName = keyof typeof badgeIcons;

export function BadgeIcon({
  name,
  className = "size-6",
}: {
  name: string;
  className?: string;
}) {
  const Icon = badgeIcons[name as BadgeIconName] ?? MedalIcon;
  return <Icon className={className} />;
}
