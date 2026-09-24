// Turn a folder of trophy renders into the assets the app ships.
//
//   node scripts/build-trophies.mjs <folder-of-pngs>
//
// Each <id>.png in the folder becomes public/trophy/<id>.webp (300px
// wide, the size the case draws them) and <id>-2x.webp (600px, for the
// product-style zoom). Needs ffmpeg and ffprobe on PATH.
//
// THE ALPHA COMES FROM THE RENDER. The trophies are rendered with a
// transparent background (gpt_image_2_5, background: "transparent"),
// so the cut-out is the model's own and this script only resizes it.
//
// It used to cut the alpha here, from the render's brightness: every
// trophy was shot on pure black, and black became see-through. That
// deleted everything dark INSIDE the trophy along with the background -
// the obsidian figures read as clear glass, the gunmetal plinth went
// smoky, the deep red glass lost its body. A brightness key cannot tell
// a black stone from a black backdrop, and a trophy set has black stone
// in it on purpose. So a render without an alpha channel is now refused
// rather than guessed at. (A green-screen key was tried beside the
// model's transparency and came out the same, with spill to clean off
// the chrome; the model's own cut is one step and has none.)

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

const pngs = readdirSync(src).filter((f) => f.endsWith(".png"));
if (pngs.length === 0) {
  console.error(`no .png files in ${src}`);
  process.exit(1);
}

let made = 0;
for (const file of pngs.sort()) {
  const id = file.replace(/\.png$/, "");
  const fmt = execFileSync("ffprobe", [
    "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=pix_fmt", "-of", "csv=p=0", join(src, file),
  ]).toString().trim();
  if (!/a/.test(fmt.replace("pal8", ""))) {
    console.error(`  ${id}: no alpha channel (${fmt}) - render it with a transparent background`);
    process.exitCode = 1;
    continue;
  }
  for (const [suffix, width] of [["", 300], ["-2x", 600]]) {
    const out = join(OUT, `${id}${suffix}.webp`);
    execFileSync("ffmpeg", [
      "-v", "error", "-y",
      "-i", join(src, file),
      "-vf", `scale=${width}:-1:flags=lanczos,format=rgba`,
      "-quality", "88",
      out,
    ]);
    made += 1;
  }
  const size = Math.round(statSync(join(OUT, `${id}.webp`)).size / 1024);
  console.log(`  ${id}  ${size}KB`);
}
console.log(`${made} files written to ${OUT}/`);
