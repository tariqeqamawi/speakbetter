import Image from "next/image";
import {
  GraduationCapIcon,
  SpectrumIcon,
  VideoIcon,
} from "@/components/icons";
import { Soundwave } from "@/components/soundwave";
import { categories } from "@/data/categories";
import { storyPhases } from "@/data/challenges";
import { VimeoPlayer } from "@/components/vimeo-player";
import { UnlockButton } from "@/components/unlock-button";
import { HomeSwitch } from "@/components/home-switch";
import { CoachDemo } from "@/components/coach-demo";
import { SpectrumDemo } from "@/components/spectrum-demo";

// The landing page (master plan §15): promo video as centerpiece,
// pay-to-unlock, straight into the app. Promo video choice is an open
// question in §18 — the intro video stands in until decided.

export default function HomePage() {
  return <HomeSwitch landing={<Landing />} />;
}

function Landing() {
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
          <Soundwave variant="hero" className="-mt-1 h-12 w-full sm:h-16" />
        </div>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          You don&apos;t learn to sing by going to concerts.
        </h1>
        <p className="max-w-xl text-lg text-ink-muted text-balance">
          So why would you learn to speak by watching lectures? Speak Better is
          built on practice: short lessons, real on-camera challenges, and
          feedback in full color.
        </p>
        <div className="w-full max-w-2xl">
          <VimeoPlayer vimeoId="1080326796" title="Speak Better — Intro" />
        </div>
        <UnlockButton />
      </section>

      {/* The method */}
      <section className="flex flex-col gap-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight">
          Practice, not playback
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-xl border border-navy-600 bg-navy-800 p-5">
            <GraduationCapIcon className="size-7 text-body-language" />
            <h3 className="font-semibold">80+ short lessons</h3>
            <p className="text-sm text-ink-muted">
              One to two minutes each, across seven color-coded skill
              categories. Minutes to learn, a lifetime to use.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-navy-600 bg-navy-800 p-5">
            <VideoIcon className="size-7 text-structure" />
            <h3 className="font-semibold">Real on-camera challenges</h3>
            <p className="text-sm text-ink-muted">
              21 challenges across the five-phase STORY journey. You can&apos;t
              pass one without actually speaking.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-navy-600 bg-navy-800 p-5">
            <SpectrumIcon className="size-7 text-mindset" />
            <h3 className="font-semibold">AI coaching in color</h3>
            <p className="text-sm text-ink-muted">
              An AI coach watches your video — gestures, eye contact, story —
              and shows you exactly which colors your talk lit up.
            </p>
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

      {/* Who's teaching */}
      <section className="flex flex-col gap-5 rounded-2xl border border-navy-600 bg-navy-800 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
        <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-navy-950 sm:w-64">
          <Image
            src="/thumbs/1080326796.jpg"
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

      {/* The journey */}
      <section className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Your STORY journey
        </h2>
        <ol className="grid w-full max-w-3xl gap-3 sm:grid-cols-5">
          {storyPhases.map((phase) => (
            <li
              key={phase.id}
              className="flex flex-col items-center gap-1 rounded-xl border border-navy-600 bg-navy-800 p-4 text-center"
            >
              <span className="text-xl font-bold text-ink">{phase.id}</span>
              <span className="text-xs font-medium text-ink-muted">
                {phase.name}
              </span>
            </li>
          ))}
        </ol>
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
