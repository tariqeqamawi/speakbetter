"use client";

import Link from "next/link";
import { useState } from "react";
import {
  challengesInPhase,
  storyPhases,
  type Challenge,
  type PhaseId,
  type StoryPhase,
} from "@/data/challenges";
import { categoryById } from "@/data/categories";
import { useStore } from "@/lib/store";
import { actionLabel, challengeProgress } from "@/lib/challenge-progress";
import { CheckIcon, ChevronDownIcon, LockIcon } from "@/components/icons";
import { VideoStill } from "@/components/video-still";

// The STORY journey, one bordered section per phase so the five read as
// distinct stages rather than one long list. Each phase carries its own
// color; each challenge leads with a still from its explainer video.

// One phase is open at a time — the one the student is actually on.
// Five phases of challenges stacked vertically is a wall; a journey
// should show you where you are, with what's ahead still closed.
export function StoryJourney() {
  const { state, ready } = useStore();

  // The current phase is the earliest one with work left in it. Later
  // phases stay shut until the journey reaches them; earlier ones can be
  // reopened freely, since finished work is never taken away.
  const phaseDone = (phase: StoryPhase) =>
    challengesInPhase(phase.id).every((c) => challengeProgress(c, state).passed);
  const currentIndex = ready
    ? Math.max(
        0,
        storyPhases.findIndex((p) => !phaseDone(p)) === -1
          ? storyPhases.length - 1
          : storyPhases.findIndex((p) => !phaseDone(p)),
      )
    : 0;

  const [openId, setOpenId] = useState<PhaseId | null>(null);
  const open = openId ?? storyPhases[currentIndex].id;

  return (
    <div className="flex flex-col gap-3">
      {storyPhases.map((phase, i) => (
        <PhaseSection
          key={phase.id}
          phase={phase}
          open={phase.id === open}
          // Ahead of where they've reached, and not yet unlocked.
          locked={i > currentIndex}
          onToggle={() => setOpenId(phase.id === open ? null : phase.id)}
        />
      ))}
    </div>
  );
}

function PhaseSection({
  phase,
  open,
  locked,
  onToggle,
}: {
  phase: StoryPhase;
  open: boolean;
  locked: boolean;
  onToggle: () => void;
}) {
  const { state, ready } = useStore();
  const items = challengesInPhase(phase.id);
  const done = ready
    ? items.filter((c) => challengeProgress(c, state).passed).length
    : 0;

  return (
    <section
      className={`flex flex-col overflow-hidden rounded-2xl border ${
        open ? phase.borderClass : "border-navy-600"
      } bg-navy-850/60 ${locked ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        onClick={locked ? undefined : onToggle}
        aria-expanded={open}
        disabled={locked}
        className={`flex items-start gap-3 p-4 text-left transition-colors sm:p-5 ${
          locked ? "cursor-not-allowed" : "hover:bg-navy-800/60"
        }`}
      >
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
            locked
              ? "bg-navy-700 text-ink-faint"
              : `${phase.bgClass} text-navy-950`
          }`}
        >
          {phase.id}
        </span>
        <div className="flex flex-1 flex-col gap-0.5">
          <h2
            className={`text-lg font-semibold ${locked ? "text-ink-faint" : phase.textClass}`}
          >
            {phase.name}
          </h2>
          <p className="text-sm text-ink-faint">
            {locked
              ? `Finish ${storyPhases[storyPhases.findIndex((p) => p.id === phase.id) - 1]?.name ?? "the phase before"} to open this one.`
              : phase.tagline}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-2 pt-1 text-xs tabular-nums text-ink-faint">
          {done}/{items.length}
          {locked ? (
            <LockIcon className="size-4" />
          ) : (
            <ChevronDownIcon
              className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
            />
          )}
        </span>
      </button>

      {open && !locked && (
      <ul className="flex flex-col gap-3 p-4 pt-0 sm:p-5 sm:pt-0">
        {items.map((challenge) => (
          <li key={challenge.slug}>
            <ChallengeCard challenge={challenge} phase={phase} />
          </li>
        ))}
      </ul>
      )}
    </section>
  );
}

function ChallengeCard({
  challenge,
  phase,
}: {
  challenge: Challenge;
  phase: StoryPhase;
}) {
  const { state, ready } = useStore();
  const accent = categoryById.get(challenge.targetSkills[0])!;
  const progress = ready
    ? challengeProgress(challenge, state)
    : { ratio: 0, attempts: 0, passed: false, warmUpWatched: 0, warmUpTotal: 0, action: "start" as const };

  return (
    <Link
      href={`/challenges/${challenge.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-navy-600 bg-navy-800 transition-colors hover:border-ink-faint sm:flex-row"
    >
      <div className="relative aspect-video w-full shrink-0 bg-navy-950 sm:w-64">
        <VideoStill
          vimeoId={challenge.vimeoId}
          accent={accent}
          sizes="(min-width: 640px) 256px, 100vw"
        />
        <span className="absolute inset-x-0 bottom-0 flex h-1">
          {challenge.targetSkills.map((skill) => {
            const c = categoryById.get(skill);
            return <span key={skill} className={`flex-1 ${c?.bgClass ?? ""}`} />;
          })}
        </span>
        {progress.passed && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-navy-950/85 px-2 py-1 text-[0.65rem] font-semibold text-mindset backdrop-blur">
            <CheckIcon className="size-3" />
            Complete
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold leading-snug text-ink">
            {challenge.title}
            {challenge.passive && (
              <span className="ml-2 text-xs font-normal text-ink-faint">
                watch only
              </span>
            )}
          </h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-ink-faint">
            {challenge.brief}
          </p>
        </div>

        {/* progress through this challenge */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-[0.65rem] text-ink-faint">
            <span>
              {progress.passed
                ? "Passed"
                : progress.attempts > 0
                  ? `${progress.attempts} ${progress.attempts === 1 ? "attempt" : "attempts"}`
                  : progress.warmUpTotal > 0
                    ? `${progress.warmUpWatched}/${progress.warmUpTotal} warm-up lessons`
                    : "Not started"}
            </span>
            <span className="tabular-nums">
              {Math.round(progress.ratio * 100)}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-navy-700">
            <div
              className={`h-full rounded-full ${phase.bgClass} transition-[width] duration-500`}
              style={{ width: `${progress.ratio * 100}%` }}
            />
          </div>
        </div>

        <span
          className={`mt-auto flex min-h-11 w-fit items-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity ${
            progress.action === "start"
              ? "bg-ink text-navy-900 group-hover:opacity-90"
              : "border border-navy-600 text-ink-muted group-hover:text-ink"
          }`}
        >
          {actionLabel[progress.action]}
        </span>
      </div>
    </Link>
  );
}
