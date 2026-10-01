import Link from "next/link";
import { SiteFooter } from "@/components/site/site-footer";
import { TeamsCard } from "@/components/site/teams-card";
import { Soundwave } from "@/components/soundwave";
import { StoryPreview } from "@/components/story-preview";
import { Pricing } from "@/components/pricing";
import { HowItWorksSection } from "@/components/landing-showcase";
import { SpectrumDemo } from "@/components/spectrum-demo";
import { HeroBeat } from "@/components/hero-beat";
import { JoinCta } from "@/components/join-cta";
import { LazyVimeoPlayer } from "@/components/lazy-vimeo-player";
import { foundingCohort } from "@/data/pricing";
import { cohort } from "@/data/cohort";
import { StickyJoin } from "@/components/sticky-join";
import { HeroLion } from "@/components/hero-lion";
import { TestimonialStream } from "@/components/testimonial-stream";
import { proofOf, type Proof } from "@/data/testimonials";
import { LionArtWhenNear } from "@/components/lion-mouth";
import { CoachDemo } from "@/components/coach-demo";
import { SectionMark } from "@/components/landing-sections";
import { LessonStack } from "@/components/lesson-stack";
import { LivePhone } from "@/components/landing";

// THE LANDING PAGE, PARED BACK (served at /landing-test while it's being
// refined): one line of promise, Tariq, and the door - then the thing
// itself shown working, in the order a visitor wants it: how it works and
// what recording yourself looks like, the app, Coach, why practice beats
// watching, the spectrum, the road, the lessons, and the prices. Each
// section says one thing, in as few words as it can.

const PROOF: Proof[] = ["teacher", "lessons", "storytelling", "results"];
const quotes = PROOF.map((tag) => proofOf(tag)[0]).filter(Boolean);

export function LandingTest() {
  return (
    <LionArtWhenNear>
      {/* The date, held under the top bar the whole way down. */}
      {/* (Pulled up over the page's top padding, so it sits flush under the
          top bar from the start, not only once it sticks.) */}
      <div className="sticky-under-header no-glass -mx-4 -mt-8 border-b border-navy-600 bg-navy-850 px-4 py-2 xl:-mx-8 xl:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-3 text-sm">
          <span>
            <b className="font-semibold text-storytelling">Starts {cohort.startShort}</b>
            <span className="text-ink-muted"> · 20 founding spots</span>
          </span>
          <Link href="#pricing" className="rounded-full bg-figurative px-3 py-1 text-xs font-bold text-navy-950">
            Join
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-16 pb-8 pt-4">
        {/* The promise, Tariq, the door. */}
        <section className="flex flex-col items-center gap-4 text-center">
          <div className="flex w-full max-w-xs flex-col items-center">
            <HeroLion className="h-28 w-auto sm:h-36" />
            <Soundwave variant="hero" className="-mt-2 h-10 w-full sm:h-12" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Become confident speaking on video.</h1>
          <div className="w-full max-w-3xl">
            <div className="overflow-hidden rounded-2xl border border-navy-600 shadow-2xl shadow-navy-950/80">
              <LazyVimeoPlayer
                vimeoId="1082011912"
                title="Speak Better - From Awkward To Awesome In Minutes A Day"
                poster="/thumbs/1082011047.jpg"
              />
            </div>
            <p className="mt-2 text-sm font-medium text-ink-muted">From awkward to awesome in minutes a day.</p>
          </div>
          {/* The whole course in one breath - the facts the feature cards
              used to spread over a screen; the page below shows each one
              working. */}
          <p className="text-sm font-semibold text-ink text-balance">
            83 lessons <span className="text-ink-faint">·</span> 25 challenges{" "}
            <span className="text-ink-faint">·</span> 8 colors <span className="text-ink-faint">·</span> an AI coach{" "}
            <span className="text-ink-faint">·</span> 6 weeks
          </p>
          <JoinCta label="Join Speak Better Now" seal sealSize={96} />
        </section>

        {/* How it works, and what recording yourself looks like. */}
        <SectionMark id="how" />
        <HowItWorksSection />

        {/* The app, live. */}
        <section className="flex flex-col items-center gap-5">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">See the app in action</h2>
          <div className="flex flex-wrap items-start justify-center gap-6 sm:gap-10">
            <LivePhone src="/demo/skills/figurative" caption="A lesson" />
            <LivePhone src="/demo/skills/cards" caption="The deck" />
          </div>
        </section>

        {/* Coach, and a review of his. */}
        <SectionMark id="coach" />
        <section className="flex w-full flex-col items-center">
          <CoachDemo />
        </section>

        {/* Why practice beats watching - three pictures, tap through. */}
        <HeroBeat />

        {/* The spectrum. */}
        <section className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">Your Speaking Spectrum</h2>
          <p className="max-w-md text-ink-muted text-balance">
            Eight color-coded skills, each lighting up as Coach sees you use it.
          </p>
          <SpectrumDemo />
        </section>

        {/* The challenges: a course, or a ride. */}
        <SectionMark id="challenges" />
        <section className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            25 challenges. Take them as a course, or as a ride.
          </h2>
          <ul className="flex max-w-md flex-col gap-1.5 text-left text-sm text-ink-muted">
            <li>
              <b className="font-semibold text-ink">2D</b> - a map, like a normal course.
            </li>
            <li>
              <b className="font-semibold text-ink">3D and 4D</b> - an immersive roller-coaster ride through the
              S.T.O.R.Y. road, unlocked as you complete challenges.
            </li>
          </ul>
          <div className="w-full max-w-2xl">
            <StoryPreview />
          </div>
        </section>

        {/* The lessons, as the app lists them. */}
        <SectionMark id="lessons" />
        <section className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">83 lessons, 1-2 minutes each</h2>
          <LessonStack />
        </section>

        <TestimonialStream items={quotes} columns={2} />

        {/* The prices. */}
        <SectionMark id="pricing" />
        <section className="flex flex-col items-center gap-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-figurative">
              <span className="size-2 animate-pulse rounded-full bg-figurative" />
              {foundingCohort.headline}
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-balance">Three tiers, by how much support you want</h2>
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
