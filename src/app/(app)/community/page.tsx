import type { Metadata } from "next";
import { CommunityFeed } from "@/components/community-feed";

export const metadata: Metadata = {
  title: "Community",
};

export default function CommunityPage() {
  return (
    <div className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Community</h1>
        <p className="max-w-lg text-ink-muted">
          See how your speaking is progressing alongside other students - and
          next to your own earlier self.
        </p>
      </header>
      {/* The feed is the community's before-and-afters; the rest of the
          layer (§12) arrives with Phase 6. */}
      <CommunityFeed />
    </div>
  );
}
