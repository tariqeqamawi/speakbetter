"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { categoryById, type CategoryId } from "@/data/categories";
import { lessonByVimeoId } from "@/data/lessons";
import { CategoryIcon } from "@/components/category-icons";
import type { Attempt } from "@/lib/store";

// Watching your own take back, with what Coach saw floating up as it
// happens: the moment he named a technique, its color's icon rises
// through the frame and fades, with the name of the thing beside it.
//
// It happens here rather than while recording, because nothing on the
// phone can judge a gesture or a story in the moment - the judgement is
// Coach's, and it arrives with the review. So the icons are true: each
// one is a technique he actually spotted, at the timestamp he gave for
// it (skillsSpotted[].at, and any note carrying a time).
//
// A cue fires once, the first time playback passes its second; scrub
// backwards and they re-arm, so a rewatch shows them again.

interface Cue {
  at: number;
  category: CategoryId;
  label: string;
}

function seconds(stamp: string | undefined): number | null {
  if (!stamp) return null;
  const m = /^(\d+):(\d{1,2})$/.exec(stamp.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Everything Coach put a time on, as cues in order. */
function cuesOf(attempt: Attempt): Cue[] {
  const out: Cue[] = [];
  for (const s of attempt.skillsSpotted ?? []) {
    const at = seconds(s.at);
    const lesson = lessonByVimeoId.get(s.lessonId);
    if (at === null || !lesson) continue;
    out.push({ at, category: lesson.category, label: lesson.title });
  }
  for (const note of [...(attempt.strengths ?? []), ...attempt.focus]) {
    const at = seconds(note.at);
    if (at === null) continue;
    const name = categoryById.get(note.category)?.short ?? "";
    out.push({ at, category: note.category, label: name });
  }
  // One per second at most, earliest first - two icons in the same
  // instant is confetti, not information.
  const seen = new Set<number>();
  return out
    .sort((a, b) => a.at - b.at)
    .filter((c) => {
      const key = Math.round(c.at);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function TakePlayback({ url, attempt }: { url: string; attempt: Attempt }) {
  const cues = useMemo(() => cuesOf(attempt), [attempt]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fired = useRef<Set<number>>(new Set());
  const [flying, setFlying] = useState<{ key: number; cue: Cue }[]>([]);
  const nextKey = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || cues.length === 0) return;
    const onTime = () => {
      const t = video.currentTime;
      cues.forEach((cue, i) => {
        if (fired.current.has(i)) {
          // Scrubbed back before it: let it happen again.
          if (t < cue.at - 1.5) fired.current.delete(i);
          return;
        }
        if (t >= cue.at && t < cue.at + 1.5) {
          fired.current.add(i);
          const key = nextKey.current++;
          setFlying((list) => [...list, { key, cue }]);
          window.setTimeout(() => setFlying((list) => list.filter((f) => f.key !== key)), 3200);
        }
      });
    };
    video.addEventListener("timeupdate", onTime);
    return () => video.removeEventListener("timeupdate", onTime);
  }, [cues]);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-lg bg-navy-950">
        <video ref={videoRef} src={url} controls playsInline className="w-full bg-navy-950" />
        {/* The colors rising through the frame. Pointer-events none, so
            the player's own controls are never in the way. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {flying.map(({ key, cue }, i) => {
            const cat = categoryById.get(cue.category);
            return (
              <span
                key={key}
                className={`take-cue absolute bottom-16 flex items-center gap-2 ${cat?.textClass ?? "text-ink"}`}
                style={{ left: `${12 + ((i * 23) % 55)}%` }}
              >
                <span className="grid size-10 place-items-center rounded-full border border-current bg-navy-950/80 shadow-[0_0_18px_-2px_currentColor] backdrop-blur-sm">
                  <CategoryIcon category={cue.category} className="size-5" />
                </span>
                <span className="max-w-[9rem] truncate rounded-full bg-navy-950/80 px-2 py-0.5 text-[0.65rem] font-semibold backdrop-blur-sm">
                  {cue.label}
                </span>
              </span>
            );
          })}
        </div>
      </div>
      {cues.length > 0 && (
        <p className="text-xs text-ink-faint">
          Watch it back and the colors you lit float up as they happen - {cues.length} moment
          {cues.length === 1 ? "" : "s"} Coach put a time on.
        </p>
      )}
    </div>
  );
}
