import type { CategoryId } from "@/data/categories";

// One icon per skill category, drawn on the same 24×24 grid as the rest
// of the set. Each takes its color from the category it belongs to, so
// the seven read as a family while staying individually recognizable.

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

/** An open book — stories. */
function StorytellingIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 6.75C10.5 5.4 8.6 4.75 6 4.75H3.25v13H6c2.6 0 4.5.65 6 2 1.5-1.35 3.4-2 6-2h2.75v-13H18c-2.6 0-4.5.65-6 1.95Z" />
      <path d="M12 6.75v12.05" />
    </svg>
  );
}

/** Quote marks — language that stands for something else. */
function FigurativeIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9.25 6.5C6.9 7.6 5.25 9.9 5.25 12.6v4.9h5.25v-5.75H8.1c0-1.9.5-3.4 1.9-4.35Z" />
      <path d="M19.25 6.5c-2.35 1.1-4 3.4-4 6.1v4.9h5.25v-5.75H18.1c0-1.9.5-3.4 1.9-4.35Z" />
    </svg>
  );
}

/** Theatre masks, simplified to one — acting. */
function ActingIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4.75 5.25h14.5v6.5a7.25 7.25 0 0 1-14.5 0v-6.5Z" />
      <path d="M9 9.25h.01M15 9.25h.01" />
      <path d="M9.5 14.25c.7.8 1.5 1.2 2.5 1.2s1.8-.4 2.5-1.2" />
    </svg>
  );
}

/** Stacked blocks — the architecture of a talk. */
function StructureIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.75" y="4.25" width="16.5" height="4.5" rx="1.4" />
      <rect x="3.75" y="11.25" width="16.5" height="4.5" rx="1.4" />
      <path d="M7.5 18.5h9" />
    </svg>
  );
}

/** A head with a spark inside — the inner game. */
function MindsetIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M15.5 20.25v-2.1c2.4-1.2 4-3.5 4-6.15a7.5 7.5 0 1 0-11 6.6v1.65" />
      <path d="M8.5 20.25h7" />
      <path d="M12 6.75v3.5M12 13.5h.01" />
    </svg>
  );
}

/** A figure with arms out — physical expression. */
function BodyLanguageIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="5" r="2.25" />
      <path d="M12 7.25v7" />
      <path d="M4.75 10.5c2.4 1.1 4.8 1.65 7.25 1.65s4.85-.55 7.25-1.65" />
      <path d="m12 14.25-2.75 5.5M12 14.25l2.75 5.5" />
    </svg>
  );
}

/** A star with a spark — the professional's extras. */
function AdvancedIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m13.5 3.5 2.15 4.5 4.85.7-3.5 3.45.83 4.9-4.33-2.3-4.33 2.3.83-4.9-3.5-3.45 4.85-.7L13.5 3.5Z" />
      <path d="M5 17.5v3M3.5 19h3" />
    </svg>
  );
}

const icons: Record<CategoryId, (p: IconProps) => React.ReactElement> = {
  storytelling: StorytellingIcon,
  figurative: FigurativeIcon,
  acting: ActingIcon,
  structure: StructureIcon,
  mindset: MindsetIcon,
  "body-language": BodyLanguageIcon,
  advanced: AdvancedIcon,
};

export function CategoryIcon({
  category,
  className = "size-6",
}: {
  category: CategoryId;
  className?: string;
}) {
  const Icon = icons[category];
  return <Icon className={className} />;
}
