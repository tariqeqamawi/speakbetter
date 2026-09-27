"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// "How the road works" - the whole game on one page, behind a small ?
// on the road. The road itself stays clean: no instructions painted on
// it. Everything a student might wonder about - how to move, what a
// portal's colour means, who the faces are, why a trophy is black, when
// Coach speaks - is here, a tap away, and closes back to the road.

const ITEMS: { icon: React.ReactNode; title: string; body: React.ReactNode }[] = [
  {
    icon: (
      <span className="grid size-10 place-items-center rounded-full border border-white/25 bg-navy-900 text-white">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6-6 6 6M6 15l6 6 6-6" />
        </svg>
      </span>
    ),
    title: "Moving",
    body: (
      <>
        Drag the road down (or scroll) to travel forward, up to go back. Or hold the <b>dial</b> in the bottom right:
        push up to go forward - the higher, the faster - and down to go back. Tap a <b>S·T·O·R·Y</b> letter to fly to
        that section.
      </>
    ),
  },
  {
    icon: (
      <span className="grid size-10 place-items-center rounded-full border-2 border-white bg-white/20 shadow-[0_0_14px_white]">
        <span className="grid size-5 place-items-center rounded-full bg-navy-950 text-[0.6rem] font-bold text-white">2</span>
      </span>
    ),
    title: "Portals are challenges",
    body: (
      <>
        Every portal is a challenge, numbered in order, its name above it as you come close.{" "}
        <b className="text-white">White and glowing</b>: open and waiting - tap it, or <b>Start challenge</b>, to dive
        in. <b className="text-mindset">Rimmed in its section&apos;s colour</b>: done - tap to replay. <b className="text-ink-faint">Dark and grey</b>:
        not open yet.
      </>
    ),
  },
  {
    icon: (
      <span className="flex gap-0.5">
        {["S", "T", "O"].map((l, i) => (
          <span
            key={l}
            className="grid size-6 place-items-center rounded-full border-2 text-[0.6rem] font-extrabold"
            style={{ borderColor: ["#1fe890", "#22d9f5", "#ffd60a"][i], color: ["#1fe890", "#22d9f5", "#ffd60a"][i] }}
          >
            {l}
          </span>
        ))}
      </span>
    ),
    title: "Five sections",
    body: (
      <>
        The road runs through the five S.T.O.R.Y. sections. Take the challenges in your section in any order; finish
        them all and the next section opens, with a banner as you cross into it. You can look ahead anywhere - you just
        can&apos;t enter a section until it&apos;s open.
      </>
    ),
  },
  {
    icon: (
      <span className="flex -space-x-2">
        {["M", "J", "A"].map((l, i) => (
          <span
            key={l}
            className="grid size-7 place-items-center rounded-full border-2 border-navy-950 text-[0.65rem] font-bold text-navy-950"
            style={{ background: ["#f53de0", "#22d9f5", "#ffd60a"][i] }}
          >
            {l}
          </span>
        ))}
      </span>
    ),
    title: "Faces and initials",
    body: (
      <>
        The little faces and initials by a portal are your classmates - people who have been on that challenge
        recently. The speech cards are what they said about it. You&apos;re never on the road alone.
      </>
    ),
  },
  {
    icon: (
      <span className="grid size-10 place-items-center">
        <svg viewBox="0 0 24 24" className="size-8" fill="#070c18" stroke="#ffd60a" strokeWidth={1} aria-hidden>
          <path d="M7 4h10v3a5 5 0 01-10 0V4zM4 5h3M17 5h3M4 5c0 3 1.5 4.5 3.5 5M20 5c0 3-1.5 4.5-3.5 5M10 12h4v4h-4zM8 20h8" />
        </svg>
      </span>
    ),
    title: "Black trophies",
    body: (
      <>
        Each portal has its trophy beside it - a dark silhouette until you win it. Pass the challenge well and it lights
        up, and stays lit on your road and in your trophy case.
      </>
    ),
  },
  {
    icon: (
      <span className="grid size-10 place-items-center rounded-full border border-figurative/60 bg-navy-900 text-lg">🦁</span>
    ),
    title: "Coach",
    body: (
      <>
        Coach appears in the sky and speaks when you actually make progress: the first time you open the road, when you
        pass a challenge, and when a new section opens. Exploring is quiet. The 🔊 button turns his voice and the road&apos;s
        sounds on or off.
      </>
    ),
  },
  {
    icon: (
      <span className="grid size-10 place-items-center rounded-full border border-storytelling/60 bg-navy-900 text-lg">🏁</span>
    ),
    title: "The finish line",
    body: <>Pass every challenge and you can cross the finish line at the end of the road.</>,
  },
  {
    icon: (
      <span className="rounded-full border border-navy-600 bg-navy-900 px-2 py-1 text-[0.65rem] font-bold text-ink-muted">3D · 2D</span>
    ),
    title: "3D, 2D and full screen",
    body: (
      <>
        Switch between the 3D road and a flat 2D map at any time. The ⛶ button makes the road full screen; tap ✕, pinch,
        or turn your phone upright to come back.
      </>
    ),
  },
];

export function RoadLegendButton() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="How the road works"
        className="grid size-9 place-items-center rounded-full border border-navy-600 bg-navy-950/80 text-sm font-bold text-ink-muted backdrop-blur hover:text-ink"
      >
        ?
      </button>
      {open &&
        createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="road-legend-title"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-navy-950/80 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[88dvh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-3xl border border-navy-600 bg-navy-900 p-5 shadow-2xl sm:p-6"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-ink-muted hover:text-ink"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <div>
              <span className="spectrum-rule mb-2 block h-1 w-12 rounded-full" />
              <h2 id="road-legend-title" className="text-xl font-semibold">
                How the road works
              </h2>
            </div>
            <ul className="flex flex-col gap-4">
              {ITEMS.map((it) => (
                <li key={it.title} className="flex gap-3">
                  <span className="flex w-12 shrink-0 justify-center pt-0.5">{it.icon}</span>
                  <span className="flex flex-col gap-0.5">
                    <b className="text-sm text-ink">{it.title}</b>
                    <span className="text-sm leading-snug text-ink-muted">{it.body}</span>
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="self-center rounded-full border border-body-language/70 bg-navy-700/70 px-6 py-2 text-sm font-semibold text-ink shadow-[0_0_12px_-2px_var(--color-body-language)]"
            >
              Got it
            </button>
          </div>
        </div>,
        // On the page itself, so no box the road sits in can clip it or
        // hold it under the tab bar.
        document.body,
        )}
    </>
  );
}
