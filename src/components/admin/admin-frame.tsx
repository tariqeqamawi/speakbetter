"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";

// The frame both admin rooms share: which room, which skin, and one
// tab's worth of insight at a time instead of a page that scrolls
// forever. The open tab lives in the address (#progress), so a link can
// open straight onto it, and the skin is remembered on the device.
//
// Two skins, because the audience differs:
//   Speak Better - the app's own look: the green and purple glow, glass
//     panels, the seven neon colors. For Tariq, and for anyone who should
//     feel the product.
//   Brass Tacks - the facts, plainly: white paper, black ink, greys, one
//     brass accent. For an investor reading numbers, and for printing.
// The Brass Tacks skin swaps the color tokens inside this frame only
// (globals.css .skin-plain), so every panel follows without knowing.

export type Skin = "speak" | "plain";

export function AdminFrame<T extends string>({
  at,
  title,
  blurb,
  banner,
  tabs,
  render,
}: {
  at: "insights" | "data-room";
  title: string;
  blurb: React.ReactNode;
  banner?: React.ReactNode;
  tabs: readonly { id: T; label: string }[];
  render: (tab: T) => React.ReactNode;
}) {
  const [tab, setTab] = useState<T>(tabs[0].id);
  const [skin, setSkin] = useState<Skin>("speak");

  useEffect(() => {
    // The tab named in the address - on arrival, and whenever a link or
    // the back button changes it.
    const fromHash = () => {
      const id = window.location.hash.slice(1) as T;
      if (tabs.some((t) => t.id === id)) setTab(id);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the device's choice, read after hydration
      if (localStorage.getItem("admin-skin") === "plain") setSkin("plain");
    } catch {}
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tabs]);

  const pick = (t: T) => {
    setTab(t);
    history.pushState(null, "", `#${t}`);
  };
  const wear = (s: Skin) => {
    setSkin(s);
    try {
      localStorage.setItem("admin-skin", s);
    } catch {}
  };

  return (
    <div
      className={`admin-frame my-6 flex flex-col gap-6 rounded-3xl ${
        skin === "plain" ? "skin-plain p-5 sm:p-8" : "app-glass"
      }`}
    >
      {skin === "speak" && <div className="app-glow" aria-hidden />}
      <header className="flex flex-col gap-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AdminNav at={at} />
          <div className="flex items-center gap-1 rounded-full border border-navy-600 p-1 text-xs" role="radiogroup" aria-label="Skin">
            {(
              [
                ["speak", "Speak Better"],
                ["plain", "Brass Tacks"],
              ] as const
            ).map(([s, label]) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={skin === s}
                onClick={() => wear(s)}
                className={`rounded-full px-3 py-1 font-semibold transition-colors ${
                  skin === s ? "bg-ink text-navy-900" : "text-ink-muted hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <div className="max-w-2xl text-sm text-ink-muted">{blurb}</div>
        {banner}
        <nav className="-mx-1 flex gap-1 overflow-x-auto border-b border-navy-600 px-1 pt-2 [scrollbar-width:none]" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => pick(t.id)}
              className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
                tab === t.id ? "border-figurative text-ink" : "border-transparent text-ink-faint hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <div role="tabpanel">{render(tab)}</div>
    </div>
  );
}
