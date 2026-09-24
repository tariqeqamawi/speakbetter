"use client";

import { useCallback, useEffect, useRef } from "react";

// The adventure as a road you travel, with the finish line on the
// horizon.
//
// WHY THIS IS NOT A TILTED DIV. The old map leaned the whole plane
// back with `rotateX`, which looks like perspective and is not: a
// tilted rectangle has a fixed near edge and a fixed far edge, so
// nothing ever comes towards you, the ground does not converge, and
// the far end of the road stops at the bottom of the element instead
// of at a horizon. You can tilt a picture of a road. You cannot walk
// into one.
//
// So this projects properly. The road runs away from the camera along
// z; every checkpoint has a real distance; and the screen position of
// anything is
//
//     scale = focal / distance
//     y     = horizon + (eyeHeight * focal) / distance
//     x     = centre  + (lateral   * focal) / distance
//
// which is the whole of it. Distance falls as you scroll, so a
// checkpoint genuinely approaches: it rises out of the horizon as a
// speck, swells, drops down the screen, and passes. The finish line is
// simply the furthest thing on the road, which puts it on the horizon
// until you have nearly earned it.
//
// WHY THE DISCS STAY UPRIGHT. They are never rotated. A checkpoint is
// a flat element that is scaled and placed - it always faces the
// camera, the way a sprite does, so it stands up out of the landscape
// rather than lying down on it. The only thing that lies flat is the
// shadow underneath, which is what tells the eye the disc is standing.
//
// WHY CANVAS FOR THE GROUND AND DOM FOR THE STOPS. The terrain is
// hundreds of converging lines that change every frame - canvas draws
// that in one pass. The checkpoints are links with images, labels and
// focus rings; they stay real elements so they remain tappable,
// readable and reachable by keyboard. Neither half is doing the
// other's job.

export interface RoadStop {
  slug: string;
  n: number;
  title: string;
  state: "done" | "here" | "ahead" | "locked";
  /** The take's still, once there is one - it replaces the marker. */
  poster?: string;
  /** What passing it paid. */
  xp?: number;
  /** The trophy standing at this checkpoint, if one was won here. */
  trophy?: string;
}

/** World units between one checkpoint and the next.
 *
 *  Wide, and deliberately so. A checkpoint a thumb-flick away is a
 *  list; one that takes a moment of travelling to reach is a journey -
 *  and the ground in between is where the trophy you won there, the XP
 *  it paid and what Coach said about the take all belong. Scrolling
 *  longer on a phone is the correct trade for that. */
const SPACING = 38;
/** How close the camera gets before a stop is behind you. Small, so a
 *  landmark is still filling the frame when it finally passes rather
 *  than winking out while it is still the size of a house. */
const NEAR = 2.1;
/** Lens. Bigger is a longer lens: less dramatic, more readable. */
const FOCAL = 620;
/** How high the camera rides above the road. */
const EYE = 3.1;
/** Where the horizon sits in the frame. */
const HORIZON = 0.26;

/** The road's lateral wander at a given distance - a gentle S, so the
 *  path has somewhere to go rather than running dead straight. */
function laneAt(z: number): number {
  // Small numbers, because lateral offset is multiplied by focal/z -
  // a wander of five world units is barely a nudge at the horizon and
  // throws the road a thousand pixels sideways at your feet. The bend
  // has to be gentle in WORLD space to look like a bend on screen.
  return Math.sin(z / 40) * 2.2 + Math.sin(z / 15) * 0.6;
}

export function StoryRoad({
  stops,
  accent = "var(--color-mindset)",
  onOpen,
}: {
  stops: RoadStop[];
  accent?: string;
  onOpen?: (slug: string) => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const sky = useRef<HTMLCanvasElement>(null);
  const pieces = useRef<(HTMLElement | null)[]>([]);
  const avatar = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  /** How far along the road the camera has travelled, from scroll. */
  const travelled = useCallback(() => {
    const el = frame.current;
    if (!el) return 0;
    const box = el.getBoundingClientRect();
    // 0 when the top of the scene reaches the top of the window, 1
    // when its bottom does. The scene is deliberately tall: the road
    // is a thing you travel, and travelling takes scrolling.
    const span = Math.max(1, box.height - window.innerHeight);
    const through = Math.min(1, Math.max(0, -box.top / span));
    // Far enough that the last stop arrives just as the scene ends.
    return through * (stops.length * SPACING);
  }, [stops.length]);

  const draw = useCallback(() => {
    raf.current = 0;
    const el = frame.current;
    const canvas = sky.current;
    if (!el || !canvas) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    const g = canvas.getContext("2d");
    if (!g) return;

    // `accent` arrives as var(--color-mindset), which canvas has never
    // heard of. Setting it as the element's colour and reading the
    // computed value back hands over a real rgb() the context can use.
    canvas.style.color = accent;
    const lit = getComputedStyle(canvas).color || "#39d98a";
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);

    const T = travelled();
    const cx = w / 2;
    const hy = h * HORIZON;

    // Where the road is under the camera's own feet. Everything is
    // measured relative to THIS, which is the difference between a
    // camera flying alongside a road and a camera travelling on one.
    //
    // Without it the lane offset at close range is multiplied by
    // focal/distance - roughly three hundred at arm's length - so a
    // gentle two-unit bend threw the road six hundred pixels sideways
    // and pushed the marker clean off the edge of the screen. Riding
    // the lane keeps the road centred beneath you and lets it curve
    // away ahead, which is what driving actually looks like.
    const lane0 = laneAt(T);

    /** World point to screen. `lateral` is offset from the road's
     *  centre line, not from the world's. */
    const project = (lateral: number, distance: number) => {
      const d = Math.max(NEAR * 0.5, distance);
      const s = FOCAL / d;
      return { x: cx + lateral * s, y: hy + (EYE * FOCAL) / d, s };
    };

    // ── The ground ───────────────────────────────────────────────────
    // A wash that fades up into the horizon, so the far distance is
    // atmosphere rather than a hard edge.
    const wash = g.createLinearGradient(0, hy, 0, h);
    wash.addColorStop(0, "rgba(10,16,32,0)");
    wash.addColorStop(0.25, "rgba(10,16,32,0.55)");
    wash.addColorStop(1, "rgba(6,10,21,0.95)");
    g.fillStyle = wash;
    g.fillRect(0, hy, w, h - hy);

    // ── Contours running across the road ─────────────────────────────
    // Drawn at fixed world distances and projected, so they bunch up
    // towards the horizon exactly as real ground does. This is the
    // thing a tilted div cannot fake: the SPACING converges.
    g.lineWidth = 1;
    const first = Math.floor(T / 6) * 6;
    for (let i = 0; i < 90; i++) {
      const z = first + i * 6 - T;
      if (z < NEAR) continue;
      const lane = laneAt(z + T) - lane0;
      const a = project(lane - 16, z);
      const b = project(lane + 16, z);
      // Fades out with distance, so the horizon dissolves.
      const fade = Math.max(0, Math.min(0.5, 14 / z));
      g.strokeStyle = `rgba(120,160,220,${fade * 0.5})`;
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
      g.stroke();
    }

    // ── The road itself ──────────────────────────────────────────────
    // Two edges converging to the horizon - the single strongest cue
    // that this is a road going away from you.
    const left: [number, number][] = [];
    const right: [number, number][] = [];
    for (let i = 0; i <= 120; i++) {
      const z = NEAR + i * 2.2;
      const lane = laneAt(z + T) - lane0;
      const a = project(lane - 3.1, z);
      const b = project(lane + 3.1, z);
      left.push([a.x, a.y]);
      right.push([b.x, b.y]);
    }
    g.beginPath();
    g.moveTo(left[0][0], left[0][1]);
    for (const [x, y] of left) g.lineTo(x, y);
    for (let i = right.length - 1; i >= 0; i--) g.lineTo(right[i][0], right[i][1]);
    g.closePath();
    const road = g.createLinearGradient(0, h, 0, hy);
    road.addColorStop(0, "rgba(28,40,70,0.95)");
    road.addColorStop(1, "rgba(28,40,70,0)");
    g.fillStyle = road;
    g.fill();

    g.strokeStyle = "rgba(150,190,255,0.22)";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(left[0][0], left[0][1]);
    for (const [x, y] of left) g.lineTo(x, y);
    g.stroke();
    g.beginPath();
    g.moveTo(right[0][0], right[0][1]);
    for (const [x, y] of right) g.lineTo(x, y);
    g.stroke();

    // ── The lit path ─────────────────────────────────────────────────
    //
    // The road is the ground; this is the line you are walking along
    // it, in the phase's own colour. It is the thing that makes the
    // terrain feel walked rather than merely drawn - a road with
    // nothing on it is scenery, and a road with a lit line down it is
    // a route somebody is following.
    //
    // Drawn three times over itself: a wide soft bloom, a mid glow,
    // and a bright core. One stroke with a shadow gets a halo; three
    // strokes get a light SOURCE, which is what a neon line actually
    // looks like on dark ground.
    const centre: [number, number][] = [];
    for (let i = 0; i <= 120; i++) {
      const z = NEAR + i * 2.2;
      const lane = laneAt(z + T) - lane0;
      const pt = project(lane, z);
      centre.push([pt.x, pt.y]);
    }

    const trace = () => {
      g.beginPath();
      g.moveTo(centre[0][0], centre[0][1]);
      for (const [x, y] of centre) g.lineTo(x, y);
    };

    g.lineCap = "round";
    g.lineJoin = "round";
    // The bloom: wide, faint, and fading out towards the horizon so
    // the far end of the path dissolves rather than stopping.
    g.globalAlpha = 0.22;
    g.strokeStyle = lit;
    g.lineWidth = 26;
    g.filter = "blur(10px)";
    trace();
    g.stroke();
    g.filter = "none";

    g.globalAlpha = 0.5;
    g.lineWidth = 7;
    trace();
    g.stroke();

    // The core, near-white so the colour reads as light rather than
    // paint.
    g.globalAlpha = 0.95;
    g.lineWidth = 2.4;
    g.strokeStyle = "rgba(255,255,255,0.85)";
    trace();
    g.stroke();
    g.globalAlpha = 1;

    // ── The finish line, on the horizon where it belongs ─────────────
    const finishZ = stops.length * SPACING + SPACING * 0.6 - T;
    if (finishZ > NEAR) {
      const lane = laneAt(finishZ + T) - lane0;
      const a = project(lane - 3.6, finishZ);
      const b = project(lane + 3.6, finishZ);
      const band = Math.max(1.5, (a.s * 2.2) | 0);
      const squares = 8;
      for (let i = 0; i < squares; i++) {
        g.fillStyle = i % 2 ? "rgba(231,233,242,0.85)" : "rgba(12,18,34,0.85)";
        const x0 = a.x + ((b.x - a.x) * i) / squares;
        const x1 = a.x + ((b.x - a.x) * (i + 1)) / squares;
        g.fillRect(x0, a.y - band, x1 - x0, band);
      }
    }

    // ── The checkpoints, placed but never rotated ────────────────────
    for (let i = 0; i < stops.length; i++) {
      const node = pieces.current[i];
      if (!node) continue;
      const z = (i + 1) * SPACING - T;
      // Culled only once genuinely behind the camera, or so far off it
      // is a speck near the horizon.
      if (z < NEAR || z > SPACING * 7) {
        node.style.visibility = "hidden";
        continue;
      }
      const lane = laneAt(z + T) - lane0;
      const p = project(lane, z);
      // Sat ON the road: the projected point is the ground, and the
      // disc stands up from it, so its foot is what is anchored.
      // Landmarks rather than dots. A checkpoint you arrive AT should
      // fill a good part of the frame by the time you reach it - that
      // arrival is the whole feeling this is built for - and at that
      // size there is finally room beside it for the title, the XP it
      // paid and the trophy won there.
      // A landmark you arrive AT fills a good part of the frame by
      // the time you reach it. The old factor made a checkpoint at
      // arm's length about a fifth of a phone's width, which is a dot
      // on a map rather than somewhere you have got to.
      // Exaggerated on purpose. Linear perspective alone is honest and
      // undramatic - a checkpoint grows steadily and arrives without
      // ceremony. Raising it to a power past one makes the last stretch
      // of the approach accelerate, so a landmark does not merely get
      // closer, it LOOMS: small for a long time, then suddenly the
      // thing you are standing in front of. That is what arriving
      // somewhere feels like, and it is the whole reason for a road.
      const size = Math.max(30, Math.min(w * 0.74, 9 * Math.pow(p.s, 1.2)));
      node.style.visibility = "visible";
      node.style.width = `${size}px`;
      // The label rides with it, so text grows and fades with its
      // landmark instead of being a fixed-size caption on a shrinking
      // object.
      node.style.setProperty("--land", `${size}px`);
      node.style.transform = `translate(${p.x - size / 2}px, ${p.y - size}px)`;
      node.style.opacity = String(Math.max(0.15, Math.min(1, 34 / z)));
      node.style.zIndex = String(1000 - Math.round(z));
    }

    // ── The piece, always just ahead of the camera ───────────────────
    // It does not sit still while the world moves: it walks the lane,
    // passing each checkpoint in turn, which is what makes this read
    // as a counter being moved across a board rather than a camera
    // flying over one.
    const piece = avatar.current;
    if (piece) {
      const z = NEAR + 5.4;
      const lane = laneAt(z + T) - lane0;
      const p = project(lane, z);
      const size = Math.max(46, Math.min(118, 2.6 * Math.pow(p.s, 1.05)));
      piece.style.width = `${size}px`;
      piece.style.transform = `translate(${p.x - size / 2}px, ${p.y - size}px)`;
    }
  }, [stops.length, travelled, accent]);

  useEffect(() => {
    const onScroll = () => {
      if (!raf.current) raf.current = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [draw]);

  return (
    <div
      ref={frame}
      className="relative"
      // Tall, because travelling is the point. Each stop earns its own
      // screenful of road.
      // Two and a half screens of scroll per checkpoint.
      //
      // The first attempt gave each one 85vh, and the arithmetic of
      // that is the whole reason it felt wrong: the camera crossed a
      // checkpoint's entire near field - the part where it is large
      // and arriving - in about a fifth of a screen of scrolling. So
      // at any given moment every landmark was either far away or
      // already behind you, and the size that was meant to say "you
      // have arrived" flashed past unseen. Slower travel is not
      // padding; it is what makes arriving legible.
      style={{ height: `${Math.max(2, stops.length) * 210}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <canvas ref={sky} className="absolute inset-0 size-full" />

        {/* Light in the sky, so the horizon is somewhere rather than a
            line where the drawing stopped. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{
            height: `${HORIZON * 100 + 14}%`,
            background: `radial-gradient(60% 120% at 50% 100%, color-mix(in oklab, ${accent} 22%, transparent), transparent 70%)`,
          }}
        />

        <div className="absolute inset-0">
          {stops.map((stop, i) => (
            <button
              key={stop.slug}
              ref={(el) => {
                pieces.current[i] = el;
              }}
              type="button"
              onClick={() => onOpen?.(stop.slug)}
              aria-label={stop.title}
              className="absolute left-0 top-0 origin-bottom will-change-transform"
              style={{ visibility: "hidden" }}
            >
              <Checkpoint stop={stop} accent={accent} />
            </button>
          ))}

          {/* The counter. Above the stops, because it is the thing you
              are following. */}
          <div
            ref={avatar}
            aria-hidden
            className="absolute left-0 top-0 z-[2000] will-change-transform"
          >
            <Piece accent={accent} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** A checkpoint: a disc standing up out of the ground, facing you,
 *  with what happened there written beside it. */
function Checkpoint({ stop, accent }: { stop: RoadStop; accent: string }) {
  const dim = stop.state === "locked";
  const colour = dim ? "#2a3654" : accent;
  return (
    <span className="relative block w-full">
      {/* What happened here, UNDER the landmark rather than beside it.
          
          Beside it, the label ran off the right of the screen the
          moment a checkpoint got big - and a checkpoint getting big is
          the entire point of this road, so the label was guaranteed to
          be unreadable at exactly the moment it mattered most.
          Underneath, centred, and sized in fractions of the circle, it
          grows with its landmark and stays on the screen. */}
      <span
        className="pointer-events-none absolute left-1/2 top-[104%] flex w-[150%] max-w-[92vw] -translate-x-1/2 flex-col items-center gap-[0.2em] text-center"
        style={{ fontSize: "calc(var(--land, 80px) * 0.1)" }}
      >
        <span className="flex items-center gap-[0.55em] leading-none">
          {stop.xp !== undefined && (
            <span className="font-bold tabular-nums" style={{ color: colour }}>
              {stop.xp} XP
            </span>
          )}
          {stop.trophy && <span className="text-[0.9em] text-advanced">{stop.trophy}</span>}
        </span>
      </span>

      {/* The only flat thing in the scene. A shadow on the ground is
          how the eye knows the disc is standing on it. */}
      <span
        aria-hidden
        className="absolute left-1/2 top-full h-[16%] w-[84%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-[2px]"
        style={{ background: colour, opacity: dim ? 0.25 : 0.4 }}
      />
      <span
        className="grid aspect-square w-full place-items-center overflow-hidden rounded-full border-2"
        style={{
          borderColor: colour,
          background: dim ? "#0b1120" : "#0e1830",
          boxShadow: dim ? "none" : `0 0 30px -8px ${colour}`,
        }}
      >
        {stop.poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={stop.poster} alt="" className="size-full object-cover" />
        ) : (
          // The number, and - once the circle is big enough to hold it
          // - the challenge itself. A checkpoint you have arrived at
          // should say what it IS without the eye having to go
          // anywhere else; a distant one is just a numbered marker,
          // because a title at that size would be a grey smudge.
          <span className="flex flex-col items-center gap-[0.06em] px-[12%] text-center">
            <span className="text-[26%] font-black leading-none tabular-nums" style={{ color: colour }}>
              {stop.n}
            </span>
            <span
              className={`text-[11%] font-bold leading-tight ${dim ? "text-ink-faint" : "text-ink"}`}
            >
              {stop.title}
            </span>
          </span>
        )}
      </span>
    </span>
  );
}

/** The piece being moved along the board. */
function Piece({ accent }: { accent: string }) {
  return (
    <span className="relative block w-full">
      <span
        aria-hidden
        className="absolute left-1/2 top-full h-[18%] w-[76%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-[2px]"
        style={{ background: accent, opacity: 0.45 }}
      />
      {/* A map pin: a ring with a point under it, which is the shape
          everybody already reads as "you are here". */}
      <span className="here-ring absolute -inset-[8%] rounded-full" aria-hidden />
      <span
        className="grid aspect-square w-full place-items-center rounded-full border-2 bg-navy-900"
        style={{ borderColor: accent, boxShadow: `0 0 34px -6px ${accent}` }}
      >
        <span className="size-[30%] rounded-full" style={{ background: accent }} />
      </span>
    </span>
  );
}
