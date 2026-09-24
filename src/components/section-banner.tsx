import type { ComponentType, ReactNode } from "react";

// The header of a dashboard panel: the section's icon in a ring tinted
// its color, the title large and plain, whatever belongs on the right
// (a count, a control), and a rule in the color beneath. It used to
// be a wide plate of the section's picture - the fire of the streak,
// the neon lion - faded into the card; the pictures competed with the
// data, which is also in color, and the student found the page loud.
// The `image` prop is kept so callers needn't change; nothing draws it.

export function SectionBanner({
  title,
  Icon,
  accentClass = "text-ink",
  right,
  afterTitle,
  /** Headline treatment: the title sits large beside its icon, for the
   *  panels where the section name is the headline rather than a label. */
  large = false,
}: {
  /** Unused since the plates went; kept for the callers. */
  image?: string;
  title: string;
  Icon: ComponentType<{ className?: string }>;
  accentClass?: string;
  right?: ReactNode;
  /** Sits immediately after the title, not out at the frame edge.
   *  For a control that belongs to the WORD - "Challenges ->" reads as
   *  one thing, where the same arrow pinned to the right margin reads
   *  as unrelated furniture and is a longer reach on a phone. */
  afterTitle?: ReactNode;
  large?: boolean;
}) {
  const accentVar = accentClass === "text-ink" ? "var(--color-ink-faint)" : `var(--color-${accentClass.replace("text-", "")})`;
  return (
    <div className="flex w-full shrink-0 flex-col">
      <div className={`flex items-center gap-3 px-5 ${large ? "pb-3 pt-5" : "pb-2.5 pt-4"}`}>
        <span
          className={`grid shrink-0 place-items-center rounded-full border ${accentClass} ${large ? "size-11" : "size-9"}`}
          style={{
            borderColor: `color-mix(in oklab, ${accentVar} 45%, transparent)`,
            background: `color-mix(in oklab, ${accentVar} 12%, transparent)`,
          }}
        >
          <Icon className={large ? "size-6" : "size-4.5"} />
        </span>
        <h2 className={large ? "text-2xl font-bold tracking-tight text-ink sm:text-3xl" : "text-base font-semibold text-ink"}>
          {title}
        </h2>
        {afterTitle}
        {right && <span className="ml-auto">{right}</span>}
      </div>
      <span aria-hidden className="mx-5 h-px" style={{ background: `linear-gradient(90deg, ${accentVar}, transparent)`, opacity: 0.5 }} />
    </div>
  );
}

/**
 * A named, foldable part of a panel.
 *
 * The Challenges panel is a banner, three figures, the STORY phases
 * and then a list of every take - and the takes were introduced by a
 * grey uppercase label, which is the same typography the app uses for
 * captions. So the longest thing on the panel was announced by the
 * smallest voice on it, and finding it meant scrolling past everything
 * above it every time.
 *
 * This gives it the same icon-in-a-ring-and-a-title treatment the
 * panel's own banner has, one size down, and folds it. Nested rather
 * than a long scroll: what a student sees when the panel opens is the
 * shape of what is in it, and they open the part they came for.
 *
 * A <details> rather than state, so it works before hydration, the
 * browser handles find-in-page opening it, and there is no third copy
 * in this app of "is this open".
 */
export function SubSection({
  title,
  Icon,
  accentClass = "text-ink",
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  Icon: ComponentType<{ className?: string }>;
  accentClass?: string;
  /** Shown beside the title, so a folded section still says how much
   *  is inside it - a fold that hides the quantity as well as the
   *  contents is just a thing to be opened hopefully. */
  count?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const accentVar =
    accentClass === "text-ink" ? "var(--color-ink-faint)" : `var(--color-${accentClass.replace("text-", "")})`;
  return (
    <details open={defaultOpen} className="group flex flex-col rounded-xl border border-navy-600 bg-navy-900/40">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-full border ${accentClass}`}
          style={{
            borderColor: `color-mix(in oklab, ${accentVar} 45%, transparent)`,
            background: `color-mix(in oklab, ${accentVar} 12%, transparent)`,
          }}
        >
          <Icon className="size-4.5" />
        </span>
        <span className="text-base font-semibold text-ink">{title}</span>
        {count !== undefined && (
          <span className="rounded-full bg-navy-700 px-2 py-0.5 text-[0.65rem] font-bold tabular-nums text-ink-muted">
            {count}
          </span>
        )}
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-auto size-4 shrink-0 text-ink-faint transition-transform group-open:rotate-180"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="px-3 pb-3">{children}</div>
    </details>
  );
}
