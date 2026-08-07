import { categories, type CategoryId } from "@/data/categories";

// The color-spectrum breakdown (master plan §05): which categories a
// performance lit up, and how strongly. Reads at a glance — full bars
// across many colors = a dynamic talk; one or two colors = the gap.

export function SpectrumBars({ spectrum }: { spectrum: Record<CategoryId, number> }) {
  return (
    <div className="flex flex-col gap-2">
      {categories.map((cat) => {
        const value = Math.max(0, Math.min(100, spectrum[cat.id] ?? 0));
        const lit = value >= 40;
        return (
          <div key={cat.id} className="flex items-center gap-3">
            <span className={`w-40 shrink-0 truncate text-xs sm:w-56 ${lit ? "text-ink" : "text-ink-faint"}`}>
              {cat.name}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-navy-700">
              <div
                className={`h-full rounded-full ${cat.bgClass} ${lit ? "" : "opacity-40"}`}
                style={{ width: `${value}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-xs tabular-nums text-ink-faint">
              {value}
            </span>
          </div>
        );
      })}
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
