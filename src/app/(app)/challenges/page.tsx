import type { Metadata } from "next";
import { challengesIntro } from "@/data/challenges";
import { StoryBoard } from "@/components/story-board";
import { StreakFlame } from "@/components/celebrations";
import { ChallengesIcon } from "@/components/icons";
import { IntroTabs } from "@/components/intro-tabs";
import { ThenAndNow } from "@/components/then-and-now";

export const metadata: Metadata = {
  title: "Challenges",
};

export default function ChallengesPage() {
  return (
    <div className="flex flex-col gap-8 py-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          {/* The section's own icon travels with its name, the way it
              does in the navigation and on the dashboard. */}
          <h1 className="flex items-center gap-2.5 text-3xl font-semibold tracking-tight">
            <ChallengesIcon className="size-7 shrink-0 text-structure" />
            Challenges
          </h1>
          <StreakFlame />
        </div>
        <p className="max-w-lg text-ink-muted">
          The STORY journey: five phases, from your first baseline recording to
          your voice in the world. Watch the challenge, warm up with its
          skills, then record yourself completing it.
        </p>
      </header>


      {/* The two orientation videos play here rather than on Vimeo -
          a student should never have to leave the course to start it.
          One frame, two tabs: the second is a tap away, not a scroll. */}
      <IntroTabs videos={challengesIntro} />

      {/* The baseline beside the latest attempt, once there's a road
          between them - see then-and-now.tsx. */}
      <ThenAndNow />

      <StoryBoard />
    </div>
  );
}
