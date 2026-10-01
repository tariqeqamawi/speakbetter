// Records "record to review" - the film the tour plays for Coach's
// review: a take sent on the first challenge, Coach watching, the score
// and colours landing, the notes. A real take, a real review, filmed on
// the live site in a real browser at phone size; the wait while Coach
// watches is sped up so the film stays short.
//
//   node scripts/film-review.mjs <take.mp4>
//
// Needs ffmpeg on PATH; Playwright is borrowed from the scraper project
// next door. FILM_BASE (default https://speakbetter.app) is where it
// films - Vimeo only plays on the real domain.

import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

const require = createRequire("C:/Users/kashi/OneDrive/Desktop/Tariq Files/Vimeo Course Scraper/");
const { chromium } = require("playwright");

const BASE = process.env.FILM_BASE ?? "https://speakbetter.app";
const TAKE = process.argv[2];
if (!TAKE) throw new Error("usage: node scripts/film-review.mjs <take.mp4>");
const SIZE = { width: 390, height: 844 };
const TMP = ".film-review-tmp";

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=d3d11", "--enable-gpu", "--autoplay-policy=no-user-gesture-required"] });
const ctx = await browser.newContext({ viewport: SIZE, deviceScaleFactor: 2, recordVideo: { dir: TMP, size: SIZE } });
const t0 = Date.now();
const p = await ctx.newPage();
await p.addInitScript(() => {
  const st = document.createElement("style");
  st.textContent = "nextjs-portal{display:none!important}";
  document.addEventListener("DOMContentLoaded", () => document.head.appendChild(st));
  try {
    window.localStorage.setItem("speak-better-tour-v1", "1");
    for (const k of ["challenges", "skills", "cards", "dashboard", "community", "coach"]) window.localStorage.setItem(`speak-better-tour-${k}-v1`, "1");
    window.localStorage.setItem("road-sound", "off");
    const raw = window.localStorage.getItem("speak-better-state-v1");
    const s = raw ? JSON.parse(raw) : {};
    window.localStorage.setItem(
      "speak-better-state-v1",
      JSON.stringify({ ...s, unlocked: true, plan: "coached", level: "beginner", displayName: "Tariq", consentAt: s.consentAt ?? new Date().toISOString() }),
    );
  } catch {}
});

await p.goto(`${BASE}/challenges/speaking-baseline`, { waitUntil: "load" });
await p.waitForTimeout(2500);
// Down to the recorder.
const panel = p.locator("input[type=file]").last();
await panel.evaluate((el) => el.closest("section")?.scrollIntoView({ block: "start", behavior: "smooth" })).catch(() => {});
await p.waitForTimeout(1500);
// The take, as if chosen from the phone's library.
const sent = Date.now();
await panel.setInputFiles(TAKE);
// Coach watching - until the review lands (the score).
await p.getByText(/\/\s*100/).first().waitFor({ timeout: 240000 });
const landed = Date.now();
await p.waitForTimeout(2500);
// The review, read down.
for (let i = 0; i < 6; i++) {
  await p.mouse.wheel(0, 260);
  await p.waitForTimeout(1100);
}
await p.waitForTimeout(1200);
await ctx.close();
await browser.close();

const webm = readdirSync(TMP).find((f) => f.endsWith(".webm"));
const src = path.join(TMP, webm);
// Seconds into the recording: the take sent, the review landed. The wait
// between is sped up to three seconds whatever it took.
const a = (sent - t0) / 1000 - 0.3;
const b = (landed - t0) / 1000;
const wait = Math.max(0.1, b - a);
const k = Math.min(1, 3 / wait); // how much to squeeze the wait
const out = "public/film/record-to-review.mp4";
const filter = [
  `[0:v]trim=start=2.5:end=${a.toFixed(2)},setpts=PTS-STARTPTS[v1]`,
  `[0:v]trim=start=${a.toFixed(2)}:end=${b.toFixed(2)},setpts=(PTS-STARTPTS)*${k.toFixed(4)}[v2]`,
  `[0:v]trim=start=${b.toFixed(2)},setpts=PTS-STARTPTS[v3]`,
  `[v1][v2][v3]concat=n=3:v=1:a=0,scale=390:844[v]`,
].join(";");
execFileSync("ffmpeg", ["-y", "-i", src, "-filter_complex", filter, "-map", "[v]", "-c:v", "libx264", "-crf", "30", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", out], { stdio: "ignore" });
execFileSync("ffmpeg", ["-y", "-ss", "4", "-i", out, "-vframes", "1", "-q:v", "4", "public/film/record-to-review.jpg"], { stdio: "ignore" });
rmSync(TMP, { recursive: true, force: true });
console.log(`wrote ${out} - the wait was ${wait.toFixed(1)}s, squeezed to ${(wait * k).toFixed(1)}s`);
