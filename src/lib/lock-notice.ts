"use client";

import { useSyncExternalStore } from "react";
import type { CategoryId } from "@/data/categories";

// The locked colour a student just tried to open, for the notice that
// says how to unlock it (components/lock-notice.tsx). Held outside React
// so a page can raise it in the same moment it sends the student
// elsewhere, and the notice - mounted once, above every page - still
// shows on arrival.

let asked: { colour: CategoryId; at: number } | null = null;
const listeners = new Set<() => void>();

export function showLocked(colour: CategoryId): void {
  asked = { colour, at: Date.now() };
  for (const l of listeners) l();
}

export function clearLocked(): void {
  asked = null;
  for (const l of listeners) l();
}

export function useLocked(): { colour: CategoryId; at: number } | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => asked,
    () => null,
  );
}
