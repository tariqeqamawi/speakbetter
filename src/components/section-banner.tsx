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
        {right && <span className="ml-auto">{right}</span>}
      </div>
      <span aria-hidden className="mx-5 h-px" style={{ background: `linear-gradient(90deg, ${accentVar}, transparent)`, opacity: 0.5 }} />
    </div>
  );
}
