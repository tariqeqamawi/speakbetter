"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { challenges } from "@/data/challenges";
import { presence } from "@/data/community-presence";
import { GroupIcon } from "@/components/icons";
import { WeeklyBoard } from "@/components/weekly-board";

// The community, where a student actually asks about it: on Today,
// under what they're doing. Two things only - how many people are on
// the challenge they're on, with the last few who uploaded, and this
// week's board - and a way through to the rest. It used to be a tab of
// its own, which made "who else is here?" a journey rather than a
// glance.

export function TodayCommunity() {
  const { state, ready, isChallengeComplete } = useStore();
  const crowd = useMemo(() => presence(), []);
  if (!ready) return null;

  const mine =
    challenges.find((c) => !c.passive && !isChallengeComplete(c.slug)) ??
    challenges.filter((c) => !c.passive).at(-1)!;
  const here = crowd.find((c) => c.slug === mine.slug);
  const total = crowd.reduce((n, c) => n + c.count, 0);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-ink-faint">On the road with you</h2>
        <Link href="/community" className="text-xs font-semibold text-ink-faint transition-colors hover:text-ink">
          See everyone →
        </Link>
      </div>

      {here && here.count > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-navy-600 bg-navy-800 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-navy-700 text-ink-muted">
            <GroupIcon className="size-5" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm text-ink">
              <b className="font-semibold tabular-nums">{here.count}</b> {here.count === 1 ? "person is" : "people are"} on{" "}
              <b className="font-semibold">{mine.title}</b> right now
            </span>
            <span className="truncate text-xs text-ink-faint">
              {here.recent.length > 0
                ? `${here.recent
                    .slice(0, 3)
                    .map((s) => s.name)
                    .join(", ")} uploaded a take today · ${total} students walking the road`
                : `${total} students walking the road`}
            </span>
          </div>
          {/* Their initials, as a huddle. */}
          <span className="hidden shrink-0 -space-x-2 sm:flex">
            {here.recent.slice(0, 4).map((s) => (
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
      )}

      <WeeklyBoard compact />
      {state.sharedReels.length === 0 && (
        <p className="text-xs text-ink-faint">
          Pass a challenge and you can share the before-and-after with everyone - the score and the colours, never the
          video.
        </p>
      )}
    </section>
  );
}
