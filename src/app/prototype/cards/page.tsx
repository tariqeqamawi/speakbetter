import { LessonCard, type LessonCardData } from "@/components/lesson-card";
import { categories } from "@/data/categories";
import { deckLessonIds } from "@/data/deck";
import { lessons } from "@/data/lessons";
import { takeaways } from "@/data/takeaways";
import { contentFor } from "@/data/card-content";
import cueTable from "@/data/lesson-cues.json";
import type { LessonCue } from "@/lib/lesson-cues";

// Prototype route - not part of the student experience.
//
// The deck: every lesson in the library as a card, colored by its
// section. A card is the lesson at a glance for when there's no time to
// watch the video, and it's what the course becomes off the screen -
// these are drawn at oracle-deck size so the same artwork can go to a
// press as a physical deck a student orders alongside the course.
//
// Print this page to see them at real size, faces side by side.

export const metadata = { title: "The deck" };

const cues = cueTable as Record<string, LessonCue[]>;

/** The lesson's own motif - the glyph the player floats during it. */
function motif(vimeoId: string): string | undefined {
  return cues[vimeoId]?.find((c) => c.icon)?.icon;
}

function cardFor(vimeoId: string): LessonCardData | null {
  const lesson = lessons.find((l) => l.vimeoId === vimeoId);
  const points = takeaways[vimeoId];
  const category = categories.find((c) => c.id === lesson?.category);
  if (!lesson || !points || !category) return null;

  const siblings = lessons.filter((l) => l.category === category.id);
  return {
    category,
    section: category.name,
    title: lesson.title,
    points,
    ...contentFor(vimeoId),
    icon: motif(vimeoId),
    index: siblings.findIndex((l) => l.vimeoId === vimeoId) + 1,
    total: siblings.length,
  };
}

/** Every card in the deck, in the order the course teaches them. */
function wholeDeck(): LessonCardData[] {
  return deckLessonIds.map(cardFor).filter((c) => c !== null);
}

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
          {deckLessonIds.length} cards, one per skill lesson - {written} of
          them written out in full: what it is, how to use it, and his own
          lines. The rest fall back to their key takeaways.
        </p>
      </header>

      {/* The sample, big enough to read */}
      <section className="deck-print-hide flex flex-col items-center gap-4">
        <div className="w-full max-w-xs">
          <LessonCard data={hero} />
        </div>
        <p className="text-xs text-ink-faint">Tap the card</p>
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
