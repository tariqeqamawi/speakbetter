import type { Metadata } from "next";
import { stripe, stripeEnabled } from "@/lib/stripe/config";
import { tiers } from "@/data/pricing";
import { cohort } from "@/data/cohort";

export const metadata: Metadata = { title: "Buyers", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

// Every paid purchase, newest first, with the buyer's personal access
// link and a welcome email ready to send - so nobody who has paid is left
// without a way in. Names and emails are private: the page shows nothing
// without ?key= matching BUYERS_KEY (set in Vercel).

const SITE = "https://speakbetter.app";

function seat(name: string, tierName: string, link: string) {
  const first = name.split(" ")[0] || "there";
  return `Hi ${first},

Here is the second Speak Better access link you paid for - for the person joining with you, on ${tierName}. Please forward this email to them; it's a separate seat with its own progress, so don't open it on your own phone.

${link}

For them: open the link on your phone and it opens Speak Better, already unlocked. To put it on your home screen:
- iPhone: open the link in Safari, tap the Share button (the square with the arrow), then "Add to Home Screen", then "Add".
- Android: open the link in Chrome, tap the menu (three dots), then "Add to Home screen" or "Install app".
From then on, just tap the lion icon. We start together on ${cohort.startShort} - live sessions are Saturdays at 11 AM CST, recorded if you miss one.

See you both inside,
Tariq`;
}

function welcome(name: string, tierName: string, link: string) {
  const first = name.split(" ")[0] || "there";
  return `Hi ${first},

Welcome to Speak Better - thank you for joining the founding cohort! You're on ${tierName}.

Here is your personal access link. It opens the app, already unlocked for you, on any phone, tablet or computer:

${link}

PUT IT ON YOUR HOME SCREEN (so it opens like a normal app):
- iPhone: open the link in Safari, tap the Share button (the square with the arrow), then "Add to Home Screen", then "Add".
- Android: open the link in Chrome, tap the menu (three dots), then "Add to Home screen" or "Install app".
From then on, just tap the lion icon.

WHERE TO START: the app opens on a short welcome, then your first challenge - watch any five of the short green Presence lessons. Next you record your baseline (a minute talking to your phone), and Coach, the lion, will review it.

We start together on ${cohort.startShort} - live sessions are Saturdays at 11 AM CST, and they're recorded if you miss one.

Keep this email - the link is personal, so please don't share it. Any questions, just reply.

See you inside,
Tariq`;
}

export default async function BuyersPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (!process.env.BUYERS_KEY || key !== process.env.BUYERS_KEY) {
    return <main className="py-24 text-center text-sm text-ink-muted">Not found.</main>;
  }
  if (!stripeEnabled()) return <main className="py-24 text-center text-sm text-ink-muted">Stripe isn&apos;t configured.</main>;

  const sessions = await stripe().checkout.sessions.list({ limit: 100, status: "complete" });
  // Speak Better purchases only - the same Stripe account sells other
  // things, which carry no tier.
  const paid = sessions.data.filter(
    (s) => (s.payment_status === "paid" || s.payment_status === "no_payment_required") && tiers.some((t) => t.id === s.metadata?.plan),
  );
  // A second purchase by the same email is a second seat (someone
  // buying for a friend): it gets the forwarding email.
  const firstByEmail = new Map<string, string>();
  for (const s of [...paid].sort((a, b) => a.created - b.created)) {
    const e = (s.customer_details?.email ?? "").toLowerCase();
    if (!firstByEmail.has(e)) firstByEmail.set(e, s.id);
  }
  // Every successful payment since the cohort went on sale, whatever
  // route it came by (payment links, invoices, the dashboard) - so a buyer
  // who didn't come through checkout isn't missed.
  const since = Math.floor(new Date("2026-09-15T00:00:00Z").getTime() / 1000);
  const viaCheckout = new Set(paid.map((s) => (typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id)));
  const charges = (await stripe().charges.list({ limit: 100, created: { gte: since } })).data.filter(
    (c) => c.paid && !c.refunded && !viaCheckout.has(typeof c.payment_intent === "string" ? c.payment_intent : (c.payment_intent?.id ?? "")),
  );

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Buyers</h1>
        <p className="text-sm text-ink-muted">
          {paid.length} paid {paid.length === 1 ? "purchase" : "purchases"}. Send each one their welcome email - the button opens it in
          your mail app, addressed and written.
        </p>
      </header>
      <ul className="flex flex-col gap-4">
        {paid.map((s) => {
          const name = s.customer_details?.name ?? "";
          const email = s.customer_details?.email ?? "";
          const plan = s.metadata?.plan ?? "";
          const tierName = tiers.find((t) => t.id === plan)?.name ?? plan;
          const link = `${SITE}/access/${s.id}`;
          const second = firstByEmail.get(email.toLowerCase()) !== s.id;
          const body = second ? seat(name, tierName, link) : welcome(name, tierName, link);
          const subject = second ? "Speak Better - the second access link, to forward" : "Welcome to Speak Better - your access link";
          const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          return (
            <li key={s.id} className="flex flex-col gap-3 rounded-2xl border border-navy-600 bg-navy-900/60 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <b className="text-lg text-ink">{name || "(no name)"}</b>
                <span className="text-xs text-ink-faint">
                  {new Date(s.created * 1000).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" })} CT
                </span>
              </div>
              {second && (
                <p className="rounded-lg border border-body-language/60 bg-body-language/10 px-3 py-2 text-sm font-semibold text-body-language">
                  Second seat - bought by the same person for someone else. Its email asks them to forward the link; it opens as a
                  separate student with its own progress.
                </p>
              )}
              <p className="text-sm text-ink-muted">
                {email} · <b className="text-ink">{tierName}</b> · {s.amount_total != null ? `$${(s.amount_total / 100).toFixed(2)}` : ""}
                {s.livemode ? "" : " · TEST"}
              </p>
              <code className="break-all rounded-lg bg-navy-950 px-3 py-2 text-xs text-ink">{link}</code>
              <div className="flex flex-wrap gap-2">
                <a href={mailto} className="rounded-full bg-figurative px-4 py-2 text-sm font-bold text-navy-950">
                  Send welcome email
                </a>
                <a href={link} className="rounded-full border border-navy-600 px-4 py-2 text-sm font-semibold text-ink-muted">
                  Open their link
                </a>
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer text-ink-faint">The email</summary>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-navy-950 p-3 font-sans text-xs text-ink-muted">{body}</pre>
              </details>
            </li>
          );
        })}
      </ul>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Other payments since Sep 15</h2>
        <p className="text-sm text-ink-muted">
          Paid in Stripe but not through the site&apos;s checkout - a payment link, an invoice or the dashboard. Anyone here who bought
          Speak Better has no access link yet: tell Claude their name.
        </p>
        {charges.length === 0 ? (
          <p className="text-sm text-ink-faint">None.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {charges.map((c) => (
              <li key={c.id} className="rounded-xl border border-navy-600 bg-navy-900/60 px-4 py-3 text-sm text-ink-muted">
                <b className="text-ink">{c.billing_details?.name ?? "(no name)"}</b> · {c.billing_details?.email ?? c.receipt_email ?? ""} · $
                {(c.amount / 100).toFixed(2)} · {c.description ?? ""} ·{" "}
                {new Date(c.created * 1000).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "America/Chicago" })}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
