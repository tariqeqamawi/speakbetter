import { categories, type CategoryId } from "@/data/categories";
import { SleepOffscreen } from "@/components/sleep-offscreen";

// The color-spectrum breakdown (master plan §05): which categories a
// performance lit up, and how strongly. Reads at a glance - full bars
// across many colors = a dynamic talk; one or two colors = the gap.

export function SpectrumBars({
  spectrum,
  revealCount,
  required,
}: {
  spectrum: Record<CategoryId, number>;
  /** When set, only the first N bars have landed - the rest wait at
   *  zero. Drives the staged reveal; omit for the instant render. */
  revealCount?: number;
  /** The colors this challenge needs to pass. They glow and are
   *  marked as needed; the rest are marked as bonus. */
  required?: CategoryId[];
}) {
  const marks = required && required.length > 0;
  // Asleep off screen, so the needed bars only glow while they can be
  // seen (sleep-offscreen.tsx says why that matters).
  return (
    <SleepOffscreen className="flex flex-col gap-2">
      {categories.map((cat, i) => {
        const value = Math.max(0, Math.min(100, spectrum[cat.id] ?? 0));
        const shown = revealCount === undefined || i < revealCount;
        const lit = value >= 40 && shown;
        const needed = Boolean(required?.includes(cat.id));
        return (
          <div key={cat.id} className={`flex items-center gap-3 ${needed ? cat.textClass : ""}`}>
            <span
              title={cat.name}
              // Wrapped, not truncated. "Figurative & Sensory" is
              // wider than 7rem, so on a phone the one colour whose
              // name a beginner is least likely to know was the one
              // shown as "Figurative & Senso…". Two lines fit inside
              // the row's height; the bars stay aligned because the
              // column keeps its width either way.
              className={`w-28 shrink-0 text-xs leading-tight sm:w-44 ${
                needed ? "font-semibold drop-shadow-[0_0_6px_currentColor]" : lit ? "text-ink" : "text-ink-faint"
              }`}
            >
              {cat.short}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-navy-700">
              <div
                className={`h-full w-full origin-left rounded-full transition-transform duration-500 ease-out will-change-transform ${cat.bgClass} ${
                  lit ? "" : "opacity-40"
                } ${needed && lit ? "relative" : ""}`}
                style={{ transform: `scaleX(${shown ? value / 100 : 0})` }}
              >
                {needed && lit && <span className="spectrum-needed absolute inset-0 rounded-full shadow-[0_0_12px_1px_currentColor] will-change-[opacity]" />}
              </div>
            </div>
            <span className={`w-8 shrink-0 text-right text-xs tabular-nums ${needed ? "" : "text-ink-faint"}`}>
              {shown ? value : "·"}
            </span>
            {marks && (
              <span
                className={`w-12 shrink-0 text-right text-[0.6rem] font-semibold uppercase tracking-wider ${
                  needed ? "" : "text-ink-faint/70"
                }`}
              >
                {needed ? "needed" : "bonus"}
              </span>
            )}
          </div>
        );
      })}
    </SleepOffscreen>
  );
}

/**
 * The key under a spectrum wave: each color's score and its name, in
 * its color - so a wave reads as clearly as the bars do - and, where
 * a challenge is in play, which colors it needs.
 */
export function SpectrumKey({
  spectrum,
  required,
}: {
  spectrum: Record<CategoryId, number>;
  required?: CategoryId[];
}) {
  const marks = required && required.length > 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between px-1">
        {categories.map((cat) => {
          const v = Math.max(0, Math.min(100, spectrum[cat.id] ?? 0));
          const needed = Boolean(required?.includes(cat.id));
          const lit = v >= 40;
          return (
            <span
              key={cat.id}
              title={`${cat.name}${needed ? " - needed to pass" : marks ? " - bonus" : ""}`}
              className={`flex w-0 flex-1 flex-col items-center gap-0.5 ${lit || needed ? cat.textClass : "text-ink-faint"}`}
            >
              <span className={`text-[0.65rem] font-bold tabular-nums ${needed ? "drop-shadow-[0_0_6px_currentColor]" : ""}`}>
                {v}
              </span>
              <span
                className={`text-[0.55rem] font-semibold uppercase tracking-wider ${
                  needed ? "drop-shadow-[0_0_6px_currentColor]" : "opacity-80"
                }`}
              >
                {cat.code}
              </span>
              {marks && (
                <span
                  aria-hidden
                  className={`relative mt-0.5 size-1.5 rounded-full ${needed ? cat.bgClass : "bg-navy-600"}`}
                >
                  {needed && <span className="spectrum-needed absolute inset-0 rounded-full shadow-[0_0_8px_1px_currentColor] will-change-[opacity]" />}
                </span>
              )}
            </span>
          );
        })}
      </div>
      {marks && (
        <p className="text-center text-[0.6rem] text-ink-faint">
          Glowing colors are the ones this challenge needs to pass - the rest are bonus.
        </p>
      )}
    </div>
  );
}

/** Compact strip of the colors present in a performance */
export function SpectrumStrip({ spectrum }: { spectrum: Record<CategoryId, number> }) {
  return (
    <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
      {categories.map((cat) => {
        const lit = (spectrum[cat.id] ?? 0) >= 40;
        return (
          <div
            key={cat.id}
            className={`flex-1 ${cat.bgClass} ${lit ? "" : "opacity-15"}`}
            title={cat.name}
          />
        );
      })}
    </div>
  );
}
