import { cohort } from "@/data/cohort";
import { foundingCohort } from "@/data/pricing";
import { CalendarIcon, CheckIcon } from "@/components/icons";

// The two facts a person needs before they can decide: when it starts,
// and what they get in the meantime.
//
// These sit together because apart they each mislead. "Starts October
// 3" alone reads as "pay now, wait a fortnight". "Instant access"
// alone reads as one more self-paced course that will sit unopened.
// Together they say the true thing - the app is yours tonight, and on
// the 3rd everyone starts walking at the same time.

export function CohortDates() {
  return (
    // The founding members' cohort - the offer itself, given the room it
    // deserves: its trophy, its dates, its 20 places and why it is priced
    // as it is.
    <div className="mt-2 flex w-full max-w-3xl flex-col items-center gap-5 rounded-3xl border border-storytelling/50 bg-gradient-to-b from-storytelling/10 to-navy-800 px-5 py-6 shadow-[0_0_60px_-30px_var(--color-storytelling)] sm:flex-row sm:items-center sm:gap-8 sm:px-8 sm:py-7">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/trophy/cohort-autumn-2026-2x.webp"
        alt="The Founding Cohort trophy"
        width={220}
        height={220}
        className="h-40 w-auto shrink-0 drop-shadow-[0_0_30px_rgba(255,214,10,0.35)] sm:h-52"
      />
      <div className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-storytelling">Founding members&apos; cohort</span>
        <span className="flex items-center gap-2.5">
          <CalendarIcon className="size-5 shrink-0 text-figurative" />
          <span className="text-lg font-bold text-ink sm:text-xl">{cohort.startLabel}</span>
        </span>
        <span className="text-sm text-ink-muted text-balance">
          {foundingCohort.headline} - {foundingCohort.line} This round runs for {cohort.weeks} weeks - {cohort.runLabel} - and
          you keep {cohort.accessLabel} to the app. Founding members win the Founding Cohort trophy, which no later round can.
        </span>
        <span className="flex items-start gap-2 rounded-xl bg-mindset/10 px-3.5 py-2 text-left text-sm text-mindset text-balance">
          <CheckIcon className="mt-0.5 size-4 shrink-0" />
          <span>{cohort.doorsLine}</span>
        </span>
      </div>
    </div>
  );
}
