"use client";

import { useEffect, useState } from "react";
import { useStore, type Attempt } from "@/lib/store";
import { challengeBySlug, challenges } from "@/data/challenges";
import { categories } from "@/data/categories";
import {
  baselineVideo,
  listVideos,
  loadVideo,
  type StoredVideoMeta,
} from "@/lib/attempt-videos";
import { SpectrumStrip } from "@/components/spectrum";
import { PlayIcon, TrendingUpIcon } from "@/components/icons";
import { PlayFillIcon } from "@/components/player-icons";
import { ProgressReel } from "@/components/progress-reel";

// Then and now: the student as they arrived, beside the student today.
//
// The two baseline challenges are recorded before a single technique,
// and their first take is pinned on the device for exactly this (see
// lib/attempt-videos.ts). Ten challenges in, the app sets that take
// beside the most recent attempt - the two videos, the two scores, and
// which colors lit up then that didn't, and now that didn't then. The
// improvement is shown, not announced: a student who watches their own
// baseline after ten challenges doesn't need to be told.
//
// Ten, because that's far enough along the road for the difference to
// be real. Before then the panel names the number and counts toward it
// - the comparison is a reason to keep going, and it should be visible
// as one.

/** Challenges passed before the comparison opens. */
const UNLOCK_AT = 10;

export function ThenAndNow() {
  const { state, ready, attemptsFor, isChallengeComplete } = useStore();
  const [before, setBefore] = useState<StoredVideoMeta | null | undefined>();
  const [after, setAfter] = useState<StoredVideoMeta | null | undefined>();
  const [which, setWhich] = useState<string | null>(null);
  const [reel, setReel] = useState(false);

  const baselines = challenges.filter((c) => c.baseline);
  // The baselines the student has actually recorded - their first take
  // of each is the "then".
  const recorded = baselines.filter((c) => attemptsFor(c.slug).length > 0);
  const slug = which ?? recorded[0]?.slug ?? null;
  // The "then" is the take this device pinned, where it has one - the
  // score and the video have to be the same take - and the first
  // attempt on record otherwise.
  const thenAttempt: Attempt | undefined = slug
    ? (before && attemptsFor(slug).find((a) => a.id === before.id)) ||
      attemptsFor(slug)[0]
    : undefined;
  // The "now" is the latest passed attempt at anything that isn't a
  // baseline - the most recent evidence of where they are - and the
  // latest attempt of any kind where nothing has passed yet.
  const later = [...state.attempts]
    .reverse()
    .filter((a) => !challengeBySlug.get(a.challengeSlug)?.baseline);
  const nowAttempt = later.find((a) => a.passed) ?? later[0];
  const recordable = challenges.filter((c) => !c.passive);
  const passed = recordable.filter((c) => isChallengeComplete(c.slug)).length;
  const open = passed >= UNLOCK_AT;
  const finished = passed >= recordable.length;

  useEffect(() => {
    if (!open || !slug) return;
    baselineVideo(slug).then((v) => setBefore(v ?? null));
  }, [open, slug]);

  useEffect(() => {
    if (!open || !nowAttempt) return;
    listVideos(nowAttempt.challengeSlug).then((list) =>
      setAfter(list.find((v) => v.id === nowAttempt.id) ?? null),
    );
  }, [open, nowAttempt]);

  if (!ready || recorded.length === 0) return null;

  if (!open) {
    return (
      <section className="flex items-center gap-4 rounded-xl border border-navy-600 bg-navy-800/60 px-4 py-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy-700 text-ink-muted">
          <TrendingUpIcon className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-semibold text-ink">Then and now</span>
          <span className="text-xs text-ink-muted">
            Your baseline beside your latest attempt - opens at {UNLOCK_AT}{" "}
            challenges passed.
          </span>
        </div>
        <span className="shrink-0 text-sm font-bold tabular-nums text-ink-muted">
          {passed} / {UNLOCK_AT}
        </span>
      </section>
    );
  }

  if (!thenAttempt || !nowAttempt) return null;

  const delta = nowAttempt.score - thenAttempt.score;
  const litThen = categories.filter((c) => (thenAttempt.spectrum[c.id] ?? 0) >= 40);
  const litNow = categories.filter((c) => (nowAttempt.spectrum[c.id] ?? 0) >= 40);
  const gained = litNow.filter((c) => !litThen.includes(c));
  const nowChallenge = challengeBySlug.get(nowAttempt.challengeSlug);

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-navy-600 bg-navy-800 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUpIcon className="size-5 text-mindset" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink">
            {finished ? "The whole road" : "Then and now"}
          </h2>
        </div>
        {recorded.length > 1 && (
          <div className="flex gap-1 rounded-lg border border-navy-600 bg-navy-900/60 p-0.5">
            {recorded.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setWhich(c.slug)}
                aria-pressed={c.slug === slug}
                className={`rounded-md px-2.5 py-1 text-[0.7rem] font-semibold transition-colors ${
                  c.slug === slug ? "bg-navy-700 text-ink" : "text-ink-faint hover:text-ink-muted"
                }`}
              >
                {c.slug === "speaking-baseline" ? "Speaking" : "Story"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Side
          label="Then"
          title={challengeBySlug.get(thenAttempt.challengeSlug)?.title ?? ""}
          attempt={thenAttempt}
          video={before}
        />
        <Side
          label="Now"
          title={nowChallenge?.title ?? ""}
          attempt={nowAttempt}
          video={after}
        />
      </div>

      {/* The distance, in the score and in the colors. */}
      <div className="flex flex-col gap-1.5 rounded-xl bg-navy-900/60 px-4 py-3">
        <p className="text-sm text-ink">
          <span
            className={`text-2xl font-bold tabular-nums ${
              delta > 0 ? "text-mindset" : delta < 0 ? "text-storytelling" : "text-ink"
            }`}
          >
            {delta > 0 ? "+" : ""}
            {delta}
          </span>{" "}
          <span className="text-ink-muted">
            points · {litThen.length} {litThen.length === 1 ? "color" : "colors"} then,{" "}
            {litNow.length} now
          </span>
        </p>
        {gained.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
            <span>Lit up since:</span>
            {gained.map((c) => (
              <span key={c.id} className="flex items-center gap-1">
                <span className={`size-2 rounded-full ${c.bgClass}`} />
                <span className="text-ink">{c.name}</span>
              </span>
            ))}
          </p>
        )}
      </div>

      {/* The reel: ten seconds of then, ten of now, cut on this
          phone and shared from it - see progress-reel.tsx. */}
      <button
        type="button"
        onClick={() => setReel(true)}
        className="flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-navy-900 transition-opacity hover:opacity-90"
      >
        <PlayFillIcon className="size-4" />
        Play your before and after
      </button>
      <p className="-mt-1 text-center text-xs text-ink-faint text-balance">
        About thirty seconds, made on this phone - share it to your socials
        or with the other students.
      </p>

      {reel && (
        <ProgressReel
          thenAttempt={thenAttempt}
          nowAttempt={nowAttempt}
          thenVideo={before ?? null}
          nowVideo={after ?? null}
          onClose={() => setReel(false)}
        />
      )}
    </section>
  );
}

/** One side of the comparison: the video where this device has it, the
 *  score and spectrum either way. */
function Side({
  label,
  title,
  attempt,
  video,
}: {
  label: string;
  title: string;
  attempt: Attempt;
  /** undefined while loading, null when not on this device */
  video: StoredVideoMeta | null | undefined;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing || !video) return;
    let objectUrl: string | null = null;
    loadVideo(video.id).then((blob) => {
      if (!blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setUrl(null);
    };
  }, [playing, video]);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-col">
        <span className="text-[0.7rem] font-bold uppercase tracking-wider text-ink-faint">
          {label} · {new Date(attempt.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
        <span className="truncate text-xs text-ink-muted" title={title}>
          {title}
        </span>
      </div>

      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-navy-950">
        {playing && url ? (
          <video src={url} controls autoPlay playsInline className="size-full object-contain" />
        ) : video ? (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play your ${label.toLowerCase()} recording`}
            className="group absolute inset-0"
          >
            {video.poster && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={video.poster} alt="" className="size-full object-cover" />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-navy-950/25 transition-colors group-hover:bg-navy-950/10">
              <span className="flex size-11 items-center justify-center rounded-full border border-white/25 bg-navy-950/70 text-ink backdrop-blur-sm">
                <PlayIcon className="size-5 translate-x-px" />
              </span>
            </span>
          </button>
        ) : (
          <div className="flex size-full items-center justify-center p-4 text-center text-xs text-ink-faint text-balance">
            {video === undefined ? "" : "Not on this device"}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold tabular-nums text-ink">{attempt.score}</span>
        <span className="text-xs text-ink-faint">{attempt.passed ? "passed" : "not passed"}</span>
      </div>
      <SpectrumStrip spectrum={attempt.spectrum} />
    </div>
  );
}
