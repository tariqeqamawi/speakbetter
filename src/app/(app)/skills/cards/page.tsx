import type { Metadata } from "next";
import { CardDeck, type DeckCard } from "@/components/card-deck";
import { SectionTabs } from "@/components/section-tabs";
import { DeckIcon } from "@/components/icons";
import { categories } from "@/data/categories";
import { deckLessonIds } from "@/data/deck";
import { lessons } from "@/data/lessons";
import { takeaways } from "@/data/takeaways";
import { contentFor } from "@/data/card-content";
import cueTable from "@/data/lesson-cues.json";
import type { LessonCue } from "@/lib/lesson-cues";

export const metadata: Metadata = { title: "Cards" };

const cues = cueTable as Record<string, LessonCue[]>;

/** The lesson's own motif - the glyph the player floats during it. */
function motif(vimeoId: string): string | undefined {
  return cues[vimeoId]?.find((c) => c.icon)?.icon;
}

const cards: DeckCard[] = deckLessonIds.flatMap((vimeoId) => {
  const lesson = lessons.find((l) => l.vimeoId === vimeoId);
  const points = takeaways[vimeoId];
  const category = categories.find((c) => c.id === lesson?.category);
  if (!lesson || !points || !category) return [];

  const siblings = lessons.filter(
    (l) => l.category === category.id && takeaways[l.vimeoId],
  );
  return [
    {
      vimeoId,
      categoryId: category.id,
      category,
      section: category.name,
      title: lesson.title,
      points,
      ...contentFor(vimeoId),
      icon: motif(vimeoId),
      index: siblings.findIndex((l) => l.vimeoId === vimeoId) + 1,
      total: siblings.length,
    },
  ];
});

export default function CardsPage() {
  return (
    <div className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="flex items-center gap-2.5 text-3xl font-semibold tracking-tight">
          <DeckIcon className="size-7 shrink-0 text-figurative" />
          Cards
        </h1>
        <p className="max-w-lg text-ink-muted">
          The same library in the hand instead of on screen. Pull one card of
          each color and you have the ingredients for a talk that moves.
        </p>
      </header>

      <SectionTabs />
      <CardDeck cards={cards} />
    </div>
  );
}
