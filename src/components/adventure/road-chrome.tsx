"use client";

import { createContext, useContext } from "react";

// Whether the road is being shown full screen, and how to go in and out -
// shared from the Challenges page's tabs (challenges-tabs.tsx) down to the
// controls on the road, so the road can hide everything but the essentials
// and offer the way back out. Outside that page there is no full screen:
// the default says so.

/** A pill that's chosen: glass with a glowing rim, the app's own look -
 *  not a slab of white. And one that isn't. */
export const PILL_ON =
  "border border-body-language/70 bg-navy-700/70 text-ink shadow-[0_0_12px_-2px_var(--color-body-language)] backdrop-blur";
export const PILL_OFF = "border border-transparent text-ink-muted hover:text-ink";

export interface RoadChrome {
  /** Full screen: only the exit, the 2D/3D switch and the dial show. */
  full: boolean;
  /** Offered only where full screen exists. */
  canFull: boolean;
  setFull: (full: boolean) => void;
  /** Back to the Orientation tab, from the road itself. */
  toOrientation?: () => void;
}

export const RoadChromeContext = createContext<RoadChrome>({ full: false, canFull: false, setFull: () => {} });

export const useRoadChrome = () => useContext(RoadChromeContext);

/** The icon for going in (arrows out to the corners) or out (a cross). */
export function FullScreenIcon({ full, className = "size-4" }: { full: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {full ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
    </svg>
  );
}
