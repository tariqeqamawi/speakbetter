import type { Metadata } from "next";
import { CardDeck } from "@/components/card-deck";
import { SectionTabs } from "@/components/section-tabs";
import { rulesCard } from "@/data/deck";
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

      {/* How to use the deck, at the top.
          
          It was a dropdown at the FOOT of the deck, under everything,
          which is where instructions go to be read by people who have
          already worked the thing out. Above the cards it is there for
          the one person who needs it - and folded, so it costs the
          deck nothing for everybody else. */}
      <details className="group -mt-1">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-ink-faint transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
          How to use this deck
          <ChevronDownIcon className="size-3.5 transition-transform group-open:rotate-180" />
        </summary>
        <div className="flex max-w-lg flex-col gap-2 pt-2">
          <p className="text-sm text-ink-muted">
            The same library in the hand instead of on screen. Pull one card of each color and you have the
            ingredients for a talk that moves.
          </p>
          <ul className="flex flex-col gap-2">
            {rulesCard.points.map((point) => (
              <li key={point} className="flex gap-2 text-xs text-ink-muted">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink-faint" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </details>

      <CardDeck cards={cards} />
    </div>
  );
}
