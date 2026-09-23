"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { categories, type CategoryId } from "@/data/categories";
import { sampleShares } from "@/data/community-presence";
import { challenges, storyPhases } from "@/data/challenges";
import { SpectrumWave } from "@/components/spectrum-wave";
import { CheckIcon, FlameIcon, TrendingUpIcon, TrophyIcon, ZapIcon } from "@/components/icons";
import { hapticTap } from "@/lib/feedback-fx";
import { Avatar } from "@/components/avatar";

// The community (master plan §12): other people's distance traveled,
// drawn the way the student's own is drawn - their first take's
// spectrum dashed under their latest, so the widening is a picture
// rather than a number. Never the videos; those stay on the phone
// (§13).
//
// Three small boards instead of one, because a single XP ladder means
// the same few names forever and tells a beginner nothing: colors
// gained since the baseline, takes recorded this week, and the biggest
// jump in score. A student can lead one of them in their first week.
//
// And one collaborative thing: the week's shared goal, which everybody
// adds to by recording - the opposite of a ladder.
//
// The student's own shares come first. Until the community layer lands,
// "everyone else" is a sample (data/community-presence) and the
// student's own are kept locally - see shareReel() in the store.

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
  phases: number[];
  onChallenge: string;
  weekTakes: number;
  cheers: number;
}

const lit = (s: Record<CategoryId, number>) => categories.filter((c) => (s[c.id] ?? 0) >= 40).length;

/** The five letters under a name, filled as far as they've walked. */
function Letters({ phases, className = "" }: { phases: number[]; className?: string }) {
  const sizes = storyPhases.map((p) => challenges.filter((c) => c.phase === p.id).length);
  return (
    <span className={`flex items-center gap-1 ${className}`} aria-hidden>
      {storyPhases.map((phase, i) => {
        const done = phases[i] ?? 0;
        const size = sizes[i] || 1;
        const complete = done >= size;
        return (
          <span
            key={phase.id}
            title={`${phase.name}: ${done} of ${size}`}
            className={`grid size-5 place-items-center rounded-full text-[0.6rem] font-bold ${
              complete
                ? `${phase.bgClass} text-navy-950`
                : done > 0
                  ? `border border-current bg-navy-900 ${phase.textClass}`
                  : "border border-navy-600 bg-navy-900 text-ink-faint"
            }`}
          >
            {complete ? <CheckIcon className="size-2.5" /> : phase.id}
          </span>
        );
      })}
    </span>
  );
}

export function CommunityFeed() {
  const { state, ready } = useStore();
  const others = useMemo(() => sampleShares(), []);
  // Cheers are kept for this session only until the community layer
  // lands - the gesture is real, the ledger isn't yet.
  const [cheered, setCheered] = useState<Set<string>>(new Set());

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
    phases: storyPhases.map(
      (p) => challenges.filter((c) => c.phase === p.id && state.attempts.some((a) => a.challengeSlug === c.slug && a.passed)).length,
    ),
    onChallenge: challenges.find((c) => !c.passive && !state.attempts.some((a) => a.challengeSlug === c.slug && a.passed))?.title ?? "",
    weekTakes: state.attempts.filter((a) => Date.now() - Date.parse(a.at) < 7 * 86_400_000).length,
    cheers: 0,
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
    phases: s.phases,
    onChallenge: s.onChallenge,
    weekTakes: s.weekTakes,
    cheers: s.cheers,
  }));
  const cards = [...mine, ...rest];

  // The three boards. Each is the same people ranked by a different
  // question, so leading one of them is within reach.
  const boards = [
    {
      id: "colors",
      title: "Colors gained",
      note: "since their baseline",
      Icon: TrendingUpIcon,
      accent: "text-body-language",
      rows: [...cards]
        .map((c) => ({ name: c.name, mine: c.mine, value: lit(c.nowSpectrum) - lit(c.thenSpectrum) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
      unit: "",
    },
    {
      id: "takes",
      title: "Takes this week",
      note: "every recording counts",
      Icon: FlameIcon,
      accent: "text-acting",
      rows: [...cards]
        .map((c) => ({ name: c.name, mine: c.mine, value: c.weekTakes }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
      unit: "",
    },
    {
      id: "jump",
      title: "Biggest jump",
      note: "baseline to latest",
      Icon: TrophyIcon,
      accent: "text-storytelling",
      rows: [...cards]
        .map((c) => ({ name: c.name, mine: c.mine, value: c.nowScore - c.thenScore }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
      unit: " pts",
    },
  ];

  // The week's shared goal: everyone's takes against one number. Both
  // sides of it are the sample crowd until the community layer lands.
  const goal = 120;
  const together = cards.reduce((n, c) => n + c.weekTakes, 0);

  return (
    <div data-tour="feed"
      className="flex flex-col gap-6">
      {/* Together, before apart. */}
      <section className="flex flex-col gap-2 rounded-2xl border border-navy-600 bg-navy-800 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-ink-faint">This week, together</h2>
          <span className="text-xs tabular-nums text-ink-faint">
            {Math.min(together, goal)} / {goal} takes
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-navy-700">
          <div
            className="spectrum-rule h-full rounded-full shadow-[0_0_12px_rgba(255,255,255,0.25)] transition-[width] duration-700"
            style={{ width: `${Math.min(100, (together / goal) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-ink-muted">
          Every take anyone records this week fills this bar. Fill it and everybody gets the week&apos;s trophy - the
          only board where you&apos;re all on the same side.
        </p>
      </section>

      {/* Three ways to lead. */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-ink-faint">Three boards</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {boards.map((board) => (
            <div key={board.id} className="flex flex-col gap-2 rounded-xl border border-navy-600 bg-navy-800 p-4">
              <span className="flex items-center gap-2">
                <board.Icon className={`size-4 ${board.accent}`} />
                <span className="flex min-w-0 flex-col">
                  <span className="text-xs font-semibold text-ink">{board.title}</span>
                  <span className="text-[0.65rem] text-ink-faint">{board.note}</span>
                </span>
              </span>
              <ol className="flex flex-col gap-1">
                {board.rows.map((row, i) => (
                  <li
                    key={`${board.id}-${row.name}-${i}`}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm ${row.mine ? "bg-navy-700 text-ink" : "text-ink-muted"}`}
                  >
                    <span className={`w-4 text-right text-[0.65rem] font-bold tabular-nums ${i === 0 ? board.accent : "text-ink-faint"}`}>
                      {i + 1}
                    </span>
                    <Avatar name={row.name} src={row.mine ? state.avatar : undefined} className="size-6" ring={false} />
                    <span className="flex-1 truncate text-xs font-medium">{row.name}</span>
                    <span className="text-xs font-bold tabular-nums">
                      {row.value > 0 ? "+" : ""}
                      {row.value}
                      {board.unit}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* Everyone's distance traveled, drawn. */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <TrendingUpIcon className="size-5 text-mindset" />
          <h2 className="text-sm font-medium uppercase tracking-wider text-ink-faint">Before and after</h2>
        </div>
        <p className="text-sm text-ink-muted">
          Each trace is one student: where they started, dashed, under where they are now. Yours joins the feed from
          the Challenges page, ten challenges in.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {cards.map((c) => {
            const delta = c.nowScore - c.thenScore;
            const gained = categories.filter(
              (cat) => (c.nowSpectrum[cat.id] ?? 0) >= 40 && (c.thenSpectrum[cat.id] ?? 0) < 40,
            );
            const isCheered = cheered.has(c.key);
            return (
              <li
                key={c.key}
                className={`flex flex-col gap-3 rounded-xl border p-4 ${c.mine ? "border-mindset/40 bg-navy-800" : "border-navy-600 bg-navy-800"}`}
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={c.name} src={c.mine ? state.avatar : undefined} className="size-9" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-ink">
                      {c.name}
                      {c.mine && <span className="text-ink-faint"> · you</span>}
                    </span>
                    <span className="truncate text-xs text-ink-faint">
                      {c.passed} passed · {c.when}
                    </span>
                  </span>
                  <span className={`shrink-0 text-lg font-bold tabular-nums ${delta > 0 ? "text-mindset" : delta < 0 ? "text-storytelling" : "text-ink"}`}>
                    {delta > 0 ? "+" : ""}
                    {delta}
                  </span>
                </div>

                {/* Where they were, under where they are - both in
                    color, one at half strength, so the distance reads
                    at a glance. */}
                <span className="relative block overflow-hidden rounded-lg bg-navy-950/70 p-2">
                  <span className="relative block">
                    <SpectrumWave values={c.thenSpectrum} className="h-20 w-full opacity-50" animate={false} />
                    <span className="absolute inset-0">
                      <SpectrumWave values={c.nowSpectrum} className="h-20 w-full opacity-90" animate={false} />
                    </span>
                  </span>
                </span>
                <div className="flex items-center justify-between gap-2 text-[0.65rem]">
                  <span className="flex items-center gap-1.5 text-ink-faint">
                    <span aria-hidden className="spectrum-rule inline-block h-1 w-4 rounded-full opacity-50" />
                    {lit(c.thenSpectrum)} colors · {c.thenScore}
                  </span>
                  <span className="flex items-center gap-1.5 text-ink">
                    <span aria-hidden className="spectrum-rule inline-block h-0.5 w-4 rounded-full" />
                    {lit(c.nowSpectrum)} colors · {c.nowScore}
                  </span>
                </div>

                {/* How far along the road, and where they are now. */}
                <div className="flex items-center gap-2">
                  <Letters phases={c.phases} />
                  {c.onChallenge && <span className="truncate text-[0.65rem] text-ink-faint">on “{c.onChallenge}”</span>}
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

                {/* One tap, no comments to moderate. */}
                {!c.mine && (
                  <button
                    type="button"
                    onClick={() => {
                      hapticTap();
                      setCheered((prev) => {
                        const next = new Set(prev);
                        if (next.has(c.key)) next.delete(c.key);
                        else next.add(c.key);
                        return next;
                      });
                    }}
                    aria-pressed={isCheered}
                    className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      isCheered
                        ? "border-storytelling bg-storytelling/15 text-storytelling"
                        : "border-navy-600 text-ink-muted hover:border-ink-faint hover:text-ink"
                    }`}
                  >
                    <ZapIcon className="size-3.5" />
                    {isCheered ? "Cheered" : "Cheer"}
                    <span className="tabular-nums text-ink-faint">{c.cheers + (isCheered ? 1 : 0)}</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
