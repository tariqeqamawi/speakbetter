// How long each lesson runs, in seconds.
//
// Vimeo never gave us a duration - the scrape captured ids, hashes and
// captions but not lengths - so this reads the end of each lesson's last
// transcript segment. Whisper transcribes to the end of the audio, so
// that lands within a second or two of the true running time, which is
// well inside the tolerance of anything it's used for: the XP a lesson
// is worth, and telling a student how long one takes.
//
// Kept out of transcripts.json (556 KB, server-only) so the app can know
// a lesson's length without shipping every word of the course.
//
// Run:    npm run build:lengths
// Output: src/data/lesson-lengths.json

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const transcripts = JSON.parse(
  readFileSync(join(ROOT, "src/data/transcripts.json"), "utf8"),
);

const lengths = {};
for (const entry of transcripts) {
  const end = entry.segments?.at(-1)?.end;
  if (end) lengths[entry.id] = Math.round(end);
}

writeFileSync(
  join(ROOT, "src/data/lesson-lengths.json"),
  JSON.stringify(lengths) + "\n",
);

const values = Object.values(lengths);
console.log(
  values.length +
    " lessons, " +
    Math.min(...values) +
    "-" +
    Math.max(...values) +
    "s, " +
    Math.round(values.reduce((a, b) => a + b, 0) / 60) +
    " minutes of course",
);
