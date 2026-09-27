"use client";

import { toggleSound, useSound } from "@/lib/sound";

// The app's one sound switch (lib/sound.ts), in the corner of the header
// and on the full-screen road: one tap to go silent - Coach's captions
// keep running and videos play muted with captions - one tap to hear it
// all again.

export function SoundToggle({ className = "" }: { className?: string }) {
  const on = useSound();
  return (
    <button
      type="button"
      onClick={toggleSound}
      aria-pressed={on}
      aria-label={on ? "Sound on - tap to go silent" : "Sound off - tap to turn sound on"}
      title={on ? "Sound on" : "Sound off"}
      className={`flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
        on
          ? "border-navy-600/80 text-ink-muted hover:border-ink-faint hover:text-ink"
          : "border-navy-600/80 bg-navy-800/80 text-ink-faint hover:border-ink-faint hover:text-ink"
      } ${className}`}
    >
      <SpeakerIcon on={on} />
    </button>
  );
}

export function SpeakerIcon({ on, className = "size-5" }: { on: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4.75 9.5v5h3l4.5 3.75V5.75L7.75 9.5h-3Z" />
      {on ? (
        <>
          <path d="M15.5 9.25a4 4 0 0 1 0 5.5" />
          <path d="M18 6.75a7.5 7.5 0 0 1 0 10.5" />
        </>
      ) : (
        <>
          <path d="m15.75 9.75 4.5 4.5" />
          <path d="m20.25 9.75-4.5 4.5" />
        </>
      )}
    </svg>
  );
}
