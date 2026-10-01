"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { EyeIcon } from "@/components/icons";

// A section's "what this is", as a small eye beside its name rather than
// a line of text with a chevron: tap it and a panel opens beneath with
// the explanation; tap it again, anywhere else, or press Escape, and it
// closes. The words a student reads once stay one tap away without
// taking a line of the screen every visit.

export function InfoEye({
  label,
  children,
  align = "left",
}: {
  /** What the eye opens, for screen readers ("What Skills is"). */
  label: string;
  children: ReactNode;
  /** Which edge of the eye the panel lines up with. */
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  // Which way the panel opens: as asked, unless that would run it off
  // the screen - then the other way.
  const [toRight, setToRight] = useState(align === "right");
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
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
    <div ref={box} className="relative inline-flex shrink-0 align-middle">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        title={label}
        onClick={() => {
          const r = box.current?.getBoundingClientRect();
          if (r) setToRight(r.left + 288 > window.innerWidth - 12 ? true : r.right - 288 < 12 ? false : align === "right");
          setOpen((v) => !v);
        }}
        className={`grid size-8 place-items-center rounded-full transition-colors ${
          open ? "bg-navy-700 text-ink" : "text-ink-faint hover:bg-navy-800 hover:text-ink"
        }`}
      >
        <EyeIcon className="size-[1.1rem]" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={label}
          className={`no-glass absolute top-full z-40 mt-1.5 flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-2 rounded-xl border border-navy-600 bg-navy-850 p-3.5 text-left text-sm font-normal normal-case tracking-normal text-ink-muted shadow-[0_16px_40px_-12px_rgb(2_5_11/0.95)] text-pretty ${
            toRight ? "right-0" : "left-0"
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
