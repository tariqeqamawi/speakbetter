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
    src: "/book/speak-better-book-v3.webp",
    title: "The book - in the VIP tier now",
    note: "SPEAK BETTER / The 7 Colors of Fearless, Unforgettable Speaking / Find your true colors. Overcome your nerves. Roar on screen and stage. By Tariq EQ Amawi - TEDx Speaker, Slam Poetry Winner & Creator of the Mic Drop Method.",
    w: 764,
    h: 1200,
  },
  {
    src: "/book/cover-fearless-writer.webp",
    title: "The same, with \"Slam Poet & Award-Winning Writer\"",
    note: "The credential line as the alternative.",
    w: 754,
    h: 1200,
  },
  {
    src: "/book/cover-blend-mic-drop.webp",
    title: "The blend - \"Creator of the Mic Drop Method\"",
    note: "SPEAK BETTER / The 7 Colors of Unforgettable Speaking / Express Your True Colors, Overcome Your Fears, and Roar on Screen and Stage. Under the name: TEDx Speaker, Slam Poet & Creator of the Mic Drop Method.",
    w: 756,
    h: 1200,
  },
  {
    src: "/book/cover-blend-slam-poet.webp",
    title: "The blend - \"Award-Winning Writer\"",
    note: "The same, with: TEDx Speaker, Slam Poet & Award-Winning Writer.",
    w: 758,
    h: 1200,
  },
  {
    src: "/book/cover-blend-standing-ovation.webp",
    title: "The blend - \"Standing-Ovation Storyteller\"",
    note: "The same, with: TEDx Speaker & Standing-Ovation Storyteller.",
    w: 759,
    h: 1200,
  },
  {
    src: "/book/speak-better-book-v2.webp",
    title: "The book - previous (Express Your True Colors)",
    note: "Cover A4 with TARIQ EQ AMAWI at the top and the strapline \"The Secret Speaking Skills You Need to Overcome Your Fears and Deliver Unforgettable Talks.\"",
    w: 764,
    h: 1200,
  },
  {
    src: "/book/cover-a4-author-bottom-v2.webp",
    title: "The book - author at the bottom, new strapline",
    note: "The same with the small lion kept at the top and the name at the foot.",
    w: 753,
    h: 1200,
  },
  {
    src: "/book/cover-a4-author-bottom.webp",
    title: "Book cover A4 - author at the bottom",
    note: "A4 with the small line under the top lion removed (the lion emblem stays) and TARIQ EQ AMAWI at the foot of the cover.",
    w: 761,
    h: 1200,
  },
  {
    src: "/book/cover-a4-author-top.webp",
    title: "Book cover A4 - author at the top",
    note: "A4 with the small lion and line at the top removed entirely, TARIQ EQ AMAWI in their place above the title.",
    w: 770,
    h: 1200,
  },
  {
    src: "/book/cover-dark-glass.webp",
    title: "Book cover A2 - dark glass",
    note: "Cover A on the app's own darkness: near-black with faint purple, green and blue glass glows, so the neon lion stands out.",
    w: 769,
    h: 1200,
  },
  {
    src: "/book/cover-dark-wave.webp",
    title: "Book cover A3 - dark, with a subtle spectrum wave",
    note: "The same, the neon kept to one thin speaking-spectrum waveform along the bottom edge.",
    w: 766,
    h: 1200,
  },
  {
    src: "/book/cover-dark-wave-bold.webp",
    title: "Book cover A4 - dark, with a bolder wave",
    note: "The spectrum wave bigger and brighter across the lower cover, running under the microphone.",
    w: 782,
    h: 1200,
  },
  {
    src: "/book/cover-neon-glass.webp",
    title: "Book cover A - neon through glass",
    note: "New title and line. The lion enlarged and cropped, neon gradients like light through glass, a small lion emblem above the title.",
    w: 760,
    h: 1200,
  },
  {
    src: "/book/cover-light-ribbons.webp",
    title: "Book cover B - light ribbons",
    note: "Dark navy crossed by seven neon ribbons, like the app's spectrum wave, the lion rising out of them.",
    w: 799,
    h: 1200,
  },
  {
    src: "/book/cover-holographic.webp",
    title: "Book cover C - holographic",
    note: "An iridescent cover, the lion huge and wrapping onto the spine, the title on the spine too.",
    w: 775,
    h: 1200,
  },
  {
    src: "/book/cover-navy-v2.webp",
    title: "Book cover D - navy, new wording",
    note: "The original navy linen with the new title and line, for comparison.",
    w: 771,
    h: 1200,
  },
  {
    src: "/book/speak-better-book.webp",
    title: "The book - the first render (old wording)",
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
