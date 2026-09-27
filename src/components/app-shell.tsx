"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { areaOf, track } from "@/lib/insights";
import { ConsentGate } from "@/components/consent-gate";

// The column the app lives in. With the rail on a laptop (see Sidebar)
// the content shifts across to sit beside it; for a visitor - the
// landing page, pricing - there is no rail, and the page keeps the full
// width it was designed for.

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state, ready } = useStore();
  const railed = ready && state.unlocked;
  useUsage(railed);
  return (
    <>
      {/* Inside the app, the landing page's light: a soft green and purple
          glow over the navy, instead of flat navy (globals.css .app-glow). */}
      {railed && <div className="app-glow" aria-hidden />}
      <ConsentGate />
      <main
        className={`mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-8 lg:pb-12 xl:max-w-[96rem] xl:px-8 ${
          railed ? "app-glass lg:pl-[15.5rem] xl:pl-[16rem]" : ""
        }`}
      >
        {children}
      </main>
    </>
  );
}

/** Which parts of the app students open, and how long they stay - the
 *  heatmap on /admin. Only time the page is actually on screen counts. */
function useUsage(on: boolean) {
  const path = usePathname();
  useEffect(() => {
    if (!on || !path || path.startsWith("/admin")) return;
    const area = areaOf(path);
    track({ type: "view", area, path });
    let shown = document.visibilityState === "visible" ? Date.now() : 0;
    let total = 0;
    const vis = () => {
      if (document.visibilityState === "visible") shown = Date.now();
      else if (shown) {
        total += Date.now() - shown;
        shown = 0;
      }
    };
    let saved = false;
    const save = () => {
      if (saved) return;
      saved = true;
      if (shown) total += Date.now() - shown;
      const seconds = Math.round(total / 1000);
      if (seconds >= 2) track({ type: "time", area, seconds });
    };
    document.addEventListener("visibilitychange", vis);
    // Closing the tab or reloading never runs the cleanup below.
    window.addEventListener("pagehide", save);
    return () => {
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("pagehide", save);
      save();
    };
  }, [on, path]);
}
