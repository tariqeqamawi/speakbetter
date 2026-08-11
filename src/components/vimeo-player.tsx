"use client";

import { useState } from "react";
import { vimeoEmbedUrl } from "@/lib/vimeo";

// Lesson/challenge video player with the portrait-zoom control
// (master plan §14): course videos are landscape, but most students watch
// on a phone in portrait. The zoom button crops into the center of the
// frame — where the speaker is — and fills a tall portrait viewport so
// body language stays visible. Tapping again returns to landscape.

export function VimeoPlayer({ vimeoId, title }: { vimeoId: string; title: string }) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl bg-navy-950 ${
        zoomed ? "mx-auto aspect-[9/16] max-h-[78vh] max-w-md" : "aspect-video"
      }`}
    >
      <iframe
        src={vimeoEmbedUrl(vimeoId)}
        title={title}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className={
          zoomed
            ? "absolute left-1/2 top-0 h-full w-auto -translate-x-1/2 aspect-video border-0"
            : "absolute inset-0 h-full w-full border-0"
        }
      />
      <button
        type="button"
        onClick={() => setZoomed((z) => !z)}
        aria-pressed={zoomed}
        aria-label={zoomed ? "Return to landscape view" : "Zoom into speaker (portrait view)"}
        title={zoomed ? "Landscape view" : "Zoom into speaker"}
        className="absolute bottom-3 right-3 z-10 flex size-9 items-center justify-center rounded-full bg-navy-900/80 text-ink backdrop-blur transition-colors hover:bg-navy-700"
      >
        {zoomed ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4.5" aria-hidden>
            <path d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M9 21H5a2 2 0 0 1-2-2v-4M15 21h4a2 2 0 0 0 2-2v-4" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4.5" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3M8.5 11h5M11 8.5v5" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  );
}
