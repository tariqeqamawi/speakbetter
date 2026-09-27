"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { LegalLinks } from "@/components/legal-page";
import { CONSENT_DECLINE, CONSENT_EXPLAIN, CONSENT_REASSURE, CONSENT_SHORT } from "@/data/consent";
import { guarantee } from "@/data/pricing";
import { supportMailto } from "@/data/support";
import { SITE_PATHS } from "@/data/site";

// Consent is a condition of Speak Better, not a setting: Coach gets
// better by learning from what students say, so a student who won't let
// their speech be used - anonymously, as text - can't take the course.
//
// It's asked the way Tariq wants it asked: one line, a yes, and "What
// does that mean?" for anyone who wants the why - which opens his
// explanation, with the yes and an honest no side by side. New students
// meet it at the end of welcome (ConsentAsk); anyone already inside from
// before it was asked meets the same thing once, over everything
// (ConsentGate). Before paying, the pricing section shows the line and
// the explanation too (ConsentMeaning).

/** "What does that mean?" - Tariq's explanation, in a pop-up. With
 *  onAgree it offers the yes and the no; without, it only explains. */
function Explainer({ onClose, onAgree }: { onClose: () => void; onAgree?: () => void }) {
  const [declined, setDeclined] = useState(false);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-explain"
      onClick={onClose}
      className="fixed inset-0 z-[210] flex items-center justify-center bg-navy-950/85 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-navy-600 bg-navy-900 p-6 text-left text-sm leading-relaxed text-ink-muted"
      >
        {declined ? (
          <>
            <h2 id="consent-explain" className="text-xl font-semibold text-ink">
              No harm done
            </h2>
            {CONSENT_DECLINE.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <p className="text-xs text-ink-faint">
              If you&apos;ve already paid, the {guarantee.days}-day money-back guarantee covers you.
            </p>
            <a
              href={supportMailto("Refund - not for me")}
              className="rounded-lg border border-navy-600 px-4 py-2 text-center text-sm font-semibold text-ink hover:border-ink-faint"
            >
              Email us for a refund
            </a>
            <button type="button" onClick={() => setDeclined(false)} className="text-sm text-ink-faint hover:text-ink">
              I&apos;ve changed my mind
            </button>
          </>
        ) : (
          <>
            <h2 id="consent-explain" className="text-xl font-semibold text-ink">
              What does that mean?
            </h2>
            {CONSENT_EXPLAIN.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <p>{CONSENT_DECLINE[0]}</p>
            <p className="text-xs text-ink-faint">
              The full details are in our <LegalLinks />.
            </p>
            {onAgree ? (
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={onAgree}
                  className="coach-pill flex min-h-12 items-center justify-center rounded-full text-sm font-bold text-navy-950"
                >
                  <span className="text-navy-950">Yes, I agree</span>
                </button>
                <button type="button" onClick={() => setDeclined(true)} className="text-sm text-ink-faint hover:text-ink">
                  It&apos;s not for me
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-navy-600 px-4 py-2 text-sm font-semibold text-ink hover:border-ink-faint"
              >
                Got it
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** The ask itself: the line, the reassurance, "Yes, I agree" and "What
 *  does that mean?". Once agreed it says so and steps aside. */
export function ConsentAsk({ agreed, onAgree }: { agreed: boolean; onAgree: () => void }) {
  const [open, setOpen] = useState(false);
  if (agreed) {
    return (
      <p className="flex items-center justify-center gap-2 text-sm text-mindset">
        <span aria-hidden>✓</span> You&apos;ve agreed to the <LegalLinks className="text-ink-muted" />
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-navy-600 bg-navy-800 p-4 text-center">
      <p className="text-sm font-semibold text-ink">{CONSENT_SHORT}</p>
      <p className="text-xs text-ink-muted">{CONSENT_REASSURE}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onAgree}
          className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-navy-900 hover:bg-white"
        >
          Yes, I agree
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm text-ink-muted underline decoration-ink-faint underline-offset-2 hover:text-ink"
        >
          What does that mean?
        </button>
      </div>
      {open && (
        <Explainer
          onClose={() => setOpen(false)}
          onAgree={() => {
            setOpen(false);
            onAgree();
          }}
        />
      )}
    </div>
  );
}

/** For the pricing section: the line before anyone pays, and the
 *  explanation on a tap - nothing to agree to yet. */
export function ConsentMeaning() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-ink-muted underline decoration-ink-faint underline-offset-2 hover:text-ink"
      >
        What does that mean?
      </button>
      {open && <Explainer onClose={() => setOpen(false)} />}
    </>
  );
}

export function ConsentGate() {
  const { state, ready, giveConsent } = useStore();
  const path = usePathname() ?? "";

  // Welcome asks it itself; /admin is Tariq's; and nobody is asked
  // anything while browsing the website - only inside the course (and at
  // checkout, which asks it on the page).
  if (
    !ready ||
    !state.unlocked ||
    state.consentAt ||
    path.startsWith("/welcome") ||
    path.startsWith("/admin") ||
    path.startsWith("/checkout") ||
    path === "/pricing" ||
    SITE_PATHS.includes(path)
  ) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Terms of Service"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-navy-950/85 p-4 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-navy-600 bg-navy-900 p-6">
        <h2 className="text-center text-xl font-semibold">One thing before you carry on</h2>
        <ConsentAsk agreed={false} onAgree={giveConsent} />
      </div>
    </div>
  );
}
