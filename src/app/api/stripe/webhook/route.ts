import { NextResponse } from "next/server";
import { stripe, stripeEnabled } from "@/lib/stripe/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Stripe telling us a payment went through.
//
// This is the only thing that may grant a plan on the server, and it
// only believes Stripe: the body is verified against the signing
// secret before a single field of it is read. The success page a
// student lands on is a courtesy - it unlocks their device so they can
// get straight on with it - but the record of what they bought is set
// here, from Stripe, or it is not set at all.
//
// It has to read the raw body, so no parsing before the check.

export const maxDuration = 30;

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeEnabled() || !secret)
    return NextResponse.json({ error: "Not configured." }, { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Unsigned." }, { status: 400 });

  const raw = await request.text();
  let event;
  try {
    event = await stripe().webhooks.constructEventAsync(raw, signature, secret);
  } catch (e) {
    console.error("stripe signature failed", e);
    return NextResponse.json({ error: "Bad signature." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded")
    return NextResponse.json({ received: true });

  const session = event.data.object;
  if (session.payment_status !== "paid") return NextResponse.json({ received: true });

  const plan = session.metadata?.plan;
  const studentId = session.metadata?.studentId;
  if (!plan) return NextResponse.json({ received: true });

  const db = supabaseAdmin();
  if (!db || !studentId) {
    // Nobody signed in when they paid, or no database yet: the device
    // that paid unlocks itself on the way back, and the plan travels up
    // with the first sync after they make an account.
    console.log("paid", { plan, email: session.customer_details?.email ?? null, studentId: studentId ?? null });
    return NextResponse.json({ received: true });
  }

  const { error } = await db
    .from("profiles")
    .update({
      plan,
      plan_since: new Date().toISOString(),
      stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
    })
    .eq("id", studentId);

  if (error) {
    console.error("could not set plan", error);
    // A 500 asks Stripe to try again, which is what we want: the
    // payment happened and the plan has to land eventually.
    return NextResponse.json({ error: "Could not record the plan." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
