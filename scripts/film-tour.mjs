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

/** Seconds cut from the start of a film - the page loading, which is a
 *  black rectangle and then a world assembling itself. */
const TRIM = { road3d: 3, road2d: 3 };

/** Travel the 3D road forward with the scroll wheel, for `ms`. */
async function travelRoad(p, ms) {
  await p.mouse.move(195, 520);
  const steps = Math.round(ms / 45);
  for (let i = 0; i < steps; i++) {
    await p.mouse.wheel(0, 90);
    await p.waitForTimeout(45);
  }
}

const FILMS = {
  // The S.T.O.R.Y. road in 3D: level with the challenge you are on, then
  // travelling on - past classmates and comments, through the colour
  // wall into the next section, its portals dormant ahead.
  async road3d(p) {
    // The road playing itself (prototype/road-film): down past the
    // challenges done to the open one, its portal glowing with Start
    // challenge - tapped - the dive - and the challenge beginning.
    await p.goto(`${BASE}/prototype/road-film`, { waitUntil: "load" });
    await p.waitForURL("**/challenges/**", { timeout: 40000 }).catch(() => {});
    await p.waitForTimeout(3000);
  },


  // The same road as a map, for anyone who would rather scroll a page.
  async road2d(p) {
    await p.goto(`${BASE}/prototype/adventure3d`, { waitUntil: "load" });
    await p.waitForTimeout(2500);
    await p.getByRole("radio", { name: "2D" }).click();
    await p.waitForTimeout(1500);
    const y = await p.evaluate(() => window.scrollY);
    await ease(p, y, y + 1800, 5000);
    await p.waitForTimeout(1000);
    await ease(p, y + 1800, y + 600, 2200);
    await p.waitForTimeout(800);
  },

  // The road, scrolled from the first stop down and back.
  async journey(p) {
    await p.goto(`${BASE}/demo/challenges?bare=1`, { waitUntil: "load" });
    await p.waitForTimeout(1800);
    const top = await p
      .locator("#journey-S")
      .evaluate((el) => el.getBoundingClientRect().top + window.scrollY - 120);
    await ease(p, 0, top, 1600);
    await p.waitForTimeout(1000);
    // How far to travel, as a share of the road rather than a fixed
    // 1500px.
    //
    // THIS MATTERS FOR THE NEW ROAD. The projected terrain gives each
    // checkpoint about two and a half screens of scroll, so a phase is
    // several times longer than the old map was - and a fixed 1500px
    // would film the first checkpoint arriving and then stop, which is
    // a tour of a journey that never goes anywhere. Travelling a share
    // of whatever the scene turns out to be survives the change.
    //
    // When the projected road replaces the live map, re-record this:
    //     node scripts/film-tour.mjs journey
    // and check the result actually shows a checkpoint approaching and
    // passing, because that is the whole thing the stop is describing.
    const h = await p.evaluate(() => document.body.scrollHeight);
    const far = Math.min(top + Math.max(1500, (h - top) * 0.55), h - 900);
    await ease(p, top, far, 6000);
    await p.waitForTimeout(1200);
    await ease(p, far, top, 2400);
    await p.waitForTimeout(700);
  },

  // A thumb round the dial, then into a color's lessons.
  async skills(p) {
    await p.goto(`${BASE}/demo/skills?bare=1`, { waitUntil: "load" });
    await p.waitForTimeout(1800);
    const dial = p.locator(".touch-pan-y.aspect-square").first();
    await dial.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await p.waitForTimeout(800);
    // These are the categories' `name` field, which changed when the
    // seven were given one short name each - and this recipe was not
    // updated with them, so every lookup missed and `continue` quietly
    // filmed a dial nobody touched. A film that records nothing
    // happening is the worst kind of broken: it ships.
    for (const n of ["Confidence", "Figurative & Sensory", "Storytelling"]) {
      const box = await p.getByLabel(`${n} - open lessons`).boundingBox();
      if (!box) {
        console.warn(`  ! no dial node for "${n}" - has the category name changed again?`);
        continue;
      }
      await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 18 });
      await p.waitForTimeout(1000);
    }
    const box = await p.getByLabel("Storytelling - open lessons").boundingBox();
    if (box) {
      await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await p.waitForURL("**/skills/storytelling**", { timeout: 15000 }).catch(() => {});
    }
    await p.waitForTimeout(1400);
    // The lesson plays right there on the colour's page: play it, let it
    // run, then zoom to portrait so the teacher fills the phone. (Vimeo
    // only plays on the site's own domain - film against production:
    // FILM_BASE=https://speakbetterlive.vercel.app.)
    await p.getByRole("button", { name: "Play", exact: true }).first().click({ timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(3500);
    await p.getByRole("button", { name: "Zoom to portrait" }).first().click({ timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(4500);
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

  // Today, scrolled: the day's one thing to do, then what is under it.
  async today(p) {
    await p.goto(`${BASE}/`, { waitUntil: "load" });
    await p.waitForTimeout(2200);
    const h = await p.evaluate(() => document.body.scrollHeight);
    await ease(p, 0, Math.min(900, h - 900), 4500);
    await p.waitForTimeout(1200);
    await ease(p, Math.min(900, h - 900), 0, 1800);
    await p.waitForTimeout(700);
  },

  // A challenge, opened: the brief, the warm-up lessons, the record bar.
  async challenge(p) {
    await p.goto(`${BASE}/challenges/speaking-baseline`, { waitUntil: "load" });
    await p.waitForTimeout(2400);
    const h = await p.evaluate(() => document.body.scrollHeight);
    await ease(p, 0, Math.min(1100, h - 900), 5200);
    await p.waitForTimeout(1400);
    await ease(p, Math.min(1100, h - 900), 300, 2000);
    await p.waitForTimeout(900);
  },

  // Coach's page: his face, the wave, the button pressed.
  async coach(p) {
    await p.goto(`${BASE}/coach`, { waitUntil: "load" });
    await p.waitForTimeout(3000);
    const ask = p.locator("[data-tour='ask']").first();
    const box = await ask.boundingBox().catch(() => null);
    if (box) {
      await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 16 });
      await p.waitForTimeout(1200);
    }
    const h = await p.evaluate(() => document.body.scrollHeight);
    await ease(p, 0, Math.min(500, Math.max(0, h - 900)), 1800);
    await p.waitForTimeout(1600);
    await ease(p, Math.min(500, Math.max(0, h - 900)), 0, 1200);
    await p.waitForTimeout(800);
  },

  // The community: the boards, then everybody's before and afters.
  async community(p) {
    await p.goto(`${BASE}/community`, { waitUntil: "load" });
    await p.waitForTimeout(2400);
    const h = await p.evaluate(() => document.body.scrollHeight);
    await ease(p, 0, Math.min(1300, h - 900), 6000);
    await p.waitForTimeout(1200);
    await ease(p, Math.min(1300, h - 900), 0, 2000);
    await p.waitForTimeout(700);
  },

  // The trophy case, walked.
  async trophies(p) {
    await p.goto(`${BASE}/profile`, { waitUntil: "load" });
    await p.waitForTimeout(2400);
    await p
      .locator("nav[aria-label='Dashboard sections'] button", { hasText: "Badges" })
      .click()
      .catch(() => {});
    await p.waitForTimeout(1400);
    const stage = p.locator("[data-tour='trophies']").first();
    await stage.scrollIntoViewIfNeeded().catch(() => {});
    await p.waitForTimeout(1200);
    for (let i = 0; i < 3; i++) {
      await p.getByLabel("Next trophy").click().catch(() => {});
      await p.waitForTimeout(1500);
    }
    await p.waitForTimeout(800);
  },

  // Jump: the palette opened and a name typed into it.
  async jump(p) {
    await p.goto(`${BASE}/`, { waitUntil: "load" });
    await p.waitForTimeout(2200);
    await p.locator("[data-tour='jump']").first().click().catch(() => {});
    await p.waitForTimeout(1200);
    for (const ch of "metaphor") {
      await p.keyboard.type(ch);
      await p.waitForTimeout(160);
    }
    await p.waitForTimeout(2600);
  },
};

async function film(name) {
  const dir = path.join(TMP, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  // The real graphics chip rather than the software renderer, which
  // draws the 3D road at a quarter of the frame rate.
  // Real Chrome: Playwright's own Chromium has no H.264, so the lesson
  // videos would never play in a film.
  const browser = await chromium.launch({
    channel: "chrome",
    args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"],
  });
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
      for (const k of ["challenges", "skills", "cards", "dashboard", "community", "coach"]) {
        window.localStorage.setItem(`speak-better-tour-${k}-v1`, "1");
      }
      // A student who has paid and has a little road behind them - the
      // real pages, not the gate and not an empty dashboard.
      const raw = window.localStorage.getItem("speak-better-state-v1");
      const st = raw ? JSON.parse(raw) : {};
      // Films start in 3D; the 2D one switches itself.
      window.localStorage.setItem("adventure-view", "3d");
      // Silent films: the road's sound off, so no "click to hear Coach"
      // chip - he still appears and his words still show.
      window.localStorage.setItem("road-sound", "off");
      window.localStorage.setItem("coach-welcome-back", new Date().toDateString());
      window.localStorage.setItem(
        "speak-better-state-v1",
        JSON.stringify({ ...st, unlocked: true, plan: "coached", level: "beginner", displayName: "Tariq" }),
      );
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

  const trim = String(TRIM[name] ?? 0);
  execFileSync("ffmpeg", ["-y", "-ss", trim, "-i", src, "-vf", "scale=390:844", "-c:v", "libx264", "-crf", "30", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", mp4], { stdio: "ignore" });
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
