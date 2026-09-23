"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useStore } from "@/lib/store";
import { LionMouth } from "@/components/lion-mouth";
import { XIcon } from "@/components/icons";
import { hapticTap } from "@/lib/feedback-fx";
import { TourRunner } from "@/components/tour-runner";
import { mainTour } from "@/data/tour-script";

// The whole-app tour: Coach walks a new student round the place once,
// out loud.
//
// The machinery is in tour-runner.tsx and the words are in
// data/tour-script.ts. What lives here is when it is offered and to
// whom: once on a first visit to Today, and on demand from the top
// bar, from Today, from Jump, and from /?tour=1.
//
// The short per-section tours (section-tour.tsx) share the same runner
// and the same script file, so they cannot drift from this one.

const SEEN_KEY = "speak-better-tour-v1";

export function GuidedTour() {
  const { state, ready } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [running, setRunning] = useState(false);
  const [offer, setOffer] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const seen = useRef(false);

  useEffect(() => {
    const t = window.setTimeout(() => setHost(document.body), 0);
    return () => window.clearTimeout(t);
  }, []);

  // Offered once, to a student who hasn't seen it. Today is where a
  // new student lands and where a tour makes sense to start; offering
  // it over a lesson they're watching is an interruption rather than a
  // welcome.
  useEffect(() => {
    if (!ready || !state.unlocked || seen.current || pathname !== "/") return;
    seen.current = true;
    const t = window.setTimeout(() => {
      try {
        if (!window.localStorage.getItem(SEEN_KEY)) setOffer(true);
      } catch {}
    }, 1200);
    return () => window.clearTimeout(t);
  }, [ready, state.unlocked, pathname]);

  // Opened from anywhere: every "Take the tour" fires this.
  useEffect(() => {
    const onOpen = () => {
      setOffer(false);
      setRunning(true);
    };
    window.addEventListener("speak-better:tour", onOpen);
    return () => window.removeEventListener("speak-better:tour", onOpen);
  }, []);

  // And asked for by link - `/?tour=1`, which is what Jump and any
  // other page links to, since the tour starts on Today and a link is
  // the one way to start it from somewhere else. The query is wiped
  // once it has fired so a reload doesn't start it again.
  const asked = useRef(false);
  useEffect(() => {
    if (!ready || !state.unlocked || asked.current) return;
    if (!new URLSearchParams(window.location.search).has("tour")) return;
    asked.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    startTour();
  }, [ready, state.unlocked, pathname]);

  // While the tour or its offer is up, other pop-ins stand down.
  useEffect(() => {
    const on = offer || running;
    if (on) document.body.dataset.tour = "1";
    else delete document.body.dataset.tour;
    return () => {
      delete document.body.dataset.tour;
    };
  }, [offer, running]);

  const close = useCallback(
    (finished: boolean) => {
      setRunning(false);
      setOffer(false);
      try {
        window.localStorage.setItem(SEEN_KEY, "1");
      } catch {}
      // Walked all the way round: back to Today, where the day starts.
      if (finished) router.push("/");
    },
    [router],
  );

  if (!host || !ready || !state.unlocked) return null;

  if (running) return <TourRunner stops={mainTour} onClose={close} />;

  // The offer, once: a small card rather than a wall.
  if (offer)
    return createPortal(
      <div className="fixed inset-x-3 bottom-[max(5.5rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-sm rounded-2xl border border-navy-500 bg-navy-850/98 p-4 shadow-2xl shadow-navy-950/80 backdrop-blur sm:bottom-6">
        <div className="flex items-start gap-3">
          <LionMouth level={0} className="w-12 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-sm font-semibold text-ink">New here? Let me show you around.</p>
            <p className="text-xs text-ink-muted">
              A minute, out loud - where everything is, and a look at each part being used.
            </p>
          </div>
          <button
            type="button"
            onClick={() => close(false)}
            aria-label="No thanks"
            className="grid size-8 shrink-0 place-items-center rounded-full text-ink-faint hover:text-ink"
          >
            <XIcon className="size-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            hapticTap();
            setOffer(false);
            setRunning(true);
          }}
          className="coach-pill mt-3 flex min-h-11 w-full items-center justify-center rounded-full text-sm font-bold text-navy-950"
        >
          <span className="text-navy-950">Take the guided tour</span>
        </button>
      </div>,
      host,
    );

  return null;
}

/** Start the whole-app tour from anywhere. */
export function startTour() {
  window.dispatchEvent(new Event("speak-better:tour"));
}
