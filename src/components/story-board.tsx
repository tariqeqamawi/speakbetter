"use client";

import { useState } from "react";
import type { PhaseId } from "@/data/challenges";
import { StoryProgress } from "@/components/story-progress";
import { JourneyMap } from "@/components/journey-map";

// The progress bar and the map are the same journey seen twice: the bar
// is the overview, the map is the terrain. Clicking a color in the bar
// flies the map to that phase.

export function StoryBoard() {
  const [selected, setSelected] = useState<PhaseId | null>(null);

  const flyTo = (id: PhaseId) => {
    setSelected(id);
    document
      .getElementById(`journey-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col gap-6">
      <StoryProgress open={selected ?? undefined} onOpen={flyTo} />
      <JourneyMap />
    </div>
  );
}
