"use client";

import { useState } from "react";
import { categories, categoryById } from "@/data/categories";
import { SpectrumHistory } from "@/components/spectrum-history";
import { CategoryIcon } from "@/components/category-icons";
import { SectionBanner } from "@/components/section-banner";
import { SpectrumIcon } from "@/components/icons";
import { spectrumShare } from "@/lib/progress";
import type { AppState } from "@/lib/store";

// The student's speaking signature, drawn the way a resonance trace is:
// one continuous wave whose peaks sit over the colors they belong to,
// bleeding into each other where they meet. Speaking isn't seven
// separate meters - the colors run together in a talk, and the graph
// should say so. The hard numbers underneath are what make it readable.

/** Below this share, a color is a trace rather than a presence. */
const MEANINGFUL = 5;

// Drawing space. The curve is built in these units and scaled to fit.
const W = 700;
const H = 200;
const FLOOR = H - 4;
const CEILING = 18;

interface Pt {
  x: number;
  y: number;
}

/** A Catmull-Rom spline through the points, emitted as cubic beziers -
 *  the curve passes through every peak instead of merely approaching it,
 *  so a channel's height still reads as its true value. */
function smooth(points: Pt[]): string {
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    d +=
      ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}` +
      ` ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}` +
      ` ${p2.x} ${p2.y}`;
  }
  return d;
}

export function SpectrumSignature({ state }: { state: AppState }) {
  const [tab, setTab] = useState<"now" | "over time">("now");
  const share = spectrumShare(state);
  const hasData = share.some((s) => s.percent > 0);
  const ranked = [...share].sort((a, b) => b.percent - a.percent);
  const top = ranked[0];
  const quiet = ranked.filter((s) => s.percent < MEANINGFUL);

  // One peak per category, evenly spaced, with the curve settling to the
  // floor just outside the frame at each end.
  const step = W / categories.length;
  const peaks: Pt[] = categories.map((cat, i) => {
    const percent = share.find((s) => s.id === cat.id)?.percent ?? 0;
    const ratio = top.percent ? percent / top.percent : 0;
    return {
      x: step * (i + 0.5),
      y: FLOOR - ratio * (FLOOR - CEILING),
    };
  });
  const points: Pt[] = [
    { x: -step * 0.6, y: FLOOR },
    ...peaks,
    { x: W + step * 0.6, y: FLOOR },
  ];
  const line = smooth(points);
  const area = `${line} L ${W + step} ${FLOOR + 40} L ${-step} ${FLOOR + 40} Z`;

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
            {(["now", "over time"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={`rounded-md px-2.5 py-1 text-[0.7rem] font-semibold capitalize transition-colors ${
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

          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="relative h-48 w-full sm:h-56"
            aria-hidden
          >
            <defs>
              {/* Each peak sits over its own color, and the stops bleed
                  into their neighbours between peaks. */}
              <linearGradient id="spectrum-trace" x1="0" y1="0" x2="1" y2="0">
                {categories.map((cat, i) => (
                  <stop
                    key={cat.id}
                    offset={`${((i + 0.5) / categories.length) * 100}%`}
                    stopColor={`var(--color-${cat.id})`}
                  />
                ))}
              </linearGradient>
              <linearGradient id="spectrum-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.55" />
                <stop offset="100%" stopColor="white" stopOpacity="0.04" />
              </linearGradient>
              <mask id="spectrum-fade">
                <rect width={W} height={H + 40} fill="url(#spectrum-fill)" />
              </mask>
              <filter
                id="spectrum-glow"
                x="-10%"
                y="-30%"
                width="120%"
                height="180%"
              >
                <feGaussianBlur stdDeviation="7" />
              </filter>
            </defs>

            {/* Bleed: a heavily blurred copy under everything, so color
                spills past the line the way light does. */}
            <path
              d={area}
              fill="url(#spectrum-trace)"
              opacity="0.5"
              filter="url(#spectrum-glow)"
              className="eq-wave-slow"
            />
            {/* Body of the trace, fading out toward the floor. */}
            <path
              d={area}
              fill="url(#spectrum-trace)"
              mask="url(#spectrum-fade)"
              className="eq-wave"
            />
            {/* The line itself, twice: a glow and a crisp edge. */}
            <path
              d={line}
              fill="none"
              stroke="url(#spectrum-trace)"
              strokeWidth="9"
              strokeLinecap="round"
              opacity="0.55"
              filter="url(#spectrum-glow)"
              className="eq-wave"
            />
            <path
              d={line}
              fill="none"
              stroke="url(#spectrum-trace)"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="eq-wave"
            />
          </svg>

          {/* The hard numbers. The curve is the feel; this is the fact. */}
          {/* Each channel names itself on hover - seven colors is a
              vocabulary, and a readout you can't name is just decoration. */}
          <ul className="relative mt-1 flex items-start justify-between gap-1">
            {categories.map((cat) => {
              const percent = share.find((s) => s.id === cat.id)?.percent ?? 0;
              return (
                <li
                  key={cat.id}
                  tabIndex={0}
                  className="group relative flex flex-1 cursor-default flex-col items-center gap-1 focus:outline-none"
                >
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-36 -translate-x-1/2 rounded-lg border border-navy-500 bg-navy-950 p-2 text-center text-[0.7rem] leading-snug opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                    <b className={`block ${cat.textClass}`}>{cat.name}</b>
                    <span className="text-ink-muted">
                      {percent}% of your speaking
                    </span>
                  </span>
                  <span
                    className={`text-[0.7rem] font-bold tabular-nums ${cat.textClass}`}
                  >
                    {percent}%
                  </span>
                  <CategoryIcon
                    category={cat.id}
                    className={`size-4 transition-transform group-hover:scale-125 ${percent >= MEANINGFUL ? cat.textClass : "text-ink-faint"}`}
                  />
                </li>
              );
            })}
          </ul>
        </div>
        )}

        <p className="text-sm text-ink-muted">
          Your speaking runs{" "}
          <b className={categoryById.get(top.id)?.textClass}>
            {categoryById.get(top.id)?.name.toLowerCase()}
          </b>{" "}
          - {top.percent}% of everything you&apos;ve recorded.
        </p>

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
