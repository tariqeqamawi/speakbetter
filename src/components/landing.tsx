import Image from "next/image";
import { CheckIcon, XIcon } from "@/components/icons";
import { Soundwave } from "@/components/soundwave";
import { categories } from "@/data/categories";
import { StoryPreview } from "@/components/story-preview";
import { LessonGallery } from "@/components/lesson-gallery";
import { LazyVimeoPlayer } from "@/components/lazy-vimeo-player";
import { PreviewChip } from "@/components/preview-chip";
import {
  FullscreenIcon,
  PlayFillIcon,
  SpeedIcon,
  ZoomPortraitIcon,
} from "@/components/player-icons";
import { UnlockButton } from "@/components/unlock-button";
import { Pricing } from "@/components/pricing";
import { LandingShowcase } from "@/components/landing-showcase";
import Link from "next/link";
import { CoachDemo } from "@/components/coach-demo";
import { SpectrumDemo } from "@/components/spectrum-demo";

// The landing page (master plan §15): promo video as centerpiece,
// pay-to-unlock, straight into the app. Promo video choice is an open
// question in §18 - the intro video stands in until decided.
// Served to visitors at "/", and to anyone at "/landing" (the preview
// route backed by an ephemeral store - see StoreProvider).

export function Landing() {
  return (
    <div className="flex flex-col gap-16 py-8">

      {/* Hero */}
      <section className="flex flex-col items-center gap-6 text-center">
        {/* The mark, with its soundwave alive rather than printed */}
        <div className="flex w-full max-w-md flex-col items-center">
          <Image
            src="/logo-mark.png"
            alt="Speak Better"
            width={320}
            height={256}
            priority
            className="h-24 w-auto sm:h-32"
          />
          <Soundwave variant="hero" className="-mt-1 h-16 w-full sm:h-24" />
        </div>
        {/* The manifesto, before the line - who this is for, and what's
            on the other side of it. */}
        <div className="flex max-w-2xl flex-col items-center gap-3">
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.35em] text-figurative">
            Step into your true colors
          </span>
          <p className="text-xl font-medium leading-snug text-ink text-balance sm:text-2xl">
            There&apos;s a lion waiting to roar. That&apos;s you in your fullest expression - no fear, no
            hesitation, full confidence, and the ability to deliver at a level of mastery with no notes
            and no notice.
          </p>
          <p className="text-lg text-ink-muted text-balance">
            That is what&apos;s waiting on the other side of Speak Better: a new system for mastering public
            speaking, unlike anything you&apos;ve tried before. Overcome fear and shyness in minutes rather
            than months, in a fully gamified, interactive app - short lessons from one teacher, on-camera
            challenges, and a coach who watches every take.
          </p>
        </div>
        <h1 className="grid max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          <span className="hero-line hero-line-first">
            You don&apos;t learn to sing by going to concerts.
          </span>
          <span className="hero-line hero-line-second">
            So you won&apos;t become a speaker by only watching videos.
          </span>
        </h1>
        <p className="max-w-xl text-lg text-ink-muted text-balance">
          Speak Better is built on practice: short lessons, real on-camera
          challenges, and feedback in full color.
        </p>
        {/* The value, counted - what's in the box, before the box is
            opened below. */}
        <ul className="flex flex-wrap items-center justify-center gap-2">
          {[
            { n: "81", label: "nano lessons", color: "text-storytelling" },
            { n: "24", label: "interactive challenges", color: "text-structure" },
            { n: "79", label: "cards in the digital deck", color: "text-figurative" },
            { n: "1", label: "AI coach trained on the method", color: "text-advanced" },
            { n: "7", label: "colors of speaking to light up", color: "text-mindset" },
          ].map((v) => (
            <li
              key={v.label}
              className="flex items-baseline gap-1.5 rounded-full border border-navy-600 bg-navy-800/70 px-3.5 py-1.5"
            >
              <span className={`text-base font-bold tabular-nums ${v.color}`}>{v.n}</span>
              <span className="text-xs font-medium text-ink-muted">{v.label}</span>
            </li>
          ))}
          <li className="px-2 text-xs font-medium text-ink-faint">…and the trophies, ranks, streaks and board to go with them</li>
        </ul>
        <div className="w-full max-w-2xl">
          {/* Facade poster is a library still of the same instructor - the
              intro video itself is unlisted, so Vimeo offers no poster. */}
          <LazyVimeoPlayer
            vimeoId="1080326796"
            title="Speak Better - Intro"
            poster="/thumbs/1080612884.jpg"
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <UnlockButton plan="trial">Start with the free baseline</UnlockButton>
          <a href="#pricing" className="text-xs font-medium text-ink-faint underline-offset-4 hover:text-ink hover:underline">
            See what&apos;s included
          </a>
        </div>
        <PreviewChip />
      </section>

      {/* The method, as a side-by-side: every other course vs this one.
          The left card is deliberately drained of color - the palette
          belongs to the right card only, so the difference is felt
          before it's read. */}
      <section className="flex flex-col gap-6">
        <h2 className="sr-only">Practice, not playback</h2>
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
                Feedback in full color, minutes after you try
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* The coach, actually coaching */}
      <section className="flex flex-col items-center gap-4">
        <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Experience your Speak Better coach now
        </h2>
        <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
          <p className="text-lg text-ink-muted text-balance">
            The whole Speak Better system is built on this. How do you teach a methodology this effective at scale?
            With a competent AI coach trained on the methodology itself.
          </p>
          <p className="text-ink-muted text-balance">
            Record a challenge and, in a minute or two, your coach - the lion - watches your video and makes note of:
          </p>
          <ul className="flex flex-wrap justify-center gap-2">
            {[
              ["your hand gestures", "text-body-language"],
              ["your body language", "text-body-language"],
              ["your eye contact", "text-body-language"],
              ["your storytelling", "text-storytelling"],
              ["your figurative language", "text-figurative"],
              ["your acting", "text-acting"],
              ["your energy", "text-acting"],
              ["your tone of voice", "text-acting"],
            ].map(([label, color]) => (
              <li
                key={label}
                className={`rounded-full border border-navy-600 bg-navy-800/70 px-3 py-1 text-xs font-semibold ${color}`}
              >
                {label}
              </li>
            ))}
          </ul>
          <p className="text-ink-muted text-balance">
            Then it gives you a detailed breakdown of how you did against the lessons in the course, and specific
            notes on your performance. You&apos;ll know whether you passed or missed, what to improve next time, and
            you&apos;ll watch your ability grow, take by take.
          </p>
        </div>
        <CoachDemo />
      </section>

      <LandingShowcase />

      {/* The spectrum */}
      <section className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          The spectrum of speaking
        </h2>
        <p className="max-w-lg text-center text-ink-muted">
          Every skill belongs to one of seven colors. The more colors your talk
          lights up, the more dynamic a speaker you&apos;re becoming - this is
          the same speaker, before and after.
        </p>
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

      {/* The library, in full */}
      <section className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Every lesson in the course
        </h2>
        <p className="max-w-lg text-center text-ink-muted">
          Nothing hidden behind the checkout - here is the whole library,
          color by color, exactly as you&apos;ll find it inside.
        </p>
        <LessonGallery />
      </section>

      {/* Why the lion */}
      <section className="flex flex-col items-center gap-6 rounded-2xl border border-navy-600 bg-navy-800 p-6 text-center sm:p-10">
        <Image
          src="/logo-full.png"
          alt="The Speak Better lion, its mane in full color above a soundwave"
          width={1000}
          height={972}
          className="h-40 w-auto sm:h-52"
        />
        <blockquote className="max-w-xl text-xl font-semibold leading-relaxed text-balance sm:text-2xl">
          Fear and falsity ring flat. Step into your full expression, and your
          true colors roar.
        </blockquote>
        <p className="max-w-lg text-sm leading-relaxed text-ink-muted">
          That&apos;s the whole ethos behind the mark. The lion is the voice
          that stopped apologizing for itself; the mane is every color of
          speaking you have in you, all of it showing at once; the wave beneath
          is the sound it makes in a room. A flat talk is a mane with one color
          in it - and you were never one color.
        </p>
      </section>

      {/* Who's teaching */}
      <section className="flex flex-col gap-5 rounded-2xl border border-navy-600 bg-navy-800 p-6 sm:flex-row sm:items-start sm:gap-8 sm:p-8">
        <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden rounded-xl bg-navy-950 sm:sticky sm:top-24 sm:w-72">
          {/* A mid-gesture still from the library - the intro video (1080326796)
              has no captured still; its embed won't play headlessly. */}
          <Image
            src="/thumbs/1080612884.jpg"
            alt="Your instructor"
            fill
            sizes="(min-width: 640px) 256px, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Who&apos;s teaching this
          </span>
          <h2 className="text-2xl font-semibold tracking-tight">How Speak Better came to be</h2>
          <div className="flex flex-col gap-3 text-sm leading-relaxed text-ink-muted">
            <p>
              Tariq&apos;s very first public speech was a TEDx talk, in 2011. After diving deep into what made
              the most memorable speeches so memorable, he built his talk out of stories, poetic turns of
              phrase, mic-drop moments, and a moral worth keeping - and it went on to gather more than ten
              times the views of every other talk at the conference.
            </p>
            <p>
              Then people started writing. <em>I watched your talk and quit my job. I watched your talk and
              bought a plane ticket. I watched your talk and proposed.</em> That was when Tariq understood
              what speaking is: not something you listen to, but something you experience - a transformation
              - and he set out to deepen the craft and teach others to do on stage what he had done.
            </p>
            <p>
              The result: hundreds of students going from shy and nervous on camera to speaking confidently
              and competently within weeks - starting podcasts, getting booked to speak. He has helped others
              to standing ovations, and has been the speechwriter behind talks given to rooms of eight
              thousand. He is the coach people trust to get them ready for the stage, and he is passionate
              about helping others unlock the superpower that changed his life.
            </p>
            <p>
              After running live cohort after live cohort, giving feedback on every take, the Speak Better
              methodology was born. Now, thanks to what technology makes possible, Tariq has trained an AI coach
              on that methodology so he can serve many. Welcome to the fastest, most effective way to master
              public speaking - for the stage, or for the screen.
            </p>
          </div>
        </div>
      </section>

      {/* A mentor in your pocket - the portrait zoom, demonstrated */}
      <section className="flex flex-col items-center gap-8 rounded-2xl border border-navy-600 bg-navy-800 p-6 sm:flex-row sm:justify-center sm:gap-14 sm:p-10">
        {/* The phone. Inside it, the same lesson twice: letterboxed the
            way landscape video normally plays on a phone, then zoomed to
            portrait the way this player can - cycling so the difference
            demonstrates itself. */}
        <div className="relative w-52 shrink-0 rounded-[2.5rem] border-4 border-navy-600 bg-navy-950 p-1.5 shadow-2xl shadow-navy-950">
          <span className="absolute left-1/2 top-3 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-navy-700" />
          <div className="relative aspect-[9/19] overflow-hidden rounded-[2rem] bg-navy-950">
            {/* letterboxed */}
            <span className="pz-a absolute inset-0 flex items-center">
              <span className="relative aspect-video w-full">
                <Image
                  src="/thumbs/1080612884.jpg"
                  alt=""
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              </span>
              <span className="absolute inset-x-0 top-6 text-center text-[0.55rem] uppercase tracking-wider text-ink-faint">
                Landscape on a phone
              </span>
            </span>
            {/* zoomed to portrait */}
            <span className="pz-b absolute inset-0">
              <Image
                src="/thumbs/1080612884.jpg"
                alt=""
                fill
                sizes="200px"
                className="scale-[1.15] object-cover"
              />
              <span className="absolute inset-x-0 top-6 text-center text-[0.55rem] font-semibold uppercase tracking-wider text-body-language">
                Zoomed to portrait
              </span>
            </span>

            {/* the player's own controls, portrait zoom lit */}
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

        <div className="flex max-w-md flex-col gap-3 text-center sm:text-left">
          <h2 className="text-2xl font-semibold tracking-tight text-balance">
            A mentor in your pocket
          </h2>
          <p className="text-sm leading-relaxed text-ink-muted">
            The lessons are filmed in landscape, but life happens in portrait.
            One tap on the zoom control and the coach fills your phone&apos;s
            tall screen - close enough to read the hand gestures, the posture,
            the eye contact that a letterboxed strip would shrink away. A
            course that teaches physical expression has to make physical
            expression easy to <em>see</em>, on the device you actually carry.
          </p>
          <p className="text-xs text-ink-faint">
            Works on every lesson and every challenge video, and the whole app
            installs to your home screen.
          </p>
        </div>
      </section>

      {/* The journey */}
      <section className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Your STORY journey
        </h2>
        <p className="max-w-lg text-center text-ink-muted">
          Twenty-one challenges across five phases. Hover a letter to see
          exactly what you&apos;ll be asked to do.
        </p>
        <StoryPreview />
      </section>

      {/* Pricing */}
      <section id="pricing" className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="spectrum-rule h-1 w-16 rounded-full" />
          <h2 className="text-2xl font-semibold tracking-tight">Start free. Keep the method. Add the coach.</h2>
          <p className="max-w-md text-sm text-ink-muted">
            Record your baseline for nothing and get one real review. Then choose how far to take it.
          </p>
        </div>
        <div className="w-full">
          <Pricing />
        </div>
        <Link href="/pricing" className="text-xs font-semibold text-ink-muted underline-offset-4 hover:text-ink hover:underline">
          Compare the tiers in full →
        </Link>
      </section>
    </div>
  );
}
