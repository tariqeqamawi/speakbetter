// Turn a folder of trophy renders into the assets the app ships.
//
//   node scripts/build-trophies.mjs <folder-of-pngs>
//
// Each <id>.png in the folder becomes public/trophy/<id>.webp (242px
// wide, the size the case draws them) and <id>-2x.webp (484px, for the
// product-style zoom). Needs ffmpeg on PATH.
//
// CUTTING THE ALPHA LOCALLY, rather than through a background-removal
// API. That route was rate-limited the first time it was tried, and
// doing it here turns out to be better anyway: free, instant,
// repeatable, and - because every trophy is shot on pure black by
// construction (see trophy-prompts.mjs) - more accurate than a model
// guessing at a subject boundary.
//
// The alpha is the luma with its blacks crushed by a curve. That does
// two things at once: the black field goes fully transparent, and the
// glow around a glass edge fades out on its own instead of being
// clipped at a hard line. A hard cut on a glowing object is the tell
// that something was cut out; this has no tell.
//
// The curve is deliberately gentle above the crush point. Pull it any
// harder and the darker glass - the crimson and the deep blues - loses
// its body and the trophy reads as an outline.
//
// WEBP RATHER THAN PNG. Identical on screen, about 30KB against 150KB.
// Across forty-seven trophies that is the difference between a six
// megabyte set and a one megabyte one, on a phone, on a page a student
// opens every day.

import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const src = process.argv[2];
if (!src) {
  console.error("usage: node scripts/build-trophies.mjs <folder-of-pngs>");
  process.exit(1);
}

const OUT = "public/trophy";
mkdirSync(OUT, { recursive: true });

// Black to nothing, then a fast ramp, then linear. See above for why
// the top of the curve is left alone.
const ALPHA = "curves=all='0/0 0.05/0 0.22/0.82 1/1'";

const pngs = readdirSync(src).filter((f) => f.endsWith(".png"));
if (pngs.length === 0) {
  console.error(`no .png files in ${src}`);
  process.exit(1);
}

let made = 0;
for (const file of pngs.sort()) {
  const id = file.replace(/\.png$/, "");
  for (const [suffix, width] of [["", 242], ["-2x", 484]]) {
    const out = join(OUT, `${id}${suffix}.webp`);
    execFileSync("ffmpeg", [
      "-v", "error", "-y",
      "-i", join(src, file),
      "-filter_complex",
      // One frame, two uses: the colour, and a crushed copy of its own
      // luma as the alpha channel.
      `[0:v]scale=${width}:-1:flags=lanczos,format=rgba,split[c][l];` +
        `[l]format=gray,${ALPHA}[a];[c][a]alphamerge`,
      "-quality", "88",
      out,
    ]);
    made += 1;
  }
  const size = Math.round(statSync(join(OUT, `${id}.webp`)).size / 1024);
  console.log(`  ${id}  ${size}KB`);
}
console.log(`${made} files written to ${OUT}/`);
