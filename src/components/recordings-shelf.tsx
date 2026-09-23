"use client";

import { useCallback, useEffect, useState } from "react";
import type { Attempt } from "@/lib/store";
import {
  KEEP_PER_CHALLENGE,
  canKeepVideos,
  forgetVideo,
  listVideos,
  loadVideo,
  type StoredVideoMeta,
} from "@/lib/attempt-videos";
import { SpectrumWave } from "@/components/spectrum-wave";
import { CheckIcon, PlayIcon, XIcon } from "@/components/icons";

// The last three videos a student recorded for this challenge, as a
// shelf above the upload box - so the attempt they're about to make
// can be measured against the ones they've made, without leaving the
// page. Played from this device: the app keeps no copy anywhere else
// (see lib/attempt-videos.ts).
//
// Each tile is the video's own frame with the attempt's score and
// spectrum under it, because a row of three identical thumbnails of
// the same face tells you nothing - the score is what makes one
// recording different from the next.

function fmt(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export function RecordingsShelf({
  challengeSlug,
  attempts,
  refreshKey,
}: {
  challengeSlug: string;
  attempts: Attempt[];
  /** Bump to re-read the shelf - after a new attempt is kept. */
  refreshKey: number;
}) {
  const [videos, setVideos] = useState<StoredVideoMeta[]>([]);
  const [open, setOpen] = useState<StoredVideoMeta | null>(null);

  const reload = useCallback(() => {
    listVideos(challengeSlug).then(setVideos);
  }, [challengeSlug]);

  useEffect(() => {
    reload();
  }, [reload, refreshKey]);

  if (!canKeepVideos() || videos.length === 0) return null;

  const attemptOf = (id: string) => attempts.find((a) => a.id === id);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-ink-faint">
          Recordings
        </h3>
        <span className="text-xs text-ink-faint">
          {videos.some((v) => v.pinned)
            ? `Your baseline and the last ${KEEP_PER_CHALLENGE} · kept on this device`
            : `Last ${KEEP_PER_CHALLENGE} · kept on this device`}
        </span>
      </div>

      <ul className={`grid gap-2 ${videos.length > 3 ? "grid-cols-4" : "grid-cols-3"}`}>
        {/* The baseline first, then newest first - the "before" holds
            its place on the shelf however many takes follow it. */}
        {[...videos]
          .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)))
          .map((v) => {
          const attempt = attemptOf(v.id);
          return (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => setOpen(v)}
                aria-label={`Play your recording from ${new Date(v.at).toLocaleDateString()}`}
                className="group flex w-full flex-col gap-1.5 rounded-xl border border-navy-600 bg-navy-800 p-1.5 text-left transition-colors hover:border-ink-faint"
              >
                <span className="relative block aspect-[3/4] w-full overflow-hidden rounded-lg bg-navy-950">
                  {v.poster ? (
                    // A frame of the student's own recording, kept as a
                    // data URL on this device - next/image has nothing
                    // to optimize here.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.poster} alt="" className="size-full object-cover" />
                  ) : null}
                  <span className="absolute inset-0 flex items-center justify-center bg-navy-950/20 transition-colors group-hover:bg-navy-950/5">
                    <span className="flex size-9 items-center justify-center rounded-full border border-white/25 bg-navy-950/70 text-ink backdrop-blur-sm">
                      <PlayIcon className="size-4 translate-x-px" />
                    </span>
                  </span>
                  <span className="absolute bottom-1 right-1 rounded bg-navy-950/80 px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums text-ink">
                    {fmt(v.durationSec)}
                  </span>
                  {v.pinned ? (
                    <span className="absolute left-1 top-1 rounded bg-ink px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-navy-950">
                      Baseline
                    </span>
                  ) : (
                    attempt?.passed && (
                      <span className="absolute left-1 top-1 flex size-5 items-center justify-center rounded-full bg-mindset text-navy-950">
                        <CheckIcon className="size-3" />
                      </span>
                    )
                  )}
                </span>
                <span className="flex items-baseline justify-between px-0.5">
                  <span className="text-[0.7rem] text-ink-faint">
                    {new Date(v.at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {attempt && (
                    <span className="text-sm font-bold tabular-nums text-ink">
                      {attempt.score}
                    </span>
                  )}
                </span>
                {attempt && (
                  <span className="block px-0.5 pb-0.5">
                    {/* The take's spectrum in miniature - the same trace
                        the review draws, small enough for a tile. */}
                    <SpectrumWave values={attempt.spectrum} className="h-8 w-full" animate={false} />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {open && (
        <RecordingViewer
          video={open}
          attempt={attemptOf(open.id)}
          onForget={() => {
            forgetVideo(open.id).then(() => {
              setOpen(null);
              reload();
            });
          }}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  );
}

/**
 * One recording, played full size over the page, with the score it
 * earned beside it. The file is read from this device when the viewer
 * opens and let go when it closes.
 */
function RecordingViewer({
  video,
  attempt,
  onForget,
  onClose,
}: {
  video: StoredVideoMeta;
  attempt?: Attempt;
  onForget: () => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    loadVideo(video.id).then((blob) => {
      if (!blob) {
        setMissing(true);
        return;
      }
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [video.id, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-navy-950/85 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Your recording from ${new Date(video.at).toLocaleDateString()}`}
        className="panel-in relative flex w-full max-w-md flex-col gap-3 rounded-2xl border border-navy-600 bg-navy-900 p-3"
      >
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-faint">
              {new Date(video.at).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}{" "}
              · {fmt(video.durationSec)}
            </span>
            {attempt && (
              <span className="text-sm text-ink">
                <span className="text-lg font-bold tabular-nums">{attempt.score}</span>
                <span className="text-ink-faint">
                  {" "}
                  · {attempt.passed ? "passed" : "not passed"}
                </span>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 items-center justify-center rounded-full border border-navy-600 bg-navy-850 text-ink-muted transition-colors hover:text-ink"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Sized off the viewport so a portrait phone recording is
            whole on a phone screen, not cropped tall by the dialog. */}
        <div className="flex max-h-[68vh] items-center justify-center overflow-hidden rounded-xl bg-navy-950">
          {missing ? (
            <p className="p-8 text-center text-sm text-ink-muted text-balance">
              This video isn&apos;t on this device any more - the browser has
              let it go, or it was recorded on another device. The feedback
              it earned is still here.
            </p>
          ) : url ? (
            <video
              src={url}
              controls
              autoPlay
              playsInline
              className="max-h-[68vh] w-full"
            />
          ) : (
            <div className="spectrum-rule my-16 h-1 w-24 animate-pulse rounded-full" />
          )}
        </div>

        {attempt && <SpectrumWave values={attempt.spectrum} className="h-16 w-full" animate={false} />}

        <div className="flex items-center justify-between gap-3 px-1">
          <span className="text-xs text-ink-faint">
            {video.pinned
              ? "Your baseline - kept on this device for good, for the before-and-after."
              : "Played from this device - the app keeps no copy."}
          </span>
          {!missing && !video.pinned && (
            <button
              type="button"
              onClick={onForget}
              className="shrink-0 text-xs font-semibold text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              Remove from device
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
