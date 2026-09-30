"use client";

import { useSyncExternalStore } from "react";

// How a student likes to browse the skills: the dial, or the grid - the
// eight colours as a list down the screen, and each colour's lessons
// one under another. Some people love the wheel; some would rather read
// a list. Whichever they leave it on is where Skills opens next time,
// like a switch left where they put it.
//
// A setting of this device and this student's taste, not of what they
// have done, so it lives beside the store rather than in it - it has no
// business being restored from a backup onto someone else's phone.

export type SkillsView = "dial" | "grid";

const KEY = "sb-skills-view";
/** New students start on the dial. */
const DEFAULT: SkillsView = "dial";

type Listener = () => void;
const listeners = new Set<Listener>();

function read(): SkillsView {
  try {
    return localStorage.getItem(KEY) === "grid" ? "grid" : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function subscribe(l: Listener): () => void {
  listeners.add(l);
  // Another tab flipping the switch flips it here too.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) l();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function setSkillsView(view: SkillsView): void {
  try {
    localStorage.setItem(KEY, view);
  } catch {
    // Private windows can refuse; the switch still works for this visit.
  }
  memory = view;
  for (const l of listeners) l();
}

/** Held for the visit, for the case where storage refuses the write. */
let memory: SkillsView | null = null;

export function useSkillsView(): SkillsView {
  return useSyncExternalStore(
    subscribe,
    () => memory ?? read(),
    // The server draws the dial: it is the default, and a grid that
    // appears in the HTML only to flip back would flash.
    () => DEFAULT,
  );
}
