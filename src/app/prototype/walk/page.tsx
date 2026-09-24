import type { Metadata } from "next";
import { RoadWalk, type WalkStop } from "@/components/road-walk";

export const metadata: Metadata = { title: "Walking the road" };

// The chosen direction, made walkable: scroll it on a phone and the
// next checkpoint grows out of the distance and comes to meet you.

const STOPS: WalkStop[] = [
  { n: 1, title: "Record Your Speaking Baseline", state: "done", marker: { kind: "xp", text: "+116 XP · scored 64" } },
  { n: 2, title: "Tell a Story Without Any Help", state: "done", marker: { kind: "trophy", text: "First story told" } },
  {
    n: 3,
    title: "Watch All The Confidence & Presence Skills",
    state: "here",
    marker: { kind: "note", text: "Your hands finally joined in on the bus story - keep them in frame." },
  },
  { n: 4, title: "No Filler Words", state: "ahead", marker: { kind: "xp", text: "worth up to 100 XP" } },
  { n: 5, title: "Find Your Resonance", state: "ahead" },
  { n: 6, title: "Narrate A Scene From Your Day", state: "locked" },
  { n: 7, title: "Act Out A Story With High Stakes", state: "locked" },
];

export default function WalkPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 pb-24 pt-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Walking the road</h1>
        <p className="text-sm text-ink-muted">
          Scroll. The checkpoints stand <b className="font-semibold text-ink">upright</b> on the road facing you -
          they are not discs lying flat on it - and the one nearest your thumb is the largest. The ground behind them
          recedes to a vanishing point and stays put while you move through it, so scrolling reads as walking rather
          than as sliding a list. Each stop is three hundred pixels of road apart, and the ground in between carries
          what you earned there.
        </p>
      </header>

      <RoadWalk stops={STOPS} />

      <p className="pt-4 text-xs text-ink-faint">
        Scenery only - nothing here is wired to a record. The distance between stops is the setting worth arguing
        about: shorter and it is a list again, longer and the journey starts to feel like work.
      </p>
    </main>
  );
}
