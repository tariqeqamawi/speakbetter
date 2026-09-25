"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AHEAD, GATE_BEFORE, Travel, coachSpots, layoutRoad, reachedPhase } from "./road-geometry";
import { SkyCoach } from "./sky-coach";
import { ROAD_LINES, roadLineClip } from "@/data/greetings";
import { activated, playApplause, playCoachLine, playGateChime, playRoadWhoosh } from "@/lib/feedback-fx";
import { Confetti } from "@/components/confetti";
import { useStore } from "@/lib/store";
import type { PickPortal, WorldPhase, WorldStop } from "./adventure-world";

// The adventure screen: the 3D road filling the frame, and the few
// things laid over it - which phase you are in, which checkpoint you
// are nearest, and how to move.
//
// The world is loaded only on this screen and only in the browser: it
// is the one place the 3D engine is needed, so nobody pays for it on
// any other page.

const AdventureWorld = dynamic(() => import("./adventure-world").then((m) => m.AdventureWorld), {
  ssr: false,
  loading: () => <div className="absolute inset-0 grid place-items-center text-sm text-ink-faint">Loading the road…</div>,
});

// Coach's words at the finish: when he starts after the arch, and how
// long each character takes him to say (his clip, ~29.8s, over its text).
const FINISH_DELAY = 900;
const FINISH_SENTENCES = ROAD_LINES[3].match(/[^.!?]+[.!?]+/g)!.map((t) => t.trim());
const FINISH_MS_PER_CHAR = 28800 / ROAD_LINES[3].length;

export function AdventureScreen({
  stops,
  phases,
  fallbackAvatar = "/lion-head.png",
  skyImage,
}: {
  stops: WorldStop[];
  phases: WorldPhase[];
  fallbackAvatar?: string;
  skyImage?: string;
}) {
  const road = useMemo(() => layoutRoad(stops.length, stops.map((s) => s.phase)), [stops]);
  // The checkpoint the student is on.
  const hereIndex = Math.max(0, stops.findIndex((s) => s.state === "here"));
  // The road opens at the challenge the student is on, its Start button
  // showing - or, for someone new, at the very beginning, in the open land
  // before the first. (Back at the beginning, a button flies them on to
  // where they are.)
  const start = hereIndex > 0 ? Math.max(0, road.stops[hereIndex] - AHEAD - 2) : 0;
  const [travel] = useState(() => new Travel(start));
  const [s, setS] = useState(start);
  const frame = useRef<HTMLDivElement>(null);
  // The student's own photo on the traveller; until they have set one, a
  // stand-in (on the preview, Tariq).
  const { state } = useStore();
  const avatar = state.avatar && /^(data:image|\/|https?:)/.test(state.avatar) ? state.avatar : fallbackAvatar;

  const onMove = useCallback((next: number) => setS(next), []);
  // The finish line is crossed only with every challenge done: before
  // then you can preview the whole road, but it stops short of the arch.
  const allDone = stops.every((st) => st.state === "done");
  const limit = allDone ? road.finish + 10 : road.finish - AHEAD - 12;
  // Taps on the road, handled further down once everything they can do
  // is defined; the portal under a tap is asked of the world.
  const onTap = useRef<(x: number, y: number) => void>(() => {});
  const pickRef = useRef<PickPortal | null>(null);

  // Drag down (or scroll down) to go forward, with momentum.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    let lastY: number | null = null;
    // A press that barely moves is a tap - on a portal, perhaps - not a drag.
    let from: { x: number; y: number; t: number; far: number } | null = null;
    const down = (e: PointerEvent) => {
      // The letters and buttons over the road are buttons, not road.
      if ((e.target as HTMLElement).closest("button, a")) return;
      lastY = e.clientY;
      from = { x: e.clientX, y: e.clientY, t: performance.now(), far: 0 };
      travel.push(0, 0);
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (lastY === null) return;
      const dy = e.clientY - lastY;
      lastY = e.clientY;
      if (from) from.far = Math.max(from.far, Math.hypot(e.clientX - from.x, e.clientY - from.y));
      travel.push(dy * 0.045, 0.5);
    };
    const up = (e: PointerEvent) => {
      lastY = null;
      const tap = from && from.far < 8 && performance.now() - from.t < 450;
      from = null;
      if (tap && e.type === "pointerup") onTap.current(e.clientX, e.clientY);
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      travel.push(e.deltaY * 0.0045);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        travel.push(e.key === "ArrowDown" ? 0.9 : -0.9);
      }
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("keydown", key);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("keydown", key);
    };
  }, [travel]);

  // Which checkpoint the traveller is nearest, and which phase that
  // puts them in - the phase changes the moment they pass under its
  // gate, not when a checkpoint happens to be closer.
  const at = s + AHEAD;
  const nearest = road.stops.reduce((best, x, i) => (Math.abs(x - at) < Math.abs(road.stops[best] - at) ? i : best), 0);
  const phaseHere =
    [...phases].reverse().find((p) => {
      const i = stops.findIndex((st) => st.phase === p.id);
      return i >= 0 && at >= road.stops[i] - GATE_BEFORE;
    }) ?? phases[0];
  const stop = stops[nearest];
  const phase = phaseHere;
  const atFinish = at > road.finish - 6;

  // Crossing into a new phase: a banner sweeps across the screen with
  // its letter and name, as the gate for it passes overhead - so the
  // change of colour is something you are told, not something you have
  // to notice.
  const [banner, setBanner] = useState<{ key: number; id: string } | null>(null);
  const shown = useRef(phase?.id);
  useEffect(() => {
    if (!phase || phase.id === shown.current) return;
    shown.current = phase.id;
    setBanner({ key: Date.now(), id: phase.id });
    const t = setTimeout(() => setBanner(null), 2600);
    return () => clearTimeout(t);
  }, [phase]);
  const bannerPhase = banner && phases.find((p) => p.id === banner.id);

  /** Where each phase begins, for the letters to jump to. */
  const phaseStart = (id: string) => {
    const i = stops.findIndex((st) => st.phase === id);
    // Level with its first checkpoint - the camera already through the
    // colour wall, which is for crossing on foot, not for landing in.
    return Math.max(0, road.stops[i] - AHEAD - 1);
  };


  // SOUND - on unless the student has turned it off, and remembered.
  // Nothing plays until they have touched the road, so it never starts
  // at somebody out of a silent page.
  const [sound, setSound] = useState(true);
  useEffect(() => {
    try {
      // Read after mounting, so the server's render and the first client
      // render agree.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSound(localStorage.getItem("road-sound") !== "off");
    } catch {
      // no storage: stays off
    }
  }, []);
  const toggleSound = () => {
    setSound((v) => {
      try {
        localStorage.setItem("road-sound", v ? "off" : "on");
      } catch {
        // fine
      }
      return !v;
    });
  };

  // A whoosh through each checkpoint, a chime under each gate.
  const lastStop = useRef(nearest);
  useEffect(() => {
    if (nearest === lastStop.current) return;
    lastStop.current = nearest;
    if (sound) playRoadWhoosh();
  }, [nearest, sound]);
  // The fanfare only for a threshold crossed for real - going forward into
  // a section the student has reached - never for one only previewed.
  const reached = reachedPhase(stops, phases);
  const lastPhase = useRef(phase?.id);
  useEffect(() => {
    if (phase?.id === lastPhase.current) return;
    const from = phases.findIndex((p) => p.id === lastPhase.current);
    const to = phases.findIndex((p) => p.id === phase?.id);
    lastPhase.current = phase?.id;
    if (sound && to > from && to <= reached) playGateChime();
  }, [phase, phases, reached, sound]);

  // COACH AT THE ROADSIDE. Each time the traveller comes level with him,
  // once per visit: his line, captioned, and spoken if sound is on.
  const spots = useMemo(() => coachSpots(road), [road]);
  const spoken = useRef(new Set<number>());
  const [caption, setCaption] = useState<string | null>(null);
  const [talking, setTalking] = useState<number | null>(null);
  const [waiting, setWaiting] = useState<number | null>(null);
  useEffect(() => {
    // As the traveller comes to each of his places on the road - he
    // appears in the sky, so anywhere round it will do, including just
    // past it where a jump to the start of a phase lands.
    // Only on road the student has really travelled - up to the challenge
    // they are on - not on stretches they are only previewing.
    const real = allDone ? Infinity : road.stops[hereIndex] + 12;
    const i = spots.findIndex((cs, k) => !spoken.current.has(k) && cs <= real && at > cs - 30 && at < cs + 14);
    if (i < 0) return;
    spoken.current.add(i);
    setCaption(ROAD_LINES[i]);
    setTalking(i);
    if (!sound) return;
    // A browser lets a page make sound only once it has been clicked,
    // tapped or typed on - scrolling does not count. Travelled here by
    // scrolling alone, his line waits for the first click, and a chip
    // asks for it.
    if (activated()) playCoachLine(roadLineClip(i));
    else setWaiting(i);
  }, [at, spots, sound, allDone, road, hereIndex]);
  useEffect(() => {
    if (waiting === null) return;
    const go = () => {
      playCoachLine(roadLineClip(waiting));
      setCaption(ROAD_LINES[waiting]);
      setTalking(waiting);
      setWaiting(null);
    };
    // Once per page: the click that lets sound play.
    window.addEventListener("pointerup", go, { once: true });
    window.addEventListener("keydown", go, { once: true });
    return () => {
      window.removeEventListener("pointerup", go);
      window.removeEventListener("keydown", go);
    };
  }, [waiting]);
  // The caption stays as long as the line takes to say, whatever the
  // traveller does meanwhile.
  useEffect(() => {
    if (!caption) return;
    // His mouth moves for about as long as the line takes to say.
    const quiet = setTimeout(() => setTalking(null), caption.length * 62);
    // Gone with the caption, the chip asking to hear it: no chip for a
    // line already over.
    const t = setTimeout(() => {
      setCaption(null);
      setWaiting(null);
    }, 1500 + caption.length * 65);
    return () => {
      clearTimeout(t);
      clearTimeout(quiet);
    };
  }, [caption]);

  // THE CHECKPOINT UNDER THE TRAVELLER: what can be done here.
  const level = stop && Math.abs(road.stops[nearest] - at) < 7;
  const canStart = level && stop.state === "here";
  const locked = level && (stop.state === "locked" || stop.state === "ahead");
  const passed = level && stop.state === "done";

  // THE DIVE. Start on the next open portal: the traveller is drawn into
  // the vortex, the camera follows it in, "Start Challenge" - and then
  // the challenge. Without motion, straight to the challenge.
  const router = useRouter();
  const [diving, setDiving] = useState(false);
  const dive = (slug: string, at: number) => {
    const href = `/challenges/${slug}`;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(href);
      return;
    }
    if (sound) playRoadWhoosh();
    travel.enterPortal(at);
    setDiving(true);
    router.prefetch(href);
    setTimeout(() => router.push(href), 2100);
  };

  // A CHALLENGE NOT YET OPEN. Explore as far ahead as you like, but tap
  // one you have not reached and you are told so, and taken back to the
  // one you are on.
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const backToCurrent = () => {
    setNotice("Complete previous challenges to unlock this one.");
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => {
      travel.goTo(Math.max(0, road.stops[hereIndex] - AHEAD - 2));
      noticeTimer.current = setTimeout(() => setNotice(null), 1600);
    }, 1400);
  };
  useEffect(() => () => clearTimeout(noticeTimer.current), []);
  useEffect(() => {
    onTap.current = (x, y) => {
      const i = pickRef.current?.(x, y);
      if (i === null || i === undefined) return;
      const st = stops[i];
      if (st.state === "locked" || st.state === "ahead") backToCurrent();
      else if (st.state === "here") dive(st.slug, road.stops[i]);
      else router.push(`/challenges/${st.slug}`);
    };
  });

  // Up against the finish before it is earned: say why the road ends here.
  const atGate = !allDone && s > limit - 3;

  // THE FINISH: once, when the traveller passes under the arch.
  const [finished, setFinished] = useState(false);
  const didFinish = useRef(false);
  const hushFinish = useRef<() => void>(() => {});
  useEffect(() => {
    if (!atFinish || didFinish.current) return;
    didFinish.current = true;
    setFinished(true);
    if (sound) {
      playApplause();
      hushFinish.current = playCoachLine(roadLineClip(3), FINISH_DELAY);
    }
  }, [atFinish, sound]);
  // His finishing words, a sentence at a time, as he says them - each
  // held for its share of the clip by length.
  const [finishLine, setFinishLine] = useState(-1);
  useEffect(() => {
    if (!finished) return;
    let at = FINISH_DELAY;
    const timers = FINISH_SENTENCES.map((line, i) => {
      const t = setTimeout(() => setFinishLine(i), at);
      at += line.length * FINISH_MS_PER_CHAR;
      return t;
    });
    return () => {
      timers.forEach(clearTimeout);
      setFinishLine(-1);
    };
  }, [finished]);
  const closeFinish = () => {
    hushFinish.current();
    setFinished(false);
  };

  return (
    <div
      ref={frame}
      tabIndex={0}
      role="application"
      aria-label="The S.T.O.R.Y. road. Drag down or use the down arrow to travel forward."
      className="relative h-[calc(100dvh-4rem)] w-full touch-none select-none overflow-hidden bg-[#070c18] outline-none"
    >
      <AdventureWorld stops={stops} phases={phases} travel={travel} onMove={onMove} avatar={avatar} pickRef={pickRef} limit={limit} skyImage={skyImage} />

      {bannerPhase && (
        <div key={banner!.key} className="phase-banner pointer-events-none absolute inset-x-0 top-[30%] flex justify-center px-4">
          <div
            className="flex items-center gap-4 rounded-2xl border-2 bg-[#070c18]/90 px-6 py-3 shadow-2xl backdrop-blur"
            style={{ borderColor: bannerPhase.color, boxShadow: `0 0 40px -6px ${bannerPhase.color}` }}
          >
            <span className="text-7xl font-extrabold leading-none sm:text-8xl" style={{ color: bannerPhase.color }}>
              {bannerPhase.id}
            </span>
            <span className="flex flex-col text-left">
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-ink-faint">Now entering</span>
              <span className="text-2xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">{bannerPhase.name}</span>
            </span>
          </div>
        </div>
      )}

      {/* Sound, off by default. */}
      <button
        type="button"
        onClick={toggleSound}
        aria-pressed={sound}
        className="absolute right-3 top-3 z-20 grid size-10 place-items-center rounded-full border border-navy-600 bg-navy-900/80 text-sm text-ink-muted"
        aria-label={sound ? "Turn road sound off" : "Turn road sound on"}
      >
        {sound ? "🔊" : "🔈"}
      </button>

      <SkyCoach talking={talking !== null} />

      {/* What Coach said, as he said it. */}
      {/* A subtitle in the sky, just under his head and above the land,
          where it reads against the dark - no box. */}
      {caption && (
        <div className="pointer-events-none absolute inset-x-0 top-[30%] z-10 flex justify-center px-8">
          <p
            className="coach-note-in max-w-sm text-center text-sm font-semibold leading-snug text-ink text-balance"
            style={{ textShadow: "0 1px 10px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.9)" }}
          >
            <span className="text-figurative">Coach: </span>
            {caption}
          </p>
        </div>
      )}

      {notice && (
        <div role="status" className="pointer-events-none absolute inset-x-0 top-[44%] z-20 flex justify-center px-6">
          <p className="coach-note-in rounded-2xl border border-navy-500 bg-navy-950/90 px-5 py-3 text-center text-sm font-semibold text-ink shadow-2xl backdrop-blur">
            🔒 {notice}
          </p>
        </div>
      )}

      {waiting !== null && caption && (
        <div className="pointer-events-none absolute inset-x-0 top-[46%] z-20 flex justify-center">
          <span className="coach-note-in rounded-full border border-figurative/60 bg-navy-950/90 px-4 py-1.5 text-xs font-bold text-figurative shadow-lg backdrop-blur">
            🔊 Click to hear Coach
          </span>
        </div>
      )}

      {/* Through the portal. */}
      {diving && (
        <div className="portal-flash pointer-events-none absolute inset-0 z-30 grid place-items-center">
          <span
            className="text-4xl font-extrabold tracking-tight text-white"
            style={{ textShadow: `0 0 24px ${phase?.color}, 0 0 60px ${phase?.color}` }}
          >
            Start Challenge
          </span>
        </div>
      )}

      {/* The finish. */}
      {finished && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[#070c18]/80 px-6 text-center backdrop-blur-sm">
          <Confetti contained />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/trophy/journey-complete-2x.webp" alt="" className="h-56 w-auto drop-shadow-[0_0_40px_rgba(255,214,10,0.45)]" />
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-storytelling">The whole S.T.O.R.Y.</p>
          <h2 className="text-3xl font-bold tracking-tight text-ink text-balance">You made it to the end of the road</h2>
          {/* What Coach is saying, as he says it. */}
          <p
            key={finishLine}
            aria-live="polite"
            className="coach-note-in flex min-h-[3.5rem] max-w-sm items-start justify-center text-base font-semibold leading-snug text-ink text-balance"
          >
            {finishLine >= 0 && (
              <span>
                <span className="text-figurative">Coach: </span>
                {FINISH_SENTENCES[finishLine]}
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={closeFinish}
            className="mt-2 rounded-full border border-navy-600 bg-navy-800 px-6 py-2.5 text-sm font-semibold text-ink"
          >
            Look back down the road
          </button>
        </div>
      )}

      {/* Where you are. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-1 bg-gradient-to-b from-[#070c18]/90 to-transparent px-4 pb-10 pt-14 text-center sm:pt-4">
        {phase && (
          <>
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.3em]" style={{ color: phase.color }}>
              Phase {phase.id}
            </span>
            <span className="text-lg font-bold tracking-tight text-ink">{phase.name}</span>
          </>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 bg-gradient-to-t from-[#070c18]/95 to-transparent px-4 pb-6 pt-16 text-center">
        {hereIndex > 0 && at < road.stops[0] - 4 && (
          <button
            type="button"
            onClick={() => travel.goTo(Math.max(0, road.stops[hereIndex] - AHEAD - 2))}
            className="pointer-events-auto mb-2 rounded-full px-6 py-2.5 text-sm font-bold text-navy-950 shadow-lg"
            style={{ background: phase?.color, boxShadow: `0 0 24px ${phase?.color}` }}
          >
            Continue from challenge {hereIndex + 1} →
          </button>
        )}
        {canStart && !diving && (
          <button
            type="button"
            onClick={() => dive(stop.slug, road.stops[nearest])}
            className="pointer-events-auto mb-2 rounded-full px-7 py-3 text-base font-bold text-navy-950 shadow-lg"
            style={{ background: phase?.color, boxShadow: `0 0 30px ${phase?.color}` }}
          >
            Start challenge
          </button>
        )}
        {locked && (
          <button
            type="button"
            onClick={backToCurrent}
            className="pointer-events-auto mb-2 rounded-full border border-navy-600 bg-navy-900/85 px-4 py-2 text-sm text-ink-muted"
          >
            🔒 Unlock previous challenge first
          </button>
        )}
        {/* A portal already been through: go again, without the dive -
            that is for the next one. */}
        {passed && (
          <Link
            href={`/challenges/${stop.slug}`}
            className="pointer-events-auto mb-2 rounded-full border-2 bg-navy-900/85 px-6 py-2.5 text-sm font-bold text-ink"
            style={{ borderColor: phase?.color }}
          >
            Replay challenge
          </Link>
        )}
        {atGate && (
          <span className="mb-2 rounded-full border border-navy-600 bg-navy-900/85 px-4 py-2 text-sm text-ink-muted">
            🔒 Complete every challenge to cross the finish line
          </span>
        )}
        {atFinish ? (
          <span className="text-lg font-bold text-ink">The finish line</span>
        ) : (
          stop && (
            <>
              <span className="text-xs tabular-nums text-ink-faint">
                Challenge {nearest + 1} of {stops.length}
              </span>
              <span className="max-w-sm text-base font-semibold text-ink text-balance">{stop.title}</span>
            </>
          )
        )}
        {/* S.T.O.R.Y. - tap a letter to fly to that stretch of road. */}
        <div className="pointer-events-auto mt-3 flex gap-2">
          {phases.map((p) => {
            const on = p.id === phase?.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => travel.goTo(phaseStart(p.id))}
                aria-label={`Go to ${p.name}`}
                aria-current={on ? "true" : undefined}
                className="grid size-11 place-items-center rounded-full border-2 text-lg font-extrabold transition-transform"
                style={{
                  borderColor: p.color,
                  color: on ? "#070c18" : p.color,
                  background: on ? p.color : "rgba(7,12,24,0.7)",
                  boxShadow: on ? `0 0 18px ${p.color}` : undefined,
                  transform: on ? "scale(1.12)" : undefined,
                }}
              >
                {p.id}
              </button>
            );
          })}
        </div>
        <span className="mt-2 text-[0.7rem] text-ink-faint">Drag down to travel forward</span>
      </div>
    </div>
  );
}
