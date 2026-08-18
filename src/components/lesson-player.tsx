"use client";

import { useState } from "react";
import { VimeoPlayer } from "@/components/vimeo-player";
import { LessonWatched } from "@/components/lesson-watched";
import { lessonXp } from "@/lib/progress";
import { useStore } from "@/lib/store";

// A lesson's player, plus the two things that only make sense around a
// lesson: recording that it was watched, and paying for it.
//
// The reward is decided once, when the page opens, and not again - the
// lesson is marked watched partway through, so asking "is this watched?"
// at the moment it finishes would always answer yes and nothing would
// ever be paid. Deciding up front also settles the rewatch: come back to
// a lesson you've already seen and it plays with no chime and no badge,
// because you don't earn it twice and the course shouldn't pretend you
// did.

export function LessonPlayer({
  vimeoId,
  title,
}: {
  vimeoId: string;
  title: string;
}) {
  const { state, ready } = useStore();
  const [decidedFor, setDecidedFor] = useState<string | null>(null);
  const [reward, setReward] = useState<number | undefined>(undefined);

  // Decided during render rather than in an effect, so it's settled
  // before the player can ever finish. It waits for the store: until
  // that has loaded every lesson looks unwatched and every rewatch would
  // pay out.
  if (ready && decidedFor !== vimeoId) {
    setDecidedFor(vimeoId);
    setReward(
      state.watchedLessons.includes(vimeoId) ? undefined : lessonXp(vimeoId),
    );
  }

  return (
    <>
      <VimeoPlayer vimeoId={vimeoId} title={title} xp={reward} />
      <LessonWatched vimeoId={vimeoId} />
    </>
  );
}
