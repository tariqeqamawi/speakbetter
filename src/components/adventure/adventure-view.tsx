"use client";

import { useEffect, useState } from "react";
import { AdventureScreen } from "./adventure-screen";
import { Adventure2D } from "./adventure-2d";
import { LevelPicker } from "@/components/level-picker";
import { ROAD_SKY } from "./world-phases";
import { FullScreenIcon, PILL_OFF, PILL_ON, useRoadChrome } from "./road-chrome";
import type { WorldPhase, WorldStop } from "./adventure-world";

// The adventure, as a world or as a page - the student's choice, kept on
// the device. The 3D road is the default; the flat map is for anybody
// who would rather scroll, or whose phone would rather they did.

type Mode = "3d" | "2d";
const KEY = "adventure-view";

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
  const [mode, setMode] = useState<Mode>("3d");
  const chrome = useRoadChrome();
  useEffect(() => {
    try {
      // After mounting, so the server's render and the first client
      // render agree.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(KEY) === "2d") setMode("2d");
    } catch {
      // no storage: 3D
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
      {/* The switch and the level, stuck to the top whichever view is showing. */}
      <div className={`sticky ${stickyTop} z-40 flex`}>
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <div
            role="radiogroup"
            aria-label="View"
            className="flex rounded-full border border-navy-600 bg-navy-950/80 p-1 text-xs font-bold backdrop-blur"
          >
            {(["3d", "2d"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => choose(m)}
                className={`rounded-full px-4 py-1.5 transition-colors ${mode === m ? PILL_ON : PILL_OFF}`}
              >
                {m === "3d" ? "3D" : "2D"}
              </button>
            ))}
          </div>
          {/* Back to the Orientation tab - the road has no tab row above it. */}
          {chrome.toOrientation && (
            <button
              type="button"
              onClick={chrome.toOrientation}
              className="rounded-full border border-navy-600 bg-navy-950/80 px-3 py-1.5 text-xs font-bold text-ink-muted backdrop-blur hover:text-ink"
            >
              Orientation
            </button>
          )}
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
          {/* The level they are travelling it at, and where to change it -
              not in full screen, which keeps to the essentials. */}
          {!chrome.full && <LevelPicker />}
        </div>
      </div>
      {mode === "3d" ? (
        <AdventureScreen
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
