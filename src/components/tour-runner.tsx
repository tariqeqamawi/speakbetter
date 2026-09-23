"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { TalkingLion } from "@/components/talking-lion";
import { ChevronDownIcon, XIcon } from "@/components/icons";
import { hapticTap } from "@/lib/feedback-fx";
import { stopAudio, type TourStop } from "@/data/tour-script";

// One tour machine, two uses: the whole app (guided-tour.tsx) and a
// single section (section-tour.tsx). Everything about how a tour
// behaves lives here, so the short ones cannot drift from the long
// one.
//
// What a stop does, in order: go to its route if it names one, find
// the first VISIBLE element matching its target (the same marker sits
// on the phone's bar and the laptop's rail, and ringing the hidden one
// dims the screen and points at nothing), scroll it into view, cut a
// hole around it, and play Coach's line.
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
  const opening = step === 0;
  const last = step === stops.length - 1;

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
          <div aria-hidden className="tour-ring pointer-events-none absolute rounded-2xl ring-2 ring-storytelling" style={hole} />
        </>
      ) : (
        <div className="absolute inset-0 bg-navy-950/88" onClick={done} />
      )}

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
          {/* Coach: centre stage for the hello, then into the corner.
              He is the same element either way, so the browser moves
              him rather than swapping one lion for another. */}
          <span className={`tour-lion shrink-0 ${opening ? "w-32" : "w-11"}`}>
            <TalkingLion
              key={stop.id}
              bare
              controls={false}
              audioSrc={muted ? undefined : stopAudio(stop.id)}
              autoPlay={!muted}
              onBlocked={() => setBlocked(true)}
            />
          </span>

          <div className={`flex min-w-0 flex-1 flex-col gap-1 ${opening ? "items-center" : ""}`}>
            {!opening && (
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-ink-faint">
                {step} of {stops.length - 1}
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

        {stop.film && <TourFilm key={stop.film.src} {...stop.film} />}

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
              onClick={() => setStep(step - 1)}
              aria-label="Back"
              className="grid size-9 place-items-center rounded-full border border-navy-600 text-ink-muted transition-colors hover:text-ink"
            >
              <ChevronDownIcon className="size-4 rotate-90" />
            </button>
          )}
          <button
            type="button"
            onClick={next}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-ink px-5 text-sm font-bold text-navy-900 transition-opacity hover:opacity-90"
          >
            {opening ? "Show me" : last ? "Done" : "Next"}
            {!last && <ChevronDownIcon className="size-4 -rotate-90" />}
          </button>
        </div>

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
