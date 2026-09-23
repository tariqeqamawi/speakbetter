import type { Metadata } from "next";
import Link from "next/link";
import { stripe, stripeEnabled } from "@/lib/stripe/config";
import { CheckoutDone } from "@/components/checkout-done";

export const metadata: Metadata = { title: "You're in" };

// Where Stripe sends a student back to.
//
// The session is looked up here, on the server, rather than trusted
// from the query string - a URL anybody could type is not proof of
// payment. What it is for is speed: the webhook is the record, but it
// can take a second or two, and nobody should sit on a spinner after
// paying. So this page confirms with Stripe directly and lets the
// device in immediately.

export default async function CheckoutDonePage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: id } = await searchParams;

  let plan: string | null = null;
  let email: string | null = null;
  if (id && stripeEnabled()) {
    try {
      const session = await stripe().checkout.sessions.retrieve(id);
      if (session.payment_status === "paid") {
        plan = session.metadata?.plan ?? null;
        email = session.customer_details?.email ?? null;
      }
    } catch {
      // A session id that Stripe doesn't know is simply not a payment.
    }
  }

  if (!plan)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">We couldn&apos;t find that payment</h1>
        <p className="text-sm text-ink-muted">
          If you were charged, it will land in a moment - nothing is lost. Otherwise, the tiers are here.
        </p>
        <Link
          href="/pricing"
          className="inline-flex min-h-11 items-center rounded-full bg-ink px-6 text-sm font-bold text-navy-900"
        >
          Back to the plans
        </Link>
      </main>
    );

  return <CheckoutDone plan={plan} email={email} />;
}
