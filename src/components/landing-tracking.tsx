"use client";

import { useEffect } from "react";
import { Analytics } from "@vercel/analytics/next";
import { track } from "@vercel/analytics";

// What a landing page needs to learn from its visitors: how far down
// they read, and which buttons they press. Page views come with
// Vercel's analytics; on top of that, a "scroll" event at each quarter
// of the page, once each, and a "cta" event for anything marked with
// data-track - named by where it sits ("hero", "strip", "pricing"...).
// `page` tells the versions apart (landing-a, landing-b).

export function LandingTracking({ page }: { page: string }) {
  useEffect(() => {
    const seen = new Set<number>();
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (h <= 0) return;
      const at = (window.scrollY / h) * 100;
      for (const mark of [25, 50, 75, 100]) {
        if (at >= mark - 1 && !seen.has(mark)) {
          seen.add(mark);
          track("scroll", { page, depth: mark });
        }
      }
    };
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-track]");
      if (el) track("cta", { page, where: el.dataset.track ?? "unknown" });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
    };
  }, [page]);
  return <Analytics />;
}
