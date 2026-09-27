"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { features, guarantee, tiers, type Plan } from "@/data/pricing";
import { cohort } from "@/data/cohort";
import { CONSENT_REASSURE, CONSENT_SHORT } from "@/data/consent";
import { ConsentMeaning } from "@/components/consent-gate";
import { GuaranteeSeal } from "@/components/guarantee-seal";
import { TierArt } from "@/components/tier-art";
import { LegalLinks } from "@/components/legal-page";
import { CheckIcon } from "@/components/icons";

// THE CHECKOUT - the one page between choosing a tier and paying.
//
// It's where the agreement is asked, and only here: browsing the site
// asks nothing of anybody; joining the course does. On the left, what
// you're getting - the tier (changeable in a tap), everything in it, the
// dates and the guarantee. On the right, the few things needed to pay:
// an email for the receipt, the one line to agree to, and the button
// that hands over to Stripe's secure page. No card field is ever drawn
// here - Stripe takes the card.

const FEATURE_LABEL = new Map(features.map((f) => [f.id, f.label]));

const ACCENT: Record<string, { text: string; border: string; bg: string; glow: string }> = {
  mindset: { text: "text-mindset", border: "border-mindset/60", bg: "bg-mindset/10", glow: "shadow-[0_0_40px_-14px_var(--color-mindset)]" },
  structure: { text: "text-structure", border: "border-structure/60", bg: "bg-structure/10", glow: "shadow-[0_0_40px_-14px_var(--color-structure)]" },
  storytelling: { text: "text-storytelling", border: "border-storytelling/60", bg: "bg-storytelling/10", glow: "shadow-[0_0_40px_-14px_var(--color-storytelling)]" },
};

export function CheckoutPage({ initial }: { initial: Plan }) {
  const { state, ready, unlock, giveConsent } = useStore();
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>(initial);
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const tier = tiers.find((t) => t.id === plan)!;
  const a = ACCENT[tier.accent];
  const already = ready && Boolean(state.consentAt);
  const ok = agreed || already;

  const pay = async () => {
    if (!ok || busy) return;
    setBusy(true);
    setError("");
    // The agreement, kept on this device - so the app doesn't ask again.
    if (!already) giveConsent();
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buy: plan, email: email.trim() || undefined }),
      });
      if (res.ok) {
        const { url } = (await res.json()) as { url?: string };
        if (url) {
          window.location.href = url;
          return;
        }
      }
      if (res.status !== 503) {
        setError("Something went wrong opening the payment page. Please try again.");
        setBusy(false);
        return;
      }
    } catch {
      // Offline, or payments not switched on yet: fall through.
    }
    // Payments not switched on yet: the app opens as it always has.
    unlock(plan);
    router.push("/welcome");
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-8">
      <header className="flex flex-col items-center gap-2 text-center">
        <span className="spectrum-rule block h-1 w-16 rounded-full" />
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-ink-faint">Checkout</p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">You&apos;re one step from speaking better</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        {/* WHAT YOU'RE GETTING */}
        <section className={`flex flex-col gap-5 rounded-3xl border bg-navy-800/70 p-5 sm:p-7 ${a.border} ${a.glow}`}>
          {/* The tier, changeable here. */}
          <div role="radiogroup" aria-label="Choose your tier" className="grid grid-cols-3 gap-2">
            {tiers.map((t) => {
              const on = t.id === plan;
              const ta = ACCENT[t.accent];
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPlan(t.id)}
                  className={`flex flex-col items-center gap-0.5 rounded-2xl border px-2 py-3 text-center transition-colors ${
                    on ? `${ta.border} ${ta.bg}` : "border-navy-600 hover:border-ink-faint"
                  }`}
                >
                  <span className={`text-xs font-bold uppercase tracking-wider ${on ? ta.text : "text-ink-muted"}`}>{t.name}</span>
                  <span className="text-lg font-bold text-ink">{t.price}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="shrink-0 sm:w-48">
              <TierArt has={tier.has} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={`text-xs font-bold uppercase tracking-[0.2em] ${a.text}`}>{tier.name}</span>
              <span className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight text-ink">{tier.price}</span>
                {tier.future && <span className="text-lg text-ink-faint line-through">{tier.future}</span>}
              </span>
              <span className="text-sm text-ink-muted">{tier.term}</span>
              <span className="text-sm text-ink-muted">{tier.tagline}</span>
            </div>
          </div>

          <ul className="grid gap-2 sm:grid-cols-2">
            {tier.has.map((id) => (
              <li key={id} className="flex items-start gap-2 text-sm text-ink-muted">
                <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${a.bg} ${a.text}`}>
                  <CheckIcon className="size-3" />
                </span>
                {FEATURE_LABEL.get(id)}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-1 rounded-2xl border border-navy-600 bg-navy-900/70 px-4 py-3 text-sm">
            <span className="font-semibold text-ink">Founding cohort · {cohort.runLabel}</span>
            <span className="text-ink-muted">{cohort.doorsLine}</span>
          </div>
        </section>

        {/* PAY */}
        <section className="flex flex-col gap-5 rounded-3xl border border-navy-600 bg-navy-900/80 p-5 sm:p-7 lg:sticky lg:top-24">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-muted">
            Email for your receipt
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              className="rounded-xl border border-navy-600 bg-navy-950 px-4 py-3 font-normal text-ink placeholder:text-ink-faint focus:border-body-language focus:outline-none"
            />
            <span className="text-xs font-normal text-ink-faint">Optional here - Stripe asks for it on the next page if you leave it blank.</span>
          </label>

          {/* THE AGREEMENT - asked here, and only here. */}
          <div className="flex flex-col gap-3 rounded-2xl border border-navy-600 bg-navy-800 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-faint">Before you join</p>
            {already ? (
              <p className="flex items-center gap-2 text-sm text-mindset">
                <CheckIcon className="size-4" /> You&apos;ve already agreed to the <LegalLinks className="text-ink-muted" />
              </p>
            ) : (
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 size-5 shrink-0 accent-[var(--color-mindset)]"
                />
                <span className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold text-ink">Yes, I agree. {CONSENT_SHORT}</span>
                  <span className="text-ink-muted">{CONSENT_REASSURE}</span>
                </span>
              </label>
            )}
            <span className="text-xs text-ink-faint">
              <ConsentMeaning /> · Read the <LegalLinks />
            </span>
          </div>

          <div className="flex items-baseline justify-between border-t border-navy-700 pt-4">
            <span className="text-sm text-ink-muted">Total today</span>
            <span className="text-2xl font-bold text-ink">
              {tier.price} <span className="text-sm font-medium text-ink-faint">USD</span>
            </span>
          </div>

          <button
            type="button"
            onClick={pay}
            disabled={!ok || busy}
            className="cta-neon-wrap rounded-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="cta-neon block rounded-xl px-6 py-4 text-base">
              {busy ? "Opening secure payment…" : `Continue to secure payment · ${tier.price}`}
            </span>
          </button>
          {!ok && <p className="-mt-2 text-center text-xs text-ink-faint">Tick the agreement above to continue.</p>}
          {error && <p className="-mt-2 text-center text-sm text-acting">{error}</p>}

          <p className="flex items-center justify-center gap-2 text-xs text-ink-faint">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Payment is taken securely by Stripe. We never see your card.
          </p>

          <div className="flex items-center gap-3 rounded-2xl border border-mindset/40 bg-navy-800 px-4 py-3">
            <GuaranteeSeal size={72} />
            <span className="flex flex-col">
              <span className="text-sm font-bold text-ink">{guarantee.title}</span>
              <span className="text-xs text-ink-muted">{guarantee.line}</span>
            </span>
          </div>

          <p className="text-center text-xs text-ink-faint">
            Buying for a friend too? Check out once for each person, so each of you gets your own account.{" "}
            Bringing a team?{" "}
            <Link href="/teams" className="underline underline-offset-2 hover:text-ink">
              Talk to us
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
