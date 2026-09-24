// Speaks Coach's welcome once, into the file the app ships.
//
//   node scripts/build-welcome.mjs
//
// Needs the dev server on :3001 (it holds the Gemini key and the
// coach's settled voice - Charon, British, at his pace) and ffmpeg on
// PATH to turn the WAV it returns into an mp3 a tenth the size.
//
// The line lives in src/data/welcome-speech.ts, so there is one copy
// of it and the app and the clip cannot drift apart.

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, statSync } from "node:fs";

const BASE = process.env.SPEAK_BASE ?? "http://localhost:3001";
const TMP = ".welcome-tmp";

/** Pull the string literal out of the data file without a regex full
 *  of escapes - find the marker, then read to the closing quote. */
function speechFrom(src, name, marker) {
  // `name` is either an exported constant or, for the phases, the line
  // that identifies which entry of an array is wanted; `marker` then
  // says which field inside it to read.
  let at = src.indexOf(name.startsWith("id:") ? name : `export const ${name}`);
  if (at < 0) return null;
  if (marker) {
    at = src.indexOf(marker, at);
    if (at < 0) return null;
  }
  const open = src.indexOf('"', at);
  if (open < 0) return null;
  let out = "";
  for (let i = open + 1; i < src.length; i++) {
    const c = src[i];
    if (c === "\\") {
      out += src[i + 1];
      i += 1;
      continue;
    }
    if (c === '"') return out;
    out += c;
  }
  return null;
}

const src = readFileSync("src/data/welcome-speech.ts", "utf8");
const phases = readFileSync("src/data/challenges.ts", "utf8");

// Every fixed line Coach speaks outside the tour: the two the
// onboarding asks, and the five that introduce a phase of the road.
// Made together and failing together, which is the honest coupling -
// a welcome with only half a voice is worse than one with none.
const JOBS = [
  { name: "WELCOME_SPEECH", out: "welcome", from: src },
  { name: "INTENTION_SPEECH", out: "intention", from: src },
  { name: "LANDING_PITCH", out: "landing-pitch", from: src },
  { name: "HEADLINE_SPOKEN", out: "headline", from: src },
  ...["S", "T", "O", "R", "Y"].map((id) => ({
    // The phases live in one array, so the marker is the phase's id
    // line and the line wanted is the `says:` after it.
    name: `id: "${id}",`,
    marker: "says:",
    out: `phase-${id.toLowerCase()}`,
    from: phases,
  })),
];

// One line changed, one line re-spoken:
//
//   node scripts/build-welcome.mjs headline
//
// The nine are made together the FIRST time, because a welcome with
// half a voice is worse than one with none. But re-rendering all nine
// because one sentence was reworded spends a daily quota that has run
// out on this project before, and leaves eight identical files with
// new timestamps. Named clips only re-speak what was named.
const only = process.argv.slice(2);
const todo = only.length ? JOBS.filter((j) => only.includes(j.out)) : JOBS;
if (only.length && todo.length !== only.length) {
  const known = JOBS.map((j) => j.out).join(", ");
  console.error(`No such clip: ${only.filter((o) => !JOBS.some((j) => j.out === o)).join(", ")}
Known: ${known}`);
  process.exit(1);
}

mkdirSync(TMP, { recursive: true });
mkdirSync("public/coach", { recursive: true });

for (const job of todo) {
  const line = speechFrom(job.from, job.name, job.marker);
  if (!line) {
    console.error(`Could not find ${job.name} in src/data/welcome-speech.ts`);
    process.exit(1);
  }
  console.log(`${job.out}: speaking ${line.length} characters…`);

  const res = await fetch(`${BASE}/api/speak`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: line }),
  });

  if (!res.ok) {
    const body = await res.text();
    // The quota is a DAILY one and says so plainly. Reporting it as
    // itself rather than as a mystery failure matters: working that
    // out the hard way cost real time once already on this project.
    if (res.status === 429 || /quota/i.test(body)) {
      console.error("voice quota spent - the daily text-to-speech limit. It resets at midnight Pacific.");
    } else {
      console.error(`speak failed: ${res.status} ${body.slice(0, 200)}`);
    }
    process.exit(1);
  }

  const wav = `${TMP}/${job.out}.wav`;
  writeFileSync(wav, Buffer.from(await res.arrayBuffer()));
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", wav, "-b:a", "96k", `public/coach/${job.out}.mp3`]);
  console.log(
    existsSync(`public/coach/${job.out}.mp3`)
      ? `  public/coach/${job.out}.mp3 (${Math.round(statSync(`public/coach/${job.out}.mp3`).size / 1024)}KB)`
      : "  nothing written",
  );
}

rmSync(TMP, { recursive: true, force: true });
