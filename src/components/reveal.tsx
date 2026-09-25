"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

// Things arriving as they come into view. Wrap a group in <Reveal>; give
// each piece inside the class "rv" (rising in), "rv-left" / "rv-right"
// (sliding in from that side) or "rv-pop" (popping up), and a delay with
// style={{ "--d": "300ms" }} so they arrive one after another. Once in,
// they stay. Everything is simply there for anyone who asked for less
// motion (globals.css).

export function Reveal({
  as: Tag = "div",
  children,
  className = "",
  style,
  afterScroll = false,
  threshold = 0.2,
}: {
  as?: "div" | "ul" | "ol" | "li" | "section" | "span";
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Wait for the visitor to start scrolling - for things already on
   *  screen when the page opens. */
  afterScroll?: boolean;
  threshold?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => el.setAttribute("data-in", "");
    if (afterScroll) {
      if (window.scrollY > 4) return show();
      const go = () => {
        show();
        window.removeEventListener("scroll", go);
      };
      window.addEventListener("scroll", go, { passive: true });
      return () => window.removeEventListener("scroll", go);
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        show();
        io.disconnect();
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [afterScroll, threshold]);
  const Any = Tag as "div";
  return (
    <Any ref={ref as React.Ref<HTMLDivElement>} className={`reveal ${className}`} style={style}>
      {children}
    </Any>
  );
}

export { delay } from "@/lib/reveal-delay";
