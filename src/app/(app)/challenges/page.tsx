import type { Metadata } from "next";
import Link from "next/link";
import {
  bonusChallenges,
  challengesInPhase,
  challengesIntro,
  storyPhases,
} from "@/data/challenges";
import { CategoryDot } from "@/components/category-chip";
import { ChallengeStatus } from "@/components/challenge-status";
import { StoryProgress } from "@/components/story-progress";
import { StreakFlame } from "@/components/celebrations";
import { vimeoWatchUrl } from "@/lib/vimeo";

export const metadata: Metadata = {
  title: "Challenges",
};

export default function ChallengesPage() {
  return (
    <div className="flex flex-col gap-8 py-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Challenges</h1>
          <StreakFlame />
        </div>
        <p className="max-w-lg text-ink-muted">
          The STORY journey: five phases, from your first baseline recording to
          your voice in the world. Watch the challenge, warm up with its
          skills, then record yourself completing it.
        </p>
      </header>

      <StoryProgress />

      <div className="flex flex-wrap gap-2 text-sm">
        {challengesIntro.map((v) => (
          <a
            key={v.vimeoId}
            href={vimeoWatchUrl(v.vimeoId)}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-navy-600 px-3 py-1.5 text-xs text-ink-faint transition-colors hover:text-ink-muted"
          >
            ▸ {v.title}
          </a>
        ))}
      </div>

      <div className="flex flex-col gap-8">
        {storyPhases.map((phase) => {
          const items = challengesInPhase(phase.id);
          return (
            <section key={phase.id} className="flex flex-col gap-3">
              <header className="flex flex-col gap-0.5">
                <h2 className="text-lg font-semibold text-ink">
                  <span className="mr-2 inline-flex size-6 items-center justify-center rounded-md bg-navy-700 text-sm font-bold text-ink-muted">
                    {phase.id}
                  </span>
                  {phase.name}
                </h2>
                <p className="text-sm text-ink-faint">{phase.tagline}</p>
              </header>
              <ul className="flex flex-col gap-2">
                {items.map((challenge) => (
                  <li key={challenge.slug}>
                    <Link
                      href={`/challenges/${challenge.slug}`}
                      className="flex items-center gap-3 rounded-lg border border-navy-600 bg-navy-800 px-4 py-3 transition-colors hover:bg-navy-700"
                    >
                      <span className="flex shrink-0 gap-1">
                        {challenge.targetSkills.map((skill) => (
                          <CategoryDot key={skill} category={skill} />
                        ))}
                      </span>
                      <span className="flex-1 text-sm font-medium text-ink">
                        {challenge.title}
                        {challenge.passive && (
                          <span className="ml-2 text-xs font-normal text-ink-faint">
                            (watch only)
                          </span>
                        )}
                      </span>
                      <ChallengeStatus slug={challenge.slug} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <section className="flex flex-col gap-3 border-t border-navy-700 pt-6">
        <h2 className="text-sm font-medium uppercase tracking-wider text-ink-faint">
          Bonus challenges
        </h2>
        <ul className="flex flex-wrap gap-2">
          {bonusChallenges.map((bonus) => (
            <li key={bonus.vimeoId}>
              <a
                href={vimeoWatchUrl(bonus.vimeoId)}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-navy-600 px-3 py-2 text-xs text-ink-muted transition-colors hover:text-ink"
              >
                {bonus.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
