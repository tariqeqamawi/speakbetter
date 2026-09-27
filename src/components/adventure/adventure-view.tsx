"use client";

import { useEffect, useState } from "react";
import { AdventureScreen } from "./adventure-screen";
import { Adventure2D } from "./adventure-2d";
import { LevelPicker } from "@/components/level-picker";
import { ROAD_SKY } from "./world-phases";
import { FullScreenIcon, PILL_OFF, PILL_ON, useRoadChrome } from "./road-chrome";
import type { WorldPhase, WorldStop } from "./adventure-world";

// The adventure three ways - the student's choice, kept on the device:
//   2D  the flat map, for anybody who would rather scroll, or whose phone
//       would rather they did
//   3D  the calm road: the same land and colours, no loops or stunts,
//       seen from high above like a map come to life
//   4D  the full ride - speed, loops, the corkscrew, the skyways
// 4D is the default.

type Mode = "2d" | "3d" | "4d";
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
  const [mode, setMode] = useState<Mode>("4d");
  const chrome = useRoadChrome();
  useEffect(() => {
    try {
      // After mounting, so the server's render and the first client
      // render agree.
      const saved = localStorage.getItem(KEY) ?? (localStorage.getItem(OLD_KEY) === "2d" ? "2d" : null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "2d" || saved === "3d") setMode(saved);
    } catch {
      // no storage: 4D
    }
  }, []);
  const choose = (m: Mode) => {
    setMode(m);
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
      {mode !== "2d" ? (
        <AdventureScreen
          key={mode}
          calm={mode === "3d"}
          stops={stops}
          phases={phases}
          fallbackAvatar={fallbackAvatar}
          skyImage={skyImage ?? undefined}
          heightClass={heightClass}
        />
      ) : (
        <div className="pt-14">
          <Adventure2D stops={stops} phases={phases} />
        </div>
      )}
    </div>
  );
}
