"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { tiers, type Plan } from "@/data/pricing";
import { cohort, beforeStart } from "@/data/cohort";
import { challenges } from "@/data/challenges";
import { Confetti } from "@/components/confetti";
import { CheckIcon } from "@/components/icons";
import { hapticTap } from "@/lib/feedback-fx";

// The moment after paying - the thank-you.
//
// Two jobs. First, celebrate: the neon lion roars into the mic in a
// short loop rendered for this page (public/thanks, Higgsfield - the
// look of the book cover, set moving), the seven colours burst across
// the screen once, and the words say what we feel - congratulations,
// we're excited for the journey, we can't wait to hear you. Second, get
// them in: the plan is written to the device straight away, and one
// button goes where a new student goes next - welcome the first time,
// Coach if they were already here and have just upgraded. Stripe emails
// the receipt; the account can wait until they want it on two devices.
//
// `preview` shows the page without a payment and without touching the
// device's record - for looking at it, never for unlocking anything.

const VIDEO = "/thanks/thanks-lion-v1.mp4";
const POSTER = "/thanks/thanks-lion-v1.webp";

export function CheckoutDone({
  plan,
  email,
  preview = false,
}: {
  plan: string;
  email: string | null;
  preview?: boolean;
}) {
  const { state, ready, unlock } = useStore();
  const router = useRouter();
  const [held, setHeld] = useState(false);
  const [still, setStill] = useState(false);
  const applied = useRef(false);
  const tier = tiers.find((t) => t.id === plan);
  // Somebody who already had a level was here before - this was an
  // upgrade, not a first purchase.
  const returning = ready && Boolean(state.level) && !preview;
  const first = challenges.find((c) => !c.passive);

  useEffect(() => {
    if (!ready || applied.current) return;
    applied.current = true;
    if (!preview) unlock(plan as Plan);
    setHeld(true);
  }, [ready, plan, unlock, preview]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once the page is in the browser
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  if (!ready) return null;

  const steps = [
    {
      title: "Find your starting point",
      body: "Choose your level, meet Coach, and record a first take - so you can see exactly how far you travel.",
      accent: "text-mindset border-mindset/40",
    },
    beforeStart()
      ? {
          title: `The cohort starts ${cohort.startShort}`,
          body: `${cohort.startLabel} - the first live session, everyone moving together. The app is open to you right now.`,
          accent: "text-body-language border-body-language/40",
        }
      : {
          title: "Your cohort is under way",
          body: "Jump straight in - the lessons, the challenges and the live sessions are all waiting for you.",
          accent: "text-body-language border-body-language/40",
        },
    {
      title: first
        ? `Your first challenge: ${first.title}`
        : "Your first challenge",
      body: "The first step on the S.T.O.R.Y. road. Coach watches, and tells you what you did well and what to try next.",
      accent: "text-storytelling border-storytelling/40",
    },
  ];

  return (
    <main className="relative flex flex-col items-center gap-10 pb-16">
      {held && <Confetti count={260} duration={6500} />}

      {/* THE ROAR: the lion into the mic, the colours bursting round him. */}
      <div className="relative -mx-4 w-[calc(100%+2rem)] overflow-hidden sm:mx-0 sm:mt-6 sm:w-full sm:max-w-5xl sm:rounded-3xl sm:border sm:border-navy-600">
        <video
          className="aspect-[4/5] w-full object-cover sm:aspect-video"
          src={still ? undefined : VIDEO}
          poster={POSTER}
          autoPlay={!still}
          muted
          loop
          playsInline
          aria-hidden
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy-950 to-transparent"
        />
      </div>

      <div className="-mt-20 flex max-w-3xl flex-col items-center gap-4 px-2 text-center sm:-mt-24">
        <span className="relative inline-flex items-center gap-1.5 rounded-full border border-mindset/50 bg-navy-950/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-mindset backdrop-blur">
          <CheckIcon className="size-3.5" />
          {held ? (preview ? "Preview" : "You're in") : "One moment"}
        </span>
        <h1 className="relative text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-6xl">
          {returning
            ? "Coach is on call now."
            : "Congratulations - welcome to Speak Better."}
        </h1>
        <span className="spectrum-rule block h-1 w-24 rounded-full" />
        <p className="text-lg text-ink-muted text-balance">
          {returning
            ? "For the rest of your six weeks every review is spoken in his voice, and you can ask him anything, any time."
            : "You've just said yes to yourself, and we are so excited for the journey ahead of you. We can't wait to watch you speak better - and become the speaker you've always wanted to be."}
        </p>
        {!returning && tier && (
          <p className="text-sm text-ink-faint">
            {tier.name} · {cohort.accessLabel}
            {plan === "founders" &&
              " · your printed deck is posted to you, and the book follows when it ships"}
          </p>
        )}
      </div>

      {!returning && (
        <section className="flex w-full max-w-4xl flex-col items-center gap-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-ink-faint">
            What happens next
          </p>
          <ol className="grid w-full gap-3 sm:grid-cols-3">
            {steps.map((s, i) => (
              <li
                key={s.title}
                className={`flex flex-col gap-2 rounded-2xl border bg-navy-800/60 p-5 ${s.accent.split(" ")[1]}`}
              >
                <span
                  className={`text-3xl font-bold ${s.accent.split(" ")[0]}`}
                >
                  {i + 1}
                </span>
                <b className="font-semibold text-ink">{s.title}</b>
                <span className="text-sm text-ink-muted">{s.body}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="flex w-full flex-col items-center gap-3">
        <div className="flex w-full justify-center">
          <button
            type="button"
            onClick={() => {
              hapticTap();
              router.push(returning ? "/coach" : "/welcome");
            }}
            className="cta-neon-wrap rounded-xl"
          >
            <span className="cta-neon-glow rounded-xl" aria-hidden />
            <span className="cta-neon block rounded-xl px-9 py-4 text-center text-lg">
              {returning ? "Go and ask him something" : "Let's begin"}
            </span>
          </button>
        </div>
        {email && (
          <p className="text-xs text-ink-faint">
            Your receipt is on its way to {email}.
          </p>
        )}
        <p className="max-w-xs text-center text-xs text-ink-faint text-balance">
          Your work is kept on this device. Make an account whenever you want it
          on your phone as well as here - nothing is lost either way.
        </p>
      </div>
    </main>
  );
}
