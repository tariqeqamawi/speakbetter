import type { Metadata } from "next";
import Image from "next/image";

// The printed pieces, rendered for the tiers: the book and the card deck,
// every version made, at full size - for choosing and for asking changes.

export const metadata: Metadata = {
  title: "Printed pieces - preview",
  robots: { index: false, follow: false },
};

const PIECES = [
  {
    src: "/book/speak-better-book.webp",
    title: "The book",
    note: "Speak Better: Unleash Your True Colors and Roar on Screen and Stage. Re-rendered from the copy in \"How To Create Your Story Book - Step 2\". In use: VIP tier, \"The book\" tile.",
    w: 572,
    h: 900,
  },
  {
    src: "/deck/printed-deck-walnut.webp",
    title: "Card deck - walnut desk",
    note: "Alternative: warm, the deck fanned beside a lidded box.",
    w: 1600,
    h: 1062,
  },
  {
    src: "/deck/printed-deck-black.webp",
    title: "Card deck - black desk",
    note: "Alternative: moodier, glowing card edges, magnetic box.",
    w: 1600,
    h: 1062,
  },
  {
    src: "/deck/printed-deck-oak.webp",
    title: "Card deck - light oak desk",
    note: "In use: VIP tier, \"Deck: app + printed\" tile. Daylight, the deck standing in an open box.",
    w: 1600,
    h: 1062,
  },
  {
    src: "/social/speak-better-deck-9x16.jpg",
    title: "For socials - 9:16 (Stories, Reels, TikTok)",
    note: "The light oak desk, portrait. Full resolution, 1520 x 2688.",
    w: 1520,
    h: 2688,
  },
  {
    src: "/social/speak-better-deck-4x5.jpg",
    title: "For socials - 4:5 (Instagram and Facebook feed)",
    note: "The light oak desk, portrait. Full resolution, 1792 x 2240.",
    w: 1792,
    h: 2240,
  },
];

export default function PrintedPreview() {
  return (
    <div className="flex flex-col gap-10 py-10">
      <header className="flex max-w-3xl flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Preview</p>
        <h1 className="text-3xl font-semibold tracking-tight">The printed pieces</h1>
        <p className="text-sm text-ink-muted">
          The book and the card deck as rendered for the tiers. Tell me what to change - cover, title, colors, the
          desk, the box, which cards face up - and I&apos;ll re-render.
        </p>
      </header>
      {PIECES.map((p) => (
        <figure key={p.src} className="flex flex-col gap-3">
          <figcaption>
            <h2 className="text-xl font-semibold">{p.title}</h2>
            <p className="text-sm text-ink-muted">{p.note}</p>
          </figcaption>
          <div
            className={`overflow-hidden rounded-2xl border border-navy-600 bg-navy-950 ${
              p.h > p.w ? "mx-auto w-full max-w-md p-6" : "w-full"
            }`}
          >
            <Image src={p.src} alt={p.title} width={p.w} height={p.h} className="h-auto w-full" sizes="(min-width: 1024px) 1000px, 100vw" />
          </div>
          <a href={p.src} className="text-xs text-ink-faint underline underline-offset-2 hover:text-ink">
            Open the full-size image
          </a>
        </figure>
      ))}
    </div>
  );
}
