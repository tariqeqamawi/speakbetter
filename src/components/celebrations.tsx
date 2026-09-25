"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { streakBonusPercent } from "@/lib/progress";
import { currentStreak, trophyArt } from "@/data/badges";
import { BadgeIcon, FlameIcon, ZapIcon } from "@/components/icons";
import { isBare } from "@/components/bare-mode";
import { TrophyReveal } from "@/components/trophy-reveal";
import type { StageTrophy } from "@/components/trophy-stage";
import { caseTrophy } from "@/lib/trophy-case";
import { useRevealsHeld } from "@/lib/reveal-hold";

// The gamification layer made visible (master plan §11): milestones are
// felt, not just read. One celebration shows at a time, and stays until
// it is moved on. Applies identically at every level - never gated.
//
// A trophy won is revealed on the stage from the trophy room
// (trophy-reveal.tsx), wherever the student happens to be when they win
// it - usually the review of the take that won it. Mounted once, in the
// root layout, and fed by the store's queue, so it does not matter which
// screen did the winning. Several at once come one after another.
export function CelebrationHost() {
  const { state, celebrations, dismissCelebration } = useStore();
  // Something is still speaking - Coach's review, the XP splash - and
  // the reveal waits its turn rather than covering it.
  const held = useRevealsHeld();
  // Not in a bare preview - nothing there is anyone's to celebrate.
  const head = isBare() ? undefined : celebrations[0];

  // A beat before the curtain goes up. The trophy is won in the same
  // moment the screen that won it changes - the review arriving - and
  // that screen needs a moment to say it is busy before the reveal
  // decides it is free. Once it is up, it stays up through the whole
  // run of trophies, so several come one after another rather than
  // the stage closing and reopening between them.
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!head || held || open) return;
    const t = window.setTimeout(() => setOpen(true), 700);
    return () => window.clearTimeout(t);
  }, [head, held, open]);

  const current = open ? head : undefined;
  if (!current) return null;

  const dismiss = (ids: string[]) => {
    if (ids.length >= celebrations.length) setOpen(false);
    ids.forEach((id) => dismissCelebration(id));
  };

  const trophy: StageTrophy = caseTrophy(current.id, current.earnedAt) ?? {
    // A badge with no render (none today) still gets its moment, on
    // the placeholder plinth.
    id: current.id,
    name: current.title,
    how: "",
    message: current.message,
    won: true,
    earnedAt: current.earnedAt,
    color: "storytelling",
    ...trophyArt(current.id),
  };

  return (
    <TrophyReveal
      key={current.id}
      trophy={trophy}
      remaining={celebrations.length - 1}
      studentName={state.displayName}
      onContinue={() => dismiss([current.id])}
      onSkipAll={() => dismiss(celebrations.map((c) => c.id))}
    />
  );
}

/**
 * The streak, worn where the challenges are.
 *
 * It was a small grey pill in one colour, which is how you draw a
 * status - and a streak is not a status, it is the thing paying a
 * bonus on everything below it. So it wears all seven colours
 * cascading through it, confetti crosses it every few seconds, and the
 * XP the streak has earned floats up off the top of it.
 *
 * The floating figure is the real number: the bonus percentage applied
 * to what the streak-days actually paid, not a decorative sparkle. A
 * reward you can watch arriving is a different thing from one you are
 * told about.
 */
export function StreakFlame() {
  const { state, ready } = useStore();
  if (!ready) return null;
  const streak = currentStreak(state);
  if (streak < 2) return null;
  const bonus = streakBonusPercent(streak);

  return (
    <span className="relative inline-flex">
      {/* The XP the streak has been quietly paying, drifting up off
          the pill. Two of them, offset, so it reads as a trickle
          rather than a single tick. */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 -top-1">
        <span className="streak-xp absolute left-2 flex items-center gap-0.5 text-[0.6rem] font-black text-storytelling">
          <ZapIcon className="size-2.5" />+{bonus}%
        </span>
        <span
          className="streak-xp absolute right-2 flex items-center gap-0.5 text-[0.6rem] font-black text-mindset"
          style={{ animationDelay: "2.4s" }}
        >
          <ZapIcon className="size-2.5" />XP
        </span>
      </span>

      <span
        title={`${streak}-day practice streak - +${bonus}% XP on every challenge`}
        className="streak-pill relative inline-flex items-center gap-1.5 overflow-hidden rounded-full px-3.5 py-1.5 text-sm font-bold text-navy-950"
      >
        {/* Confetti crossing the pill, every few seconds. */}
        <span aria-hidden className="streak-confetti pointer-events-none absolute inset-0" />
        <FlameIcon className="relative size-4" />
        <span className="relative">{streak}-day streak</span>
      </span>
    </span>
  );
}

export function BadgeShelf() {
  const { state, ready } = useStore();
  if (!ready || state.badges.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium uppercase tracking-wider text-ink-faint">
        Your badges
      </h2>
      <ul className="flex flex-wrap gap-2">
        {state.badges.map((badge) => (
          <li
            key={badge.id}
            title={badge.message}
            className="flex items-center gap-2 rounded-full border border-navy-600 bg-navy-800 px-3 py-1.5 text-xs font-medium text-ink-muted"
          >
            <BadgeIcon name={badge.icon} className="size-4" />
            {badge.title}
          </li>
        ))}
      </ul>
    </section>
  );
}
