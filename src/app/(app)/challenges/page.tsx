import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Challenges",
};

export default function ChallengesPage() {
  return (
    <div className="flex flex-col gap-3 py-6">
      <h1 className="text-3xl font-semibold tracking-tight">Challenges</h1>
      <p className="max-w-lg text-ink-muted">
        Twenty-one on-camera speaking challenges across the five STORY phases —
        from your first baseline recording to your voice in the world. The
        challenge journey arrives in Phase 2.
      </p>
    </div>
  );
}
