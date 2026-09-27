"use client";

import { useEffect, useState } from "react";
import { CheckIcon } from "@/components/icons";

// THE ACCESS LINK - a buyer's own way back in, until accounts exist.
//
// Every purchase gets a link of its own (/access/<the Stripe session>).
// Opened on any phone, tablet or computer it checks with Stripe that the
// purchase is real and opens Speak Better there on the tier that was
// bought - and offers back the progress saved from the device they paid
// on. So it's shown big, with one button to email it to themselves and
// a reminder to bookmark it.

export function AccessLink({ session, email, preview = false }: { session: string; email: string | null; preview?: boolean }) {
  const [origin, setOrigin] = useState("https://speakbetter.app");
  const [copied, setCopied] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the address it's actually served from
  useEffect(() => setOrigin(window.location.origin), []);
  const link = `${origin}/access/${preview ? "your-own-link" : session}`;
  const mail =
    `mailto:${email ?? ""}?subject=${encodeURIComponent("My Speak Better access link")}` +
    `&body=${encodeURIComponent(
      `My Speak Better access link - open it on any phone, tablet or computer to get into the app:\n\n${link}\n\nKeep this email. The link is personal - please don't share it.`,
    )}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The link is on screen to select by hand.
    }
  };

  return (
    <section className="flex w-full max-w-2xl flex-col items-center gap-4 rounded-3xl border border-storytelling/50 bg-gradient-to-b from-storytelling/10 to-navy-800 p-6 text-center shadow-[0_0_60px_-30px_var(--color-storytelling)]">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-storytelling">Your access link</p>
      <h2 className="text-2xl font-semibold tracking-tight text-balance">Keep this - it&apos;s your key to Speak Better</h2>
      <p className="max-w-md text-sm text-ink-muted text-balance">
        Open it on any phone, tablet or computer and Speak Better opens there on your tier - with the progress you&apos;ve
        made, too. Email it to yourself now, and bookmark it.
      </p>
      <code className="w-full break-all rounded-xl border border-navy-600 bg-navy-950 px-4 py-3 text-left text-sm text-ink">{link}</code>
      <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <a href={mail} className="cta-neon-wrap w-full rounded-xl sm:w-auto">
          <span className="cta-neon-glow rounded-xl" aria-hidden />
          <span className="cta-neon block rounded-xl px-7 py-3.5 text-base">Email this link to myself</span>
        </a>
        <button
          type="button"
          onClick={copy}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-navy-500 px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-ink-faint sm:w-auto"
        >
          {copied ? (
            <>
              <CheckIcon className="size-4 text-mindset" /> Copied
            </>
          ) : (
            "Copy link"
          )}
        </button>
      </div>
      <p className="text-xs text-ink-faint">
        Tip: bookmark it too. It&apos;s personal to your purchase - please don&apos;t share it.
      </p>
    </section>
  );
}
