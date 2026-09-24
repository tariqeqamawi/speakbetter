import type { Metadata } from "next";
import { badgeDefs } from "@/data/badges";
import { TrophySpotlight, type SpotlightTrophy } from "@/components/trophy-spotlight";

export const metadata: Metadata = { title: "Trophy spotlight" };

// The trophy case as a room rather than a shelf: one trophy lit, the
// rest receding into the dark either side. Two versions - one with a
// rendered stage behind it, one with the light drawn in CSS alone - so
// the question "is the render worth carrying" can be answered by
// looking rather than arguing.

// Roughly half won, which is what a real case looks like part-way
// through a cohort, and the reason the dark ones have to read as
// "not yet" rather than "broken".
const trophies: SpotlightTrophy[] = badgeDefs.map((b, i) => ({
  id: b.id,
  icon: b.icon,
  name: b.title,
  how: b.how ?? "",
  won: i % 2 === 0 || i < 4,
}));

/** The one trophy that has been rendered so far, in its place. */
const rendered: SpotlightTrophy[] = trophies.map((t, i) =>
  i === 7 ? { ...t, won: true, image: "/trophy/flame.webp", zoom: "/trophy/flame-2x.webp" } : t,
);

export default function SpotlightPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-ink">The trophy room</h1>
        <p className="text-sm text-ink-muted text-balance">
          One trophy in the light, the rest receding into the dark on either side. Arrow keys, the
          chevrons, a swipe on a phone, or click any trophy out in the gloom to bring it forward.
          The beam takes the colour of whichever trophy is standing in it.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold tracking-tight text-ink">A - Drawn light</h2>
        <p className="max-w-2xl text-sm text-ink-muted">
          The beam, the haze and the pool on the floor are all CSS. Nothing to download, the colour
          follows the trophy, and it will never look dated or slightly wrong against the app&apos;s
          own palette.
        </p>
        <TrophySpotlight trophies={trophies} start={2} />
      </section>

      {/* The test that matters: a trophy that was MODELLED rather than
          drawn, standing on the rendered stage. The flame is the only
          one rendered so far, so it stands in the light and the drawn
          ones recede beside it - which also shows the two side by side
          at the exact sizes they would appear. */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold tracking-tight text-ink">C - A rendered trophy, on the stage</h2>
        <p className="max-w-2xl text-sm text-ink-muted">
          Sculpted amber glass on a chrome stem, cut out on transparency and stood in the beam. The ones
          either side are the drawn version, so the difference is visible at the size it will be seen. Hover the
          lit one to look at it closely - that detail is most of what a
          render buys you.
        </p>
        <TrophySpotlight trophies={rendered} start={7} backdrop="/trophy/stage.jpg" />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold tracking-tight text-ink">B - Rendered stage</h2>
        <p className="max-w-2xl text-sm text-ink-muted">
          The same case with a rendered room behind it, dimmed so the trophy stays the brightest
          thing on screen. Richer, but it is a fixed photograph: it cannot take the colour of the
          trophy standing in it, and it is a download on every visit.
        </p>
        <TrophySpotlight trophies={trophies} start={6} backdrop="/trophy/stage.jpg" />
      </section>
    </main>
  );
}
