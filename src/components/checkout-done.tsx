"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { tiers, type Plan } from "@/data/pricing";
import { LionMouth } from "@/components/lion-mouth";
import { CheckIcon } from "@/components/icons";
import { hapticTap } from "@/lib/feedback-fx";

// The moment after paying.
//
// One job: get them in. The plan is written to the device, the lion
// says the one line that matters, and the button goes where a new
// student should go next - welcome the first time, Today if they were
// already here and have just upgraded. No receipt to read, no account
// to set up before they can do anything: Stripe emails the receipt and
// the account can wait until they want their record on two devices.

export function CheckoutDone({ plan, email }: { plan: string; email: string | null }) {
  const { state, ready, unlock } = useStore();
  const router = useRouter();
  const [held, setHeld] = useState(false);
  const applied = useRef(false);
  const tier = tiers.find((t) => t.id === plan);
  // Somebody who already had a level was here before - this was an
  // upgrade, not a first purchase.
  const returning = ready && Boolean(state.level);

  useEffect(() => {
    if (!ready || applied.current) return;
    applied.current = true;
    unlock(plan as Plan);
    setHeld(true);
  }, [ready, plan, unlock]);

  if (!ready) return null;

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <LionMouth level={0} className="w-36" />

      <div className="flex flex-col items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-mindset/50 bg-mindset/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-mindset">
          <CheckIcon className="size-3.5" />
          {held ? "You're in" : "One moment"}
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          {returning ? "Coach is on call now." : "Welcome to Speak Better."}
        </h1>
        <p className="text-sm text-ink-muted text-balance">
          {returning
            ? "For the rest of your six weeks every review is spoken in his voice, and you can ask him anything, any time."
            : `Six weeks of ${tier?.name ?? "the course"} - the lessons, the deck, and the whole STORY adventure. Let's find out where you're starting from.`}
        </p>
        {email && <p className="text-xs text-ink-faint">Receipt on its way to {email}.</p>}
      </div>

      <button
        type="button"
        onClick={() => {
          hapticTap();
          router.push(returning ? "/coach" : "/welcome");
        }}
        className="coach-pill flex min-h-14 w-full max-w-xs items-center justify-center rounded-full text-base font-bold text-navy-950"
      >
        <span className="text-navy-950">{returning ? "Go and ask him something" : "Start"}</span>
      </button>

      <p className="max-w-xs text-xs text-ink-faint text-balance">
        Your work is kept on this device. Make an account whenever you want it on your phone as well as here -
        nothing is lost either way.
      </p>
    </main>
  );
}
