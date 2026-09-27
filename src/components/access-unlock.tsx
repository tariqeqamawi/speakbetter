"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { adoptStudentId } from "@/lib/student-id";
import { tiers, type Plan } from "@/data/pricing";
import { CheckIcon } from "@/components/icons";

// What an access link does on arrival: opens this device on the tier
// that was bought, makes it the same student as the device that paid (so
// its saved progress, and everything from here on, is one record), and -
// if progress was saved - offers it back with one tap on /restore, which
// merges rather than overwrites.

export function AccessUnlock({ plan, studentId }: { plan: Plan; studentId: string | null }) {
  const { state, ready, unlock } = useStore();
  const done = useRef(false);
  const [saved, setSaved] = useState<string | null>(null);
  const tier = tiers.find((t) => t.id === plan);

  useEffect(() => {
    if (!ready || done.current) return;
    done.current = true;
    unlock(plan);
    if (!studentId) return;
    adoptStudentId(studentId);
    fetch(`/api/restore?studentId=${studentId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { backup?: { at: string | null } | null; attempts?: unknown[] } | null) => {
        if (d?.backup || (d?.attempts?.length ?? 0) > 0) setSaved(d?.backup?.at ?? "");
      })
      .catch(() => {});
  }, [ready, plan, studentId, unlock]);

  const next = state.level ? "/challenges" : "/welcome";

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <span className="spectrum-rule block h-1 w-16 rounded-full" />
      <span className="inline-flex items-center gap-1.5 rounded-full border border-mindset/50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-mindset">
        <CheckIcon className="size-3.5" /> Unlocked on this device
      </span>
      <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="text-ink-muted">
        Speak Better is open here on <b className="text-ink">{tier?.name}</b>.
      </p>
      {saved !== null && (
        <div className="flex w-full flex-col gap-2 rounded-2xl border border-navy-600 bg-navy-800 p-4">
          <b className="text-sm text-ink">Your saved progress was found.</b>
          <span className="text-xs text-ink-muted">
            Bring back your challenges, reviews and lessons from the device you&apos;ve been using - anything already here
            is kept.
          </span>
          <Link
            href={`/restore?id=${studentId}`}
            className="mt-1 rounded-full border border-body-language/70 bg-navy-700/70 px-5 py-2.5 text-sm font-semibold text-ink shadow-[0_0_12px_-2px_var(--color-body-language)]"
          >
            Bring back my progress
          </Link>
        </div>
      )}
      <Link href={next} className="cta-neon-wrap rounded-xl">
        <span className="cta-neon-glow rounded-xl" aria-hidden />
        <span className="cta-neon block rounded-xl px-9 py-4 text-base">Open Speak Better</span>
      </Link>
    </main>
  );
}
