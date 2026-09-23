import type { Metadata } from "next";
import { CardDeck } from "@/components/card-deck";
import { SectionTabs } from "@/components/section-tabs";
import { SectionTour } from "@/components/section-tour";
import { ChevronDownIcon } from "@/components/icons";
import { wholeDeck } from "@/data/deck";

export const metadata: Metadata = { title: "Cards" };

const cards = wholeDeck();

export default function CardsPage() {
  return (
    <div className="flex flex-col gap-3 pb-10 pt-4">
      <h1 className="sr-only">Cards</h1>
      <SectionTabs />
      <SectionTour section="cards" />

      <details className="group -mt-1">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-ink-faint transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
          What this is
          <ChevronDownIcon className="size-3.5 transition-transform group-open:rotate-180" />
        </summary>
        <p className="max-w-lg pt-2 text-sm text-ink-muted">
          The same library in the hand instead of on screen. Pull one card of each color and you have the ingredients
          for a talk that moves.
        </p>
      </details>

      <CardDeck cards={cards} />
    </div>
  );
}
