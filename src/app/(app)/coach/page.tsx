import type { Metadata } from "next";
import { AskCoach } from "@/components/ask-coach";
import { CoachHistory } from "@/components/coach-history";
import { ChevronDownIcon } from "@/components/icons";

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
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Meet &ldquo;Coach&rdquo;</h1>
        {/* Native details: no state, no JavaScript, and it keeps
            working before the page has hydrated. */}
        <details className="group max-w-lg">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-ink-faint transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
            Read more
            <ChevronDownIcon className="size-4 transition-transform group-open:rotate-180" />
          </summary>
          <p className="pt-2 text-sm text-ink-muted">
            Coach is a lion who isn&apos;t afraid of his true colors - and he&apos;ll help you find yours and roar.
            Talk to him the way you would any other coach: ask how your speaking is developing, read back his reviews,
            and ask how to get better.
          </p>
        </details>
      </header>

      {/* The lion, centered in whatever room is left. */}
      <div className="flex w-full flex-1 items-center justify-center">
        <AskCoach />
      </div>

      <CoachHistory />
    </div>
  );
}
