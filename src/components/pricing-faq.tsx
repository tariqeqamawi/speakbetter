import { faq } from "@/data/faq";
import { ChevronDownIcon } from "@/components/icons";

// The questions, folded. Nine open answers under three price cards is
// a wall of text between somebody and the button; nine questions they
// can scan, with the one they care about a tap away, is not. Native
// <details> so it works before the page has hydrated and needs no
// state at all.

export function PricingFaq() {
  return (
    <section aria-labelledby="faq-title" className="flex w-full max-w-2xl flex-col gap-3">
      <h3 id="faq-title" className="text-center text-xl font-semibold tracking-tight">
        Questions, answered
      </h3>
      <ul className="flex flex-col gap-2">
        {faq.map(({ q, a }) => (
          <li key={q}>
            <details className="group rounded-2xl border border-navy-600 bg-navy-800/60 open:bg-navy-800">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDownIcon className="size-4 shrink-0 text-ink-faint transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-4 text-sm leading-relaxed text-ink-muted">{a}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
