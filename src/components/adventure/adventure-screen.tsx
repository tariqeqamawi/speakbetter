"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AHEAD, GATE_BEFORE, Travel, coachSpots, layoutRoad, phaseRanges, reachedPhase } from "./road-geometry";
import { SkyCoach } from "./sky-coach";
import { ROAD_LINES, ROAD_TALK, roadLineClip, talkClip } from "@/data/greetings";
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

// Where each of Coach's road lines (ROAD_TALK, by place in the list) is
// said: arriving in T, O, R and Y; the encouragements, each halfway
// between a challenge and the next (by the challenge's index); and the
// lines for particular moments.
const TALK = {
  arrive: [0, 1, 2, 3],
  along: [
    [1, 4],
    [4, 5],
    [6, 6],
    [9, 7],
    [12, 8],
    [14, 9],
    [21, 10],
    [22, 11],
  ] as [number, number][],
  back: 12,
  classmates: 13,
  beforePlunge: 14,
  bottom: 15,
  city: 16,
};

export function AdventureScreen({
  stops,
  phases,
  fallbackAvatar = "/lion-head.png",
  skyImage,
  heightClass = "h-[calc(100dvh-4rem)]",
}: {
  stops: WorldStop[];
  phases: WorldPhase[];
  fallbackAvatar?: string;
  skyImage?: string;
  /** How tall the road stands - the screen under the header, unless the
   *  page around it needs room of its own. */
  heightClass?: string;
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
  // COACH, in the sky. Everything he says goes through one queue, so a
  // line never talks over another: it is captioned, spoken if sound is
  // on, and the next waits until it is done.
  type Line = { text: string; src: string };
  const [caption, setCaption] = useState<Line | null>(null);
  const [talking, setTalking] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const queue = useRef<Line[]>([]);
  const busy = useRef(false);
  const startLine = useCallback(
    (line: Line) => {
      busy.current = true;
      setCaption(line);
      setTalking(true);
      // The saved choice as well as the state: on the very first render
      // the state has not read it yet, and a student who turned sound off
      // would be asked to click to hear him.
      let off = false;
      try {
        off = localStorage.getItem("road-sound") === "off";
      } catch {
        // no storage: go by the state
      }
      if (!sound || off) return;
      // A browser lets a page make sound only once it has been clicked,
      // tapped or typed on - scrolling does not count. Travelled here by
      // scrolling alone, his line waits for the first click, and a chip
      // asks for it.
      if (activated()) playCoachLine(line.src);
      else setWaiting(true);
    },
    [sound],
  );
  const say = useCallback(
    (line: Line) => {
      if (busy.current) queue.current.push(line);
      else startLine(line);
    },
    [startLine],
  );
  useEffect(() => {
    if (!waiting || !caption) return;
    const go = () => {
      playCoachLine(caption.src);
      setWaiting(false);
      // From the top, now that it can be heard.
      setCaption({ ...caption });
      setTalking(true);
    };
    window.addEventListener("pointerup", go, { once: true });
    window.addEventListener("keydown", go, { once: true });
    return () => {
      window.removeEventListener("pointerup", go);
      window.removeEventListener("keydown", go);
    };
  }, [waiting, caption]);
  // The caption stays as long as the line takes to say, whatever the
  // traveller does meanwhile; then the next in the queue, after a breath.
  useEffect(() => {
    if (!caption) return;
    const len = caption.text.length;
    const quiet = setTimeout(() => setTalking(false), len * 62);
    const t = setTimeout(() => {
      setCaption(null);
      setWaiting(false);
      busy.current = false;
      const next = queue.current.shift();
      if (next) setTimeout(() => !busy.current && startLine(next), 700);
    }, 1500 + len * 65);
    return () => {
      clearTimeout(t);
      clearTimeout(quiet);
    };
  }, [caption, startLine]);

  // Only on road the student has really travelled - up to the challenge
  // they are on - never on stretches they are only previewing.
  const realTo = allDone ? Infinity : road.stops[hereIndex] + 12;

  // CROSSING INTO A NEW SECTION for real - forward, into one the student
  // has reached: the fanfare, and Coach names where they have arrived.
  const reached = reachedPhase(stops, phases);
  const lastPhase = useRef(phase?.id);
  useEffect(() => {
    if (phase?.id === lastPhase.current) return;
    const from = phases.findIndex((p) => p.id === lastPhase.current);
    const to = phases.findIndex((p) => p.id === phase?.id);
    lastPhase.current = phase?.id;
    if (!(to > from && to <= reached)) return;
    if (sound) playGateChime();
    const k = TALK.arrive[to - 1];
    if (k !== undefined) say({ text: ROAD_TALK[k], src: talkClip(k) });
  }, [phase, phases, reached, sound, say]);

  // HIS PLACES ON THE ROAD, each said once per visit as the traveller
  // comes to it: the welcome and his first three lines, the encouragements
  // spread between challenges, and the lines for the plunge and the city.
  const spots = useMemo(() => {
    const ranges = phaseRanges(road.stops, stops.map((st) => st.phase), road.finish);
    const span = (id: string) => ranges.find((r) => r.id === id);
    const between = (i: number) => (road.stops[i] + road.stops[Math.min(i + 1, road.stops.length - 1)]) / 2;
    const out: { s: number; line: Line }[] = coachSpots(road)
      .slice(0, 3)
      .map((cs, i) => ({ s: cs, line: { text: ROAD_LINES[i], src: roadLineClip(i) } }));
    const talk = (s: number | undefined, k: number) => {
      if (s !== undefined && Number.isFinite(s)) out.push({ s, line: { text: ROAD_TALK[k], src: talkClip(k) } });
    };
    TALK.along.forEach(([after, k]) => after < road.stops.length && talk(between(after), k));
    const r = span("R");
    const y = span("Y");
    talk(r && r.from - 22, TALK.beforePlunge);
    talk(r && r.to - 30, TALK.bottom);
    talk(y && y.from + 110, TALK.city);
    return out.sort((a, b) => a.s - b.s);
  }, [road, stops]);
  const spoken = useRef(new Set<number>());
  useEffect(() => {
    // Anywhere round his place will do - he is in the sky - including just
    // past it, where a jump to the start of a section lands.
    const i = spots.findIndex((sp, k) => !spoken.current.has(k) && sp.s <= realTo && at > sp.s - 30 && at < sp.s + 14);
    if (i < 0) return;
    spoken.current.add(i);
    say(spots[i].line);
  }, [at, spots, realTo, say]);

  // Back for another session: once a day, as the road opens.
  useEffect(() => {
    if (hereIndex === 0) return;
    try {
      const today = new Date().toDateString();
      if (localStorage.getItem("coach-welcome-back") === today) return;
      localStorage.setItem("coach-welcome-back", today);
    } catch {
      // no storage: say it
    }
    const k = TALK.back;
    say({ text: ROAD_TALK[k], src: talkClip(k) });
  }, [hereIndex, say]);

  // Other students at a checkpoint on real road: once a visit.
  const greetedMates = useRef(false);
  useEffect(() => {
    if (greetedMates.current || !stop?.classmates?.length) return;
    if (Math.abs(road.stops[nearest] - at) > 12 || road.stops[nearest] > realTo) return;
    greetedMates.current = true;
    const k = TALK.classmates;
    say({ text: ROAD_TALK[k], src: talkClip(k) });
  }, [stop, nearest, at, road, realTo, say]);

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
      className={`relative w-full touch-none select-none ${heightClass} overflow-hidden bg-[#070c18] outline-none`}
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

      <SkyCoach talking={talking} />

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
            {caption.text}
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

      {waiting && caption && (
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
