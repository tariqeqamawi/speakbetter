"use client";

import { useRef, useState, type ReactNode } from "react";
import { LockIcon, RepeatIcon } from "@/components/icons";
import { TrophyStage, OnceOnlyNote, type StageTrophy } from "@/components/trophy-stage";
import { TrophyArt } from "@/components/trophy-art";
import { TrophyReveal } from "@/components/trophy-reveal";
import { ShareTrophyButton } from "@/components/share-trophy-button";
import { MATERIALS } from "@/data/trophy-materials";
import { useRarity } from "@/lib/rarity";

// The trophy room: one trophy in the spotlight, and the whole case
// underneath it by material. It is the student's real trophy case
// (badge-collection.tsx gives it their record) and the preview at
// /prototype/spotlight (which gives it a demo toggle), so the two can
// never show different rooms.
//
// Everything in it is driven by `won` on each trophy. A won one stands
// lit, can be shared as a picture and its moment replayed; one not yet
// won is its silhouette on its plinth, with what it takes written under
// it.

export function TrophyRoom({
  trophies,
  initialAt = 0,
  studentName = "",
  toolbar,
  rarity = true,
}: {
  /** In the order the case is walked - highest material first. */
  trophies: StageTrophy[];
  /** Which one is in the light to begin with. */
  initialAt?: number;
  /** On the share card. */
  studentName?: string;
  /** Anything that belongs above the stage (the preview's toggle). */
  toolbar?: ReactNode;
  /** Ask the server how many hold each one. */
  rarity?: boolean;
}) {
  const [at, setAt] = useState(Math.min(initialAt, Math.max(0, trophies.length - 1)));
  const [replaying, setReplaying] = useState<StageTrophy | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const heldBy = useRarity(rarity);

  const pick = (i: number) => {
    setAt(i);
    stage.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col gap-10">
      <MaterialProgress trophies={trophies} />

      {/* The tour points at the stage - the case's centrepiece - rather
          than at the whole long room. */}
      <div ref={stage} data-tour="trophies" className="flex scroll-mt-20 flex-col gap-4">
        {toolbar}
        <TrophyStage
          trophies={trophies}
          at={at}
          onGo={setAt}
          caption={(t) => (
            <>
              <Rarity pct={heldBy(t.id)} />
              {t.won && (
                <span className="mt-2 flex flex-wrap items-start justify-center gap-2">
                  <ShareTrophyButton trophy={t} studentName={studentName} />
                  <button
                    type="button"
                    onClick={() => setReplaying(t)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-navy-600 px-4 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
                  >
                    <RepeatIcon className="size-4" />
                    Replay the moment
                  </button>
                </span>
              )}
            </>
          )}
        />
      </div>

      {MATERIALS.map((m) => {
        const group = trophies.map((t, i) => ({ t, i })).filter(({ t }) => t.material === m.key);
        if (!group.length) return null;
        const won = group.filter(({ t }) => t.won).length;
        return (
          <section key={m.key} className="flex flex-col gap-3">
            <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="text-xl font-bold tracking-tight text-ink">{m.label}</h3>
              <span className="text-sm text-ink-muted">
                <span className="tabular-nums">
                  {won} of {group.length}
                </span>{" "}
                · {m.note}
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
                    aria-label={`${t.name}${t.won ? "" : ", not yet won"}`}
                    className={`group flex h-full w-full flex-col items-center justify-start gap-1 rounded-2xl border p-2 pb-3 transition-colors ${
                      i === at ? "border-ink-muted bg-navy-800" : "border-navy-700 bg-navy-900/60 hover:border-navy-500"
                    }`}
                    style={{ background: i === at ? undefined : "radial-gradient(80% 60% at 50% 30%, #101a33, #070c18)" }}
                  >
                    <TrophyArt
                      src={t.image}
                      won={t.won}
                      grand={t.grand}
                      lazy
                      className={`w-full transition-transform duration-300 group-hover:scale-105 ${t.grand ? "max-w-[46%]" : ""}`}
                    />
                    <span
                      className={`flex items-center gap-1 text-center text-xs font-semibold leading-tight text-balance ${
                        t.won ? "text-ink" : "text-ink-muted"
                      }`}
                    >
                      {!t.won && <LockIcon className="size-3 shrink-0 text-ink-faint" />}
                      {t.name}
                    </span>
                    {t.onceOnly && <OnceOnlyNote className="mt-0.5" />}
                    {/* What it takes, under every one - not only the trophy
                        in the light. */}
                    {t.how && (
                      <span className="text-center text-[0.65rem] leading-snug text-balance text-ink-muted">{t.how}</span>
                    )}
                    <Rarity pct={heldBy(t.id)} small />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {replaying && (
        <TrophyReveal
          trophy={replaying}
          studentName={studentName}
          showCaseLink={false}
          eyebrow={
            replaying.earnedAt
              ? `Won ${new Date(replaying.earnedAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}`
              : "Trophy won"
          }
          onContinue={() => setReplaying(null)}
        />
      )}
    </div>
  );
}

/** "Painted 14/23 · Gold 3/23 ..." - how far through each material. */
function MaterialProgress({ trophies }: { trophies: StageTrophy[] }) {
  const rows = MATERIALS.map((m) => {
    const group = trophies.filter((t) => t.material === m.key);
    return { ...m, total: group.length, won: group.filter((t) => t.won).length };
  }).filter((r) => r.total > 0);
  const won = trophies.filter((t) => t.won).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-ink">
          <span className="tabular-nums">{won}</span> of <span className="tabular-nums">{trophies.length}</span> won
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-navy-900">
        <div
          className="spectrum-rule h-full rounded-full transition-[width] duration-700"
          style={{ width: `${trophies.length ? (won / trophies.length) * 100 : 0}%` }}
        />
      </div>
      <ul aria-label="Trophies won by material" className="flex flex-wrap gap-2">
        {rows.map((r) => (
          <li
            key={r.key}
            className={`flex items-baseline gap-1.5 rounded-full border px-3 py-1 text-xs ${
              r.won > 0 ? "border-navy-500 bg-navy-800 text-ink" : "border-navy-700 text-ink-faint"
            }`}
          >
            <span className="font-semibold">{r.label}</span>
            <span className="tabular-nums">
              {r.won}/{r.total}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A real share of the cohort, or nothing at all. */
function Rarity({ pct, small = false }: { pct: number | null; small?: boolean }) {
  if (pct === null) return null;
  return (
    <span className={`tabular-nums text-ink-faint ${small ? "text-[0.6rem]" : "text-xs"}`}>
      {pct === 0 ? "Nobody in this cohort holds it yet" : `Held by ${pct}% of this cohort`}
    </span>
  );
}
