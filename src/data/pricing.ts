// The offer (master plan §15): what a student can buy, and what they
// can try for nothing first.
//
// The shape is course + membership, because the method deserves a
// price that says "this is the method" and the coach costs something
// every time it's used. The free baseline comes first: anyone records
// the two baseline challenges and gets one real review before paying
// anything - the landing page shows the mechanic, the baseline makes
// it theirs.

export type Plan = "trial" | "foundations" | "coached" | "founders";

export interface Tier {
  id: Exclude<Plan, "trial">;
  name: string;
  /** What it's for, in a line. */
  tagline: string;
  price: string;
  /** Beneath the price: the term, or the yearly alternative. */
  term: string;
  /** The default choice at checkout - drawn larger. */
  featured?: boolean;
  /** Everything it includes, in order. */
  includes: string[];
  /** What it doesn't, said plainly - the honest version of a tier table. */
  excludes?: string[];
  cta: string;
  /** Limited seats, a cohort start - the note under the button. */
  note?: string;
}

export const tiers: Tier[] = [
  {
    id: "foundations",
    name: "Foundations",
    tagline: "The method, yours for good.",
    price: "$149",
    term: "one payment, lifetime access",
    includes: [
      "All 81 skill lessons, in the seven colors",
      "The full deck of 79 cards",
      "The STORY journey - 24 challenges, five phases",
      "Written feedback on every take from the standing coach",
      "XP, ranks, trophies, streaks - the whole practice loop",
      "Recordings kept on your own phone, never on a server",
    ],
    excludes: ["Video reviews by the AI coach", "Ask your coach", "This week's board"],
    cta: "Get Foundations",
  },
  {
    id: "coached",
    name: "Coached",
    tagline: "A coach who watches every take.",
    price: "$29",
    term: "a month - or $249 a year, two months free",
    featured: true,
    includes: [
      "Everything in Foundations",
      "The AI coach watches every take - gestures, eyes, voice, the story",
      "Spoken feedback from the lion, with captions",
      "Ask your coach anything about how you're developing",
      "This week's board, and notes when your review is ready",
      "Up to 20 reviews a month - more than a take a day",
    ],
    cta: "Start Coached",
    note: "Cancel any time. Foundations stays yours.",
  },
  {
    id: "founders",
    name: "Founders",
    tagline: "The whole system, with the teacher in the room.",
    price: "$599",
    term: "one payment - a year of Coached included",
    includes: [
      "A year of Coached",
      "A monthly live group session with the teacher",
      "A live cohort: start together, finish together",
      "The printed card deck, posted to you",
      "The book, when it ships",
      "First access to every new lesson and challenge",
    ],
    cta: "Join the Founders cohort",
    note: "Limited seats per cohort.",
  },
];

/** What the free baseline lets a student do before paying. */
export const trial = {
  name: "The free baseline",
  includes: [
    "Record the two baseline challenges - the 'before' you'll be measured against",
    "One real review from the AI coach: your score, your seven-color spectrum, what to do next",
    "The lessons those challenges lean on",
  ],
  cta: "Start with the free baseline",
} as const;
