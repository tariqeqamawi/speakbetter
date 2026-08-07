"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

// The pay-to-unlock flow (master plan §15).
// INTEGRATION SWAP POINT (stack §19): this button becomes a Stripe
// Checkout redirect; the webhook that confirms payment calls the same
// unlock path this stub calls directly. The post-payment journey —
// straight into onboarding — is already the real one.

export function UnlockButton({ className = "" }: { className?: string }) {
  const { unlock } = useStore();
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        unlock();
        router.push("/welcome");
      }}
      className={`rounded-lg bg-ink px-6 py-3 text-sm font-semibold text-navy-900 transition-opacity hover:opacity-90 ${className}`}
    >
      Unlock Speak Better
    </button>
  );
}

export function RedirectIfUnlocked() {
  const { state, ready } = useStore();
  const router = useRouter();

  // Returning student — skip the landing page entirely.
  useEffect(() => {
    if (ready && state.unlocked) {
      router.replace(state.level ? "/challenges" : "/welcome");
    }
  }, [ready, state.unlocked, state.level, router]);

  return null;
}
