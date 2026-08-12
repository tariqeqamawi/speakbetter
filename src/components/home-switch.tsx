"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Today } from "@/components/today";

// "/" serves whoever is standing there: the sales page to a visitor, the
// daily home to a student. Previously a student was bounced to the full
// challenge library, which is a place to browse rather than a place to
// begin.

export function HomeSwitch({ landing }: { landing: ReactNode }) {
  const { state, ready } = useStore();
  const router = useRouter();

  // Paid but never onboarded — they still owe us a level.
  useEffect(() => {
    if (ready && state.unlocked && !state.level) router.replace("/welcome");
  }, [ready, state.unlocked, state.level, router]);

  if (!ready) return null;
  if (state.unlocked && state.level) return <Today />;
  if (state.unlocked) return null; // redirecting to /welcome
  return <>{landing}</>;
}
