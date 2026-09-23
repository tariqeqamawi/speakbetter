// Speaks Coach's fixed greetings once, into files the app ships.
//
//   node scripts/build-greetings.mjs
//
// Needs the dev server on :3001 (it is what holds the Gemini key and
// the coach's settled voice - Charon, British, at his pace) and ffmpeg
// on PATH to turn the WAV it returns into an mp3 a tenth the size.
//
// Rerun it after adding a line to src/data/greetings.ts: the clips are
// numbered by position, so a line inserted in the middle renumbers
// everything after it.

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import path from "node:path";

const BASE = process.env.SPEAK_BASE ?? "http://localhost:3001";
const OUT = "public/coach";
const TMP = ".greet-tmp";

// Read the lines out of the data file rather than keeping a second
// copy here - one list, one order, one source of the numbering.
const src = await import(path.resolve("src/data/greetings.ts").replace(/\\/g, "/")).catch(() => null);
let GREETINGS;
if (src?.GREETINGS) {
  GREETINGS = src.GREETINGS;
} else {
  const text = await import("node:fs").then((fs) => fs.readFileSync("src/data/greetings.ts", "utf8"));
  const block = text.slice(text.indexOf("export const GREETINGS"), text.indexOf("];"));
  GREETINGS = [...block.matchAll(/^\s*"((?:[^"\\]|\\.)*)",$/gm)].map((m) => m[1].replace(/\\"/g, '"'));
}
if (!GREETINGS.length) throw new Error("no greetings found in src/data/greetings.ts");

mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

for (const [i, line] of GREETINGS.entries()) {
  const n = String(i + 1).padStart(2, "0");
  const mp3 = path.join(OUT, `greet-${n}.mp3`);
  if (existsSync(mp3) && !process.env.FORCE) {
    console.log("kept", mp3);
    continue;
  }
  const res = await fetch(`${BASE}/api/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: line }),
  });
  if (!res.ok) {
    console.error(`${n} failed: ${res.status} ${(await res.text()).slice(0, 160)}`);
    // The voice model rate-limits a run of calls; wait longer and the
    // next pass picks up whatever this one missed.
    await new Promise((r) => setTimeout(r, 8000));
    continue;
  }
  const wav = path.join(TMP, `greet-${n}.wav`);
  writeFileSync(wav, Buffer.from(await res.arrayBuffer()));
  execFileSync("ffmpeg", ["-y", "-i", wav, "-b:a", "64k", "-ac", "1", mp3], { stdio: "ignore" });
  console.log("wrote", mp3, "-", line);
  await new Promise((r) => setTimeout(r, 2500));
}

rmSync(TMP, { recursive: true, force: true });
