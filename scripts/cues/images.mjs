// Concepts an image says better than words.
//
// Most cues should stay words: the lesson is a speaking course and the
// words are the teaching. But some of what the teacher reaches for is
// pure picture - a wild roller coaster of emotion, a mountain you climb,
// a spotlight you stand in - and for those, a drawing lands in less time
// than reading takes.
//
// An entry here is a promise about a file, not the file itself. The
// engine calls `imageFor` while building, and a concept whose artwork
// hasn't been drawn yet quietly falls back to an icon or to the words -
// so the table can be filled in ahead of the art, and each image starts
// appearing in the course the moment it lands in public/cues/.
//
// Art direction, so a set drawn over time still looks like one set:
// single ink color on transparent, the same weight of line as the
// interface icons, no lettering, no gradient, no frame. They sit over
// video and must read at a glance, at a small size, in the margin beside
// a person.

import { existsSync } from "node:fs";
import { join } from "node:path";

/** phrase (as the engine sees it, lowercased) -> file slug in public/cues */
export const IMAGES = {
  "roller coaster": "roller-coaster",
  "standing ovation": "standing-ovation",
  "emotional journey": "emotional-journey",
  "leap of faith": "leap-of-faith",
  spotlight: "spotlight",
  mountain: "mountain",
  obstacle: "mountain",
  storm: "storm",
  ocean: "ocean",
  mirror: "mirror",
  bridge: "bridge",
  door: "door",
  compass: "compass",
  lighthouse: "lighthouse",
};

const cache = new Map();

/**
 * The image this phrase should show, if one has been drawn for it.
 * Returns the public path the player loads, or null.
 */
export function imageFor(phrase, root) {
  const slug = IMAGES[phrase];
  if (!slug) return null;
  if (!cache.has(slug))
    cache.set(slug, existsSync(join(root, "public/cues", slug + ".png")));
  return cache.get(slug) ? "/cues/" + slug + ".png" : null;
}
