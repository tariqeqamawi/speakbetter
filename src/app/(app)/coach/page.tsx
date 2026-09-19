import type { Metadata } from "next";
import { AskCoach } from "@/components/ask-coach";
import { CoachHistory } from "@/components/coach-history";

export const metadata: Metadata = {
  title: "Your coach",
};

// The coach's own page (master plan §07): talk to the coach, and read
// back everything the coach has said. Reached from the lion in the
// header, wherever the student is.

export default function CoachPage() {
  return (
    <div className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Your coach</h1>
        <p className="max-w-lg text-ink-muted">
          Ask how your speaking is developing, and read back every review your coach has given you.
        </p>
      </header>
      <AskCoach />
      <CoachHistory />
    </div>
  );
}
