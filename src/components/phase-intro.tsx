"use client";

import { useEffect, useRef, useState } from "react";
import { TalkingLion, type TalkingLionHandle } from "@/components/talking-lion";
import type { StoryPhase } from "@/data/challenges";

// Coach introducing a phase, above its road.
//
// WHY IT IS HERE. Five locked circles is a wall. A student standing at
// the foot of one wants to know what is up there before they climb -
// not a five-word label, but what they will actually be doing, in the
// order they will do it. The tagline names the phase; this is the
// phase being introduced.
//
// He speaks it where there is a clip, and the words are on screen
// either way - the same rule as the onboarding. The voice is the
// warmth, the text is the content, and if only one of them arrives it
// has to be the text.
//
// HE DOES NOT SPEAK UNTIL ASKED, AFTER THE FIRST TIME. Arriving at
// Challenges and being talked at unprompted is the thing that was just
// taken out of the section tours; it would be no better here. The
// first phase a student opens introduces itself, and after that the
// lion is a button that replays it.

const HEARD_KEY = "speak-better-phase-heard";

export function PhaseIntro({ phase }: { phase: StoryPhase }) {
  const lion = useRef<TalkingLionHandle>(null);
  const [attempt, setAttempt] = useState(0);
  // Which clip is known to exist, rather than a boolean that has to be
  // reset before each new check - storing the src means a stale "yes"
  // from the previous phase can never be believed, and nothing has to
  // be set synchronously inside the effect to clear it.
  const [ready, setReady] = useState<string | null>(null);

  // Autoplay only for the first phase opened in this session. Flicking
  // between phases should not start a new speech every time, and this
  // is read once at mount rather than set from an effect.
  const [auto] = useState(() => {
    try {
      const heard = window.sessionStorage.getItem(HEARD_KEY) === "1";
      window.sessionStorage.setItem(HEARD_KEY, "1");
      return !heard;
    } catch {
      return false;
    }
  });

  const src = `/coach/phase-${phase.id.toLowerCase()}.mp3`;
  const playable = ready === src;

  useEffect(() => {
    let alive = true;
    void fetch(src, { method: "HEAD" })
      .then((r) => {
        if (alive && r.ok) setReady(src);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [src]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-navy-600 bg-navy-800 p-4 sm:flex-row sm:items-center sm:gap-5">
      <button
        type="button"
        onClick={() => {
          lion.current?.prime();
          setAttempt((n) => n + 1);
        }}
        aria-label={`Hear ${phase.name} from Coach`}
        disabled={!playable}
        className="mx-auto w-28 shrink-0 sm:mx-0 sm:w-32 disabled:cursor-default"
      >
        <TalkingLion
          key={`${phase.id}-${attempt}`}
          ref={lion}
          bare
          controls={false}
          audioSrc={playable ? src : undefined}
          autoPlay={playable && (auto || attempt > 0)}
        />
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h2 className={`text-lg font-bold tracking-tight ${phase.textClass}`}>
          {phase.id} - {phase.name}
        </h2>
        <p className="text-sm leading-relaxed text-ink-muted text-balance">{phase.says}</p>
      </div>
    </div>
  );
}
