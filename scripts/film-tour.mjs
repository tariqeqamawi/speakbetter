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
const TRIM = { road3d: 3, road2d: 3, dashboard: 1.5 };

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
    // Open straight into the map: no 3D road loading first, and none of
    // the 3D road's roadside lines over the map.
    await p.addInitScript(() => {
      try { window.localStorage.setItem("adventure-view", "2d"); } catch {}
    });
    await p.goto(`${BASE}/prototype/adventure3d`, { waitUntil: "load" });
    await p.waitForTimeout(2500);
    await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    await p.getByRole("radio", { name: /^2D/ }).click({ force: true });
    await p.waitForTimeout(1800);
    // The map scrolls in its own panel (adventure-view.tsx), opening
    // zoomed in - a picture for each challenge and more road between.
    const panel = (y) =>
      p.evaluate((top) => {
        const el = [...document.querySelectorAll("div")].find((d) => d.scrollHeight > d.clientHeight + 200 && getComputedStyle(d).overflowY === "auto");
        if (el) el.scrollTop = top;
        else window.scrollTo(0, top);
      }, y);
    // It opens on the current challenge; the road ahead is above it.
    const here = await p.evaluate(() => {
      const el = [...document.querySelectorAll("div")].find((d) => d.scrollHeight > d.clientHeight + 200 && getComputedStyle(d).overflowY === "auto");
      return el ? el.scrollTop : window.scrollY;
    });
    for (const [from, to, ms] of [[here, here - 1300, 5000], [here - 1300, here - 500, 2200]]) {
      const steps = Math.round(ms / 40);
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        await panel(from + (to - from) * e);
        await p.waitForTimeout(ms / steps);
      }
      await p.waitForTimeout(900);
    }
  },

  // A thumb round the dial, then into a colour: the lesson big at the
  // top, the tabs under it (All lessons), then played and zoomed to
  // portrait.
  async skills(p) {
    await p.addInitScript(() => {
      try { window.localStorage.setItem("sb-skills-view", "dial"); } catch {}
    });
    await p.goto(`${BASE}/demo/skills?bare=1`, { waitUntil: "load" });
    await p.waitForTimeout(1800);
    const dial = p.locator(".touch-pan-y.aspect-square").first();
    await dial.evaluate((el) => el.scrollIntoView({ block: "center" })).catch(() => {});
    await p.waitForTimeout(800);
    // The dial's nodes are labelled by each colour's short name.
    for (const n of ["Presence", "Paint", "Tell"]) {
      const box = await p.getByLabel(`${n} - open lessons`).boundingBox();
      if (!box) {
        console.warn(`  ! no dial node for "${n}" - has the colour's name changed?`);
        continue;
      }
      await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 18 });
      await p.waitForTimeout(1000);
    }
    const box = await p.getByLabel("Tell - open lessons").boundingBox();
    if (box) {
      await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await p.waitForURL("**/skills/storytelling**", { timeout: 15000 }).catch(() => {});
    }
    await p.waitForTimeout(1600);
    // The tabs under the video: every lesson in the colour, as a stack.
    await p.getByRole("tab", { name: "All lessons" }).click().catch(() => {});
    await p.waitForTimeout(1200);
    await ease(p, 0, 420, 1600);
    await p.waitForTimeout(900);
    await ease(p, 420, 0, 900);
    await p.getByRole("tab", { name: "This lesson" }).click().catch(() => {});
    await p.waitForTimeout(600);
    // Play it, then zoom to portrait so the teacher fills the phone.
    // (Vimeo only plays on the site's own domain - film against
    // production for that part: FILM_BASE=https://speakbetter.app.)
    await p.getByRole("button", { name: "Play", exact: true }).first().click({ timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(3000);
    await p.getByRole("button", { name: "Zoom to portrait" }).first().click({ timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(4000);
  },

  // The dashboard, tab by tab.
  async dashboard(p) {
    // Quick snapshots of the dashboard, tab by tab: the spectrum, the
    // trophy case, the community, the challenges, the streak - a glance
    // at each, scrolled a little so it shows more than its heading.
    await p.goto(`${BASE}/demo?bare=1`, { waitUntil: "load" });
    await p.waitForTimeout(2200);
    for (const tab of ["Spectrum", "Trophies", "Community", "Challenges", "Streak"]) {
      await p.locator("nav[aria-label='Dashboard sections'] button", { hasText: tab }).click().catch(() => {});
      await p.waitForTimeout(700);
      const y = await p.evaluate(() => window.scrollY);
      const h = await p.evaluate(() => document.body.scrollHeight);
      const to = Math.min(y + 520, h - 844);
      await ease(p, y, to, 1500);
      await p.waitForTimeout(700);
      await ease(p, to, y, 600);
    }
    await p.waitForTimeout(500);
  },


  // The deck: a colour's fan swiped, then a full spread dealt from the
  // pill by Skills and Cards, swiped, and its lessons opened.
  async deck(p) {
    await p.goto(`${BASE}/demo/skills/cards?bare=1`, { waitUntil: "load" });
    await p.waitForTimeout(2000);
    const swipe = async (dx) => {
      await p.mouse.move(195, 380);
      await p.mouse.down();
      for (let i = 1; i <= 12; i++) {
        await p.mouse.move(195 + (dx * i) / 12, 380);
        await p.waitForTimeout(25);
      }
      await p.mouse.up();
      await p.waitForTimeout(550);
    };
    await swipe(-150);
    await swipe(-150);
    await p.waitForTimeout(500);
    await p.locator("[data-tour='spread']").first().click().catch(() => {});
    await p.waitForTimeout(1800);
    await swipe(-150);
    await swipe(-150);
    await p.getByRole("button", { name: /Your spread/ }).first().click().catch(() => {});
    await p.waitForTimeout(1000);
    await ease(p, 0, 520, 1800);
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
      window.localStorage.setItem("adventure-unlock-intro", "1");
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
        JSON.stringify({ ...st, unlocked: true, plan: "coached", level: "beginner", displayName: "Tariq", consentAt: st.consentAt ?? new Date().toISOString() }),
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
