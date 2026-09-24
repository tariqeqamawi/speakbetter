// Coaching credits: who gets how many reviews, and what more costs.
//
// WHY THIS EXISTS. Every review is a real bill - a minute of video
// watched by a Pro model. One student doing a take a day for six
// weeks is forty-odd reviews; one student re-recording the same
// challenge eleven times in an evening is also forty-odd, in one
// evening, and the second one is the reason an unlimited plan cannot
// be offered honestly. A allowance that covers ordinary practice and
// a cheap top-up for unusual practice keeps the price of the course
// where it is for everybody who is not hammering it.
//
// THE PART THAT IS EASY TO GET WRONG. Starter is "Coach in writing",
// which sounds cheaper and is not: he still watches the whole video,
// and watching is the cost. The spoken review is a rounding error
// beside it. So Starter needs an allowance too - not because the
// student is getting less, but because the expensive half of what they
// get is identical.
//
// WHAT A REVIEW COSTS US. Measured, not guessed: a two-minute take at
// low media resolution is about 21,000 tokens in and 5,900 out, and
// the brief is cached rather than re-sent. Call it single-digit cents.
// The packs below are priced at several times that, which covers the
// reviews, the failures that get retried for free, and the ones a
// student is given back when something goes wrong.

export interface CreditPack {
  id: "small" | "medium" | "large";
  /** What the student pays, in cents. */
  cents: number;
  price: string;
  /** Reviews it buys. */
  reviews: number;
  /** The line under it. */
  note: string;
  best?: boolean;
}

export const creditPacks: CreditPack[] = [
  {
    id: "small",
    cents: 500,
    price: "$5",
    reviews: 25,
    note: "A fortnight of extra takes.",
  },
  {
    id: "medium",
    cents: 1000,
    price: "$10",
    reviews: 60,
    note: "The one most people want - cheaper per review.",
    best: true,
  },
  {
    id: "large",
    cents: 2000,
    price: "$20",
    reviews: 150,
    note: "For the rest of the cohort, whatever you do.",
  },
];

/**
 * How many reviews each plan includes over its six weeks.
 *
 * Set against what practice actually looks like: a take a day for six
 * weeks is 42. Starter and Complete both clear that with
 * room for re-records, because a student who re-records is doing
 * exactly what the course asks and should not be made to feel it.
 * Ultimate is effectively uncapped for one cohort.
 */
export const includedReviews: Record<string, number> = {
  trial: 1,
  foundations: 60,
  coached: 100,
  founders: 250,
};

/** A warning worth giving before the last one is spent. */
export const LOW_AT = 5;
