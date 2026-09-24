import { CohortDates } from "@/components/cohort-dates";
import Image from "next/image";
import { CheckIcon, ChevronDownIcon, XIcon } from "@/components/icons";
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
import { LandingShowcase } from "@/components/landing-showcase";
import { OriginStory } from "@/components/origin-story";
import { SpectrumDemo } from "@/components/spectrum-demo";
import { HeroBeat } from "@/components/hero-beat";
import { TheReality } from "@/components/the-reality";
import { TestimonialStream } from "@/components/testimonial-stream";
import { ProofLine } from "@/components/proof-line";
import { LionPitch } from "@/components/lion-pitch";
import { LANDING_PITCH, LANDING_PITCH_AUDIO, HEADLINE_AUDIO } from "@/data/welcome-speech";
import { SpeakLine } from "@/components/speak-line";
import { splitForPage } from "@/data/testimonials";
import { WhatItIs } from "@/components/what-it-is";
import { RoarMark } from "@/components/roar-mark";
import { LionMouth } from "@/components/lion-mouth";
import { FirstChallenge } from "@/components/first-challenge";
import { CoachDemo } from "@/components/coach-demo";
import { HowItWorks } from "@/components/how-it-works";

// The landing page (master plan §15): promo video as centerpiece,
// pay-to-unlock, straight into the app. Promo video choice is an open
// question in §18 - the intro video stands in until decided.
// Served to visitors at "/", and to anyone at "/landing" (the preview
// route backed by an ephemeral store - see StoreProvider).

// The confirmed testimonials, split in two rather than repeated - and
// split by a rule that keeps a person who is quoted twice out of the
// same column twice. The flagged ones join them the moment their names
// are checked; see data/testimonials.ts for both.
const [earlyProof, lateProof] = splitForPage();

export function Landing() {
  return (
    <div className="flex flex-col gap-16 py-8">

      {/* Hero */}
      <section className="flex flex-col items-center gap-6 text-center">
        {/* The mark, alive: the lion roars every ten seconds (the brand
            clip, lion and mic only - the wave beneath is the live one),
            and holds still for anyone who asked for less motion. */}
        <div className="flex w-full max-w-md flex-col items-center">
          <RoarMark className="h-44 w-auto sm:h-64 lg:h-72" />
          <Soundwave variant="hero" className="-mt-3 h-16 w-full sm:-mt-4 sm:h-24" />
        </div>

        {/* The promise, in one breath - then the rest in one more. */}
        <div className="flex max-w-2xl flex-col items-center gap-3">
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
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Discover your true colors, speak, and roar on screen or stage.
          </h1>
          <SpeakLine audioSrc={HEADLINE_AUDIO} label="Hear it" />
          <p className="text-xl font-medium text-figurative text-balance sm:text-2xl">
            Six weeks. Master public speaking in minutes a day, not months - and step into your true power on any
            platform.
          </p>
          {/* The dates, high enough that nobody has to hunt for them.
              Two facts, in the order they are asked: when does it
              start, and what happens if I buy right now. */}
          <CohortDates />
          <ul className="flex max-w-xl flex-col gap-3 text-left">
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
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-mindset/15 text-mindset">
                  <CheckIcon className="size-3.5" />
                </span>
                <span className="text-lg text-ink-muted text-balance">{line}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* The premise and its punchline, each with its picture: the
            concert you watch from your seat, the lecture that ticks by. */}
        <HeroBeat />

        {/* Other people, early.
            
            The single most sceptical moment on this page is right
            after the promise - an AI lion that watches your videos is
            a claim, and a claim is the point at which somebody wants
            to know whether anyone else believed it. Half the
            testimonials go here; the other half sit above the price,
            where the decision is actually made. Split rather than
            repeated: the same quote twice reads as the only quote. */}
        <TestimonialStream items={earlyProof} columns={2} />

        {/* The other side of it - said, and then shown. */}
        <TheReality />

        {/* What it is, and what is in it. The second paragraph here used
            to say "master public speaking, overcome fear and shyness in
            minutes rather than months" for the third time on one screen;
            by then the reader has either believed it or stopped
            reading, and repeating it spends trust rather than building
            it. What they have not been told yet is HOW - so that is
            what this says now. */}
        <WhatItIs />
        <div className="flex flex-col items-center gap-2">
          <a href="#try" className="cta-neon-wrap rounded-xl">
            <span className="cta-neon-glow rounded-xl" aria-hidden />
            <span className="cta-neon block rounded-xl px-7 py-3.5 text-sm">Try the first challenge free</span>
          </a>
          <a href="#pricing" className="text-xs font-medium text-ink-faint underline-offset-4 hover:text-ink hover:underline">
            See what&apos;s included
          </a>
        </div>
      </section>

      {/* Coach, in his own voice, before anything else argues for him.
          A claim ABOUT a thing is always weaker than the thing. */}
      <LionPitch line={LANDING_PITCH} audioSrc={LANDING_PITCH_AUDIO} />

      {/* Coach, demonstrated - once, here, where the claim was made.
          
          The five steps first, because "how does this work" is the
          question a visitor has at this point and it answers in five
          seconds. Then the long explanation, folded: it is good copy
          and most readers do not want it, and a page that shows
          everything to everybody is a page nobody finishes. Then the
          thing itself.
          
          This is the ONLY worked review on the page. It used to be
          here and again inside the free first challenge, so a reader
          met the same review twice. */}
      <section className="flex w-full flex-col items-center gap-5">
        {/* "How it works" rather than "Experience your Speak Better
            Coach". The old heading promised an experience and then
            delivered a list, and a reader who has been promised an
            experience reads a list as a let-down. This one says
            exactly what is underneath it. */}
        <h2 className="max-w-2xl text-center text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          How it works
        </h2>

        <HowItWorks />

        <details className="group w-full max-w-2xl rounded-2xl border border-navy-600 bg-navy-800">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
            What Coach looks for, in full
            <ChevronDownIcon className="ml-auto size-4 shrink-0 text-ink-faint transition-transform group-open:rotate-180" />
          </summary>
          <div className="flex flex-col gap-3 px-4 pb-4 text-ink-muted">
            <p>
              You record a challenge and, in a minute or two, Coach the lion watches your video and makes note
              of your hand gestures, your body language, your presence, your confidence, your storytelling,
              your acting, your sensory details and your structure.
            </p>
            <p>
              Then he gives you a detailed breakdown of what you did, what you can improve, and specific notes
              on your spoken and physical delivery. You&apos;ll know whether you passed or missed, and
              you&apos;ll watch your ability grow take by take.
            </p>
          </div>
        </details>

        <CoachDemo />
      </section>

      <ProofLine tag="teacher" />

      {/* The method, as a side-by-side: every other course vs this one.
          The left card is deliberately drained of color - the palette
          belongs to the right card only, so the difference is felt
          before it's read. */}
      <section className="flex flex-col gap-6">
        {/* This comparison was carrying a screen-reader-only heading,
            which meant the single clearest claim on the page - that
            this is a different KIND of thing from what they have
            bought before - was invisible to everybody who can see. */}
        <h2 className="mb-2 max-w-3xl text-center text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          How Speak Better is different to every other speaking course or app on the market
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-2xl border border-navy-600 bg-navy-900/60 p-6 sm:p-7">
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
          <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-navy-500 bg-navy-800 p-6 sm:p-7">
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
                80+ lessons of one to two minutes each
              </li>
              <li className="flex items-start gap-3">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-structure" />
                24 real on-camera challenges - you can&apos;t pass without
                speaking
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
      </section>

      <LandingShowcase />

      {/* The spectrum */}
      <section className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Speaking Spectrum
        </h2>
        <p className="max-w-lg text-center text-ink-muted">
          Every skill belongs to one of seven colors. The more colors your talk lights up, the more dynamic a
          speaker you&apos;re becoming.
        </p>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">Before and after</p>
        <SpectrumDemo />
        <ul className="flex max-w-2xl flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className="flex items-center gap-2 rounded-full border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-muted"
            >
              <span className={`size-2 rounded-full ${cat.bgClass}`} />
              {cat.name}
            </li>
          ))}
        </ul>
      </section>

      <ProofLine tag="lessons" />

      {/* The library, in full */}
      <section className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Preview all 81 skill videos
        </h2>
        <p className="max-w-lg text-center text-ink-muted">
          Nothing hidden behind the checkout - here is the whole library,
          color by color, exactly as you&apos;ll find it inside.
        </p>
        <LessonGallery />
      </section>

      <ProofLine tag="storytelling" />

      {/* The journey */}
      <section className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Your interactive challenges in the S.T.O.R.Y. framework
        </h2>
        <p className="max-w-lg text-center text-ink-muted">
          24 challenges across 5 levels, experienced as an adventure. Unlock trophies, see which challenges
          other students are on, and complete them together.
        </p>
        <div className="w-full max-w-2xl">
          <StoryPreview />
        </div>
      </section>

      {/* The first challenge, shown rather than run. */}
      <FirstChallenge />

      {/* How Speak Better came to be - four moments, zigzagging */}
      <OriginStory />

      {/* Two mentors in your pocket - the coach on one phone, the
          teacher zoomed to portrait on the other */}
      <section className="flex flex-col items-center gap-8 rounded-2xl border border-navy-600 bg-navy-800 p-6 sm:p-10 lg:flex-row lg:justify-center lg:gap-14">
        <div className="flex shrink-0 items-end gap-4 sm:gap-6">
          {/* The lion, as the coach page shows it: large, a line of its
              review beneath in the color of the skill it names. */}
          <div className="relative w-44 shrink-0 rounded-[2.2rem] border-4 border-navy-600 bg-navy-950 p-1.5 shadow-2xl shadow-navy-950 sm:w-52">
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
          <div className="relative w-44 shrink-0 rounded-[2.2rem] border-4 border-navy-600 bg-navy-950 p-1.5 shadow-2xl shadow-navy-950 sm:w-52">
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

        <div className="flex max-w-md flex-col gap-3 text-center lg:text-left">
          <h2 className="text-2xl font-semibold tracking-tight text-balance">
            Two mentors in your pocket
          </h2>
          <p className="text-sm leading-relaxed text-ink-muted">
            One of the ideas behind the app was to give you the experience of having a mentor in your
            pocket. Now you have two! <b className="font-semibold text-ink">Tariq</b> delivers every lesson
            and introduces every challenge. <b className="font-semibold text-ink">Coach, the lion</b>, gives
            you all of your feedback and guides you through the app.
          </p>
          <p className="text-sm leading-relaxed text-ink-muted">
            Every lesson is recorded in the studio in landscape, so you get the full picture on a monitor,
            a TV or a laptop. On your phone there&apos;s a portrait zoom button: one tap and the lesson fills
            the tall screen, close enough to see the hand gestures, the eye contact, and the small details
            a letterboxed strip would shrink away.
          </p>
          <p className="text-xs text-ink-faint">
            Works on every lesson and every challenge video, and the whole app installs to your home screen.
          </p>
        </div>
      </section>

      <ProofLine tag="results" />

      {/* Pricing */}
      <section id="pricing" className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="spectrum-rule h-1 w-16 rounded-full" />
          <TestimonialStream items={lateProof} columns={3} />
          <h2 className="text-2xl font-semibold tracking-tight text-balance">
            Three tiers, based on the amount of support you want
          </h2>
          <p className="max-w-md text-sm text-ink-muted">
            Choose the experience that you most want to have.
          </p>
        </div>
        <div className="w-full">
          <Pricing hideTrial />
        </div>
      </section>
    </div>
  );
}
