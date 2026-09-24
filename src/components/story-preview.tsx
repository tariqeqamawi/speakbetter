"use client";

import { useRef, useState } from "react";
import { JourneyMap } from "@/components/journey-map";
import { demoState } from "@/lib/demo-state";
import { challengeBySlug, storyPhases, type PhaseId } from "@/data/challenges";

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
  const frame = useRef<HTMLDivElement>(null);

  // A phase chosen above scrolls the phone's map to that level.
  const showPhase = (id: PhaseId) => {
    setActive(id);
    const f = frame.current;
    const el = f?.querySelector<HTMLElement>(`#journey-${id}`);
    if (f && el) {
      const top = el.getBoundingClientRect().top - f.getBoundingClientRect().top + f.scrollTop - 56;
      f.scrollTo({ top, behavior: "smooth" });
    }
  };
  // A stop tapped on the map travels the phase strip to match it, so
  // the two halves of the control always agree about where you are.
  const pick = (s: string) => {
    const c = challengeBySlug.get(s);
    if (c) setActive(c.phase);
  };

  return (
    <div className="flex w-full max-w-4xl flex-col gap-4">
      {/* The phases */}
      <ol className="grid w-full grid-cols-5 gap-2 sm:gap-3">
        {storyPhases.map((p) => {
          const selected = p.id === active;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => showPhase(p.id)}
                aria-pressed={selected}
                className={`flex w-full flex-col items-center gap-0.5 rounded-xl border p-2.5 text-center transition-[transform,opacity] sm:p-4 ${p.borderClass} ${p.tintClass} ${
                  selected ? "scale-[1.03]" : "opacity-60 hover:opacity-100"
                }`}
              >
                <span className="text-xl font-bold text-ink">{p.id}</span>
                <span className="hidden text-xs font-medium text-ink-muted sm:block">{p.name}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* One column now.
          
          The map used to sit beside a full challenge page, which was
          the second "Record Your Speaking Baseline" on this landing
          page - the free challenge further down is the one that
          matters, because it is the one you can actually do. This
          section is about the SHAPE of the road, so the road is all
          it shows. The whole thing is being rebuilt on the projected
          terrain anyway (see story-road.tsx); there is no sense
          polishing a panel that is on its way out.
          
          Tapping a stop still scrolls and selects on the map itself,
          which is the interaction worth keeping. */}
      <div className="flex justify-center">
        {/* The map itself, live, in a phone. Scroll it, pinch it, tap a
            node. */}
        <figure className="flex flex-col items-center gap-2 lg:sticky lg:top-24">
          <div className="relative w-full max-w-[19rem] rounded-[2.2rem] border-4 border-navy-600 bg-navy-950 p-1.5 shadow-2xl shadow-navy-950">
            <span className="absolute left-1/2 top-3 z-50 h-1.5 w-14 -translate-x-1/2 rounded-full bg-navy-700" />
            <div
              ref={frame}
              className="relative h-[34rem] overflow-y-auto overscroll-contain rounded-[1.8rem] bg-navy-950 px-3 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <JourneyMap preview={demoState} onPick={pick} />
            </div>
          </div>
          <figcaption className="text-center text-xs text-ink-muted">
            A student five challenges in - their face on the road, their trophies where they won them.
            <span className="block text-ink-faint">Scroll, pinch to look closer, tap a stop.</span>
          </figcaption>
        </figure>

      </div>
    </div>
  );
}
