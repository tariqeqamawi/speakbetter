"use client";

import { useState } from "react";
import { LazyVimeoPlayer } from "@/components/lazy-vimeo-player";

// The orientation videos, one at a time.
//
// There are two, and they used to sit side by side on a laptop and one
// above the other on a phone - where watching the second meant
// scrolling past the first, and the STORY board under both was a
// screen and a half down. So they share one frame now, with a tab for
// each above it: the second video is a tap away rather than a scroll
// away, and the page under them stays where it was.
//
// Switching tabs swaps the player out whole, which stops the video that
// was playing - two orientation videos talking over each other is the
// one thing this must never do.

type Accent = "structure" | "storytelling" | "mindset";

/** Lit when chosen, in its own colour. Two grey tabs look like a
 *  setting somebody has to configure; two coloured ones look like two
 *  things worth watching, which is what they are. */
const ON: Record<Accent, string> = {
  structure: "bg-structure/15 text-structure ring-1 ring-structure/50",
  storytelling: "bg-storytelling/15 text-storytelling ring-1 ring-storytelling/50",
  mindset: "bg-mindset/15 text-mindset ring-1 ring-mindset/50",
};

const PIP: Record<Accent, string> = {
  structure: "bg-structure text-navy-950",
  storytelling: "bg-storytelling text-navy-950",
  mindset: "bg-mindset text-navy-950",
};

export function IntroTabs({
  videos,
}: {
  videos: { title: string; short?: string; vimeoId: string; poster?: string; accent?: Accent }[];
}) {
  const [open, setOpen] = useState(0);
  const video = videos[open] ?? videos[0];
  if (!video) return null;

  return (
    <section className="flex flex-col gap-3">
      <div
        role="tablist"
        aria-label="Orientation videos"
        className="flex w-full gap-1 rounded-xl border border-navy-600 bg-navy-900/60 p-1"
      >
        {videos.map((v, i) => {
          const on = i === open;
          return (
            <button
              key={v.vimeoId}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`intro-${v.vimeoId}`}
              onClick={() => setOpen(i)}
              className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-center text-sm font-semibold transition-colors ${
                on ? ON[v.accent ?? "structure"] : "text-ink-faint hover:text-ink-muted"
              }`}
            >
              <span
                aria-hidden
                className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold tabular-nums ${
                  on ? PIP[v.accent ?? "structure"] : "bg-navy-700 text-ink-muted"
                }`}
              >
                {i + 1}
              </span>
              <span className="truncate sm:hidden">{v.short ?? v.title}</span>
              <span className="hidden truncate sm:inline">{v.title}</span>
            </button>
          );
        })}
      </div>

      <div
        key={video.vimeoId}
        id={`intro-${video.vimeoId}`}
        role="tabpanel"
        className="panel-in"
      >
        <LazyVimeoPlayer
          vimeoId={video.vimeoId}
          title={video.title}
          poster={video.poster ?? `/thumbs/${video.vimeoId}.jpg`}
        />
      </div>
    </section>
  );
}
