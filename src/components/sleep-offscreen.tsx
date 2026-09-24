"use client";

import { useEffect, useRef } from "react";

// A div whose CSS animations stop while it is off screen.
//
// WHY. An animation of transform or opacity runs on the compositor
// while its element is on screen, and costs the main thread nothing.
// Off screen, Chrome drops it back onto the main thread - and a
// main-thread animation asks for a full frame, style, paint and
// layerize of the whole page, sixty times a second. On the landing
// page, sitting still at the top, three of these a few screens down
// (the coach's wave, the drifting quotes, the glow on the needed
// spectrum bars) each kept the main thread busy on their own: most of
// its time on a throttled laptop, spent animating things nobody could
// see. Paused while away, they cost nothing; nobody can tell, because
// nobody was looking.
//
// The attribute is written straight onto the node rather than through
// state, so going on and off screen never re-renders what is inside.
// See [data-asleep] in globals.css.

export function SleepOffscreen({ children, ...props }: React.ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.removeAttribute("data-asleep");
        else el.setAttribute("data-asleep", "");
      },
      // Awake a little before it arrives, so it is already moving.
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
}
