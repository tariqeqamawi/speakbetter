import { cohort } from "@/data/cohort";
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
    <div className="mt-1 flex w-full max-w-xl flex-col items-center gap-2.5 rounded-2xl border border-navy-600 bg-navy-800 px-5 py-4">
      <span className="flex items-center gap-2.5 text-center">
        <CalendarIcon className="size-5 shrink-0 text-figurative" />
        <span className="text-base font-bold text-ink sm:text-lg">{cohort.startLabel}</span>
      </span>

      <span className="text-sm text-ink-muted text-balance">
        This round runs for {cohort.weeks} weeks - {cohort.runLabel} - and you keep{" "}
        {cohort.accessLabel} to the app.
      </span>

      <span className="flex items-start gap-2 rounded-xl bg-mindset/10 px-3.5 py-2 text-sm text-mindset text-balance">
        <CheckIcon className="mt-0.5 size-4 shrink-0" />
        <span>{cohort.doorsLine}</span>
      </span>
    </div>
  );
}
