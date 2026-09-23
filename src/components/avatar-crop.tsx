"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckIcon, XIcon } from "@/components/icons";

// Choosing which part of a photo is the face.
//
// A picked image used to be squashed to 256 square and stored, which
// cropped from the centre - and a photo of a person is almost never
// composed with their face in the exact middle. So: a circle, the
// photo behind it, and the two gestures everyone already knows - drag
// to move, pinch to zoom (wheel on a laptop, and a slider for anyone
// who has neither).
//
// The circle is only a mask. What's saved is the square behind it,
// because the avatar is drawn inside a round frame everywhere it
// appears, and a square JPEG is a third the size of a PNG with
// transparent corners.

/** The saved picture's size, and the stage it's cropped on. */
const OUT = 256;
const MIN_SCALE = 1;
const MAX_SCALE = 4;

export function AvatarCrop({
  src,
  onCancel,
  onDone,
}: {
  /** A data URL of the picked file, at its natural size. */
  src: string;
  onCancel: () => void;
  /** The cropped square, as a JPEG data URL. */
  onDone: (dataUrl: string) => void;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [stage, setStage] = useState(300);
  const boxRef = useRef<HTMLDivElement>(null);
  // Live pointers, and what the gesture looked like when it started.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ dist: number; scale: number; x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const image = new window.Image();
    image.onload = () => setImg(image);
    image.src = src;
  }, [src]);

  // The stage is as wide as the room allows, and square.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setStage(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [img]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  // At scale 1 the photo exactly covers the stage - the smallest it can
  // be without a gap showing inside the circle.
  const base = img ? Math.max(stage / img.width, stage / img.height) : 1;
  const eff = base * scale;

  /** Never let an edge of the photo come inside the stage. */
  const clamp = useCallback(
    (x: number, y: number, s: number) => {
      if (!img) return { x, y };
      const e = base * s;
      const mx = Math.max(0, (img.width * e - stage) / 2);
      const my = Math.max(0, (img.height * e - stage) / 2);
      return { x: Math.min(mx, Math.max(-mx, x)), y: Math.min(my, Math.max(-my, y)) };
    },
    [img, base, stage],
  );

  const zoomTo = useCallback(
    (next: number) => {
      const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
      setScale(s);
      setOffset((o) => clamp(o.x, o.y, s));
    },
    [clamp],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    startGesture();
  };

  const startGesture = () => {
    const pts = [...pointers.current.values()];
    if (pts.length === 0) {
      gesture.current = null;
      return;
    }
    const cx = pts.reduce((n, p) => n + p.x, 0) / pts.length;
    const cy = pts.reduce((n, p) => n + p.y, 0) / pts.length;
    const dist =
      pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    gesture.current = { dist, scale, x: cx, y: cy, ox: offset.x, oy: offset.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    const pts = [...pointers.current.values()];
    const cx = pts.reduce((n, p) => n + p.x, 0) / pts.length;
    const cy = pts.reduce((n, p) => n + p.y, 0) / pts.length;
    let s = g.scale;
    if (pts.length > 1 && g.dist > 0) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, (g.scale * dist) / g.dist));
    }
    // Moving with two fingers pans as well as zooms, which is what a
    // pinch on a map does.
    const next = clamp(g.ox + (cx - g.x), g.oy + (cy - g.y), s);
    setScale(s);
    setOffset(next);
  };

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    startGesture();
  };

  const save = () => {
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // The stage square, read back in the photo's own coordinates.
    const sw = stage / eff;
    const sx = img.width / 2 - offset.x / eff - sw / 2;
    const sy = img.height / 2 - offset.y / eff - sw / 2;
    ctx.drawImage(img, sx, sy, sw, sw, 0, 0, OUT, OUT);
    onDone(canvas.toDataURL("image/jpeg", 0.85));
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <span aria-hidden onClick={onCancel} className="absolute inset-0 bg-navy-950/85 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose your picture"
        className="relative flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-navy-500 bg-navy-900 p-5 shadow-2xl shadow-navy-950/80"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold tracking-tight text-ink">Choose your picture</h2>
          <p className="text-xs text-ink-faint">Drag to move it. Pinch, scroll or use the slider to zoom.</p>
        </div>

        <div
          ref={boxRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onWheel={(e) => zoomTo(scale * (e.deltaY < 0 ? 1.08 : 1 / 1.08))}
          className="relative aspect-square w-full cursor-grab touch-none overflow-hidden rounded-xl bg-navy-950 active:cursor-grabbing"
        >
          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
              style={{
                width: img.width * eff,
                height: img.height * eff,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />
          )}
          {/* The circle: everything outside it dimmed, in one shadow. */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-full -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ boxShadow: "0 0 0 9999px rgba(8,13,26,0.72)", border: "2px solid rgba(233,236,248,0.9)" }}
          />
        </div>

        <input
          type="range"
          min={MIN_SCALE}
          max={MAX_SCALE}
          step={0.01}
          value={scale}
          onChange={(e) => zoomTo(Number(e.target.value))}
          aria-label="Zoom"
          className="w-full accent-[var(--color-acting)]"
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-navy-600 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            <XIcon className="size-4" />
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!img}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-acting text-sm font-bold text-navy-950 transition-opacity hover:opacity-95 disabled:opacity-50"
          >
            <CheckIcon className="size-4" />
            Use this
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
