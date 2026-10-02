"use client";

import { useEffect, useRef } from "react";

// A film playing very faintly behind a fold - moments of people talking
// to a phone, a ring light, a podcast mic - texture, not content. Dim,
// soft and feathered into the page at every edge, so the words over it
// stay the thing to read. Laptop only (on a phone it would be data spent
// on something nobody could make out), never for anyone who asked for
// less motion, and it plays only while the fold is on screen.
//
// It is PAINTED, frame by frame, onto a canvas - the <video> itself is
// never on screen. A playing video is handed to the graphics card as its
// own layer, and on some Windows drivers that layer, under a mask and
// dimmed, showed for a moment and then vanished (with or without a CSS
// filter on it). A canvas is ordinary drawing: masks and opacity on it
// behave everywhere. The softness is baked into the film itself.

const MASK = "radial-gradient(50% 50% at 50% 50%, #000 55%, transparent 100%)";

export function FoldBackdrop({ src, poster }: { src: string; poster: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Off screen, but still decoding: a video that is display:none or
    // zero-sized is skipped by some browsers.
    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("aria-hidden", "true");
    Object.assign(video.style, {
      position: "fixed",
      left: "-10000px",
      top: "0",
      width: "160px",
      height: "90px",
      opacity: "0",
      pointerEvents: "none",
    });
    document.body.appendChild(video);

    let raf = 0;
    let visible = false;
    const draw = () => {
      if (video.readyState >= 2) {
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      if (visible) raf = requestAnimationFrame(draw);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) {
        if (!video.src) video.src = src;
        video.play().catch(() => {});
        raf = requestAnimationFrame(draw);
      } else video.pause();
    });
    io.observe(canvas);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.remove();
    };
  }, [src]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden opacity-[0.28] lg:block"
      style={{ maskImage: MASK, WebkitMaskImage: MASK }}
    >
      {/* The poster sits under the canvas until the first frame lands. */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${poster})` }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full object-cover"
      />
    </div>
  );
}
