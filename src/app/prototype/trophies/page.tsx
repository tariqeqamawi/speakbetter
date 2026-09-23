import type { Metadata } from "next";
import { badgeDefs } from "@/data/badges";
import { CoinIdea, CupIdea, MedalIdea } from "@/components/trophy-ideas";
import { PlinthMount, RingMount, SpotlightMount, WedgeMount } from "@/components/trophy-mounts";

export const metadata: Metadata = { title: "Trophy ideas" };

// Three trophy designs, side by side, won and not yet won, at the two
// sizes they actually appear at. A bench, not a page of the app - the
// point is to choose one.

const SAMPLE = [badgeDefs[0], badgeDefs[6], badgeDefs[12], badgeDefs[18]].filter(Boolean);

// The medallions that already exist, mounted four ways. The art is
// untouched: only what it stands in changes.
const MOUNTS = [
  {
    key: "plinth",
    name: "D - On a plinth",
    note: "Standing upright on a stepped block, tilted back a few degrees so the light catches the top, with its own reflection on the floor. The quietest of the four, and the closest to something actually standing on a shelf.",
    Big: PlinthMount,
  },
  {
    key: "ring",
    name: "E - In an open ring",
    note: "How a collector displays a coin: held at its edge in an open metal ring on a post, so light gets behind it. The medallion is framed rather than sitting on something, which makes it read as the valuable part.",
    Big: RingMount,
  },
  {
    key: "spotlight",
    name: "F - Under a spotlight",
    note: "Raised on a tapered column with a cone of light coming down over it. The most theatrical, and the one that suits the single trophy standing in the case rather than the forty on the shelf.",
    Big: SpotlightMount,
  },
  {
    key: "wedge",
    name: "G - Lying back on a wedge",
    note: "Tilted well back, the way a medal sits in a presentation case, so the whole face is lit and the thickness of the disc is obvious. The most three-dimensional, and the best when small, because the silhouette stays a circle.",
    Big: WedgeMount,
  },
] as const;

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
        <h1 className="text-3xl font-semibold tracking-tight">Seven trophies</h1>
        <p className="max-w-xl text-sm text-ink-muted">
          Two families. The first four take the badge art that already exists and ask what it should stand in. The
          last three draw a disc from scratch with the lion on it. Everything here is CSS - a real perspective, a real
          tilt, an edge built from stacked layers and a gleam travelling across the face - so every one of the
          forty-four badges gets one for free, in its own color.
        </p>
      </header>

      <section className="flex flex-col gap-1 border-b border-navy-600 pb-3">
        <h2 className="text-2xl font-bold tracking-tight text-ink">The medallions, mounted</h2>
        <p className="max-w-xl text-sm text-ink-muted">
          The art for all forty-four badges already exists and is the most characterful thing in the app - each one
          its own little painting, each one its own colors. So these four change nothing about the medallion and only
          ask what it is standing in. Real thickness, a real tilt, and a gleam travelling across the face.
        </p>
      </section>

      {MOUNTS.map(({ key, name, note, Big }) => (
        <section key={key} className="flex flex-col gap-4 rounded-2xl border border-navy-600 bg-navy-800 p-5">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold tracking-tight text-ink">{name}</h3>
            <p className="max-w-2xl text-sm text-ink-muted">{note}</p>
          </div>
          <div className="flex flex-wrap items-end justify-center gap-8 rounded-xl bg-navy-950/60 p-6">
            {SAMPLE.map((b) => (
              <Big key={b.id} id={b.id} icon={b.icon} won />
            ))}
          </div>
          <div className="flex flex-wrap items-end justify-center gap-6 rounded-xl bg-navy-950/60 p-5">
            {SAMPLE.map((b, i) => (
              <Big key={b.id} id={b.id} icon={b.icon} won={i === 0} size={64} />
            ))}
          </div>
        </section>
      ))}

      <section className="flex flex-col gap-1 border-b border-navy-600 pb-3 pt-6">
        <h2 className="text-2xl font-bold tracking-tight text-ink">Drawn from scratch</h2>
        <p className="max-w-xl text-sm text-ink-muted">
          The first three, for comparison: the lion on a struck disc rather than the badge&apos;s own painting.
        </p>
      </section>

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
