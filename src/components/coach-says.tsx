"use client";

import { useEffect, useRef, useState } from "react";
import { TalkingLion, type TalkingLionHandle } from "@/components/talking-lion";

// Coach saying a fixed line, at the top of a page.
//
// WHY THE ONBOARDING IS SPOKEN. This is the only moment in the app
// where somebody has paid, opened it, and has no idea yet what they
// bought. A heading and two radio buttons is a form. The lion saying
// it out loud is a welcome - and it establishes in fifteen seconds
// that the coach is a character who talks to you, rather than a
// scoring engine with a mane. Every later review lands differently
// once that is established.
//
// THE WORDS ARE ALWAYS ON SCREEN. Not as a caption track that appears
// while he speaks, but as text that is simply there - because a
// browser can refuse to autoplay audio, the clip can 404, the student
// can be on a train with no sound, and none of those are allowed to
// mean they do not find out what to do next. The voice is the warmth;
// the text is the instruction. If only one of them arrives it has to
// be the text.

export function CoachSays({
  text,
  audioSrc,
  children,
}: {
  text: string;
  /** The rendered clip. Missing is fine - he simply does not speak. */
  audioSrc?: string;
  /** What goes under the words - the choices being introduced. */
  children?: React.ReactNode;
}) {
  const lion = useRef<TalkingLionHandle>(null);
  const [offerPlay, setOfferPlay] = useState(false);
  const [playable, setPlayable] = useState(false);
  /** Bumped to remount the lion, which is how a refused clip is
   *  retried: the handle can prime the audio context but not restart a
   *  play that has already been rejected, so the component is mounted
   *  again with its autoplay inside the still-warm gesture. */
  const [attempt, setAttempt] = useState(0);

  // Only hand the lion an audio source once the file is known to
  // exist. Otherwise a missing clip means a 404 in the console and a
  // play button that does nothing - which is worse than a silent lion,
  // because it looks broken rather than quiet.
  useEffect(() => {
    if (!audioSrc) return;
    let alive = true;
    void fetch(audioSrc, { method: "HEAD" })
      .then((r) => {
        if (alive && r.ok) setPlayable(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [audioSrc]);

  return (
    <div className="flex flex-col items-center gap-4">
      <TalkingLion
        key={attempt}
        ref={lion}
        text={text}
        audioSrc={playable ? audioSrc : undefined}
        autoPlay
        controls={false}
        onBlocked={() => setOfferPlay(true)}
        className="w-full max-w-sm"
      />

      <p className="max-w-xl text-center text-base leading-relaxed text-ink-muted text-balance">{text}</p>

      {/* The browser refused to start the sound. Say so with a button
          rather than leaving him mute for no visible reason. */}
      {offerPlay && playable && (
        <button
          type="button"
          onClick={() => {
            lion.current?.prime();
            setOfferPlay(false);
            setAttempt((n) => n + 1);
          }}
          className="rounded-full border border-navy-600 px-4 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
        >
          Hear it from Coach
        </button>
      )}

      {children}
    </div>
  );
}
