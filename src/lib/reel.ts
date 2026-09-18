// The before-and-after reel: the student as they arrived, then the
// student today, cut together on the device.
//
// Ten seconds of the baseline, a card with both scores, ten seconds
// of the latest attempt, and a closing card - about thirty seconds,
// portrait, the shape a phone posts in. Ten rather than twenty because
// the point is the difference, and the difference is visible in ten:
// a reel someone will watch to the end on a feed is a short one. It's drawn frame by
// frame onto a canvas from the two videos and the two feedback records,
// so the thing on screen is the thing that gets shared: while it plays,
// the canvas and the videos' sound are recorded into one file, and at
// the end that file goes to the share sheet. Nothing is rendered
// anywhere but on the phone (§13): no upload, no server, no cost.
//
// The two videos are the ones the shelf keeps (lib/attempt-videos.ts).
// Either may be missing on this device - recorded elsewhere, or let go
// by the browser - and then that half of the reel is the card alone,
// which still says what changed.

import { categories, type CategoryId } from "@/data/categories";

export interface ReelSide {
  label: "Then" | "Now";
  title: string;
  date: string; // ISO
  score: number;
  spectrum: Record<CategoryId, number>;
  /** The video as an object URL, or null when this device hasn't got it. */
  videoUrl: string | null;
}

export interface ReelSpec {
  then: ReelSide;
  now: ReelSide;
  /** Challenges passed - the closing card says how far along the road. */
  passed: number;
  total: number;
}

/** Portrait 9:16, the shape of a story or a short. */
export const REEL_W = 720;
export const REEL_H = 1280;

/** How much of each video plays. */
const CLIP = 10;
const TITLE = 1.8;
const BRIDGE = 3.2;
const OUTRO = 3.6;

type SceneBody =
  | { kind: "title"; side: ReelSide }
  | { kind: "clip"; side: ReelSide }
  | { kind: "bridge" }
  | { kind: "outro" };
export type Scene = SceneBody & { from: number; to: number };

/** The scenes of a reel, end to end, given how long each video runs. */
export function timeline(spec: ReelSpec, thenLen: number, nowLen: number): Scene[] {
  const scenes: Scene[] = [];
  let t = 0;
  const push = (len: number, s: SceneBody) => {
    scenes.push({ ...s, from: t, to: t + len });
    t += len;
  };
  push(TITLE, { kind: "title", side: spec.then });
  if (spec.then.videoUrl && thenLen > 0)
    push(Math.min(CLIP, thenLen), { kind: "clip", side: spec.then });
  push(BRIDGE, { kind: "bridge" });
  push(TITLE, { kind: "title", side: spec.now });
  if (spec.now.videoUrl && nowLen > 0)
    push(Math.min(CLIP, nowLen), { kind: "clip", side: spec.now });
  push(OUTRO, { kind: "outro" });
  return scenes;
}

// The palette, read once from the page so the reel wears the app's own
// colors. Falls back to something reasonable off the page.
function colorOf(id: CategoryId): string {
  if (typeof getComputedStyle === "undefined") return "#888";
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue(`--color-${id}`)
      .trim() || "#888"
  );
}

const FONT = '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

function ease(x: number): number {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
}

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** A rounded rectangle path. */
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function background(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, 0, REEL_H);
  g.addColorStop(0, "#0b1120");
  g.addColorStop(1, "#030712");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, REEL_W, REEL_H);
}

/** The seven colors as a strip, lit where the performance reached them. */
function strip(ctx: CanvasRenderingContext2D, spectrum: Record<CategoryId, number>, x: number, y: number, w: number, h: number) {
  const gap = 6;
  const each = (w - gap * (categories.length - 1)) / categories.length;
  const alpha = ctx.globalAlpha;
  categories.forEach((cat, i) => {
    const lit = (spectrum[cat.id] ?? 0) >= 40;
    ctx.globalAlpha = alpha * (lit ? 1 : 0.18);
    ctx.fillStyle = colorOf(cat.id);
    rr(ctx, x + i * (each + gap), y, each, h, h / 2);
    ctx.fill();
  });
  ctx.globalAlpha = alpha;
}

/** The seven bars, for the cards. */
function bars(ctx: CanvasRenderingContext2D, spectrum: Record<CategoryId, number>, x: number, y: number, w: number, progress: number) {
  const rowH = 44;
  const alpha = ctx.globalAlpha;
  categories.forEach((cat, i) => {
    const v = Math.max(0, Math.min(100, spectrum[cat.id] ?? 0));
    const lit = v >= 40;
    const yy = y + i * rowH;
    ctx.font = `600 22px ${FONT}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = lit ? "#e5e7eb" : "#6b7280";
    ctx.fillText(cat.name.replace(/ & .*$/, "").replace(/ for speakers| techniques| & framing/i, ""), x, yy + 14);
    const barX = x + 250;
    const barW = w - 250 - 60;
    ctx.fillStyle = "#1f2937";
    rr(ctx, barX, yy + 6, barW, 16, 8);
    ctx.fill();
    ctx.globalAlpha = alpha * (lit ? 1 : 0.4);
    ctx.fillStyle = colorOf(cat.id);
    const filled = Math.max(16, (barW * v * ease(progress)) / 100);
    rr(ctx, barX, yy + 6, filled, 16, 8);
    ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.font = `500 20px ${FONT}`;
    ctx.textAlign = "right";
    ctx.fillStyle = "#9ca3af";
    ctx.fillText(String(Math.round(v * ease(progress))), x + w, yy + 14);
  });
}

function wordmark(ctx: CanvasRenderingContext2D) {
  ctx.font = `700 26px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#9ca3af";
  ctx.letterSpacing = "6px";
  ctx.fillText("SPEAK BETTER", REEL_W / 2, REEL_H - 56);
  ctx.letterSpacing = "0px";
}

/** Draw a video frame covering the whole reel, centred and cropped. */
function cover(ctx: CanvasRenderingContext2D, video: HTMLVideoElement) {
  const vw = video.videoWidth || 9;
  const vh = video.videoHeight || 16;
  const scale = Math.max(REEL_W / vw, REEL_H / vh);
  const w = vw * scale;
  const h = vh * scale;
  ctx.drawImage(video, (REEL_W - w) / 2, (REEL_H - h) / 2, w, h);
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number, size: number, weight = 600): string {
  ctx.font = `${weight} ${size}px ${FONT}`;
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 3 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}

/**
 * Draw the frame for `t` seconds into the reel.
 *
 * `videos` are the two elements the reel plays from, already at the
 * right time - the player drives them; this only paints.
 */
export function paint(
  ctx: CanvasRenderingContext2D,
  spec: ReelSpec,
  scenes: Scene[],
  t: number,
  videos: { then: HTMLVideoElement | null; now: HTMLVideoElement | null },
) {
  const scene = scenes.find((s) => t >= s.from && t < s.to) ?? scenes[scenes.length - 1];
  const local = t - scene.from;
  const len = scene.to - scene.from;
  // Every scene fades in and out - except the last, which holds: the
  // closing card is what the reel ends on and what "share a picture"
  // shares, and a card faded to nothing is neither.
  const last = scene === scenes[scenes.length - 1];
  const fade = Math.min(1, local / 0.35, last ? 1 : (len - local) / 0.35);

  background(ctx);

  if (scene.kind === "title") {
    const { side } = scene;
    ctx.globalAlpha = ease(fade);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = side.label === "Then" ? "#9ca3af" : "#e5e7eb";
    ctx.font = `800 148px ${FONT}`;
    ctx.letterSpacing = "8px";
    ctx.fillText(side.label.toUpperCase(), REEL_W / 2, REEL_H / 2 - 40);
    ctx.letterSpacing = "0px";
    ctx.font = `500 30px ${FONT}`;
    ctx.fillStyle = "#9ca3af";
    ctx.fillText(dateLabel(side.date), REEL_W / 2, REEL_H / 2 + 70);
    ctx.font = `600 32px ${FONT}`;
    ctx.fillStyle = "#e5e7eb";
    ctx.fillText(fitText(ctx, side.title, REEL_W - 120, 32), REEL_W / 2, REEL_H / 2 + 124);
    ctx.globalAlpha = 1;
    wordmark(ctx);
    return;
  }

  if (scene.kind === "clip") {
    const { side } = scene;
    const video = side.label === "Then" ? videos.then : videos.now;
    if (video && video.readyState >= 2) cover(ctx, video);
    // The label plate, bottom, over a fade so it reads on any footage.
    const g = ctx.createLinearGradient(0, REEL_H - 420, 0, REEL_H);
    g.addColorStop(0, "rgba(3,7,18,0)");
    g.addColorStop(1, "rgba(3,7,18,0.92)");
    ctx.fillStyle = g;
    ctx.fillRect(0, REEL_H - 420, REEL_W, 420);
    ctx.globalAlpha = ease(Math.min(1, local / 0.5));
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = `800 30px ${FONT}`;
    ctx.letterSpacing = "6px";
    ctx.fillStyle = side.label === "Then" ? "#9ca3af" : "#e5e7eb";
    ctx.fillText(side.label.toUpperCase(), 60, REEL_H - 250);
    ctx.letterSpacing = "0px";
    ctx.font = `500 26px ${FONT}`;
    ctx.fillStyle = "#9ca3af";
    ctx.fillText(dateLabel(side.date), 60, REEL_H - 208);
    ctx.font = `800 72px ${FONT}`;
    ctx.textAlign = "right";
    ctx.fillStyle = "#f9fafb";
    ctx.fillText(String(side.score), REEL_W - 60, REEL_H - 210);
    strip(ctx, side.spectrum, 60, REEL_H - 160, REEL_W - 120, 18);
    ctx.globalAlpha = 1;
    wordmark(ctx);
    // A fade to black at both ends of a clip.
    if (fade < 1) {
      ctx.fillStyle = `rgba(3,7,18,${1 - ease(fade)})`;
      ctx.fillRect(0, 0, REEL_W, REEL_H);
    }
    return;
  }

  if (scene.kind === "bridge" || scene.kind === "outro") {
    const p = Math.min(1, local / 1.2);
    ctx.globalAlpha = ease(fade);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Two scores, side by side, and the arrow between them.
    const y = scene.kind === "bridge" ? 300 : 260;
    ctx.font = `800 30px ${FONT}`;
    ctx.letterSpacing = "6px";
    ctx.fillStyle = "#9ca3af";
    ctx.fillText("THEN", REEL_W * 0.27, y - 90);
    ctx.fillStyle = "#e5e7eb";
    ctx.fillText("NOW", REEL_W * 0.73, y - 90);
    ctx.letterSpacing = "0px";
    ctx.font = `800 132px ${FONT}`;
    ctx.fillStyle = "#9ca3af";
    ctx.fillText(String(spec.then.score), REEL_W * 0.27, y);
    ctx.fillStyle = "#f9fafb";
    ctx.fillText(String(Math.round(spec.then.score + (spec.now.score - spec.then.score) * ease(p))), REEL_W * 0.73, y);
    ctx.font = `600 64px ${FONT}`;
    ctx.fillStyle = "#4b5563";
    ctx.fillText("→", REEL_W / 2, y);

    const delta = spec.now.score - spec.then.score;
    ctx.font = `700 40px ${FONT}`;
    ctx.fillStyle = delta > 0 ? colorOf("mindset") : delta < 0 ? colorOf("storytelling") : "#e5e7eb";
    ctx.fillText(`${delta > 0 ? "+" : ""}${delta} points`, REEL_W / 2, y + 120);

    if (scene.kind === "bridge") {
      strip(ctx, spec.then.spectrum, 60, y + 190, REEL_W / 2 - 90, 20);
      strip(ctx, spec.now.spectrum, REEL_W / 2 + 30, y + 190, REEL_W / 2 - 90, 20);
      const litThen = categories.filter((c) => (spec.then.spectrum[c.id] ?? 0) >= 40).length;
      const litNow = categories.filter((c) => (spec.now.spectrum[c.id] ?? 0) >= 40).length;
      ctx.font = `500 30px ${FONT}`;
      ctx.fillStyle = "#9ca3af";
      ctx.fillText(`${litThen} ${litThen === 1 ? "color" : "colors"} then · ${litNow} now`, REEL_W / 2, y + 270);
    } else {
      // The full spectrum, now, bar by bar - and how far along the road.
      bars(ctx, spec.now.spectrum, 60, y + 190, REEL_W - 120, p);
      const gained = categories.filter(
        (c) => (spec.now.spectrum[c.id] ?? 0) >= 40 && (spec.then.spectrum[c.id] ?? 0) < 40,
      );
      ctx.textAlign = "center";
      ctx.font = `500 28px ${FONT}`;
      ctx.fillStyle = "#9ca3af";
      const line =
        gained.length > 0
          ? `Lit up since: ${gained.map((c) => c.name.split(" ")[0]).join(", ")}`
          : `${spec.passed} of ${spec.total} challenges`;
      ctx.fillText(fitText(ctx, line, REEL_W - 120, 28, 500), REEL_W / 2, y + 190 + 7 * 44 + 40);
      ctx.font = `600 30px ${FONT}`;
      ctx.fillStyle = "#e5e7eb";
      ctx.fillText(`${spec.passed} of ${spec.total} challenges`, REEL_W / 2, y + 190 + 7 * 44 + 90);
    }
    ctx.globalAlpha = 1;
    wordmark(ctx);
  }
}

/** The recorder's best container for this browser, or null if it can't. */
export function recordingType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  // mp4 where the browser writes it (Safari), because that's what the
  // share sheet and every social app accept without complaint; webm
  // elsewhere, which desktop browsers play and download fine.
  for (const type of [
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ])
    if (MediaRecorder.isTypeSupported(type)) return type;
  return null;
}
