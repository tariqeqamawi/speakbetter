"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useStore } from "@/lib/store";
import { LionMouth } from "@/components/lion-mouth";
import { ChevronDownIcon, XIcon } from "@/components/icons";
import { hapticTap } from "@/lib/feedback-fx";

// The guided tour: seven stops that show a new student where everything
// is. Each stop dims the app, cuts a hole around the thing it's naming,
// and says what it's for in a line - so orientation costs a minute and
// nothing has to be discovered by accident.
//
// The tour walks the app itself rather than a set of pictures: a stop
// can name a route, and moving to it navigates there first, so what's
// highlighted is the real thing. Stops whose target isn't on screen
// (a phone hides the desktop nav, and the other way round) are skipped.
//
// Offered once, on the first visit, and always available from the
// dashboard. Whether it's been seen is kept on the device.

const SEEN_KEY = "speak-better-tour-v1";

interface Stop {
  /** What to cut the hole around - the first match wins. */
  target: string;
  title: string;
  body: string;
  /** Go here before showing this stop. */
  route?: string;
}

const STOPS: Stop[] = [
  {
    target: "[data-tour='today']",
    route: "/",
    title: "Today",
    body: "Your home. What to do next, your streak, and how far along the road you are - start here each day.",
  },
  {
    target: "[data-tour='challenges']",
    route: "/challenges",
    title: "The STORY journey",
    body: "Twenty-four challenges in five phases. Tap a letter to open that stretch of the road, then tap a stop to see its challenge.",
  },
  {
    target: "[data-tour='record']",
    route: "/challenges/speaking-baseline",
    title: "Record your take",
    body: "Every challenge ends the same way: record yourself, or choose a video from your library. The clock keeps you honest.",
  },
  {
    target: "[data-tour='skills']",
    route: "/skills",
    title: "The skills",
    body: "Eighty-one short lessons across the seven colours of speaking. Dip in; don't binge. Each one has its own card.",
  },
  {
    target: "[data-tour='coach']",
    title: "Coach",
    body: "The lion who watches every take. Ask him how you're developing, and read back every review he's given you.",
  },
  {
    target: "[data-tour='dashboard']",
    route: "/profile",
    title: "Your dashboard",
    body: "Challenges, lessons, your spectrum, your streak and your trophies - everything you've done, in one place.",
  },
  {
    target: "[data-tour='community']",
    route: "/",
    title: "The others on the road",
    body: "Who's on your challenge right now, this week's board, and everyone's before-and-afters - all from here. You're not doing this alone.",
  },
];

export function GuidedTour() {
  const { state, ready } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [step, setStep] = useState<number | null>(null);
  const [offer, setOffer] = useState(false);
  const [box, setBox] = useState<DOMRect | null>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const seen = useRef(false);

  useEffect(() => {
    const t = window.setTimeout(() => setHost(document.body), 0);
    return () => window.clearTimeout(t);
  }, []);

  // Offered once, to a student who hasn't seen it.
  useEffect(() => {
    // Today is where a new student lands, and where a tour makes
    // sense to start; offering it over a lesson they're watching is
    // an interruption rather than a welcome.
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
      setStep(0);
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
    // Through the same event every other entry point uses, rather than
    // setting state here: one way in, and no cascading render.
    startTour();
  }, [ready, state.unlocked, pathname]);

  // While the tour or its offer is up, other pop-ins stand down.
  useEffect(() => {
    const on = offer || step !== null;
    if (on) document.body.dataset.tour = "1";
    else delete document.body.dataset.tour;
    return () => {
      delete document.body.dataset.tour;
    };
  }, [offer, step]);

  const close = useCallback(
    (finished = false) => {
      setStep(null);
      setOffer(false);
      try {
        window.localStorage.setItem(SEEN_KEY, "1");
      } catch {}
      // Walked all the way round: back to Today, where the day starts.
      if (finished) router.push("/");
    },
    [router],
  );
  /** For the places that hand a click event to their handler. */
  const done = useCallback(() => close(false), [close]);

  // Find the current stop's target, following it as the page settles.
  const stop = step === null ? null : STOPS[step];
  useEffect(() => {
    if (!stop) return;
    if (stop.route && pathname !== stop.route) {
      router.push(stop.route);
      return;
    }
    let raf = 0;
    let tries = 0;
    let scrolled = false;
    const look = () => {
      // The same marker exists on the phone's bar and the laptop's rail;
      // only one of them is on screen, so take the first with a size.
      const el = [...document.querySelectorAll(stop.target)].find((node) => {
        const r = node.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      if (el) {
        if (!scrolled) {
          scrolled = true;
          el.scrollIntoView({ block: "center", behavior: "smooth" });
        }
        setBox(el.getBoundingClientRect());
        // Follow it while the scroll settles.
        if (tries < 60) {
          tries++;
          raf = requestAnimationFrame(look);
        }
        return;
      }
      if (tries > 60) {
        setBox(null);
        return;
      }
      tries++;
      raf = requestAnimationFrame(look);
    };
    raf = requestAnimationFrame(look);
    return () => cancelAnimationFrame(raf);
  }, [stop, pathname, router]);

  useEffect(() => {
    if (step === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") done();
      if (e.key === "ArrowRight") setStep((n) => (n === null ? null : Math.min(STOPS.length - 1, n + 1)));
      if (e.key === "ArrowLeft") setStep((n) => (n === null ? null : Math.max(0, n - 1)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, done]);

  if (!host || !ready || !state.unlocked) return null;

  // The offer, once: a small card rather than a wall.
  if (offer && step === null) {
    return createPortal(
      <div className="fixed inset-x-3 bottom-[max(5.5rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-sm rounded-2xl border border-navy-500 bg-navy-850/98 p-4 shadow-2xl shadow-navy-950/80 backdrop-blur sm:bottom-6">
        <div className="flex items-start gap-3">
          <LionMouth level={0} className="w-12 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-sm font-semibold text-ink">New here? I&apos;ll show you around.</p>
            <p className="text-xs text-ink-muted">Seven stops, about a minute - where everything lives and how to get to it.</p>
          </div>
          <button type="button" onClick={done} aria-label="No thanks" className="grid size-8 shrink-0 place-items-center rounded-full text-ink-faint hover:text-ink">
            <XIcon className="size-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            hapticTap();
            setOffer(false);
            setStep(0);
          }}
          className="coach-pill mt-3 flex min-h-11 w-full items-center justify-center rounded-full text-sm font-bold text-navy-950"
        >
          <span className="text-navy-950">Take the guided tour</span>
        </button>
      </div>,
      host,
    );
  }

  if (step === null || !stop) return null;

  // The hole: four dimmed panels around the target, so the thing being
  // named stays lit and everything else recedes. No target - the screen
  // simply dims and the card speaks.
  const pad = 8;
  const hole = box
    ? {
        top: Math.max(0, box.top - pad),
        left: Math.max(0, box.left - pad),
        width: box.width + pad * 2,
        height: box.height + pad * 2,
      }
    : null;
  const below = hole ? hole.top + hole.height < window.innerHeight * 0.55 : true;

  return createPortal(
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={`Guided tour: ${stop.title}`}>
      {hole ? (
        <>
          <div className="absolute inset-x-0 top-0 bg-navy-950/82" style={{ height: hole.top }} onClick={done} />
          <div
            className="absolute bg-navy-950/82"
            style={{ top: hole.top, left: 0, width: hole.left, height: hole.height }}
            onClick={done}
          />
          <div
            className="absolute bg-navy-950/82"
            style={{ top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }}
            onClick={done}
          />
          <div
            className="absolute inset-x-0 bottom-0 bg-navy-950/82"
            style={{ top: hole.top + hole.height }}
            onClick={done}
          />
          {/* The ring around what's being named. */}
          <div
            aria-hidden
            className="tour-ring pointer-events-none absolute rounded-2xl ring-2 ring-storytelling"
            style={hole}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-navy-950/82" onClick={done} />
      )}

      {/* The card: what this is, and the way on. */}
      <div
        className={`absolute inset-x-3 mx-auto max-w-sm rounded-2xl border border-navy-500 bg-navy-850 p-4 shadow-2xl shadow-navy-950 ${
          below ? "bottom-[max(5.5rem,env(safe-area-inset-bottom))] sm:bottom-8" : "top-[max(5rem,env(safe-area-inset-top))]"
        }`}
      >
        <div className="flex items-start gap-3">
          <LionMouth level={0} className="w-11 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-ink-faint">
              {step + 1} of {STOPS.length}
            </span>
            <h2 className="text-base font-bold text-ink">{stop.title}</h2>
            <p className="text-sm leading-snug text-ink-muted">{stop.body}</p>
          </div>
          <button type="button" onClick={done} aria-label="End the tour" className="grid size-8 shrink-0 place-items-center rounded-full text-ink-faint hover:text-ink">
            <XIcon className="size-4" />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {/* Where you are in the seven. */}
          <span className="flex flex-1 items-center gap-1.5">
            {STOPS.map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-storytelling" : "bg-navy-600"}`}
              />
            ))}
          </span>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              aria-label="Back"
              className="grid size-9 place-items-center rounded-full border border-navy-600 text-ink-muted transition-colors hover:text-ink"
            >
              <ChevronDownIcon className="size-4 rotate-90" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              hapticTap();
              if (step === STOPS.length - 1) close(true);
              else setStep(step + 1);
            }}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-ink px-5 text-sm font-bold text-navy-900 transition-opacity hover:opacity-90"
          >
            {step === STOPS.length - 1 ? "Done" : "Next"}
            {step < STOPS.length - 1 && <ChevronDownIcon className="size-4 -rotate-90" />}
          </button>
        </div>
      </div>
    </div>,
    host,
  );
}

/** Start the tour from anywhere - the dashboard's link fires this. */
export function startTour() {
  window.dispatchEvent(new Event("speak-better:tour"));
}
