// Records the short films the landing page plays in place of live app
// screens: the road three ways, a lesson, and the deck. The real app,
// in a real browser on the real graphics chip, at phone size - silent,
// a few seconds each, light to load.
//
//   node scripts/film-landing.mjs          # all of them
//   node scripts/film-landing.mjs road4d   # just one
//
// Needs the dev server on :3001 and ffmpeg on PATH; Playwright is
// borrowed from the scraper project next door (as film-tour.mjs does).

import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

const require = createRequire("C:/Users/kashi/OneDrive/Desktop/Tariq Files/Vimeo Course Scraper/");
const { chromium } = require("playwright");

const BASE = process.env.FILM_BASE ?? "http://localhost:3001";
const OUT = "public/film";
const TMP = ".film-landing-tmp";
const SIZE = { width: 390, height: 844 };
const only = process.argv[2];

/** Seconds cut from the start - the page loading. */
const TRIM = { road2d: 2.5, road3d: 5.5, road4d: 6, lesson: 2.5, deck: 2 };

const FILMS = {
  // The map: scrolled up the road from the current challenge.
  async road2d(p) {
    await p.goto(`${BASE}/demo/challenges?bare=1&view=challenges`, { waitUntil: "load" });
    await p.waitForTimeout(3000);
    for (let i = 0; i < 70; i++) {
      await p.mouse.wheel(0, -28);
      await p.waitForTimeout(60);
    }
    await p.waitForTimeout(1200);
  },
  // 3D: the calm view from above, gliding on to the next challenge.
  async road3d(p) {
    await p.goto(`${BASE}/prototype/view-shot?mode=3d`, { waitUntil: "load" });
    // (The world takes a few seconds to build; TRIM cuts that off.)
    await p.waitForTimeout(13000);
  },
  // 4D: flat out through the city of colour and down the ring tunnel.
  async road4d(p) {
    await p.goto(`${BASE}/prototype/view-shot?mode=4d`, { waitUntil: "load" });
    await p.waitForTimeout(18000);
  },
  // A lesson: the video big, then the tabs - This lesson, All lessons.
  async lesson(p) {
    await p.goto(`${BASE}/demo/skills/figurative?bare=1`, { waitUntil: "load" });
    await p.waitForTimeout(2500);
    await p.mouse.move(195, 600);
    for (let i = 0; i < 20; i++) {
      await p.mouse.wheel(0, 22);
      await p.waitForTimeout(50);
    }
    await p.waitForTimeout(1200);
    await p.getByRole("tab", { name: "All lessons" }).click().catch(() => {});
    await p.waitForTimeout(1800);
    for (let i = 0; i < 24; i++) {
      await p.mouse.wheel(0, 24);
      await p.waitForTimeout(50);
    }
    await p.waitForTimeout(1500);
  },
  // The deck: swiping the fan, then a full spread dealt.
  async deck(p) {
    await p.goto(`${BASE}/demo/skills/cards?bare=1`, { waitUntil: "load" });
    await p.waitForTimeout(2500);
    const swipe = async (dx) => {
      await p.mouse.move(195, 380);
      await p.mouse.down();
      for (let i = 1; i <= 12; i++) {
        await p.mouse.move(195 + (dx * i) / 12, 380);
        await p.waitForTimeout(25);
      }
      await p.mouse.up();
      await p.waitForTimeout(500);
    };
    await swipe(-150);
    await swipe(-150);
    await swipe(120);
    await p.waitForTimeout(600);
    await p.getByRole("button", { name: /Full spread/ }).click().catch(() => {});
    await p.waitForTimeout(1800);
    await swipe(-150);
    await swipe(-150);
    await p.waitForTimeout(1200);
  },
};

async function film(name) {
  const dir = path.join(TMP, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({
    channel: "chrome",
    args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"],
  });
  const ctx = await browser.newContext({ viewport: SIZE, deviceScaleFactor: 2, recordVideo: { dir, size: SIZE } });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    const st = document.createElement("style");
    st.textContent = "nextjs-portal{display:none!important}";
    document.addEventListener("DOMContentLoaded", () => document.head.appendChild(st));
    try {
      // No tour offers, no first-visit notes, silent road.
      window.localStorage.setItem("speak-better-tour-v1", "1");
      for (const k of ["challenges", "skills", "cards", "dashboard", "community", "coach"]) window.localStorage.setItem(`speak-better-tour-${k}-v1`, "1");
      window.localStorage.setItem("adventure-unlock-intro", "1");
      window.localStorage.setItem("road-sound", "off");
      window.localStorage.setItem("sb-skills-view", "grid");
    } catch {}
  });
  await FILMS[name](p);
  await ctx.close();
  await browser.close();
  const webm = readdirSync(dir).find((f) => f.endsWith(".webm"));
  if (!webm) throw new Error(`no recording for ${name}`);
  const mp4 = path.join(OUT, `landing-${name}.mp4`);
  const jpg = path.join(OUT, `landing-${name}.jpg`);
  execFileSync("ffmpeg", ["-y", "-ss", String(TRIM[name] ?? 0), "-i", path.join(dir, webm), "-vf", "scale=390:844", "-c:v", "libx264", "-crf", "30", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", mp4], { stdio: "ignore" });
  execFileSync("ffmpeg", ["-y", "-ss", "2", "-i", mp4, "-vframes", "1", "-q:v", "4", jpg], { stdio: "ignore" });
  rmSync(dir, { recursive: true, force: true });
  console.log("wrote", mp4);
}

for (const name of Object.keys(FILMS)) {
  if (only && only !== name) continue;
  await film(name);
}
rmSync(TMP, { recursive: true, force: true });
