import Link from "next/link";
import { SiteFooter } from "@/components/site/site-footer";
import { TeamsCard } from "@/components/site/teams-card";
import { Soundwave } from "@/components/soundwave";
import { Pricing } from "@/components/pricing";
import { HowItWorksSection, Phone } from "@/components/landing-showcase";
import { PhoneFilm } from "@/components/phone-film";
import { SpectrumDemo } from "@/components/spectrum-demo";
import { HeroBeat } from "@/components/hero-beat";
import { JoinCta } from "@/components/join-cta";
import { LazyVimeoPlayer } from "@/components/lazy-vimeo-player";
import { foundingCohort, priceCents } from "@/data/pricing";
import { cohort } from "@/data/cohort";
import { StickyJoin } from "@/components/sticky-join";
import { HeroLion } from "@/components/hero-lion";
import { TestimonialStream } from "@/components/testimonial-stream";
import { proofOf, type Proof } from "@/data/testimonials";
import { LionArtWhenNear } from "@/components/lion-mouth";
import { CoachDemo } from "@/components/coach-demo";
import { SectionMark } from "@/components/landing-sections";
import { LessonStack } from "@/components/lesson-stack";
import { LandingTracking } from "@/components/landing-tracking";
import { TryChallenge } from "@/components/try-challenge";
import { ChevronDownIcon } from "@/components/icons";

// THE LANDING PAGE, TWO WAYS, to compare (/landing-a and /landing-b):
// the pared-back page with what a first-time visitor needs to decide -
// the price on the door, a guarantee, who Tariq is, one result near the
// top, the app on film (light, not live), what you earn, the five
// questions people ask, and tracking to see what they do. B adds one
// thing: a challenge to try right there, Coach's review and all.

const PROOF: Proof[] = ["teacher", "lessons", "storytelling", "results"];
const quotes = PROOF.map((tag) => proofOf(tag)[0]).filter(Boolean);
/** The lowest price, for the door. */
const FROM_LABEL = `$${Math.round(Math.min(...Object.values(priceCents)) / 100)}`;

const FAQ: { q: string; a: string }[] = [
  {
    q: "How long does it take each day?",
    a: "A few minutes. Lessons run one to two minutes, and a challenge take is up to three. Most days are a lesson or two and, when you're ready, one take.",
  },
  {
    q: "Do I need any equipment?",
    a: "Just your phone. Prop it up and press record - no studio, no crew, no microphone. A laptop works too.",
  },
  {
    q: "Who sees my videos?",
    a: "Coach - the AI - watches each take to review it, and the copy he watched is deleted once his review comes back. Other students never see your videos. On VIP, the takes you choose to send Tariq are seen by him.",
  },
  {
    q: "What if I miss a week?",
    a: `Catch up when you can: the lessons and challenges are there whenever you open the app, and the weekly live sessions are recorded and posted, usually within a day. Your six weeks run ${cohort.runLabel}, with an optional monthly plan after.`,
  },
  {
    q: "Can I do it all on my phone?",
    a: "Yes - it's built for the phone and installs to your home screen like an app. Everything works on a laptop too.",
  },
];

export function LandingV({ variant }: { variant: "a" | "b" }) {
  const page = `landing-${variant}`;
  return (
    <LionArtWhenNear>
      <LandingTracking page={page} />

      {/* The date and the price, held under the top bar the whole way. */}
      <div className="sticky-under-header no-glass -mx-4 -mt-8 border-b border-navy-600 bg-navy-850 px-4 py-2 xl:-mx-8 xl:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-3 text-sm">
          <span className="text-balance">
            <b className="font-semibold text-storytelling">Starts {cohort.startShort}</b>
            <span className="text-ink-muted"> · 20 spots · from {FROM_LABEL}</span>
          </span>
          <Link href="#pricing" data-track="strip" className="shrink-0 rounded-full bg-figurative px-3 py-1 text-xs font-bold text-navy-950">
            Join
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-16 pb-8 pt-4">
        {/* THE HERO: the promise, Tariq and who he is, the course in a
            line, one result, and the door - price and guarantee on it. */}
        <section className="flex flex-col items-center gap-4 text-center">
          <div className="flex w-full max-w-xs flex-col items-center">
            <HeroLion className="h-28 w-auto sm:h-36" />
            <Soundwave variant="hero" className="-mt-2 h-10 w-full sm:h-12" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Become Confident Speaking On Video.</h1>
          <div className="w-full max-w-3xl">
            <div className="overflow-hidden rounded-2xl border border-navy-600 shadow-2xl shadow-navy-950/80">
              <LazyVimeoPlayer
                vimeoId="1082011912"
                title="Speak Better - From Awkward To Awesome In Minutes A Day"
                poster="/thumbs/1082011047.jpg"
              />
            </div>
            <p className="mt-2 text-sm font-medium text-ink-muted">From Awkward To Awesome In Minutes A Day.</p>
            {/* Who's teaching. */}
            <p className="mt-3 text-base font-semibold text-ink">Tariq EQ Amawi</p>
            <p className="text-xs font-medium text-ink-muted text-balance">
              TEDx speaker <span className="text-ink-faint">·</span> Slam poetry winner{" "}
              <span className="text-ink-faint">·</span> National writing winner
            </p>
          </div>
          <p className="text-sm font-semibold text-ink text-balance">
            83 Lessons <span className="text-ink-faint">·</span> 25 Challenges{" "}
            <span className="text-ink-faint">·</span> 8 Colors <span className="text-ink-faint">·</span> An AI Coach{" "}
            <span className="text-ink-faint">·</span> 6 Weeks
          </p>
          {/* One result, before anything else is asked of them. */}
          <figure className="max-w-md rounded-2xl border border-navy-600 bg-navy-900/60 px-5 py-4">
            <blockquote className="text-base font-medium leading-snug text-ink text-balance">
              &ldquo;In only week 2 I already learned how to stop the &lsquo;um&rsquo;, and the value that Tariq has been
              dropping is paradigm-shifting.&rdquo;
            </blockquote>
            <figcaption className="mt-2 text-xs font-semibold text-ink-muted">Sharon Ho</figcaption>
          </figure>
          <div data-track="hero">
            <JoinCta label={`Join Speak Better · from ${FROM_LABEL}`} seal sealSize={96} />
          </div>
        </section>

        {/* B: TRY IT, right here - one challenge, Coach's review and all. */}
        {variant === "b" && (
          <>
            <div id="try" className="scroll-mt-28" />
            <TryChallenge />
          </>
        )}

        {/* How it works, and what recording yourself looks like. */}
        <SectionMark id="how" />
        <HowItWorksSection />

        {/* The app on film: a lesson, and the deck - a full spread dealt. */}
        <section className="flex flex-col items-center gap-5">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">See the app in action</h2>
          <div className="-mx-4 flex w-[calc(100%+2rem)] snap-x snap-mandatory justify-start gap-5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:w-full sm:justify-center sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
            {[
              { src: "/film/landing-lesson", label: "A lesson - the video, its key ideas, every lesson in the color" },
              { src: "/film/landing-deck", label: "The deck - deal a full spread: one card of every color, the recipe for a talk" },
            ].map((f) => (
              <div key={f.src} className="w-56 shrink-0 snap-center">
                <Phone label={f.label}>
                  <PhoneFilm src={`${f.src}.mp4`} poster={`${f.src}.jpg`} label={f.label} />
                </Phone>
              </div>
            ))}
          </div>
        </section>

        {/* Coach, a review of his - and that you can ask him anything. */}
        <SectionMark id="coach" />
        <section className="flex w-full flex-col items-center gap-3">
          <CoachDemo />
          <p className="max-w-md text-center text-sm text-ink-muted text-balance">
            And between takes, ask Coach anything about your speaking - he knows your record. (Complete and VIP.)
          </p>
        </section>

        {/* Why practice beats watching. */}
        <HeroBeat />

        {/* The spectrum. */}
        <section className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">Your Speaking Spectrum</h2>
          <p className="max-w-md text-ink-muted text-balance">Eight color-coded skills, each lighting up as Coach sees you use it.</p>
          <SpectrumDemo />
        </section>

        {/* The challenges: a course, or a ride - on film, three ways. */}
        <SectionMark id="challenges" />
        <section className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            25 challenges. Take them as a course, or as a ride.
          </h2>
          <p className="max-w-md text-sm text-ink-muted text-balance">
            Start on the map, like a normal course. Complete challenges to unlock 3D, then 4D - the full roller-coaster
            ride through the S.T.O.R.Y. road.
          </p>
          <div className="-mx-4 flex w-[calc(100%+2rem)] snap-x snap-mandatory justify-start gap-5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:w-full sm:justify-center sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
            {[
              { src: "/film/landing-road2d", label: "2D - the map" },
              { src: "/film/landing-road3d", label: "3D - your path, lit" },
              { src: "/film/landing-road4d", label: "4D - the full ride" },
            ].map((f) => (
              <div key={f.src} className="w-48 shrink-0 snap-center">
                <Phone label={f.label}>
                  <PhoneFilm src={`${f.src}.mp4`} poster={`${f.src}.jpg`} label={f.label} />
                </Phone>
              </div>
            ))}
          </div>
        </section>

        {/* What you earn as you go. */}
        <section className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">What you earn as you go</h2>
          <ul className="flex max-w-2xl flex-wrap justify-center gap-2 text-sm">
            {[
              ["XP", "for every lesson and take"],
              ["7 ranks", "First Words to Unforgettable"],
              ["Trophies", "one for every challenge you pass, gold for 90+"],
              ["Streaks", "up to double XP"],
              ["3D and 4D", "unlocked by your progress"],
            ].map(([b, rest]) => (
              <li key={b} className="rounded-full border border-navy-600 bg-navy-900/60 px-3.5 py-1.5 text-ink-muted">
                <b className="font-semibold text-ink">{b}</b> - {rest}
              </li>
            ))}
          </ul>
        </section>

        {/* The lessons, as the app lists them. */}
        <SectionMark id="lessons" />
        <section className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">83 lessons, 1-2 minutes each</h2>
          <LessonStack />
        </section>

        <TestimonialStream items={quotes} columns={2} />

        {/* The five questions people ask, folded. */}
        <section className="flex flex-col items-center gap-4">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Questions</h2>
          <ul className="flex w-full max-w-xl flex-col gap-2">
            {FAQ.map((f) => (
              <li key={f.q}>
                <details className="group rounded-xl border border-navy-600 bg-navy-900/60">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronDownIcon className="size-4 shrink-0 text-ink-faint transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="px-4 pb-4 text-sm text-ink-muted text-pretty">{f.a}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>

        {/* The prices. */}
        <SectionMark id="pricing" />
        <section className="flex flex-col items-center gap-5" data-track="pricing">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-figurative">
              <span className="size-2 animate-pulse rounded-full bg-figurative" />
              {foundingCohort.headline}
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-balance">Three tiers, by how much support you want</h2>
            <p className="text-xs text-ink-muted">14-day money-back guarantee, for any reason.</p>
          </div>
          <div className="w-full">
            <Pricing />
          </div>
          <TeamsCard />
        </section>

        <SiteFooter />
      </div>
      <StickyJoin />
    </LionArtWhenNear>
  );
}
