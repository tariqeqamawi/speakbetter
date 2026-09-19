"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { declinePush, enablePush, needsInstallForPush, pushAsked, pushOn, pushSupported } from "@/lib/push-client";
import { LionMouth } from "@/components/lion-mouth";

// The one time the app asks to send notes: right after a first review,
// when the student has just seen what a note would be about. Asked
// once; a "no" is kept. On an iPhone in Safari the answer is to add
// the app to the home screen first, and it says so instead of asking
// for a permission Safari can't grant there.

export function PushPrompt() {
  const { state } = useStore();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"on" | "off" | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!pushSupported() && !needsInstallForPush()) return;
      if (pushAsked() || pushOn()) return;
      setShow(true);
    }, 600);
    return () => window.clearTimeout(t);
  }, []);

  if (!show) return null;
  const install = needsInstallForPush();

  return (
    <div className="coach-cue flex items-start gap-3 rounded-xl border border-navy-600 bg-navy-900/60 p-4">
      <span className="w-14 shrink-0 overflow-hidden rounded-full bg-navy-950/60">
        <LionMouth level={0} className="w-full translate-y-0.5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {done === "on" ? (
          <p className="text-sm text-ink">
            Done. A note when a review is ready, an evening nudge if a streak is on the line, and a word when
            you&apos;re close to the next rank - and nothing else.
          </p>
        ) : done === "off" ? (
          <p className="text-sm text-ink-muted">No problem - the app won&apos;t ask again.</p>
        ) : install ? (
          <>
            <p className="text-sm text-ink">
              Want a note when your review is ready? On an iPhone that works once Speak Better is on your home
              screen: tap Share, then <b className="font-semibold">Add to Home Screen</b>, and open it from there.
            </p>
            <button
              type="button"
              onClick={() => {
                declinePush();
                setShow(false);
              }}
              className="self-start text-xs font-medium text-ink-faint underline-offset-4 hover:text-ink hover:underline"
            >
              Not now
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-ink">
              Want a note when your review is ready? Your coach would also send an evening nudge if a streak is
              on the line, and a word when you&apos;re close to the next rank. Nothing else.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  const on = await enablePush(state);
                  setDone(on ? "on" : "off");
                  setBusy(false);
                }}
                className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-navy-900 transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Asking…" : "Yes, send them"}
              </button>
              <button
                type="button"
                onClick={() => {
                  declinePush();
                  setDone("off");
                }}
                className="rounded-lg border border-navy-600 px-4 py-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
              >
                No thanks
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
