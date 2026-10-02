import type { Metadata } from "next";
import commits from "@/data/journey-commits.json";
import {
  AREAS,
  DECISIONS,
  PHASES,
  PRINCIPLES,
  PROCESS,
  type Area,
} from "@/data/journey";
import { JourneyLog } from "@/components/journey-log";

export const metadata: Metadata = {
  title: "Product Journey",
  robots: { index: false, follow: false },
};

// The product journey as a spec sheet: what Speak Better is, how it got
// here phase by phase, every major decision with its why and its result,
// the principles that came out of it, and the full change log. Unlisted.

type Commit = { d: string; t: Area };
const ALL = commits as Commit[];
const WORK = ALL.filter((c) => c.t !== "notes");
const DAYS = new Set(ALL.map((c) => c.d)).size;
const busiest = (() => {
  const m = new Map<string, number>();
  for (const c of ALL) m.set(c.d, (m.get(c.d) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1])[0];
})();
const inPhase = (from: string, to: string) =>
  ALL.filter((c) => c.d >= from && c.d <= to).length;
const ORDER: Area[] = [
  "learn",
  "coach",
  "practice",
  "game",
  "road",
  "nav",
  "biz",
  "landing",
  "share",
  "speed",
  "brand",
  "platform",
  "ads",
];

const SPEC: [string, string][] = [
  [
    "What it is",
    "A six-week course app that teaches people to speak naturally and confidently on video - practice, not playback.",
  ],
  [
    "Lessons",
    "83 lessons of 1-2 minutes in 8 colour-coded skills: Tell, Paint, Act, Pro, Frame, Voice, Body, Presence.",
  ],
  [
    "Practice",
    "25 recorded challenges on the S.T.O.R.Y. road - 2D map, then 3D and 4D, earned.",
  ],
  [
    "Feedback",
    "Coach, an AI lion, watches every take and reviews it against the lessons - spoken, captioned, scored.",
  ],
  [
    "Reward",
    "XP, streaks with protection, ranks, 47 trophies earned for consistency, celebrations in the moment.",
  ],
  [
    "People",
    "6 weekly live sessions with Tariq; a community with boards and a shared goal.",
  ],
  [
    "Offer",
    "Starter, Complete, VIP Ultimate. Founding cohort: 20 spots, starts October 3, from $299, 14-day money-back guarantee.",
  ],
  ["Where", "speakbetter.app - one app for phone and laptop, installable."],
];

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-28 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-ink-faint">
          {eyebrow}
        </span>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export default function JourneyPage() {
  return (
    <div className="app-glass mx-auto flex w-full max-w-5xl flex-col gap-16 py-8">
      <header className="flex flex-col gap-5">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-ink-faint">
          Speak Better · Product Spec
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          The Product Journey
        </h1>
        <p className="max-w-3xl text-base text-ink-muted text-pretty sm:text-lg">
          How Speak Better went from a blank scaffold to the product it is now -
          every phase, every major decision, why we made it, and what it
          changed. Built from the full history of {ALL.length} changes and the
          conversations behind them.
        </p>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [String(ALL.length), "changes shipped"],
            [`${DAYS}`, `working days, Aug 7 - Oct 1`],
            [
              String(busiest[1]),
              `on the busiest day (${new Date(busiest[0] + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })})`,
            ],
            [String(DECISIONS.length), "decisions recorded below"],
          ].map(([n, l]) => (
            <div
              key={l}
              className="rounded-2xl border border-navy-600 bg-navy-900/60 px-4 py-3"
            >
              <dt className="text-2xl font-bold tabular-nums text-ink sm:text-3xl">
                {n}
              </dt>
              <dd className="text-xs text-ink-muted">{l}</dd>
            </div>
          ))}
        </dl>
        <nav className="flex flex-wrap gap-2 text-sm">
          {[
            ["#spec", "The Product"],
            ["#timeline", "Timeline"],
            ["#decisions", "Decisions"],
            ["#principles", "Principles"],
            ["#process", "How We Work"],
            ["#log", "Every Change"],
          ].map(([h, l]) => (
            <a
              key={h}
              href={h}
              className="rounded-full border border-navy-600 px-3 py-1.5 font-semibold text-ink-muted hover:text-ink"
            >
              {l}
            </a>
          ))}
        </nav>
      </header>

      <Section id="spec" eyebrow="01 · Spec Sheet" title="The Product, Today">
        <dl className="grid gap-3 sm:grid-cols-2">
          {SPEC.map(([k, v]) => (
            <div
              key={k}
              className="rounded-2xl border border-navy-600 bg-navy-900/60 px-5 py-4"
            >
              <dt className="text-xs font-bold uppercase tracking-[0.18em] text-figurative">
                {k}
              </dt>
              <dd className="mt-1 text-sm text-ink text-pretty">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="timeline" eyebrow="02 · Timeline" title="Seven Phases">
        <ol className="relative flex flex-col gap-4 border-l border-navy-600 pl-6">
          {PHASES.map((p, i) => (
            <li key={p.title} className="relative">
              <span className="absolute -left-[1.95rem] top-1.5 grid size-4 place-items-center rounded-full bg-navy-900 ring-2 ring-figurative" />
              <div className="rounded-2xl border border-navy-600 bg-navy-900/60 px-5 py-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-ink-faint">
                    {String(i + 1).padStart(2, "0")} · {p.when}
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight text-ink">
                    {p.title}
                  </h3>
                  <span className="text-xs font-semibold tabular-nums text-figurative">
                    {inPhase(p.from, p.to)} changes
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-muted text-pretty">
                  {p.summary}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        id="decisions"
        eyebrow="03 · Decision Records"
        title="What We Did, Why, And What It Changed"
      >
        <p className="-mt-2 max-w-3xl text-sm text-ink-muted text-pretty">
          Results are what each change did to the product, and Tariq&apos;s own
          reactions where he gave one. There is no conversion data yet - Vercel
          Web Analytics still needs switching on - so nothing here claims a
          number it can&apos;t show.
        </p>
        <div className="flex flex-col gap-10">
          {ORDER.filter((a) => DECISIONS.some((d) => d.area === a)).map((a) => (
            <div key={a} className="flex flex-col gap-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: AREAS[a].color }}
                />
                {AREAS[a].name}
                <span className="text-xs font-semibold text-ink-faint">
                  {WORK.filter((c) => c.t === a).length} changes in all
                </span>
              </h3>
              <div className="grid gap-3 lg:grid-cols-2">
                {DECISIONS.filter((d) => d.area === a).map((d) => (
                  <article
                    key={d.title}
                    className="flex flex-col gap-3 rounded-2xl border border-navy-600 bg-navy-900/60 p-5"
                    style={{ boxShadow: `inset 3px 0 0 ${AREAS[a].color}` }}
                  >
                    <div>
                      <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-faint">
                        {d.when}
                      </span>
                      <h4 className="text-base font-semibold leading-snug text-ink text-balance">
                        {d.title}
                      </h4>
                    </div>
                    <dl className="flex flex-col gap-2 text-sm">
                      {(
                        [
                          ["What", d.what, "text-ink-muted"],
                          ["Why", d.why, "text-ink-muted"],
                          ["Result", d.result, "text-ink"],
                        ] as const
                      ).map(([k, v, c]) => (
                        <div
                          key={k}
                          className="grid grid-cols-[4.2rem_1fr] gap-2"
                        >
                          <dt className="pt-0.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-faint">
                            {k}
                          </dt>
                          <dd className={`${c} text-pretty`}>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="principles"
        eyebrow="04 · Principles"
        title="What We Learned, For The Next Product"
      >
        <ol className="grid gap-3 sm:grid-cols-2">
          {PRINCIPLES.map(([p, why], i) => (
            <li
              key={p}
              className="flex gap-4 rounded-2xl border border-navy-600 bg-navy-900/60 px-5 py-4"
            >
              <span className="text-2xl font-bold tabular-nums text-figurative">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="font-semibold text-ink text-pretty">{p}</p>
                <p className="mt-1 text-sm text-ink-muted text-pretty">{why}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-sm text-ink-muted">
          These live on as the <b className="text-ink">Creative Developer AI</b>{" "}
          skill - a methodology and a 16-point rubric for testing every future
          product the same way.
        </p>
      </Section>

      <Section id="process" eyebrow="05 · Process" title="How We Work">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROCESS.map(([k, v]) => (
            <div
              key={k}
              className="rounded-2xl border border-navy-600 bg-navy-900/60 px-5 py-4"
            >
              <p className="font-semibold text-ink">{k}</p>
              <p className="mt-1 text-sm text-ink-muted text-pretty">{v}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="log" eyebrow="06 · The Record" title="Every Change">
        <JourneyLog />
      </Section>
    </div>
  );
}
