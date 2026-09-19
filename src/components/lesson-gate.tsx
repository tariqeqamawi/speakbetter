"use client";

import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { onTrial, trialAllowsLesson } from "@/lib/plan";
import { UpgradePanel } from "@/components/upgrade-panel";

// The free baseline watches the lessons its two challenges lean on;
// the rest of the library says what it is and how to open it.

export function LessonGate({ vimeoId, children }: { vimeoId: string; children: ReactNode }) {
  const { state, ready } = useStore();
  if (!ready) return null;
  if (onTrial(state) && !trialAllowsLesson(vimeoId))
    return (
      <UpgradePanel
        title="This lesson is part of the course"
        body="The free baseline includes the lessons your baseline challenges lean on. All eighty-one - the seven colors, the deck, every challenge - come with Foundations, one payment, yours for good."
      />
    );
  return <>{children}</>;
}
