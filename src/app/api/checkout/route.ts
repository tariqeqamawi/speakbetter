import { NextResponse } from "next/server";
import { priceCents, tiers, UPGRADE_CENTS } from "@/data/pricing";
import { priceId, siteUrl, stripe, stripeEnabled, type Purchase } from "@/lib/stripe/config";

// Start a checkout: the app posts what is being bought, Stripe hands
// back a URL, the browser goes there. No card details ever touch this
// app, which is the whole reason for doing it this way.
//
// A checkout that isn't configured says so plainly with a 503 and the
// button falls back to the unlock it used before payment existed -
// better than sending somebody to a page that cannot take their money.

export const maxDuration = 30;

const WHAT: Record<Purchase, { name: string; blurb: string; cents: number }> = {
  foundations: {
    name: "Speak Better - Starter",
    blurb: "All 81 lessons, the deck, the 24-challenge journey, and Coach's written review on every take.",
    cents: priceCents.foundations,
  },
  coached: {
    name: "Speak Better - Full Experience",
    blurb: "Everything in Starter, plus Coach's spoken review with captions and Coach on call, 24/7.",
    cents: priceCents.coached,
  },
  founders: {
    name: "Speak Better - Ultimate",
    blurb: "The Full Experience, the live cohort, the monthly session with the teacher, the printed deck and the book.",
    cents: priceCents.founders,
  },
  upgrade: {
    name: "Speak Better - upgrade to the Full Experience",
    blurb: "Coach out loud, and Coach on call. The difference between Starter and the Full Experience.",
    cents: UPGRADE_CENTS,
  },
};

export async function POST(request: Request) {
  if (!stripeEnabled())
    return NextResponse.json({ error: "Checkout isn't switched on yet." }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as { buy?: string; email?: string; cohort?: string };
  const buy = String(body.buy ?? "") as Purchase;
  const item = WHAT[buy];
  if (!item) return NextResponse.json({ error: "Nothing to buy." }, { status: 400 });

  // What they end up with. An upgrade lands on the Full Experience.
  const plan = buy === "upgrade" ? "coached" : buy;
  const site = siteUrl(request);
  const known = priceId(buy);

  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      // Stripe's own page, in the app's clothes as far as it allows.
      line_items: [
        known
          ? { price: known, quantity: 1 }
          : {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: item.cents,
                product_data: { name: item.name, description: item.blurb },
              },
            },
      ],
      customer_email: typeof body.email === "string" && body.email.includes("@") ? body.email : undefined,
      // The plan rides on the session so the webhook and the return
      // page both know what was bought without looking it up.
      metadata: {
        plan,
        bought: buy,
        cohort: typeof body.cohort === "string" ? body.cohort.slice(0, 40) : "",
      },
      allow_promotion_codes: true,
      success_url: `${site}/checkout/done?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/pricing?cancelled=1`,
    });
    if (!session.url) throw new Error("no session url");
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("checkout failed", e);
    return NextResponse.json({ error: "Checkout couldn't start. Try again in a moment." }, { status: 502 });
  }
}

/** Which tiers exist, for anything that wants to render them without
 *  importing the data module. */
export async function GET() {
  return NextResponse.json({
    enabled: stripeEnabled(),
    tiers: tiers.map((t) => ({ id: t.id, name: t.name, price: t.price })),
  });
}
