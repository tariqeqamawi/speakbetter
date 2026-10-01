"use client";

import { useEffect, useRef, useState } from "react";
import { AdventureScreen } from "./adventure-screen";
import { Adventure2D } from "./adventure-2d";
import { LevelPicker } from "@/components/level-picker";
import { ROAD_SKY } from "./world-phases";
import { FullScreenIcon, PILL_OFF, PILL_ON, useRoadChrome } from "./road-chrome";
import { LockIcon } from "./lock-icon";
import type { ViewMode, WorldPhase, WorldStop } from "./adventure-world";

// The adventure three ways - the student's choice, kept on the device:
//   2D  the flat map, for anybody who would rather scroll, or whose phone
//       would rather they did
//   3D  the calm road: the same land and colours, no loops or stunts,
//       seen from high above like a map come to life
//   4D  the full ride - speed, loops, the corkscrew, the skyways
//
// EARNED, NOT HANDED OVER: 2D to begin with. 3D opens once every
// challenge of the first section (Start With Awareness) is passed, and 4D
// once the first two of the second (Train Your Instrument) are - so the
// full ride is something unlocked by doing the work, not a gimmick on the
// front of it. The locked views stay on the switch, with a lock, and say
// what opens them; a first visit says so once. (During the guided tour
// everything is open, so the tour can show it.)

type Mode = ViewMode;

/** One view on screen. While switching there are two: the one being left,
 *  underneath, its camera heading for the new view's place, and the new
 *  one fading in over it, its camera arriving from the old one's - so one
 *  seems to turn into the other. Then the old one goes, to save battery. */
interface Layer {
  id: number;
  mode: Mode;
  arrive: Mode | null;
  leaveTo: Mode | null;
  /** Where on the journey to open (the view before's place). */
  start: number | null;
}
const MODES: { id: Mode; label: string; name: string }[] = [
  { id: "2d", label: "2D", name: "Flat map" },
  { id: "3d", label: "3D", name: "Calm road, from above" },
  { id: "4d", label: "4D", name: "Full ride" },
];
// (A new key: under the old one, "3d" meant the full ride.)
const KEY = "adventure-view-3";
const OLD_KEY = "adventure-view";
/** Set once the first-visit note about 3D and 4D has been shown. */
const INTRO_KEY = "adventure-unlock-intro";

export function AdventureView({
  stops,
  phases,
  fallbackAvatar,
  skyImage = ROAD_SKY,
  heightClass,
  stickyTop = "top-16",
}: {
  stops: WorldStop[];
  phases: WorldPhase[];
  fallbackAvatar?: string;
  /** A painted sky for the 3D road (see SkyDome); null for stars alone. */
  skyImage?: string | null;
  heightClass?: string;
  /** Where the 3D/2D switch sticks - under the page header, or at the top
   *  of a box the road scrolls inside. */
  stickyTop?: string;
}) {
  const [layers, setLayers] = useState<Layer[]>([{ id: 0, mode: "2d", arrive: null, leaveTo: null, start: null }]);
  // What's open, from the record.
  const phaseName = (id: string) => phases.find((p) => p.id === id)?.name ?? id;
  const inS = stops.map((st, i) => ({ st, i })).filter(({ st }) => st.phase === "S");
  const inT = stops.map((st, i) => ({ st, i })).filter(({ st }) => st.phase === "T").slice(0, 2);
  const touring = typeof document !== "undefined" && Boolean(document.body.dataset.touring);
  const open3d = touring || (inS.length > 0 && inS.every(({ st }) => st.state === "done"));
  const open4d = touring || (open3d && inT.length > 0 && inT.every(({ st }) => st.state === "done"));
  const isOpen = (m: Mode) => m === "2d" || (m === "3d" ? open3d : open4d);
  const phaseColor = (id: string) => phases.find((p) => p.id === id)?.color ?? "#ffffff";
  // What opens a view: as plain words (a tooltip), and as the note says
  // it - the number as a numeral, the section's name lit in its colour.
  const lockedText = (m: Mode) =>
    m === "3d"
      ? `Locked until you complete all ${inS.length} challenges in ${phaseName("S")}.`
      : `Locked until you complete challenges ${inT.map(({ i }) => i + 1).join(" and ")} in ${phaseName("T")}.`;
  const opensWhen = (m: Mode, lead = "Locked until you") =>
    m === "3d" ? (
      <>
        {lead} complete all {inS.length} challenges in{" "}
        <b className="font-semibold" style={{ color: phaseColor("S") }}>
          {phaseName("S")}
        </b>
        .
      </>
    ) : (
      <>
        {lead} complete challenges {inT.map(({ i }) => i + 1).join(" and ")} in{" "}
        <b className="font-semibold" style={{ color: phaseColor("T") }}>
          {phaseName("T")}
        </b>
        .
      </>
    );
  // The note on screen: the welcome to the views, or why one is locked -
  // with a picture of what's waiting.
  const [note, setNote] = useState<{ title: string; body: React.ReactNode; intro?: boolean; image?: string } | null>(null);
  const mode = layers[layers.length - 1].mode;
  // Where the traveller is, in challenges, as the 3D and 4D views report it.
  const progress = useRef<number | null>(null);
  const nextId = useRef(1);
  const setMode = (m: Mode) => setLayers([{ id: nextId.current++, mode: m, arrive: null, leaveTo: null, start: null }]);
  const done = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(done.current), []);
  const chrome = useRoadChrome();
  useEffect(() => {
    try {
      // After mounting, so the server's render and the first client
      // render agree.
      const saved = localStorage.getItem(KEY) ?? (localStorage.getItem(OLD_KEY) === "2d" ? "2d" : null);
      // Their last view, if it's open to them; with none saved, the
      // fullest view they've earned.
      const want = saved === "2d" || saved === "3d" || saved === "4d" ? saved : open4d ? "4d" : open3d ? "3d" : "2d";
      if (want !== "2d" && isOpen(want)) setMode(want);
      // The first time on the road, before anything is earned: say how
      // the other two views open.
      if (!open3d && !touring && !localStorage.getItem(INTRO_KEY)) {
        localStorage.setItem(INTRO_KEY, "1");
        window.setTimeout(
          () =>
            setNote({
              title: "3D and 4D are waiting",
              body: "Complete challenges to unlock 3D and 4D mode. For now, the road starts as a map - just like a normal course.",
              intro: true,
            }),
          0,
        );
      }
    } catch {
      // no storage: the map
    }
    // (Once, on opening.)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const choose = (m: Mode) => {
    if (m === mode) return;
    if (!isOpen(m)) {
      setNote({ title: `${m.toUpperCase()} is locked`, body: opensWhen(m), image: `/road/preview-${m}.webp` });
      return;
    }
    const calmer = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = layers[layers.length - 1];
    const next: Layer = { id: nextId.current++, mode: m, arrive: calmer ? null : from.mode, leaveTo: null, start: progress.current };
    setLayers([{ ...from, leaveTo: calmer ? null : m }, next]);
    clearTimeout(done.current);
    done.current = setTimeout(() => setLayers((ls) => ls.filter((l) => l.id === next.id)), calmer ? 350 : 1700);
    try {
      localStorage.setItem(KEY, m);
    } catch {
      // fine
    }
  };

  return (
    <div className="relative">
      {/* The switch on the left; the level and full screen on the right,
          beside the road's own "?" - stuck to the top whichever view is
          showing. */}
      <div className={`sticky ${stickyTop} z-40 flex`}>
        <div
          className="absolute flex items-center gap-2"
          style={{ left: "max(0.75rem, env(safe-area-inset-left))", top: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <div
            role="radiogroup"
            aria-label="View"
            className="flex rounded-full border border-navy-600 bg-navy-950/80 p-1 text-xs font-bold backdrop-blur"
          >
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={mode === m.id}
                aria-label={`${m.label}: ${m.name}${isOpen(m.id) ? "" : " (locked)"}`}
                title={isOpen(m.id) ? m.name : lockedText(m.id)}
                onClick={() => choose(m.id)}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors ${mode === m.id ? PILL_ON : PILL_OFF} ${isOpen(m.id) ? "" : "opacity-60"}`}
              >
                {m.label}
                {!isOpen(m.id) && <LockIcon className="size-3" />}
              </button>
            ))}
          </div>
          {/* Back to the Orientation tab - the road has no tab row above it. */}
          {chrome.toOrientation && (
            <button
              type="button"
              onClick={chrome.toOrientation}
              aria-label="Orientation"
              title="Orientation"
              className="grid size-9 place-items-center rounded-full border border-navy-600 bg-navy-950/80 text-ink-muted backdrop-blur hover:text-ink"
            >
              {/* A compass: the welcome and the intro videos. Drawn like
                  one - a ring with its four points marked, and a needle
                  whose north half is solid - so it can't be mistaken for
                  a clock or a play button. */}
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="9.5" />
                <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2" />
                <path d="M12 5.5l2.6 6.5h-5.2z" fill="currentColor" stroke="none" />
                <path d="M9.4 12h5.2L12 18.5z" />
                <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
              </svg>
            </button>
          )}
        </div>
        <div
          className="absolute flex items-center gap-2"
          style={{
            // Left of the road's "?" (or, in full screen, its sound switch);
            // on the flat map there is neither, so right to the edge.
            right: mode === "2d" ? "max(0.75rem, env(safe-area-inset-right))" : "calc(max(0.75rem, env(safe-area-inset-right)) + 2.75rem)",
            top: "max(0.75rem, env(safe-area-inset-top))",
          }}
        >
          {/* The level they are travelling it at, and where to change it -
              not in full screen, which keeps to the essentials. */}
          {!chrome.full && <LevelPicker align="right" />}
          {/* In and out of full screen - where the page offers it. */}
          {chrome.canFull && (
            <button
              type="button"
              onClick={() => chrome.setFull(!chrome.full)}
              aria-label={chrome.full ? "Exit full screen" : "Full screen"}
              aria-pressed={chrome.full}
              title={chrome.full ? "Exit full screen" : "Full screen"}
              // The same full-screen icon either way, so it's always plain
              // what the button is - lit up while full screen is on.
              className={`grid size-9 place-items-center rounded-full backdrop-blur ${
                chrome.full ? PILL_ON : "border border-navy-600 bg-navy-950/80 text-ink-muted hover:text-ink"
              }`}
            >
              <FullScreenIcon full={false} />
            </button>
          )}
        </div>
      </div>
      {note && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-6 backdrop-blur-sm" onClick={() => setNote(null)}>
          <div
            role="dialog"
            aria-label={note.title}
            onClick={(e) => e.stopPropagation()}
            className="no-glass coach-cue flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-navy-600 bg-navy-850 p-4 text-center shadow-2xl"
          >
            {/* What's waiting: a picture of the view itself. */}
            {note.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={note.image} alt="" className="aspect-[2/1] w-full rounded-xl border border-navy-600 object-cover" />
            )}
            {!note.image && !note.intro && (
              <span className="grid size-11 place-items-center rounded-full border border-navy-600 bg-navy-900 text-ink-muted">
                <LockIcon className="size-5" />
              </span>
            )}
            <p className="text-base font-semibold text-ink text-balance">{note.title}</p>
            <p className="text-sm text-ink-muted text-pretty">{note.body}</p>
            {note.intro && (
              <ul className="grid w-full grid-cols-2 gap-2 text-left text-[0.7rem] leading-snug text-ink-muted">
                {(["3d", "4d"] as const).map((m) => (
                  <li key={m} className="flex flex-col gap-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/road/preview-${m}.webp`} alt="" className="aspect-[2/1] w-full rounded-lg border border-navy-600 object-cover" />
                    <span>
                      <b className="text-ink">{m.toUpperCase()}</b> {opensWhen(m, "opens when you")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => setNote(null)}
              className="mt-1 rounded-full border border-body-language/70 bg-navy-800 px-6 py-2 text-sm font-semibold text-ink"
            >
              Got it
            </button>
          </div>
        </div>
      )}
      {layers.map((l, i) => {
        const top = i === layers.length - 1;
        const switching = layers.length > 1;
        const body =
          l.mode === "2d" ? (
            <Map2D stops={stops} phases={phases} heightClass={heightClass} />
          ) : (
            <AdventureScreen
              calm={l.mode === "3d"}
              stops={stops}
              phases={phases}
              fallbackAvatar={fallbackAvatar}
              skyImage={skyImage ?? undefined}
              heightClass={heightClass}
              startProgress={l.start}
              onProgress={top ? (p) => (progress.current = p) : undefined}
              arrive={l.arrive}
              leaveTo={l.leaveTo}
            />
          );
        // (The same wrapper whether arriving or leaving, so the view
        // being left isn't rebuilt as it goes underneath.)
        return (
          <FadeIn
            key={l.id}
            on={top && switching}
            leaving={!top}
            // Into the map: once the camera has started to rise. Out of it:
            // straight away, as the camera comes down.
            delay={l.mode === "2d" && l.arrive ? 450 : 0}
            duration={l.arrive ? (l.mode === "2d" ? 800 : 650) : 300}
          >
            {body}
          </FadeIn>
        );
      })}
    </div>
  );
}

/** Fades its view in over the one being left, when switching. */
function FadeIn({
  on,
  leaving,
  delay,
  duration,
  children,
}: {
  on: boolean;
  /** The view being left: held underneath, out of the way, until it goes. */
  leaving: boolean;
  delay: number;
  duration: number;
  children: React.ReactNode;
}) {
  const [shown, setShown] = useState(!on);
  useEffect(() => {
    if (!on) return;
    // Two frames: mounted at nothing first, so the fade has somewhere to
    // start from.
    let b = 0;
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, [on]);
  return (
    <div
      aria-hidden={leaving || undefined}
      className={leaving ? "pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden" : "relative z-[1]"}
      style={on ? { opacity: shown ? 1 : 0, transition: `opacity ${duration}ms ease ${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/** The flat map, in a frame the height of the road's, scrolling inside it -
 *  so switching to and from it, the page stays where it is and one view
 *  fades straight into the other. */
function Map2D({
  stops,
  phases,
  heightClass,
}: {
  stops: WorldStop[];
  phases: WorldPhase[];
  heightClass?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  return (
    <div ref={frame} className={`${heightClass ?? "h-[calc(100dvh-4rem)]"} overflow-y-auto overscroll-contain bg-[#070c18] pt-14`}>
      <Adventure2D stops={stops} phases={phases} scrollRoot={frame} zoomed />
    </div>
  );
}
