"use client";

import { upgradeOffer } from "@/data/pricing";
import { UnlockButton } from "@/components/unlock-button";
import { LionMouth } from "@/components/lion-mouth";
import { ListenIcon, SpectrumIcon, ZapIcon } from "@/components/icons";

// What a Starter student sees where Coach's page would be.
//
// Not a locked door. Coach is standing right there, and the three
// lines under him are the three things they are not getting - said as
// what they are, not as what is withheld. The price is the difference
// between what they paid and the Full Experience, so the number on the
// button is small and true: two hundred dollars, not five hundred.
//
// Their written reviews keep working exactly as before while they
// decide. Nothing they have already bought is taken away to make this
// look better.

const MISSING = [
  {
    Icon: ListenIcon,
    color: "text-acting",
    title: "Every review, spoken",
    body: "The same review you already get, said aloud in his voice, with the words coming up as he says them.",
  },
  {
    Icon: ZapIcon,
    color: "text-structure",
    title: "Coach on call, 24/7",
    body: "Ask him anything - how you're developing, what to work on, what he noticed last time - and he answers from your own record.",
  },
  {
    Icon: SpectrumIcon,
    color: "text-figurative",
    title: "Your progress, read back",
    body: "He compares this take with the eight before it and tells you what has changed, with the numbers.",
  },
];

export function CoachUpgrade() {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col items-center gap-5 py-2">
      <LionMouth level={0} className="w-40 shrink-0" />

      <h1 className="text-center text-2xl font-bold leading-tight tracking-tight text-ink text-balance">
        {upgradeOffer.title}
      </h1>
      <p className="text-center text-sm text-ink-muted text-balance">{upgradeOffer.body}</p>

      <ul className="flex w-full flex-col gap-2">
        {MISSING.map(({ Icon, color, title, body }) => (
          <li key={title} className="flex items-start gap-3 rounded-xl border border-navy-600 bg-navy-800 p-3.5">
            <span className={`grid size-9 shrink-0 place-items-center rounded-full border border-current ${color}`}>
              <Icon className="size-4.5" />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-semibold text-ink">{title}</span>
              <span className="text-xs leading-snug text-ink-muted">{body}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="flex w-full flex-col items-center gap-1.5">
        <UnlockButton plan="coached" upgrade className="w-full max-w-xs">
          {upgradeOffer.cta}
        </UnlockButton>
        <span className="text-xs font-medium text-ink-faint">{upgradeOffer.term}</span>
      </div>

      <p className="text-center text-xs text-ink-faint text-balance">
        One payment, and it&apos;s the difference only - you&apos;re not charged twice. Everything you&apos;ve already
        recorded stays exactly where it is, and Coach goes back through it the moment he can speak.
      </p>
    </section>
  );
}
