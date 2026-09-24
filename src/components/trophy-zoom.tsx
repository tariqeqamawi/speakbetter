"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ZoomIcon } from "@/components/icons";

// Examining a trophy up close, the way a shop lets you inspect a
// product.
//
// WHY THIS IS WORTH BUILDING. A rendered trophy has detail in it that
// a 250px slot never shows - the light bending through the glass, the
// brushed grain on the plinth, the neon line bleeding onto the metal.
// Paying for that detail and then never letting anyone see it is the
// waste. And the act of leaning in to look at something closely is
// what makes an object feel collectible rather than decorative; it is
// most of why shopping sites do this at all.
//
// HOW IT STAYS CHEAP. The pan is written straight to the node's style
// inside a rAF callback - it never goes through React state.
//
// It did at first, and that was measured rather than assumed: putting
// the pointer position in state cost ~3ms of scripting per move, which
// over sixty moves was 370ms of main thread that moving the mouse
// anywhere else on the same page did not cost. React re-rendering on
// every mousemove is exactly the shape of problem this app already had
// once (see pill-cycle.tsx), and the fix is the same one - keep the
// thing that changes every frame out of the render path entirely.
//
// What remains is one transform on one element, folded into a single
// matrix. Deliberately NOT transform-origin, which would recalculate
// the element on every move.
//
// The high-resolution file is only fetched when somebody actually
// leans in. Forty-seven trophies at 137KB each would be a real
// download; nobody pays for a detail view they never open.

/** How far in. Enough to see the glass, not so far it turns to mush. */
const ZOOM = 2.8;

// PRESS AND DRAG, on every device.
//
// It used to zoom on hover on a mouse and on a tap on a phone, which
// is two interactions to learn for one job - and the hover one barely
// worked: the trophy frame is a narrow column, so the pointer spent
// most of its time just outside it and the zoom flickered on and off
// as the mouse crossed the edge.
//
// Press and drag is one gesture, identical with a thumb and with a
// mouse, and it is also the right METAPHOR: you are holding the thing
// up to the light and turning it. Pointer capture means the drag
// survives leaving the frame, so sliding off the narrow column no
// longer drops the zoom halfway through looking at something.

export function TrophyZoom({
  src,
  /** The bigger file, fetched only on demand. */
  zoomSrc,
  alt,
  height,
  dimmed = false,
}: {
  src: string;
  zoomSrc?: string;
  alt: string;
  height: number;
  dimmed?: boolean;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLImageElement>(null);
  const [on, setOn] = useState(false);
  /** Where the pointer is, as a ref - this changes every frame and must
   *  never cause a render. */
  const at = useRef({ x: 0.5, y: 0.5 });
  // Only ask for the big file once somebody has shown interest in it.
  const [wantBig, setWantBig] = useState(false);
  const [bigReady, setBigReady] = useState(false);
  const pending = useRef<number | null>(null);

  /** Scale about the point under the cursor, as one matrix. The
   *  translate is what keeps that point still while everything around
   *  it grows - which is the whole illusion. */
  const paint = useCallback((zoomed: boolean) => {
    const img = art.current;
    if (!img) return;
    if (!zoomed) {
      img.style.transform = "translate(0px, 0px) scale(1)";
      return;
    }
    const shift = (v: number) => (0.5 - v) * (ZOOM - 1) * 100;
    img.style.transform = `translate(${shift(at.current.x)}%, ${shift(at.current.y)}%) scale(${ZOOM})`;
  }, []);

  const track = useCallback(
    (clientX: number, clientY: number) => {
      if (pending.current !== null) return;
      pending.current = requestAnimationFrame(() => {
        pending.current = null;
        const el = frame.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        at.current = {
          x: Math.min(1, Math.max(0, (clientX - r.left) / r.width)),
          y: Math.min(1, Math.max(0, (clientY - r.top) / r.height)),
        };
        paint(true);
      });
    },
    [paint],
  );

  useEffect(
    () => () => {
      if (pending.current !== null) cancelAnimationFrame(pending.current);
    },
    [],
  );

  // The transform is set after every render, not during one.
  //
  // React and an imperative style write cannot share an attribute.
  // The first version declared `style={on ? undefined : {...}}`, and
  // passing undefined makes React CLEAR the style it previously owned
  // - so the zoom was wiped by the re-render that hovering triggered,
  // a frame after being set. Hovering did nothing at all.
  //
  // So React never writes this property. The element's resting and
  // zoomed states are both painted from here, which also means any
  // re-render for an unrelated reason puts the transform back rather
  // than dropping it.
  useEffect(() => {
    paint(on);
  }, [on, paint]);

  const enter = () => {
    setWantBig(true);
    setOn(true);
  };
  const leave = () => setOn(false);

  return (
    <div
      ref={frame}
      // The trophies are 3:4. This used to declare 752/1921 - the
      // proportions of the very first render - so every trophy was
      // letterboxed into a column half the width it needed and drawn
      // at about two thirds the size it should have been. The zoom
      // "not working" was mostly this: there was very little trophy
      // there to zoom into.
      className="relative touch-none select-none overflow-hidden rounded-xl"
      style={{ height, width: "auto", aspectRatio: "3 / 4", cursor: on ? "zoom-out" : "zoom-in" }}
      onPointerDown={(e) => {
        // Capture, so the drag survives leaving this narrow box.
        e.currentTarget.setPointerCapture?.(e.pointerId);
        enter();
        track(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (!on) return;
        track(e.clientX, e.clientY);
      }}
      onPointerUp={leave}
      onPointerCancel={leave}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={art}
        src={bigReady && zoomSrc ? zoomSrc : src}
        alt={alt}
        draggable={false}
        className={`size-full select-none object-contain will-change-transform ${
          dimmed ? "opacity-40 grayscale" : ""
        } ${on ? "" : "transition-transform duration-300 ease-out"}`}
      />

      {/* The file that makes leaning in worth it, loaded behind the
          scenes so the swap is invisible. */}
      {wantBig && zoomSrc && !bigReady && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={zoomSrc} alt="" aria-hidden className="hidden" onLoad={() => setBigReady(true)} />
      )}

      {/* The invitation, as a mark rather than a sentence.
          
          A trophy frame is tall and narrow - a hundred pixels wide at
          the size this is shown - so three words wrapped onto three
          lines and sat squarely over the plinth, hiding the part of
          the object the zoom exists to reveal. The words belong in the
          caption underneath, where there is width for them; up here
          only the glass is needed. */}
      {!on && (
        <span className="pointer-events-none absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-navy-950/70 text-ink-muted backdrop-blur">
          <ZoomIcon className="size-4" />
        </span>
      )}
    </div>
  );
}
