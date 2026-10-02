"use client";

import { useEffect, useState } from "react";

// "Put Speak Better on your home screen" - shown on a buyer's access
// page. Android/Chrome gets a one-tap Install button when the browser
// offers it; an iPhone gets the three Safari steps (iOS has no install
// prompt a page can trigger). Because this page carries the buyer's own
// manifest, the icon they add opens their access link - unlocked, every
// time. Hidden when it's already running as the installed app.

type Prompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="inline size-4 -translate-y-px" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Share">
      <path d="M12 3v12M7 8l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" strokeLinecap="round" />
    </svg>
  );
}

export function InstallGuide() {
  const [kind, setKind] = useState<"ios" | "android" | "other" | "installed" | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const k = standalone ? "installed" : /iPhone|iPad|iPod/.test(ua) ? "ios" : /Android/.test(ua) ? "android" : "other";
    const t = setTimeout(() => setKind(k), 0);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as Prompt);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  if (!kind || kind === "installed") return null;

  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setDone(true);
    setPrompt(null);
  };

  return (
    <section className="flex w-full flex-col gap-3 rounded-2xl border border-navy-600 bg-navy-800 p-5 text-left">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- the exact home-screen icon */}
        <img src="/icon-192.png" alt="" className="size-12 rounded-xl" />
        <div>
          <b className="block text-base text-ink">Put Speak Better on your home screen</b>
          <span className="text-xs text-ink-muted">Then just tap the icon - it opens like any other app, already unlocked.</span>
        </div>
      </div>

      {done ? (
        <p className="text-sm font-semibold text-mindset">Added - look for the lion on your home screen.</p>
      ) : prompt ? (
        <button type="button" onClick={install} className="rounded-full bg-figurative px-5 py-3 text-sm font-bold text-navy-950">
          Install Speak Better
        </button>
      ) : kind === "ios" ? (
        <ol className="flex flex-col gap-2 text-sm text-ink-muted">
          <li>
            <b className="text-ink">1.</b> Make sure this page is open in <b className="text-ink">Safari</b>.
          </li>
          <li>
            <b className="text-ink">2.</b> Tap the Share button <ShareIcon /> at the bottom of the screen.
          </li>
          <li>
            <b className="text-ink">3.</b> Scroll down and tap <b className="text-ink">Add to Home Screen</b>, then <b className="text-ink">Add</b>.
          </li>
        </ol>
      ) : kind === "android" ? (
        <ol className="flex flex-col gap-2 text-sm text-ink-muted">
          <li>
            <b className="text-ink">1.</b> Open this page in <b className="text-ink">Chrome</b>.
          </li>
          <li>
            <b className="text-ink">2.</b> Tap the menu <b className="text-ink">⋮</b> at the top right.
          </li>
          <li>
            <b className="text-ink">3.</b> Tap <b className="text-ink">Add to Home screen</b> (or <b className="text-ink">Install app</b>).
          </li>
        </ol>
      ) : (
        <p className="text-sm text-ink-muted">
          On your phone, open this same link: on an iPhone in Safari (Share, then Add to Home Screen); on Android in Chrome (menu ⋮,
          then Install app). On a computer, Chrome and Edge show an install icon at the right of the address bar.
        </p>
      )}
    </section>
  );
}
