"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { TalkingLion, type Phrase } from "@/components/talking-lion";
import { ChevronDownIcon, XIcon } from "@/components/icons";
import { hapticTap } from "@/lib/feedback-fx";
import { stopAudio, type TourStop } from "@/data/tour-script";

// One tour machine, two uses: the whole app (guided-tour.tsx) and a
// single section (section-tour.tsx). Everything about how a tour
// behaves lives here, so the short ones cannot drift from the long
// one.
//
// How a stop is shown depends on the size of the screen, because the
// two sizes have opposite problems.
//
// ON A PHONE the card that explains a highlight covers the thing being
// highlighted; what is left of the app is a strip above it. So where
// there is a film of that part being used, the FILM is the stop: it
// fills the screen, Coach talks over it from the corner, and a student
// watches somebody do the thing they are about to do.
//
// ON A LAPTOP the card is a small box in a large window and the app is
// perfectly visible around it, so the live thing is better than a film
// of it: go to the stop's route, find the first VISIBLE element
// matching its target (the same marker sits on the phone's bar and the
// laptop's rail, and ringing the hidden one dims the screen and points
// at nothing), scroll it into view, and cut a hole around it.
//
// A stop with no film rings the live element at either size.
//
// Coach arrives in the middle of the screen at full size for the first
// stop, says hello, and then retreats to the corner of the card for
// the rest - the same move a person makes when they have introduced
// themselves and want to get on with it.
//
// His voice comes from files built once (scripts/build-tour-voice.mjs).
// If a clip is missing or the browser refuses to autoplay, the tour
// still works: the words are on the card, and a speaker button offers
// the audio on a tap.

export function TourRunner({
  stops,
  onClose,
  /** Where to land when the tour is walked all the way to the end. */
  finishRoute,
}: {
  stops: TourStop[];
  onClose: (finished: boolean) => void;
  finishRoute?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [step, setStep] = useState(0);
  const [box, setBox] = useState<DOMRect | null>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [muted, setMuted] = useState(() => {
    // The student's own choice about sound, kept between tours. Read
    // as the starting value rather than in an effect: it is where the
    // switch begins, not a thing to keep in step with.
    try {
      return window.localStorage.getItem("speak-better-tour-muted") === "1";
    } catch {
      return false;
    }
  });
  const [blocked, setBlocked] = useState(false);
  // Wide enough that the card leaves the app visible around it.
  const [wide, setWide] = useState(() => {
    try {
      return window.matchMedia("(min-width: 768px)").matches;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const on = (e: MediaQueryListEvent) => setWide(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setHost(document.body), 0);
    return () => window.clearTimeout(t);
  }, []);

  const toggleMute = () => {
    setMuted((m) => {
      try {
        window.localStorage.setItem("speak-better-tour-muted", m ? "0" : "1");
      } catch {}
      return !m;
    });
  };

  const stop = stops[step];
  // Whether this stop is Coach introducing himself, rather than
  // whether it happens to be first: a section tour has no
  // introduction and its first stop is a real one.
  const opening = stop?.intro === true;
  const last = step === stops.length - 1;
  const offset = stops[0]?.intro ? 0 : 1;
  // Some advice only makes sense on one kind of screen - telling
  // somebody at a laptop to tap the portrait button is telling them
  // about a control they do not have. The clip follows the words.
  const saysWide = wide && Boolean(stop?.bodyWide);
  const line = saysWide ? stop!.bodyWide! : stop?.body;
  const clip = saysWide ? `${stop!.id}-wide` : stop?.id;

  // What Coach is saying right now, a line at a time.
  //
  // WHY NOT A PARAGRAPH. A tour stop used to put its whole sentence on
  // screen at once while the voice worked through it, which asks
  // somebody to read and listen to different words at the same time -
  // and reading is faster, so they finish, look away, and miss what is
  // being pointed at. One line at a time, with the word being spoken
  // lit, means the eye is on the word the ear is on. It is the same
  // treatment a review gets, deliberately: a student meets it here on
  // their first minute in the app and recognises it later when it is
  // their own take being talked about.
  //
  // The timing comes from the audio element itself (see onSay in
  // talking-lion.tsx), so the highlight cannot drift from the voice.
  // Stamped with the clip it belongs to, so a new stop starts silent
  // rather than holding the last line of the one before - and without
  // an effect whose only job is to clear state that a render can
  // simply decline to use.
  const [said, setSaid] = useState<{ clip?: string; phrase?: Phrase; word: number }>({ word: -1 });
  const say = useCallback(
    (phrase: Phrase | undefined, word: number) => {
      setSaid((was) => (was.clip === clip && was.phrase === phrase && was.word === word ? was : { clip, phrase, word }));
    },
    [clip],
  );
  const live = said.clip === clip ? said : { phrase: undefined, word: -1 };

  // Find what this stop is pointing at, and follow it while the page
  // settles under it.
  useEffect(() => {
    if (!stop) return;
    if (stop.route && pathname !== stop.route) {
      router.push(stop.route);
      return;
    }
    if (!stop.target) return;
    const target = stop.target;
    let raf = 0;
    let tries = 0;
    let scrolled = false;
    const look = () => {
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

  const done = useCallback(() => onClose(false), [onClose]);

  const next = useCallback(() => {
    hapticTap();
    if (last) {
      if (finishRoute) router.push(finishRoute);
      onClose(true);
    } else {
      setStep((n) => n + 1);
    }
  }, [last, finishRoute, router, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") done();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") setStep((n) => Math.max(0, n - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, next]);

  if (!host || !stop) return null;

  // A film takes the screen on a phone. On a laptop the live thing is
  // right there behind a small card, so it gets ringed instead.
  const staged = Boolean(stop.film) && !wide && !opening;
  const pad = 8;
  const hole =
    box && stop.target && !opening && !staged
      ? {
          top: Math.max(0, box.top - pad),
          left: Math.max(0, box.left - pad),
          width: box.width + pad * 2,
          height: box.height + pad * 2,
        }
      : null;

  if (staged && stop.film)
    return createPortal(
      <div className="fixed inset-0 z-[60] flex flex-col bg-navy-950/95 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Guided tour: ${stop.title}`}>
        {/* The film, as big as the screen will allow. */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <span className="relative block h-full max-h-full overflow-hidden rounded-[1.6rem] border-2 border-navy-600 bg-navy-950 shadow-2xl shadow-navy-950">
            <video
              key={stop.film.src}
              src={stop.film.src}
              poster={stop.film.poster}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="block h-full w-auto max-w-full object-contain"
            />
          </span>

          <button
            type="button"
            onClick={done}
            aria-label="End the tour"
            className="absolute right-5 top-[max(1.4rem,calc(env(safe-area-inset-top)+0.4rem))] grid size-9 place-items-center rounded-full border border-navy-600 bg-navy-950/80 text-ink-faint backdrop-blur transition-colors hover:text-ink"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Coach, talking over it from the corner. */}
        <div className="shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          <div className="mx-auto flex max-w-sm flex-col gap-3 rounded-2xl border border-navy-500 bg-navy-850/95 p-3.5 shadow-2xl shadow-navy-950 backdrop-blur">
            <div className="flex items-start gap-3">
              <span className="tour-lion w-12 shrink-0">
                <TalkingLion
                  key={clip}
                  bare
                  controls={false}
                  audioSrc={muted ? undefined : stopAudio(clip!)}
                  text={muted ? undefined : line}
                  onSay={say}
                  autoPlay={!muted}
                  onBlocked={() => setBlocked(true)}
                />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-ink-faint">
                  {step + offset} of {stops.length - 1 + offset}
                </span>
                <h2 className="text-base font-bold leading-tight text-ink">{stop.title}</h2>
                {/* One line at a time, over the film. The caption box
                    holds its height so the card doesn't jump as
                    phrases come and go. */}
                <span className="flex min-h-11 items-center">
                  <Caption phrase={live.phrase} word={live.word} line={line} />
                </span>
              </div>
            </div>
            <Controls
              step={step}
              stops={stops}
              opening={opening}
              last={last}
              muted={muted}
              blocked={blocked}
              toggleMute={toggleMute}
              back={() => setStep(step - 1)}
              next={next}
            />
          </div>
        </div>
      </div>,
      host,
    );

  return createPortal(
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={`Guided tour: ${stop.title}`}>
      {/* The screen is NOT dimmed.
          
          Four black panels and a cut-out ring were four fifths of the
          screen spent hiding the app in order to point at one twentieth
          of it - during a tour whose entire job is showing somebody the
          app. What is left is a ring around the thing being talked
          about and a tap-anywhere-else to leave, so the app stays lit
          and legible and the eye is guided rather than the alternative
          being blacked out. */}
      {hole ? (
        <>
          <div className="absolute inset-0" onClick={done} />
          <div
            aria-hidden
            className="tour-ring pointer-events-none absolute rounded-2xl ring-2 ring-storytelling"
            style={hole}
          />
        </>
      ) : (
        /* Dim, when Coach is the thing on screen.
           
           The tour deliberately does not black out the app while it is
           pointing AT the app - four panels and a cut-out ring spend
           four fifths of the screen hiding the thing being shown. But
           the hello is the opposite case: there is nothing to look at
           except Coach, and a half-lit dashboard behind his head is
           competing with him for the one moment that is his. So the
           stops with a target stay lit, and the stops without one -
           the hello, and any stop whose target is off screen - go
           properly dark. */
        <div
          className={`absolute inset-0 transition-colors duration-500 ${
            opening ? "bg-navy-950" : "bg-navy-950/80"
          }`}
          onClick={done}
        />
      )}

      {/* Out of the way, at the foot of the screen.
          
          It used to be a padded card that moved above or below the
          highlight depending on where that was, which meant the words
          arrived somewhere different each stop and often on top of the
          thing they were describing. A caption strip stays where
          captions stay: one place, the bottom, minimal, so the screen
          above it belongs to the app being shown. */}
      <div
        className={`absolute inset-x-2 mx-auto flex flex-col gap-2 transition-all duration-500 ease-out ${
          opening
            ? "top-1/2 max-w-md -translate-y-1/2 items-center"
            : "bottom-[max(4.75rem,env(safe-area-inset-bottom))] max-w-xl rounded-xl border border-navy-600 bg-navy-950/92 px-3 py-2 backdrop-blur sm:bottom-6"
        }`}
      >
        <div className={`flex gap-3 ${opening ? "flex-col items-center text-center" : "items-start"}`}>
          {/* Coach: centre stage for the hello, then into the corner.
              He is the same element either way, so the browser moves
              him rather than swapping one lion for another. */}
          {/* Coach at full size for the hello - the face IS the screen
              for those fifteen seconds - then the same element travels
              down to a thumbnail in the corner of the card. One
              element, so the browser moves him; two would be a cut. */}
          <span
            className={`tour-lion shrink-0 transition-[width] duration-500 ease-out ${
              opening ? "w-[23rem] max-w-[88vw] sm:w-[27rem]" : "w-9"
            }`}
          >
            <TalkingLion
              key={clip}
              bare
              controls={false}
              audioSrc={muted ? undefined : stopAudio(clip!)}
              text={muted ? undefined : line}
              onSay={say}
              autoPlay={!muted}
              onBlocked={() => setBlocked(true)}
            />
          </span>

          <div className={`flex min-w-0 flex-1 flex-col gap-1 ${opening ? "items-center" : ""}`}>
            {/* The title is the opening's business. Mid-tour it is a
                third line competing with the one sentence that
                matters, so the step count carries it instead. */}
            {opening ? (
              <h2 className="text-2xl font-bold text-ink text-balance sm:text-3xl">{stop.title}</h2>
            ) : (
              <span className="text-[0.55rem] font-semibold uppercase tracking-[0.25em] text-ink-faint">
                {stop.title} · {step + offset} of {stops.length - 1 + offset}
              </span>
            )}
            {/* The words, one line at a time. The box keeps its height
                so neither the card at the foot of the screen nor the
                hello in the middle of it jumps as lines change. */}
            <span className={`flex items-center ${opening ? "min-h-[4.5rem]" : "min-h-10"}`}>
              <Caption phrase={live.phrase} word={live.word} line={line} big={opening} />
            </span>
          </div>

          {!opening && (
            <button type="button" onClick={done} aria-label="End the tour" className="grid size-8 shrink-0 place-items-center rounded-full text-ink-faint hover:text-ink">
              <XIcon className="size-4" />
            </button>
          )}
        </div>

        <Controls
          step={step}
          stops={stops}
          opening={opening}
          last={last}
          muted={muted}
          blocked={blocked}
          toggleMute={toggleMute}
          back={() => setStep(step - 1)}
          next={next}
        />

        {opening && (
          <button type="button" onClick={done} className="text-xs font-semibold text-ink-faint transition-colors hover:text-ink">
            Not now
          </button>
        )}
      </div>
    </div>,
    host,
  );
}

/** The row along the bottom of every stop: where you are, his voice,
 *  back, and on. One copy, so the staged stop and the plain one cannot
 *  drift apart. */
/**
 * The line Coach is on, with the word he is on lit.
 *
 * Falls back to the whole sentence when there is no clock to follow -
 * muted, or a browser that refused to start the sound. A caption with
 * nothing driving it would otherwise be a blank strip where the words
 * used to be, which is worse than the paragraph it replaced.
 */
function Caption({
  phrase,
  word,
  line,
  big = false,
}: {
  phrase?: Phrase;
  word: number;
  line?: string;
  big?: boolean;
}) {
  if (!phrase) {
    return (
      <p className={`text-ink-muted text-balance ${big ? "text-base leading-relaxed" : "text-sm leading-snug"}`}>
        {line}
      </p>
    );
  }
  return (
    <p
      key={phrase.text}
      className={`coach-cue text-balance font-semibold ${big ? "text-xl leading-snug sm:text-2xl" : "text-base leading-snug"}`}
    >
      {phrase.words.map((w, i) => (
        <span
          key={i}
          className={`inline-block origin-bottom mx-[0.2em] transition-[transform,color] duration-150 ${
            i === word
              ? `caption-live scale-[1.14] ${phrase.colorClass}`
              : i < word
                ? "text-ink"
                : "text-ink-faint"
          }`}
        >
          {w.text}
        </span>
      ))}
    </p>
  );
}

function Controls({
  step,
  stops,
  opening,
  last,
  muted,
  blocked,
  toggleMute,
  back,
  next,
}: {
  step: number;
  stops: TourStop[];
  opening: boolean;
  last: boolean;
  muted: boolean;
  blocked: boolean;
  toggleMute: () => void;
  back: () => void;
  next: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex flex-1 items-center gap-1">
        {stops.map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-storytelling" : "bg-navy-600"}`}
          />
        ))}
      </span>
      {/* His voice, on or off - and the way back in when a browser
          refused to start it without a tap. */}
      <button
        type="button"
        onClick={toggleMute}
        aria-pressed={!muted}
        aria-label={muted ? "Let Coach speak" : "Mute Coach"}
        className={`grid size-9 shrink-0 place-items-center rounded-full border transition-colors ${
          muted || blocked ? "border-navy-600 text-ink-faint hover:text-ink" : "border-storytelling/60 text-storytelling"
        }`}
      >
        <SpeakerIcon muted={muted} className="size-4" />
      </button>
      {step > 0 && (
        <button
          type="button"
          onClick={back}
          aria-label="Back"
          className="grid size-9 shrink-0 place-items-center rounded-full border border-navy-600 text-ink-muted transition-colors hover:text-ink"
        >
          <ChevronDownIcon className="size-4 rotate-90" />
        </button>
      )}
      <button
        type="button"
        onClick={next}
        className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-ink px-5 text-sm font-bold text-navy-900 transition-opacity hover:opacity-90"
      >
        {opening ? "Show me" : last ? "Done" : "Next"}
        {!last && <ChevronDownIcon className="size-4 -rotate-90" />}
      </button>
    </div>
  );
}

function SpeakerIcon({ muted, className = "size-4" }: { muted: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" />
      {muted ? (
        <>
          <path d="M16.5 9.5l4 5" />
          <path d="M20.5 9.5l-4 5" />
        </>
      ) : (
        <>
          <path d="M16 9.6a3.6 3.6 0 0 1 0 4.8" />
          <path d="M18.6 7.2a7 7 0 0 1 0 9.6" />
        </>
      )}
    </svg>
  );
}
