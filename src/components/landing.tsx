import { SiteFooter } from "@/components/site/site-footer";
import { TeamsCard } from "@/components/site/teams-card";
import { CohortDates } from "@/components/cohort-dates";
import Image from "next/image";
import { CheckIcon, XIcon } from "@/components/icons";
import { Soundwave } from "@/components/soundwave";
import { categories } from "@/data/categories";
import { StoryPreview } from "@/components/story-preview";
import { LessonGallery } from "@/components/lesson-gallery";
import {
  FullscreenIcon,
  PlayFillIcon,
  SpeedIcon,
  ZoomPortraitIcon,
} from "@/components/player-icons";
import { Pricing } from "@/components/pricing";
import { HowItWorksSection, WhatsInTheApp } from "@/components/landing-showcase";
import { SpectrumDemo } from "@/components/spectrum-demo";
import { HeroBeat } from "@/components/hero-beat";
import { TheReality } from "@/components/the-reality";
import { JoinCta } from "@/components/join-cta";
import { LazyVimeoPlayer } from "@/components/lazy-vimeo-player";
import { foundingCohort } from "@/data/pricing";
import { StickyJoin } from "@/components/sticky-join";
import { HeroLion } from "@/components/hero-lion";
import { TestimonialStream } from "@/components/testimonial-stream";
import { ProofLine } from "@/components/proof-line";
import { Reveal } from "@/components/reveal";
import { delay } from "@/lib/reveal-delay";
import { HEADLINE_AUDIO } from "@/data/welcome-speech";
import { SpeakLine } from "@/components/speak-line";
import { proofOf, splitForPage, type Proof } from "@/data/testimonials";
import { LionArtWhenNear, LionMouth } from "@/components/lion-mouth";
import { FirstChallenge } from "@/components/first-challenge";
import { CoachDemo } from "@/components/coach-demo";
import { SectionMark, SectionNav } from "@/components/landing-sections";
import { ReadMore } from "@/components/read-more";

// The landing page (master plan §15): promo video as centerpiece,
// pay-to-unlock, straight into the app. Promo video choice is an open
// question in §18 - the intro video stands in until decided.
// Served to visitors at "/", and to anyone at "/landing" (the preview
// route backed by an ephemeral store - see StoreProvider).

// The confirmed testimonials, split in two rather than repeated - and
// split by a rule that keeps a person who is quoted twice out of the
// same column twice. The flagged ones join them the moment their names
// are checked; see data/testimonials.ts for both.
// The single quotes between sections are taken out first, so every
// quote on the page appears exactly once.
const PROOF_LINES: Proof[] = ["teacher", "lessons", "storytelling", "results"];
const [earlyProof, lateProof] = splitForPage(PROOF_LINES.map((tag) => proofOf(tag)[0]).filter(Boolean));

export function Landing() {
  // Every lion on this page is a few screens down, so none of them
  // fetches the 540 KB mouth sprite until it is nearly in view.
  return (
    <LionArtWhenNear>
      <LandingBody />
      {/* The chapters, held down the right edge (landing-sections.tsx). */}
      <SectionNav />
      {/* On a phone, the way to the tiers held at the foot of the screen. */}
      <StickyJoin />
    </LionArtWhenNear>
  );
}

function LandingBody() {
  return (
    <div className="flex flex-col gap-16 py-8">
      <SectionMark id="overview" />

      {/* Hero */}
      <section className="flex flex-col items-center gap-6 text-center">
        {/* The mark, alive: the lion roars every ten seconds (the brand
            clip, lion and mic only - the wave beneath is the live one),
            and holds still for anyone who asked for less motion. */}
        {/* On a laptop, two columns: the promise on the left, Tariq on the
            right. On a phone, one column, in the same order. */}
        <div className="grid w-full max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col items-center gap-3 lg:items-start lg:text-left">
        <div className="flex w-full max-w-md flex-col items-center">
          <HeroLion className="h-44 w-auto sm:h-64 lg:h-44" />
          <Soundwave variant="hero" className="-mt-3 h-16 w-full sm:-mt-4 sm:h-24 lg:h-14" />
        </div>

        {/* The promise, in one breath - then the rest in one more. */}
          {/* The cohort is the offer now, so the first line says what
              is being sold: six weeks, dated, with everybody else on
              it - not a course that sits on a shelf. */}
          <span className="rounded-full border border-figurative/50 bg-figurative/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-figurative">
            A guided 6-week experience
          </span>
          {/* The promise, and Coach saying it.
              
              The line is the whole offer, and a promise read is weaker
              than a promise heard - especially this one, which is
              about the sound of somebody's voice. It does not
              autoplay: the words are on screen and the voice is
              offered beside them. */}
          {/* The headline and Coach's button as one block. On a phone the
              button is centred under it; on a laptop, where the column reads
              from the left, it lines up with the left edge of the words. */}
          <div className="flex flex-col items-center gap-3 lg:w-fit lg:items-start">
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[2.7rem] xl:text-5xl">
              <span className="lg:block lg:whitespace-nowrap">Discover your true </span>
              <span className="lg:block lg:whitespace-nowrap">colors, speak, and roar </span>
              <span className="lg:block lg:whitespace-nowrap">on screen or stage.</span>
            </h1>
            <SpeakLine audioSrc={HEADLINE_AUDIO} label="Listen to Coach" channel="hero" />
          </div>
          <p className="text-xl font-medium text-figurative text-balance sm:text-2xl">
            Master public speaking in minutes a day, not months, and step into your true power on any platform.
          </p>
          <p className="text-lg text-ink text-balance sm:text-xl">
            20 founding spots - a special price, in return for your feedback.
          </p>
        </div>
        <div className="w-full">
          {/* Tariq, straight away: from awkward to awesome in minutes a
              day. Plays in place on a tap; nothing loads until then. */}
          <div className="w-full overflow-hidden rounded-2xl border border-navy-600 shadow-2xl shadow-navy-950/80">
            <LazyVimeoPlayer
              vimeoId="1082011912"
              title="Speak Better - From Awkward To Awesome In Minutes A Day"
              poster="/thumbs/1082011047.jpg"
            />
          </div>
          <p className="mt-2 text-center text-sm font-medium text-ink-muted">From awkward to awesome in minutes a day.</p>
        </div>
        </div>

        <div className="flex max-w-2xl flex-col items-center gap-3">
          {/* The dates, high enough that nobody has to hunt for them.
              Two facts, in the order they are asked: when does it
              start, and what happens if I buy right now. */}
          <CohortDates />
          {/* The ticks arrive one after another once the visitor starts to
              scroll. */}
          <Reveal as="ul" afterScroll className="flex max-w-xl flex-col gap-3 text-left">
            {[
              <>Overcome fears, nerves and shyness in a fully gamified, interactive app.</>,
              <>
                Watch short <strong className="font-semibold text-ink">1-2 minute</strong> skills videos.
              </>,
              <>
                Upload <strong className="font-semibold text-ink">1-2 minute</strong> challenges.
              </>,
              <>Receive detailed feedback on your spoken delivery and physical expression.</>,
              <>
                Now you don&apos;t only get to learn; you get to{" "}
                <strong className="font-semibold text-ink">practice</strong>, from the comfort of your phone.
              </>,
            ].map((line, i) => (
              <li key={i} className="rv flex items-start gap-3" style={delay(i * 160)}>
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-mindset/15 text-mindset">
                  <CheckIcon className="size-3.5" />
                </span>
                <span className="text-lg text-ink-muted text-balance">{line}</span>
              </li>
            ))}
          </Reveal>
        </div>


        {/* The opening is only the promise, the video, the dates and
            what you do - then the door. The testimonials sit after Coach
            has been shown (proof after the claim), the concert line opens
            "Why it's different", and what's in the box moved to "Inside
            the app". */}
        <JoinCta label="Join Speak Better Now" seal />
      </section>

      <SectionMark id="coach" />

      {/* Coach, demonstrated - once, here, where the claim was made.
          
          The review card is the whole explanation: what he looks for
          is shown working, so it isn't also described. The five steps
          of how it works live in "Inside the app" (landing-showcase.tsx).
          
          This is the ONLY worked review on the page. It used to be
          here and again inside the challenge preview, so a reader
          met the same review twice. */}
      <section className="flex w-full flex-col items-center gap-5">
        <CoachDemo />
        <JoinCta label="Start My Speaking Journey" price />
      </section>

      {/* Other people, once Coach has been seen working: the moment a
          reader wants to know whether anyone else believed it. Half the
          quotes here, the other half above the prices - never the same
          one twice. */}
      <TestimonialStream items={earlyProof} columns={2} />

      <SectionMark id="different" />

      {/* The inspiration first: the reality waiting on the other side -
          then why the way there is different. */}
      <TheReality />

      {/* The premise and its punchline, each with its picture: the
          concert you watch from your seat, the lecture that ticks by. */}
      <HeroBeat />

      {/* The method, as a side-by-side: every other course vs this one.
          The left card is deliberately drained of color - the palette
          belongs to the right card only, so the difference is felt
          before it's read. */}
      <Reveal as="section" className="flex flex-col gap-6">
        {/* One blue-glass container for the claim that sets Speak Better
            apart: Tariq saying it on video, the heading, the words, and the
            Speaking Spectrum itself - the thing no other course or app has.
            The comparison cards follow it as the proof. */}
        <div className="rv blue-glass mx-auto flex w-full max-w-4xl flex-col items-center gap-6 rounded-3xl p-5 sm:p-8">
          {/* Tariq saying it: this is not just another online course. */}
          <div className="w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-navy-950/80">
            <LazyVimeoPlayer
              vimeoId="1082012628"
              title="Speak Better - It's Not Just Another Online Course"
              poster="/thumbs/1081197526.jpg"
            />
          </div>
          <h2 className="max-w-3xl text-center text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Speak Better&apos;s Speaking Spectrum makes it unlike any other course or app on the market
          </h2>
          <p className="-mt-2 max-w-2xl text-center text-lg text-ink-muted text-balance sm:text-xl">
            Other speaking apps give you generic advice, even the ones <em>with</em> AI coaching. Speak Better shows
            your speaking across seven key areas, color-coded, each one lighting up as you demonstrate its skills.
            It&apos;s unlike anything out there.
          </p>
          <span className="spectrum-rule h-1 w-16 rounded-full" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">Before and after</p>
          <SpectrumDemo />
          <ul className="flex max-w-2xl flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="flex items-center gap-2 rounded-full border border-navy-600 bg-navy-900/70 px-3 py-1.5 text-sm text-ink-muted"
              >
                <span className={`size-2 rounded-full ${cat.bgClass}`} />
                {cat.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rv flex flex-col gap-4 rounded-2xl border border-navy-600 bg-navy-900/60 p-6 sm:p-7" style={delay(300)}>
            <div className="relative -mx-2 -mt-2 aspect-[3/2] overflow-hidden rounded-xl">
              <Image
                src="/compare/watch-passively.jpg"
                alt="Slumped on a couch at night, passively watching a lecture on a laptop"
                fill
                sizes="(min-width: 640px) 480px, 100vw"
                className="object-cover"
              />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Most speaking courses
            </span>
            <h3 className="text-2xl font-semibold tracking-tight text-ink-muted">
              You watch. Passively.
            </h3>
            <ul className="flex flex-col gap-3 text-sm text-ink-faint">
              <li className="flex items-start gap-3">
                <XIcon className="mt-0.5 size-4 shrink-0" />
                Hours of lectures to sit through
              </li>
              <li className="flex items-start gap-3">
                <XIcon className="mt-0.5 size-4 shrink-0" />
                No rehearsal built in - you never actually speak
              </li>
              <li className="flex items-start gap-3">
                <XIcon className="mt-0.5 size-4 shrink-0" />
                No feedback on your own attempt
              </li>
              <li className="flex items-start gap-3">
                <XIcon className="mt-0.5 size-4 shrink-0" />
                Weeks later, it&apos;s memory or nothing
              </li>
            </ul>
          </div>
          <div className="rv relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-navy-500 bg-navy-800 p-6 sm:p-7" style={delay(480)}>
            <div className="spectrum-rule absolute inset-x-0 top-0 h-1" />
            <div className="relative -mx-2 mt-1 aspect-[3/2] overflow-hidden rounded-xl">
              <Image
                src="/compare/practice-actively.jpg"
                alt="Standing and gesturing mid-speech, recording a practice video on a phone mounted on a tripod"
                fill
                sizes="(min-width: 640px) 480px, 100vw"
                className="object-cover"
              />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Speak Better
            </span>
            <h3 className="text-2xl font-semibold tracking-tight">
              You practice. Actively.
            </h3>
            <ul className="flex flex-col gap-3 text-sm text-ink">
              <li className="flex items-start gap-3">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-storytelling" />
                83 skill lessons of one to two minutes each
              </li>
              <li className="flex items-start gap-3">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-structure" />
                24 real challenges, most of them on camera
              </li>
              <li className="flex items-start gap-3">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-body-language" />
                A fully interactive AI coach, trained on the Speak Better system,
                watches every take - body language, gesture, eye contact, voice -
                and gives you detailed feedback on your specific performance and
                delivery
              </li>
              <li className="flex items-start gap-3">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-mindset" />
                True interactive feedback on your physical and spoken performance, minutes after you try
              </li>
            </ul>
          </div>
        </div>
      </Reveal>

      {/* Someone who got results, standing on their own after the
          comparison - not beside a wall of other quotes. */}
      <ProofLine tag="results" />

      <SectionMark id="how" />
      <HowItWorksSection />

      <SectionMark id="app" />
      <WhatsInTheApp />

      <ProofLine tag="lessons" />

      <SectionMark id="lessons" />
      {/* The library, in full */}
      <section className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Preview all 83 skill lessons
        </h2>
        <p className="max-w-lg text-center text-ink-muted">
          Here is a preview of the full library of skills you are about to unlock, color-coded and waiting for
          you.
        </p>
        <LessonGallery />
      </section>

      <ProofLine tag="storytelling" />

      <SectionMark id="challenges" />
      {/* The journey */}
      <section className="flex flex-col items-center gap-4">
        <h2 className="max-w-2xl text-center text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          Introducing true interactive challenges
        </h2>
        <ul className="flex max-w-xl flex-col gap-2 text-left">
          {[
            <>
              <b className="font-semibold text-ink">The Speak Better S.T.O.R.Y. framework:</b> 24 challenges across 5
              levels, experienced as an adventure.
            </>,
            <>Unlock trophies.</>,
            <>See which challenges other students are on, and complete them together.</>,
          ].map((line, i) => (
            <li key={i} className="flex items-start gap-3 text-ink-muted">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-structure/15 text-structure">
                <CheckIcon className="size-3.5" />
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        {/* The road, live, with its own 2D/3D switch - the one place on
            the page it's shown. */}
        <div className="w-full max-w-2xl">
          <StoryPreview />
        </div>
      </section>

      {/* The first challenge, shown rather than run. */}
      <FirstChallenge />

      <SectionMark id="mentors" />
      {/* What students say about the teacher, before the two mentors. */}
      <ProofLine tag="teacher" />
      {/* Two mentors in your pocket - the coach on one phone, the
          teacher zoomed to portrait on the other */}
      {/* One phone arrives, the second slides out from under it, then the
          words. */}
      <Reveal as="section" threshold={0.35} className="flex flex-col items-center gap-8 rounded-2xl border border-navy-600 bg-navy-800 p-6 sm:p-10 lg:flex-row lg:justify-center lg:gap-14">
        <div className="flex shrink-0 items-end gap-4 sm:gap-6">
          {/* The lion, as the coach page shows it: large, a line of its
              review beneath in the color of the skill it names. */}
          <div className="rv relative z-10 w-44 shrink-0 rounded-[2.2rem] border-4 border-navy-600 bg-navy-950 p-1.5 shadow-2xl shadow-navy-950 sm:w-52">
            <span className="absolute left-1/2 top-3 z-10 h-1.5 w-14 -translate-x-1/2 rounded-full bg-navy-700" />
            <div className="relative flex aspect-[9/19] flex-col items-center justify-center gap-3 overflow-hidden rounded-[1.8rem] bg-navy-950 px-3">
              <span className="absolute inset-x-0 top-6 text-center text-[0.55rem] font-semibold uppercase tracking-wider text-advanced">
                Your coach
              </span>
              <LionMouth level={0} className="w-[82%]" />
              <p className="text-center text-[0.7rem] leading-snug text-ink">
                Your hands drew the loaf - <span className="font-semibold text-body-language">the gesture</span> was
                doing the describing with you.
              </p>
              <span className="absolute inset-x-3 bottom-3 flex items-center justify-center gap-1.5 rounded-full border border-advanced/50 bg-navy-900 py-1.5 text-[0.6rem] font-semibold text-advanced">
                <PlayFillIcon className="size-2.5" />
                Listen to your coach
              </span>
            </div>
          </div>
          {/* The teacher, zoomed to portrait, the zoom button lit. */}
          <div className="mentor-slide relative z-0 w-44 shrink-0 rounded-[2.2rem] border-4 border-navy-600 bg-navy-950 p-1.5 shadow-2xl shadow-navy-950 sm:w-52">
            <span className="absolute left-1/2 top-3 z-10 h-1.5 w-14 -translate-x-1/2 rounded-full bg-navy-700" />
            <div className="relative aspect-[9/19] overflow-hidden rounded-[1.8rem] bg-navy-950">
              <Image
                src="/thumbs/1080612884.jpg"
                alt="Tariq, teaching a lesson, zoomed to fill a phone held upright"
                fill
                sizes="208px"
                className="scale-[1.15] object-cover object-[50%_30%]"
              />
              <span className="absolute inset-x-0 top-6 text-center text-[0.55rem] font-semibold uppercase tracking-wider text-body-language">
                Zoomed to portrait
              </span>
              <span className="absolute inset-x-2 bottom-2 z-10 flex flex-col gap-1.5 rounded-xl border border-navy-600 bg-navy-900/90 p-2">
                <span className="spectrum-rule h-0.5 w-full rounded-full opacity-70" />
                <span className="flex items-center justify-between px-1 text-ink-muted">
                  <PlayFillIcon className="size-3.5" />
                  <SpeedIcon className="size-3.5" />
                  <span className="rounded-md bg-navy-700 p-1 text-body-language ring-1 ring-body-language/50">
                    <ZoomPortraitIcon className="size-3.5" />
                  </span>
                  <FullscreenIcon className="size-3.5" />
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="rv flex max-w-md flex-col gap-3 text-center lg:text-left" style={delay(1250)}>
          <h2 className="text-2xl font-semibold tracking-tight text-balance">
            Two mentors in your pocket
          </h2>
          <p className="text-sm leading-relaxed text-ink-muted">
            Speak Better embraces the best of both human and AI capability. All 24 challenges and 83 skill lessons
            have been studio-recorded by <b className="font-semibold text-ink">Tariq</b>, a real human.{" "}
            <b className="font-semibold text-ink">Coach, the lion</b>, reviews all of your challenges, pops up along the
            way with encouragement or words of wisdom, guides you through each section, and is there whenever you need
            him.
          </p>
          <ReadMore lines={2} className="text-sm leading-relaxed text-ink-muted" buttonClassName="self-center lg:self-start">
            Every lesson is recorded in the studio in landscape, so you get the full picture on a monitor, a TV or a
            laptop. On your phone there&apos;s a portrait zoom button: one tap and the lesson fills the tall screen,
            close enough to see the hand gestures, the eye contact, and the small details a letterboxed strip would
            shrink away.
          </ReadMore>
          <p className="text-xs text-ink-faint">
            Works on every lesson and every challenge video, and the whole app installs to your home screen.
          </p>
        </div>
      </Reveal>

      <JoinCta label="Sign Me Up" seal sealSize={176} />

      <SectionMark id="pricing" />
      {/* Pricing - the chapter mark carries the #pricing anchor every
          Join button points at. */}
      <section className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="spectrum-rule h-1 w-16 rounded-full" />
          <TestimonialStream items={lateProof} columns={3} />
          {/* The founding cohort: few places, and priced below what comes
              after it. */}
          <div className="flex max-w-xl flex-col items-center gap-2 rounded-2xl border border-figurative/50 bg-figurative/10 px-5 py-4">
            <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-figurative">
              <span className="size-2 animate-pulse rounded-full bg-figurative" />
              {foundingCohort.headline}
            </span>
            {/* Why it's priced as it is - there for whoever asks, folded
                so the prices below stay in view. */}
            <ReadMore lines={2} className="text-sm text-ink-muted text-balance" buttonClassName="self-center">
              {foundingCohort.line}
            </ReadMore>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-balance">
            Three tiers, based on the amount of support you want
          </h2>
          <p className="max-w-md text-sm text-ink-muted">
            Choose the experience that you most want to have.
          </p>
        </div>
        <div className="w-full">
          <Pricing />
        </div>
        {/* A fourth way in, for a whole team: not a price, a conversation. */}
        <TeamsCard />
      </section>

      <SiteFooter />
    </div>
  );
}
