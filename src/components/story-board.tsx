"use client";

import { useState } from "react";
import { storyPhases, type PhaseId } from "@/data/challenges";
import { StoryProgress } from "@/components/story-progress";
import { StoryJourney, useCurrentPhaseIndex } from "@/components/challenge-carousel";

// The progress bar and the phase list are the same control seen twice:
// clicking a color in the bar opens that phase below it. Keeping the
// open phase in one place here is what lets them agree.

export function StoryBoard() {
  const currentIndex = useCurrentPhaseIndex();
  const [openId, setOpenId] = useState<PhaseId | null>(null);
  const open = openId ?? storyPhases[currentIndex].id;

  return (
    <div className="flex flex-col gap-6">
      <StoryProgress open={open} onOpen={(id) => setOpenId(id)} />
      <StoryJourney
        open={open}
        onOpen={setOpenId}
        currentIndex={currentIndex}
      />
    </div>
  );
}
