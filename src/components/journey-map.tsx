"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  challenges,
  challengesInPhase,
  storyPhases,
  type StoryPhase,
} from "@/data/challenges";
import { categoryById, type CategoryId } from "@/data/categories";
import { CategoryIcon } from "@/components/category-icons";
import { communityPosts } from "@/data/community-activity";
import { challengeProgress } from "@/lib/challenge-progress";
import { challengeXp } from "@/lib/progress";
import { XpBadge } from "@/components/xp-badge";
import { useStore } from "@/lib/store";
import { VideoStill } from "@/components/video-still";
import { CheckIcon, LockIcon } from "@/components/icons";

// The STORY journey as terrain: a winding path of nodes, one per
// challenge, each named in the open beside its marker so the whole road
// reads at a glance. Every phase is a level with its own lettered
// circle and orbiting skills; passed nodes wear their phase's color,
// the student's own face marks where they stand, and locked territory
// is fogged - the phase after the next one keeps its challenge names
// garbled until the road gets near. Community voices surface beside the
// nodes and fade, a topographic grid breathes through each territory,
// and a checkered finish line waits at the bottom. A 2D/3D toggle tips
// the whole map over like a navigation app - the ground reclines while
// the markers stay standing.

const ROW_H = 108;
/** The winding: node x-positions cycle through this pattern (percent). */
const X_CYCLE = [50, 76, 50, 24];
const PHASE_GAP = 132; // room above each phase circle: level rule + circle

/** The earliest phase with work left in it. Later phases are locked;
 *  earlier ones stay open, since finished work is never taken away. */
export function useCurrentPhaseIndex(): number {
  const { state, ready } = useStore();
  if (!ready) return 0;
  const firstUnfinished = storyPhases.findIndex(
    (p) =>
      !challengesInPhase(p.id).every((c) => challengeProgress(c, state).passed),
  );
  return firstUnfinished === -1 ? storyPhases.length - 1 : firstUnfinished;
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

export function JourneyMap() {
  const { state, ready } = useStore();
  const currentIndex = useCurrentPhaseIndex();
  const inDemo = usePathname().startsWith("/demo");
  const [view, setView] = useState<"2d" | "3d">("2d");

  // The map is far taller than the screen, so a fixed tilt origin would
  // throw most of it beyond the horizon. Instead the origin rides the
  // viewport center while you scroll - the band you're looking at stays
  // level, the road recedes above it and swells below, the way a maps
  // app tilts.
  const tiltRef = useRef<HTMLDivElement>(null);
  const [originY, setOriginY] = useState(0);
  useEffect(() => {
    if (view !== "3d") return;
    const el = tiltRef.current;
    if (!el) return;
    const update = () => {
      // Layout position, not getBoundingClientRect: the rect measures
      // the tilted plane, which would feed the origin back into itself.
      let topDoc = 0;
      for (
        let node: HTMLElement | null = el;
        node;
        node = node.offsetParent as HTMLElement | null
      )
        topDoc += node.offsetTop;
      const center = window.scrollY + window.innerHeight / 2 - topDoc;
      setOriginY(Math.max(0, Math.min(el.offsetHeight, center)));
    };
    const t = window.setTimeout(update, 0);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [view]);

  // Lay the trail out top to bottom, phase by phase.
  const nodes: Node[] = [];
  const banners: { phase: StoryPhase; y: number; locked: boolean }[] = [];
  let y = 24;
  let step = 0;
  let firstUnpassedSeen = false;
  for (let pi = 0; pi < storyPhases.length; pi++) {
    const phase = storyPhases[pi];
    const locked = pi > currentIndex;
    banners.push({ phase, y, locked });
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
  }, [nodeCount]);

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
  const segments = storyPhases.map((phase, pi) => {
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
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-ink-faint">
          The journey
        </h2>
        <div className="flex items-center gap-3">
          {/* Google-Maps-style tilt: same map, reclined. */}
          <span className="flex rounded-lg border border-navy-600 bg-navy-900/80 p-0.5">
            {(["2d", "3d"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`rounded-md px-2.5 py-1 text-[0.7rem] font-bold uppercase transition-colors ${
                  view === v
                    ? "bg-navy-700 text-ink"
                    : "text-ink-faint hover:text-ink-muted"
                }`}
              >
                {v}
              </button>
            ))}
          </span>
          <span className="text-xs tabular-nums text-ink-faint">
            {done} of {challenges.length}
          </span>
        </div>
      </div>

      <div className={view === "3d" ? "map-scene" : undefined}>
        <div
          ref={tiltRef}
          className={`map-tilt relative mx-auto w-full max-w-2xl ${
            view === "3d" ? "map-3d" : ""
          }`}
          style={{
            height,
            transformOrigin: view === "3d" ? `50% ${originY}px` : undefined,
          }}
        >
          {/* Territory washes - five regions, each in its phase's light,
              with a topographic grid that surfaces, ripples down, and
              sinks back into the dark */}
          {territories.map(({ phase, locked, top, height: h }, i) => {
            const color = `var(--color-${phase.bgClass.slice(3)})`;
            return (
              <div key={phase.id} aria-hidden className="contents">
                <div
                  className="pointer-events-none absolute -inset-x-10 blur-2xl"
                  style={{
                    top,
                    height: h,
                    opacity: locked ? 0.07 : 0.17,
                    background: `radial-gradient(60% 80% at 50% 35%, ${color}, transparent 75%)`,
                  }}
                />
                <div
                  className="terrain-grid pointer-events-none absolute inset-x-0"
                  style={
                    {
                      top,
                      height: h,
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
          {banners.map(({ phase, y: by, locked }, i) => (
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
                  Level {i + 1}
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
                <span className="map-pin flex flex-col">
                  <span
                    className={`text-sm font-semibold ${locked ? "text-ink-faint" : phase.textClass}`}
                  >
                    {phase.name}
                  </span>
                  {locked && (
                    <span className="text-[0.65rem] text-ink-faint">
                      Locked - the road reaches here after the phase before.
                    </span>
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
            const veiled = node.phaseIndex > currentIndex + 1;
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
                  ) : node.isCurrent && state.avatar ? (
                    // The student stands at this node - literally.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={state.avatar}
                      alt=""
                      className="size-full object-cover"
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
                      node.locked ? "opacity-60 grayscale" : ""
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
            return clickable ? (
              <Link
                key={node.slug}
                href={`/challenges/${node.slug}`}
                aria-label={node.title}
                className={cls}
                style={pos}
              >
                {body}
              </Link>
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
              <span
                className={`h-3.5 w-44 rounded-sm sm:w-56 ${complete ? "" : "opacity-50"}`}
                style={{
                  backgroundImage:
                    "repeating-conic-gradient(rgba(233,236,248,0.92) 0% 25%, rgba(8,13,26,0.95) 25% 50%)",
                  backgroundSize: "14px 14px",
                }}
              />
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
