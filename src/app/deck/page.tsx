import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteAsk, SiteHeading, SiteHero } from "@/components/site/site-hero";
import { SiteFooter } from "@/components/site/site-footer";
import { Shelf } from "@/components/site/shelf";
import { categories } from "@/data/categories";
import { wholeDeck } from "@/data/deck";
import { talkMailto } from "@/data/site";

// The deck's own page: what it is, the one move it's for (pull a card of
// every color and you have a talk), and how to get it - printed with VIP
// Ultimate, in the app with every tier.

export const metadata: Metadata = {
  title: "The Deck",
  description: "The Speak Better card deck: a card for every speaking skill, in seven colors. Pull one of each and you have a talk.",
};

/** What each color's card brings to a talk (data/deck.ts, "How the deck is used"). */
const ROLE: Record<string, string> = {
  storytelling: "the story you'll tell",
  figurative: "the language you'll paint it in",
  acting: "how you'll perform it",
  structure: "the shape you'll build",
  mindset: "what you'll bring to it",
  "body-language": "what your body will do",
  advanced: "the finish",
};

export default function DeckPage() {
  const cards = wholeDeck().length;
  return (
    <div className="flex flex-col gap-20 pb-10">
      <div className="flex flex-col items-center gap-8">
        <SiteHero ghost="The Deck" kicker="The Speak Better deck" title="Your whole speaking toolkit, in seven colors" accent="text-figurative">
          {cards} cards, color-coded to seven areas of public speaking, designed for speakers who desire engaging talks
          on the fly.
        </SiteHero>
        <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-navy-600">
          <Image
            src="/deck/printed-deck-oak.webp"
            alt="The printed Speak Better deck on an oak desk, some cards face up beside the box"
            width={1600}
            height={1063}
            priority
            sizes="(min-width: 1024px) 56rem, 100vw"
            className="h-auto w-full"
          />
        </div>
      </div>

      <section className="flex flex-col items-center gap-8">
        <SiteHeading kicker="How it works" title="Seven cards on the table, one of every color" accent="text-structure" />
        {/* Tariq's words. */}
        <p className="-mt-4 max-w-2xl text-center text-ink-muted text-balance">
          Every speaking skill in your hand and ready to use immediately. {cards} cards, one for every skill in the Speak
          Better system, split up into seven colors. Pull cards from one color to learn skills in that area, or pull a
          card of every color to have the ingredients for a dynamic talk that lights up the stage.
        </p>
        <ol className="grid w-full max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <li key={c.id} className={`flex flex-col gap-2 rounded-2xl border bg-navy-800/60 p-4 ${c.borderClass}`}>
              <span className={`block h-1.5 w-10 rounded-full ${c.bgClass}`} />
              <b className={`text-sm font-bold uppercase tracking-wider ${c.textClass}`}>{c.name}</b>
              <span className="text-sm text-ink-muted">A {c.colorName.toLowerCase()} card for {ROLE[c.id]}.</span>
            </li>
          ))}
          <li className="flex flex-col justify-center gap-1 rounded-2xl border border-navy-600 bg-navy-900 p-4 text-sm text-ink-muted">
            Want a storytelling idea and nothing else? Reach for yellow - <b className="text-ink">the color is the index.</b>
          </li>
        </ol>
      </section>

      <section className="grid items-center gap-8 lg:grid-cols-2">
        <div className="relative aspect-[3/2] overflow-hidden rounded-3xl border border-navy-600">
          <Image src="/deck/printed-deck-black.webp" alt="The deck in its box, cards fanned" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="flex flex-col gap-4">
          <SiteHeading kicker="How to get it" title="Printed, or in the app" accent="text-mindset" />
          <ul className="flex flex-col gap-3 text-ink-muted">
            <li className="rounded-2xl border border-navy-600 bg-navy-800/60 p-4">
              <b className="text-ink">The printed deck</b> - boxed and posted to you - comes with{" "}
              <b className="text-ink">VIP Ultimate</b>. Soon you&apos;ll be able to order it on its own.
            </li>
            <li className="rounded-2xl border border-navy-600 bg-navy-800/60 p-4">
              <b className="text-ink">The digital deck</b> - every card, with the lesson behind it a tap away - is in the
              app on every tier.
            </li>
          </ul>
          <div className="flex flex-wrap items-center gap-4">
            <SiteAsk href="/landing#pricing">See the tiers</SiteAsk>
            <a
              href={talkMailto("Decks for a group", ["Name", "Organisation", "How many decks"])}
              className="text-sm font-semibold text-ink-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Decks for a workshop or team?
            </a>
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center gap-8">
        <SiteHeading kicker="The Speak Better library" title="The deck, the book and the app" accent="text-storytelling" />
        <Shelf />
        <Link href="/book" className="text-sm font-semibold text-ink-muted hover:text-ink">
          The book is coming - join the waitlist →
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
