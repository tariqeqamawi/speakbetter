"use client";

import { useEffect } from "react";

// The seven colors drifting through the Coach pill - moved off the
// compositor's hot path.
//
// WHY THIS IS JAVASCRIPT AND NOT A KEYFRAME. It used to be
// `animation: coach-pill 42s linear infinite` over a registered custom
// property. That is the tidiest possible CSS, and it was costing the
// whole app its smoothness: animating a registered custom property
// makes Chrome recalculate style EVERY FRAME, forever, on every page,
// because the property feeds a border and three box-shadows and the
// engine cannot know the result is nearly identical to last frame.
//
// Measured, on the dashboard: 177ms of main-thread work per 3 seconds
// with it, 13ms without. Thirteen times. Every other suspect - the
// backdrop blurs, the gradients, the shadows, the ambient drift - came
// back as noise. This one animation was the choppiness.
//
// A stepped timing function does not fix it; Chrome ticks the property
// regardless of whether the computed value changed. Measured too.
//
// So the color is stepped from here instead, once every few seconds,
// and CSS is left to cross-fade between the steps. A transition runs
// for its own duration and then STOPS, which is the whole difference:
// work happens while the color is actually changing and never in
// between. Same seven colors, same slow drift, ~4% of the cost.

/** The seven, in the order the old keyframes ran them. */
const COLORS = [
  "var(--color-figurative)",
  "var(--color-storytelling)",
  "var(--color-acting)",
  "var(--color-structure)",
  "#3b6cff",
  "var(--color-mindset)",
  "var(--color-body-language)",
];

/** How long each color holds. Seven of these is the old 42s cycle. */
const HOLD_MS = 6000;

export function PillCycle() {
  useEffect(() => {
    // Someone who has asked for less motion gets the first color and
    // no ticking at all - not even the timer.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    const root = document.documentElement;
    let i = 0;
    let timer: ReturnType<typeof setInterval> | undefined;

    const paint = () => root.style.setProperty("--pill-now", COLORS[i % COLORS.length]);

    const start = () => {
      stop();
      if (still.matches) {
        i = 0;
        paint();
        return;
      }
      paint();
      timer = setInterval(() => {
        i += 1;
        paint();
      }, HOLD_MS);
    };

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };

    // A background tab should not be cycling colors nobody can see.
    const onVisibility = () => (document.hidden ? stop() : start());

    start();
    still.addEventListener("change", start);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      still.removeEventListener("change", start);
      document.removeEventListener("visibilitychange", onVisibility);
      root.style.removeProperty("--pill-now");
    };
  }, []);

  return null;
}
