"use client";

import { useState } from "react";
import { AdventureView } from "@/components/adventure/adventure-view";
import type { WorldPhase, WorldStop } from "@/components/adventure/adventure-world";

// Candidate skies for the road, switched in place on the real thing - so
// each is judged moving, over the land, at the size it will be seen.

export const SKIES = [
  { key: "stars", name: "Stars only", image: null, note: "The sky as it is now: points of light, nothing else." },
  { key: "purple", name: "Purple planet (chosen)", image: "/sky/purple-planet.webp", note: "The shattered-moon sky without the moon: the great purple planet, the haze - and stars over it all." },
  { key: "ringed", name: "Ringed giant", image: "/prototype/skies/ringed.webp", note: "A colossal ringed gas giant low on one side, a cratered moon high on the other, a faint spiral galaxy between." },
  { key: "nebula", name: "Nebula river", image: "/prototype/skies/nebula.webp", note: "A violet-magenta nebula arcing across the whole sky, a pale ice planet, a small red one far off." },
  { key: "eclipse", name: "Eclipse", image: "/prototype/skies/eclipse.webp", note: "A giant dark planet eclipsing its star - a burning ring of light - with two crescent moons and aurora ribbons." },
  { key: "galaxy", name: "Galaxy edge-on", image: "/prototype/skies/galaxy.webp", note: "A spiral galaxy stretched across the sky, golden at its core, with a banded orange giant and a crescent moon." },
  { key: "shattered", name: "Shattered moon", image: "/prototype/skies/shattered.webp", note: "A moon broken apart, its pieces strung in a glittering arc, over a huge dim purple planet." },
  { key: "blend-a", name: "Nebula eclipse A", image: "/prototype/skies/blend-a.webp", note: "The Nebula River's colours with the eclipse - plus the ice planet, a red planet and two moons." },
  { key: "blend-b", name: "Nebula eclipse B", image: "/prototype/skies/blend-b.webp", note: "The same mix, a second take: a brighter corona and the nebula sweeping lower." },
] as const;

export function SkyCompare({ stops, phases }: { stops: WorldStop[]; phases: WorldPhase[] }) {
  const [at, setAt] = useState(1);
  const sky = SKIES[at];
  return (
    <div>
      <div className="flex flex-col gap-2 border-b border-navy-700 bg-navy-950 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SKIES.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setAt(i)}
              aria-pressed={i === at}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold transition-colors ${
                i === at ? "border-ink bg-ink text-navy-950" : "border-navy-600 text-ink-muted hover:text-ink"
              }`}
            >
              {i}. {s.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-muted">{sky.note} Drag or scroll down the road to see it move.</p>
      </div>
      <AdventureView stops={stops} phases={phases} fallbackAvatar="/prototype/tariq-avatar.jpg" skyImage={sky.image} />
    </div>
  );
}
