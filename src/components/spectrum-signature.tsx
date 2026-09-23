"use client";

import { useState } from "react";
import { categories, categoryById, type CategoryId } from "@/data/categories";
import { SpectrumHistory } from "@/components/spectrum-history";
import { SectionBanner } from "@/components/section-banner";
import { SpectrumIcon } from "@/components/icons";
import { spectrumShare } from "@/lib/progress";
import { SpectrumWave } from "@/components/spectrum-wave";
import type { AppState, Attempt } from "@/lib/store";

// The student's speaking signature, drawn the way a resonance trace is:
// one continuous wave whose peaks sit over the colors they belong to,
// bleeding into each other where they meet. Speaking isn't seven
// separate meters - the colors run together in a talk, and the graph
// should say so. The hard numbers underneath are what make it readable.

/** Below this share, a color is a trace rather than a presence. */
const MEANINGFUL = 5;

/** The spectrum of one attempt, as shares that add to 100 - the same
 *  shape spectrumShare gives for the whole record, so a single take and
 *  the running total can be drawn on the same trace. */
function shareOfAttempt(attempt: Attempt): Record<CategoryId, number> {
  const total = categories.reduce((sum, c) => sum + (attempt.spectrum[c.id] ?? 0), 0);
  const out = {} as Record<CategoryId, number>;
  for (const c of categories) out[c.id] = total > 0 ? Math.round(((attempt.spectrum[c.id] ?? 0) / total) * 100) : 0;
  return out;
}

const TABS = ["where you started", "now", "over time"] as const;
type Tab = (typeof TABS)[number];

export function SpectrumSignature({ state }: { state: AppState }) {
  const [tab, setTab] = useState<Tab>("now");
  const share = spectrumShare(state);
  const hasData = share.some((s) => s.percent > 0);
  // The first take on the map is where they started; everything since
  // is "now". With one attempt they are the same picture, and the tab
  // says so rather than pretending to a journey.
  const ordered = [...state.attempts].sort((a, b) => (a.at < b.at ? -1 : 1));
  const firstTake = ordered[0];
  const startedValues = firstTake ? shareOfAttempt(firstTake) : null;
  const nowValues = Object.fromEntries(share.map((s) => [s.id, s.percent])) as Record<CategoryId, number>;
  const litOf = (vals: Record<CategoryId, number> | null) =>
    vals ? categories.filter((c) => (vals[c.id] ?? 0) >= MEANINGFUL).length : 0;
  const ranked = [...share].sort((a, b) => b.percent - a.percent);
  const top = ranked[0];
  const quiet = ranked.filter((s) => s.percent < MEANINGFUL);

  if (!hasData) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800">
        <SectionBanner
          image="/sections/spectrum.jpg"
          title="Your spectrum"
          Icon={SpectrumIcon}
          accentClass="text-body-language"
          large
        />
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="spectrum-rule h-2 w-full rounded-full opacity-25" />
          <p className="text-sm text-ink-muted">
            Record your first challenge and the trace comes alive - the exact
            mix of colors your speaking carries.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800">
      <SectionBanner
        image="/sections/spectrum.jpg"
        title="Your spectrum"
        Icon={SpectrumIcon}
        accentClass="text-body-language"
        large
        right={
          // Now and over time are the same question asked twice - they
          // belong in one readout, not two sections apart.
          <span className="flex rounded-lg border border-navy-600 bg-navy-900/80 p-0.5">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={`rounded-md px-2 py-1 text-[0.65rem] font-semibold capitalize transition-colors sm:text-[0.7rem] ${
                  tab === t
                    ? "bg-navy-700 text-ink"
                    : "text-ink-faint hover:text-ink-muted"
                }`}
              >
                {t}
              </button>
            ))}
          </span>
        }
      />
      <div className="flex flex-1 flex-col gap-4 p-5">
        {tab === "over time" && startedValues && state.attempts.length >= 2 && (
          // Both traces at once: where they started, dashed and pale,
          // under where they are now. The distance between the lines is
          // the whole promise of the course, drawn.
          <div className="relative overflow-hidden rounded-xl bg-navy-950/70 p-4">
            {/* Both in colour, one over the other at half strength -
                a dashed grey line was hard to read against the trace. */}
            <div className="relative">
              <SpectrumWave values={startedValues} animate={false} className="h-48 w-full opacity-50 sm:h-56" />
              <div className="absolute inset-0">
                <SpectrumWave values={nowValues} className="h-48 w-full opacity-90 sm:h-56" />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[0.7rem]">
              <span className="flex items-center gap-2 text-ink-faint">
                <span aria-hidden className="spectrum-rule inline-block h-1 w-6 rounded-full opacity-50" />
                Where you started - {litOf(startedValues)} of 7 colours
              </span>
              <span className="flex items-center gap-2 text-ink">
                <span aria-hidden className="spectrum-rule inline-block h-0.5 w-6 rounded-full" />
                Now - {litOf(nowValues)} of 7
              </span>
            </div>
          </div>
        )}
        {tab === "over time" ? (
          <SpectrumHistory attempts={state.attempts} />
        ) : (
        <div className="relative overflow-hidden rounded-xl bg-navy-950/70 p-4">
          {/* The scope behind the trace. */}
          <div aria-hidden className="absolute inset-4">
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <span
                  key={i}
                  className={`w-full h-px ${i % 4 === 0 ? "bg-navy-600" : "bg-navy-700/70"}`}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex justify-between">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="h-full w-px bg-navy-700/50" />
              ))}
            </div>
          </div>

          <SpectrumWave values={tab === "where you started" && startedValues ? startedValues : nowValues} />

        </div>
        )}
        {tab === "over time" ? (
          <SpectrumHistory attempts={state.attempts} />
        ) : (
        <div className="relative overflow-hidden rounded-xl bg-navy-950/70 p-4">
          {/* The scope behind the trace. */}
          <div aria-hidden className="absolute inset-4">
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <span
                  key={i}
                  className={`w-full h-px ${i % 4 === 0 ? "bg-navy-600" : "bg-navy-700/70"}`}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex justify-between">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="h-full w-px bg-navy-700/50" />
              ))}
            </div>
          </div>

          <SpectrumWave values={tab === "where you started" && startedValues ? startedValues : nowValues} />

        </div>
        )}
        {tab === "over time" ? (
          <SpectrumHistory attempts={state.attempts} />
        ) : (
        <div className="relative overflow-hidden rounded-xl bg-navy-950/70 p-4">
          {/* The scope behind the trace. */}
          <div aria-hidden className="absolute inset-4">
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <span
                  key={i}
                  className={`w-full h-px ${i % 4 === 0 ? "bg-navy-600" : "bg-navy-700/70"}`}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex justify-between">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="h-full w-px bg-navy-700/50" />
              ))}
            </div>
          </div>

          <SpectrumWave values={tab === "where you started" && startedValues ? startedValues : nowValues} />

        </div>
        )}
        {tab === "over time" ? (
          <SpectrumHistory attempts={state.attempts} />
        ) : (
        <div className="relative overflow-hidden rounded-xl bg-navy-950/70 p-4">
          {/* The scope behind the trace. */}
          <div aria-hidden className="absolute inset-4">
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <span
                  key={i}
                  className={`w-full h-px ${i % 4 === 0 ? "bg-navy-600" : "bg-navy-700/70"}`}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex justify-between">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="h-full w-px bg-navy-700/50" />
              ))}
            </div>
          </div>

          <SpectrumWave values={tab === "where you started" && startedValues ? startedValues : nowValues} />

        </div>
        )}

        {tab === "where you started" ? (
          <p className="text-sm text-ink-muted">
            {firstTake
              ? `Your first take, ${new Date(firstTake.at).toLocaleDateString(undefined, { day: "numeric", month: "long" })} - ${litOf(startedValues)} of 7 colours, scored ${firstTake.score}. This is the before.`
              : "Record your first challenge and this becomes your before."}
          </p>
        ) : (
          <p className="text-sm text-ink-muted">
            Your speaking runs{" "}
            <b className={categoryById.get(top.id)?.textClass}>
              {categoryById.get(top.id)?.name.toLowerCase()}
            </b>{" "}
            - {top.percent}% of everything you&apos;ve recorded.
          </p>
        )}

        {/* A color scraping 1% isn't "present" in any way a listener would
            notice, so it doesn't earn the full-spectrum line. */}
        <p className="text-xs text-ink-faint">
          {quiet.length > 0
            ? `Quietest channels: ${quiet
                .map((s) => categoryById.get(s.id)?.name.toLowerCase())
                .slice(0, 3)
                .join(", ")} - reach for those next.`
            : "Every channel is carrying real weight - that's a full-spectrum speaker."}
        </p>
      </div>
    </div>
  );
}
