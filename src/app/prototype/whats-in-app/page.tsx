import type { Metadata } from "next";
import Image from "next/image";
import { COUNTS } from "@/components/what-it-is";
import { FEATURES } from "@/components/whats-inside";
import { badgeDefs } from "@/data/badges";
import { LionArtWhenNear } from "@/components/lion-mouth";
import { ChallengesRoad, CoachTalking, DeckFan, LessonsCollage, SpectrumMorph } from "@/components/what-tiles";

// A design bench for merging "What you get" (the five numbers) and
// "Features at a glance" (the eleven cards) into one block - two layouts
// side by side, built from the real content, before either goes on the
// landing page.

export const metadata: Metadata = {
  title: "What's in the app - layouts",
  robots: { index: false, follow: false },
};

// The five headline items and the feature card each one duplicates.
const HEADLINE = [
  { count: COUNTS[0], feature: "83 skill lessons", label: "skill lessons", Live: LessonsCollage },
  { count: COUNTS[1], feature: "25 challenges", label: "interactive challenges", Live: ChallengesRoad },
  { count: COUNTS[2], feature: "Digital card deck", label: "cards in the digital deck", Live: DeckFan },
  { count: COUNTS[3], feature: "Interactive Coach", label: "AI coach, trained on the method", Live: CoachTalking },
  { count: COUNTS[4], feature: "Speaking Spectrum", label: "colors of speaking to light up", Live: SpectrumMorph },
];
const lineOf = (name: string) => FEATURES.find((f) => f.name === name)?.line ?? "";
const REST = FEATURES.filter((f) => !HEADLINE.some((h) => h.feature === f.name));
const NUMBER: Record<string, string> = {
  Trophies: String(badgeDefs.length),
  Leaderboards: "3",
};

function Icon({ f }: { f: (typeof FEATURES)[number] }) {
  if (!f.Icon) {
    return <Image src="/logo-mark.png" alt="" width={40} height={32} className="h-6 w-auto" />;
  }
  return <f.Icon className={`size-6 ${f.color}`} />;
}

export default function WhatsInAppBench() {
  return (
    <LionArtWhenNear>
    <div className="flex flex-col gap-16 py-10">
      <header className="flex max-w-3xl flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Layout options</p>
        <h1 className="text-3xl font-semibold tracking-tight">What&apos;s in the app - one block instead of two</h1>
        <p className="text-sm text-ink-muted">
          Today the landing page lists what&apos;s included twice: five big numbers (&ldquo;What you get&rdquo;), then
          eleven cards (&ldquo;Features at a glance&rdquo;) - five of which repeat the numbers. Two ways to make it
          one. Nothing here is on the landing page yet.
        </p>
      </header>

      {/* ── Option A ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-figurative">Option A</p>
          <h2 className="text-xl font-semibold">The big five, then everything else in a strip</h2>
          <p className="text-sm text-ink-muted">
            The five numbers stay the stars - each shown as the thing itself, moving: the lessons as a shuffling
            collage, the road scrolling, the deck fanned through its colors, Coach talking, the spectrum turning from
            wave to bars. Each carries its one-line explanation. The other six
            features sit underneath as a compact row, numbers leading where they have one.
          </p>
        </div>

        <div className="rounded-3xl border border-navy-600 bg-navy-800 p-6 sm:p-8">
          <h3 className="mb-6 text-center text-2xl font-semibold tracking-tight sm:text-3xl">What&apos;s in the app</h3>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {HEADLINE.map(({ count, feature, label, Live }) => (
              <li key={label} className="flex flex-col items-center gap-2 text-center">
                {/* Each number shown as the thing itself, moving. */}
                <span className="relative aspect-square w-full max-w-52 overflow-hidden rounded-2xl border border-navy-600 bg-navy-950">
                  <Live />
                </span>
                <b className={`text-4xl font-extrabold tabular-nums ${count.color}`}>{count.n}</b>
                <span className="text-sm font-semibold text-ink">{label}</span>
                <span className="text-xs leading-snug text-ink-muted">{lineOf(feature)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 border-t border-navy-600 pt-6">
            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.25em] text-ink-faint">
              And everything that keeps you going
            </p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {REST.map((f) => (
                <li key={f.name} className="flex flex-col items-center gap-1.5 rounded-2xl bg-navy-900/60 p-3 text-center">
                  <Icon f={f} />
                  <span className="text-sm font-semibold text-ink">
                    {NUMBER[f.name] && <b className={`mr-1 ${f.color}`}>{NUMBER[f.name]}</b>}
                    {f.name}
                  </span>
                  <span className="text-[0.7rem] leading-snug text-ink-faint">{f.line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Option B ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-figurative">Option B</p>
          <h2 className="text-xl font-semibold">A bento grid - every feature one tile, sized by importance</h2>
          <p className="text-sm text-ink-muted">
            One grid holds all eleven. The five headline items are large tiles with their picture and number; the
            rest are smaller tiles around them. Reads like a product page - everything at once, nothing repeated.
          </p>
        </div>

        <div className="rounded-3xl border border-navy-600 bg-navy-800 p-4 sm:p-6">
          <h3 className="mb-5 text-center text-2xl font-semibold tracking-tight sm:text-3xl">What&apos;s in the app</h3>
          <div className="grid auto-rows-[minmax(9rem,auto)] grid-cols-2 gap-3 lg:grid-cols-4">
            {HEADLINE.map(({ count, feature, label }, i) => (
              <div
                key={label}
                className={`relative flex overflow-hidden rounded-2xl border border-navy-600 bg-navy-950 ${
                  i === 0 ? "col-span-2 row-span-2" : i === 3 ? "col-span-2" : ""
                }`}
              >
                <Image src={count.image} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/50 to-transparent" />
                <div className="relative mt-auto flex flex-col gap-1 p-4">
                  <b className={`font-extrabold tabular-nums leading-none ${count.color} ${i === 0 ? "text-6xl" : "text-4xl"}`}>
                    {count.n}
                  </b>
                  <span className="text-sm font-semibold text-ink">{label}</span>
                  <span className={`leading-snug text-ink-muted ${i === 0 ? "text-sm" : "text-xs"}`}>{lineOf(feature)}</span>
                </div>
              </div>
            ))}
            {REST.map((f, i) => (
              <div
                key={f.name}
                className={`flex flex-col gap-2 rounded-2xl border border-navy-600 bg-navy-900/60 p-4 ${
                  i === REST.length - 1 ? "lg:col-span-2" : ""
                }`}
              >
                <Icon f={f} />
                <span className="text-sm font-semibold text-ink">
                  {NUMBER[f.name] && <b className={`mr-1 ${f.color}`}>{NUMBER[f.name]}</b>}
                  {f.name}
                </span>
                <span className="text-xs leading-snug text-ink-muted">{f.line}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
    </LionArtWhenNear>
  );
}
