"use client";

import { LockIcon } from "./lock-icon";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AHEAD, GATE_BEFORE, Travel, layoutRoad, progressAt, reachedPhase, sAtProgress, victoryStart } from "./road-geometry";
import { RoadGuard } from "./road-guard";
import { structurePlan } from "./megastructures";
import type { MonumentPlan } from "./monuments";
import { RoadDial } from "./road-dial";
import { useRoadChrome } from "./road-chrome";
import { RoadLegendButton } from "./road-legend";
import { SoundToggle } from "@/components/sound-toggle";
import { soundOn, useSound } from "@/lib/sound";
import { SkyCoach } from "./sky-coach";
import { ROAD_CHEERS, ROAD_LINES, ROAD_TALK, cheerClip, roadLineClip, talkClip } from "@/data/greetings";
import { FINISH_TUNNEL } from "./finish-gate";
import { activated, playApplause, playCoachLine, playGateChime, playRoadWhoosh, playXpChime, startRoadWind } from "@/lib/feedback-fx";
import { Confetti } from "@/components/confetti";
import { useStore } from "@/lib/store";
import type { PickPortal, ViewMode, WorldPhase, WorldStop } from "./adventure-world";

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

/** The speed tracers: each one's angle out from the vanishing point (hugging
 *  the left and right edges, a few along the top), when it starts, how long
 *  it takes, and its colour. */
const TRACERS = Array.from({ length: 44 }, (_, i) => {
  // Round the view, but not straight down the road ahead.
  const a = (i * 137.5) % 360;
  return {
    a: a > 70 && a < 110 ? a + 60 : a,
    d: ((i * 0.29) % 0.9).toFixed(2),
    t: (0.3 + ((i * 0.11) % 0.25)).toFixed(2),
    c: ["#ffffff", "#1FE890", "#22D9F5", "#ffffff", "#FFD60A", "#FF4A2B", "#ffffff", "#F53DE0"][i % 8],
  };
});

/** How long each of Coach's tunnel cheers runs, in seconds (the clips in
 *  /coach/cheer-NN.mp3), so the captions keep time with his voice. */
const CHEER_SECONDS = [1.71, 2.01, 5.37, 3.5, 2.74, 3.86, 4.14, 3.36, 6.24];

/** Where on the road this visit last was (in challenges), for coming
 *  back to it. */
const ROAD_AT_KEY = "sb-road-at";

/** 0-1, for the white wash into the finish. */
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function AdventureScreen({
  stops,
  phases,
  fallbackAvatar = "/lion-head.png",
  skyImage,
  heightClass = "h-[calc(100dvh-4rem)]",
  demo = false,
  demoOnce = false,
  calm = false,
  startProgress = null,
  onProgress,
  arrive = null,
  leaveTo = null,
  showcase,
}: {
  /** With demo: instead of driving to the next challenge, glide on a
   *  loop through the city of every colour at the end of the road - the
   *  landing page's look at the whole game. */
  showcase?: "victory";
  stops: WorldStop[];
  phases: WorldPhase[];
  fallbackAvatar?: string;
  skyImage?: string;
  /** How tall the road stands - the screen under the header, unless the
   *  page around it needs room of its own. */
  heightClass?: string;
  /** A silent, self-playing preview (the landing page): glide down the
   *  road past the challenges done, up to the next one, tap it, dive in -
   *  and round again. No sound, no Coach, no controls. */
  demo?: boolean;
  /** With demo: play it once and, after the dive, open the challenge
   *  (for recording the tour film). */
  demoOnce?: boolean;
  /** The calm "3D" view: the road without its stunts, seen from above. */
  calm?: boolean;
  /** Where to open, carried over from the view just left (see progressAt). */
  startProgress?: number | null;
  /** Told where the traveller is as they go, in the same terms. */
  onProgress?: (p: number) => void;
  /** Switching views: the view just left, or the one being switched to. */
  arrive?: ViewMode | null;
  leaveTo?: ViewMode | null;
}) {
  const road = useMemo(() => layoutRoad(stops.length, stops.map((s) => s.phase), { calm }), [stops, calm]);
  // The checkpoint the student is on.
  const hereIndex = Math.max(0, stops.findIndex((s) => s.state === "here"));
  // The challenges open and not yet done, in road order.
  const openStops = stops.map((st, i) => (st.state === "here" ? i : -1)).filter((i) => i >= 0);
  // The road opens at the challenge the student is on, its Start button
  // showing - or, for someone new, at the very beginning, in the open land
  // before the first. (Back at the beginning, a button flies them on to
  // where they are.)
  const start = useMemo(() => {
    // (For looking at a landmark: ?road-at=mic|speakers|headphones.)
    if (typeof window !== "undefined") {
      const at = new URLSearchParams(window.location.search).get("road-at") as keyof MonumentPlan | null;
      // (And the stunts, the victory stretch, the finish: ?road-at=loop.)
      const stunt = road.stunts.find((z) => z.kind === (at as string));
      if (stunt) return Math.max(0, stunt.a - 40);
      if ((at as string) === "victory") return victoryStart(road) + 20;
      if ((at as string) === "finish") return road.finish - 90;
      const weave = road.skyways.find((w) => (w as { wave?: boolean }).wave);
      if ((at as string) === "weave" && weave) return weave.a + 60;
      if ((at as string) === "tube") return structurePlan(road).tunnels[0].from - 10;
      const ringRun = structurePlan(road).tunnels.find((t) => t.rings);
      if ((at as string) === "rings" && ringRun) return ringRun.from - 10;
      const m = at ? structurePlan(road).monuments[at] : undefined;
      const first = Array.isArray(m) ? m[0] : m;
      const ms = typeof first === "number" ? first : first && "s" in first ? first.s : first?.a;
      if (ms !== undefined) return Math.max(0, ms - 150);
    }
    // Carried over from the other view - but never past where this road
    // lets them go: the two roads are different lengths, and a spot near
    // the end of one could land past the other's finish line.
    if (startProgress !== null) {
      const done = stops.every((st) => st.state === "done");
      return Math.min(sAtProgress(road, startProgress), done ? road.finish + 10 : road.finish - AHEAD - 12);
    }
    // Back from a challenge (or anywhere, this visit): where it was left.
    if (!demo)
      try {
        const left = Number(sessionStorage.getItem(ROAD_AT_KEY));
        if (sessionStorage.getItem(ROAD_AT_KEY) && Number.isFinite(left)) {
          const done = stops.every((st) => st.state === "done");
          return Math.min(sAtProgress(road, left), done ? road.finish + 10 : road.finish - AHEAD - 12);
        }
      } catch {}
    return hereIndex > 0 ? Math.max(0, road.stops[hereIndex] - AHEAD - 2) : 0;
    // (Where to open is decided once, on opening.)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [road, hereIndex]);
  const [travel] = useState(() => new Travel(start));
  // Bumped to rebuild the 3D scene after a failure (RoadGuard).
  const [worldKey, setWorldKey] = useState(0);
  const rebuildWorld = useCallback(() => {
    window.setTimeout(() => setWorldKey((k) => k + 1), 400);
  }, []);
  const [s, setS] = useState(start);
  const frame = useRef<HTMLDivElement>(null);
  // Only draw while the road is on screen - a page with the road far
  // below (or a tab in the background) shouldn't be running a 3D scene.
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // The student's own photo on the traveller; until they have set one, a
  // stand-in (on the preview, Tariq).
  const { state } = useStore();
  const avatar = state.avatar && /^(data:image|\/|https?:)/.test(state.avatar) ? state.avatar : fallbackAvatar;

  const progressTo = useRef(onProgress);
  useEffect(() => {
    progressTo.current = onProgress;
  }, [onProgress]);
  const onMove = useCallback(
    (next: number) => {
      setS(next);
      progressTo.current?.(progressAt(road, next));
      // Remembered for this visit, so coming back from a challenge opens
      // the road where it was left.
      if (!demo)
        try {
          sessionStorage.setItem(ROAD_AT_KEY, String(progressAt(road, next)));
        } catch {}
    },
    [road, demo],
  );
  const chrome = useRoadChrome();

  // TILT TO LOOK AROUND. Tip the phone left and the view swings to show
  // more of the land on the right; tip it right, more on the left; tip
  // the top toward you and it lifts to the distance. It measures from
  // however the phone is being held, and drifts back to centre when held
  // still in a new way. The phone's sideways turn is accounted for.
  useEffect(() => {
    const el = frame.current;
    if (!el || demo || typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return;
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    let base: { lr: number; fb: number } | null = null;
    let smooth = { lr: 0, fb: 0 };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      const angle = (screen.orientation?.angle ?? 0) % 360;
      const [lr, fb] =
        angle === 90 ? [e.beta, -e.gamma] : angle === 270 || angle === -90 ? [-e.beta, e.gamma] : [e.gamma, e.beta];
      // While travelling the view is locked straight ahead (the world's
      // camera sees to that), and however the phone is held then becomes
      // straight ahead for when they stop.
      if (!base || Math.abs(travel.v) > 0.02 || travel.target !== null) {
        base = { lr, fb };
        smooth = { lr, fb };
        travel.look.yaw = 0;
        travel.look.pitch = 0;
        return;
      }
      // The readings smoothed hard - a phone's sensor jitters - and the
      // rest position following slowly, so a new way of holding it becomes
      // the new straight-ahead.
      smooth.lr += (lr - smooth.lr) * 0.08;
      smooth.fb += (fb - smooth.fb) * 0.08;
      base.lr += (smooth.lr - base.lr) * 0.002;
      base.fb += (smooth.fb - base.fb) * 0.002;
      const clamp = (v: number) => Math.max(-1, Math.min(1, v));
      // A small range: a glance, not a turn of the head.
      travel.look.yaw = clamp((smooth.lr - base.lr) / 30) * 0.28;
      travel.look.pitch = clamp((base.fb - smooth.fb) / 30) * 0.14;
    };
    let listening = false;
    const listen = () => {
      if (listening) return;
      listening = true;
      window.addEventListener("deviceorientation", onTilt);
    };
    // iPhones ask first. The question must come from a real tap - a
    // touchend or click; a pointerdown doesn't count - and be put to
    // DeviceOrientationEvent itself, not a detached copy of the function.
    type Asks = { requestPermission?: () => Promise<"granted" | "denied"> };
    const DOE = DeviceOrientationEvent as unknown as Asks;
    const asks = typeof DOE.requestPermission === "function";
    const firstTouch = () => {
      el.removeEventListener("touchend", firstTouch);
      el.removeEventListener("click", firstTouch);
      try {
        DOE.requestPermission!()
          .then((r) => r === "granted" && listen())
          .catch(() => {});
      } catch {
        // not allowed here - tilt stays off
      }
    };
    if (asks) {
      el.addEventListener("touchend", firstTouch);
      el.addEventListener("click", firstTouch);
    } else listen();
    return () => {
      el.removeEventListener("touchend", firstTouch);
      el.removeEventListener("click", firstTouch);
      window.removeEventListener("deviceorientation", onTilt);
      travel.look.yaw = 0;
      travel.look.pitch = 0;
    };
  }, [travel, demo]);

  // Two fingers pinching together, in full screen: out of full screen.
  useEffect(() => {
    const el = frame.current;
    if (!el || !chrome.full) return;
    const pts = new Map<number, { x: number; y: number }>();
    let start = 0;
    const gap = () => {
      const [a, b] = [...pts.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    const down = (e: PointerEvent) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) start = gap();
    };
    const move = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2 && start > 0 && gap() < start * 0.65) {
        start = 0;
        chrome.setFull(false);
      }
    };
    const up = (e: PointerEvent) => {
      pts.delete(e.pointerId);
      start = 0;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [chrome]);
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
    if (!el || demo) return;
    let lastY: number | null = null;
    // A press that barely moves is a tap - on a portal, perhaps - not a drag.
    let from: { x: number; y: number; t: number; far: number } | null = null;
    const down = (e: PointerEvent) => {
      // The letters and buttons over the road are buttons, not road.
      if ((e.target as HTMLElement).closest("button, a, [data-road-control]")) return;
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
      travel.push(dy * 0.07, 0.5);
    };
    const up = (e: PointerEvent) => {
      lastY = null;
      const tap = from && from.far < 8 && performance.now() - from.t < 450;
      from = null;
      if (tap && e.type === "pointerup") onTap.current(e.clientX, e.clientY);
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      travel.push(e.deltaY * 0.0075);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        travel.push(e.key === "ArrowDown" ? 1.5 : -1.5);
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
  }, [travel, demo]);

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
    const t = setTimeout(() => setBanner(null), 1300);
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
  // The app's one sound switch (lib/sound.ts).
  const sound = useSound() && !demo;
  // THE WIND, rising and falling with how fast the road is moving - only
  // with sound on, and only once the student has touched the page.
  useEffect(() => {
    if (!sound) return;
    let wind: ReturnType<typeof startRoadWind> = null;
    let raf = 0;
    const tick = () => {
      if (!wind && activated() && travel.feel > 0.05) wind = startRoadWind();
      wind?.set(document.hidden || travel.portal ? 0 : travel.feel);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      wind?.stop();
    };
  }, [sound, travel]);


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
      if (demo) return;
      busy.current = true;
      setCaption(line);
      setTalking(true);
      // The switch itself as well as the state: on the very first render
      // the state may not have caught up.
      if (!sound || !soundOn()) return;
      // A browser lets a page make sound only once it has been clicked,
      // tapped or typed on - scrolling does not count. Travelled here by
      // scrolling alone, his line waits for the first click, and a chip
      // asks for it.
      if (activated()) playCoachLine(line.src);
      else setWaiting(true);
    },
    [sound, demo],
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

  // COACH AND THE FANFARE ONLY FOR REAL PROGRESS. Scrolling the road -
  // touring the landscape, looking ahead, going back - is silent: no
  // whoosh, no chime, no lion. He appears, and the fanfare plays, only
  // when the student has actually moved through the challenges since the
  // road last saw them: a section newly opened (the fanfare, and he names
  // where they have arrived), a challenge newly passed (a word of
  // encouragement), or the very first time the road opens (his welcome).
  const reached = reachedPhase(stops, phases);
  const passedCount = stops.filter((st) => st.state === "done").length;
  const progressSeen = useRef(false);
  useEffect(() => {
    if (demo || progressSeen.current) return;
    if (document.body.dataset.touring) return;
    progressSeen.current = true;
    let before: { passed: number; reached: number } | null = null;
    try {
      before = JSON.parse(localStorage.getItem("road-progress") ?? "null");
    } catch {
      // nothing saved: treat as a first visit
    }
    try {
      localStorage.setItem("road-progress", JSON.stringify({ passed: passedCount, reached }));
    } catch {
      // no storage: he may greet again next time
    }
    if (!before) {
      say({ text: ROAD_LINES[0], src: roadLineClip(0) });
      return;
    }
    if (reached > before.reached) {
      if (sound) playGateChime();
      const k = TALK.arrive[reached - 1];
      if (k !== undefined) say({ text: ROAD_TALK[k], src: talkClip(k) });
      return;
    }
    if (passedCount > before.passed) {
      // The encouragement for this stretch of road: the last of his
      // "along the way" lines at or before the challenge just passed.
      const along = [...TALK.along].reverse().find(([after]) => after <= passedCount - 1) ?? TALK.along[0];
      say({ text: ROAD_TALK[along[1]], src: talkClip(along[1]) });
    }
  }, [demo, passedCount, reached, sound, say]);

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

  // THE DEMO: the road driving itself, round and round.
  const [tap, setTap] = useState(false);
  const [fade, setFade] = useState(false);
  useEffect(() => {
    if (!demo || !onScreen) return;
    if (showcase === "victory") {
      // Through the city of colour, up to the ring tunnel, and round again.
      const from = victoryStart(road) + 20;
      const to = road.finish - FINISH_TUNNEL - 80;
      let raf = 0;
      let last = performance.now();
      let fading = 0;
      const glide = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        travel.place(Math.min(to, travel.s + 48 * dt));
        if (travel.s >= to && !fading) {
          fading = window.setTimeout(() => {
            setFade(true);
            window.setTimeout(() => {
              travel.jump(from);
              setFade(false);
              fading = 0;
              last = performance.now();
            }, 500);
          }, 200);
        }
        raf = requestAnimationFrame(glide);
      };
      travel.jump(from);
      raf = requestAnimationFrame(glide);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(fading);
      };
    }
    const firstOpen = Math.max(0, stops.findIndex((st) => st.state === "here"));
    const target = road.stops[firstOpen];
    const from = Math.max(0, road.stops[Math.max(0, firstOpen - 3)] - AHEAD - 6);
    const stopAt = target - AHEAD - 2;
    let raf = 0;
    const clock = { last: performance.now() };
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (ms: number, f: () => void) => timers.push(setTimeout(f, ms));
    const drive = (now: number) => {
      const dt = Math.min(0.05, (now - clock.last) / 1000);
      clock.last = now;
      // Easing into the stop: full speed, slowing over the last stretch.
      const left = stopAt - travel.s;
      const speed = Math.max(8, Math.min(120, left * 1.4));
      travel.place(Math.min(stopAt, travel.s + speed * dt));
      if (travel.s < stopAt - 0.05) {
        raf = requestAnimationFrame(drive);
        return;
      }
      // Arrived: a tap on the portal, the dive, and back to the start.
      later(900, () => setTap(true));
      later(1500, () => {
        setTap(false);
        travel.enterPortal(target);
        setDiving(true);
      });
      if (demoOnce) {
        later(2300, () => router.push(`/challenges/${stops[firstOpen].slug}`));
        return;
      }
      later(3500, () => setFade(true));
      later(4000, () => {
        travel.jump(from);
        setDiving(false);
      });
      later(4400, () => {
        setFade(false);
        clock.last = performance.now();
        raf = requestAnimationFrame(drive);
      });
    };
    travel.jump(from);
    raf = requestAnimationFrame(drive);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [demo, demoOnce, onScreen, stops, road, travel, router, showcase]);

  // A CHALLENGE NOT YET OPEN. Explore as far ahead as you like, but tap
  // one you have not reached and you are told so, and taken back to the
  // one you are on.
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const backToCurrent = () => {
    setNotice("Complete your current section to unlock this one.");
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

  // THE BARRAGE: down the ring tunnel into the finish, Coach overhead,
  // cheering. The tunnel is cut into as many stretches as he has lines,
  // and each stretch, as you enter it, sets off the next one - so the
  // pace is yours: drift through and they come one by one with room to
  // breathe; go through flat out and they pile in on top of each other,
  // one on the heels of the last. (His voice takes its turn - lib/
  // voice-floor - so a line set off while he's still talking follows
  // straight after it rather than over it.) Only for someone who has
  // done every challenge.
  const tunnelFrom = road.finish - FINISH_TUNNEL;
  const inTunnel = allDone && !demo && at > tunnelFrom && at < road.finish - 6;
  const cheerAt = inTunnel
    ? Math.min(ROAD_CHEERS.length - 1, Math.floor(((at - tunnelFrom) / (FINISH_TUNNEL - 40)) * ROAD_CHEERS.length))
    : -1;
  const [cheer, setCheer] = useState(-1);
  const lastCheer = useRef(-1);
  const cheerStops = useRef<(() => void)[]>([]);
  const cheerClear = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hushCheers = useRef<() => void>(() => {});
  useEffect(() => {
    hushCheers.current = () => {
      cheerStops.current.forEach((stop) => stop());
      cheerStops.current = [];
      clearTimeout(cheerClear.current);
      setCheer(-1);
    };
  }, []);
  useEffect(() => {
    if (cheerAt <= lastCheer.current) return;
    // Every stretch passed since the last frame gets its line - none is
    // skipped, however fast.
    for (let i = lastCheer.current + 1; i <= cheerAt; i++) {
      if (sound) cheerStops.current.push(playCoachLine(cheerClip(i)));
    }
    lastCheer.current = cheerAt;
    setCheer(cheerAt);
    // The words stay up while he says them, or until the next stretch.
    clearTimeout(cheerClear.current);
    cheerClear.current = setTimeout(() => setCheer(-1), ((CHEER_SECONDS[cheerAt] ?? 3) + 0.6) * 1000);
  }, [cheerAt, sound]);
  useEffect(() => () => hushCheers.current(), []);

  // CONFETTI CANNONS in the second half of the tunnel, near its end: one
  // goes off from the right, then the left, then the right, then the
  // left - each set off as the traveller reaches its spot, so the faster
  // you go the closer together they come.
  const BURSTS = [0.6, 0.72, 0.83, 0.93];
  const burstAt = inTunnel ? BURSTS.filter((f) => at - tunnelFrom >= f * FINISH_TUNNEL).length - 1 : -1;
  const [bursts, setBursts] = useState<{ key: number; side: "left" | "right" }[]>([]);
  const lastBurst = useRef(-1);
  useEffect(() => {
    if (burstAt <= lastBurst.current) return;
    const fresh: { key: number; side: "left" | "right" }[] = [];
    for (let i = lastBurst.current + 1; i <= burstAt; i++) fresh.push({ key: i, side: i % 2 ? "left" : "right" });
    lastBurst.current = burstAt;
    if (sound) playXpChime();
    setBursts((b) => [...b, ...fresh]);
  }, [burstAt, sound]);

  // THE FINISH: once, when the traveller passes under the arch.
  const [finished, setFinished] = useState(false);
  const didFinish = useRef(false);
  const hushFinish = useRef<() => void>(() => {});
  useEffect(() => {
    // (Only for someone who has done every challenge - however they
    // came to be standing at the line.)
    if (!atFinish || !allDone || didFinish.current) return;
    didFinish.current = true;
    // (The cheering stops for his finishing words.)
    hushCheers.current();
    setFinished(true);
    if (sound) {
      playApplause();
      hushFinish.current = playCoachLine(roadLineClip(3), FINISH_DELAY);
    }
  }, [atFinish, allDone, sound]);
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
  // (Once through and closed, no more white wash - looking back down the
  // road from inside the vortex.)
  const [finishSeen, setFinishSeen] = useState(false);
  const closeFinish = () => {
    hushFinish.current();
    setFinished(false);
    setFinishSeen(true);
  };

  // Start, replay or locked: under the traveller on the full ride; in
  // the calm view from above, up in the middle of the screen, over the
  // portal's name on the road - never on top of the traveller.
  const actions = (
    <>
        {canStart && !diving && (
          <button
            type="button"
            onClick={() => dive(stop.slug, road.stops[nearest])}
            // Upright: under the traveller, just above the letters. Held
            // sideways on a phone: down in the bottom-left corner, under the
            // left thumb - the dial is under the right one.
            className={
              calm
                ? "pointer-events-auto rounded-full px-7 py-3 text-base font-bold text-navy-950 shadow-lg"
                : "pointer-events-auto -mb-1 rounded-full px-7 py-3 text-base font-bold text-navy-950 shadow-lg [@media(orientation:landscape)_and_(max-height:520px)]:absolute [@media(orientation:landscape)_and_(max-height:520px)]:mb-0 [@media(orientation:landscape)_and_(max-height:520px)]:left-[max(0.75rem,env(safe-area-inset-left))] [@media(orientation:landscape)_and_(max-height:520px)]:bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.5rem))]"
            }
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
            <LockIcon className="-mt-0.5 mr-1 size-3.5" />Locked
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
    </>
  );

  return (
    <div
      ref={frame}
      tabIndex={0}
      role="application"
      aria-label="The S.T.O.R.Y. road. Drag down or use the down arrow to travel forward."
      className={`relative w-full touch-none select-none ${heightClass} overflow-hidden bg-[#070c18] outline-none`}
    >
      {/* Guarded: if the scene fails or the phone takes the graphics back,
          it's rebuilt in place, at the same spot (road-guard.tsx). */}
      <RoadGuard onRestart={() => setWorldKey((k) => k + 1)}>
        <AdventureWorld
          key={worldKey}
          stops={stops}
          phases={phases}
          travel={travel}
          onMove={onMove}
          onLost={rebuildWorld}
          avatar={avatar}
          pickRef={pickRef}
          limit={limit}
          skyImage={skyImage}
          active={onScreen}
          calm={calm}
          arrive={arrive}
          leaveTo={leaveTo}
        />
      </RoadGuard>

      {bannerPhase && (
        <div key={banner!.key} className="phase-banner pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center px-4">
          <div
            className="flex items-center gap-3 rounded-xl border-2 bg-[#070c18]/90 px-4 py-2 shadow-2xl backdrop-blur"
            style={{ borderColor: bannerPhase.color, boxShadow: `0 0 40px -6px ${bannerPhase.color}` }}
          >
            <span className="text-4xl font-extrabold leading-none sm:text-5xl" style={{ color: bannerPhase.color }}>
              {bannerPhase.id}
            </span>
            <span className="flex flex-col text-left">
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-ink-faint">Now entering</span>
              <span className="text-lg font-bold leading-tight tracking-tight text-ink sm:text-2xl">{bannerPhase.name}</span>
            </span>
          </div>
        </div>
      )}

      {/* The app's sound switch - the same one as in the header, which
          full screen hides, so here it is on the road itself. */}
      {!demo && chrome.full && (
        // Clear of the camera cut-out and rounded corners, whichever way
        // the phone is turned.
        <div
          className="absolute z-20"
          style={{ right: "max(0.75rem, env(safe-area-inset-right))", top: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <SoundToggle className="bg-navy-900/80 backdrop-blur" />
        </div>
      )}

      {/* How the road works - under the sound button, on the right, where
          the switch row on the left leaves room. Not in full screen. */}
      {!demo && !chrome.full && (
        <div
          className="absolute z-20"
          style={{ right: "max(0.75rem, env(safe-area-inset-right))", top: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <RoadLegendButton />
        </div>
      )}

      {/* Speed: faint streaks rushing past the edges, as strong as the
          road is fast (--road-speed, set by the camera each frame). */}
      <div aria-hidden className="road-streaks pointer-events-none absolute inset-0 z-[5]" />
      {/* FLAT OUT: light tracers streaking past along the edges of the view,
          out from where the road meets the sky - the main feel of speed. */}
      <div aria-hidden className="road-tracers pointer-events-none absolute inset-0 z-[5] overflow-hidden">
        {TRACERS.map((t, i) => (
          <span
            key={i}
            style={{ ["--a" as string]: `${t.a}deg`, ["--d" as string]: `${t.d}s`, ["--t" as string]: `${t.t}s`, ["--c" as string]: t.c }}
          />
        ))}
      </div>
      {/* Now and then, a shooting star across the top of the sky. */}
      <span aria-hidden className="road-shooting-star pointer-events-none absolute left-[10%] top-[12%] z-[4] h-px w-24" />

      <SkyCoach talking={talking || cheer >= 0} />

      {/* The confetti cannons: each its own burst, from its own side. */}
      {bursts.map((b) => (
        <div key={b.key} aria-hidden className="pointer-events-none absolute inset-0 z-[11]">
          <Confetti contained side={b.side} count={90} duration={3800} />
        </div>
      ))}

      {/* The barrage, in words: big, bright and one after another, over
          the tunnel - under Coach, above the traveller. */}
      {cheer >= 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-[24%] z-10 flex justify-center px-6">
          <p
            key={cheer}
            aria-live="polite"
            className="coach-note-in spectrum-text max-w-lg text-center text-2xl font-black leading-tight tracking-tight text-balance sm:text-4xl"
            style={{ filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.9))" }}
          >
            {ROAD_CHEERS[cheer]}
          </p>
        </div>
      )}


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
            <LockIcon className="-mt-0.5 mr-1.5 size-4" />{notice}
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
      {demo && tap && (
        <span aria-hidden className="demo-tap pointer-events-none absolute left-1/2 top-[52%] z-30 size-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 bg-white/25" />
      )}
      {demo && (
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-0 z-40 bg-[#070c18] transition-opacity duration-400 ${fade ? "opacity-100" : "opacity-0"}`}
        />
      )}
      {diving && (
        <div className="portal-flash pointer-events-none absolute inset-0 z-30 grid place-items-center">
          <span
            className={`${demo ? "text-2xl" : "text-4xl"} font-extrabold tracking-tight text-white`}
            style={{ textShadow: `0 0 24px ${phase?.color}, 0 0 60px ${phase?.color}` }}
          >
            Start Challenge
          </span>
        </div>
      )}

      {/* Into the vortex: the screen washes to white as the traveller goes
          in, then clears to Coach's words. (Only for someone who has done
          every challenge - for anyone else the road stops short of it.) */}
      {allDone && !demo && !finishSeen && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[29] bg-white"
          style={{
            opacity: finished ? 0 : clamp01((at - (road.finish - 34)) / 30),
            transition: finished ? "opacity 1.6s ease 0.4s" : "none",
          }}
        />
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

      {/* NEXT CHALLENGE: fly straight to just before the next portal
          that's open and not yet done - tap again for the one after,
          round to the first. Held in one place in the heads-up display,
          under the 2D / 3D / 4D switch (adventure-view.tsx), portrait
          and landscape alike - so it never jumps about or covers the
          Start button. */}
      {openStops.length > 0 && !demo && !diving && (
        <button
          type="button"
          onClick={() => {
            const here = travel.s + AHEAD;
            const next = openStops.find((i) => road.stops[i] > here + 4) ?? openStops[0];
            travel.goTo(Math.max(0, road.stops[next] - AHEAD - 2));
          }}
          aria-label="Next open challenge"
          className="absolute z-30 flex items-center gap-1.5 rounded-full border-2 bg-navy-950/85 py-1.5 pl-3.5 pr-3 text-xs font-bold text-ink shadow-lg backdrop-blur"
          style={{
            left: "max(0.75rem, env(safe-area-inset-left))",
            top: "calc(max(0.75rem, env(safe-area-inset-top)) + 2.75rem)",
            borderColor: phase?.color,
            boxShadow: `0 0 16px -4px ${phase?.color}`,
          }}
        >
          Next challenge
          <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
            <path d="M5 5.5v13a1 1 0 0 0 1.5.86l10-6.5a1 1 0 0 0 0-1.72l-10-6.5A1 1 0 0 0 5 5.5z" />
            <rect x="17.5" y="5" width="2.5" height="14" rx="1" />
          </svg>
        </button>
      )}

      {calm && !demo && (
        <div className="pointer-events-none absolute inset-x-0 top-[40%] z-20 flex flex-col items-center px-4">{actions}</div>
      )}

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 bg-gradient-to-t from-[#070c18]/95 to-transparent px-4 pt-16 text-center"
        // Clear of a phone's home bar and rounded corners, in full screen.
        style={{ paddingBottom: "max(1.5rem, calc(env(safe-area-inset-bottom) + 0.75rem))" }}
      >
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
        {!calm && actions}
        {atGate && (
          <span className="mb-2 rounded-full border border-navy-600 bg-navy-900/85 px-4 py-2 text-sm text-ink-muted">
            <LockIcon className="-mt-0.5 mr-1.5 size-4" />Complete every challenge to cross the finish line
          </span>
        )}
        {atFinish && <span className="text-lg font-bold text-ink">The finish line</span>}
        {/* S.T.O.R.Y. - tap a letter to fly to that stretch of road. */}
        <div className="pointer-events-auto mt-3 flex gap-2">
          {phases.map((p) => {
            const on = p.id === phase?.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  // A jump always wins: let go of any travel under way.
                  travel.v = 0;
                  travel.goTo(phaseStart(p.id));
                }}
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
        {/* The dial: hold and push up to go forward, down to go back -
            the other way to travel, beside the letters. */}
        {!demo && (
          <div
            className="pointer-events-auto absolute"
            style={{
              right: "max(0.75rem, env(safe-area-inset-right))",
              bottom: "max(1.25rem, calc(env(safe-area-inset-bottom) + 0.5rem))",
            }}
          >
            <RoadDial travel={travel} color={phase?.color} />
          </div>
        )}
        {/* The section you're in, named under its letter. */}
        {phase && (
          <span className="mt-2 text-sm font-bold tracking-tight" style={{ color: phase.color }}>
            {phase.name}
          </span>
        )}
      </div>
    </div>
  );
}
