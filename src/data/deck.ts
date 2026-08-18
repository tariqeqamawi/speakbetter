import { lessons } from "./lessons";
import { takeaways } from "./takeaways";
import type { CategoryId } from "./categories";

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
// as the choice behind each card, so every lesson that has something to
// hold gets one - 81 of them - and the depth of each color is what makes
// pulling from it feel like a decision rather than a draw. (A printed
// run may later ship a smaller set for cost; that's a decision for the
// press, not for this.)
//
// The rules card below is the deck's own instruction card, the one every
// deck ships with. It's the only card that isn't a lesson.

/**
 * Every lesson with key points written for it, in the order the course
 * teaches them. A lesson without key points has nothing to put on a
 * card's face, so it waits until it has some.
 */
export const deckLessonIds: string[] = lessons
  .filter((l) => takeaways[l.vimeoId]?.length)
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
