import type { Metadata } from "next";
import { CommunityFeed } from "@/components/community-feed";
import { WeeklyBoard } from "@/components/weekly-board";

export const metadata: Metadata = {
  title: "Community",
};

export default function CommunityPage() {
  return (
    <div className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Community</h1>
        <p className="max-w-lg text-ink-muted">
          Everyone&apos;s distance travelled, drawn the way yours is: where they started, under where they are now.
          Three boards, because there&apos;s more than one way to be getting better - and one bar you all fill together.
        </p>
      </header>
      {/* The feed is the community's before-and-afters; the rest of the
          layer (§12) arrives with Phase 6. */}
      <CommunityFeed />
      <WeeklyBoard />
    </div>
  );
}
