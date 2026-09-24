"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { planOf } from "@/lib/plan";

// Client-side access gate (build plan Phase 3).
// INTEGRATION SWAP POINT: with Supabase Auth this becomes server-side
// middleware + RLS (stack §19); the redirect targets stay the same.
//
// Every screen behind it needs a paid plan. Somebody without one is
// sent to the tiers on the landing page - there is no free way in.

export function RequireAccess({ children }: { children: ReactNode }) {
  const { state, ready } = useStore();
  const router = useRouter();
  const paid = planOf(state) !== null;

  useEffect(() => {
    if (!ready) return;
    if (!paid) router.replace("/#pricing");
    else if (!state.level) router.replace("/welcome");
  }, [ready, paid, state.level, router]);

  if (!ready || !paid || !state.level) return null;
  return <>{children}</>;
}
