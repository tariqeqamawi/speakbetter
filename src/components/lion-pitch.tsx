"use client";

import { useEffect, useRef, useState } from "react";
import { TalkingLion, type TalkingLionHandle } from "@/components/talking-lion";
import { ListenIcon } from "@/components/icons";

// Coach, talking to the visitor directly.
//
// WHY HE SPEAKS ON A SALES PAGE. Everything else on this page is a
// claim ABOUT him - that an AI coach watches your videos and gives you
// real feedback - and a claim about a thing is always weaker than the
// thing. Ten seconds of him actually speaking, in his own voice, with
// his mouth moving to his own words, settles the question the entire
// page is trying to answer. It is also the only moment a visitor meets
// the character they would be spending six weeks with.
//
// HE DOES NOT SPEAK UNTIL ASKED. Autoplaying audio at a stranger is
// the rudest thing a landing page can do - half of them are on a train
// and the other half have a meeting in the next tab. The words are on
// screen, so the section works in silence; the voice is offered.
//
// Spoken from a file, like every fixed line in this app: no model
// call, no per-visitor cost, and it still works on a day when the
// voice quota is spent.

export function LionPitch({
  line,
  audioSrc,
}: {
  line: string;
  audioSrc: string;
}) {
  const lion = useRef<TalkingLionHandle>(null);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState<string | null>(null);
  const playable = ready === audioSrc;
  const speaking = attempt > 0;

  useEffect(() => {
    let alive = true;
    void fetch(audioSrc, { method: "HEAD" })
      .then((r) => {
        if (alive && r.ok) setReady(audioSrc);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [audioSrc]);

  return (
    <section className="flex w-full max-w-3xl flex-col items-center gap-5 rounded-3xl border border-navy-600 bg-navy-800 px-5 py-8 sm:px-10">
      <div className="w-44 sm:w-56">
        <TalkingLion
          key={attempt}
          ref={lion}
          bare
          controls={false}
          audioSrc={speaking && playable ? audioSrc : undefined}
          autoPlay={speaking}
        />
      </div>

      <p className="max-w-xl text-center text-lg leading-relaxed text-ink text-balance sm:text-xl">
        {line}
      </p>

      <button
        type="button"
        onClick={() => {
          lion.current?.prime();
          setAttempt((n) => n + 1);
        }}
        disabled={!playable}
        className="flex min-h-12 items-center gap-2.5 rounded-full border border-navy-500 px-6 text-sm font-bold text-ink transition-colors hover:border-ink-faint disabled:opacity-40"
      >
        <ListenIcon className="size-5 text-figurative" />
        {speaking ? "Again" : "Hear it from Coach"}
      </button>
    </section>
  );
}
