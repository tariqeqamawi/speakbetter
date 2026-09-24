import type { Metadata } from "next";
import { badgeDefs, trophyArt } from "@/data/badges";
import type { StageTrophy } from "@/components/trophy-stage";
// The prompts are the one record of which material and colour each
// trophy was rendered in, so the page reads them rather than keeping a
// second copy that could drift from the renders.
import { ALL_TROPHIES } from "../../../../scripts/trophy-prompts.mjs";
import { TrophyRoom } from "./trophy-room";

export const metadata: Metadata = { title: "Trophy room" };

// The trophy room as a student will see it: one trophy standing on the
// podium under the light, and the whole collection underneath.
//
// This page used to carry three racks - drawn medallions, the renders,
// and the medallions again over the rendered stage - because it was
// built to answer whether rendering the trophies was worth it. That
// was answered by doing it, so what is left is the set itself.

const made = new Map(
  ALL_TROPHIES.map((t: { id: string; color: string; material?: string; grand?: boolean }) => [t.id, t]),
);

const trophies: StageTrophy[] = badgeDefs.flatMap((b) => {
  const t = made.get(b.id);
  if (!t) return [];
  return [
    {
      id: b.id,
      name: b.title,
      how: b.how ?? "",
      won: true,
      color: t.color,
      material: t.material ?? "glass",
      grand: t.grand,
      ...trophyArt(b.id),
    },
  ];
});

export default function SpotlightPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-ink">The trophy room</h1>
        <p className="max-w-2xl text-sm text-ink-muted text-balance">
          All {trophies.length} trophies, each standing on the podium under the light the way a student will see
          it. Arrow keys, the chevrons or a swipe to walk the case, or pick any one from the collection below.
          The material is the rank: obsidian, spectrum glass, gold, chrome, ceramic, painted.
        </p>
      </header>
      <TrophyRoom trophies={trophies} />
    </main>
  );
}
