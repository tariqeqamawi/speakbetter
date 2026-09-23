import type { Metadata } from "next";
import { AskCoach } from "@/components/ask-coach";
import { CoachHistory } from "@/components/coach-history";

export const metadata: Metadata = {
  title: "Coach",
};

// The coach's own page (master plan §07): talk to the coach, and read
// back everything the coach has said. Reached from the lion in the
// header, wherever the student is.

export default function CoachPage() {
  return (
    <div className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Meet &ldquo;Coach&rdquo;</h1>
        <p className="max-w-lg text-ink-muted">
          Coach is a lion who isn&apos;t afraid of his true colours - and he&apos;ll help you find yours and roar. Talk to
          him the way you would any other coach: ask how your speaking is developing, read back his reviews, and ask how
          to get better.
        </p>
      </header>
      <AskCoach />
      <CoachHistory />
    </div>
  );
}
