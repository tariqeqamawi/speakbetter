"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";

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
  // A phone turned on its side: the header, the tabs and the tab bar
  // would leave the road a letterbox, so it takes the whole screen.
  const [immersive, setImmersive] = useState(false);
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
      setImmersive(side);
      if (side) {
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
  }, [current, immersive]);

  const tabButton = (t: Tab, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={current === t}
      onClick={() => setTab(t)}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
        current === t ? "bg-ink text-navy-900" : "text-ink-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className={`flex flex-col ${current === "challenges" ? "-mt-5 gap-2" : "gap-6 pt-4"}`}>
      {current === "orientation" && heading}
      <div className="flex items-center gap-2">
        <div role="tablist" aria-label="Challenges" className="flex rounded-full border border-navy-600 bg-navy-900/70 p-1">
          {tabButton("orientation", "Orientation")}
          {tabButton("challenges", "Challenges")}
        </div>
        <span className="ml-auto flex items-center gap-2">{actions}</span>
      </div>
      {current === "orientation" ? (
        <div className="flex flex-col gap-6">{orientation}</div>
      ) : (
        <div
          ref={box}
          className={
            immersive
              ? "fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[#070c18]"
              : "-mx-4 overflow-y-auto overscroll-contain sm:mx-0 sm:overflow-hidden sm:rounded-2xl"
          }
          style={{ height: height ?? "70vh", ["--road-h" as string]: height ? `${height}px` : "70vh" }}
        >
          {road}
          {/* Full screen on its side: the one way back out to the tabs. */}
          {immersive && (
            <button
              type="button"
              onClick={() => setTab("orientation")}
              className="fixed left-1/2 top-3 z-[60] -translate-x-1/2 rounded-full border border-navy-600 bg-navy-950/80 px-3 py-1.5 text-xs font-semibold text-ink-muted backdrop-blur"
            >
              ← Orientation
            </button>
          )}
        </div>
      )}
    </div>
  );
}
