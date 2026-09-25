"use client";

// A picture of a trophy somebody has won, to post.
//
// WHY A PICTURE AND NOT A LINK. A link to somebody's trophy case is a
// login screen to everybody who taps it. What gets shared from an app
// like this is an image - the thing itself, standing under the light,
// with their name and the day they won it - and the image has to look
// like the app, or it is advertising for nothing.
//
// WHY IN THE BROWSER. Everything on the card is already on the phone:
// the render, the stage photograph, the lion, the student's name. Drawing
// it on a canvas here costs nothing, works offline, and never sends
// anybody's name to the server to have it drawn back. 1080x1350 is
// Instagram's portrait post, which is also a good shape for a story.

const W = 1080;
const H = 1350;
/** The stage photograph is drawn this tall; the spot the beam lands on
 *  is at DISC_Y of it (the same share trophy-stage.tsx uses). */
const STAGE_H = 1150;
const DISC_Y = 0.7;
const TROPHY_H = 620;
/** The renders carry a little black under the plinth. */
const BASE_PAD = 0.04;

export interface ShareCardInput {
  trophyName: string;
  /** --color-* name of the skill colour. */
  color: string;
  image: string;
  /** The bigger render, if there is one - the card is 1080 wide. */
  zoom?: string;
  studentName: string;
  earnedAt?: string;
  grand?: boolean;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/** Break a line into as many lines as it needs to fit `max` wide. */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > max && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function drawShareCard(input: ShareCardInput): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  await document.fonts?.ready;
  const font = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
  const accent = cssVar(`--color-${input.color}`, "#ffd60a");
  const ink = cssVar("--color-ink", "#e7e9f2");
  const muted = cssVar("--color-ink-muted", "#a6adc4");
  const faint = cssVar("--color-ink-faint", "#767e99");
  const navy = cssVar("--color-navy-900", "#060a15");

  const [stage, trophy, lion] = await Promise.all([
    loadImage("/trophy/stage.jpg"),
    input.zoom ? loadImage(input.zoom).then((i) => i ?? loadImage(input.image)) : loadImage(input.image),
    loadImage("/logo-mark.png"),
  ]);

  ctx.fillStyle = "#03060d";
  ctx.fillRect(0, 0, W, H);

  // The room, cropped to the middle so the beam and the disc are
  // centred in a portrait frame.
  if (stage) {
    const sw = (stage.width / stage.height) * STAGE_H;
    ctx.drawImage(stage, (W - sw) / 2, 0, sw, STAGE_H);
  }
  const discY = STAGE_H * DISC_Y;

  // What the trophy throws onto the disc - its colour, as on the stage.
  ctx.save();
  ctx.translate(W / 2, discY);
  ctx.scale(1, 0.32);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 420);
  glow.addColorStop(0, hexAlpha(accent, 0.35));
  glow.addColorStop(1, hexAlpha(accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(-420, -420, 840, 840);
  ctx.restore();

  if (trophy) {
    const th = TROPHY_H * (input.grand ? 1.08 : 1);
    const tw = (trophy.width / trophy.height) * th;
    const bottom = discY + th * BASE_PAD;
    const x = (W - tw) / 2;

    // Its reflection in the wet floor, fading out downwards.
    const refl = document.createElement("canvas");
    refl.width = Math.ceil(tw);
    refl.height = Math.ceil(th);
    const r = refl.getContext("2d");
    if (r) {
      r.translate(0, th);
      r.scale(1, -1);
      r.drawImage(trophy, 0, 0, tw, th);
      r.setTransform(1, 0, 0, 1, 0, 0);
      r.globalCompositeOperation = "destination-in";
      const fade = r.createLinearGradient(0, 0, 0, th * 0.45);
      fade.addColorStop(0, "rgba(0,0,0,1)");
      fade.addColorStop(1, "rgba(0,0,0,0)");
      r.fillStyle = fade;
      r.fillRect(0, 0, tw, th);
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.filter = "blur(2px)";
      ctx.drawImage(refl, x, bottom - th * BASE_PAD);
      ctx.restore();
    }

    ctx.drawImage(trophy, x, bottom - th, tw, th);
  }

  // The floor gives way to the page colour, so the words sit on calm.
  const floor = ctx.createLinearGradient(0, 900, 0, 1110);
  floor.addColorStop(0, hexAlpha(navy, 0));
  floor.addColorStop(1, hexAlpha(navy, 1));
  ctx.fillStyle = floor;
  ctx.fillRect(0, 900, W, 210);
  ctx.fillStyle = navy;
  ctx.fillRect(0, 1110, W, H - 1110);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = faint;
  ctx.font = `600 24px ${font}`;
  ctx.letterSpacing = "8px";
  ctx.fillText("TROPHY WON", W / 2, 972);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = accent;
  ctx.font = `800 64px ${font}`;
  const nameLines = wrap(ctx, input.trophyName, 960).slice(0, 2);
  let y = 1044;
  for (const line of nameLines) {
    ctx.fillText(line, W / 2, y);
    y += 70;
  }

  const who = input.studentName.trim();
  const when = input.earnedAt
    ? new Date(input.earnedAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
    : "";
  ctx.fillStyle = ink;
  ctx.font = `600 36px ${font}`;
  if (who) {
    ctx.fillText(`Won by ${who}`, W / 2, y + 4);
    y += 48;
  }
  if (when) {
    ctx.fillStyle = muted;
    ctx.font = `400 30px ${font}`;
    ctx.fillText(when, W / 2, y + 4);
  }

  // The lion and the name, at the foot - who this is from.
  ctx.font = `800 40px ${font}`;
  const label = "Speak Better";
  const lw = ctx.measureText(label).width;
  const lionW = 100;
  const lionH = lion ? (lion.height / lion.width) * lionW : 0;
  const gap = 18;
  const total = (lion ? lionW + gap : 0) + lw;
  const left = (W - total) / 2;
  const baseY = 1290;
  if (lion) ctx.drawImage(lion, left, baseY - lionH + 12, lionW, lionH);
  ctx.textAlign = "left";
  ctx.fillStyle = ink;
  ctx.fillText(label, left + (lion ? lionW + gap : 0), baseY);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

/** #rrggbb plus an alpha, as rgba(). Anything else is passed through. */
function hexAlpha(color: string, a: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(color);
  if (!m) return color;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** On a phone, the share sheet - Instagram, Messages, wherever. On a
 *  computer, or where the sheet cannot take a file, a download. */
export async function shareOrDownload(blob: Blob, filename: string, title: string): Promise<"shared" | "downloaded" | "cancelled"> {
  const file = new File([blob], filename, { type: "image/png" });
  const phone = window.matchMedia("(pointer: coarse)").matches;
  if (phone && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return "shared";
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return "cancelled";
      // Refused for another reason - fall through to the download.
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  return "downloaded";
}
