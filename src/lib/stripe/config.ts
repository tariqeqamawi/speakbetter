import Stripe from "stripe";
import type { Plan } from "@/data/pricing";

// Payment, and the one rule it follows: nothing here runs unless it is
// configured. With no STRIPE_SECRET_KEY the app behaves exactly as it
// did before there was a checkout - the unlock button unlocks, the
// demo works, and nobody is sent to a payment page that cannot take a
// payment. The same shape the Supabase layer uses (lib/supabase).
//
// The prices live in data/pricing.ts as cents rather than as Stripe
// Price ids, and the session is built with price_data. That means one
// less thing to keep in step across two systems: change the price in
// the code and the checkout charges the new one. When the catalogue
// grows past three one-off tiers - subscriptions, coupons, taxes by
// region - that is the moment to move to Price ids in the dashboard,
// and STRIPE_PRICE_* below is the hook for it.

export type PaidPlan = Exclude<Plan, "trial">;

/** What the checkout is buying: a whole tier, or the step up from
 *  Starter to the Full Experience. */
export type Purchase = PaidPlan | "upgrade";

export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let client: Stripe | null = null;

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  client ??= new Stripe(key, { apiVersion: "2026-08-26.dahlia" });
  return client;
}

/** A Price id from the dashboard, when one is set for this purchase -
 *  otherwise the session is built from the cents in data/pricing.ts. */
export function priceId(what: Purchase): string | undefined {
  const map: Record<Purchase, string | undefined> = {
    foundations: process.env.STRIPE_PRICE_STARTER,
    coached: process.env.STRIPE_PRICE_FULL,
    founders: process.env.STRIPE_PRICE_ULTIMATE,
    upgrade: process.env.STRIPE_PRICE_UPGRADE,
  };
  return map[what];
}

/** Where Stripe sends them back to. Set NEXT_PUBLIC_SITE_URL in
 *  production; a preview deployment names itself. */
export function siteUrl(request: Request): string {
  const set = process.env.NEXT_PUBLIC_SITE_URL;
  if (set) return set.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return new URL(request.url).origin;
}
