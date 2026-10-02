import Link from "next/link";
import Image from "next/image";
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
import { PerfectFor } from "@/components/perfect-for";
import { FoldBackdrop } from "@/components/fold-backdrop";
import { QuoteCycle } from "@/components/quote-cycle";
import {
  LANDING_V_SECTIONS,
  SectionMark,
  SectionNav,
} from "@/components/landing-sections";
import { LessonStack } from "@/components/lesson-stack";
import { LandingTracking } from "@/components/landing-tracking";
import { NeonTracer } from "@/components/neon-tracer";
import { TryChallenge } from "@/components/try-challenge";
import { CheckIcon, ChevronDownIcon } from "@/components/icons";

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
      <NeonTracer />

      {/* The date and the price, held under the top bar the whole way. */}
      <div className="sticky-under-header no-glass -mx-4 -mt-8 border-b border-navy-600 bg-navy-850 px-4 py-2 xl:-mx-8 xl:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-3 text-sm">
          <span className="text-balance">
            <b className="font-semibold text-storytelling">
              Starts {cohort.startShort}
            </b>
            <span className="text-ink-muted">
              {" "}
              · 20 spots · from {FROM_LABEL}
            </span>
          </span>
          <Link
            href="#pricing"
            data-track="strip"
            className="shrink-0 rounded-full bg-figurative px-3 py-1 text-xs font-bold text-navy-950"
          >
            Join
          </Link>
        </div>
      </div>

      {/* The chapters, as dots down the right edge on a laptop. */}
      <SectionNav sections={LANDING_V_SECTIONS} phone={false} />

      <div className="app-glass flex flex-col gap-16 pb-8 pt-4 lg:pt-0">
        {/* THE HERO, the first screen: the promise across the top with
            what's in the course under it, then Tariq's film beside the lion
            and the how. Phone: lion, promise, how, film - stacked. */}
        <section
          id="overview"
          data-landing-section
          className="fold flex flex-col items-center text-center"
        >
          <div className="grid w-full max-w-6xl justify-items-center gap-4 lg:grid-cols-[1.75fr_1fr] lg:gap-x-10 lg:gap-y-3">
            <div className="flex w-full max-w-xs flex-col items-center lg:col-start-2 lg:row-start-2 lg:self-end">
              <HeroLion className="h-28 w-auto sm:h-36" />
              <Soundwave variant="hero" className="-mt-2 h-10 w-full sm:h-12" />
            </div>
            <div className="mb-4 flex flex-col items-center gap-2.5 lg:col-span-2 lg:row-start-1 lg:mb-5">
              <h1 className="text-[1.6rem] font-semibold leading-tight tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]">
                Remove Filler Words And Tell Your Stories More Powerfully On
                Video
              </h1>
              <p className="flex flex-wrap justify-center gap-x-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted sm:text-sm">
                {[
                  "83 Lessons",
                  "25 Challenges",
                  "8 Colors Of Feedback",
                  "An AI Coach",
                  "6 Weeks Live",
                ].map((fact, i) => (
                  <span key={fact} className="whitespace-nowrap">
                    {fact}
                    {i < 4 && <span className="text-ink-faint"> ·</span>}
                  </span>
                ))}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1 lg:col-start-2 lg:row-start-3 lg:self-start">
              <p className="text-lg font-semibold text-ink text-balance sm:text-2xl">
                Become A Natural, Confident Speaker
              </p>
              <p className="neon-underline mt-2 text-xl font-bold tracking-tight text-ink sm:text-2xl">
                In Minutes, Not Months!
              </p>
            </div>
            <div className="w-full max-w-3xl lg:col-start-1 lg:row-span-2 lg:row-start-2 lg:max-w-none">
              <div className="overflow-hidden rounded-2xl border border-navy-600 shadow-2xl shadow-navy-950/80">
                <LazyVimeoPlayer
                  vimeoId="1082011912"
                  title="Speak Better - From Awkward To Awesome In Minutes A Day"
                  poster="/thumbs/1082011047.jpg"
                />
              </div>
              {/* Who's teaching: the name, and the credentials beside it. */}
              <p className="mt-2.5 text-sm text-balance">
                <b className="font-semibold text-ink">Tariq EQ Amawi</b>
                <span className="text-ink-muted">
                  {" "}
                  <span className="text-ink-faint">·</span> TEDx speaker{" "}
                  <span className="text-ink-faint">·</span> Slam poetry winner{" "}
                  <span className="text-ink-faint">·</span> National writing
                  winner
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* WHO IT'S FOR beside one result and the door. Phone: the result
            and the door come first, straight after the film. */}
        <div
          id="for-you"
          data-landing-section
          className="fold fold-marked relative isolate flex flex-col gap-10"
        >
          {/* Faintly, behind it: people talking to their phones. */}
          <FoldBackdrop
            src="/film/bg-for-you.webp"
            still="/film/bg-for-you-v2.jpg"
          />
          <SectionMark
            id="for-you"
            sections={LANDING_V_SECTIONS}
            anchor={false}
          />
          <section className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
            <div className="flex flex-col items-center gap-5 text-center lg:col-start-2 lg:row-start-1">
              {/* Results, before anything else is asked of them. */}
              <QuoteCycle />
              <div data-track="hero">
                <JoinCta
                  label={`Join Speak Better · from ${FROM_LABEL}`}
                  seal
                  sealSize={96}
                />
              </div>
            </div>
            <div className="flex flex-col items-center gap-5 lg:col-start-1 lg:row-start-1">
              <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                This Is For You If&hellip;
              </h2>
              <ul className="grid w-full max-w-2xl gap-2.5 text-left sm:grid-cols-2">
                {[
                  "You get shy or nervous talking on camera",
                  "You use a lot of filler words - the ums and ahs",
                  "You lose your place mid-sentence",
                  "You find it difficult talking to a phone or camera",
                  "You ramble and go off on tangents",
                  "You want to talk about your product or service without sounding salesy",
                  "You want the confidence to go live on your socials",
                  "You want to tell your stories more powerfully",
                ].map((line) => {
                  // The problems get a caution mark - "this is what's going
                  // wrong" - and what they want keeps the green tick.
                  const want = line.startsWith("You want");
                  return (
                    <li
                      key={line}
                      className="flex items-start gap-3 rounded-xl border border-navy-600 bg-navy-900/50 px-4 py-3 text-sm text-ink sm:last:odd:col-span-2 lg:py-4 lg:text-base"
                    >
                      {want ? (
                        <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-mindset/15 text-mindset">
                          <CheckIcon className="size-3" />
                        </span>
                      ) : (
                        <span
                          aria-hidden
                          className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-storytelling text-[0.8rem] font-black leading-none text-navy-950 shadow-[0_0_10px_-2px_var(--color-storytelling)]"
                        >
                          !
                        </span>
                      )}
                      <span className="text-pretty">{line}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        </div>

        {/* And the people it's made for, one at a time. */}
        <div
          id="made-for"
          data-landing-section
          className="fold fold-marked flex flex-col gap-10"
        >
          <SectionMark
            id="made-for"
            sections={LANDING_V_SECTIONS}
            anchor={false}
          />
          <PerfectFor />
        </div>

        {/* B: TRY IT, right here - one challenge, Coach's review and all. */}
        {variant === "b" && (
          <div
            id="try"
            data-landing-section
            className="fold fold-marked flex flex-col gap-10"
          >
            <SectionMark
              id="try"
              sections={LANDING_V_SECTIONS}
              anchor={false}
            />
            <TryChallenge />
          </div>
        )}

        {/* How it works, and what recording yourself looks like. */}
        <div
          id="how"
          data-landing-section
          className="fold fold-marked flex flex-col gap-16 lg:gap-10"
        >
          <SectionMark id="how" sections={LANDING_V_SECTIONS} anchor={false} />
          <HowItWorksSection />
        </div>

        {/* The app on film, four things at a glance: the lessons, the
            deck of cards, the dashboard and a challenge. On a laptop the
            phones grow with the screen's height - as big as the fold
            allows with the heading and captions still on it. */}
        <div
          id="app"
          data-landing-section
          className="fold fold-marked flex flex-col gap-10"
        >
          <SectionMark id="app" sections={LANDING_V_SECTIONS} anchor={false} />
          <section className="flex flex-col items-center gap-6">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              See The App In Action
            </h2>
            <div className="-mx-4 flex w-[calc(100%+2rem)] snap-x snap-mandatory justify-start gap-6 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:w-full lg:justify-center lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
              {[
                {
                  src: "/film/landing-lesson",
                  title: "83 Lessons",
                  line: "1-2 minutes each, in eight colors",
                },
                {
                  src: "/film/landing-deck",
                  title: "Digital Flashcards",
                  line: "Deal a spread - the recipe for a talk",
                },
                {
                  src: "/film/tour-dashboard",
                  title: "Gamified Dashboard",
                  line: "XP, ranks, streaks and trophies",
                },
                {
                  src: "/film/landing-challenge",
                  title: "Interactive Challenges",
                  line: "Record a take - Coach reviews it",
                },
              ].map((f) => (
                <div
                  key={f.src}
                  className="w-52 shrink-0 snap-center lg:w-[min(16.5rem,calc((100svh-370px)/2.12))]"
                >
                  <Phone
                    label={`${f.title} - ${f.line}`}
                    caption={
                      <span className="flex flex-col items-center gap-0.5 text-center">
                        <b className="text-base font-semibold text-ink">
                          {f.title}
                        </b>
                        <span className="text-sm text-ink-muted text-balance">
                          {f.line}
                        </span>
                      </span>
                    }
                  >
                    <PhoneFilm
                      src={`${f.src}.mp4`}
                      poster={`${f.src}.jpg`}
                      label={`${f.title} - ${f.line}`}
                    />
                  </Phone>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Coach, a review of his - and that you can ask him anything. */}
        <SectionMark id="coach" sections={LANDING_V_SECTIONS} />
        <section className="flex w-full flex-col items-center gap-3">
          <CoachDemo />
          <p className="max-w-md text-center text-sm text-ink-muted text-balance">
            And between takes, ask Coach anything about your speaking - he knows
            your record. (Complete and VIP.)
          </p>
          {/* What his reviews fill in, take by take. */}
          <div className="mt-6 flex flex-col items-center gap-3 text-center">
            <h3 className="text-xl font-semibold tracking-tight">
              Your Speaking Spectrum
            </h3>
            <p className="max-w-md text-sm text-ink-muted text-balance">
              Eight color-coded skills, each lighting up as Coach sees you use
              it.
            </p>
            <SpectrumDemo />
          </div>
        </section>

        {/* THE COHORT: Tariq, live, every week - the human half. */}
        <SectionMark id="live" sections={LANDING_V_SECTIONS} />
        <section className="flex flex-col items-center gap-5 text-center">
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              6 Weekly Live Sessions
            </h2>
            <p className="text-sm text-ink-muted">
              With Tariq and your cohort · Saturdays, 11 AM CST · recorded if
              you miss one
            </p>
          </div>
          <LiveRoom />
          <ul className="flex flex-wrap justify-center gap-2 text-sm font-semibold">
            {[
              "Hot seat coaching",
              "Personal refinement",
              "Support along the way",
            ].map((x) => (
              <li
                key={x}
                className="rounded-full border border-navy-600 bg-navy-900/60 px-4 py-1.5 text-ink"
              >
                {x}
              </li>
            ))}
          </ul>
        </section>

        {/* Why practice beats watching. */}
        <HeroBeat />

        {/* The challenges: a course, or a ride - on film, three ways. */}
        <SectionMark id="challenges" sections={LANDING_V_SECTIONS} />
        <section className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            25 Challenges. Take Them As A Course, Or As A Ride.
          </h2>
          <p className="max-w-md text-sm text-ink-muted text-balance">
            Start on the map, like a normal course. Complete challenges to
            unlock 3D, then 4D - the full roller-coaster ride through the
            S.T.O.R.Y. road.
          </p>
          <div className="-mx-4 flex w-[calc(100%+2rem)] snap-x snap-mandatory justify-start gap-5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:w-full sm:justify-center sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
            {[
              { src: "/film/landing-road2d", label: "2D - the map" },
              { src: "/film/landing-road3d", label: "3D - your path, lit" },
              { src: "/film/landing-road4d", label: "4D - the full ride" },
            ].map((f) => (
              <div key={f.src} className="w-48 shrink-0 snap-center">
                <Phone label={f.label}>
                  <PhoneFilm
                    src={`${f.src}.mp4`}
                    poster={`${f.src}.jpg`}
                    label={f.label}
                  />
                </Phone>
              </div>
            ))}
          </div>
          {/* What you earn on the way - how 3D and 4D open, among the rest. */}
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-ink-faint">
            What you earn as you go
          </p>
          <ul className="flex max-w-2xl flex-wrap justify-center gap-2 text-sm">
            {[
              ["XP", "for every lesson and take"],
              ["7 ranks", "First Words to Unforgettable"],
              ["Trophies", "one for every challenge you pass, gold for 90+"],
              ["Streaks", "up to double XP"],
              ["3D and 4D", "unlocked by your progress"],
            ].map(([b, rest]) => (
              <li
                key={b}
                className="rounded-full border border-navy-600 bg-navy-900/60 px-3.5 py-1.5 text-ink-muted"
              >
                <b className="font-semibold text-ink">{b}</b> - {rest}
              </li>
            ))}
          </ul>
        </section>

        {/* The lessons, as the app lists them. */}
        <SectionMark id="lessons" sections={LANDING_V_SECTIONS} />
        <section className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            83 Lessons, 1-2 Minutes Each
          </h2>
          <LessonStack />
        </section>

        <TestimonialStream items={quotes} columns={2} />

        {/* The five questions people ask, folded. */}
        <section className="flex flex-col items-center gap-4">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Questions
          </h2>
          <ul className="flex w-full max-w-xl flex-col gap-2">
            {FAQ.map((f) => (
              <li key={f.q}>
                <details className="group rounded-xl border border-navy-600 bg-navy-900/60">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronDownIcon className="size-4 shrink-0 text-ink-faint transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="px-4 pb-4 text-sm text-ink-muted text-pretty">
                    {f.a}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        </section>

        {/* The prices. */}
        <SectionMark id="pricing" sections={LANDING_V_SECTIONS} />
        <section
          className="flex flex-col items-center gap-5"
          data-track="pricing"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-figurative">
              <span className="size-2 animate-pulse rounded-full bg-figurative" />
              {foundingCohort.headline}
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-balance">
              Three Tiers, By How Much Support You Want
            </h2>
            <p className="text-xs text-ink-muted">
              14-day money-back guarantee, for any reason.
            </p>
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

/** A live session, as it looks: a video call - Tariq in the main tile,
 *  the cohort around him - in a plain call window (no app's branding). */
function LiveRoom() {
  return (
    <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-navy-600 bg-[#0b0f17] shadow-2xl shadow-navy-950/80">
      <div className="flex items-center gap-1.5 border-b border-white/5 px-3 py-2">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-[0.65rem] font-semibold text-ink-faint">
          Speak Better · Live session
        </span>
        <span className="ml-auto flex items-center gap-1 rounded bg-advanced/90 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase text-white">
          <span className="size-1.5 rounded-full bg-white" />
          Live
        </span>
      </div>
      <div className="grid gap-1 p-1 sm:grid-cols-[2fr_3fr]">
        <div className="relative aspect-video overflow-hidden rounded-md sm:aspect-auto">
          <Image
            src="/thumbs/1082011047.jpg"
            alt="Tariq, leading a live session"
            fill
            sizes="(min-width: 640px) 300px, 100vw"
            className="object-cover"
          />
          <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[0.6rem] font-semibold text-white">
            Tariq
          </span>
          <span className="absolute inset-0 rounded-md ring-2 ring-mindset/80" />
        </div>
        {/* The cohort, eight of them, each in their own tile. */}
        <div className="grid grid-cols-4 gap-1">
          {[
            "Amara",
            "Paul",
            "Mei",
            "Tom",
            "Sofia",
            "Marcus",
            "Hannah",
            "Ravi",
          ].map((name, i) => (
            <div
              key={name}
              className="relative aspect-[7/8] overflow-hidden rounded-md"
            >
              <Image
                src={`/landing/cohort-${i + 1}.webp`}
                alt=""
                fill
                sizes="(min-width: 640px) 110px, 25vw"
                className="object-cover"
              />
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[0.5rem] font-semibold text-white">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 border-t border-white/5 py-2 text-[0.6rem] text-ink-faint">
        <span className="rounded-full bg-white/5 px-2.5 py-1">Mic</span>
        <span className="rounded-full bg-white/5 px-2.5 py-1">Camera</span>
        <span className="rounded-full bg-white/5 px-2.5 py-1">Raise hand</span>
        <span className="rounded-full bg-advanced/80 px-2.5 py-1 text-white">
          Leave
        </span>
      </div>
    </div>
  );
}
