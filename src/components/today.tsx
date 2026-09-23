"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { currentStreak, practicedToday } from "@/data/badges";
import { nextUp, continueWatching } from "@/lib/next-up";
import { challenges, storyPhases } from "@/data/challenges";
import { categories } from "@/data/categories";
import { SpectrumWave } from "@/components/spectrum-wave";
import { TodayCommunity } from "@/components/today-community";
import { StreakRescue } from "@/components/streak-rescue";
import { challengeProgress } from "@/lib/challenge-progress";
import { categoryById } from "@/data/categories";
import { VideoStill } from "@/components/video-still";
import { DailyQuests } from "@/components/daily-quests";
import { VideoIcon } from "@/components/icons";
import { LevelIcon, levelMeta } from "@/components/level-icon";
import { FlameIcon } from "@/components/icons";
import { CheckIcon, PlayIcon } from "@/components/icons";

// The daily home. A library of 24 challenges invites browsing; this
// screen names the one thing to do today, which is what actually
// produces the repetition the whole method rests on.

export function Today() {
  const { state, ready } = useStore();
  if (!ready) return null;

  const streak = currentStreak(state);
  const doneToday = practicedToday(state);
  const up = nextUp(state);
  const recent = continueWatching(state);
  const lastAttempt = state.attempts.at(-1);
  const passed = challenges.filter((c) => challengeProgress(c, state).passed).length;
  const meta = state.level ? levelMeta[state.level] : null;

  return (
    <div className="flex flex-col gap-8 py-6">
      <header className="relative overflow-hidden rounded-3xl border border-navy-600 bg-navy-800 p-5 sm:p-6">
        {/* The day's own light: the spectrum, low and wide behind the
            greeting, so Today opens with colour rather than a line of
            grey text. */}
        <span aria-hidden className="spectrum-rule absolute inset-x-0 top-0 h-1" />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-acting), transparent 70%)" }}
        />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-ink-faint">{greeting()}{state.displayName ? `, ${state.displayName.split(" ")[0]}` : ""}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {doneToday ? "You've practiced today" : "Ready to practice?"}
            </h1>
          </div>
          {state.level && meta && <LevelIcon level={state.level} className="h-14 w-auto shrink-0" />}
        </div>
        {/* Three numbers, in their colours. */}
        <div className="relative mt-5 grid grid-cols-3 gap-2">
          <Stat label="Challenges passed" value={`${passed}/${challenges.length}`} accent="text-structure" />
          <Stat label="Videos uploaded" value={state.attempts.length} accent="text-body-language" />
          <Stat label="Day streak" value={streak} accent="text-acting" />
        </div>
      </header>

      {/* Nothing behind them yet: one line saying where to start,
          rather than three zeroes and no instruction. */}
      {state.attempts.length === 0 && (
        <section className="flex flex-col items-start gap-3 rounded-2xl border border-acting/40 bg-navy-800 p-5 shadow-[0_0_40px_-18px_var(--color-acting)]">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-acting">Start here</span>
          <p className="text-lg font-semibold leading-snug text-ink text-balance">
            Record your speaking baseline - two minutes, no preparation. It&apos;s the &ldquo;before&rdquo; everything
            else gets measured against.
          </p>
          <p className="text-sm text-ink-muted">
            Coach watches it and comes back with your score, your seven colours and the one thing to do next. Nobody
            else ever sees the video.
          </p>
          <Link
            href="/challenges/speaking-baseline"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-acting px-5 text-sm font-bold text-navy-950 shadow-[0_0_22px_-6px_var(--color-acting)] transition-opacity hover:opacity-95"
          >
            <VideoIcon className="size-4" />
            Record your first take
          </Link>
        </section>
      )}

      {/* A missed day, while it can still be bought back. */}
      <StreakRescue />

      {/* the daily goal, and the streak it protects */}
      <section
        className={`flex items-center gap-4 rounded-xl border p-4 ${
          doneToday
            ? "border-mindset/40 bg-mindset/5"
            : "border-navy-600 bg-navy-800"
        }`}
      >
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
            doneToday ? "bg-mindset/15 text-mindset" : "bg-navy-700 text-ink-faint"
          }`}
        >
          {doneToday ? <CheckIcon className="size-5" /> : <FlameIcon className="size-5" />}
        </span>
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-sm font-semibold text-ink">
            {streak > 0
              ? `${streak}-day streak`
              : "Start a streak - one video is all it takes"}
          </span>
          <span className="text-xs text-ink-faint">
            {doneToday
              ? "Today's done. Come back tomorrow to keep it going."
              : streak > 0
                ? "Record one attempt today to keep it alive."
                : "Practice on any day and it counts."}
          </span>
        </div>
        {state.freezesRemaining > 0 && streak > 1 && (
          <span
            title={`${state.freezesRemaining} streak freezes left - each covers one missed day`}
            className="shrink-0 rounded-full border border-navy-600 px-2.5 py-1 text-[0.65rem] font-medium text-ink-faint"
          >
            {state.freezesRemaining} freeze
            {state.freezesRemaining === 1 ? "" : "s"}
          </span>
        )}
      </section>

      <div data-tour="today">
        <DailyQuests />
      </div>

      {/* the one thing to do */}
      {up && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-ink-faint">
            Next up
          </h2>
          <Link
            href={`/challenges/${up.challenge.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-navy-600 bg-navy-800 transition-colors hover:border-ink-faint sm:flex-row"
          >
            <div className="relative aspect-video w-full shrink-0 bg-navy-950 sm:w-72">
              <VideoStill
                vimeoId={up.challenge.vimeoId}
                accent={categoryById.get(up.challenge.targetSkills[0])!}
                sizes="(min-width: 640px) 288px, 100vw"
              />
              <span className="absolute inset-x-0 bottom-0 flex h-1">
                {up.challenge.targetSkills.map((s) => (
                  <span
                    key={s}
                    className={`flex-1 ${categoryById.get(s)?.bgClass ?? ""}`}
                  />
                ))}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-faint">
                {storyPhases.find((p) => p.id === up.challenge.phase)?.name}
              </span>
              <h3 className="text-lg font-semibold leading-snug text-ink">
                {up.challenge.title}
              </h3>
              <p className="text-sm text-ink-muted">{up.reason}</p>
              {up.ratio > 0 && up.ratio < 1 && (
                <div className="h-1.5 overflow-hidden rounded-full bg-navy-700">
                  <div
                    className="spectrum-rule h-full rounded-full"
                    style={{ width: `${up.ratio * 100}%` }}
                  />
                </div>
              )}
              <span className="mt-auto flex min-h-11 w-fit items-center rounded-full bg-acting px-5 py-2.5 text-sm font-bold text-navy-950 shadow-[0_0_22px_-6px_var(--color-acting)] transition-[box-shadow,opacity] group-hover:opacity-95 group-hover:shadow-[0_0_28px_-4px_var(--color-acting)]">
                {up.action === "start"
                  ? "Start challenge"
                  : up.action === "resume"
                    ? "Resume challenge"
                    : "Practice again"}
              </span>
            </div>
          </Link>
        </section>
      )}

      {lastAttempt && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wider text-ink-faint">
            Your last talk
          </h2>
          <Link
            href="/profile"
            className="flex flex-col gap-2 rounded-xl border border-navy-600 bg-navy-800 p-4 transition-colors hover:border-ink-faint"
          >
            <span className="flex items-baseline justify-between">
              <span className="text-sm text-ink">
                {challenges.find((c) => c.slug === lastAttempt.challengeSlug)?.title}
              </span>
              <span className="text-lg font-bold tabular-nums text-ink">
                {lastAttempt.score}
              </span>
            </span>
            {/* The same resonance trace the dashboard draws, for one talk */}
            <span className="relative block overflow-hidden rounded-lg bg-navy-950/70 p-2">
              <SpectrumWave
                values={lastAttempt.spectrum}
                className="h-24 w-full"
                animate={false}
              />
            </span>
            <span className="flex justify-between px-1">
              {categories.map((cat) => {
                const v = lastAttempt.spectrum[cat.id] ?? 0;
                return (
                  <span
                    key={cat.id}
                    className={`text-[0.65rem] font-bold tabular-nums ${
                      v >= 40 ? cat.textClass : "text-ink-faint"
                    }`}
                  >
                    {v}
                  </span>
                );
              })}
            </span>
          </Link>
        </section>
      )}

      {/* Who else is on the road - the question a student asks here,
          on the page where they ask it. The Community tab is gone; its
          board and its faces live in Today, with the rest a tap away. */}
      <TodayCommunity />

      {recent.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-ink-faint">
            Pick up where you left off
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {recent.map((lesson) => {
              const cat = categoryById.get(lesson.category)!;
              return (
                <li key={lesson.vimeoId}>
                  <Link
                    href={`/skills/${lesson.category}/${lesson.vimeoId}`}
                    className="group flex items-center gap-3 overflow-hidden rounded-lg border border-navy-600 bg-navy-800 transition-colors hover:border-ink-faint"
                  >
                    <span className="relative aspect-video w-20 shrink-0 bg-navy-950">
                      <VideoStill
                        vimeoId={lesson.vimeoId}
                        accent={cat}
                        sizes="80px"
                      />
                    </span>
                    <span className="flex-1 py-2 pr-3 text-xs font-medium leading-snug text-ink">
                      {lesson.title}
                    </span>
                    <PlayIcon className="mr-3 size-4 shrink-0 text-ink-faint" />
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

function Stat({ label, value, accent = "text-ink" }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-navy-600 bg-navy-900/60 px-3 py-2.5">
      <span className={`text-xl font-bold tabular-nums ${accent}`}>{value}</span>
      <span className="text-[0.65rem] leading-tight text-ink-faint">{label}</span>
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
