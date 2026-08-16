"use client";

import { categories } from "@/data/categories";
import type { Attempt } from "@/lib/store";

// "Your spectrum widens" is the course's central promise, and until now
// nothing showed it happening. Each column is one attempt in order, so
// the widening is visible as a shape rather than asserted as a claim.

export function SpectrumHistory({ attempts }: { attempts: Attempt[] }) {
  if (attempts.length < 2) {
    return (
      <p className="py-6 text-center text-sm text-ink-muted">
        Two attempts and this fills in - it needs a before to show you an
        after.
      </p>
    );
  }

  // Newest last, capped so the chart stays readable.
  const shown = attempts.slice(-14);
  const colorsLit = (a: Attempt) =>
    categories.filter((c) => (a.spectrum[c.id] ?? 0) >= 40).length;

  const first = colorsLit(shown[0]);
  const latest = colorsLit(shown[shown.length - 1]);
  const gain = latest - first;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-xl bg-navy-950/70 p-4">
        <div className="flex items-end gap-1.5 overflow-x-auto pb-1">
          {shown.map((attempt, i) => (
            <div
              key={attempt.id}
              className="flex min-w-6 flex-1 flex-col items-center gap-1.5"
              title={`Attempt ${i + 1} - ${colorsLit(attempt)} of 7 colors, scored ${attempt.score}`}
            >
              {/* one stacked bar per attempt, a segment per lit color */}
              <div className="flex h-28 w-full flex-col-reverse justify-start gap-px overflow-hidden rounded-md bg-navy-700">
                {categories.map((cat) => {
                  const value = attempt.spectrum[cat.id] ?? 0;
                  if (value < 40) return null;
                  return (
                    <span
                      key={cat.id}
                      className={`w-full ${cat.bgClass}`}
                      style={{ height: `${100 / 7}%` }}
                    />
                  );
                })}
              </div>
              <span className="text-[0.6rem] tabular-nums text-ink-faint">
                {colorsLit(attempt)}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[0.65rem] text-ink-faint">
          Each column is one attempt, oldest on the left. Taller means more of
          the spectrum reached.
        </p>
      </div>
      <p className="text-sm text-ink-muted">
        {gain > 0
          ? `You started lighting up ${first} ${first === 1 ? "color" : "colors"} and now reach ${latest}.`
          : gain === 0
            ? `Holding steady at ${latest} of 7 colors. Reach for one you haven't touched.`
            : `You reached ${first} early on and ${latest} most recently - worth revisiting what changed.`}
      </p>
    </section>
  );
}
