import { lessons, lessonByVimeoId } from "./lessons";
import { takeaways } from "./takeaways";
import { contentFor } from "./card-content";
import { categoryById, type CategoryId } from "./categories";
import cueTable from "./lesson-cues.json";
import type { LessonCue } from "@/lib/lesson-cues";
import type { LessonCardData } from "@/components/lesson-card";

/** A card, plus the two things only the app needs: which lesson, which color. */
export interface DeckCardData extends LessonCardData {
  vimeoId: string;
  categoryId: CategoryId;
}

/** The lesson's own motif - the glyph the player floats during it. */
const cues = cueTable as Record<string, LessonCue[]>;

// The deck, and the thing the deck is for.
//
// HOW THE DECK IS USED
// --------------------
// You want to give a talk. You pull one card of each color:
//
//     a yellow one for the story you'll tell
//     an orange one for the language you'll paint it in
//     a red one for how you'll perform it
//     a magenta one for the shape you'll build
//     a green one for what you'll bring to it
//     a cyan one for what your body will do
//     a crimson one for the finish
//
// Seven cards on the table and you have the ingredients for a talk that
// moves - not one technique used well, but a range, which is the whole
// argument of the course. And when you want a storytelling idea and
// nothing else, you reach for yellow, because the color IS the index.
// That's why every card wears its section's color edge to edge, and why
// a card face down gives away its color and nothing more.
//
// It's also why the deck can't be curated down. A hand is only as good
// as the choice behind each card, so every lesson that teaches a skill
// gets one - 79 of them - and the depth of each color is what makes
// pulling from it feel like a decision rather than a draw. (A printed
// run may later ship a smaller set for cost; that's a decision for the
// press, not for this.)
//
// The rules card below is the deck's own instruction card, the one every
// deck ships with. It's the only card that isn't a lesson.
//
// The whole deck is open from the first minute. It isn't a reward for
// grinding through the library card by card - it's a tool, and a tool is
// useless handed over one piece at a time: the mechanic is pull one card
// of every color, which needs every color to be there. A student who
// opens the tab on day one gets all 79.

/**
 * Every lesson that teaches a specific skill, in the order the course
 * teaches them.
 *
 * Two things keep a lesson out. A lesson with no key points has nothing
 * to put on a card's face. And an introduction has nothing to *do* -
 * "Introduction To Figurative Language" frames a section rather than
 * handing you a move you can make, and a card you can't act on is a card
 * that wastes a pull. Every card in the deck is a skill.
 */
export const deckLessonIds: string[] = lessons
  .filter(
    (l) => takeaways[l.vimeoId]?.length && !/^Introduction To /i.test(l.title),
  )
  .map((l) => l.vimeoId);

const inDeck = new Set(deckLessonIds);

/** Whether this lesson has a card. */
export function hasCard(vimeoId: string): boolean {
  return inDeck.has(vimeoId);
}

/** The deck's cards in a section, in the order the course teaches them. */
export function deckCardsIn(category: CategoryId): string[] {
  return lessons
    .filter((l) => l.category === category && inDeck.has(l.vimeoId))
    .map((l) => l.vimeoId);
}

/**
 * The instruction card. Written as a card rather than as a page of help
 * because it has to survive being printed and dropped in the box with
 * the others - a deck explains itself in the hand, not in a manual.
 */
export const rulesCard = {
  title: "How to use this deck",
  points: [
    "Building a talk? Pull one card of each color. Seven ingredients - a story, the language to paint it, a way to perform it, a shape, a mindset, a body, a finish.",
    "Need one idea fast? The color is the index. Reach for yellow for storytelling, cyan for body language, and read the two lines on the back.",
    "Every card is a lesson in the course. The card is the reminder; the video is the teaching.",
  ],
};

/**
 * A lesson as its card - everything the card face needs, assembled in
 * one place so the deck, the design bench and the button beside the
 * player are all showing the same card rather than three near-copies of
 * one.
 *
 * Returns null for a lesson that has no card, which is the two section
 * introductions and nothing else.
 */
export function cardFor(vimeoId: string): DeckCardData | null {
  if (!inDeck.has(vimeoId)) return null;
  const lesson = lessonByVimeoId.get(vimeoId);
  const category = lesson && categoryById.get(lesson.category as CategoryId);
  const points = takeaways[vimeoId];
  if (!lesson || !category || !points) return null;

  // Numbered within the deck rather than within the section: a card
  // reading "09 / 11" has to count cards, and the lessons left out of
  // the deck aren't cards.
  const siblings = deckCardsIn(category.id);
  return {
    vimeoId,
    categoryId: category.id,
    category,
    section: category.name,
    title: lesson.title,
    points,
    ...contentFor(vimeoId),
    icon: cues[vimeoId]?.find((c) => c.icon)?.icon,
    index: siblings.indexOf(vimeoId) + 1,
    total: siblings.length,
  };
}

/** Every card in the deck, in the order the course teaches them. */
export function wholeDeck(): DeckCardData[] {
  return deckLessonIds.map(cardFor).filter((c) => c !== null);
}
