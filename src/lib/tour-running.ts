"use client";

import { useSyncExternalStore } from "react";

// Whether the whole-app tour is on screen. The tour walks through every
// section, the locked ones included, so a gate that would send a student
// elsewhere stands aside while it runs (skills-gate.tsx).

let running = false;
const listeners = new Set<() => void>();

export function setTourRunning(on: boolean): void {
  if (running === on) return;
  running = on;
  for (const l of listeners) l();
}

export function useTourRunning(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => running,
    () => false,
  );
}
