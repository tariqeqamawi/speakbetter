"use client";

import { useEffect, useRef, useState } from "react";
import { TalkingLion, type TalkingLionHandle } from "@/components/talking-lion";
import { ChevronDownIcon, ListenIcon } from "@/components/icons";
import type { StoryPhase } from "@/data/challenges";

// Coach introducing a phase, above its road.
//
// WHY IT IS FOLDED SHUT. A student opening Challenges came to see the
// road, not to read four lines about it. The paragraph is worth having
// - five locked circles is a wall, and this says what is up there -
// but it is worth having ON REQUEST. Left open it pushed the first
// checkpoint below the fold on a phone, which made the thing they came
// for the thing they had to scroll past text to reach.
//
// So the phase is a title, a listen button and a chevron. Tap the
// speaker and he says it; tap the chevron and you can read it. Neither
// costs the road any room until it is asked for.
//
// He does not speak unprompted. Arriving somewhere and being talked at
// is what was taken out of the section tours, and it would be no
// better here.

export function PhaseIntro({ phase }: { phase: StoryPhase }) {
  const lion = useRef<TalkingLionHandle>(null);
  const [attempt, setAttempt] = useState(0);
  const [open, setOpen] = useState(false);
  // Which clip is known to exist, rather than a boolean that must be
  // cleared before each check - storing the src means a stale "yes"
  // from the previous phase can never be believed.
  const [ready, setReady] = useState<string | null>(null);

  const src = `/coach/phase-${phase.id.toLowerCase()}.mp3`;
  const playable = ready === src;
  const speaking = attempt > 0;

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
    <div className="flex flex-col gap-3 rounded-2xl border border-navy-600 bg-navy-800 px-4 py-3">
      <div className="flex items-center gap-3">
        {/* The lion is the listen button. He is only drawn at speaking
            size once he is actually saying something - the rest of the
            time he is a mark on a control, and a large idle lion here
            was a second thing competing with the road. */}
        <button
          type="button"
          onClick={() => {
            lion.current?.prime();
            setAttempt((n) => n + 1);
          }}
          disabled={!playable}
          aria-label={`Hear ${phase.name} from Coach`}
          className={`grid shrink-0 place-items-center rounded-full transition-all ${
            speaking ? "size-16" : "size-10 border border-navy-600"
          } ${playable ? "hover:border-ink-faint" : "opacity-40"}`}
        >
          {speaking ? (
            <TalkingLion
              key={`${phase.id}-${attempt}`}
              ref={lion}
              bare
              controls={false}
              audioSrc={playable ? src : undefined}
              autoPlay
            />
          ) : (
            <ListenIcon className={`size-5 ${phase.textClass}`} />
          )}
        </button>

        <h2 className={`min-w-0 flex-1 text-lg font-bold tracking-tight ${phase.textClass}`}>
          {phase.id} - {phase.name}
        </h2>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Hide what this phase covers" : "Read what this phase covers"}
          className="grid size-9 shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:text-ink"
        >
          <ChevronDownIcon className={`size-5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <p className="text-sm leading-relaxed text-ink-muted text-balance">{phase.says}</p>
      )}
    </div>
  );
}
