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

/** Everything that's on offer, in the order the tiers fill it in. */
export interface Feature {
  id: string;
  label: string;
}

export const features: Feature[] = [
  { id: "lessons", label: "All 81 skill lessons, in the seven colors" },
  { id: "deck", label: "The digital card deck - all 79 cards, in the app" },
  { id: "journey", label: "The STORY journey - 24 challenges, five phases" },
  { id: "written", label: "Coach watches every take and writes you the full review card" },
  { id: "loop", label: "XP, ranks, trophies, streaks - the whole practice loop" },
  { id: "device", label: "Recordings kept on your own phone, never on a server" },
  { id: "coach", label: "The AI coach watches every take - gestures, eyes, voice, the story" },
  { id: "spoken", label: "Spoken feedback from the lion, with captions" },
  { id: "ask", label: "Ask your coach anything about how you're developing" },
  { id: "board", label: "This week's board, and notes when your review is ready" },
  { id: "reviews", label: "Up to 20 reviews a month - more than a take a day" },
  { id: "live", label: "A monthly live group session with the teacher" },
  { id: "cohort", label: "A live cohort: start together, finish together" },
  { id: "printed", label: "The physical card deck - printed, boxed and posted to you" },
  { id: "book", label: "The book, when it ships" },
  { id: "first", label: "First access to every new lesson and challenge" },
];

export interface Tier {
  id: Exclude<Plan, "trial">;
  name: string;
  /** A qualifier under the name, in brackets - what "Ultimate" means. */
  sub?: string;
  /** What it's for, in a line. */
  tagline: string;
  price: string;
  /** Beneath the price: the term, or the yearly alternative. */
  term: string;
  /** The default choice at checkout - drawn larger. */
  featured?: boolean;
  /** Which of the features it has - the rest show struck out. */
  has: string[];
  /** The tier's own color, for its ticks. */
  accent: "mindset" | "structure" | "storytelling";
  cta: string;
  /** Limited seats, a cohort start - the note under the button. */
  note?: string;
}

const foundations = ["lessons", "deck", "journey", "written", "loop", "device"];
const coached = [...foundations, "coach", "spoken", "ask", "board", "reviews"];
const founders = [...coached, "live", "cohort", "printed", "book", "first"];

// The first cohort's prices: three one-off payments for SIX WEEKS of
// access, not a subscription and not lifetime. A cohort starts and
// finishes together, so the thing being bought is a run of the course
// with everybody else on it - and that has to be said everywhere the
// price is, not buried in terms.
//
// The gap between Starter and the Full Experience is exactly the
// UPGRADE price below, so upgrading mid-cohort costs the difference
// and nothing more.
export const tiers: Tier[] = [
  {
    id: "foundations",
    name: "Starter",
    tagline: "The method, and Coach in writing.",
    price: "$300",
    term: "one payment - six weeks of access",
    has: foundations,
    accent: "mindset",
    cta: "Get Starter",
    note: "Six weeks. Upgrade to the Full Experience any time for $200.",
  },
  {
    id: "coached",
    name: "Full Experience",
    tagline: "Coach watches every take, and answers you out loud.",
    price: "$500",
    term: "one payment - six weeks of access",
    featured: true,
    has: coached,
    accent: "structure",
    cta: "Get the Full Experience",
    note: "Six weeks, with Coach on call 24/7.",
  },
  {
    id: "founders",
    name: "Ultimate",
    sub: "Founders complete set, including the physical card deck and the physical book",
    tagline: "The whole system, with the teacher in the room.",
    price: "$1,000",
    term: "one payment - six weeks, and the deck and book are yours to keep",
    has: founders,
    accent: "storytelling",
    cta: "Join the Founders cohort",
    note: "Six weeks, live. Limited seats per cohort.",
  },
];

/** What each tier costs, in cents, for the checkout. The strings above
 *  are what a student reads; these are what they are charged. */
export const priceCents: Record<Exclude<Plan, "trial">, number> = {
  foundations: 30000,
  coached: 50000,
  founders: 100000,
};

/** Starter to the Full Experience: the difference, not a second full
 *  price. A student who has already paid $300 is not asked for $500. */
export const UPGRADE_CENTS = priceCents.coached - priceCents.foundations;

/** The line Coach's own page shows a Starter student, and the word on
 *  the button under it. Written once, here, because it is the sentence
 *  that carries the upgrade. */
export const upgradeOffer = {
  title: "Upgrade to access Coach 24/7 and become the speaker you always dreamed of",
  body:
    "Coach already watches every take you record and writes you the review. The Full Experience is him out loud - the review spoken in his voice with the words on screen - and him on call: ask him anything about how you are developing, any time, and he answers from your own record.",
  cta: "Upgrade for $200",
  /** Said under the button: what the $200 buys, and for how long. */
  term: "For the rest of your six weeks.",
} as const;

/** What the free baseline lets a student do before paying. */
export const trial = {
  name: "Experience Speak Better",
  includes: [
    "The first challenge, live: upload a video of yourself speaking and get the feedback directly from the coach",
    "One real review from the AI coach: your score, your seven-color spectrum, what to do next",
    "The lessons that challenge leans on",
    "See it in action before you ever pull out your card",
  ],
  cta: "Try the first challenge free",
} as const;
