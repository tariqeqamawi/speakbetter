"use client";

import { useEffect, useRef, useState } from "react";
import { ListenIcon } from "@/components/icons";

// A line of the page, said aloud on request.
//
// Small on purpose: this is a button beside a headline, not a media
// player. It never autoplays - sound at a stranger who has just opened
// a page is the rudest thing a site can do, and half of them are
// somewhere they cannot use it. The words are on screen; this is the
// offer of the voice.
//
// The clip is a static file. No model is called, nothing is generated
// per visitor, and it works on a day when the voice quota is spent.

export function SpeakLine({ audioSrc, label = "Hear it" }: { audioSrc: string; label?: string }) {
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
    <button
      type="button"
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
      className="flex min-h-9 items-center gap-2 rounded-full border border-navy-600 px-4 text-xs font-semibold text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
    >
      <ListenIcon className={`size-4 ${playing ? "text-figurative" : "text-ink-faint"}`} />
      {playing ? "Stop" : label}
    </button>
  );
}
