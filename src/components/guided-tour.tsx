"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useStore } from "@/lib/store";
import { LionMouth } from "@/components/lion-mouth";
import { ChevronDownIcon, XIcon } from "@/components/icons";
import { hapticTap } from "@/lib/feedback-fx";

// The guided tour: Coach walks a new student round the app.
//
// Three things it is, deliberately.
//
// It is **the real app**, not a set of pictures. A stop can name a
// route, and moving to it navigates there first, then dims everything
// except the thing it is naming. A student ends the tour having
// already been everywhere once.
//
// It is **the same tour every time**. Coach's lines here are written
// and fixed - not generated, not personalised, not varying with the
// record. A tour is orientation, and orientation that says something
// different on the second run is disorientation. It is also the one
// place in this app where nothing is inferred from a student's data,
// so it works identically on day one and day one hundred.
//
// And where knowing *where* a thing is isn't enough, it **shows the
// thing being used**: a short film of the real screen, recorded from
// the app itself, playing in the card. Reading "tap a color to open
// its lessons" is not the same as watching a thumb do it.
//
// Offered once on a first visit, and available from the top bar, from
// Today, from Jump, and from the link /?tour=1.

const SEEN_KEY = "speak-better-tour-v1";

interface Stop {
  /** What to cut the hole around - the first visible match wins. */
  target?: string;
  /** Go here before showing this stop. */
  route?: string;
  title: string;
  /** Coach's line. Fixed, always the same, written to be read in his
   *  voice - short enough to take in at a glance. */
  body: string;
  /** A film of this part of the app being used, if one would say it
   *  faster than the sentence does. */
  film?: { src: string; poster: string };
}

const JOURNEY = { src: "/film/tour-journey.mp4", poster: "/film/tour-journey.jpg" };
const SKILLS = { src: "/film/tour-skills.mp4", poster: "/film/tour-skills.jpg" };
const DASHBOARD = { src: "/film/tour-dashboard.mp4", poster: "/film/tour-dashboard.jpg" };
const REVIEW = { src: "/film/record-to-review.mp4", poster: "/film/record-to-review.jpg" };
const DECK = { src: "/film/tour-deck.mp4", poster: "/film/tour-deck.jpg" };

const STOPS: Stop[] = [
  {
    title: "Let me show you around.",
    body: "I'm Coach. I watch every take you record and tell you exactly what I saw. Give me a minute and you'll know your way around all of this.",
    route: "/",
  },
  {
    target: "[data-tour='today']",
    route: "/",
    title: "Today",
    body: "Start here every day. It names one thing to do - one - and keeps your streak. Do that one thing and the road takes care of itself.",
  },
  {
    target: "[data-tour='challenges']",
    route: "/challenges",
    title: "The challenges",
    body: "This is the work. Twenty-four of them, in five phases, and every one ends with you on camera.",
  },
  {
    target: "[data-tour='journey']",
    route: "/challenges",
    title: "The STORY road",
    body: "S, T, O, R, Y - five stretches of road. Tap any circle to open its challenge, and the magnifier to look closer at where you are.",
    film: JOURNEY,
  },
  {
    target: "[data-tour='record']",
    route: "/challenges/speaking-baseline",
    title: "Recording a take",
    body: "Read the brief, warm up on the lessons underneath it, then record - or upload something you've already filmed. The clock keeps you honest.",
  },
  {
    route: "/challenges/speaking-baseline",
    title: "What comes back",
    body: "I watch the whole thing, then give you a score, your seven colors, what worked, and the one line to change next time. You hear it in my voice, with the words on screen.",
    film: REVIEW,
  },
  {
    target: "[data-tour='skills']",
    route: "/skills",
    title: "The skills",
    body: "Eighty-one lessons, one to two minutes each, sorted into the seven colors. Dip in - don't binge.",
  },
  {
    target: "[data-tour='dial']",
    route: "/skills",
    title: "The dial",
    body: "Drag your thumb round the ring to hear each color named, then tap to open its lessons.",
    film: SKILLS,
  },
  {
    target: "[data-tour='deck']",
    route: "/skills/cards",
    title: "The deck",
    body: "The same library as cards. Press a color to pull one, deal a full spread for one of every color, or shake your phone to shuffle.",
    film: DECK,
  },
  {
    target: "[data-tour='coach']",
    title: "Me",
    body: "Tap my face anywhere in the app. Ask me how you're developing, what to work on, or what I noticed last time - and read back every review I've written you.",
  },
  {
    target: "[data-tour='dashboard']",
    route: "/profile",
    title: "Your dashboard",
    body: "Everything you've done: challenges passed, lessons watched, minutes spent speaking, your spectrum, your streak.",
    film: DASHBOARD,
  },
  {
    target: "[data-tour='trophies']",
    route: "/profile",
    title: "The trophy case",
    body: "Forty-odd trophies, each earned by doing something specific. The empty stands tell you what's still out there.",
  },
  {
    target: "[data-tour='community']",
    route: "/",
    title: "The others on the road",
    body: "Who else is on your challenge right now, this week's boards, and everyone's before-and-afters. You're not doing this alone.",
  },
  {
    target: "[data-tour='jump']",
    route: "/",
    title: "One last thing",
    body: "Can't find something? This finds any lesson, challenge or page by name. That's the whole app - go and record something.",
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
    // A stop with nothing to ring leaves the last rect where it is;
    // the render ignores it, and setting state here would only cost a
    // cascading pass.
    if (!stop.target) return;
    const target = stop.target;
    let raf = 0;
    let tries = 0;
    let scrolled = false;
    const look = () => {
      // The same marker exists on the phone's bar and the laptop's rail;
      // only one of them is on screen, so take the first with a size.
      const el = [...document.querySelectorAll(target)].find((node) => {
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
            <p className="text-sm font-semibold text-ink">New here? Let me show you around.</p>
            <p className="text-xs text-ink-muted">
              A minute, and you&apos;ll know where everything is - with a look at each part being used.
            </p>
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

  // The first stop is Coach himself, centered, with nothing highlighted
  // - he introduces the place before pointing at any part of it.
  const opening = step === 0;

  // The hole: four dimmed panels around the target, so the thing being
  // named stays lit and everything else recedes. No target - the screen
  // simply dims and the card speaks.
  const pad = 8;
  const hole =
    box && stop.target && !opening
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
        <div className="absolute inset-0 bg-navy-950/88" onClick={done} />
      )}

      {/* The card: Coach, what this is, and - where it helps - the
          thing being used. */}
      <div
        className={`absolute inset-x-3 mx-auto flex max-w-sm flex-col gap-3 rounded-2xl border border-navy-500 bg-navy-850 p-4 shadow-2xl shadow-navy-950 ${
          opening
            ? "top-1/2 -translate-y-1/2"
            : below
              ? "bottom-[max(5.5rem,env(safe-area-inset-bottom))] sm:bottom-8"
              : "top-[max(5rem,env(safe-area-inset-top))]"
        }`}
      >
        <div className={`flex gap-3 ${opening ? "flex-col items-center text-center" : "items-start"}`}>
          <LionMouth level={0} className={opening ? "w-28 shrink-0" : "w-11 shrink-0"} />
          <div className={`flex min-w-0 flex-1 flex-col gap-1 ${opening ? "items-center" : ""}`}>
            {!opening && (
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-ink-faint">
                {step} of {STOPS.length - 1}
              </span>
            )}
            <h2 className={opening ? "text-xl font-bold text-ink text-balance" : "text-base font-bold text-ink"}>
              {stop.title}
            </h2>
            <p className="text-sm leading-snug text-ink-muted text-balance">{stop.body}</p>
          </div>
          {!opening && (
            <button type="button" onClick={done} aria-label="End the tour" className="grid size-8 shrink-0 place-items-center rounded-full text-ink-faint hover:text-ink">
              <XIcon className="size-4" />
            </button>
          )}
        </div>

        {/* The film, in a phone: the real screen, being used. */}
        {stop.film && <TourFilm key={stop.film.src} {...stop.film} />}

        <div className="flex items-center gap-2">
          {/* Where you are along the road. */}
          <span className="flex flex-1 items-center gap-1">
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
            {opening ? "Show me" : step === STOPS.length - 1 ? "Done" : "Next"}
            {step < STOPS.length - 1 && <ChevronDownIcon className="size-4 -rotate-90" />}
          </button>
        </div>

        {opening && (
          <button
            type="button"
            onClick={done}
            className="text-xs font-semibold text-ink-faint transition-colors hover:text-ink"
          >
            Not now
          </button>
        )}
      </div>
    </div>,
    host,
  );
}

/**
 * A film of the app being used, inside a phone.
 *
 * Muted, looping and playing the moment it appears - it is a diagram
 * that moves, not a video to decide about, so it carries no controls
 * and asks for no decision. The poster paints first so the card never
 * opens on a black rectangle.
 */
function TourFilm({ src, poster }: { src: string; poster: string }) {
  return (
    <div className="flex justify-center">
      <span className="relative block w-[8.5rem] shrink-0 rounded-[1.4rem] border-2 border-navy-500 bg-navy-950 p-1 shadow-xl shadow-navy-950/70">
        <span aria-hidden className="absolute left-1/2 top-1.5 z-10 h-1 w-10 -translate-x-1/2 rounded-full bg-navy-700" />
        <video
          src={src}
          poster={poster}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="block aspect-[390/844] w-full rounded-[1.1rem] object-cover"
        />
      </span>
    </div>
  );
}

/** Start the tour from anywhere - every "Take the tour" fires this. */
export function startTour() {
  window.dispatchEvent(new Event("speak-better:tour"));
}
