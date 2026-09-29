"use client";

import { useEffect, useRef, useState } from "react";
import { AdventureScreen } from "./adventure-screen";
import { Adventure2D } from "./adventure-2d";
import { LevelPicker } from "@/components/level-picker";
import { ROAD_SKY } from "./world-phases";
import { FullScreenIcon, PILL_OFF, PILL_ON, useRoadChrome } from "./road-chrome";
import type { ViewMode, WorldPhase, WorldStop } from "./adventure-world";

// The adventure three ways - the student's choice, kept on the device:
//   2D  the flat map, for anybody who would rather scroll, or whose phone
//       would rather they did
//   3D  the calm road: the same land and colours, no loops or stunts,
//       seen from high above like a map come to life
//   4D  the full ride - speed, loops, the corkscrew, the skyways
// 4D is the default.

type Mode = ViewMode;

/** One view on screen. While switching there are two: the one being left,
 *  underneath, its camera heading for the new view's place, and the new
 *  one fading in over it, its camera arriving from the old one's - so one
 *  seems to turn into the other. Then the old one goes, to save battery. */
interface Layer {
  id: number;
  mode: Mode;
  arrive: Mode | null;
  leaveTo: Mode | null;
  /** Where on the journey to open (the view before's place). */
  start: number | null;
}
const MODES: { id: Mode; label: string; name: string }[] = [
  { id: "2d", label: "2D", name: "Flat map" },
  { id: "3d", label: "3D", name: "Calm road, from above" },
  { id: "4d", label: "4D", name: "Full ride" },
];
// (A new key: under the old one, "3d" meant the full ride.)
const KEY = "adventure-view-3";
const OLD_KEY = "adventure-view";

export function AdventureView({
  stops,
  phases,
  fallbackAvatar,
  skyImage = ROAD_SKY,
  heightClass,
  stickyTop = "top-16",
}: {
  stops: WorldStop[];
  phases: WorldPhase[];
  fallbackAvatar?: string;
  /** A painted sky for the 3D road (see SkyDome); null for stars alone. */
  skyImage?: string | null;
  heightClass?: string;
  /** Where the 3D/2D switch sticks - under the page header, or at the top
   *  of a box the road scrolls inside. */
  stickyTop?: string;
}) {
  const [layers, setLayers] = useState<Layer[]>([{ id: 0, mode: "4d", arrive: null, leaveTo: null, start: null }]);
  const mode = layers[layers.length - 1].mode;
  // Where the traveller is, in challenges, as the 3D and 4D views report it.
  const progress = useRef<number | null>(null);
  const nextId = useRef(1);
  const setMode = (m: Mode) => setLayers([{ id: nextId.current++, mode: m, arrive: null, leaveTo: null, start: null }]);
  const done = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(done.current), []);
  const chrome = useRoadChrome();
  useEffect(() => {
    try {
      // After mounting, so the server's render and the first client
      // render agree.
      const saved = localStorage.getItem(KEY) ?? (localStorage.getItem(OLD_KEY) === "2d" ? "2d" : null);
      if (saved === "2d" || saved === "3d") setMode(saved);
    } catch {
      // no storage: 4D
    }
  }, []);
  const choose = (m: Mode) => {
    if (m === mode) return;
    const calmer = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = layers[layers.length - 1];
    const next: Layer = { id: nextId.current++, mode: m, arrive: calmer ? null : from.mode, leaveTo: null, start: progress.current };
    setLayers([{ ...from, leaveTo: calmer ? null : m }, next]);
    clearTimeout(done.current);
    done.current = setTimeout(() => setLayers((ls) => ls.filter((l) => l.id === next.id)), calmer ? 350 : 1700);
    try {
      localStorage.setItem(KEY, m);
    } catch {
      // fine
    }
  };

  return (
    <div className="relative">
      {/* The switch on the left; the level and full screen on the right,
          beside the road's own "?" - stuck to the top whichever view is
          showing. */}
      <div className={`sticky ${stickyTop} z-40 flex`}>
        <div
          className="absolute flex items-center gap-2"
          style={{ left: "max(0.75rem, env(safe-area-inset-left))", top: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <div
            role="radiogroup"
            aria-label="View"
            className="flex rounded-full border border-navy-600 bg-navy-950/80 p-1 text-xs font-bold backdrop-blur"
          >
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={mode === m.id}
                aria-label={`${m.label}: ${m.name}`}
                title={m.name}
                onClick={() => choose(m.id)}
                className={`rounded-full px-3 py-1.5 transition-colors ${mode === m.id ? PILL_ON : PILL_OFF}`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {/* Back to the Orientation tab - the road has no tab row above it. */}
          {chrome.toOrientation && (
            <button
              type="button"
              onClick={chrome.toOrientation}
              aria-label="Orientation"
              title="Orientation"
              className="grid size-9 place-items-center rounded-full border border-navy-600 bg-navy-950/80 text-ink-muted backdrop-blur hover:text-ink"
            >
              {/* A compass: the welcome and the intro videos. */}
              <svg viewBox="0 0 24 24" className="size-[1.1rem]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M15.5 8.5l-2 5-5 2 2-5z" />
              </svg>
            </button>
          )}
        </div>
        <div
          className="absolute flex items-center gap-2"
          style={{
            // Left of the road's "?" (or, in full screen, its sound switch);
            // on the flat map there is neither, so right to the edge.
            right: mode === "2d" ? "max(0.75rem, env(safe-area-inset-right))" : "calc(max(0.75rem, env(safe-area-inset-right)) + 2.75rem)",
            top: "max(0.75rem, env(safe-area-inset-top))",
          }}
        >
          {/* The level they are travelling it at, and where to change it -
              not in full screen, which keeps to the essentials. */}
          {!chrome.full && <LevelPicker align="right" />}
          {/* In and out of full screen - where the page offers it. */}
          {chrome.canFull && (
            <button
              type="button"
              onClick={() => chrome.setFull(!chrome.full)}
              aria-label={chrome.full ? "Exit full screen" : "Full screen"}
              className="grid size-9 place-items-center rounded-full border border-navy-600 bg-navy-950/80 text-ink-muted backdrop-blur hover:text-ink"
            >
              <FullScreenIcon full={chrome.full} />
            </button>
          )}
        </div>
      </div>
      {layers.map((l, i) => {
        const top = i === layers.length - 1;
        const switching = layers.length > 1;
        const body =
          l.mode === "2d" ? (
            <Map2D stops={stops} phases={phases} heightClass={heightClass} />
          ) : (
            <AdventureScreen
              calm={l.mode === "3d"}
              stops={stops}
              phases={phases}
              fallbackAvatar={fallbackAvatar}
              skyImage={skyImage ?? undefined}
              heightClass={heightClass}
              startProgress={l.start}
              onProgress={top ? (p) => (progress.current = p) : undefined}
              arrive={l.arrive}
              leaveTo={l.leaveTo}
            />
          );
        // (The same wrapper whether arriving or leaving, so the view
        // being left isn't rebuilt as it goes underneath.)
        return (
          <FadeIn
            key={l.id}
            on={top && switching}
            leaving={!top}
            // Into the map: once the camera has started to rise. Out of it:
            // straight away, as the camera comes down.
            delay={l.mode === "2d" && l.arrive ? 450 : 0}
            duration={l.arrive ? (l.mode === "2d" ? 800 : 650) : 300}
          >
            {body}
          </FadeIn>
        );
      })}
    </div>
  );
}

/** Fades its view in over the one being left, when switching. */
function FadeIn({
  on,
  leaving,
  delay,
  duration,
  children,
}: {
  on: boolean;
  /** The view being left: held underneath, out of the way, until it goes. */
  leaving: boolean;
  delay: number;
  duration: number;
  children: React.ReactNode;
}) {
  const [shown, setShown] = useState(!on);
  useEffect(() => {
    if (!on) return;
    // Two frames: mounted at nothing first, so the fade has somewhere to
    // start from.
    let b = 0;
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, [on]);
  return (
    <div
      aria-hidden={leaving || undefined}
      className={leaving ? "pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden" : "relative z-[1]"}
      style={on ? { opacity: shown ? 1 : 0, transition: `opacity ${duration}ms ease ${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/** The flat map, in a frame the height of the road's, scrolling inside it -
 *  so switching to and from it, the page stays where it is and one view
 *  fades straight into the other. */
function Map2D({
  stops,
  phases,
  heightClass,
}: {
  stops: WorldStop[];
  phases: WorldPhase[];
  heightClass?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  return (
    <div ref={frame} className={`${heightClass ?? "h-[calc(100dvh-4rem)]"} overflow-y-auto overscroll-contain bg-[#070c18] pt-14`}>
      <Adventure2D stops={stops} phases={phases} scrollRoot={frame} zoomed />
    </div>
  );
}
