import { Suspense } from "react";
import type { Metadata } from "next";
import { BackTo } from "@/components/back-to";
import { CommunityFeed } from "@/components/community-feed";
import { Rooms } from "@/components/rooms";
import { WeeklyBoard } from "@/components/weekly-board";
import { SectionTour } from "@/components/section-tour";
import { ChevronDownIcon, GroupIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Community",
};

export default function CommunityPage() {
  return (
    <div className="flex flex-col gap-5 pb-10 pt-4">
      {/* The way back.
          
          Community is reached from a bar on Today AND from the
          Community panel on the dashboard, and on a phone the only
          way home was the bottom tab - a different gesture from the
          one that got you here, and on a page this long a long way
          from where you are looking. A door should swing both ways,
          and it should open onto the room you came from: see
          back-to.tsx for why the origin travels in the URL. */}
      <Suspense fallback={<span className="h-5" />}>
        <BackTo />
      </Suspense>

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
            Everyone&apos;s progress, seen alongside yours - where they started and where they are now. Three
            leaderboards, because there is more than one way to speak better, and one community bar you all fill
            together.
          </p>
        </details>
      </header>
      {/* The rooms come first. The boards and the before-and-afters
          are things to look at; the rooms are the thing to be IN, and
          a student who opens Community and finds a conversation
          already happening has a reason to come back tomorrow. */}
      <Rooms />

      <CommunityFeed />
      <WeeklyBoard />
    </div>
  );
}
