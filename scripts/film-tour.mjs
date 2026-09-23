// Records the short films the guided tour and the landing page play:
// the real app, driven by a real browser, at phone size.
//
//   node scripts/film-tour.mjs            # all of them
//   node scripts/film-tour.mjs journey    # just one
//
// Needs the dev server on :3001 and ffmpeg on PATH. Playwright is
// borrowed from the scraper project next door rather than added as a
// dependency of the app.
//
// Every film is silent, a few seconds long, and shows one thing being
// used - a thumb moving round the dial, the road scrolling past, the
// dashboard's tabs. The tour's own offer card is suppressed (the seen
// flag is set) so a film never shows the tour inside the tour, which
// is exactly what the first set of these did.

import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

const require = createRequire("C:/Users/kashi/OneDrive/Desktop/Tariq Files/Vimeo Course Scraper/");
const { chromium } = require("playwright");

const BASE = process.env.FILM_BASE ?? "http://localhost:3001";
const OUT = "public/film";
const TMP = ".film-tmp";
const SIZE = { width: 390, height: 844 };

const only = process.argv[2];

/** A scroll that eases, so the film doesn't look like a robot. */
async function ease(p, from, to, ms) {
  const steps = Math.max(8, Math.round(ms / 40));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    await p.evaluate((y) => window.scrollTo(0, y), from + (to - from) * e);
    await p.waitForTimeout(ms / steps);
  }
}

const FILMS = {
  // The road, scrolled from the first stop down and back.
  async journey(p) {
    await p.goto(`${BASE}/demo/challenges?bare=1`, { waitUntil: "load" });
    await p.waitForTimeout(1800);
    const top = await p
      .locator("#journey-S")
      .evaluate((el) => el.getBoundingClientRect().top + window.scrollY - 120);
    await ease(p, 0, top, 1600);
    await p.waitForTimeout(1000);
    const h = await p.evaluate(() => document.body.scrollHeight);
    await ease(p, top, Math.min(top + 1500, h - 900), 6000);
    await p.waitForTimeout(1200);
    await ease(p, Math.min(top + 1500, h - 900), top, 2400);
    await p.waitForTimeout(700);
  },

  // A thumb round the dial, then into a color's lessons.
  async skills(p) {
    await p.goto(`${BASE}/demo/skills?bare=1`, { waitUntil: "load" });
    await p.waitForTimeout(1800);
    const dial = p.locator(".touch-pan-y.aspect-square").first();
    await dial.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await p.waitForTimeout(800);
    for (const n of ["Confidence & Presence", "Figurative language", "Storytelling techniques"]) {
      const box = await p.getByLabel(`${n} - open lessons`).boundingBox();
      if (!box) continue;
      await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 18 });
      await p.waitForTimeout(1000);
    }
    const box = await p.getByLabel("Storytelling techniques - open lessons").boundingBox();
    if (box) {
      await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await p.waitForURL("**/skills/storytelling**", { timeout: 15000 }).catch(() => {});
    }
    await p.waitForTimeout(1600);
    const h = await p.evaluate(() => document.body.scrollHeight);
    await ease(p, 0, Math.min(1400, h - 900), 4500);
    await p.waitForTimeout(1000);
    await ease(p, Math.min(1400, h - 900), 0, 1400);
    await p.waitForTimeout(600);
  },

  // The dashboard, tab by tab.
  async dashboard(p) {
    await p.goto(`${BASE}/demo?bare=1`, { waitUntil: "load" });
    await p.waitForTimeout(1800);
    for (const tab of ["Challenges", "Lessons", "Spectrum", "Streak", "Badges"]) {
      await p
        .locator("nav[aria-label='Dashboard sections'] button", { hasText: tab })
        .click()
        .catch(() => {});
      await p.waitForTimeout(400);
      const h = await p.evaluate(() => document.body.scrollHeight);
      await ease(p, 0, Math.min(600, h - 900), 1700);
      await p.waitForTimeout(600);
      await ease(p, Math.min(600, h - 900), 0, 700);
    }
    await p.waitForTimeout(600);
  },

  // The deck: a color pressed, then a full spread dealt.
  async deck(p) {
    await p.goto(`${BASE}/demo/skills/cards?bare=1`, { waitUntil: "load" });
    await p.waitForTimeout(1800);
    const deck = p.locator("[data-tour='deck'], .touch-pan-y.aspect-square").first();
    await deck.evaluate((el) => el.scrollIntoView({ block: "center" })).catch(() => {});
    await p.waitForTimeout(700);
    // Press and hold a color, the way a thumb does.
    const card = p.locator("[data-tour='deck'] button, .touch-pan-y.aspect-square button").first();
    const box = await card.boundingBox();
    if (box) {
      await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 14 });
      await p.mouse.down();
      await p.waitForTimeout(1400);
      await p.mouse.up();
      await p.waitForTimeout(2200);
    }
    const spread = p.getByRole("button", { name: /Deal a full spread/i }).first();
    await spread.scrollIntoViewIfNeeded().catch(() => {});
    await spread.click().catch(() => {});
    await p.waitForTimeout(3000);
    const h = await p.evaluate(() => document.body.scrollHeight);
    await ease(p, 0, Math.min(700, h - 900), 2200);
    await p.waitForTimeout(1200);
  },
};

async function film(name) {
  const dir = path.join(TMP, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: SIZE,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    recordVideo: { dir, size: SIZE },
  });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    // Next's dev overlay, and the tour's own offer, are not part of
    // the app a student sees.
    const st = document.createElement("style");
    st.textContent = "nextjs-portal{display:none!important}";
    document.addEventListener("DOMContentLoaded", () => document.head.appendChild(st));
    try {
      window.localStorage.setItem("speak-better-tour-v1", "1");
    } catch {}
  });

  await FILMS[name](p);
  await ctx.close();
  await browser.close();

  const webm = readdirSync(dir).find((f) => f.endsWith(".webm"));
  if (!webm) throw new Error(`no recording for ${name}`);
  const src = path.join(dir, webm);
  const mp4 = path.join(OUT, `tour-${name}.mp4`);
  const jpg = path.join(OUT, `tour-${name}.jpg`);

  execFileSync("ffmpeg", ["-y", "-i", src, "-vf", "scale=390:844", "-c:v", "libx264", "-crf", "30", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", mp4], { stdio: "ignore" });
  // The poster comes from a third of the way in, not from frame one:
  // the first frame of a page that is still painting is a black
  // rectangle, which is exactly what a poster is there to avoid.
  execFileSync("ffmpeg", ["-y", "-ss", "2.5", "-i", mp4, "-vframes", "1", "-q:v", "4", jpg], { stdio: "ignore" });
  rmSync(dir, { recursive: true, force: true });
  console.log("wrote", mp4);
}

for (const name of Object.keys(FILMS)) {
  if (only && only !== name) continue;
  await film(name);
}
rmSync(TMP, { recursive: true, force: true });
