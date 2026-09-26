"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { CONSENT_AGREE, CONSENT_LINE } from "@/lib/insights";
import { supportMailto } from "@/data/support";

// Consent is a condition of Speak Better, not a setting: Coach gets
// better by learning from what students say, so a student who won't let
// their speech be used - anonymously, as text - can't take the course.
//
// New students agree at the end of welcome (ConsentCheck). Anyone
// already inside from before it was asked meets this gate once, over
// everything, and can't go further without answering. Saying no is
// allowed and answered honestly: the course isn't for them, and the
// guarantee gives their money back.

export function ConsentCheck({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-xl border border-navy-600 bg-navy-800 p-4 text-left">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-5 shrink-0 accent-[var(--color-mindset)]"
      />
      <span className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">{CONSENT_AGREE}</span>
        <span className="text-xs leading-snug text-ink-muted">{CONSENT_LINE}</span>
      </span>
    </label>
  );
}

export function ConsentGate() {
  const { state, ready, giveConsent } = useStore();
  const path = usePathname() ?? "";
  const [agreed, setAgreed] = useState(false);
  const [declined, setDeclined] = useState(false);

  // Welcome asks it itself; /admin is Tariq's.
  if (!ready || !state.unlocked || state.consentAt || path.startsWith("/welcome") || path.startsWith("/admin")) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-navy-950/85 p-4 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-navy-600 bg-navy-900 p-6">
        {declined ? (
          <>
            <h2 id="consent-title" className="text-xl font-semibold">
              Then Speak Better isn&apos;t the right fit
            </h2>
            <p className="text-sm text-ink-muted">
              Coach becomes a better coach by learning from every student, so agreeing is part of taking the course.
              If you&apos;ve paid, you&apos;re covered by the 14-day money-back guarantee - just email us.
            </p>
            <a
              href={supportMailto("Refund - consent")}
              className="rounded-lg border border-navy-600 px-4 py-2 text-center text-sm font-semibold hover:border-ink-faint"
            >
              Email for a refund
            </a>
            <button type="button" onClick={() => setDeclined(false)} className="text-sm text-ink-faint hover:text-ink">
              Go back
            </button>
          </>
        ) : (
          <>
            <h2 id="consent-title" className="text-xl font-semibold">
              One thing before you carry on
            </h2>
            <ConsentCheck checked={agreed} onChange={setAgreed} />
            <button
              type="button"
              onClick={giveConsent}
              disabled={!agreed}
              className="coach-pill flex min-h-12 items-center justify-center rounded-full text-sm font-bold text-navy-950 disabled:opacity-40"
            >
              <span className="text-navy-950">I agree - carry on</span>
            </button>
            <button type="button" onClick={() => setDeclined(true)} className="text-sm text-ink-faint hover:text-ink">
              I don&apos;t agree
            </button>
          </>
        )}
      </div>
    </div>
  );
}
