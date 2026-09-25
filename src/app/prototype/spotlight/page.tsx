import type { Metadata } from "next";
import { badgeDefs } from "@/data/badges";
import { SpotlightPreview } from "./trophy-room";

export const metadata: Metadata = { title: "Trophy room" };

// The trophy room as a student will see it: one trophy standing on the
// podium under the light, and the whole collection underneath.
//
// This page used to carry three racks - drawn medallions, the renders,
// and the medallions again over the rendered stage - because it was
// built to answer whether rendering the trophies was worth it. That
// was answered by doing it, and the room it settled on is now the
// student's real trophy case; this page is that same case with a
// pretend record, to look at it all won or part-way through.

export default function SpotlightPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-ink">The trophy room</h1>
        <p className="max-w-2xl text-sm text-ink-muted text-balance">
          All {badgeDefs.length} trophies, each standing on the podium under the light the way a student will see
          it. Arrow keys, the chevrons or a swipe to walk the case, or pick any one from the collection below.
          The material is the rank: obsidian, spectrum glass, gold, chrome, ceramic, painted - and the founding
          cohort&apos;s bronze, once only.
        </p>
      </header>
      <SpotlightPreview />
    </main>
  );
}
