"use client";

import { useState } from "react";
import { storyPhases, challenges, type PhaseId } from "@/data/challenges";
import { PhasePicker } from "@/components/phase-picker";
import { JourneyMap } from "@/components/journey-map";
import { PhaseGraduation } from "@/components/phase-graduation";
import { useChallengeComplete } from "@/components/story-progress";

// The journey, a phase at a time. STORY sits across the top as five
// circles - the one they're on pulsing, the one they're looking at
// ringed - and below it only that phase's stretch of road. Every phase
// can be opened, locked or not: seeing what's coming is the point, and
// twenty-four challenges at once was a wall rather than a road.

export function StoryBoard() {
  const isComplete = useChallengeComplete();
  // Open on the phase they're actually on.
  const current =
    storyPhases.find((p) => challenges.some((c) => c.phase === p.id && !isComplete(c.slug))) ?? storyPhases[0];
  const [open, setOpen] = useState<PhaseId | null>(null);
  const shown = open ?? current.id;
  const phase = storyPhases.find((p) => p.id === shown)!;

  return (
    <div className="flex flex-col gap-5">
      <div className="sticky-under-header -mx-4 border-b border-navy-700/70 bg-navy-900/95 px-4 py-2.5">
        <PhasePicker open={shown} onOpen={setOpen} />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className={`text-lg font-semibold tracking-tight ${phase.textClass}`}>
          {phase.id} - {phase.name}
        </h2>
        <p className="text-sm text-ink-muted">{phase.tagline}</p>
      </div>
      <JourneyMap only={shown} />
      <PhaseGraduation />
    </div>
  );
}
