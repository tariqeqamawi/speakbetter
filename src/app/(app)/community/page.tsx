import type { Metadata } from "next";
import { CommunityFeed } from "@/components/community-feed";
import { WeeklyBoard } from "@/components/weekly-board";
import { SectionTour } from "@/components/section-tour";
import { ChevronDownIcon, GroupIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Community",
};

export default function CommunityPage() {
  return (
    <div className="flex flex-col gap-5 pb-10 pt-4">
      <header>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2.5 [&::-webkit-details-marker]:hidden">
            <GroupIcon className="size-7 shrink-0 text-mindset" />
            <h1 className="text-3xl font-semibold tracking-tight">Community</h1>
            <ChevronDownIcon className="size-5 shrink-0 text-ink-faint transition-transform group-open:rotate-180" />
            <span className="ml-auto">
              <SectionTour section="community" />
            </span>
          </summary>
          <p className="max-w-lg pt-2 text-sm text-ink-muted">
            Everyone&apos;s distance traveled, drawn the way yours is: where they started, under where they are now.
            Three boards, because there&apos;s more than one way to be getting better - and one bar you all fill
            together.
          </p>
        </details>
      </header>
      {/* The feed is the community's before-and-afters; the rest of the
          layer (§12) arrives with Phase 6. */}
      <CommunityFeed />
      <WeeklyBoard />
    </div>
  );
}
