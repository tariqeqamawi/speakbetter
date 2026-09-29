import type { Metadata } from "next";
import { challengesIntro } from "@/data/challenges";
import { LiveAdventure } from "@/components/adventure/live-adventure";
import { StreakFlame } from "@/components/celebrations";
import { ChallengesIcon } from "@/components/icons";
import { ChallengesTabs } from "@/components/challenges-tabs";
import { IntroTabs } from "@/components/intro-tabs";
import { ThenAndNow } from "@/components/then-and-now";
import { SectionTour } from "@/components/section-tour";
import { FeatureReaction } from "@/components/feature-reaction";

export const metadata: Metadata = {
  title: "Challenges",
};

export default function ChallengesPage() {
  return (
    <ChallengesTabs
      heading={
        <header className="flex flex-col items-center text-center">
          {/* The icon sits in the line, just before "Welcome" - not on a
              row of its own above it. */}
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            <ChallengesIcon className="mr-2 inline-block size-6 shrink-0 -translate-y-0.5 align-middle text-structure sm:size-7" />
            Welcome to your interactive challenges
          </h1>
        </header>
      }
      actions={
        <>
          <SectionTour section="challenges" />
          <StreakFlame />
        </>
      }
      orientation={
        <>
          {/* The two orientation videos play here rather than on Vimeo -
              a student should never have to leave the course to start it. */}
          <IntroTabs videos={challengesIntro} />
          {/* The baseline beside the latest attempt, once there's a road
              between them - see then-and-now.tsx. */}
          <ThenAndNow />
          <FeatureReaction feature="road" label="the road" />
        </>
      }
      road={
        // The S.T.O.R.Y. road, filling the screen: a 3D world to travel, or
        // a 2D map to scroll inside the box - the student's choice.
        <LiveAdventure heightClass="h-[var(--road-h)]" stickyTop="top-0" />
      }
    />
  );
}
