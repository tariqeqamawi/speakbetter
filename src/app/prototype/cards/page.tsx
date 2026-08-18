import { LessonCard, type LessonCardData } from "@/components/lesson-card";
import { categories } from "@/data/categories";
import { lessons } from "@/data/lessons";
import { takeaways } from "@/data/takeaways";
import cueTable from "@/data/lesson-cues.json";
import type { LessonCue } from "@/lib/lesson-cues";

// Prototype route - not part of the student experience.
//
// The deck: every lesson in the library as a card, colored by its
// section. A card is the lesson at a glance for when there's no time to
// watch the video, and it's what the course becomes off the screen -
// these are drawn to poker proportions so the same artwork can go to a
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
    icon: motif(vimeoId),
    index: siblings.findIndex((l) => l.vimeoId === vimeoId) + 1,
    total: siblings.length,
  };
}

/** The first lesson in each section that has key points written for it. */
function samplePerCategory(): LessonCardData[] {
  const out: LessonCardData[] = [];
  for (const category of categories) {
    const found = lessons
      .filter((l) => l.category === category.id)
      .map((l) => cardFor(l.vimeoId))
      .find(Boolean);
    if (found) out.push(found);
  }
  return out;
}

export default function CardsPrototypePage() {
  // The card Tariq described: a storytelling card, so yellow.
  const hero = cardFor("1081031042") ?? samplePerCategory()[0];
  const deck = samplePerCategory();
  const covered = lessons.filter((l) => takeaways[l.vimeoId]).length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 py-8">
      <header className="deck-print-hide flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-ink">The deck</h1>
        <p className="max-w-2xl text-sm text-ink-muted">
          Every lesson as a card, colored by its section. Tap one to turn it
          over. Drawn to poker proportions - 63 × 88 mm, what a sleeve and a
          deck box are already built for - so the same artwork can go to a
          press as a physical deck. Print this page to see them at real size
          with both faces laid out flat.
        </p>
        <p className="max-w-2xl text-xs text-ink-faint">
          {covered} of {lessons.length} lessons have key points written, so
          that many can be carded today.
        </p>
      </header>

      {/* The sample, big enough to read */}
      <section className="deck-print-hide flex flex-col items-center gap-4">
        <div className="w-full max-w-xs">
          <LessonCard data={hero} />
        </div>
        <p className="text-xs text-ink-faint">Tap the card</p>
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
