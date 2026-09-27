"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { PILL_OFF, PILL_ON, RoadChromeContext } from "@/components/adventure/road-chrome";

// The Challenges page as two tabs.
//
// Orientation: the welcome, the two intro videos and the then-and-now -
// what a new student needs once. Challenges: the S.T.O.R.Y. road, and
// nothing else - measured to fill exactly the screen left under the
// header (and above the tab bar, where there is one), portrait or
// landscape, with the page itself held still, so travelling the road can
// never scroll you back up into the videos.
//
// A student who has recorded anything opens on the road; a new one on the
// orientation. A guided tour always finds the road.

type Tab = "orientation" | "challenges";

export function ChallengesTabs({
  heading,
  actions,
  orientation,
  road,
}: {
  heading: React.ReactNode;
  actions: React.ReactNode;
  orientation: React.ReactNode;
  road: React.ReactNode;
}) {
  const { state, ready } = useStore();
  const [tab, setTab] = useState<Tab | null>(null);
  useEffect(() => {
    if (!ready || tab) return;
    const asked = new URLSearchParams(window.location.search).get("view");
    const touring = Boolean(document.body.dataset.touring);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the opening tab, once the record is known
    setTab(
      asked === "orientation" || asked === "challenges"
        ? asked
        : touring || state.attempts.length > 0
          ? "challenges"
          : "orientation",
    );
  }, [ready, tab, state.attempts.length]);
  const current: Tab = tab ?? "orientation";

  // The road's height: from where it starts to the bottom of the screen,
  // less the tab bar when it is showing.
  const box = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  // FULL SCREEN: the road alone, over everything - no header, no tabs,
  // no tab bar - with only the exit, the 2D/3D switch and the dial on it.
  // Entered with its button; a phone turned on its side goes there by
  // itself (the rest would leave the road a letterbox) until the student
  // chooses otherwise. Where the browser allows, it is real full screen,
  // browser bars and all gone.
  const [full, setFullState] = useState(false);
  const chose = useRef(false);
  const setFull = (on: boolean) => {
    chose.current = true;
    setFullState(on);
    const el = box.current;
    try {
      if (on && el?.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().catch(() => {});
      if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch {
      // no Fullscreen API (iPhone Safari): the fixed layer is full screen enough
    }
  };
  // Leaving real full screen from outside (Esc, the phone's back gesture)
  // leaves ours too.
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setFullState(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullState(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // A phone turned sideways drops into our full screen by itself, but a
  // browser only hides its own bars (the address bar) for a tap - so the
  // first tap on the road, while ours is on and theirs isn't, asks for
  // theirs too. (iPhone Safari has no such thing for a page; there the
  // app added to the home screen is the full-screen way.)
  useEffect(() => {
    const el = box.current;
    if (!full || !el || !el.requestFullscreen) return;
    const go = () => {
      if (!document.fullscreenElement) el.requestFullscreen().catch(() => {});
    };
    el.addEventListener("touchend", go, { once: true });
    el.addEventListener("click", go, { once: true });
    return () => {
      el.removeEventListener("touchend", go);
      el.removeEventListener("click", go);
    };
  }, [full]);

  useLayoutEffect(() => {
    if (current !== "challenges") return;
    const html = document.documentElement;
    const was = html.style.overflow;
    window.scrollTo(0, 0);
    html.style.overflow = "hidden";
    const fit = () => {
      const el = box.current;
      if (!el) return;
      const side = window.innerWidth > window.innerHeight && window.innerHeight < 520;
      if (side && !chose.current) setFullState(true);
      if (full || (side && !chose.current)) {
        setHeight(window.innerHeight);
        return;
      }
      const bar = document.querySelector<HTMLElement>(".app-bar");
      const barH = bar && getComputedStyle(bar).display !== "none" ? bar.getBoundingClientRect().height : 0;
      setHeight(Math.max(260, window.innerHeight - el.getBoundingClientRect().top - barH));
    };
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    return () => {
      html.style.overflow = was;
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
    };
    // Again when the box is pinned or unpinned, so it is measured where it
    // actually sits.
  }, [current, full]);

  const tabButton = (t: Tab, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={current === t}
      onClick={() => setTab(t)}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${current === t ? PILL_ON : PILL_OFF}`}
    >
      {label}
    </button>
  );

  return (
    // On the road the tab row goes: the road starts straight under the
    // header, and the way back to Orientation is a pill on the road itself.
    <div className={`flex flex-col ${current === "challenges" ? "-mt-8 sm:-mt-4" : "gap-6 pt-4"}`}>
      {current === "orientation" && (
        <>
          {heading}
          <div className="flex items-center justify-center gap-2">
            <div role="tablist" aria-label="Challenges" className="flex rounded-full border border-navy-600 bg-navy-900/70 p-1">
              {tabButton("orientation", "Orientation")}
              {tabButton("challenges", "Challenges")}
            </div>
            <span className="flex items-center gap-2">{actions}</span>
          </div>
        </>
      )}
      {current === "orientation" ? (
        <div className="flex flex-col gap-6">{orientation}</div>
      ) : (
        <div
          ref={box}
          className={
            full
              ? "fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[#070c18]"
              : "-mx-4 overflow-y-auto overscroll-contain sm:mx-0 sm:overflow-hidden sm:rounded-2xl"
          }
          style={{ height: height ?? "70vh", ["--road-h" as string]: height ? `${height}px` : "70vh" }}
        >
          <RoadChromeContext.Provider
            value={{
              full,
              canFull: true,
              setFull,
              toOrientation: () => {
                setFull(false);
                setTab("orientation");
              },
            }}
          >{road}</RoadChromeContext.Provider>
        </div>
      )}
    </div>
  );
}
