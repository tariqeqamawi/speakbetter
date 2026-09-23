"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LessonNotes } from "@/components/lesson-notes";
import { LessonSummary } from "@/components/lesson-summary";
import type { CategoryId } from "@/data/categories";
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
  category,
  nextHref,
  nextTitle,
}: {
  vimeoId: string;
  title: string;
  /** Colors the key-ideas panel beneath the video. */
  category?: CategoryId;
  /** The next lesson, offered from the player's own controls. */
  nextHref?: string;
  nextTitle?: string;
}) {
  const { state, ready } = useStore();
  const [decidedFor, setDecidedFor] = useState<string | null>(null);
  const [reward, setReward] = useState<number | undefined>(undefined);
  const [seconds, setSeconds] = useState(0);
  const router = useRouter();

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
      <VimeoPlayer
        vimeoId={vimeoId}
        title={title}
        xp={reward}
        onTime={setSeconds}
        onNext={nextHref ? () => router.push(nextHref) : undefined}
        nextTitle={nextTitle}
      />
      <LessonWatched vimeoId={vimeoId} />
      <LessonSummary vimeoId={vimeoId} />
      {category && <LessonNotes vimeoId={vimeoId} category={category} seconds={seconds} />}
    </>
  );
}
