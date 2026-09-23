// Speaks every line of every tour once, into files the app ships.
//
//   node scripts/build-tour-voice.mjs          # only what's missing
//   FORCE=1 node scripts/build-tour-voice.mjs  # all of them again
//
// Needs the dev server on :3001 (it holds the Gemini key and the
// coach's settled voice) and ffmpeg on PATH.
//
// A clip is named after its stop's id, so changing a line's WORDS means
// deleting that clip - the script only notices missing files, not
// edited text. Changing a stop's id renames its clip.

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";

const BASE = process.env.SPEAK_BASE ?? "http://localhost:3001";
const OUT = "public/coach/tour";
const TMP = ".tour-voice-tmp";

/** Every { id, body } in the script, in order, without a build step:
 *  the ids and the lines are plain string literals, and a regex over
 *  them is steadier here than a TypeScript loader. */
function stops() {
  const src = readFileSync("src/data/tour-script.ts", "utf8");
  const found = [];
  const re = /\bid:\s*"([a-z0-9-]+)"[\s\S]*?\bbody:\s*\n?\s*"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(src))) {
    found.push({ id: m[1], body: m[2].replace(/\\"/g, '"').replace(/\\n/g, " ") });
  }
  // Ids are unique, and a stop whose body was captured from the NEXT
  // stop would show up as a duplicate id - so this also catches drift.
  const seen = new Set();
  return found.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

const lines = stops();
if (!lines.length) throw new Error("no stops found in src/data/tour-script.ts");
console.log(`${lines.length} lines`);

mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

let made = 0;
let failed = [];
for (const { id, body } of lines) {
  const mp3 = path.join(OUT, `${id}.mp3`);
  if (existsSync(mp3) && !process.env.FORCE) continue;

  const res = await fetch(`${BASE}/api/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: body }),
  });
  if (!res.ok) {
    failed.push(id);
    console.error(`${id} failed: ${res.status}`);
    // The voice model rate-limits a run of calls; waiting longer lets
    // the next pass pick up whatever this one missed.
    await new Promise((r) => setTimeout(r, 8000));
    continue;
  }
  const wav = path.join(TMP, `${id}.wav`);
  writeFileSync(wav, Buffer.from(await res.arrayBuffer()));
  execFileSync("ffmpeg", ["-y", "-i", wav, "-b:a", "64k", "-ac", "1", mp3], { stdio: "ignore" });
  made++;
  console.log("wrote", mp3);
  await new Promise((r) => setTimeout(r, 2500));
}

rmSync(TMP, { recursive: true, force: true });
console.log(`made ${made}, still missing ${failed.length}${failed.length ? ": " + failed.join(" ") : ""}`);
