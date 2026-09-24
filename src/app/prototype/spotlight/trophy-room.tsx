"use client";

import { useRef, useState } from "react";
import { LockIcon } from "@/components/icons";
import { TrophyStage, type StageTrophy } from "@/components/trophy-stage";

/** Highest first - the order a case is read in. */
const MATERIALS = [
  { key: "obsidian", label: "Obsidian", note: "The rare ones, and the whole road at the end of it." },
  { key: "spectrum", label: "Spectrum glass", note: "Finishing a phase of the road - all seven colours at once." },
  { key: "gold", label: "Gold", note: "A top score: 90 or more on a challenge." },
  { key: "chrome", label: "Chrome", note: "Turning up again and again." },
  { key: "ceramic", label: "Ceramic", note: "How you speak, and how you feel doing it." },
  { key: "painted", label: "Painted", note: "The twenty-four challenges, each the real thing in full colour." },
] as const;

export function TrophyRoom({ trophies }: { trophies: StageTrophy[] }) {
  // Walked in rank order, so the arrows on the stage move through the
  // same sequence as the grid underneath.
  const ordered = MATERIALS.flatMap((m) => trophies.filter((t) => t.material === m.key));
  const [at, setAt] = useState(0);
  // All won is the collection; part-way is what a student actually
  // sees in week three, with the empty places in the case showing.
  const [partWay, setPartWay] = useState(false);
  const stage = useRef<HTMLDivElement>(null);

  const shown = ordered.map((t, i) => ({ ...t, won: partWay ? i % 3 !== 1 : true }));

  const pick = (i: number) => {
    setAt(i);
    stage.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col gap-12">
      <div ref={stage} className="flex scroll-mt-20 flex-col gap-4">
        <div className="flex justify-center">
          <div role="radiogroup" aria-label="Show as" className="flex rounded-full border border-navy-700 bg-navy-900/70 p-1 text-sm">
            {[
              { v: false, label: "All won" },
              { v: true, label: "Part-way through" },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                role="radio"
                aria-checked={partWay === o.v}
                onClick={() => setPartWay(o.v)}
                className={`rounded-full px-4 py-1.5 transition-colors ${
                  partWay === o.v ? "bg-navy-600 text-ink" : "text-ink-muted hover:text-ink"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <TrophyStage trophies={shown} at={at} onGo={setAt} />
      </div>

      {MATERIALS.map((m) => {
        const group = shown.map((t, i) => ({ t, i })).filter(({ t }) => t.material === m.key);
        if (!group.length) return null;
        return (
          <section key={m.key} className="flex flex-col gap-3">
            <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-xl font-bold tracking-tight text-ink">{m.label}</h2>
              <span className="text-sm text-ink-muted">
                {group.length} · {m.note}
              </span>
            </header>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
              {group.map(({ t, i }) => (
                // The finishing trophy takes two tiles - it is the one
                // the rest of the case was leading to.
                <li key={t.id} className={t.grand ? "col-span-2" : undefined}>
                  <button
                    type="button"
                    onClick={() => pick(i)}
                    aria-current={i === at ? "true" : undefined}
                    className={`group flex h-full w-full flex-col items-center justify-start gap-1 rounded-2xl border p-2 pb-3 transition-colors ${
                      i === at ? "border-ink-muted bg-navy-800" : "border-navy-700 bg-navy-900/60 hover:border-navy-500"
                    }`}
                    style={{ background: i === at ? undefined : "radial-gradient(80% 60% at 50% 30%, #101a33, #070c18)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.image}
                      alt=""
                      loading="lazy"
                      className={`aspect-[3/4] w-full object-contain transition-transform duration-300 group-hover:scale-105 ${
                        t.won ? "" : "opacity-40 grayscale"
                      }`}
                    />
                    <span className="flex items-center gap-1 text-center text-xs font-semibold leading-tight text-balance text-ink">
                      {!t.won && <LockIcon className="size-3 shrink-0 text-ink-faint" />}
                      {t.name}
                    </span>
                    {/* What it takes, under every one - not only the trophy
                        in the light. */}
                    {t.how && (
                      <span className="text-center text-[0.65rem] leading-snug text-balance text-ink-muted">{t.how}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
