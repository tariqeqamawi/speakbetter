"use client";

import {
  STREAK_CAP_DAYS,
  STREAK_FAST_DAYS,
  STREAK_MAX_PERCENT,
  standing,
  streakBonusPercent,
  streakFreezesEarned,
  streakPrice,
} from "@/lib/progress";
import { currentStreak } from "@/data/badges";
import type { AppState } from "@/lib/store";
import { FlameIcon, ZapIcon } from "@/components/icons";

// What a streak actually does for you.
//
// The calendar showed the streak - a row of days, a number, a flame -
// and never once said what it was FOR. A student could hold a nine-day
// streak for a fortnight without ever learning that it was quietly
// paying them forty-five percent more XP on every challenge, which is
// the entire reason the mechanic exists. A reward nobody knows they
// are earning is not a reward; it is a decoration.
//
// So this is the streak explained the way a review is explained: the
// number, what it is worth right now, what the next step up is worth,
// and what it costs to save one. Written from the student's own state
// rather than as general rules, because "you are earning +45%" is a
// different sentence from "streaks earn a bonus".

export function StreakExplained({ state }: { state: AppState }) {
  // The streak length lives with the badges - it is what several of
  // them are awarded for - rather than in the rank standing, which
  // only knows about XP.
  const streak = currentStreak(state);
  const { xp } = standing(state);
  const bonus = streakBonusPercent(streak);
  const nextBonus = streakBonusPercent(streak + 1);
  const rescue = streakPrice(Math.max(1, streak));
  const canRescue = xp >= rescue;
  const fast = streak < STREAK_FAST_DAYS;
  const capped = bonus >= STREAK_MAX_PERCENT;
  const freezes = streakFreezesEarned(streak);
  const toNextFreeze = 10 - (streak % 10);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-navy-600 bg-navy-800 p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-acting/15 text-acting">
          <FlameIcon className="size-5" />
        </span>
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-bold tracking-tight text-ink">How your streak pays</h3>
          <p className="text-xs text-ink-muted">
            {streak > 0
              ? `${streak} day${streak === 1 ? "" : "s"} in a row, and counting.`
              : "Record on any day and it starts."}
          </p>
        </div>
      </div>

      <ol className="flex flex-col gap-3">
        <Step
          n={1}
          title="One take a day keeps it alive"
          body="Any challenge, any take. Uploading is what counts - not passing, and not how good it was. Showing up is the rep."
        />
        <Step
          n={2}
          title={fast ? "Every day adds 5% XP to every challenge" : "Every day still adds to every challenge"}
          body={
            streak > 0
              ? `You're on +${bonus}% right now. Every challenge you pass today is worth that much more than it would be without the streak.`
              : "Day one is +5%, day two +10%, and so on. It applies to every challenge you pass while the streak is running."
          }
          right={
            <span className="flex items-baseline gap-1 rounded-full bg-acting/15 px-2.5 py-1">
              <ZapIcon className="size-3.5 text-acting" />
              <span className="text-sm font-black tabular-nums text-acting">+{bonus}%</span>
            </span>
          }
        />
        {/* The second slope, named.
            
            This step used to say "it caps at +50%", which meant a
            student on day nine could see that tomorrow was the last
            day worth anything. Now it says what actually happens
            after day ten - the climb halves, and keeps going to a
            month - so the answer to "why keep going" is on the card
            rather than in the code. */}
        <Step
          n={3}
          title={`After ${STREAK_FAST_DAYS} days it's +2.5% a day, up to +${STREAK_MAX_PERCENT}%`}
          body={
            capped
              ? `${STREAK_CAP_DAYS} days running. Double XP on everything you pass, which is as high as the bonus goes - what a longer run earns now is a freeze every ten days.`
              : fast
                ? `The first ${STREAK_FAST_DAYS} days are worth 5% each. After that every day is worth 2.5%, all the way to +${STREAK_MAX_PERCENT}% at ${STREAK_CAP_DAYS} days - double XP on everything. Tomorrow takes you to +${nextBonus}%.`
                : `You're past the fast stretch, so days are worth 2.5% each now, up to +${STREAK_MAX_PERCENT}% at ${STREAK_CAP_DAYS} days. Tomorrow takes you to +${nextBonus}%.`
          }
          right={
            <span className="rounded-full bg-navy-700 px-2.5 py-1 text-xs font-bold tabular-nums text-ink-muted">
              max +{STREAK_MAX_PERCENT}%
            </span>
          }
        />
        {/* The reward that has no ceiling - because it protects the
            streak rather than paying it, it can keep coming forever
            without ever making the hundredth day worth more than the
            work. */}
        <Step
          n={4}
          title="Every 10 days earns a freeze"
          body={
            freezes > 0
              ? `You've earned ${freezes} from this run. A freeze covers one missed day automatically, so a single bad week doesn't cost you the streak. ${toNextFreeze} more day${toNextFreeze === 1 ? "" : "s"} earns another.`
              : `A freeze covers one missed day automatically. The first arrives at 10 days in a row, and another every 10 after that - so the longer a streak runs, the harder it is to lose by accident.`
          }
          right={
            freezes > 0 ? (
              <span className="rounded-full bg-mindset/15 px-2.5 py-1 text-xs font-bold tabular-nums text-mindset">
                {freezes} earned
              </span>
            ) : undefined
          }
        />
        <Step
          n={5}
          title="Miss a day and XP can buy it back"
          body={
            streak > 0
              ? `Saving this one would cost ${rescue} XP${canRescue ? "" : " - more than you have right now"}. The price rises the longer the streak, because the longer it is, the more it was worth keeping.`
              : "If you miss a day, XP can cover it - and the price rises with the length of the streak you're saving."
          }
          right={
            streak > 0 ? (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
                  canRescue ? "bg-storytelling/15 text-storytelling" : "bg-navy-700 text-ink-faint"
                }`}
              >
                {rescue} XP
              </span>
            ) : undefined
          }
        />
      </ol>

      <p className="text-xs leading-relaxed text-ink-faint">
        The bonus is applied when a challenge is scored, so it is worth recording on a day you already have a
        streak running rather than saving the take for tomorrow.
      </p>
    </section>
  );
}

function Step({
  n,
  title,
  body,
  right,
}: {
  n: number;
  title: string;
  body: string;
  right?: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-navy-700 text-[0.65rem] font-bold tabular-nums text-ink-muted">
        {n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">{title}</span>
          {right}
        </span>
        <span className="text-xs leading-relaxed text-ink-muted">{body}</span>
      </div>
    </li>
  );
}
