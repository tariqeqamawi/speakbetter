import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = { title: "Origin story styles", robots: { index: false, follow: false } };

// One moment of the origin story - Bali, 2011, a story told across a
// table - rendered in several looks, so the style for all of them can be
// chosen by comparing like with like.

const STYLES = [
  { key: "dream-a", name: "Dream memory A - blotchy, faces dissolved", note: "#1 pushed further: mottled chemical stains, smeared focus, neon aberration on every edge - shirts, hair, hands, stone." },
  { key: "dream-b", name: "Dream memory B - faded, scratched, ghosted", note: "Expired emulsion, dust and scratches, a soft double exposure; the neon fringing and halation run through the whole frame." },
  { key: "film-crossprocess", name: "Underdeveloped film - cross-processed neon", note: "Real photo, dark and grainy, magenta/cyan/gold halation bleeding from the lanterns, light leak on the edge." },
  { key: "film-halation", name: "Underdeveloped film - red halation", note: "Real photo, underexposed expired 35mm, warm red-orange halation round every light, crushed shadows." },
  { key: "film-aberration", name: "Underdeveloped film - chromatic split", note: "Real photo, RGB channels offset at the edges, multicolour glow on highlights, heavy grain." },
  { key: "neon-line", name: "Neon line illustration", note: "Drawn in glowing multicolour neon outlines on near-black navy." },
  { key: "ink", name: "Graphic-novel ink", note: "Bold brush linework, flat navy shadows, amber and teal." },
  { key: "oil", name: "Painterly oil", note: "Visible brushstrokes, candlelight against deep blue night." },
  { key: "watercolour", name: "Watercolour and gouache", note: "Soft washes, paper texture, storybook warmth." },
];

export default function OriginStylesPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Origin story - looks</h1>
        <p className="text-ink-muted">The same moment, Bali 2011, in each style. Pick one and every moment is made in it.</p>
      </header>
      <ol className="grid gap-8 md:grid-cols-2">
        {STYLES.map((s, i) => (
          <li key={s.key} className="flex flex-col gap-3">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-navy-600">
              <Image src={`/prototype/origin-styles/${s.key}.webp`} alt={s.name} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            </div>
            <div>
              <h2 className="font-semibold text-ink">
                {i + 1}. {s.name}
              </h2>
              <p className="text-sm text-ink-muted">{s.note}</p>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
