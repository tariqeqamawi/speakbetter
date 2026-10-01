import type { Metadata } from "next";
import { AskCoach } from "@/components/ask-coach";
import { CoachHistory } from "@/components/coach-history";
import { InfoEye } from "@/components/info-eye";
import { SectionTour } from "@/components/section-tour";
import { FeatureReaction } from "@/components/feature-reaction";

export const metadata: Metadata = {
  title: "Coach",
};

// The coach's own page (master plan §07): talk to the coach, and read
// back everything the coach has said. Reached from the lion in the
// header, wherever the student is.
//
// The lion is the page. Everything that isn't him - who he is, and
// every review he has written - is folded behind one line, so the
// screen a student opens is a lion and a button, and the whole of it
// fits without scrolling.

export default function CoachPage() {
  return (
    <div className="flex min-h-[calc(100dvh-10rem)] flex-col gap-4 py-5">
      <header className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Meet &ldquo;Coach&rdquo;</h1>
            <InfoEye label="Who Coach is">
              <p>
                Coach is a lion who isn&apos;t afraid of his true colors - and he&apos;ll help you find yours and roar.
                Talk to him the way you would any other coach: ask how your speaking is developing, read back his
                reviews, and ask how to get better.
              </p>
            </InfoEye>
          </div>
          <SectionTour section="coach" />
        </div>
      </header>

      {/* The lion, centered in whatever room is left. */}
      <div className="flex w-full flex-1 items-center justify-center">
        <AskCoach />
      </div>
      <FeatureReaction feature="ask-coach" label="talking to Coach" />

      <CoachHistory />
    </div>
  );
}
