import type { Metadata } from "next";
import { SiteAsk, SiteHeading, SiteHero } from "@/components/site/site-hero";
import { SiteFooter } from "@/components/site/site-footer";
import { talkMailto } from "@/data/site";

// Speak Better for a whole team, sold in packs of ten seats. No prices on
// the page: a team is a conversation - how many people, what they're
// preparing for, whether Tariq comes to them - so every pack's button
// opens one.

export const metadata: Metadata = {
  title: "Teams",
  description: "Speak Better for your team, school or company - in packs of 10, 50 or 100+ seats.",
};

const PACKS = [
  { seats: "10", name: "Team", line: "A team or a class, learning together as one private cohort.", accent: "border-mindset/50 text-mindset" },
  { seats: "50", name: "Department", line: "Several teams, one program - and live sessions with Tariq built around your people.", accent: "border-body-language/60 text-body-language", featured: true },
  { seats: "100+", name: "Enterprise", line: "The whole organisation, shaped with you: seats, live sessions, printed decks and books.", accent: "border-structure/50 text-structure" },
];

const WHAT = [
  { title: "Every seat, the full app", body: "All the skill lessons in the eight colors, the card deck, and the 25 challenges of the S.T.O.R.Y. road." },
  { title: "Coach on every take", body: "Each person films, and the AI coach watches and reviews every attempt - gestures, eyes, voice and the story." },
  { title: "Live with Tariq", body: "Sessions for your group with Tariq himself - hot-seat coaching on the talks your people actually have to give." },
  { title: "Built around your people", body: "Pitches, all-hands, client calls, keynotes, going on camera - we shape the program around what they're preparing for." },
];

export default function TeamsPage() {
  return (
    <div className="flex flex-col gap-20 pb-10">
      <SiteHero ghost="Teams" kicker="Speak Better for teams" title="Give your whole team a voice worth listening to" accent="text-body-language">
        For companies, schools and organisations - in packs of ten seats. Tell us about your people and we&apos;ll put
        together the right program.
      </SiteHero>

      <section className="grid gap-4 lg:grid-cols-3">
        {PACKS.map((p) => (
          <div
            key={p.seats}
            className={`flex flex-col items-center gap-3 rounded-3xl border bg-navy-800/60 p-7 text-center ${p.accent.split(" ")[0]} ${
              p.featured ? "lg:-my-3 lg:bg-navy-800 lg:shadow-[0_0_40px_-12px_var(--color-body-language)]" : ""
            }`}
          >
            <span className={`text-xs font-bold uppercase tracking-[0.22em] ${p.accent.split(" ")[1]}`}>{p.name}</span>
            <span className="text-5xl font-bold tracking-tight text-ink">
              {p.seats}
              <span className="ml-1 text-lg font-semibold text-ink-muted">seats</span>
            </span>
            <p className="min-h-12 text-sm text-ink-muted">{p.line}</p>
            <SiteAsk
              href={talkMailto(`Teams - ${p.seats} seats`, ["Name", "Organisation", "How many people", "What they're preparing for", "When you'd like to start"])}
            >
              Talk to us
            </SiteAsk>
          </div>
        ))}
      </section>

      <section className="flex flex-col items-center gap-8">
        <SiteHeading kicker="What your team gets" title="The course, the coach and the teacher" accent="text-mindset" />
        <div className="grid w-full gap-4 sm:grid-cols-2">
          {WHAT.map((w) => (
            <div key={w.title} className="flex flex-col gap-1.5 rounded-2xl border border-navy-600 bg-navy-800/60 p-5">
              <b className="font-semibold text-ink">{w.title}</b>
              <span className="text-sm text-ink-muted">{w.body}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center gap-4 rounded-3xl border border-navy-600 bg-navy-800/40 px-6 py-10 text-center">
        <SiteHeading title="Not sure how many seats?" />
        <p className="max-w-lg text-ink-muted">Tell us who they are and what they&apos;re speaking for, and we&apos;ll work it out together.</p>
        <SiteAsk href={talkMailto("Teams", ["Name", "Organisation", "How many people", "What they're preparing for"])} big>
          Start the conversation
        </SiteAsk>
      </section>

      <SiteFooter />
    </div>
  );
}
