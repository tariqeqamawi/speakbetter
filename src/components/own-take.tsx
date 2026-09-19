"use client";

import { useEffect, useRef, useState } from "react";
import { loadVideo, type StoredVideoMeta } from "@/lib/attempt-videos";
import { isBare } from "@/components/bare-mode";

// The student's own recording, in the circle of a challenge they've
// passed on the journey map. At rest it's a frame of their take, in
// place of the challenge's still; held under a finger (or the mouse)
// it plays a few seconds, muted, and now and then one plays by itself
// - proof, in their own face, that the road behind them was walked.
//
// The recording is the device's own copy (lib/attempt-videos): nothing
// is fetched, and if the copy is gone the node shows the challenge's
// still as before.

/** How long a self-started play runs. */
const PEEK_MS = 3500;

export function OwnTake({
  take,
  playing,
  className = "",
}: {
  take: StoredVideoMeta;
  /** Play now - held under a finger, or picked to peek by itself. */
  playing: boolean;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // The file is read the first time it's asked to play, and the object
  // URL kept for the page's life - one read per node, not per press.
  useEffect(() => {
    if (!playing || url) return;
    let alive = true;
    loadVideo(take.id).then((blob) => {
      if (!alive || !blob) return;
      setUrl(URL.createObjectURL(blob));
    });
    return () => {
      alive = false;
    };
  }, [playing, url, take.id]);

  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !url) return;
    if (playing) {
      el.currentTime = 0;
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [playing, url]);

  return (
    <span className={`relative block size-full ${className}`}>
      {take.poster && (
        // A data URL from the device - next/image would only add a hop.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={take.poster} alt="" className="size-full object-cover" />
      )}
      {url && (
        <video
          ref={videoRef}
          src={url}
          muted
          playsInline
          loop
          preload="metadata"
          className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${
            playing ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </span>
  );
}

/**
 * Which passed node is peeking by itself right now: one at a time, at
 * random, a few seconds each, with a rest between. Returns the slug.
 */
export function usePeek(slugs: string[]): string | null {
  const [peek, setPeek] = useState<string | null>(null);
  const key = slugs.join("|");
  useEffect(() => {
    if (!slugs.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || isBare()) return;
    let alive = true;
    let t: number;
    const rest = () => {
      if (!alive) return;
      setPeek(null);
      t = window.setTimeout(start, 9000 + Math.random() * 9000);
    };
    const start = () => {
      if (!alive) return;
      setPeek(slugs[Math.floor(Math.random() * slugs.length)]);
      t = window.setTimeout(rest, PEEK_MS);
    };
    t = window.setTimeout(start, 4000 + Math.random() * 4000);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return peek;
}
