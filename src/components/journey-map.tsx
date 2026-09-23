"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  challenges,
  challengesInPhase,
  storyPhases,
  type PhaseId,
  type StoryPhase,
} from "@/data/challenges";
import { categoryById, type CategoryId } from "@/data/categories";
import { CategoryIcon } from "@/components/category-icons";
import { communityPosts } from "@/data/community-activity";
import { challengeProgress } from "@/lib/challenge-progress";
import { challengeXp, openPhaseCount, phaseGate, type PhaseGate } from "@/lib/progress";
import { XpBadge } from "@/components/xp-badge";
import { useStore, type AppState } from "@/lib/store";
import { presence } from "@/data/community-presence";
import { BadgeMedal } from "@/components/badge-medal";
import { VideoStill } from "@/components/video-still";
import { OwnTake, usePeek } from "@/components/own-take";
import { listAllVideos, type StoredVideoMeta } from "@/lib/attempt-videos";
import { CheckIcon, LockIcon, ProfileIcon, TapIcon, ZoomIcon } from "@/components/icons";
import { StudentsHere } from "@/components/students-here";

// The STORY journey as terrain: a winding path of nodes, one per
// challenge, each named in the open beside its marker so the whole road
// reads at a glance. Every phase is a level with its own lettered
// circle and orbiting skills; passed nodes wear their phase's color,
// the student's own face stands on the challenge they're at, and locked
// territory is fogged - the phase after the next one keeps its names
// garbled until the road gets near. Community voices surface beside the
// nodes and fade, a topographic grid breathes through each territory,
// and a checkered finish line waits at the bottom.
//
// Trophies are pinned where they were won: a small gold GPS pin beside
// the node whose take earned the badge, so the road also reads as a
// record. And the map zooms - a pinch on a phone, ctrl+wheel or the
// buttons on a desktop, a double tap either way. At the normal scale
// the pins are dots and the road reads whole; zoomed in, the pins say
// their names and the other students on each challenge appear beside
// it. The zoom is the CSS zoom property, so it's a real layout scale:
// the page grows with it and scrolls as it always did, and the scene
// scrolls sideways for the width that no longer fits.
//
// `preview` renders the map for a given state rather than the store's
// (the landing page shows a worked-in student), with no links; a tap
// on a node calls `onPick` instead.
//
// The map is always reclined, the way a navigation app is: the ground
// tips away while the markers counter-rotate and stay standing on it.
// There was a 2D/3D toggle here; flat was the weaker of the two views
// and a control that offers a worse version of the same thing is a
// question the student shouldn't have to answer.

const ROW_H = 108;
/** The winding: node x-positions cycle through this pattern (percent). */
const X_CYCLE = [50, 76, 50, 24];
const PHASE_GAP = 132; // room above each phase circle: level rule + circle

/** The furthest phase the road reaches: every phase before it is
 *  done and its rank is held. Later phases are locked; earlier ones
 *  stay open, since finished work is never taken away. */
export function useCurrentPhaseIndex(): number {
  const { state, ready } = useStore();
  if (!ready) return 0;
  return Math.max(0, openPhaseCount(state) - 1);
}

interface Node {
  slug: string;
  xp: number;
  title: string;
  vimeoId: string | null;
  accentId: CategoryId;
  x: number; // percent
  y: number; // px
  phase: StoryPhase;
  phaseIndex: number;
  passed: boolean;
  locked: boolean;
  isCurrent: boolean;
}

/** The distinct skills a phase's challenges train, for its orbit. */
function phaseSkills(phase: StoryPhase): CategoryId[] {
  const seen = new Set<CategoryId>();
  for (const c of challengesInPhase(phase.id))
    for (const s of c.targetSkills) seen.add(s);
  return [...seen].slice(0, 4);
}

/** Where each orbiting skill icon sits around the phase circle. */
const ORBIT: { left: string; top: string }[] = [
  { left: "-1.1rem", top: "-0.5rem" },
  { left: "2.9rem", top: "-0.9rem" },
  { left: "3.3rem", top: "1.9rem" },
  { left: "-1.4rem", top: "2.1rem" },
];

/** Deterministic scramble for names the road hasn't earned yet - the
 *  same input always garbles the same way, so server and client agree,
 *  but nothing of the real title survives except its shape. */
const CIPHER = "kzqvxjmwrbgtlpndshcy";
function garble(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const upper = ch >= "A" && ch <= "Z";
    if (!upper && !(ch >= "a" && ch <= "z")) {
      out += ch;
      continue;
    }
    const g = CIPHER[(text.charCodeAt(i) * 7 + i * 3) % CIPHER.length];
    out += upper ? g.toUpperCase() : g;
  }
  return out;
}

const ZOOM_MIN = 1;
const ZOOM_MAX = 2.4;
/** Past this the map is "zoomed in": pins say their names, crowds show. */
const ZOOM_DETAIL = 1.35;

export function JourneyMap({
  preview,
  onPick,
  only,
}: {
  /** Render this state instead of the store's - a worked-in sample. */
  preview?: AppState;
  /** In preview, a tap on a node reports its slug instead of navigating. */
  onPick?: (slug: string) => void;
  /** Draw one phase's stretch of the road rather than all five - the
   *  challenges page shows a phase at a time, chosen above the map. */
  only?: PhaseId;
} = {}) {
  const store = useStore();
  const state = preview ?? store.state;
  const ready = preview ? true : store.ready;
  const storeIndex = useCurrentPhaseIndex();
  const currentIndex = preview ? Math.max(0, openPhaseCount(preview) - 1) : storeIndex;
  const inDemo = usePathname().startsWith("/demo") || !!preview;

  // ---- zoom ----
  const sceneRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  /** The scrolling ancestor, if the map lives inside one (the landing
   *  page's phone frame); otherwise the window scrolls. */
  const scrollParentOf = (el: HTMLElement | null): HTMLElement | null => {
    for (let n = el?.parentElement ?? null; n; n = n.parentElement) {
      const o = getComputedStyle(n).overflowY;
      if (o === "auto" || o === "scroll") return n;
    }
    return null;
  };
  /** Zoom to `next`, keeping the scene point (cx, cy) - viewport px -
   *  under the same spot on screen: the scene scrolls sideways, the
   *  page (or the frame) scrolls down, by exactly the growth. */
  const zoomTo = useCallback((next: number, cx?: number, cy?: number) => {
    const scene = sceneRef.current;
    if (!scene) return;
    const z1 = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
    const z0 = zoomRef.current;
    if (Math.abs(z1 - z0) < 0.001) return;
    const rect = scene.getBoundingClientRect();
    const px = (cx ?? rect.left + rect.width / 2) - rect.left;
    const py = (cy ?? rect.top + Math.min(rect.height, window.innerHeight) / 2) - rect.top;
    const sl = scene.scrollLeft;
    zoomRef.current = z1;
    setZoom(z1);
    // After the new layout: same content point back under the finger.
    requestAnimationFrame(() => {
      scene.scrollLeft = ((sl + px) / z0) * z1 - px;
      const dy = py * (z1 / z0 - 1);
      const sp = scrollParentOf(scene);
      if (sp) sp.scrollTop += dy;
      else window.scrollBy(0, dy);
    });
  }, []);

  // A pinch: two pointers on the scene, the zoom follows their distance.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: zoomRef.current };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      zoomTo(pinch.current.zoom * (dist / pinch.current.dist), (a.x + b.x) / 2, (a.y + b.y) / 2);
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const was = pointers.current.get(e.pointerId);
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    // A double tap toggles between whole and close.
    if (was && e.pointerType !== "mouse" && pointers.current.size === 0) {
      const now = performance.now();
      const prev = lastTap.current;
      if (prev && now - prev.t < 320 && Math.hypot(prev.x - e.clientX, prev.y - e.clientY) < 24) {
        zoomTo(zoomRef.current > 1.05 ? 1 : 1.8, e.clientX, e.clientY);
        lastTap.current = null;
      } else lastTap.current = { t: now, x: e.clientX, y: e.clientY };
    }
  };
  // ctrl+wheel (a trackpad pinch on a laptop) zooms the map, not the page.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      zoomTo(zoomRef.current * Math.exp(-e.deltaY / 240), e.clientX, e.clientY);
    };
    scene.addEventListener("wheel", onWheel, { passive: false });
    return () => scene.removeEventListener("wheel", onWheel);
  }, [zoomTo]);
  const zoomedIn = zoom >= ZOOM_DETAIL;

  // The map is the most expensive thing in the app to keep alive - a
  // tilted plane, a breathing grid, voices surfacing - so it stops
  // when it isn't being looked at. Matters most on the landing page,
  // where it rides inside a phone a long way down the page.
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { rootMargin: "200px" });
    io.observe(scene);
    return () => io.disconnect();
  }, []);

  // ---- who else is here, for the zoomed-in view ----
  const crowd = useMemo(() => presence(), []);
  const crowdFor = (slug: string) => crowd.find((c) => c.slug === slug);

  // ---- trophies, pinned where they were won ----
  // The take that earned a badge is the last attempt before the badge's
  // time; the trophy stands beside that challenge. A badge with no take
  // behind it (a lesson streak, say) has no place on the road.
  const trophiesAt = (() => {
    const at = new Map<string, AppState["badges"]>();
    const attempts = [...state.attempts].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    for (const badge of state.badges) {
      const t = Date.parse(badge.earnedAt) + 5000;
      let slug: string | null = null;
      for (const a of attempts) if (Date.parse(a.at) <= t) slug = a.challengeSlug;
      if (!slug) continue;
      at.set(slug, [...(at.get(slug) ?? []), badge]);
    }
    return at;
  })();

  // The map is far taller than the screen, so a fixed tilt origin would
  // throw most of it beyond the horizon. Instead the origin rides the
  // viewport center while you scroll - the band you're looking at stays
  // level, the road recedes above it and swells below, the way a maps
  // app tilts.
  const tiltRef = useRef<HTMLDivElement>(null);
  const [originY, setOriginY] = useState(0);
  useEffect(() => {
    const el = tiltRef.current;
    if (!el) return;
    const scene = sceneRef.current;
    if (!scene) return;
    const sp = scrollParentOf(scene);
    const update = () => {
      // The scene's rect, not the tilted plane's - the plane's rect
      // would feed the origin back into itself. Divided by the zoom,
      // since the origin is set in the plane's own (zoomed) units.
      const rect = scene.getBoundingClientRect();
      const mid = sp
        ? sp.getBoundingClientRect().top + sp.clientHeight / 2
        : window.innerHeight / 2;
      const center = (mid - rect.top) / zoomRef.current;
      setOriginY(Math.max(0, Math.min(el.offsetHeight, center)));
    };
    if (!onScreen) return;
    const t = window.setTimeout(update, 0);
    const target: HTMLElement | Window = sp ?? window;
    target.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(t);
      target.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [zoom, onScreen]);

  // The student's own recordings, one per passed challenge where this
  // device still holds one - the newest. Read once; posters only.
  const [takes, setTakes] = useState<Map<string, StoredVideoMeta>>(new Map());
  useEffect(() => {
    if (preview) return;
    let alive = true;
    listAllVideos().then((rows) => {
      if (!alive) return;
      const byChallenge = new Map<string, StoredVideoMeta>();
      for (const r of rows) if (r.poster && !byChallenge.has(r.challengeSlug)) byChallenge.set(r.challengeSlug, r);
      setTakes(byChallenge);
    });
    return () => {
      alive = false;
    };
  }, [preview]);
  // The road remembers: beside a passed node, one line the coach said
  // about that take - proof it watched, and a reason to read it again.
  /** What Coach credited on this take, as a couple of short deeds -
   *  "Established the setting", not the whole sentence. A road label
   *  has room for a phrase, and a paragraph beside every circle was
   *  what made the map feel crowded. */
  const winsFor = (slug: string): string[] => {
    const best = [...state.attempts].filter((a) => a.challengeSlug === slug && a.passed).sort((a, b) => b.score - a.score)[0];
    const notes = best?.strengths ?? [];
    return notes
      .slice(0, 2)
      .map((n) => {
        // the first clause, trimmed to five words and de-pronouned
        const clause = n.note.split(/[.,;:]|\s-\s/)[0].trim().replace(/^(you|your)\s+/i, "");
        const words = clause.split(/\s+/).slice(0, 5).join(" ");
        return words.charAt(0).toUpperCase() + words.slice(1);
      })
      .filter(Boolean);
  };

  // The passed node held under a finger, playing its take. The hold
  // starts after a beat, so a tap is still a tap.
  const [held, setHeld] = useState<string | null>(null);
  const holdTimer = useRef<number | null>(null);
  const playedRef = useRef(false);
  const beginHold = (slug: string) => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      setHeld(slug);
      playedRef.current = true;
    }, 220);
  };
  const endHold = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setHeld(null);
  };

  // Lay the trail out top to bottom, phase by phase.
  const nodes: Node[] = [];
  const banners: { phase: StoryPhase; index: number; y: number; locked: boolean; gate: PhaseGate }[] = [];
  let y = 24;
  let step = 0;
  let firstUnpassedSeen = false;
  // One phase, or all of them - the indices stay the phase's real
  // place in the journey either way, because the gates depend on it.
  const walk = storyPhases
    .map((phase, index) => ({ phase, index }))
    .filter(({ phase }) => !only || phase.id === only);
  for (const { phase, index: pi } of walk) {
    const locked = pi > currentIndex;
    const gate = ready ? phaseGate(state, pi) : { open: pi === 0, reason: null, rank: null, xpToGo: 0 };
    banners.push({ phase, index: pi, y, locked, gate });
    y += PHASE_GAP;
    for (const challenge of challengesInPhase(phase.id)) {
      const passed = ready && challengeProgress(challenge, state).passed;
      const isCurrent = !passed && !locked && !firstUnpassedSeen;
      if (isCurrent) firstUnpassedSeen = true;
      nodes.push({
        slug: challenge.slug,
        title: challenge.title,
        vimeoId: challenge.vimeoId,
        xp: challengeXp(challenge),
        accentId: challenge.targetSkills[0],
        x: X_CYCLE[step % X_CYCLE.length],
        y: y + ROW_H / 2,
        phase,
        phaseIndex: pi,
        passed,
        locked,
        isCurrent,
      });
      y += ROW_H;
      step++;
    }
  }
  const peeking = usePeek(nodes.filter((n) => n.passed && takes.has(n.slug)).map((n) => n.slug));
  const finishY = y + 48;
  const height = finishY + 104;
  const done = nodes.filter((n) => n.passed).length;
  const complete = done === nodes.length;
  const lastNode = nodes.at(-1);

  // A voice from the community surfaces beside a random node, then
  // fades - proof the road is being walked, one whisper at a time.
  const [pop, setPop] = useState<{ node: number; post: number; key: number } | null>(null);
  const nodeCount = nodes.length;
  useEffect(() => {
    if (!onScreen) return;
    let alive = true;
    let key = 0;
    let t: number;
    const spawn = () => {
      if (!alive) return;
      setPop({
        node: Math.floor(Math.random() * nodeCount),
        post: Math.floor(Math.random() * communityPosts.length),
        key: key++,
      });
      t = window.setTimeout(spawn, 7000 + Math.random() * 6000);
    };
    t = window.setTimeout(spawn, 3500);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [nodeCount, onScreen]);

  // The colored territory each phase owns, banner to banner.
  const territories = banners.map((b, i) => ({
    phase: b.phase,
    locked: b.locked,
    top: b.y - 12,
    height: (banners[i + 1]?.y ?? finishY) - b.y,
  }));

  // One trail segment per phase, split where the journey has actually
  // reached: the road already walked burns bright in its phase's color,
  // the road ahead is the same color faded - so what's done glows.
  const curIdx = nodes.findIndex((n) => n.isCurrent);
  const walkedUpTo = curIdx === -1 ? nodes.length - 1 : curIdx;
  const curve = (pts: { x: number; y: number }[]): string => {
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const midY = (a.y + b.y) / 2;
      d += ` C ${a.x} ${midY} ${b.x} ${midY} ${b.x} ${b.y}`;
    }
    return d;
  };
  const indexed = nodes.map((n, gi) => ({ n, gi }));
  const segments = walk.map(({ phase, index: pi }) => {
    const own = indexed.filter(({ n }) => n.phaseIndex === pi);
    const prev = indexed.filter(({ n }) => n.phaseIndex === pi - 1).at(-1);
    const pts = (prev ? [prev, ...own] : own).map(({ n, gi }) => ({
      x: n.x,
      y: n.y,
      gi,
    }));
    const walked = pts.filter((p) => p.gi <= walkedUpTo);
    const rest = pts.slice(Math.max(walked.length - 1, 0));
    return {
      phase,
      dWalked: walked.length >= 2 ? curve(walked) : "",
      dRest: rest.length >= 2 ? curve(rest) : "",
      locked: pi > currentIndex,
      active: pi === currentIndex,
    };
  });

  return (
    <div className="flex flex-col gap-2">
      <div className={`flex items-center justify-between gap-3 ${preview ? "sticky top-0 z-40 -mx-1 bg-navy-950/85 px-1 pb-1 pt-7 backdrop-blur" : ""}`}>
        {preview ? (
          <span className="text-[0.65rem] font-medium uppercase tracking-wider text-ink-faint">
            Pinch, or double-tap, to look closer
          </span>
        ) : (
          <span className="flex min-w-0 flex-col">
            <span className="text-sm font-medium uppercase tracking-wider text-ink-faint">The journey</span>
            <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.65rem] text-ink-faint">
              <span className="flex items-center gap-1">
                <TapIcon className="size-3" />
                Tap a circle to open that challenge
              </span>
              <span className="flex items-center gap-1">
                <ZoomIcon className="size-3" />
                Pinch to look closer
              </span>
            </span>
          </span>
        )}
        <div className="flex items-center gap-2">
          {/* Zoom: out, in, and the scale - a pinch does the same. */}
          <span className="flex items-center rounded-full border border-navy-600 bg-navy-800 text-ink-muted">
            <button
              type="button"
              onClick={() => zoomTo(zoomRef.current / 1.35)}
              aria-label="Zoom out"
              disabled={zoom <= ZOOM_MIN + 0.01}
              className="grid size-7 place-items-center rounded-full text-base leading-none transition-colors hover:text-ink disabled:opacity-40"
            >
              &minus;
            </button>
            <button
              type="button"
              onClick={() => zoomTo(zoom > 1.05 ? 1 : ZOOM_DETAIL + 0.15)}
              aria-label={zoomedIn ? "Show the whole road" : "Look closer"}
              className="min-w-9 px-1 text-[0.65rem] font-semibold tabular-nums transition-colors hover:text-ink"
            >
              {zoom.toFixed(1)}&times;
            </button>
            <button
              type="button"
              onClick={() => zoomTo(zoomRef.current * 1.35)}
              aria-label="Zoom in"
              disabled={zoom >= ZOOM_MAX - 0.01}
              className="grid size-7 place-items-center rounded-full text-base leading-none transition-colors hover:text-ink disabled:opacity-40"
            >
              +
            </button>
          </span>
          {/* The other walkers - see students-here.tsx. */}
          {!preview && <StudentsHere />}
          <span className="text-xs tabular-nums text-ink-faint">
            {done} of {challenges.length}
          </span>
        </div>
      </div>

      <div
        ref={sceneRef}
        className={`map-scene ${onScreen ? "" : "map-asleep"}`}
        data-zoom={zoomedIn ? "in" : "out"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          ref={tiltRef}
          className="map-tilt map-3d relative mx-auto w-full max-w-2xl"
          style={{ height, transformOrigin: `50% ${originY}px`, zoom }}
        >
          {/* Territory washes - five regions, each in its phase's light,
              with a topographic grid that surfaces, ripples down, and
              sinks back into the dark */}
          {territories.map(({ phase, locked, top, height: h }, i) => {
            const color = `var(--color-${phase.bgClass.slice(3)})`;
            return (
              <div key={phase.id} aria-hidden className="contents">
                <div
                  className="pointer-events-none absolute -inset-x-10"
                  style={{
                    top,
                    height: h,
                    opacity: locked ? 0.09 : 0.2,
                    background: `radial-gradient(55% 75% at 50% 35%, ${color} 0%, color-mix(in oklab, ${color} 40%, transparent) 35%, transparent 72%)`,
                  }}
                />
                <div
                  className="terrain-grid pointer-events-none absolute inset-x-0"
                  style={
                    {
                      top: top - 90,
                      height: h + 90,
                      "--grid-max": locked ? 0.09 : 0.24,
                      animationDelay: `${i * 2.6}s`,
                      backgroundImage: `repeating-linear-gradient(180deg, ${color} 0 1px, transparent 1px 30px), repeating-linear-gradient(90deg, ${color} 0 1px, transparent 1px 30px)`,
                    } as React.CSSProperties
                  }
                />
              </div>
            );
          })}

          {/* The trail */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox={`0 0 100 ${height}`}
            preserveAspectRatio="none"
            aria-hidden
          >
            {segments.map(({ phase, dWalked, dRest, locked, active }) => {
              const color = `var(--color-${phase.bgClass.slice(3)})`;
              return (
                <g key={phase.id}>
                  {/* The road already walked: a glow under a bright line */}
                  {dWalked && (
                    <>
                      <path
                        d={dWalked}
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        opacity="0.35"
                        vectorEffect="non-scaling-stroke"
                        className={active ? "trail-breathe" : undefined}
                      />
                      <path
                        d={dWalked}
                        fill="none"
                        stroke={color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        opacity="0.95"
                        vectorEffect="non-scaling-stroke"
                      />
                    </>
                  )}
                  {/* The road ahead: same color, faded until it's earned */}
                  {dRest && (
                    <path
                      d={dRest}
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                      strokeLinecap="round"
                      opacity={locked ? 0.1 : 0.28}
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                </g>
              );
            })}
            {/* The last stretch: from the final challenge to the line */}
            {lastNode && (
              <path
                d={`M ${lastNode.x} ${lastNode.y} C ${lastNode.x} ${(lastNode.y + finishY) / 2} 50 ${(lastNode.y + finishY) / 2} 50 ${finishY - 10}`}
                fill="none"
                stroke="var(--color-structure)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="5 8"
                opacity={complete ? 0.7 : 0.25}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {/* Level rules + phase circles, their skills in orbit */}
          {banners.map(({ phase, index: pi, y: by, locked, gate }) => (
            <div key={phase.id} className="contents">
              <div
                id={`journey-${phase.id}`}
                aria-hidden
                className="map-row absolute inset-x-0 flex scroll-mt-28 items-center gap-3"
                style={{ top: by }}
              >
                <span className="h-px flex-1 bg-navy-700/70" />
                <span
                  className={`map-pin text-[0.65rem] font-bold uppercase tracking-[0.35em] ${
                    locked ? "text-ink-faint" : phase.textClass
                  }`}
                >
                  Level {pi + 1}
                </span>
                <span className="h-px flex-1 bg-navy-700/70" />
              </div>
              <div
                className="map-row absolute inset-x-0 flex items-center gap-5"
                style={{ top: by + 42 }}
              >
                <span className="map-pin relative ml-1 block shrink-0">
                  <span
                    className={`flex size-12 items-center justify-center rounded-full text-lg font-bold ${
                      locked
                        ? "bg-navy-700 text-ink-faint"
                        : `${phase.bgClass} text-navy-950 shadow-[0_0_22px_-4px_currentColor] ${phase.textClass}`
                    }`}
                  >
                    {phase.id}
                  </span>
                  {/* The skills this phase trains, floating close by */}
                  {!locked &&
                    phaseSkills(phase).map((skill, j) => {
                      const cat = categoryById.get(skill)!;
                      return (
                        <span
                          key={skill}
                          title={cat.name}
                          className={`float-icon absolute flex size-6 items-center justify-center rounded-full border border-navy-600 bg-navy-850 ${cat.textClass}`}
                          style={{
                            ...ORBIT[j],
                            animationDelay: `${j * 0.9}s`,
                          }}
                        >
                          <CategoryIcon category={skill} className="size-3.5" />
                        </span>
                      );
                    })}
                </span>
                <span className="map-pin flex min-w-0 flex-1 flex-col pr-6">
                  <span
                    className={`text-sm font-semibold ${locked ? "text-ink-faint" : phase.textClass}`}
                  >
                    {phase.name}
                  </span>
                  {locked && gate.reason === "rank" && gate.rank && (
                    <span className="text-[0.65rem] text-ink-faint">
                      Opens at <span className={phase.textClass}>{gate.rank.name}</span> ({gate.rank.at} XP) -{" "}
                      <span className="font-semibold text-ink">{gate.xpToGo} XP to go</span>. Lessons and better takes both count.
                    </span>
                  )}
                  {locked && gate.reason !== "rank" && (
                    <span className="text-[0.65rem] text-ink-faint">
                      Locked - the road reaches here after the phase before
                      {gate.rank ? `, at ${gate.rank.name} (${gate.rank.at} XP)` : ""}.
                    </span>
                  )}
                  {!locked && gate.rank && (
                    <span className="text-[0.65rem] text-ink-faint">{gate.rank.name}</span>
                  )}
                </span>
              </div>
            </div>
          ))}

          {/* The nodes */}
          {nodes.map((node, i) => {
            const clickable = !node.locked && !inDemo;
            const accent = categoryById.get(node.accentId)!;
            const labelLeft = node.x >= 60; // the name sits away from the bend
            // Beyond the next locked phase the road is too far to read:
            // titles stay garbled until the journey gets nearer.
            // Far-off challenges keep their names garbled on the full
            // road - but when a student has deliberately opened that
            // phase from STORY above, they asked to see it.
            const veiled = !only && node.phaseIndex > currentIndex + 1;
            const shownTitle = veiled ? garble(node.title) : node.title;
            const body = (
              <span className="map-pin relative block">
                <span
                  className={`relative block overflow-hidden rounded-full border-2 transition-transform duration-200 group-hover:scale-110 ${
                    node.locked ? "size-12" : "size-16 sm:size-[4.5rem]"
                  } ${
                    node.passed
                      ? `border-transparent shadow-[0_0_20px_-4px_currentColor] ${node.phase.textClass}`
                      : node.locked
                        ? "border-navy-600 bg-navy-850 opacity-60"
                        : `border-current bg-navy-850 ${node.phase.textClass} ${
                            node.isCurrent ? "map-pulse" : ""
                          }`
                  }`}
                >
                  {node.locked ? (
                    <span className="flex size-full items-center justify-center text-ink-faint">
                      <LockIcon className="size-4" />
                    </span>
                  ) : node.passed && takes.has(node.slug) ? (
                    // Their own take in the circle - a frame of it, and
                    // a few seconds of it under a held finger or when
                    // the map picks it to peek.
                    <OwnTake
                      take={takes.get(node.slug)!}
                      playing={held === node.slug || peeking === node.slug}
                    />
                  ) : (
                    <>
                      <VideoStill
                        vimeoId={node.vimeoId}
                        accent={accent}
                        sizes="72px"
                      />
                      {/* A veil in the phase color, heavier when passed */}
                      <span
                        className={`absolute inset-0 ${node.phase.bgClass} ${
                          node.passed ? "opacity-25" : "opacity-0"
                        }`}
                      />
                    </>
                  )}
                </span>

                {/* The student, standing on the challenge they're at.
                    It's the only marker on the map that moves: pass a
                    challenge and it walks down to the next one, which is
                    the whole reason the journey is drawn as a road.
                    Their own face where they've given one, a figure
                    where they haven't - the marker has to be there
                    either way, or the road has nobody on it.

                    It stands above the node rather than replacing its
                    picture: the node is which challenge this is, and
                    covering that to say "you are here" costs more than
                    it tells. */}
                {node.isCurrent && (
                  <span
                    className={`absolute -top-11 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center ${node.phase.textClass}`}
                  >
                    <span className="block size-9 overflow-hidden rounded-full border-2 border-current bg-navy-850 shadow-[0_0_20px_-2px_currentColor] sm:size-10">
                      {state.avatar ? (
                        // A data URL from the student's own device -
                        // next/image would only add an optimizer hop.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={state.avatar}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center">
                          <ProfileIcon className="size-5 text-ink-muted" />
                        </span>
                      )}
                    </span>
                    {/* The pin's point, resting on the node below */}
                    <span
                      aria-hidden
                      className="-mt-px size-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-current"
                    />
                  </span>
                )}

                {/* Trophies won on this take, pinned beside the node on
                    the side the name isn't - dots at the normal scale,
                    named when the map is zoomed in or the pin hovered. */}
                {trophiesAt.has(node.slug) && (
                  <>
                    <span
                      className={`absolute top-1/2 z-20 flex w-[7rem] -translate-y-1/2 justify-center gap-1 ${
                        labelLeft ? "left-full ml-1" : "right-full mr-1"
                      }`}
                    >
                      {trophiesAt.get(node.slug)!.map((badge, j) => (
                        <span
                          key={badge.id}
                          className="trophy-pin relative flex flex-col items-center text-storytelling"
                          style={{ animationDelay: `${j * 0.15}s` }}
                          title={`${badge.title} - won here`}
                        >
                          {/* The glow is a gradient, not a box-shadow: a
                              shadow here rasterises as a square in the
                              tilted 3D context. */}
                          <span
                            aria-hidden
                            className="absolute -inset-2 top-[-0.5rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-storytelling)_50%,transparent)_0%,transparent_68%)]"
                          />
                          <span className="relative block size-6 rounded-full border-2 border-current sm:size-7">
                            <BadgeMedal id={badge.id} icon={badge.icon} earned className="size-full" />
                          </span>
                          <span aria-hidden className="-mt-px size-0 border-x-[4px] border-t-[6px] border-x-transparent border-t-current" />
                        </span>
                      ))}
                    </span>
                    {/* Their names, when the map is close enough to read
                        them. A sibling of the pins rather than a child of
                        one box with them: boxed together, the 3D context
                        painted the whole box dark. */}
                    <span
                      className={`trophy-name absolute top-1/2 z-20 mt-5 hidden w-[7rem] px-1 text-center text-[0.5rem] font-semibold leading-tight text-storytelling [text-shadow:0_1px_2px_#060a15,0_0_6px_#060a15] ${
                        labelLeft ? "left-full ml-1" : "right-full mr-1"
                      }`}
                    >
                      {trophiesAt.get(node.slug)!.map((b) => b.title).join(" · ")}
                    </span>
                  </>
                )}

                {/* Who else is on this challenge - only when zoomed in,
                    where there's room for faces under the node. */}
                {zoomedIn && !node.locked && crowdFor(node.slug) && (
                  <span
                    aria-hidden
                    className={`absolute left-1/2 top-full z-10 mt-1.5 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-navy-600 bg-navy-950/90 py-0.5 pl-0.5 pr-1.5 text-[0.5rem] font-medium text-ink-muted ${node.phase.textClass}`}
                  >
                    <span className="flex -space-x-1">
                      {crowdFor(node.slug)!.recent.slice(0, 3).map((s) => (
                        <span
                          key={s.name}
                          className="grid size-3.5 place-items-center rounded-full border border-navy-950 bg-navy-700 text-[0.42rem] font-bold text-ink"
                        >
                          {s.name[0]}
                        </span>
                      ))}
                    </span>
                    <span className="text-ink-muted">{crowdFor(node.slug)!.count} here</span>
                  </span>
                )}

                {/* Status jewel on the rim */}
                {node.passed && (
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-navy-900 text-navy-950 ${node.phase.bgClass}`}
                  >
                    <CheckIcon className="size-3.5" />
                  </span>
                )}
                {!node.passed && !node.locked && (
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-navy-900 bg-navy-800 text-[0.65rem] font-bold ${node.phase.textClass}`}
                  >
                    {i + 1}
                  </span>
                )}

                {/* The challenge, named in the open - balanced so a long
                    title never strands one word alone on its second line */}
                <span
                  className={`absolute top-1/2 w-32 -translate-y-1/2 text-balance text-[0.68rem] font-medium leading-tight sm:w-44 sm:text-xs ${
                    labelLeft
                      ? "right-full mr-3 text-right"
                      : "left-full ml-3 text-left"
                  } ${
                    node.locked
                      ? "text-ink-faint/70"
                      : node.isCurrent
                        ? "text-ink"
                        : "text-ink-muted"
                  } ${veiled ? "blur-[2px] select-none" : ""}`}
                >
                  {shownTitle}
                  {node.passed &&
                    winsFor(node.slug).map((win) => (
                      <span
                        key={win}
                        className={`mt-0.5 flex items-center gap-1 text-[0.6rem] font-normal leading-snug text-ink-faint ${labelLeft ? "flex-row-reverse text-right" : ""}`}
                      >
                        <CheckIcon className={`size-2.5 shrink-0 ${node.phase.textClass}`} />
                        {win}
                      </span>
                    ))}
                  {/* What it pays, and where you are - on one line so a
                      node never grows a third stacked label. A challenge
                      is worth several lessons, which is the point of
                      showing the number here at all. */}
                  <span
                    className={`mt-1 flex items-center gap-1.5 ${labelLeft ? "justify-end" : ""}`}
                  >
                    {node.isCurrent && (
                      <span
                        className={`w-fit rounded-full px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-navy-950 ${node.phase.bgClass}`}
                      >
                        You are here
                      </span>
                    )}
                    {!veiled && !node.passed && (
                      <XpBadge
                        xp={node.xp}
                        className={
                          node.locked ? "text-ink-faint/70" : node.phase.textClass
                        }
                      />
                    )}
                  </span>
                </span>

                {/* Hover card: the still, the name, the state */}
                <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2.5 w-52 -translate-x-1/2 overflow-hidden rounded-xl border border-navy-500 bg-navy-950 opacity-0 shadow-2xl shadow-navy-950 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                  <span
                    className={`relative block aspect-video w-full bg-gradient-to-br from-navy-700 to-navy-900 ${
                      node.locked ? "opacity-40" : ""
                    }`}
                  >
                    <VideoStill vimeoId={node.vimeoId} accent={accent} sizes="208px" />
                    <span
                      className={`absolute inset-x-0 bottom-0 h-0.5 ${node.phase.bgClass}`}
                    />
                  </span>
                  <span className="block p-2.5 text-center text-[0.7rem] leading-snug">
                    <b className={`block text-ink ${veiled ? "blur-[2px] select-none" : ""}`}>
                      {shownTitle}
                    </b>
                    <span className={node.locked ? "text-ink-faint" : node.phase.textClass}>
                      {node.passed
                        ? "Passed - practice again any time"
                        : veiled
                          ? "Too far ahead to read - keep walking"
                          : node.locked
                            ? "Unlocks with this phase"
                            : node.isCurrent
                              ? "Your next challenge"
                              : "Ready when you are"}
                    </span>
                  </span>
                </span>
              </span>
            );
            const cls = "map-row group absolute -translate-x-1/2 -translate-y-1/2";
            const pos = { left: `${node.x}%`, top: node.y };
            const hasTake = node.passed && takes.has(node.slug);
            return clickable ? (
              <Link
                key={node.slug}
                href={`/challenges/${node.slug}`}
                aria-label={node.title}
                className={cls}
                style={{ ...pos, WebkitTouchCallout: "none" } as React.CSSProperties}
                // Hold a passed node and its take plays; let go and it
                // stops. A hold that played isn't a tap, so it doesn't
                // also open the challenge.
                onPointerDown={hasTake ? () => beginHold(node.slug) : undefined}
                onPointerUp={hasTake ? endHold : undefined}
                onPointerLeave={hasTake ? endHold : undefined}
                onPointerCancel={hasTake ? endHold : undefined}
                onContextMenu={hasTake ? (e) => e.preventDefault() : undefined}
                onClick={
                  hasTake
                    ? (e) => {
                        if (playedRef.current) {
                          e.preventDefault();
                          playedRef.current = false;
                        }
                      }
                    : undefined
                }
              >
                {body}
              </Link>
            ) : onPick && !veiled ? (
              <button
                key={node.slug}
                type="button"
                onClick={() => onPick(node.slug)}
                aria-label={node.locked ? `${node.title} - locked` : node.title}
                className={`${cls} text-left`}
                style={pos}
              >
                {body}
              </button>
            ) : (
              <div
                key={node.slug}
                tabIndex={0}
                aria-label={
                  veiled
                    ? "A challenge still hidden ahead"
                    : node.locked
                      ? `${node.title} - locked`
                      : node.title
                }
                className={cls}
                style={pos}
              >
                {body}
              </div>
            );
          })}

          {/* A voice from the community, surfacing beside a node */}
          {pop && nodes[pop.node] && (
            <div
              key={pop.key}
              aria-hidden
              className="community-pop map-row pointer-events-none absolute z-10"
              style={{
                left: `clamp(6.5rem, ${nodes[pop.node].x}%, calc(100% - 6.5rem))`,
                top: nodes[pop.node].y - 60,
              }}
            >
              <span className="map-pin block max-w-[13rem] -translate-x-1/2 truncate rounded-full border border-navy-600 bg-navy-900/90 px-2.5 py-1 text-[0.62rem] text-ink-muted shadow-lg backdrop-blur">
                <b className={`font-semibold ${nodes[pop.node].phase.textClass}`}>
                  {communityPosts[pop.post].name}
                </b>
                {": "}
                {communityPosts[pop.post].text.split(" ").slice(0, 5).join(" ")}
                {"…"}
              </span>
            </div>
          )}

          {/* The finish line */}
          <div
            className="map-row absolute inset-x-0 flex flex-col items-center gap-2.5"
            style={{ top: finishY }}
          >
            <span className="map-pin flex flex-col items-center gap-2.5">
              <span className="relative flex items-end gap-2">
                {/* A flag either side of the line, waving - the thing
                    being walked towards should look like an arrival. */}
                <Flag side="left" lit={complete} />
                <span
                  className={`h-3.5 w-36 rounded-sm sm:w-48 ${complete ? "" : "opacity-50"}`}
                  style={{
                    backgroundImage:
                      "repeating-conic-gradient(rgba(233,236,248,0.92) 0% 25%, rgba(8,13,26,0.95) 25% 50%)",
                    backgroundSize: "14px 14px",
                  }}
                />
                <Flag side="right" lit={complete} />
              </span>
              <span
                className={`text-sm font-bold uppercase tracking-[0.35em] ${
                  complete ? "text-ink" : "text-ink-faint"
                }`}
              >
                Finish
              </span>
              {complete ? (
                <>
                  <span className="spectrum-rule h-1 w-44 rounded-full" />
                  <span className="text-[0.7rem] text-ink-muted">
                    Every challenge passed. Your voice is in the world.
                  </span>
                </>
              ) : (
                <span className="text-[0.65rem] text-ink-faint">
                  {nodes.length - done} challenge
                  {nodes.length - done === 1 ? "" : "s"} between you and the line
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A checkered flag on a pole, waving at the finish. */
function Flag({ side, lit }: { side: "left" | "right"; lit: boolean }) {
  return (
    <span className={`flex flex-col items-center ${lit ? "" : "opacity-60"}`} aria-hidden>
      <svg viewBox="0 0 40 46" className={`h-10 w-9 ${side === "right" ? "-scale-x-100" : ""}`}>
        <defs>
          <pattern id={`check-${side}`} width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="rgba(233,236,248,0.95)" />
            <rect width="4" height="4" fill="rgba(8,13,26,0.95)" />
            <rect x="4" y="4" width="4" height="4" fill="rgba(8,13,26,0.95)" />
          </pattern>
        </defs>
        <path d="M8 4v40" stroke="rgba(233,236,248,0.65)" strokeWidth="2.5" strokeLinecap="round" />
        <path
          className="finish-flag"
          d="M9 5c7-3 14 3 21 0v16c-7 3-14-3-21 0z"
          fill={`url(#check-${side})`}
        />
      </svg>
    </span>
  );
}
