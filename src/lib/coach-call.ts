"use client";

import { useSyncExternalStore } from "react";

// Coach, calling.
//
// When Coach has something to say he does not put it on the screen. He
// rings the Coach button in the navigation and waits there, the way a
// person waits to be invited into a conversation. Two components have
// to agree about that: the pop-in, which knows there is a message, and
// the navigation, which owns the button that rings. They are on
// opposite sides of the layout and neither contains the other, so the
// fact travels through here rather than through props.
//
// Deliberately not in the app store. The store is what a student has
// done - it is persisted, restored from a backup file, synced. Whether
// a line of encouragement happens to be waiting in this tab, right
// now, is none of those things, and putting it there would mean a
// pending pop-in could be restored from a week-old backup.

type Listener = () => void;

let calling = false;
const listeners = new Set<Listener>();

/** Set by the pop-in: how the navigation answers the call. */
let answer: (() => void) | null = null;

function emit() {
  for (const l of listeners) l();
}

function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** The pop-in says whether Coach is waiting, and how to let him in. */
export function setCoachCalling(next: boolean, open?: () => void): void {
  answer = next ? open ?? null : null;
  if (calling === next) return;
  calling = next;
  emit();
}

/** True while Coach has something waiting to be heard. */
export function useCoachCalling(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => calling,
    // The server renders the quiet button. A ring that appears in the
    // HTML would be a ring the student had already missed.
    () => false,
  );
}

/**
 * Tapping the ringing button. Returns true if the call was answered,
 * which is the navigation's signal not to follow its own link - the
 * message opens where the student already is.
 */
export function answerCoach(): boolean {
  if (!calling || !answer) return false;
  answer();
  return true;
}

/**
 * The ring, as a sound.
 *
 * Synthesised rather than loaded: it is two notes and a decay, and a
 * file would be one more request, one more thing to cache, and one
 * more thing to go missing in a deploy. Quiet on purpose - this is a
 * coach clearing his throat, not a phone demanding to be answered.
 */
export function chime(): void {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    // A browser that has had no gesture yet will hand back a suspended
    // context. Rather than nag it awake, the ring stays silent and the
    // button carries the message on its own.
    if (ctx.state !== "running") {
      void ctx.close();
      return;
    }
    const now = ctx.currentTime;
    // A fifth: two notes that sit together rather than resolving, so it
    // reads as an opening rather than an ending.
    [[880, 0], [1318.5, 0.14]].forEach(([hz, at]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = hz;
      gain.gain.setValueAtTime(0.0001, now + at);
      gain.gain.exponentialRampToValueAtTime(0.09, now + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.9);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + at);
      osc.stop(now + at + 0.95);
    });
    window.setTimeout(() => void ctx.close(), 1400);
  } catch {
    // Sound is the smallest part of this. The button still rings.
  }
}
