import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteAsk, SiteHeading, SiteHero } from "@/components/site/site-hero";
import { SiteFooter } from "@/components/site/site-footer";
import { talkMailto } from "@/data/site";

// Work with Tariq, one to one: speaking mentorship. Three ways in -
// the voice, the stories, the speech - each from a starting price on a
// sliding scale, and every one a conversation first. The app is Coach;
// this is the teacher.

export const metadata: Metadata = {
  title: "Work with Tariq",
  description:
    "One-to-one speaking mentorship with Tariq EQ Amawi - unlock your voice, tell your stories more powerfully, and have your speech written with you.",
};

const OFFERS = [
  {
    id: "stories",
    title: "Tell Your Stories More Powerfully",
    price: "$1,200",
    scale: "Sliding scale by number of sessions",
    accent: { border: "border-storytelling/50", text: "text-storytelling", glow: "shadow-[0_0_50px_-24px_var(--color-storytelling)]" },
    lead: "Find the stories in your life, extract the morals and the message, and tell them in a way that shifts people in their seats.",
    points: [
      "Mining your life for the stories only you can tell",
      "Extracting the moral and the message each one carries",
      "Telling them so the room relives them with you - not just hears them",
    ],
  },
  {
    id: "voice",
    title: "Unlocking Your Voice",
    price: "$2,000",
    scale: "Sliding scale by number of sessions",
    accent: { border: "border-body-language/50", text: "text-body-language", glow: "shadow-[0_0_50px_-24px_var(--color-body-language)]" },
    lead: "Unlock the deeper registers and resonance your voice holds - and turn your voice into a frequency key that unlocks the hearts of others.",
    points: [
      "Opening the deeper registers and the resonance you already have",
      "Breath, support and tone that carry to the back of any room",
      "A voice people feel as much as they hear",
    ],
  },
  {
    id: "speech",
    title: "Speechwriting",
    price: "$2,500",
    scale: "Sliding scale by the length of the speech",
    accent: { border: "border-structure/50", text: "text-structure", glow: "shadow-[0_0_50px_-24px_var(--color-structure)]" },
    lead: "Taking the stage at a talk, a summit or a conference? Tariq helps you write your speech, channel your most potent talk, refine and finesse it - then gets you ready for the day with his memorization and slide-creation techniques.",
    points: [
      "Your speech, written with you and channelled from your story",
      "Refined and finessed until every line earns its place",
      "Tariq's memorization technique - no reading, no notes",
      "Slides built his way - supporting you, never competing with you",
    ],
  },
] as const;

export default function MentorshipPage() {
  return (
    <div className="flex flex-col gap-20 pb-10">
      <SiteHero ghost="Mentor" kicker="Work with Tariq" title="Speaking mentorship, one to one" accent="text-figurative">
        The Speak Better app puts an AI coach on every take. Mentorship puts Tariq himself beside you - for your voice,
        your stories, or the speech you&apos;re about to give.
      </SiteHero>

      {/* The three ways in. */}
      <section className="grid gap-5 lg:grid-cols-3">
        {OFFERS.map((o) => (
          <div
            key={o.id}
            id={o.id}
            className={`flex scroll-mt-24 flex-col gap-4 rounded-3xl border bg-navy-800/60 p-7 ${o.accent.border} ${o.accent.glow}`}
          >
            <h2 className={`text-2xl font-semibold tracking-tight ${o.accent.text}`}>{o.title}</h2>
            <p className="text-ink-muted">{o.lead}</p>
            <ul className="flex flex-1 flex-col gap-2">
              {o.points.map((pt) => (
                <li key={pt} className="flex items-start gap-2 text-sm text-ink-muted">
                  <span className={`mt-1.5 size-1.5 shrink-0 rounded-full bg-current ${o.accent.text}`} />
                  {pt}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-0.5 border-t border-navy-600 pt-4">
              <span className="text-sm text-ink-faint">From</span>
              <span className="text-4xl font-bold tracking-tight text-ink">{o.price}</span>
              <span className="text-xs text-ink-faint">{o.scale}</span>
            </div>
            <SiteAsk href={talkMailto(`Mentorship - ${o.title}`, ["Name", "What you're working toward", "Your timeline"])}>
              Talk to Tariq
            </SiteAsk>
          </div>
        ))}
      </section>

      {/* The speechwriting method. */}
      <section className="flex flex-col items-center gap-8">
        <SiteHeading kicker="The speechwriting method" title="A talk built backwards from the moment you want" accent="text-structure" />
        <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 rounded-2xl border border-navy-600 bg-navy-800/60 p-6">
            <span className="text-3xl font-bold text-structure">1</span>
            <b className="text-lg font-semibold text-ink">Decide the outcomes</b>
            <p className="text-sm text-ink-muted">
              The professional outcomes of the talk, the emotional shifts you want in the audience, and the call to action
              you want them to leave with.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-navy-600 bg-navy-800/60 p-6">
            <span className="text-3xl font-bold text-structure">2</span>
            <b className="text-lg font-semibold text-ink">Reverse-engineer the talk</b>
            <p className="text-sm text-ink-muted">
              How it&apos;s put together to get there - complete with mic drop moments, the potential for a standing
              ovation, and a powerful intro and close.
            </p>
          </div>
        </div>
      </section>

      {/* The human part. */}
      <section className="grid overflow-hidden rounded-3xl border border-navy-600 bg-navy-800/60 lg:grid-cols-2">
        <div className="relative min-h-72">
          <Image src="/origin/real/stages.webp" alt="Tariq on stage, arms open to the crowd" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="flex flex-col justify-center gap-4 p-7 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-mindset">Human, not generated</p>
          <h2 className="text-3xl font-semibold tracking-tight text-balance">AI can support you. A mentor connects with you.</h2>
          <p className="text-ink-muted">
            Tariq embraces what AI can be as support - it&apos;s why Speak Better has Coach. But when you bring Tariq in as a
            mentor, you get the human connection. Your speech isn&apos;t generated: it&apos;s channelled from your story,
            your life experience, and the outcomes you choose for your talk.
          </p>
          <p className="text-sm text-ink-faint">
            TEDx speaker, slam poetry winner and creator of the Mic Drop Method.{" "}
            <Link href="/about" className="underline underline-offset-4 hover:text-ink">
              Read Tariq&apos;s story
            </Link>
          </p>
        </div>
      </section>

      <section className="flex flex-col items-center gap-4 rounded-3xl border border-navy-600 bg-navy-800/40 px-6 py-10 text-center">
        <SiteHeading title="Not sure which is right for you?" />
        <p className="max-w-lg text-ink-muted">
          Tell Tariq what you&apos;re working toward, and he&apos;ll tell you where to start. Prefer to practise on your own
          first?{" "}
          <Link href="/landing" className="underline underline-offset-4 hover:text-ink">
            The Speak Better app
          </Link>{" "}
          is the place.
        </p>
        <SiteAsk href={talkMailto("Mentorship", ["Name", "What you're working toward", "Your timeline"])} big>
          Talk to Tariq
        </SiteAsk>
      </section>

      <SiteFooter />
    </div>
  );
}
