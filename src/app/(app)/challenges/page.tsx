import type { Metadata } from "next";
import { bonusChallenges, challengesIntro } from "@/data/challenges";
import { StoryJourney } from "@/components/challenge-carousel";
import { StoryProgress } from "@/components/story-progress";
import { StreakFlame } from "@/components/celebrations";
import { PlayIcon } from "@/components/icons";
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
            className="flex min-h-11 items-center gap-1.5 rounded-full border border-navy-600 px-4 py-2.5 text-xs text-ink-faint transition-colors hover:text-ink-muted"
          >
            <PlayIcon className="size-3" />
            {v.title}
          </a>
        ))}
      </div>

      <StoryJourney />

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
                className="flex min-h-11 items-center rounded-lg border border-navy-600 px-4 py-2.5 text-xs text-ink-muted transition-colors hover:text-ink"
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
