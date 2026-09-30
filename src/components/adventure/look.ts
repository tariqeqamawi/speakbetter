// HOW DARK THE WORLD IS, against how bright its light. One table, so the
// levels can be compared side by side (?look=0..3 on the URL); the
// default is what ships.

export type Look = {
  /** The land's own surface, lit - 1 as it was, 0 black glass. */
  surface: number;
  /** The horizon's sheen on slopes seen at a glancing angle. */
  sheen: number;
  /** The faint colour washed round the grid's lines. */
  wash: number;
  /** How bright the lines of light themselves are. */
  gain: number;
  /** The far haze, and how far it leans to the section's colour. */
  haze: string;
  hazeTint: number;
  /** The road's surface, and how far it leans to the section's colour. */
  road: string;
  roadTint: number;
  /** The soft glow down the middle of the road. */
  mid: number;
  /** The scene's lights: sky fill, ambient, moon. */
  lights: [number, number, number];
  /** The bloom: how strong, and how bright a thing must be to glow. */
  bloom: number;
  threshold: number;
  /** How far the bloom spreads - wide, it hangs over everything as a mist. */
  spread: number;
};

export const LOOKS: Look[] = [
  // 0 - as it was this morning
  { surface: 1, sheen: 0.22, wash: 0.035, gain: 1, haze: "#040816", hazeTint: 0.2, road: "#101a33", roadTint: 0.12, mid: 0.7, lights: [2.2, 0.5, 1.4], bloom: 0.6, threshold: 0.78, spread: 0.25 },
  // 1 - darker
  { surface: 0.2, sheen: 0.035, wash: 0.01, gain: 1, haze: "#010206", hazeTint: 0.07, road: "#020409", roadTint: 0.04, mid: 0.5, lights: [1.1, 0.2, 0.9], bloom: 0.6, threshold: 0.78, spread: 0.25 },
  // 2 - Tron (live): black glass, brighter lines, the glow held close to them
  { surface: 0, sheen: 0, wash: 0, gain: 1.5, haze: "#000000", hazeTint: 0.03, road: "#000000", roadTint: 0.015, mid: 0.4, lights: [0.5, 0.05, 0.5], bloom: 0.45, threshold: 0.85, spread: 0.08 },
  // 3 - Tron, hard: pure black, lines at full blaze, only a tight glow
  { surface: 0, sheen: 0, wash: 0, gain: 2, haze: "#000000", hazeTint: 0, road: "#000000", roadTint: 0, mid: 0.3, lights: [0.25, 0, 0.3], bloom: 0.35, threshold: 0.92, spread: 0 },
];

const DEFAULT = 2;

function pick(): Look {
  if (typeof window === "undefined") return LOOKS[DEFAULT];
  const n = Number(new URLSearchParams(window.location.search).get("look"));
  return LOOKS[Number.isInteger(n) && n >= 0 && n < LOOKS.length && new URLSearchParams(window.location.search).has("look") ? n : DEFAULT];
}

export const LOOK = pick();
