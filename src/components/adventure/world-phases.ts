import { storyPhases } from "@/data/challenges";
import type { WorldPhase } from "./adventure-world";

// The five phases as the world draws them. three.js cannot read the
// app's CSS variables, so the phase colours are spelled out here - the
// same values as --color-* in globals.css.
const HEX: Record<string, string> = {
  mindset: "#1fe890",
  "body-language": "#22d9f5",
  storytelling: "#ffd60a",
  acting: "#ff4a2b",
  structure: "#f53de0",
};

export const worldPhases: WorldPhase[] = storyPhases.map((p) => ({
  id: p.id,
  name: p.name,
  color: HEX[p.bgClass.replace("bg-", "")] ?? "#ffffff",
}));

/** The sky over the road: a 360 panorama - the Milky Way along the
 *  horizon, a ringed planet and its moon - mapped on a dome (sky-dome.tsx:
 *  -l / -r halves on a laptop, -m on a phone). A base path, not a file. */
export const ROAD_SKY = "/sky/road-a";
