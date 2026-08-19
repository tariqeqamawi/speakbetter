// Home-screen shortcut icons.
//
// A long-press on the installed app offers four destinations, and each
// one needs a raster icon - Android won't take the SVGs the interface
// uses. So the same glyphs from src/components/icons.tsx are redrawn
// here on the app icon's navy tile and rendered to PNG, which keeps the
// shortcut menu looking like the app rather than like four screenshots.
//
//   npm run build:pwa-icons
//
// Rerun it if a nav glyph changes shape. Colors are the spectrum ramp
// from public/icon.svg, one per destination, so the shortcut a student
// is reaching for is recognizable before the label is read.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT = path.join(process.cwd(), "public", "shortcuts");
const SIZE = 96;
const NAVY = "#070c1a";

/** Glyphs on the same 24×24 grid as the interface icons, stroke-only. */
const icons = [
  {
    name: "challenges",
    color: "#ff4a2b",
    body: `<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.75"/><circle cx="12" cy="12" r="1.15"/>`,
  },
  {
    name: "skills",
    color: "#22d9f5",
    body: `<path d="M12 3.25 3.5 7.5 12 11.75 20.5 7.5 12 3.25Z"/><path d="m3.5 12 8.5 4.25L20.5 12"/><path d="m3.5 16.5 8.5 4.25 8.5-4.25"/>`,
  },
  {
    name: "cards",
    color: "#f53de0",
    body: `<rect x="9" y="3.4" width="10.6" height="14.4" rx="2" transform="rotate(9 14.3 10.6)"/><rect x="4.4" y="5.6" width="10.6" height="14.4" rx="2"/>`,
  },
  {
    name: "dashboard",
    color: "#1fe890",
    body: `<circle cx="12" cy="8.25" r="3.75"/><path d="M4.75 20.25c.7-3.7 3.55-5.75 7.25-5.75s6.55 2.05 7.25 5.75"/>`,
  },
];

/** The 24-grid glyph, centered on the tile at half again its size. */
function tile({ color, body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="21" fill="${NAVY}"/>
  <g transform="translate(20 20) scale(2.3333)" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    ${body}
  </g>
</svg>
`;
}

await mkdir(OUT, { recursive: true });
for (const icon of icons) {
  const svg = tile(icon);
  await writeFile(path.join(OUT, `${icon.name}.svg`), svg);
  await sharp(Buffer.from(svg))
    .resize(SIZE, SIZE)
    .png()
    .toFile(path.join(OUT, `${icon.name}.png`));
  console.log(`shortcuts/${icon.name}.png`);
}
