"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AHEAD, GATE_BEFORE, Travel, coachSpots, layoutRoad } from "./road-geometry";
import { ROAD_LINES, roadLineClip } from "@/data/greetings";
import { playApplause, playCoachLine, playGateChime, playRoadWhoosh } from "@/lib/feedback-fx";
import { Confetti } from "@/components/confetti";
import { useStore } from "@/lib/store";
import type { WorldPhase, WorldStop } from "./adventure-world";

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

export function AdventureScreen({
  stops,
  phases,
  fallbackAvatar = "/lion-head.png",
}: {
  stops: WorldStop[];
  phases: WorldPhase[];
  fallbackAvatar?: string;
}) {
  const road = useMemo(() => layoutRoad(stops.length), [stops.length]);
  // Start a little before the checkpoint the student is on.
  const hereIndex = Math.max(0, stops.findIndex((s) => s.state === "here"));
  // The traveller opens level with it, its Start button showing.
  const start = Math.max(0, road.stops[hereIndex] - AHEAD - 2);
  const [travel] = useState(() => new Travel(start));
  const [s, setS] = useState(start);
  const frame = useRef<HTMLDivElement>(null);
  // The student's own photo on the traveller; until they have set one, a
  // stand-in (on the preview, Tariq).
  const { state } = useStore();
  const avatar = state.avatar && /^(data:image|\/|https?:)/.test(state.avatar) ? state.avatar : fallbackAvatar;

  const onMove = useCallback((next: number) => setS(next), []);

  // Drag down (or scroll down) to go forward, with momentum.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    let lastY: number | null = null;
    const down = (e: PointerEvent) => {
      // The letters and buttons over the road are buttons, not road.
      if ((e.target as HTMLElement).closest("button")) return;
      lastY = e.clientY;
      travel.push(0, 0);
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (lastY === null) return;
      const dy = e.clientY - lastY;
      lastY = e.clientY;
      travel.push(dy * 0.045, 0.5);
    };
    const up = () => {
      lastY = null;
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
    // The traveller just through its gate, its first checkpoint ahead.
    return Math.max(0, road.stops[i] - GATE_BEFORE + 4 - AHEAD);
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
  const lastPhase = useRef(phase?.id);
  useEffect(() => {
    if (phase?.id === lastPhase.current) return;
    lastPhase.current = phase?.id;
    if (sound) playGateChime();
  }, [phase, sound]);

  // COACH AT THE ROADSIDE. Each time the traveller comes level with him,
  // once per visit: his line, captioned, and spoken if sound is on.
  const spots = useMemo(() => coachSpots(road), [road]);
  const spoken = useRef(new Set<number>());
  const [caption, setCaption] = useState<string | null>(null);
  const [talking, setTalking] = useState<number | null>(null);
  useEffect(() => {
    // As the traveller approaches, while he is still ahead of them and
    // in view - not once they are level, when on a phone he has already
    // slid out of the side of the frame.
    const i = spots.findIndex((cs, k) => !spoken.current.has(k) && at > cs - 20 && at < cs + 2);
    if (i < 0) return;
    spoken.current.add(i);
    setCaption(ROAD_LINES[i]);
    setTalking(i);
    if (sound) playCoachLine(roadLineClip(i));
  }, [at, spots, sound]);
  // The caption stays as long as the line takes to say, whatever the
  // traveller does meanwhile.
  useEffect(() => {
    if (!caption) return;
    // His mouth moves for about as long as the line takes to say.
    const quiet = setTimeout(() => setTalking(null), caption.length * 62);
    const t = setTimeout(() => setCaption(null), 1500 + caption.length * 65);
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

  // THE FINISH: once, when the traveller passes under the arch.
  const [finished, setFinished] = useState(false);
  const didFinish = useRef(false);
  useEffect(() => {
    if (!atFinish || didFinish.current) return;
    didFinish.current = true;
    setFinished(true);
    if (sound) {
      playApplause();
      playCoachLine(roadLineClip(3), 900);
    }
  }, [atFinish, sound]);

  return (
    <div
      ref={frame}
      tabIndex={0}
      role="application"
      aria-label="The S.T.O.R.Y. road. Drag down or use the down arrow to travel forward."
      className="relative h-[calc(100dvh-4rem)] w-full touch-none select-none overflow-hidden bg-[#070c18] outline-none"
    >
      <AdventureWorld stops={stops} phases={phases} travel={travel} onMove={onMove} avatar={avatar} talkingCoach={talking} />

      {bannerPhase && (
        <div key={banner!.key} className="phase-banner pointer-events-none absolute inset-x-0 top-[30%] flex justify-center px-4">
          <div
            className="flex items-center gap-4 rounded-2xl border-2 bg-[#070c18]/90 px-6 py-3 shadow-2xl backdrop-blur"
            style={{ borderColor: bannerPhase.color, boxShadow: `0 0 40px -6px ${bannerPhase.color}` }}
          >
            <span className="text-5xl font-extrabold" style={{ color: bannerPhase.color }}>
              {bannerPhase.id}
            </span>
            <span className="flex flex-col text-left">
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-ink-faint">Now entering</span>
              <span className="text-xl font-bold tracking-tight text-ink">{bannerPhase.name}</span>
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

      {/* What Coach said, as he said it. */}
      {caption && (
        <div className="pointer-events-none absolute inset-x-0 top-[22%] z-10 flex justify-center px-6">
          <p className="coach-note-in max-w-md rounded-2xl border border-figurative/50 bg-[#070c18]/85 px-4 py-3 text-center text-base font-semibold text-ink shadow-xl backdrop-blur">
            &ldquo;{caption}&rdquo; <span className="font-normal text-ink-faint">- Coach</span>
          </p>
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
          <p className="max-w-sm text-sm text-ink-muted text-balance">Every phase, every challenge. Take a bow - you earned every step.</p>
          <button
            type="button"
            onClick={() => setFinished(false)}
            className="mt-2 rounded-full border border-navy-600 bg-navy-800 px-6 py-2.5 text-sm font-semibold text-ink"
          >
            Look back down the road
          </button>
        </div>
      )}

      {/* Where you are. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-1 bg-gradient-to-b from-[#070c18]/90 to-transparent px-4 pb-10 pt-4 text-center">
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
        {canStart && (
          <Link
            href={`/challenges/${stop.slug}`}
            className="pointer-events-auto mb-2 rounded-full px-7 py-3 text-base font-bold text-navy-950 shadow-lg"
            style={{ background: phase?.color, boxShadow: `0 0 30px ${phase?.color}` }}
          >
            Start challenge
          </Link>
        )}
        {locked && (
          <span className="mb-2 rounded-full border border-navy-600 bg-navy-900/85 px-4 py-2 text-sm text-ink-muted">
            🔒 Unlock previous challenge first
          </span>
        )}
        {passed && stop.score !== undefined && (
          <span className="mb-2 rounded-full border border-navy-600 bg-navy-900/85 px-4 py-2 text-sm text-ink">
            Passed · <b style={{ color: phase?.color }}>{stop.score}</b>
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
