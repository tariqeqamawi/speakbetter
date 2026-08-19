import type { Metadata } from "next";
import { CardDeck } from "@/components/card-deck";
import { SectionTabs } from "@/components/section-tabs";
import { DeckIcon } from "@/components/icons";
import { wholeDeck } from "@/data/deck";

export const metadata: Metadata = { title: "Cards" };

const cards = wholeDeck();

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
