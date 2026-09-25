"use client";

import { useEffect, useSyncExternalStore } from "react";

// Holding the trophy reveal back while something else has the floor.
//
// A trophy is usually won by a take, which means it is usually won at
// the exact moment Coach starts reviewing that take. Dropping a
// full-screen reveal over him mid-sentence would bury the review under
// its own reward. So any part of the app that is in the middle of
// saying something can hold the reveals, and the queue waits until it
// lets go.
//
// Every hold also lets go on its own after a while. A hold that is
// never released - an autoplay the browser refused, so the "ended"
// that would release it never comes - must not mean a trophy that is
// never shown.

let holds = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Hold the reveals while `active`, for at most `maxMs`. */
export function useHoldReveals(active: boolean, maxMs = 90_000): void {
  useEffect(() => {
    if (!active) return;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      holds -= 1;
      emit();
    };
    holds += 1;
    emit();
    const t = window.setTimeout(release, maxMs);
    return () => {
      window.clearTimeout(t);
      release();
    };
  }, [active, maxMs]);
}

/** Whether anything is holding the reveals right now. */
export function useRevealsHeld(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => holds > 0,
    () => false,
  );
}
