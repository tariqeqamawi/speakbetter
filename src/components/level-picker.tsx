"use client";

import { useEffect, useRef, useState } from "react";
import { useStore, type Level } from "@/lib/store";
import { LevelIcon, levelMeta } from "@/components/level-icon";

export const levelOrder: Level[] = ["beginner", "intermediate", "advanced"];

/** The three levels to choose between, each with what Coach looks for
 *  at it. On a phone a sheet in the middle of the screen rather than a
 *  dropdown: anchored to its button, its far side ran off the screen and
 *  took half of every description with it - the descriptions being the
 *  entire reason the menu exists. On a laptop it drops down from the
 *  button, from its left edge or (`align="right"`) its right. */
export function LevelMenu({
  onClose,
  align = "left",
  note,
}: {
  onClose: () => void;
  align?: "left" | "right";
  note?: string;
}) {
  const { state, setLevel } = useStore();
  return (
    <>
      <span aria-hidden onClick={onClose} className="fixed inset-0 z-20 bg-navy-950/70 sm:hidden" />
      <div
        role="listbox"
        className={`fixed left-1/2 top-1/2 z-30 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-navy-500 bg-navy-900 shadow-2xl shadow-navy-950/80 sm:absolute sm:top-full sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-2rem)] sm:translate-x-0 sm:translate-y-0 ${
          align === "right" ? "sm:left-auto sm:right-0" : "sm:left-0"
        }`}
      >
        {levelOrder.map((option) => {
          const meta = levelMeta[option];
          const active = option === state.level;
          return (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => {
                setLevel(option);
                onClose();
              }}
              className={`flex w-full items-center gap-3 p-3 text-left transition-colors ${
                active ? "bg-navy-700" : "hover:bg-navy-800"
              }`}
            >
              <LevelIcon level={option} className="h-8 w-auto shrink-0" />
              <span className="flex flex-col">
                <span className={`text-xs font-semibold ${meta.accentClass}`}>
                  {meta.label}
                  {active && <span className="ml-2 font-normal text-ink-faint">current</span>}
                </span>
                <span className="text-[0.7rem] leading-snug text-ink-muted">{meta.detail}</span>
                <span className="mt-1 text-[0.65rem] leading-snug text-ink-faint">{meta.looksFor}</span>
              </span>
            </button>
          );
        })}
        {note && <p className="border-t border-navy-700 px-3 py-2.5 text-[0.7rem] leading-snug text-ink-muted">{note}</p>}
      </div>
    </>
  );
}

/** The student's level as just the lion, tinted for it: hover to read
 *  which level it is, tap to change it. Small enough to sit on the road
 *  beside the view switch - where, with every challenge done, going round
 *  again on Advanced is one tap away. */
export function LevelPicker({ align = "left" }: { align?: "left" | "right" }) {
  const { state } = useStore();
  const level = state.level ?? "beginner";
  const meta = levelMeta[level];
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  // Closes on Escape, or a click anywhere outside it on a laptop (on a
  // phone the sheet's own backdrop does that).
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const click = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", key);
    window.addEventListener("pointerdown", click);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("pointerdown", click);
    };
  }, [open]);

  return (
    <span ref={box} className="group relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Level: ${meta.label}. Change level`}
        className="grid size-10 place-items-center rounded-full border border-navy-600 bg-navy-950/80 backdrop-blur transition-colors hover:border-ink-faint"
      >
        <LevelIcon level={level} className="h-6 w-auto" />
      </button>
      {/* What it means, on hover - hidden while the menu is open, which
          says it at more length. */}
      {!open && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute top-full z-30 mt-2 hidden w-max max-w-56 flex-col rounded-lg border border-navy-600 bg-navy-900/95 px-3 py-2 text-left opacity-0 shadow-xl transition-opacity group-hover:opacity-100 sm:flex ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <span className={`text-xs font-bold ${meta.accentClass}`}>{meta.label}</span>
          <span className="text-[0.7rem] text-ink-muted">{meta.feeling} · click to change</span>
        </span>
      )}
      {open && (
        <LevelMenu
          onClose={() => setOpen(false)}
          align={align}
          note="Coach judges your takes from here on at the level you choose - so once the road is done, go round again on a harder one."
        />
      )}
    </span>
  );
}
