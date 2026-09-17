"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { categories, type CategoryId } from "@/data/categories";
import { sampleShares } from "@/data/community-presence";
import { SpectrumStrip } from "@/components/spectrum";
import { TrendingUpIcon } from "@/components/icons";

// The community's before-and-afters (master plan §12): each one a
// student's baseline score beside their latest, the two spectra, and
// the colors that lit up between. Never the videos - those stay on the
// student's phone (§13). A feed of other people's distance travelled
// is the most persuasive thing the app can show someone at challenge
// three.
//
// The student's own shares come first, then everyone else's. Until the
// community layer lands, "everyone else" is a sample and the student's
// own are kept locally - see shareReel() in the store.

interface Card {
  key: string;
  name: string;
  mine: boolean;
  when: string;
  passed: number;
  thenScore: number;
  nowScore: number;
  thenSpectrum: Record<CategoryId, number>;
  nowSpectrum: Record<CategoryId, number>;
}

export function CommunityFeed() {
  const { state, ready } = useStore();
  const others = useMemo(() => sampleShares(), []);

  if (!ready) return null;

  const mine: Card[] = [...state.sharedReels].reverse().map((r) => ({
    key: r.id,
    name: state.displayName || "You",
    mine: true,
    when: new Date(r.at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    passed: r.passed,
    thenScore: r.thenScore,
    nowScore: r.nowScore,
    thenSpectrum: r.thenSpectrum,
    nowSpectrum: r.nowSpectrum,
  }));
  const rest: Card[] = others.map((s) => ({
    key: s.name,
    name: s.name,
    mine: false,
    when: s.daysAgo === 0 ? "today" : s.daysAgo === 1 ? "yesterday" : `${s.daysAgo} days ago`,
    passed: s.passed,
    thenScore: s.thenScore,
    nowScore: s.nowScore,
    thenSpectrum: s.thenSpectrum,
    nowSpectrum: s.nowSpectrum,
  }));
  const cards = [...mine, ...rest];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <TrendingUpIcon className="size-5 text-mindset" />
        <h2 className="text-sm font-medium uppercase tracking-wider text-ink-faint">
          Before and after
        </h2>
      </div>
      <p className="text-sm text-ink-muted">
        Students&apos; baselines beside where they are now. Yours joins the
        feed from the Challenges page, ten challenges in.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => {
          const delta = c.nowScore - c.thenScore;
          const gained = categories.filter(
            (cat) => (c.nowSpectrum[cat.id] ?? 0) >= 40 && (c.thenSpectrum[cat.id] ?? 0) < 40,
          );
          return (
            <li
              key={c.key}
              className={`flex flex-col gap-3 rounded-xl border p-4 ${
                c.mine ? "border-mindset/40 bg-navy-800" : "border-navy-600 bg-navy-800"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy-700 text-xs font-bold text-ink">
                  {c.name[0]}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold text-ink">
                    {c.name}
                    {c.mine && <span className="text-ink-faint"> · you</span>}
                  </span>
                  <span className="text-xs text-ink-faint">
                    {c.passed} challenges in · {c.when}
                  </span>
                </span>
                <span
                  className={`shrink-0 text-lg font-bold tabular-nums ${
                    delta > 0 ? "text-mindset" : delta < 0 ? "text-storytelling" : "text-ink"
                  }`}
                >
                  {delta > 0 ? "+" : ""}
                  {delta}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-ink-faint">
                    Then · <span className="tabular-nums">{c.thenScore}</span>
                  </span>
                  <SpectrumStrip spectrum={c.thenSpectrum} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-ink">
                    Now · <span className="tabular-nums">{c.nowScore}</span>
                  </span>
                  <SpectrumStrip spectrum={c.nowSpectrum} />
                </div>
              </div>

              {gained.length > 0 && (
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
                  <span>Lit up:</span>
                  {gained.map((cat) => (
                    <span key={cat.id} className="flex items-center gap-1">
                      <span className={`size-2 rounded-full ${cat.bgClass}`} />
                      <span className="text-ink">{cat.name.split(" ")[0]}</span>
                    </span>
                  ))}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
