import { ALL_TROPHIES, COHORT } from "../../scripts/trophy-prompts.mjs";

// What each trophy is made of, for the screens that show them.
//
// The prompts that rendered the set are the one record of which
// material and colour every trophy came out in, so this reads them
// rather than keeping a second table here that could drift from the
// renders. The script is a plain module with nothing Node-only in it,
// so the same file works on the server, in the browser, and when the
// build script runs it; what it costs a client bundle is the prompt
// text, a few kilobytes.

export type Material =
  | "legendary"
  | "obsidian"
  | "spectrum"
  | "gold"
  | "enamel"
  | "chrome"
  | "ceramic"
  | "painted"
  | "bronze";

export interface TrophyMeta {
  /** The skill colour it was rendered in - a --color-* name. */
  color: string;
  material: Material;
  /** The finishing trophy, drawn larger than the rest. */
  grand: boolean;
  /** Won in one round only - the founding cohort's. */
  onceOnly: boolean;
}

/** Highest first - the order a case is read in. The one Legendary
 *  trophy leads, then the founding cohort's bronze, because it is the
 *  one nobody can go back for. */
export const MATERIALS: { key: Material; label: string; note: string }[] = [
  { key: "legendary", label: "Legendary", note: "One trophy. Everything in Speak Better, done." },
  { key: "bronze", label: "Bronze", note: "Once only - the founding cohort's, never offered again." },
  { key: "obsidian", label: "Obsidian", note: "The rare ones, and the whole road at the end of it." },
  { key: "spectrum", label: "Spectrum glass", note: "Finishing a phase of the road - all seven colours at once." },
  { key: "gold", label: "Gold", note: "A top score: 90 or more on a challenge." },
  { key: "enamel", label: "Library", note: "Every lesson in one skill watched - one for each colour." },
  { key: "chrome", label: "Chrome", note: "Turning up again and again." },
  { key: "ceramic", label: "Ceramic", note: "How you speak, and how you feel doing it." },
  { key: "painted", label: "Painted", note: "The challenges, each the real thing in full colour." },
];

type Row = { id: string; color: string; material?: string; grand?: boolean };

const once = new Set((COHORT as Row[]).map((t) => t.id));

const table = new Map<string, TrophyMeta>(
  (ALL_TROPHIES as Row[]).map((t) => [
    t.id,
    {
      color: t.color,
      material: (t.material ?? "painted") as Material,
      grand: !!t.grand,
      onceOnly: once.has(t.id),
    },
  ]),
);

/** A trophy's material and colour, or undefined for an id the renders
 *  do not cover (which would be a badge added without its trophy). */
export function trophyMeta(id: string): TrophyMeta | undefined {
  return table.get(id);
}
