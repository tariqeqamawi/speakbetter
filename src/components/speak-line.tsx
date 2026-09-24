"use client";

import { useEffect, useRef, useState } from "react";
import { CoachPill } from "@/components/coach-pill";

// A line of the page, said aloud on request.
//
// It is Coach's voice, so it is Coach's button - the big pill with the
// wave running through it, the same one as everywhere else he speaks.
// It never autoplays - sound at a stranger who has just opened
// a page is the rudest thing a site can do, and half of them are
// somewhere they cannot use it. The words are on screen; this is the
// offer of the voice.
//
// The clip is a static file. No model is called, nothing is generated
// per visitor, and it works on a day when the voice quota is spent.

export function SpeakLine({ audioSrc, label = "Listen to Coach" }: { audioSrc: string; label?: string }) {
  const el = useRef<HTMLAudioElement | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetch(audioSrc, { method: "HEAD" })
      .then((r) => {
        if (alive && r.ok) setReady(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
      el.current?.pause();
    };
  }, [audioSrc]);

  if (!ready) return null;

  return (
    <CoachPill
      onClick={() => {
        if (!el.current) {
          el.current = new Audio(audioSrc);
          el.current.addEventListener("ended", () => setPlaying(false));
        }
        if (playing) {
          el.current.pause();
          el.current.currentTime = 0;
          setPlaying(false);
          return;
        }
        setPlaying(true);
        void el.current.play().catch(() => setPlaying(false));
      }}
    >
      {playing ? "Stop" : label}
    </CoachPill>
  );
}
