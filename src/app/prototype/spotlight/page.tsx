import type { Metadata } from "next";
import { badgeDefs, trophyArt } from "@/data/badges";
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

/** All of them, rendered - which is now the whole set rather than one.
 *
 *  The question this page was built to answer ("is modelling them
 *  worth it?") has been answered by doing it, so what it is for now is
 *  seeing the forty-seven together: whether they read as one
 *  collection won by one person, which is the only thing that matters
 *  once each of them individually looks right. */
const rendered: SpotlightTrophy[] = trophies.map((t) => ({ ...t, won: true, ...trophyArt(t.id) }));

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

      {/* All forty-seven, rendered.
          
          This page was built to answer one question - is modelling the
          trophies worth it against drawing them - and the answer came
          back yes from a single flame. What it is for now is the
          question after that: do the forty-seven read as ONE
          collection, won by one person, or as forty-seven separate
          prizes? That is only visible by walking the rack, which is
          why they are all shown won here rather than half dark. */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold tracking-tight text-ink">The full set - all 47, rendered</h2>
        <p className="max-w-2xl text-sm text-ink-muted">
          Every trophy in the app. The same short chrome post and gunmetal plinth under all of them, and five
          materials that say how hard the thing was to get: glass for the twenty-four challenges, ceramic for
          the ones about how you speak, chrome for turning up again and again, gold for finishing a level of
          the road, and obsidian for the rare ones. Four of the five still carry the colour of the skill, so
          the case keeps doubling as a picture of what somebody is good at. Arrow keys or a swipe to walk the
          rack; press and drag on the lit one to look at it closely.
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
