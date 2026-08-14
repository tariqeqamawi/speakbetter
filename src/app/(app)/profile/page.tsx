"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { challenges, storyPhases } from "@/data/challenges";
import { categories } from "@/data/categories";
import { lessons } from "@/data/lessons";
import { SpectrumHistory } from "@/components/spectrum-history";
import { SpectrumSignature } from "@/components/spectrum-signature";
import { StreakCalendar } from "@/components/streak-calendar";
import { BadgeCollection } from "@/components/badge-collection";
import { DashboardHeader } from "@/components/dashboard-header";
import { SpectrumStrip } from "@/components/spectrum";
import { useChallengeComplete } from "@/components/story-progress";
import { CategoryIcon } from "@/components/category-icons";
import { SectionBanner } from "@/components/section-banner";
import { ChallengesIcon, SkillsIcon } from "@/components/icons";

// The student's dashboard: where they stand, what they've earned, what
// they're made of, and the only place the level is changed (master plan
// §09 — movement between levels is always manual).
//
// It's built as a heads-up display rather than a settings page. Every
// panel is a view of real work: the rank comes from what they did, the
// signature from what they recorded, the calendar from the days they
// showed up. Nothing here flatters a student who hasn't practised.

export default function DashboardPage() {
  const { state, ready, attemptsFor } = useStore();
  const isComplete = useChallengeComplete();

  if (!ready) return null;

  const completed = challenges.filter((c) => isComplete(c.slug)).length;
  const watched = state.watchedLessons.length;

  return (
    <div className="flex flex-col gap-6 py-6">
      <DashboardHeader />

      {/* Challenges and lessons, each with their own breakdown — one
          half of the row each, so they fill the width rather than
          huddling on the left of it. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800">
          <SectionBanner
            image="/sections/challenges.jpg"
            title="Challenges"
            Icon={ChallengesIcon}
            accentClass="text-structure"
            large
            right={
              <span className="text-xs tabular-nums text-ink-faint">
                {completed} of {challenges.length}
              </span>
            }
          />
          <div className="flex flex-col gap-4 p-5">
          <span className="text-sm text-ink-muted">
            <b className="font-semibold tabular-nums text-ink">{completed}</b>{" "}
            complete
          </span>
          <ul className="flex flex-col gap-2.5">
            {storyPhases.map((phase) => {
              const inPhase = challenges.filter((c) => c.phase === phase.id);
              const done = inPhase.filter((c) => isComplete(c.slug)).length;
              return (
                <li key={phase.id} className="flex items-center gap-3">
                  <span className="w-4 text-xs font-bold text-ink">
                    {phase.id}
                  </span>
                  <span className="flex-1 truncate text-xs text-ink-muted">
                    {phase.name}
                  </span>
                  <span
                    className={`h-2 w-24 overflow-hidden rounded-full ${phase.tintClass}`}
                  >
                    <span
                      className={`block h-full rounded-full ${phase.bgClass} ${phase.textClass} ${
                        done > 0 ? "shadow-[0_0_8px_currentColor]" : ""
                      }`}
                      style={{ width: `${(done / inPhase.length) * 100}%` }}
                    />
                  </span>
                  <span className="w-8 text-right text-xs tabular-nums text-ink-faint">
                    {done}/{inPhase.length}
                  </span>
                </li>
              );
            })}
          </ul>
          <Link
            href="/challenges"
            className="self-start text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            Go to challenges →
          </Link>
          </div>
        </section>

        <section className="flex flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800">
          <SectionBanner
            image="/sections/lessons.jpg"
            title="Lessons"
            Icon={SkillsIcon}
            accentClass="text-storytelling"
            large
            right={
              <span className="text-xs tabular-nums text-ink-faint">
                {watched} of {lessons.length}
              </span>
            }
          />
          <div className="flex flex-col gap-4 p-5">
          <span className="text-sm text-ink-muted">
            <b className="font-semibold tabular-nums text-ink">{watched}</b>{" "}
            watched
          </span>
          <ul className="flex flex-col gap-2.5">
            {categories.map((cat) => {
              const inCat = lessons.filter((l) => l.category === cat.id);
              const seen = inCat.filter((l) =>
                state.watchedLessons.includes(l.vimeoId),
              ).length;
              return (
                <li key={cat.id} className="flex items-center gap-3">
                  <CategoryIcon
                    category={cat.id}
                    className={`size-4 shrink-0 ${cat.textClass}`}
                  />
                  <span className="flex-1 truncate text-xs text-ink-muted">
                    {cat.name}
                  </span>
                  <span className="h-2 w-20 overflow-hidden rounded-full bg-navy-900">
                    <span
                      className={`block h-full rounded-full ${cat.bgClass}`}
                      style={{ width: `${(seen / inCat.length) * 100}%` }}
                    />
                  </span>
                  <span className="w-10 text-right text-xs tabular-nums text-ink-faint">
                    {seen}/{inCat.length}
                  </span>
                </li>
              );
            })}
          </ul>
          <Link
            href="/skills"
            className="self-start text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            Go to skills →
          </Link>
          </div>
        </section>
      </div>

      {/* Signature + streak. The spectrum is the centrepiece, so it takes
          two thirds of the row once there's width for it. */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex lg:col-span-2">
          <SpectrumSignature state={state} />
        </div>
        <StreakCalendar state={state} />
      </div>

      <BadgeCollection state={state} />

      <SpectrumHistory attempts={state.attempts} />

      {state.attempts.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-ink-faint">
            Recent attempts
          </h2>
          <ul className="flex flex-col gap-2">
            {[...state.attempts]
              .reverse()
              .slice(0, 8)
              .map((attempt) => {
                const challenge = challenges.find(
                  (c) => c.slug === attempt.challengeSlug,
                );
                const tries = attemptsFor(attempt.challengeSlug).length;
                return (
                  <li key={attempt.id}>
                    <Link
                      href={`/challenges/${attempt.challengeSlug}`}
                      className="flex items-center gap-3 rounded-lg border border-navy-600 bg-navy-800 px-4 py-3 transition-colors hover:bg-navy-700"
                    >
                      <span className="flex-1 text-sm font-medium text-ink">
                        {challenge?.title ?? attempt.challengeSlug}
                        <span className="ml-2 text-xs font-normal text-ink-faint">
                          {tries > 1 ? `${tries} attempts` : "1 attempt"}
                        </span>
                      </span>
                      <span className="hidden w-32 sm:block">
                        <SpectrumStrip spectrum={attempt.spectrum} />
                      </span>
                      <span className="w-10 text-right text-sm font-bold tabular-nums text-ink">
                        {attempt.score}
                      </span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </section>
      )}

    </div>
  );
}
