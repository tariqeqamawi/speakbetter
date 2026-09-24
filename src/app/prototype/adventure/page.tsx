"use client";

import { StoryRoad, type RoadStop } from "@/components/story-road";
import { challengesInPhase, storyPhases } from "@/data/challenges";

// The adventure as a projected road, before it replaces the live map.
//
// Worth looking at on a phone as well as a laptop: the whole argument
// is that scrolling feels like travelling, and a thumb is what most
// students will travel with.

const phase = storyPhases[1];
const stops: RoadStop[] = challengesInPhase(phase.id).map((c, i) => ({
  slug: c.slug,
  n: i + 1,
  title: c.title,
  state: i === 0 ? "done" : i === 1 ? "here" : i < 3 ? "ahead" : "locked",
  xp: 100,
  // What a passed checkpoint leaves standing on the road behind you.
  trophy: i === 0 ? "Um-Free" : undefined,
}));

export default function AdventurePrototype() {
  return (
    <main className="flex flex-col">
      <div className="mx-auto flex max-w-2xl flex-col gap-2 px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink">The road, projected</h1>
        <p className="text-sm text-ink-muted text-balance">
          Scroll. The checkpoints rise out of the horizon, swell as they come to you and pass; the ground
          converges the way ground does; the finish line sits in the distance until you have nearly earned it;
          and the marker walks the lane ahead of you like a counter on a board. The discs never rotate - they
          stand up out of the landscape and face you.
        </p>
      </div>

      <StoryRoad stops={stops} accent={`var(--color-${phase.bgClass.slice(3)})`} />

      <div className="mx-auto max-w-2xl px-4 py-16 text-sm text-ink-faint">
        The end of the road. Everything above is one sticky frame - the scene never moves, only the distances
        inside it.
      </div>
    </main>
  );
}
