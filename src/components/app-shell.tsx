"use client";

import { useStore } from "@/lib/store";

// The column the app lives in. With the rail on a laptop (see Sidebar)
// the content shifts across to sit beside it; for a visitor - the
// landing page, pricing - there is no rail, and the page keeps the full
// width it was designed for.

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state, ready } = useStore();
  const railed = ready && state.unlocked;
  return (
    <>
      {/* Inside the app, the landing page's light: a soft green and purple
          glow over the navy, instead of flat navy (globals.css .app-glow). */}
      {railed && <div className="app-glow" aria-hidden />}
      <main
        className={`mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-8 sm:pb-12 xl:max-w-[96rem] xl:px-8 ${
          railed ? "app-glass lg:pl-[15.5rem] xl:pl-[16rem]" : ""
        }`}
      >
        {children}
      </main>
    </>
  );
}
