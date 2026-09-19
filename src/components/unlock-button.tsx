"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { Plan } from "@/data/pricing";

// The pay-to-unlock flow (master plan §15).
// INTEGRATION SWAP POINT (stack §19): this button becomes a Stripe
// Checkout redirect; the webhook that confirms payment calls the same
// unlock path this stub calls directly. The post-payment journey -
// straight into onboarding - is already the real one.

export function UnlockButton({
  className = "",
  plan = "coached",
  children = "Unlock Speak Better",
  quiet = false,
}: {
  className?: string;
  plan?: Plan;
  children?: React.ReactNode;
  /** A plain button rather than the neon sign - for the tiers beside the featured one. */
  quiet?: boolean;
}) {
  const { unlock } = useStore();
  const router = useRouter();
  const go = () => {
    unlock(plan);
    router.push("/welcome");
  };

  if (quiet)
    return (
      <button
        type="button"
        onClick={go}
        className={`rounded-xl border border-navy-500 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink-faint ${className}`}
      >
        {children}
      </button>
    );

  return (
    <span className={`cta-neon-wrap rounded-xl ${className}`}>
      <span className="cta-neon-glow rounded-xl" aria-hidden />
      <button type="button" onClick={go} className="cta-neon rounded-xl px-7 py-3.5 text-sm">
        {children}
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
