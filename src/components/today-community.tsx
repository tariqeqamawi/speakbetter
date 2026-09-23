"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { challenges } from "@/data/challenges";
import { presence, sampleShares } from "@/data/community-presence";
import { GroupIcon, TrophyIcon, ZapIcon } from "@/components/icons";

// The community, where a student actually asks about it: on Today, as
// one card they can't miss. Who's on the challenge they're on, with
// faces; what the week's board looks like at a glance; and a full-width
// way in. It was a tab of its own once, which made "who else is here?"
// a journey; then it was a quiet line, which made it invisible. This is
// the middle: present on the page they open every day, and obviously a
// door.

export function TodayCommunity() {
  const { ready, isChallengeComplete } = useStore();
  const crowd = useMemo(() => presence(), []);
  const others = useMemo(() => sampleShares(), []);
  if (!ready) return null;

  const mine =
    challenges.find((c) => !c.passive && !isChallengeComplete(c.slug)) ??
    challenges.filter((c) => !c.passive).at(-1)!;
  const here = crowd.find((c) => c.slug === mine.slug);
  const total = crowd.reduce((n, c) => n + c.count, 0);
  // This week, in one line each: who has recorded most, and who has
  // gained the most colour.
  const busiest = [...others].sort((a, b) => b.weekTakes - a.weekTakes)[0];
  const climber = [...others].sort((a, b) => b.nowScore - b.thenScore - (a.nowScore - a.thenScore))[0];

  return (
    <Link
      href="/community"
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-mindset/40 bg-navy-800 p-5 transition-colors hover:border-mindset"
    >
      {/* the room's own light */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-20 -top-24 size-64 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-mindset), transparent 70%)" }}
      />

      <div className="relative flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mindset/15 text-mindset">
          <GroupIcon className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-bold uppercase tracking-wider text-mindset">Community</span>
          <span className="truncate text-xs text-ink-faint">{total} students walking the road right now</span>
        </div>
        {/* the faces */}
        <span className="flex shrink-0 -space-x-2">
          {(here?.recent ?? []).slice(0, 4).map((s) => (
            <span
              key={s.name}
              title={s.name}
              className="grid size-8 place-items-center rounded-full border-2 border-navy-800 bg-navy-700 text-xs font-bold text-ink"
            >
              {s.name[0]}
            </span>
          ))}
        </span>
      </div>

      {here && here.count > 0 && (
        <p className="relative text-sm text-ink">
          <b className="font-semibold tabular-nums text-mindset">{here.count}</b>{" "}
          {here.count === 1 ? "person is" : "people are"} on <b className="font-semibold">{mine.title}</b> with you
          {here.recent.length > 0 && (
            <span className="text-ink-faint">
              {" "}
              · {here.recent.slice(0, 2).map((s) => s.name).join(" and ")} uploaded a take today
            </span>
          )}
        </p>
      )}

      {/* this week, in two lines */}
      <div className="relative grid gap-2 sm:grid-cols-2">
        {busiest && (
          <span className="flex items-center gap-2 rounded-xl border border-navy-600 bg-navy-900/60 px-3 py-2 text-xs">
            <ZapIcon className="size-3.5 shrink-0 text-acting" />
            <span className="truncate text-ink-muted">
              <b className="font-semibold text-ink">{busiest.name}</b> recorded {busiest.weekTakes} takes this week
            </span>
          </span>
        )}
        {climber && (
          <span className="flex items-center gap-2 rounded-xl border border-navy-600 bg-navy-900/60 px-3 py-2 text-xs">
            <TrophyIcon className="size-3.5 shrink-0 text-storytelling" />
            <span className="truncate text-ink-muted">
              <b className="font-semibold text-ink">{climber.name}</b> is up {climber.nowScore - climber.thenScore} points
              since their baseline
            </span>
          </span>
        )}
      </div>

      <span className="relative flex min-h-11 items-center justify-center gap-2 rounded-full bg-mindset px-5 text-sm font-bold text-navy-950 shadow-[0_0_24px_-8px_var(--color-mindset)] transition-opacity group-hover:opacity-95">
        <GroupIcon className="size-4" />
        Open the community
      </span>
    </Link>
  );
}
