"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { challengeBySlug, storyPhases } from "@/data/challenges";
import { BackLink } from "@/components/back-link";
import { Feedback } from "@/components/practice-panel";
import { loadVideo } from "@/lib/attempt-videos";

// A review from the student's record, laid out as it landed. The
// recording plays too, where this device still holds it.

export function ReviewPage({ id }: { id: string }) {
  const { state, ready } = useStore();
  const attempt = state.attempts.find((a) => a.id === id);
  const attemptId = attempt?.id;
  const [videoUrl, setVideoUrl] = useState("");
  useEffect(() => {
    if (!attemptId) return;
    let url = "";
    let alive = true;
    loadVideo(attemptId).then((blob) => {
      if (!alive || !blob) return;
      url = URL.createObjectURL(blob);
      setVideoUrl(url);
    });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [attemptId]);

  if (!ready) return null;
  if (!attempt) {
    return (
      <div className="flex flex-col gap-4 py-6">
        <BackLink href="/coach">Coach</BackLink>
        <h1 className="text-2xl font-semibold tracking-tight">That review isn&apos;t here</h1>
        <p className="max-w-md text-sm text-ink-muted">
          Reviews live in this browser&apos;s record of your attempts. Everything Coach has said is on the coach page.
        </p>
        <Link href="/coach" className="w-fit rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-navy-900">
          Go to Coach
        </Link>
      </div>
    );
  }
  const challenge = challengeBySlug.get(attempt.challengeSlug);
  if (!challenge) return null;
  const phase = storyPhases.find((p) => p.id === challenge.phase);
  const tries = state.attempts.filter((a) => a.challengeSlug === attempt.challengeSlug);
  const n = tries.findIndex((a) => a.id === attempt.id) + 1;
  const when = new Date(attempt.at).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const length = `${Math.floor(attempt.durationSec / 60)}:${String(attempt.durationSec % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-5 py-6">
      <header className="flex flex-col gap-2">
        <BackLink href={`/challenges/${challenge.slug}`}>{challenge.title}</BackLink>
        <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">
          {phase?.id} - {phase?.name} · attempt {n} of {tries.length}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Coach&apos;s review</h1>
        <p className="text-sm text-ink-muted">
          {when} · {length} recorded
        </p>
      </header>
      <Feedback attempt={attempt} videoUrl={videoUrl} challenge={challenge} onDone={() => {}} revisit />
    </div>
  );
}
