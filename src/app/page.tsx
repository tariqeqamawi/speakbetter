import Image from "next/image";
import { categories } from "@/data/categories";
import { storyPhases } from "@/data/challenges";
import { VimeoPlayer } from "@/components/vimeo-player";
import { UnlockButton, RedirectIfUnlocked } from "@/components/unlock-button";

// The landing page (master plan §15): promo video as centerpiece,
// pay-to-unlock, straight into the app. Promo video choice is an open
// question in §18 — the intro video stands in until decided.

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-16 py-8">
      <RedirectIfUnlocked />

      {/* Hero */}
      <section className="flex flex-col items-center gap-6 text-center">
        <Image
          src="/logo-full.png"
          alt="Speak Better"
          width={432}
          height={420}
          priority
          className="h-28 w-auto sm:h-36"
        />
        <div className="spectrum-rule h-1 w-24 rounded-full" />
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
            <span className="text-2xl">🎓</span>
            <h3 className="font-semibold">80+ short lessons</h3>
            <p className="text-sm text-ink-muted">
              One to two minutes each, across seven color-coded skill
              categories. Minutes to learn, a lifetime to use.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-navy-600 bg-navy-800 p-5">
            <span className="text-2xl">🎥</span>
            <h3 className="font-semibold">Real on-camera challenges</h3>
            <p className="text-sm text-ink-muted">
              21 challenges across the five-phase STORY journey. You can&apos;t
              pass one without actually speaking.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-navy-600 bg-navy-800 p-5">
            <span className="text-2xl">🌈</span>
            <h3 className="font-semibold">AI coaching in color</h3>
            <p className="text-sm text-ink-muted">
              An AI coach watches your video — gestures, eye contact, story —
              and shows you exactly which colors your talk lit up.
            </p>
          </div>
        </div>
      </section>

      {/* The spectrum */}
      <section className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          The spectrum of speaking
        </h2>
        <p className="max-w-lg text-center text-ink-muted">
          Every skill belongs to one of seven colors. The more colors your talk
          lights up, the more dynamic a speaker you&apos;re becoming.
        </p>
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
