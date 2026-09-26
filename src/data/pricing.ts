// The offer (master plan §15): what a student can buy.
//
// The shape is course + membership, because the method deserves a
// price that says "this is the method" and the coach costs something
// every time it's used. There is no free trial: every way into the app
// is one of the three tiers, and the fourteen-day guarantee is how
// somebody tries it.

export type Plan = "foundations" | "coached" | "founders";

/** A plan the app sells. Stored records can hold anything - "trial" in
 *  particular, from when there was one - and anything that is not a
 *  tier is no plan at all. */
export function isPlan(value: unknown): value is Plan {
  return value === "foundations" || value === "coached" || value === "founders";
}

/** Everything that's on offer, in the order the tiers fill it in. */
export interface Feature {
  id: string;
  label: string;
}

export const features: Feature[] = [
  { id: "lessons", label: "All 81 skill lessons, in the seven colors" },
  { id: "deck", label: "The digital card deck - all 79 cards, in the app" },
  { id: "journey", label: "The STORY adventure - 24 challenges, five phases" },
  { id: "written", label: "Coach watches every take and writes you the full review card" },
  { id: "loop", label: "XP, ranks, trophies, streaks - the whole practice loop" },
  { id: "device", label: "Recordings kept on your own phone, never on a server" },
  { id: "coach", label: "The AI coach watches every take - gestures, eyes, voice, the story" },
  { id: "spoken", label: "Spoken feedback from the lion, with captions" },
  { id: "ask", label: "Ask your coach anything about how you're developing" },
  { id: "board", label: "This week's board, and notes when your review is ready" },
  { id: "reviews", label: "Coaching credits included - and cheap to top up whenever you want more" },
  { id: "live", label: "Weekly live sessions with Tariq - hot-seat coaching, every week of the six" },
  { id: "cohort", label: "The live cohort: start together, finish together" },
  {
    id: "one-to-one",
    label: "Personal 1-to-1 feedback from Tariq himself - your takes, watched and reviewed by the teacher",
  },
  { id: "printed", label: "The physical card deck - printed, boxed and posted to you" },
  { id: "book", label: "The book, when it ships" },
  { id: "first", label: "First access to every new lesson and challenge" },
];

export interface Tier {
  id: Plan;
  name: string;
  /** A qualifier under the name, in brackets - what "Ultimate" means. */
  sub?: string;
  /** What it's for, in a line. */
  tagline: string;
  price: string;
  /** The price for later cohorts, shown struck through beside this
   *  founding-cohort price. */
  future?: string;
  /** Beneath the price: the term, or the yearly alternative. */
  term: string;
  /** The default choice at checkout - drawn larger. */
  featured?: boolean;
  /** Which of the features it has - the rest show struck out. */
  has: string[];
  /** The one line that is the reason to choose this tier, drawn apart
   *  from the ticks. A list of sixteen identical ticks hides the thing
   *  somebody is actually paying the difference for. */
  standout?: { id: string; label: string; note: string };
  /** The tier's own color, for its ticks. */
  accent: "mindset" | "structure" | "storytelling";
  cta: string;
  /** Limited seats, a cohort start - the note under the button. */
  note?: string;
}

const foundations = [
  "lessons",
  "deck",
  "journey",
  "written",
  "loop",
  "device",
  // Every tier is in the cohort and at the weekly calls. The point of
  // a dated cohort is that everybody walks it together; gating the
  // live sessions to the top tier would leave the students who most
  // need to watch somebody else be coached outside the room.
  "cohort",
  "live",
];
const coached = [...foundations, "coach", "spoken", "ask", "board", "reviews"];
const founders = [...coached, "one-to-one", "printed", "book", "first"];

// The first cohort's prices: three one-off payments for SIX WEEKS of
// access, not a subscription and not lifetime. A cohort starts and
// finishes together, so the thing being bought is a run of the course
// with everybody else on it - and that has to be said everywhere the
// price is, not buried in terms.
//
// The gap between Starter and Complete is exactly the
// UPGRADE price below, so upgrading mid-cohort costs the difference
// and nothing more.
export const tiers: Tier[] = [
  {
    id: "foundations",
    name: "Starter",
    tagline: "The full six weeks - the interactive challenges, the skills, and visual feedback on every take.",
    price: "$299",
    future: "$997",
    term: "one payment - 6 weeks' access",
    has: foundations,
    accent: "mindset",
    cta: "Get Starter",
    note: "6 weeks' access, including every weekly live session. Upgrade to Complete within your first 14 days for $199.",
  },
  {
    id: "coached",
    name: "Complete",
    tagline: "The full digital experience - everything in Starter, plus the interactive Coach and his spoken feedback.",
    price: "$498",
    future: "$1,498",
    term: "one payment - 6 weeks' access",
    featured: true,
    has: coached,
    accent: "structure",
    cta: "Get Complete",
    note: "6 weeks' access, with the AI coach on call 24/7.",
  },
  {
    id: "founders",
    name: "VIP Ultimate",
    sub: "The founders set - and the teacher reviewing your takes himself",
    tagline: "The full experience - the AI coach, the weekly live sessions, and personal one-to-one feedback from Tariq himself.",
    price: "$997",
    future: "$2,222",
    term: "one payment - 6 weeks, and the deck and book are yours to keep",
    has: founders,
    accent: "storytelling",
    standout: {
      id: "one-to-one",
      label: "Tariq reviews your takes personally, one to one",
      note: "Not the AI - the teacher. Your recordings watched by the person who wrote the method, with feedback in his own words.",
    },
    cta: "Join VIP Ultimate",
    note: "6 weeks, live. Strictly limited seats - one-to-one time does not scale.",
  },
];

/** What each tier costs, in cents, for the checkout. The strings above
 *  are what a student reads; these are what they are charged. */
export const priceCents: Record<Plan, number> = {
  foundations: 29900,
  coached: 49800,
  founders: 99700,
};

/** Starter to Complete: the difference, not a second full price. A
 *  student who has already paid $299 is not asked for $498. */
export const UPGRADE_CENTS = priceCents.coached - priceCents.foundations;

/** How long after joining a Starter student can still upgrade for the
 *  difference. After that the cohort is well under way and Starter is
 *  the course they chose. */
export const UPGRADE_WINDOW_DAYS = 14;

/** The line Coach's own page shows a Starter student, and the word on
 *  the button under it. Written once, here, because it is the sentence
 *  that carries the upgrade. */
export const upgradeOffer = {
  // What a Starter student sees when they tap Coach - Tariq's words.
  title: "Written and visual feedback only",
  body: "To have Coach talk to you and have Coach talk back to you, please upgrade.",
  cta: "Upgrade for $199",
  /** Said under the button: what the $199 buys, and for how long. */
  term: "For the rest of your six weeks.",
} as const;

/** The guarantee, said once and read everywhere it appears - under the
 *  tiers, in the FAQ and on /pricing. "For any reason" is the promise:
 *  a refund that needs a reason is a negotiation, and nobody buys a
 *  course they might have to argue their way out of. */
export const guarantee = {
  days: 14,
  title: "14-day money-back guarantee",
  line: "Try it for 14 days. If it's not for you - for any reason whatsoever - ask, and you get every cent back.",
} as const;

/** After the six weeks: staying on, month to month. Optional - the
 *  cohort itself is still one payment - and priced per tier, so the FAQ
 *  and anything else that mentions it read the numbers from here. */
export const monthly: Record<Plan, string> = {
  foundations: "$14.99",
  coached: "$29.99",
  founders: "$29.99",
};

/** The founding cohort: how many places, and why it is priced as it is. */
export const foundingCohort = {
  spots: 20,
  headline: "Only 20 spots available",
  line: "As the first founding cohort you get special pricing. Why? Before Speak Better opens to wider communities, Tariq would love your firsthand feedback on the app and your testimonial - so founding members get the full experience at a heavily discounted rate.",
} as const;
