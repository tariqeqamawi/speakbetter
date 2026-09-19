import { tiers, trial } from "@/data/pricing";
import { UnlockButton } from "@/components/unlock-button";
import { CheckIcon, XIcon } from "@/components/icons";

// The offer, laid out (master plan §15): the free baseline first -
// what anyone can do before paying - then the three tiers side by
// side, the membership drawn larger because it's the product. Used on
// the landing page and on /pricing.

export function Pricing({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      {/* The free baseline */}
      <section className="flex flex-col items-center gap-4 rounded-2xl border border-mindset/40 bg-navy-800 p-6 text-center shadow-[0_0_40px_-16px_var(--color-mindset)] sm:p-8">
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-mindset">Try it first</span>
        <h3 className="text-2xl font-semibold tracking-tight">{trial.name}</h3>
        <ul className="flex max-w-lg flex-col gap-1.5 text-left text-sm text-ink-muted">
          {trial.includes.map((line) => (
            <li key={line} className="flex items-start gap-2">
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-mindset" />
              {line}
            </li>
          ))}
        </ul>
        <UnlockButton plan="trial">{trial.cta}</UnlockButton>
        <p className="text-xs text-ink-faint">No card. Your recording stays on your phone; the review is yours to keep.</p>
      </section>

      {/* The tiers */}
      <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
        {tiers.map((tier) => (
          <section
            key={tier.id}
            className={`relative flex flex-col gap-5 rounded-2xl border p-6 ${
              tier.featured
                ? "border-structure/60 bg-navy-800 shadow-[0_0_48px_-16px_var(--color-structure)] lg:-my-3 lg:py-9"
                : "border-navy-600 bg-navy-800/70"
            }`}
          >
            {tier.featured && (
              <span className="absolute -top-3 left-6 rounded-full bg-structure px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-navy-950">
                Most students
              </span>
            )}
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-semibold tracking-tight">{tier.name}</h3>
              <p className="text-sm text-ink-muted">{tier.tagline}</p>
            </div>
            <div className="flex flex-col">
              <span className="text-4xl font-bold tracking-tight text-ink">{tier.price}</span>
              <span className="text-xs text-ink-faint">{tier.term}</span>
            </div>
            <ul className="flex flex-1 flex-col gap-2 text-sm">
              {tier.includes.map((line) => (
                <li key={line} className="flex items-start gap-2 text-ink">
                  <CheckIcon className={`mt-0.5 size-4 shrink-0 ${tier.featured ? "text-structure" : "text-mindset"}`} />
                  {line}
                </li>
              ))}
              {!compact &&
                tier.excludes?.map((line) => (
                  <li key={line} className="flex items-start gap-2 text-ink-faint">
                    <XIcon className="mt-0.5 size-4 shrink-0" />
                    {line}
                  </li>
                ))}
            </ul>
            <div className="flex flex-col items-start gap-2">
              <UnlockButton plan={tier.id} quiet={!tier.featured}>
                {tier.cta}
              </UnlockButton>
              {tier.note && <p className="text-xs text-ink-faint">{tier.note}</p>}
            </div>
          </section>
        ))}
      </div>
      <p className="text-center text-xs text-ink-faint">
        Checkout stub - Stripe payment arrives with service integration. Prices in USD.
      </p>
    </div>
  );
}
