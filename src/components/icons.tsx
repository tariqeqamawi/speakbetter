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
