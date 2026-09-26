"use client";

import { useMemo, useRef, useState } from "react";
import { Adventure2D } from "@/components/adventure/adventure-2d";
import { roadStops } from "@/components/adventure/live-adventure";
import { ROAD_SKY, worldPhases } from "@/components/adventure/world-phases";
import { AdventureScreen } from "@/components/adventure/adventure-screen";
import { presence } from "@/data/community-presence";
import { demoState } from "@/lib/demo-state";
import { storyPhases, type PhaseId } from "@/data/challenges";

// The STORY adventure on the landing page, opened up. A visitor shouldn't
// have to buy the course to find out what's in it, and the journey map
// is the thing Speak Better has that nothing else does - so here it is,
// live, in a phone: a worked-in student's road, their face on the
// challenge they're at, their takes and trophies pinned where they were
// won, pinch-zoomable. Tap a phase above and the map travels to it.
//
// It used to open a full challenge page beside the map, which meant
// this section showed the speaking baseline - the same challenge the
// free section further down is about, described twice on one page.
// The road is what this section is for.

export function StoryPreview() {
  const [active, setActive] = useState<PhaseId>("S");
  // The road as a student chooses it: the flat map, or the 3D world.
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const frame = useRef<HTMLDivElement>(null);
  const crowd = useMemo(() => presence(), []);
  // A worked-in student's road - the same sample the demo pages use.
  const stops = useMemo(() => roadStops(demoState, true, crowd), [crowd]);

  // A letter chosen scrolls the phone's map to that section.
  const showPhase = (id: PhaseId) => {
    setActive(id);
    const f = frame.current;
    const el = f?.querySelector<HTMLElement>(`[data-phase="${id}"]`);
    if (f && el) {
      const top = el.getBoundingClientRect().top - f.getBoundingClientRect().top + f.scrollTop - 24;
      f.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-6">
      {/* S.T.O.R.Y. - the letters as they are on the road, in circles. */}
      <ol className="flex gap-2.5 sm:gap-3.5">
        {storyPhases.map((p) => {
          const on = p.id === active;
          const c = worldPhases.find((w) => w.id === p.id)?.color ?? "#fff";
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => showPhase(p.id)}
                aria-pressed={on}
                aria-label={p.name}
                className="grid size-12 place-items-center rounded-full border-2 text-xl font-extrabold transition-transform hover:scale-105 sm:size-14 sm:text-2xl"
                style={{ borderColor: c, color: on ? "#070c18" : c, background: on ? c : "rgba(7,12,24,0.7)", boxShadow: on ? `0 0 22px -4px ${c}` : undefined }}
              >
                {p.id}
              </button>
            </li>
          );
        })}
      </ol>

      {/* What each letter stands for. */}
      <ul className="grid w-full max-w-3xl grid-cols-1 gap-2 sm:grid-cols-5 sm:gap-3">
        {storyPhases.map((p) => (
          <li key={p.id} className="flex items-baseline gap-2 sm:flex-col sm:items-center sm:gap-0.5 sm:text-center">
            <span className={`text-lg font-extrabold ${p.textClass}`}>{p.id}</span>
            <span className="text-sm font-semibold text-ink">{p.name}</span>
          </li>
        ))}
      </ul>

      {/* The road itself, as a student sees it in 2D, live in a phone:
          scroll it, or tap a letter above and it travels there. */}
      <figure className="flex flex-col items-center gap-2">
        <div role="radiogroup" aria-label="View" className="flex rounded-full border border-navy-600 bg-navy-950/80 p-1 text-xs font-bold">
          {(["2d", "3d"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-full px-5 py-1.5 transition-colors ${mode === m ? "bg-ink text-navy-950" : "text-ink-muted hover:text-ink"}`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-[19rem] rounded-[2.2rem] border-4 border-navy-600 bg-navy-950 p-1.5 shadow-2xl shadow-navy-950">
          <span className="absolute left-1/2 top-3 z-50 h-1.5 w-14 -translate-x-1/2 rounded-full bg-navy-700" />
          <div
            ref={frame}
            className={`relative h-[34rem] ${mode === "3d" ? "overflow-hidden" : "overflow-y-auto"} overflow-x-hidden overscroll-contain rounded-[1.8rem] bg-navy-950 pb-6 pt-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
          >
            {/* Laid out at a phone's full width and scaled to fit the
                frame, so it reads exactly as it does in the app. */}
            {mode === "2d" ? (
              <div style={{ width: 390, zoom: 0.72 }}>
                <Adventure2D stops={stops} phases={worldPhases} scrollRoot={frame} />
              </div>
            ) : (
              <div className="-mb-6 -mt-8">
                <AdventureScreen stops={stops} phases={worldPhases} heightClass="h-[34rem]" skyImage={ROAD_SKY} demo />
              </div>
            )}
          </div>
        </div>
        <figcaption className="text-center text-xs text-ink-muted">
          A student a few challenges in - passed, open and still to come. Switch to 3D to watch it travelled.
          <span className="block text-ink-faint">{mode === "2d" ? "Scroll it, or tap a letter." : "Down the road, up to the next challenge, and in."}</span>
        </figcaption>
      </figure>
    </div>
  );
}
