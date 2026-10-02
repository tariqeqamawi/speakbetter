"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { InfoIcon } from "@/components/icons";

// A section's "what this is", as a small "i" beside its name rather than
// a line of text with a chevron: tap it and a panel opens beneath with
// the explanation; tap it again, anywhere else, or press Escape, and it
// closes. The words a student reads once stay one tap away without
// taking a line of the screen every visit.
//
// The panel is drawn on the page's top layer, placed from the button's
// position and held inside the screen. It used to hang off the button
// itself, flipped left or right to fit - and on a phone the flip pushed
// it past the left edge, cutting off the start of every line.

/** The gap kept between the panel and the screen's edges. */
const EDGE = 12;
/** The panel's width where the screen allows it. */
const WIDTH = 288;

export function InfoEye({
  label,
  children,
  align = "left",
}: {
  /** What the button opens, for screen readers ("What Skills is"). */
  label: string;
  children: ReactNode;
  /** Which edge of the button the panel lines up with, room allowing. */
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<{ left: number; top: number; width: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Lined up with the button as asked, then nudged in so no part of it
  // leaves the screen. Measured again if the page scrolls or turns.
  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const r = button.current?.getBoundingClientRect();
      if (!r) return;
      const vw = document.documentElement.clientWidth;
      const width = Math.min(WIDTH, vw - EDGE * 2);
      const wanted = align === "right" ? r.right - width : r.left;
      const left = Math.min(Math.max(wanted, EDGE), vw - width - EDGE);
      setPlace({ left, top: r.bottom + 6, width });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!button.current?.contains(t) && !panel.current?.contains(t)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div className="relative inline-flex shrink-0 align-middle">
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-expanded={open}
        title={label}
        onClick={() => setOpen((v) => !v)}
        className={`grid size-8 place-items-center rounded-full transition-colors ${
          open ? "bg-navy-700 text-ink" : "text-ink-faint hover:bg-navy-800 hover:text-ink"
        }`}
      >
        <InfoIcon className="size-[1.1rem]" />
      </button>
      {open &&
        place &&
        createPortal(
          <div
            ref={panel}
            role="dialog"
            aria-label={label}
            style={{ left: place.left, top: place.top, width: place.width, maxHeight: `calc(100dvh - ${place.top + EDGE}px)` }}
            className="no-glass fixed z-[60] flex flex-col gap-2 overflow-y-auto rounded-xl border border-navy-600 bg-navy-850 p-3.5 text-left text-sm font-normal normal-case tracking-normal text-ink-muted shadow-[0_16px_40px_-12px_rgb(2_5_11/0.95)] text-pretty"
          >
            {children}
          </div>,
          document.body,
        )}
    </div>
  );
}
