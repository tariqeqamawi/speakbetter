"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { currentStreak } from "@/data/badges";
import { standing, streakPrice } from "@/lib/progress";
import { FlameIcon, ZapIcon } from "@/components/icons";
import { hapticTap, playXpDing } from "@/lib/feedback-fx";

// A missed day, and the choice that follows: pay XP to keep the streak,
// or let it go and start again. Free freezes cover the first couple of
// misses on their own (see applyStreakFreeze in the store); this is
// what happens when they've run out - the streak is worth something, so
// it can be bought back with something.
//
// Shown only on the day after the miss, while the streak is still
// standing behind it. Say no and nothing is taken; the streak simply
// ends, which is the honest half of the mechanic.

export function StreakRescue() {
  const { state, ready, keepStreak } = useStore();
  const [bought, setBought] = useState(false);
  if (!ready) return null;

  const DAY = 86_400_000;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.parse(today) - DAY).toISOString().slice(0, 10);
  const dayBefore = new Date(Date.parse(today) - DAY * 2).toISOString().slice(0, 10);
  const active = new Set([...state.attempts.map((a) => a.at.slice(0, 10)), ...state.frozenDays]);

  // The gap that matters: yesterday missed, the day before walked.
  const atRisk = !active.has(yesterday) && active.has(dayBefore);
  if (!atRisk || bought) return null;

  // What the streak was, counted as if yesterday had been kept.
  const wouldBe = currentStreak({ ...state, frozenDays: [...state.frozenDays, yesterday] });
  if (wouldBe < 2) return null;

  const price = streakPrice(wouldBe);
  const xp = standing(state).xp;
  const affordable = xp >= price;

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-acting/50 bg-navy-800 p-5 shadow-[0_0_40px_-18px_var(--color-acting)]">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-acting/15 text-acting">
          <FlameIcon className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-semibold text-ink">
            Your {wouldBe}-day streak is about to go
          </span>
          <span className="text-xs text-ink-muted">
            Yesterday went by without a take. You can buy it back - or let it end and start again today.
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!affordable}
          onClick={() => {
            hapticTap();
            if (keepStreak(yesterday, price)) {
              playXpDing();
              setBought(true);
            }
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-acting px-5 text-sm font-bold text-navy-950 shadow-[0_0_22px_-6px_var(--color-acting)] transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <ZapIcon className="size-4" />
          Keep the streak - {price} XP
        </button>
        <button
          type="button"
          onClick={() => setBought(true)}
          className="min-h-11 px-2 text-xs font-semibold text-ink-faint underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          Let it go
        </button>
      </div>
      <p className="text-[0.65rem] text-ink-faint">
        {affordable
          ? `You have ${xp} XP. Spending it costs you rank as well as the number - that's what makes keeping the streak worth something.`
          : `You have ${xp} XP - ${price - xp} short. Record a take today and start a new one; it'll be cheaper to protect next time.`}
      </p>
    </section>
  );
}
