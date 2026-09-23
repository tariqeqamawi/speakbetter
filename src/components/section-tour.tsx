"use client";

import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { TapIcon } from "@/components/icons";
import { TourRunner } from "@/components/tour-runner";
import { sectionTours, type SectionId } from "@/data/tour-script";

// A short tour of the page you are already on.
//
// The whole-app tour is for arriving. This is for the other way a
// student gets lost: they land straight on the cards, or open the
// dashboard for the first time three weeks in, and there is nobody to
// ask. Three to five stops, Coach speaking, right there - no restart
// of the long tour and no leaving the page to find out what it does.
//
// It offers itself once per section, quietly, and after that it is the
// button beside the section's name. Whether a section has been offered
// is kept per section on the device, so seeing the cards tour does not
// use up the dashboard's.

const seenKey = (id: SectionId) => `speak-better-tour-${id}-v1`;

/** Start the tour for a section from anywhere - the top bar's button
 *  fires this, and the SectionTour mounted on that page answers it. */
export function startSectionTour(section: SectionId) {
  window.dispatchEvent(new CustomEvent("speak-better:section-tour", { detail: section }));
}

/** Which section a path belongs to, or null for the ones that have no
 *  tour of their own (a lesson, a single challenge, the review). */
export function sectionOf(pathname: string): SectionId | null {
  if (pathname.startsWith("/skills/cards")) return "cards";
  if (pathname.startsWith("/skills")) return "skills";
  if (pathname.startsWith("/challenges")) return "challenges";
  if (pathname.startsWith("/profile")) return "dashboard";
  if (pathname.startsWith("/community")) return "community";
  if (pathname.startsWith("/coach")) return "coach";
  return null;
}

export function SectionTour({ section }: { section: SectionId }) {
  const { state, ready } = useStore();
  const [running, setRunning] = useState(false);
  const tour = sectionTours[section];

  // Offered once, a beat after the page settles - long enough that it
  // isn't competing with the page painting, short enough that it is
  // still obviously about this page.
  useEffect(() => {
    if (!ready || !state.unlocked) return;
    let done = true;
    try {
      done = window.localStorage.getItem(seenKey(section)) === "1";
      // Nobody gets two offers at once: the whole-app tour goes first.
      if (!window.localStorage.getItem("speak-better-tour-v1")) done = true;
    } catch {}
    if (done) return;
    const t = window.setTimeout(() => {
      if (!document.body.dataset.tour) setRunning(true);
    }, 2200);
    return () => window.clearTimeout(t);
  }, [ready, state.unlocked, section]);

  // Asked for from the top bar.
  useEffect(() => {
    const onOpen = (e: Event) => {
      if ((e as CustomEvent<SectionId>).detail === section) setRunning(true);
    };
    window.addEventListener("speak-better:section-tour", onOpen);
    return () => window.removeEventListener("speak-better:section-tour", onOpen);
  }, [section]);

  // While it runs, Coach's pop-ins stand down.
  useEffect(() => {
    if (!running) return;
    document.body.dataset.tour = "1";
    return () => {
      delete document.body.dataset.tour;
    };
  }, [running]);

  const close = useCallback(() => {
    setRunning(false);
    try {
      window.localStorage.setItem(seenKey(section), "1");
    } catch {}
  }, [section]);

  if (!ready || !state.unlocked) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setRunning(true)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-navy-600 bg-navy-900/60 px-3 py-1 text-[0.7rem] font-semibold text-ink-faint transition-colors hover:border-ink-faint hover:text-ink"
      >
        <TapIcon className="size-3.5 shrink-0" />
        <span className="whitespace-nowrap">{tour.label}</span>
      </button>
      {running && <TourRunner stops={tour.stops} onClose={close} />}
    </>
  );
}
