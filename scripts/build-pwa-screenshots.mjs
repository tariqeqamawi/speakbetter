// The screenshots the install prompt shows.
//
// Chrome only offers the richer install dialog - the one with a preview
// of the app instead of a bare icon and a URL - when the manifest ships
// screenshots in both form factors. These are captured from the real
// production build rather than mocked up, so what a student is shown
// before installing is what they get after.
//
//   npm run build && PORT=3001 npx next start
//   PLAYWRIGHT=<path to a playwright install> node scripts/build-pwa-screenshots.mjs
//
// Playwright isn't a dependency of the app - it's only ever needed for
// this - so point PLAYWRIGHT at a folder that has it, or add it with
// `npm i -D playwright` and leave the variable off.

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const BASE = process.env.BASE_URL ?? "http://localhost:3001";
const OUT = path.join(process.cwd(), "public", "screenshots");

const source = process.env.PLAYWRIGHT
  ? pathToFileURL(path.join(process.env.PLAYWRIGHT, "playwright", "index.js")).href
  : "playwright";

let chromium;
try {
  // Loaded by path it comes through as CommonJS, so the namespace hides
  // one level down.
  const mod = await import(source);
  chromium = mod.chromium ?? mod.default?.chromium;
} catch {
  console.error(
    `playwright not found at ${source} - set PLAYWRIGHT to a node_modules folder that has it, or \`npm i -D playwright\`.`,
  );
  process.exit(1);
}

// Aspect ratios stay inside Chrome's 0.5-2.0 window, and every shot in a
// form factor is the same size - a set that disagrees is dropped whole.
const FORMS = [
  { form: "narrow", width: 412, height: 800, scale: 2 },
  { form: "wide", width: 1280, height: 800, scale: 1 },
];

const SHOTS = [
  { name: "today", url: "/", label: "Today: the next lesson, the streak, the day's XP" },
  { name: "skills", url: "/skills", label: "Seven sections of short lessons" },
  { name: "cards", url: "/skills/cards", label: "The deck: one card per lesson, sorted by color" },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

for (const { form, width, height, scale } of FORMS) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: scale,
    // The pages behind the access gate need a student in localStorage;
    // /try seeds the sample one and lands on Today.
    baseURL: BASE,
  });
  const page = await context.newPage();
  await page.goto("/try", { waitUntil: "networkidle" });

  for (const { name, url, label } of SHOTS) {
    await page.goto(url, { waitUntil: "networkidle" });
    // Let the entrance animations settle before the shutter.
    await page.waitForTimeout(1200);
    // Recompressed on the way out - Playwright writes a fast PNG, and
    // these ship in the repo and over the wire, so the slow one is worth
    // it (a third of the size, pixel for pixel identical).
    const shot = await page.screenshot();
    const file = path.join(OUT, `${name}-${form}.png`);
    await sharp(shot).png({ compressionLevel: 9, effort: 10 }).toFile(file);
    console.log(`screenshots/${name}-${form}.png  ${width * scale}x${height * scale}  ${label}`);
  }
  await context.close();
}

await browser.close();
