import Image from "next/image";
import { COUNTS } from "@/components/what-it-is";
import { FEATURES } from "@/components/whats-inside";
import { badgeDefs } from "@/data/badges";
import { ChallengesRoad, CoachTalking, DeckFan, LessonsCollage, SpectrumMorph } from "@/components/what-tiles";

// What's in the app, said once. It used to be said twice - five big
// numbers ("What you get"), then eleven feature cards, five of which
// were the same five things again. Now the five numbers are the stars,
// each shown as the thing itself moving (what-tiles.tsx) with its
// one-line explanation, and the other six features sit in a strip
// underneath, their numbers leading where they have one.
// (Chosen from /prototype/whats-in-app, option A.)

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
  if (!f.Icon) return <Image src="/logo-mark.png" alt="" width={40} height={32} className="h-6 w-auto" />;
  return <f.Icon className={`size-6 ${f.color}`} />;
}

export function WhatsInApp() {
  return (
    <section className="w-full rounded-3xl border border-navy-600 bg-navy-800 p-5 sm:p-8">
      <h2 className="mb-6 text-center text-2xl font-semibold tracking-tight sm:text-3xl">What you get</h2>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
        {HEADLINE.map(({ count, feature, label, Live }) => (
          <li key={label} className="flex flex-col items-center gap-2 text-center">
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
    </section>
  );
}
