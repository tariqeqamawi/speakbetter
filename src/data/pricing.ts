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
  { id: "written", label: "Written feedback on every take from the standing coach" },
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
  /** The tier's own colour, for its ticks. */
  accent: "mindset" | "structure" | "storytelling";
  cta: string;
  /** Limited seats, a cohort start - the note under the button. */
  note?: string;
}

const foundations = ["lessons", "deck", "journey", "written", "loop", "device"];
const coached = [...foundations, "coach", "spoken", "ask", "board", "reviews"];
const founders = [...coached, "live", "cohort", "printed", "book", "first"];

export const tiers: Tier[] = [
  {
    id: "foundations",
    name: "Starter",
    tagline: "The method, yours for good.",
    price: "$149",
    term: "one payment, lifetime access",
    has: foundations,
    accent: "mindset",
    cta: "Get Starter",
  },
  {
    id: "coached",
    name: "Full Experience",
    tagline: "A coach who watches every take.",
    price: "$29",
    term: "a month - or $249 a year, two months free",
    featured: true,
    has: coached,
    accent: "structure",
    cta: "Start the Full Experience",
    note: "Cancel any time. Starter stays yours.",
  },
  {
    id: "founders",
    name: "Ultimate",
    sub: "Founders complete set, including the physical card deck and the physical book",
    tagline: "The whole system, with the teacher in the room.",
    price: "$599",
    term: "one payment - a year of the Full Experience included",
    has: founders,
    accent: "storytelling",
    cta: "Join the Founders cohort",
    note: "Limited seats per cohort.",
  },
];

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
