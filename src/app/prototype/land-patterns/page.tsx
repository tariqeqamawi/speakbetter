import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = { title: "Land patterns" };

// Candidate patterns of light for each phase's land, side by side, before
// any of them goes onto the road.

const PatternBench = dynamic(() => import("@/components/adventure/pattern-bench").then((m) => m.PatternBench));

export default function LandPatternsPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Patterns for the land</h1>
        <p className="text-sm text-ink-muted text-balance">
          The same hills, lit eight ways. The first three are on the road today; the rest are candidates. Each is
          shown moving, with the wave of light rolling through, as it would be on the road.
        </p>
      </header>
      <PatternBench />
    </main>
  );
}
