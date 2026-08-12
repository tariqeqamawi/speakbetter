"use client";

import Link from "next/link";
import {
  challengesInPhase,
  storyPhases,
  type Challenge,
  type StoryPhase,
} from "@/data/challenges";
import { categoryById } from "@/data/categories";
import { useStore } from "@/lib/store";
import { actionLabel, challengeProgress } from "@/lib/challenge-progress";
import { CheckIcon } from "@/components/icons";
import { VideoStill } from "@/components/video-still";

// The STORY journey, one bordered section per phase so the five read as
// distinct stages rather than one long list. Each phase carries its own
// color; each challenge leads with a still from its explainer video.

export function StoryJourney() {
  return (
    <div className="flex flex-col gap-6">
      {storyPhases.map((phase) => (
        <PhaseSection key={phase.id} phase={phase} />
      ))}
    </div>
  );
}

function PhaseSection({ phase }: { phase: StoryPhase }) {
  const { state, ready } = useStore();
  const items = challengesInPhase(phase.id);
  const done = ready
    ? items.filter((c) => challengeProgress(c, state).passed).length
    : 0;

  return (
    <section
      className={`flex flex-col gap-4 rounded-2xl border ${phase.borderClass} bg-navy-850/60 p-4 sm:p-5`}
    >
      <header className="flex items-start gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${phase.bgClass} text-lg font-bold text-navy-950`}
        >
          {phase.id}
        </span>
        <div className="flex flex-1 flex-col gap-0.5">
          <h2 className={`text-lg font-semibold ${phase.textClass}`}>
            {phase.name}
          </h2>
          <p className="text-sm text-ink-faint">{phase.tagline}</p>
        </div>
        <span className="shrink-0 pt-1 text-xs tabular-nums text-ink-faint">
          {done}/{items.length}
        </span>
      </header>

      <ul className="flex flex-col gap-3">
        {items.map((challenge) => (
          <li key={challenge.slug}>
            <ChallengeCard challenge={challenge} phase={phase} />
          </li>
        ))}
      </ul>
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
