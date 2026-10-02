import type { Metadata } from "next";
import Link from "next/link";
import { stripe, stripeEnabled } from "@/lib/stripe/config";
import { isPlan } from "@/data/pricing";
import { AccessUnlock } from "@/components/access-unlock";

// The buyer's own manifest, so "Add to Home Screen" here makes an icon
// that opens this link (manifest.webmanifest/route.ts says why).
export async function generateMetadata({ params }: { params: Promise<{ session: string }> }): Promise<Metadata> {
  const { session } = await params;
  return {
    title: "Welcome back",
    robots: { index: false },
    manifest: `/access/${session}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: "Speak Better", statusBarStyle: "black-translucent" },
  };
}

// A buyer's access link (components/access-link.tsx): the Stripe session
// they paid with, checked with Stripe here on the server - a link anybody
// could type is not proof of payment - and, if it's real, this device is
// opened on their tier and offered their saved progress.

export default async function AccessPage({ params }: { params: Promise<{ session: string }> }) {
  const { session: id } = await params;
  let plan: string | null = null;
  let studentId: string | null = null;
  if (/^cs_(live|test)_[A-Za-z0-9]+$/.test(id) && stripeEnabled()) {
    try {
      const s = await stripe().checkout.sessions.retrieve(id);
      if (s.payment_status === "paid" || s.payment_status === "no_payment_required") {
        plan = s.metadata?.plan ?? null;
        studentId = s.metadata?.studentId ?? null;
        // One buyer paying for two people pays twice from the same
        // device, so both purchases carry the same student. Only the
        // first purchase is that student; any later one is a separate
        // seat - a fresh student, so the two never share a record.
        if (studentId) {
          const others = await stripe().checkout.sessions.list({ limit: 100, status: "complete" });
          const earlier = others.data.some(
            (o) => o.id !== s.id && o.metadata?.studentId === studentId && o.created < s.created && o.payment_status !== "unpaid",
          );
          if (earlier) studentId = null;
        }
      }
    } catch {
      // Not a session Stripe knows.
    }
  }

  if (!plan || !isPlan(plan))
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">That link didn&apos;t open anything</h1>
        <p className="text-sm text-ink-muted">
          It may have been copied only in part. Try the link from your email again - or write to us and we&apos;ll sort it
          out straight away.
        </p>
        <Link href="/contact" className="inline-flex min-h-11 items-center rounded-full bg-ink px-6 text-sm font-bold text-navy-900">
          Contact us
        </Link>
      </main>
    );

  return <AccessUnlock plan={plan} studentId={studentId} />;
}
