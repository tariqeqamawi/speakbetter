"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { XIcon } from "@/components/icons";
import { StageBackdrop } from "@/components/stage-backdrop";
import { TrophyArt } from "@/components/trophy-art";
import { DISC_Y, GRAND, OnceOnlyNote, type StageTrophy } from "@/components/trophy-stage";
import { ShareTrophyButton } from "@/components/share-trophy-button";
import { hapticCelebrate, playApplause, playCelebration, playCoachLine } from "@/lib/feedback-fx";
import { pickTrophyLine } from "@/data/greetings";

// The moment a trophy is won.
//
// It used to be a toast: a small drawn medal in the corner for six
// seconds. A trophy is the rarest thing the app gives anybody, and it
// was announced the way a saved setting is. So now the room it will
// live in comes to them: the trophy-room stage fills the screen, the
// house lights go down around the beam, the smoke rolls in it, and the
// trophy is lowered into the spotlight and set down on the disc - then
// its name, and what it was for.
//
// WHAT IT MUST NOT DO. Trap anybody: every part of it can be skipped,
// Escape closes it, focus lands on the way out and comes back to where
// it was. Move for somebody who asked for no motion: with reduced
// motion the trophy is simply there, lit, with its name, and there is
// no applause. Talk over Coach: the host holds it back while a review
// is being given (lib/reveal-hold.ts).

export function TrophyReveal({
  trophy,
  remaining = 0,
  onContinue,
  onSkipAll,
  studentName,
  showCaseLink = true,
  eyebrow = "Trophy won",
}: {
  trophy: StageTrophy;
  /** How many more are waiting after this one. */
  remaining?: number;
  onContinue: () => void;
  onSkipAll?: () => void;
  studentName: string;
  /** Off when it is being replayed from inside the case already. */
  showCaseLink?: boolean;
  eyebrow?: string;
}) {
  const primary = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const color = `var(--color-${trophy.color})`;
  // What Coach says about this one - picked once per trophy, from the
  // lines he recorded for it (data/greetings.ts). Never a model call:
  // a win should not wait on anything, or cost anything.
  // Picked once per trophy, so what is heard and what is shown are the
  // same line.
  // trophy.id is not read inside, but a new trophy must get a new line.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const line = useMemo(() => pickTrophyLine(), [trophy.id]);

  // In, and back out to where they were. The page underneath stops
  // scrolling while the stage is up.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      before?.focus?.();
    };
  }, []);

  // Each trophy gets its own moment: the chime, the buzz, the applause,
  // and focus on the button that moves things on.
  useEffect(() => {
    primary.current?.focus();
    playCelebration();
    hapticCelebrate();
    const stopApplause = playApplause();
    // Coach speaks as the trophy settles on the disc (the lowering
    // ends 2.5s in - see .reveal-lower). Without motion there is no
    // lowering to wait for, so he speaks straight away.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stopLine = playCoachLine(line.src, still ? 300 : 2500);
    return () => {
      stopApplause();
      stopLine();
    };
    // line is chosen per trophy; re-running on it would say it twice
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trophy.id]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onContinue();
      return;
    }
    // Tab stays inside the dialog.
    if (e.key !== "Tab" || !dialog.current) return;
    const focusable = [...dialog.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trophy-reveal-title"
      aria-describedby="trophy-reveal-message"
      onKeyDown={onKeyDown}
      className="reveal-backdrop fixed inset-0 z-[80] flex justify-center overflow-y-auto bg-navy-950/95 px-4 py-6 backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={onSkipAll ?? onContinue}
        aria-label="Close"
        className="absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-full border border-navy-600 bg-navy-900/80 text-ink-muted transition-colors hover:text-ink"
      >
        <XIcon className="size-5" />
      </button>

      <div className="my-auto flex w-full max-w-3xl flex-col items-center gap-5">
        <div
          key={trophy.id}
          onClick={(e) => e.currentTarget.parentElement?.classList.add("reveal-now")}
          className="relative aspect-[2/3] max-h-[60vh] w-full max-w-sm overflow-hidden rounded-3xl border border-navy-700 bg-[#03060d] sm:aspect-[1600/893] sm:max-w-3xl"
        >
          <StageBackdrop poster="/trophy/stage.jpg" video="/trophy/stage-smoke-v2.mp4" />

          {/* The house lights going down: the room darkens everywhere
              except the beam and the disc it lands on. */}
          <span
            aria-hidden
            className="reveal-dim pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(34% 95% at 50% ${DISC_Y * 60}%, transparent 45%, rgba(2,5,11,0.62) 100%)`,
            }}
          />

          {/* What the trophy throws on the disc, once it is standing
              on it. */}
          <span
            aria-hidden
            className="reveal-glow pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(34% 12% at 50% ${DISC_Y * 100}%, color-mix(in oklab, ${color} 34%, transparent), transparent 75%)`,
            }}
          />

          {/* Set down on the disc: the base sinks the same 4% into the
              floor it does on the stage in the case. */}
          <div
            className="absolute bottom-[28%] left-1/2 h-1/2 sm:h-[60%]"
            style={{ transform: `translateX(-50%) scale(${trophy.grand ? GRAND : 1})`, transformOrigin: "bottom" }}
          >
            <span className="reveal-lower block h-full">
              <TrophyArt src={trophy.zoom ?? trophy.image} won grand={trophy.grand} alt={trophy.name} className="h-full" />
            </span>
          </div>
        </div>

        <div className="reveal-words flex flex-col items-center gap-2 text-center">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-ink-faint">
            {eyebrow}
            {remaining > 0 && ` · ${remaining} more to come`}
          </span>
          <h2 id="trophy-reveal-title" className="text-3xl font-bold tracking-tight text-balance" style={{ color }}>
            {trophy.name}
          </h2>
          {trophy.message && (
            <p id="trophy-reveal-message" className="max-w-md text-sm text-ink-muted text-balance">
              {trophy.message}
            </p>
          )}
          {/* What Coach said, for anybody who could not hear it. */}
          <p className="text-sm font-semibold italic text-ink">
            &ldquo;{line.text}&rdquo; <span className="not-italic font-normal text-ink-faint">- Coach</span>
          </p>
          {trophy.onceOnly && <OnceOnlyNote />}

          <div className="mt-3 flex flex-wrap items-start justify-center gap-3">
            <button
              ref={primary}
              type="button"
              onClick={onContinue}
              className="inline-flex min-h-11 items-center rounded-full bg-ink px-6 text-sm font-bold text-navy-950 transition-opacity hover:opacity-90"
            >
              {remaining > 0 ? "Next trophy" : "Continue"}
            </button>
            {showCaseLink && (
              <Link
                href="/profile?tab=badges#trophy-case"
                onClick={onContinue}
                className="inline-flex min-h-11 items-center rounded-full border border-navy-500 px-5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
              >
                See it in your trophy case
              </Link>
            )}
            <ShareTrophyButton trophy={trophy} studentName={studentName} />
          </div>
          {remaining > 0 && onSkipAll && (
            <button
              type="button"
              onClick={onSkipAll}
              className="text-xs font-medium text-ink-faint underline-offset-4 hover:text-ink hover:underline"
            >
              Skip the rest
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
