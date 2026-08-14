"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { currentStreak } from "@/data/badges";
import { BadgeIcon, FlameIcon } from "@/components/icons";
import { BadgeMedal } from "@/components/badge-medal";
import { hapticCelebrate, playCelebration } from "@/lib/feedback-fx";

// The gamification layer made visible (master plan §11): milestones are
// felt, not just read. One celebration shows at a time; each dismisses
// itself, or on tap. Applies identically at every level — never gated.

export function CelebrationHost() {
  const { celebrations, dismissCelebration } = useStore();
  const current = celebrations[0];

  // Sound and haptics land with the badge, not after it.
  useEffect(() => {
    if (!current) return;
    playCelebration();
    hapticCelebrate();
  }, [current]);

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => dismissCelebration(current.id), 6500);
    return () => clearTimeout(t);
  }, [current, dismissCelebration]);

  if (!current) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 sm:bottom-8"
    >
      <button
        type="button"
        onClick={() => dismissCelebration(current.id)}
        className="celebration-pop flex max-w-sm items-start gap-3 rounded-2xl border border-navy-600 bg-navy-800 p-4 text-left shadow-2xl shadow-navy-950/80"
      >
        {/* The medal the student just won, at the moment they win it —
            the same artwork that lands in their trophy case. */}
        <span className="celebration-bounce" aria-hidden>
          <BadgeMedal
            id={current.id}
            icon={current.icon}
            earned
            className="size-14"
          />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="spectrum-rule h-0.5 w-12 rounded-full" />
          <span className="pt-1 text-sm font-bold text-ink">{current.title}</span>
          <span className="text-sm text-ink-muted">{current.message}</span>
        </span>
      </button>
    </div>
  );
}

export function StreakFlame() {
  const { state, ready } = useStore();
  if (!ready) return null;
  const streak = currentStreak(state);
  if (streak < 2) return null;
  return (
    <span
      title={`${streak}-day practice streak`}
      className="inline-flex items-center gap-1.5 rounded-full border border-navy-600 bg-navy-800 px-2.5 py-1 text-xs font-semibold text-storytelling"
    >
      <FlameIcon className="size-3.5" />
      {streak}-day streak
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
