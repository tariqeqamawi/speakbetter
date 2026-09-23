import type { Metadata } from "next";
import { challengesIntro } from "@/data/challenges";
import { StoryBoard } from "@/components/story-board";
import { StreakFlame } from "@/components/celebrations";
import { ChallengesIcon, ChevronDownIcon } from "@/components/icons";
import { IntroTabs } from "@/components/intro-tabs";
import { ThenAndNow } from "@/components/then-and-now";
import { SectionTour } from "@/components/section-tour";

export const metadata: Metadata = {
  title: "Challenges",
};

export default function ChallengesPage() {
  return (
    <div className="flex flex-col gap-6 pb-10 pt-4">
      <header>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2.5 [&::-webkit-details-marker]:hidden">
            {/* The section's own icon travels with its name, the way it
                does in the navigation and on the dashboard. */}
            <ChallengesIcon className="size-7 shrink-0 text-structure" />
            <h1 className="text-3xl font-semibold tracking-tight">Challenges</h1>
            <ChevronDownIcon className="size-5 shrink-0 text-ink-faint transition-transform group-open:rotate-180" />
            <span className="ml-auto flex items-center gap-2">
              <SectionTour section="challenges" />
              <StreakFlame />
            </span>
          </summary>
          <p className="max-w-lg pt-2 text-sm text-ink-muted">
            The STORY journey: five phases, from your first baseline recording to your voice in the world. Watch the
            challenge, warm up with its skills, then record yourself completing it.
          </p>
        </details>
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
