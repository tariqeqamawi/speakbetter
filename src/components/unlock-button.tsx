"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { Plan } from "@/data/pricing";

// Buying.
//
// One press, one redirect: the app asks its own server to open a
// Stripe Checkout session and sends the browser there. No card field
// is ever rendered by this app, which is the point - the least
// designed part of a payment should be the part that handles the card.
//
// Where Stripe isn't configured the button does what it did before
// there was a checkout: unlocks the device and goes to welcome. That
// keeps every demo, every preview and the whole landing page working
// without keys, and means nobody is ever sent to a payment page that
// cannot take a payment.

export function UnlockButton({
  className = "",
  plan = "coached",
  children = "Unlock Speak Better",
  quiet = false,
  /** An upgrade from Starter charges the difference, not a new tier. */
  upgrade = false,
}: {
  className?: string;
  plan?: Plan;
  children?: React.ReactNode;
  /** A plain button rather than the neon sign - for the tiers beside the featured one. */
  quiet?: boolean;
  upgrade?: boolean;
}) {
  const { unlock } = useStore();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const go = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buy: upgrade ? "upgrade" : plan }),
      });
      if (res.ok) {
        const { url } = (await res.json()) as { url?: string };
        if (url) {
          window.location.href = url;
          return;
        }
      }
    } catch {
      // Offline, or the checkout isn't switched on: fall through.
    }
    // No checkout configured - the app behaves as it always has.
    setBusy(false);
    unlock(plan);
    router.push("/welcome");
  };

  if (quiet)
    return (
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className={`rounded-xl border border-navy-500 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink-faint disabled:opacity-60 ${className}`}
      >
        {busy ? "Taking you to checkout…" : children}
      </button>
    );

  return (
    <span className={`cta-neon-wrap rounded-xl ${className}`}>
      <span className="cta-neon-glow rounded-xl" aria-hidden />
      <button type="button" onClick={go} disabled={busy} className="cta-neon rounded-xl px-7 py-3.5 text-sm disabled:opacity-70">
        {busy ? "Taking you to checkout…" : children}
      </button>
    </span>
  );
}

export function RedirectIfUnlocked() {
  const { state, ready } = useStore();
  const router = useRouter();

  // Returning student - skip the landing page entirely.
  useEffect(() => {
    if (ready && state.unlocked) {
      router.replace(state.level ? "/challenges" : "/welcome");
    }
  }, [ready, state.unlocked, state.level, router]);

  return null;
}
