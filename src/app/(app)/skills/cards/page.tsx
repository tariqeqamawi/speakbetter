import type { Metadata } from "next";
import { CardDeck } from "@/components/card-deck";
import { SectionTabs } from "@/components/section-tabs";
import { rulesCard } from "@/data/deck";
import { SectionTour } from "@/components/section-tour";
import { InfoEye } from "@/components/info-eye";
import { wholeDeck } from "@/data/deck";
import { FeatureReaction } from "@/components/feature-reaction";

export const metadata: Metadata = { title: "Cards" };

const cards = wholeDeck();

export default function CardsPage() {
  return (
    <div className="flex flex-col gap-3 pb-10 pt-1">
      <h1 className="sr-only">Cards</h1>
      <SectionTabs
        info={
          <InfoEye label="How to use this deck">
            <p>
              The same library in the hand instead of on screen. Pull one card of each color and you have the
              ingredients for a talk that moves.
            </p>
            <ul className="flex flex-col gap-1.5">
              {rulesCard.points.map((point) => (
                <li key={point} className="flex gap-2 text-xs">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink-faint" />
                  {point}
                </li>
              ))}
            </ul>
          </InfoEye>
        }
      />
      <SectionTour section="cards" />


      <CardDeck cards={cards} />
      <FeatureReaction feature="deck" label="the deck" />
    </div>
  );
}
