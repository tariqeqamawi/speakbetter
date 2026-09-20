"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

// Client-side access gate (build plan Phase 3).
// INTEGRATION SWAP POINT: with Supabase Auth this becomes server-side
// middleware + RLS (stack §19); the redirect targets stay the same.

export function RequireAccess({ children }: { children: ReactNode }) {
  const { state, ready } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  // A review is the student's own: a visitor who recorded the free
  // first challenge on the landing page can come back to Coach's review
  // of it (and the lessons it names) without having unlocked anything.
  const ownReview = pathname.startsWith("/review/") && state.attempts.length > 0;

  useEffect(() => {
    if (!ready || ownReview) return;
    if (!state.unlocked) router.replace("/");
    else if (!state.level) router.replace("/welcome");
  }, [ready, ownReview, state.unlocked, state.level, router]);

  if (!ready) return null;
  if (ownReview) return <>{children}</>;
  if (!state.unlocked || !state.level) return null;
  return <>{children}</>;
}
