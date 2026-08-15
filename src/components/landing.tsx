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
import { CoachDemo } from "@/components/coach-demo";
import { SpectrumDemo } from "@/components/spectrum-demo";

// The landing page (master plan §15): promo video as centerpiece,
// pay-to-unlock, straight into the app. Promo video choice is an open
// question in §18 — the intro video stands in until decided.
// Served to visitors at "/", and to anyone at "/landing" (the preview
// route backed by an ephemeral store — see StoreProvider).

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
        <div className="w-full max-w-2xl">
          {/* Facade poster is a library still of the same instructor — the
              intro video itself is unlisted, so Vimeo offers no poster. */}
          <LazyVimeoPlayer
            vimeoId="1080326796"
            title="Speak Better — Intro"
            poster="/thumbs/1080612884.jpg"
          />
        </div>
        <UnlockButton />
        <PreviewChip />
      </section>

      {/* The method, as a side-by-side: every other course vs this one.
          The left card is deliberately drained of color — the palette
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
                No rehearsal built in — you never actually speak
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
                21 real on-camera challenges — you can&apos;t pass without
                speaking
              </li>
              <li className="flex items-start gap-3">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-body-language" />
                An AI coach watches every attempt — gestures, eye contact,
                story
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
        <h2 className="text-2xl font-semibold tracking-tight text-balance">
          Watch your coach at work
        </h2>
        <p className="max-w-lg text-center text-ink-muted">
          Record a challenge and this is what comes back — in seconds, on every
          attempt, for as many attempts as you want.
        </p>
        <CoachDemo />
      </section>

      {/* The spectrum */}
      <section className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          The spectrum of speaking
        </h2>
        <p className="max-w-lg text-center text-ink-muted">
          Every skill belongs to one of seven colors. The more colors your talk
          lights up, the more dynamic a speaker you&apos;re becoming — this is
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
          Nothing hidden behind the checkout — here is the whole library,
          color by color, exactly as you&apos;ll find it inside.
        </p>
        <LessonGallery />
      </section>

      {/* Why the lion */}
      <section className="flex flex-col items-center gap-6 rounded-2xl border border-navy-600 bg-navy-800 p-6 text-center sm:p-10">
        <Image
          src="/logo-full.png"
          alt="The Speak Better lion, its mane in full color above a soundwave"
          width={430}
          height={410}
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
          in it — and you were never one color.
        </p>
      </section>

      {/* Who's teaching */}
      <section className="flex flex-col gap-5 rounded-2xl border border-navy-600 bg-navy-800 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
        <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-navy-950 sm:w-64">
          {/* A mid-gesture still from the library — the intro video (1080326796)
              has no captured still; its embed won't play headlessly. */}
          <Image
            src="/thumbs/1080612884.jpg"
            alt="Your instructor"
            fill
            sizes="(min-width: 640px) 256px, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Who&apos;s teaching this
          </span>
          <h2 className="text-2xl font-semibold tracking-tight">
            A decade of watching the best, distilled
          </h2>
          <p className="text-sm leading-relaxed text-ink-muted">
            Every lesson here is a tool of the trade — the things nobody taught
            me, picked up over more than a decade of studying the best speakers
            at their craft, and cut down to one or two minutes each. No hour-long
            recordings. No theory you&apos;ll never use. Just the skill, and then
            your turn to try it.
          </p>
        </div>
      </section>

      {/* A mentor in your pocket — the portrait zoom, demonstrated */}
      <section className="flex flex-col items-center gap-8 rounded-2xl border border-navy-600 bg-navy-800 p-6 sm:flex-row sm:justify-center sm:gap-14 sm:p-10">
        {/* The phone. Inside it, the same lesson twice: letterboxed the
            way landscape video normally plays on a phone, then zoomed to
            portrait the way this player can — cycling so the difference
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
            tall screen — close enough to read the hand gestures, the posture,
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

      {/* Pricing / unlock */}
      <section className="flex flex-col items-center gap-4 rounded-2xl border border-navy-600 bg-navy-800 p-8 text-center">
        <div className="spectrum-rule h-1 w-16 rounded-full" />
        <h2 className="text-2xl font-semibold tracking-tight">
          Start speaking better today
        </h2>
        <p className="max-w-md text-sm text-ink-muted">
          One purchase unlocks the full course: every lesson, every challenge,
          and your AI speaking coach. Your first challenge takes minutes.
        </p>
        <UnlockButton />
        <p className="text-xs text-ink-faint">
          Checkout stub — Stripe payment arrives with service integration.
        </p>
      </section>
    </div>
  );
}
