"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TalkingLion, type Phrase, type TalkingLionHandle } from "@/components/talking-lion";
import { Caption } from "@/components/caption";

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
// THE WORDS ARE ALWAYS ON SCREEN - but as one line at a time now,
// with the word being spoken lit, rather than the whole paragraph at
// once. A paragraph asks somebody to read and listen to different
// words at the same time; reading wins, and they finish and look away
// while he is still talking. The caption keeps the eye on the word the
// ear is on, and it is the same treatment their own reviews will get,
// which is worth establishing in the first minute.
//
// The fallback is still the whole paragraph, and that part is not
// negotiable: a browser can refuse to autoplay audio, the clip can
// 404, the student can be on a train with no sound, and none of those
// may mean they do not find out what to do next. With no clock to
// follow there are no phrases to show, so the full text comes back.
// The voice is the warmth; the text is the instruction. If only one of
// them arrives it has to be the text. See caption.tsx.

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
  /** The line he is on, and the word within it. */
  const [said, setSaid] = useState<{ phrase?: Phrase; word: number }>({ word: -1 });
  const say = useCallback((phrase: Phrase | undefined, word: number) => {
    setSaid((was) => (was.phrase === phrase && was.word === word ? was : { phrase, word }));
  }, []);

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
        onSay={say}
        autoPlay
        controls={false}
        onBlocked={() => setOfferPlay(true)}
        className="w-full max-w-sm"
      />

      {/* The box holds its height so the choices below it do not walk
          up and down the screen as lines come and go - which on the
          level picker would mean the button somebody was reaching for
          moving out from under their thumb. */}
      <div className="flex min-h-24 max-w-xl items-center justify-center text-center">
        <Caption phrase={said.phrase} word={said.word} line={text} big />
      </div>

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
