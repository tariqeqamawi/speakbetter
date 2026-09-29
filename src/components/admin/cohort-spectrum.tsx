"use client";

import { useMemo } from "react";
import { categories, type CategoryId } from "@/data/categories";
import { challenges } from "@/data/challenges";
import type { SampleCohort } from "@/data/admin-sample";
import { SpectrumWave } from "@/components/spectrum-wave";

// The cohort's growth told in the app's own language - the Speaking
// Spectrum. First, the whole cohort's spectrum on their first take, as a
// faint trace under the spectrum on their latest: the same wave a student
// sees on their own dashboard. Then challenge by challenge, how many of
// the seven colors takes were lighting up - so "on challenge 2 they lit
// two colors, by challenge 6 they were lighting five" reads straight off
// the page. A color counts as lit at 40, as it does everywhere in the app.

export const LIT_AT = 40;

const avgSpectrum = (list: Record<CategoryId, number>[]) =>
  Object.fromEntries(
    categories.map((c) => [c.id, list.length ? list.reduce((a, s) => a + s[c.id], 0) / list.length : 0]),
  ) as Record<CategoryId, number>;

const litCount = (s: Record<CategoryId, number>) => categories.filter((c) => s[c.id] >= LIT_AT).length;

export function CohortSpectrum({ data, compact = false }: { data: SampleCohort; compact?: boolean }) {
  const m = useMemo(() => {
    const journeys = data.students
      .map((s) => data.takes.filter((t) => t.studentNo === s.number))
      .filter((ts) => ts.length >= 2);
    const first = avgSpectrum(journeys.map((ts) => ts[0].spectrum));
    const latest = avgSpectrum(journeys.map((ts) => ts.at(-1)!.spectrum));
    const litFirst = journeys.reduce((a, ts) => a + litCount(ts[0].spectrum), 0) / Math.max(1, journeys.length);
    const litLatest = journeys.reduce((a, ts) => a + litCount(ts.at(-1)!.spectrum), 0) / Math.max(1, journeys.length);

    const rows = challenges
      .map((c, i) => {
        const takes = data.takes.filter((t) => t.challenge === c.slug);
        return {
          n: i + 1,
          c,
          takes: takes.length,
          lit: takes.length ? takes.reduce((a, t) => a + litCount(t.spectrum), 0) / takes.length : 0,
          share: Object.fromEntries(
            categories.map((cat) => [cat.id, takes.length ? takes.filter((t) => (t.spectrum[cat.id] ?? 0) >= LIT_AT).length / takes.length : 0]),
          ) as Record<CategoryId, number>,
        };
      })
      .filter((r) => r.takes >= 3);
    return { first, latest, litFirst, litLatest, n: journeys.length, rows };
  }, [data]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">The cohort&apos;s spectrum - first take → latest</h3>
        <p className="-mt-2 text-xs text-ink-faint">
          The average of {m.n} students. The faint dashed trace is where they started; the colored wave is where they
          are now.
        </p>
        <div className="rounded-2xl border border-navy-600 bg-navy-900/60 p-4">
          <SpectrumWave values={m.latest} ghost={m.first} max={100} animate={false} className="h-44 w-full sm:h-52" />
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-4 lg:grid-cols-7">
          {categories.map((c) => (
            <span key={c.id} className="flex flex-col">
              <span style={{ color: `var(--color-${c.id})` }}>{c.name}</span>
              <span className="tabular-nums text-ink-muted">
                {Math.round(m.first[c.id])} → <b className="text-ink">{Math.round(m.latest[c.id])}</b>
              </span>
            </span>
          ))}
        </div>
        <p className="text-sm text-ink-muted">
          Colors lit, per take:{" "}
          <b className="text-ink">
            {m.litFirst.toFixed(1)} → {m.litLatest.toFixed(1)}
          </b>{" "}
          of 8, first take to latest.
        </p>
      </div>

      {!compact && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Colors lit, challenge by challenge</h3>
          <p className="-mt-1 text-xs text-ink-faint">
            Each dot is one of the eight colors, as bright as the share of takes on that challenge that lit it. The
            figure is how many colors a take lit, on average.
          </p>
          <ol className="flex flex-col gap-1">
            {m.rows.map((r) => (
              <li key={r.c.slug} className="grid grid-cols-[2rem_minmax(0,1fr)_auto_3.5rem] items-center gap-3 text-xs">
                <span className="tabular-nums text-ink-faint">{r.n}</span>
                <span className="truncate text-ink-muted" title={r.c.title}>
                  {r.c.title}
                </span>
                <span className="flex gap-1">
                  {categories.map((cat) => (
                    <span
                      key={cat.id}
                      title={`${cat.name}: ${Math.round(r.share[cat.id] * 100)}% of takes`}
                      className="size-3.5 rounded-full"
                      style={{
                        background: `var(--color-${cat.id})`,
                        opacity: 0.12 + r.share[cat.id] * 0.88,
                      }}
                    />
                  ))}
                </span>
                <span className="text-right font-semibold tabular-nums text-ink">{r.lit.toFixed(1)}/7</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
