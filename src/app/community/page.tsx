import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community",
};

export default function CommunityPage() {
  return (
    <div className="flex flex-col gap-3 py-6">
      <h1 className="text-3xl font-semibold tracking-tight">Community</h1>
      <p className="max-w-lg text-ink-muted">
        See how your speaking is progressing alongside other students — and
        next to your own earlier self. The community layer arrives in Phase 6.
      </p>
    </div>
  );
}
