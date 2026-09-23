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
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";

const BASE = process.env.SPEAK_BASE ?? "http://localhost:3001";
const OUT = "public/coach";
const TMP = ".greet-tmp";

// Read the lines out of the data file rather than keeping a second
// copy here - one list, one order, one source of the numbering. Both
// lists are walked: the greetings he opens with, and the holding lines
// he says while the real answer is still being spoken.
function linesFrom(text, name, prefix) {
  const from = text.indexOf(`export const ${name}`);
  if (from < 0) return [];
  const block = text.slice(from, text.indexOf("];", from));
  return [...block.matchAll(/^\s*"((?:[^"\\]|\\.)*)",$/gm)].map((m, i) => ({
    line: m[1].replace(/\\"/g, '"'),
    name: `${prefix}-${String(i + 1).padStart(2, "0")}`,
  }));
}

const source = readFileSync("src/data/greetings.ts", "utf8");
const GREETINGS = [...linesFrom(source, "GREETINGS", "greet"), ...linesFrom(source, "HOLDS", "hold")];

if (!GREETINGS.length) throw new Error("no greetings found in src/data/greetings.ts");

mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

for (const { line, name: n } of GREETINGS) {
  const mp3 = path.join(OUT, `${n}.mp3`);
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
  const wav = path.join(TMP, `${n}.wav`);
  writeFileSync(wav, Buffer.from(await res.arrayBuffer()));
  execFileSync("ffmpeg", ["-y", "-i", wav, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-b:a", "64k", "-ac", "1", mp3], { stdio: "ignore" });
  console.log("wrote", mp3, "-", line);
  await new Promise((r) => setTimeout(r, 2500));
}

rmSync(TMP, { recursive: true, force: true });
