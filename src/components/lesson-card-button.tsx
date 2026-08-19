"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LessonCard } from "@/components/lesson-card";
import { cardFor } from "@/data/deck";
import { DeckIcon, XIcon } from "@/components/icons";
import { hapticTap } from "@/lib/feedback-fx";

// The lesson's own card, called up beside the lesson.
//
// The card was written to be the fastest thing in the system - what the
// skill is, how you use it, and what it sounds like out of his mouth, on
// one face. That's exactly what somebody wants at the end of a video,
// and it beats a second list written for the same purpose. So the button
// beside the player opens the card rather than a panel of bullets, which
// also means a student meets the deck where the deck is useful instead
// of finding a tab of 79 cards they've never seen before.
//
// It opens lesson-side up - this card is being read, not pulled - and
// tapping it turns it over to the colored face, because half the point
// of the deck is that the color is the index.

export function LessonCardButton({ vimeoId }: { vimeoId: string }) {
  const [open, setOpen] = useState(false);
  const card = cardFor(vimeoId);
  // The demo has no Cards tab of its own, so the link would dead-end
  // there. The card itself still shows.
  const inDemo = usePathname().startsWith("/demo");

  // Escape closes it, and the page underneath holds still while it's up.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  // The two section introductions have no card, so they get no button.
  if (!card) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          hapticTap();
          setOpen(true);
        }}
        className={`flex min-h-9 items-center gap-1.5 rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-current ${card.category.textClass}`}
      >
        <DeckIcon className="size-4" />
        This lesson&apos;s card
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close the card"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-navy-950/75 backdrop-blur-sm"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${card.title} - lesson card`}
            className="panel-in relative flex flex-col items-center gap-4"
          >
            {/* Sized off the shorter dimension, so the card is whole on a
                phone in either orientation rather than cropped tall. */}
            <div style={{ width: "min(20rem, 78vw, calc(72vh * 89 / 127))" }}>
              <LessonCard data={card} startFlipped className="max-w-none" />
            </div>

            <p className="text-center text-xs text-ink-faint">
              Tap the card to turn it over
              {!inDemo && (
                <>
                  {" · "}
                  <Link
                    href="/skills/cards"
                    className="font-semibold text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
                  >
                    the whole deck
                  </Link>
                </>
              )}
            </p>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute -top-3 -right-3 flex size-9 items-center justify-center rounded-full border border-navy-600 bg-navy-850 text-ink-muted transition-colors hover:text-ink"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
