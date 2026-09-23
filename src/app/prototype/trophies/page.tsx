import type { Metadata } from "next";
import { badgeDefs } from "@/data/badges";
import { CoinIdea, CupIdea, MedalIdea } from "@/components/trophy-ideas";

export const metadata: Metadata = { title: "Trophy ideas" };

// Three trophy designs, side by side, won and not yet won, at the two
// sizes they actually appear at. A bench, not a page of the app - the
// point is to choose one.

const SAMPLE = badgeDefs.slice(0, 3);

const IDEAS = [
  {
    key: "medal",
    name: "A - The medal",
    note: "The disc on a ribbon, rim struck in the seven colors, the lion in the middle and the badge's own symbol at the foot. Reads as a trophy at the smallest size, which is where most of them are seen.",
    Big: MedalIdea,
  },
  {
    key: "cup",
    name: "B - The cup",
    note: "The silhouette everybody reads instantly as a trophy - bowl, stem, plinth - with the disc as the bowl's face. The most obviously a trophy from across a room; the busiest when small.",
    Big: CupIdea,
  },
  {
    key: "coin",
    name: "C - The coin",
    note: "A thick disc standing on a base, turned so its milled edge shows. An object with weight rather than a sticker, and the only one that looks like something kept on a shelf instead of worn.",
    Big: CoinIdea,
  },
] as const;

export default function TrophyIdeasPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Three trophies</h1>
        <p className="max-w-xl text-sm text-ink-muted">
          All three bring the disc back, make it large, and put the lion on it. What changes is what the disc is
          mounted in - and that is what decides whether it reads as a medal, a cup, or an object on a shelf. Each is
          drawn rather than painted, so every badge gets one without any art being made for it.
        </p>
      </header>

      {IDEAS.map(({ key, name, note, Big }) => (
        <section key={key} className="flex flex-col gap-4 rounded-2xl border border-navy-600 bg-navy-800 p-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold tracking-tight text-ink">{name}</h2>
            <p className="max-w-2xl text-sm text-ink-muted">{note}</p>
          </div>

          {/* Won, at the size the case shows one. */}
          <div className="flex flex-wrap items-end justify-center gap-8 rounded-xl bg-navy-950/60 p-6">
            {SAMPLE.map((b) => (
              <Big key={b.id} id={b.id} icon={b.icon} won />
            ))}
          </div>

          {/* And the same three in the grid, small, half of them not
              yet won - which is how a shelf actually looks. */}
          <div className="flex flex-wrap items-end justify-center gap-6 rounded-xl bg-navy-950/60 p-5">
            {SAMPLE.map((b, i) => (
              <Big key={b.id} id={b.id} icon={b.icon} won={i === 0} size={64} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
