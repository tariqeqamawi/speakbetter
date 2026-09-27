import { creditPacks, includedReviews } from "./credits";
import { priceCents, type Plan } from "./pricing";

// What the AI coach costs to run - one model of it, read by the admin's
// "Coach costs" tab and the data room's unit economics, so the two can
// never disagree.
//
// WHERE THE NUMBERS COME FROM. The token counts are measured: a two-
// minute take, watched at low media resolution with the brief cached, is
// about 21,000 tokens in and 5,900 out (thinking included) - see
// data/credits.ts. The rates are Google's list prices for the models the
// coach uses, as understood in September 2026: CHECK THEM against the
// Gemini billing page, and change them here - everything downstream
// follows. Every review also logs its real token counts ([coach] lines
// in the Vercel logs), which is how these get replaced with actuals.

export interface CoachRates {
  proIn: number;
  proOut: number;
  spokenPerReview: number;
  perQuestion: number;
}

export const COACH_RATES: CoachRates = {
  /** The reviewer (COACH_MODEL, Gemini Pro), $ per million tokens. */
  proIn: 2,
  proOut: 12,
  /** Coach's spoken review (Gemini flash TTS): about a minute of audio. */
  spokenPerReview: 0.015,
  /** A question to Coach (Gemini flash): short in, short out. */
  perQuestion: 0.005,
};

export const REVIEW_TOKENS = { input: 21_000, output: 5_900 } as const;

/** One video review, in dollars. */
export function reviewCost(rates = COACH_RATES): number {
  return (REVIEW_TOKENS.input * rates.proIn + REVIEW_TOKENS.output * rates.proOut) / 1_000_000;
}

/** Stripe's card fee on a charge, in dollars (2.9% + 30c). */
export function cardFee(dollars: number): number {
  return dollars > 0 ? dollars * 0.029 + 0.3 : 0;
}

/** Tiers that hear Coach speak their reviews. */
export const SPOKEN: Record<Plan, boolean> = { foundations: false, coached: true, founders: true };

/** The most a student on this tier can cost in Coach, using every
 *  included review (and, where they have it, hearing every one). */
export function tierWorstCase(plan: Plan, rates = COACH_RATES) {
  const reviews = includedReviews[plan];
  const coach = reviews * (reviewCost(rates) + (SPOKEN[plan] ? rates.spokenPerReview : 0));
  const price = priceCents[plan] / 100;
  return { plan, reviews, coach, price, share: coach / price };
}

/** What each pack of extra reviews leaves after Coach and card fees. */
export function packMargins(rates = COACH_RATES) {
  return creditPacks.map((p) => {
    const price = p.cents / 100;
    const coach = p.reviews * reviewCost(rates);
    const fee = cardFee(price);
    const margin = price - fee - coach;
    return { id: p.id, price, reviews: p.reviews, perReview: price / p.reviews, coach, fee, margin, share: margin / price };
  });
}
