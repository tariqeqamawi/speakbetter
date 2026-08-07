"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

// Client-side access gate (build plan Phase 3).
// INTEGRATION SWAP POINT: with Supabase Auth this becomes server-side
// middleware + RLS (stack §19); the redirect targets stay the same.

export function RequireAccess({ children }: { children: ReactNode }) {
  const { state, ready } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!state.unlocked) router.replace("/");
    else if (!state.level) router.replace("/welcome");
  }, [ready, state.unlocked, state.level, router]);

  if (!ready || !state.unlocked || !state.level) return null;
  return <>{children}</>;
}
