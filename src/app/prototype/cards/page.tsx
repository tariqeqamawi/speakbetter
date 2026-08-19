import {
  LessonCard,
  type FaceTreatment,
  type LessonCardData,
} from "@/components/lesson-card";
import { categories } from "@/data/categories";
import { cardFor, deckLessonIds, wholeDeck } from "@/data/deck";

// The design bench for the deck. Every card is built by the same
// cardFor() the app uses, so what's judged here is what ships.

/** The first card of each section, so the color system reads at a glance. */
function samplePerCategory(): LessonCardData[] {
  const deck = wholeDeck();
  return categories
    .map((category) => deck.find((c) => c.category.id === category.id))
    .filter((c) => c !== undefined);
}

/** How much type a card is carrying - the thing that overflows it. */
function weight(card: LessonCardData): number {
  const body = card.what
    ? [card.what, card.how, ...(card.like ?? []).slice(0, 3)]
    : card.points;
  return card.title.length + body.join(" ").length;
}

const FACES: { id: FaceTreatment; label: string; note: string }[] = [
  {
    id: "flat",
    label: "Flat - what ships today",
    note: "One solid hit of spot ink. The most saturated a neon can be on paper.",
  },
  {
    id: "vignette",
    label: "Vignette",
    note: "Lit from above, falling off at the edges. A graduated screen in print.",
  },
  {
    id: "linear",
    label: "Linear",
    note: "Light at the head, deeper at the foot. The longest ramp, so the most banding risk.",
  },
  {
    id: "engraved",
    label: "Engraved rings",
    note: "Texture at full ink rather than tone - the one pattern a single spot color prints cleanly.",
  },
];

export default function CardsPrototypePage() {
  // The card Tariq described: a storytelling card, so yellow.
  const hero = cardFor("1081031042") ?? samplePerCategory()[0];
  const deck = samplePerCategory();
  // The three cards carrying the most type. If the layout holds here it
  // holds everywhere, so this is the bench worth judging.
  const heaviest = [...wholeDeck()].sort((a, b) => weight(b) - weight(a)).slice(0, 3);
  const written = wholeDeck().filter((c) => c.what).length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 py-8">
      <header className="deck-print-hide flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-ink">The deck</h1>
        <p className="max-w-2xl text-sm text-ink-muted">
          Every lesson as a card, colored by its section. Tap one to turn it
          over. Drawn at oracle-deck size - 89 × 127 mm, 3.5 × 5 in - the
          stock a deck you read is printed on, rather than the smaller poker
          size a deck you play with uses. Print this page to see them at real
          size with both faces laid out flat.
        </p>
        <p className="max-w-2xl text-xs text-ink-faint">
          {deckLessonIds.length} cards, one per skill lesson, all {written}{" "}
          written out in full: what it is, how to use it, and his own lines.
        </p>
      </header>

      {/* The sample, big enough to read */}
      <section className="deck-print-hide flex flex-col items-center gap-4">
        <div className="w-full max-w-xs">
          <LessonCard data={hero} />
        </div>
        <p className="text-xs text-ink-faint">Tap the card</p>
      </section>

      {/* The open question: does the colored face stay one flat block? */}
      <section className="deck-print-hide flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
          The face: flat or graded
        </h2>
        <p className="max-w-2xl text-xs text-ink-faint">
          The same card four ways. Flat and engraved both print in one solid
          spot ink; vignette and linear are screened tints, which is where
          fluorescent inks on uncoated stock get unreliable.
        </p>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {FACES.map(({ id, label, note }) => (
            <div key={id} className="flex flex-col gap-2">
              <LessonCard data={hero} face={id} className="max-w-none" />
              <span className="text-xs font-semibold text-ink">{label}</span>
              <span className="text-[11px] leading-snug text-ink-faint">
                {note}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Worst case for the layout: the cards with the most words on them */}
      <section className="deck-print-hide flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
          The longest cards
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {heaviest.map((card) => (
            <LessonCard key={card.title} data={card} className="max-w-none" />
          ))}
        </div>
      </section>

      {/* One card per section, so the color system reads at a glance */}
      <section className="deck-print-hide flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
          One from each section
        </h2>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {deck.map((card) => (
            <LessonCard key={card.title} data={card} className="max-w-none" />
          ))}
        </div>
      </section>

      {/* Only paper sees this: faces flat, at the size they'd be cut to */}
      <section className="deck-sheet hidden print:grid">
        {deck.map((card) => (
          <LessonCard key={`print-${card.title}`} data={card} />
        ))}
      </section>
    </div>
  );
}
