import type { Metadata } from "next";
import { CardDeck } from "@/components/card-deck";
import { SectionTabs } from "@/components/section-tabs";
import { ChevronDownIcon, DeckIcon } from "@/components/icons";
import { wholeDeck } from "@/data/deck";

export const metadata: Metadata = { title: "Cards" };

const cards = wholeDeck();

export default function CardsPage() {
  return (
    <div className="flex flex-col gap-5 py-6">
      <header>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2.5 [&::-webkit-details-marker]:hidden">
            <DeckIcon className="size-7 shrink-0 text-figurative" />
            <h1 className="text-3xl font-semibold tracking-tight">Cards</h1>
            <ChevronDownIcon className="size-5 shrink-0 text-ink-faint transition-transform group-open:rotate-180" />
          </summary>
          <p className="max-w-lg pt-2 text-sm text-ink-muted">
            The same library in the hand instead of on screen. Pull one card of each color and you have the
            ingredients for a talk that moves.
          </p>
        </details>
      </header>

      <SectionTabs />
      <CardDeck cards={cards} />
    </div>
  );
}
