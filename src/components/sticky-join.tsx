"use client";

import { useEffect, useState } from "react";
import { guarantee, tiers } from "@/data/pricing";

// A bar held at the foot of a phone's screen once the visitor is past the
// hero: the way to the tiers, and what it starts at, always a thumb away
// on a long page. It steps aside while the prices themselves are on
// screen - there is nothing to point at then - and never shows on a
// laptop, where the page's own asks are in easy reach.

export function StickyJoin() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const pricing = document.getElementById("pricing");
    let atPrices = false;
    const io = pricing
      ? new IntersectionObserver(([e]) => {
          atPrices = e.isIntersecting;
          update();
        })
      : null;
    if (pricing) io?.observe(pricing);
    function update() {
      setShow(window.scrollY > window.innerHeight * 0.9 && !atPrices);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      io?.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-navy-600 bg-navy-950/90 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur transition-transform duration-300 sm:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <a href="#pricing" tabIndex={show ? 0 : -1} className="cta-neon-wrap flex w-full rounded-full">
        <span className="cta-neon flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm">
          Join Speak Better <span className="font-medium opacity-90">- from {tiers[0].price}</span> →
        </span>
      </a>
      <p className="mt-1.5 text-center text-[0.65rem] text-ink-faint">{guarantee.title}</p>
    </div>
  );
}
