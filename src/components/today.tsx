"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { currentStreak, practicedToday } from "@/data/badges";
import { nextUp, continueWatching } from "@/lib/next-up";
import { challenges, storyPhases } from "@/data/challenges";
import { challengeProgress } from "@/lib/challenge-progress";
import { categoryById } from "@/data/categories";
import { VideoStill } from "@/components/video-still";
import { SpectrumStrip } from "@/components/spectrum";
import { DailyQuests } from "@/components/daily-quests";
import { LevelIcon, levelMeta } from "@/components/level-icon";
import { FlameIcon } from "@/components/icons";
import { CheckIcon, PlayIcon } from "@/components/icons";

// The daily home. A library of 21 challenges invites browsing; this
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
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-ink-faint">{greeting()}</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {doneToday ? "You've practiced today" : "Ready to practice?"}
          </h1>
        </div>
        {state.level && meta && (
          <LevelIcon level={state.level} className="h-12 w-auto shrink-0" />
        )}
      </header>

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
              : "Start a streak — one video is all it takes"}
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
            title={`${state.freezesRemaining} streak freezes left — each covers one missed day`}
            className="shrink-0 rounded-full border border-navy-600 px-2.5 py-1 text-[0.65rem] font-medium text-ink-faint"
          >
            {state.freezesRemaining} freeze
            {state.freezesRemaining === 1 ? "" : "s"}
          </span>
        )}
      </section>

      <DailyQuests />

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
              <span className="mt-auto flex min-h-11 w-fit items-center rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-navy-900 transition-opacity group-hover:opacity-90">
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

      {/* where they stand */}
      <section className="grid grid-cols-3 gap-3">
        <Stat label="Challenges passed" value={`${passed}/${challenges.length}`} />
        <Stat label="Videos uploaded" value={state.attempts.length} />
        <Stat label="Day streak" value={streak} />
      </section>

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
            <SpectrumStrip spectrum={lastAttempt.spectrum} />
          </Link>
        </section>
      )}

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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-navy-600 bg-navy-800 p-4">
      <span className="text-xl font-bold tabular-nums text-ink">{value}</span>
      <span className="text-[0.7rem] leading-tight text-ink-faint">{label}</span>
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
