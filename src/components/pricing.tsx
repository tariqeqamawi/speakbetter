import { guarantee, trial } from "@/data/pricing";
import { TierTabs } from "@/components/tier-tabs";
import Link from "next/link";
import { CheckIcon, ShieldCheckIcon } from "@/components/icons";
import { PricingFaq } from "@/components/pricing-faq";

// The offer, laid out (master plan §15): the free baseline first -
// what anyone can do before paying - then the three tiers side by
// side, the membership drawn larger because it's the product. Used on
// the landing page and on /pricing.

export function Pricing({ hideTrial = false }: { hideTrial?: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      {/* The free baseline - on the landing page it's live, just above
          (FirstChallenge), so this card is for /pricing. */}
      {!hideTrial && (
        <section className="flex flex-col items-center gap-4 rounded-2xl border border-mindset/40 bg-navy-800 p-6 text-center shadow-[0_0_40px_-16px_var(--color-mindset)] sm:p-8">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-mindset">The first one&apos;s on us</span>
          <h3 className="text-2xl font-semibold tracking-tight">{trial.name}</h3>
          <ul className="flex max-w-lg flex-col gap-1.5 text-left text-sm text-ink-muted">
            {trial.includes.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-mindset" />
                {line}
              </li>
            ))}
          </ul>
          <Link href="/#try" className="cta-neon-wrap rounded-xl">
            <span className="cta-neon-glow rounded-xl" aria-hidden />
            <span className="cta-neon block rounded-xl px-7 py-3.5 text-sm">{trial.cta}</span>
          </Link>
          <p className="text-xs text-ink-faint">No card. Your recording stays on your phone; the review is yours to keep.</p>
        </section>
      )}

      {/* The tiers - side by side on a desktop, tabs on a phone */}
      <TierTabs />

      {/* The guarantee, directly under the prices - it answers the one
          question every price raises, so it sits where that question is
          asked rather than in the small print. */}
      <div className="mx-auto flex max-w-xl items-center gap-4 rounded-2xl border border-mindset/40 bg-navy-800 px-5 py-4 shadow-[0_0_40px_-18px_var(--color-mindset)]">
        <ShieldCheckIcon className="size-9 shrink-0 text-mindset" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-ink">{guarantee.title}</span>
          <span className="text-sm text-ink-muted">{guarantee.line}</span>
        </div>
      </div>

      <p className="text-center text-xs text-ink-faint">
        Checkout stub - Stripe payment arrives with service integration. Prices in USD.
      </p>

      <div className="flex justify-center">
        <PricingFaq />
      </div>
    </div>
  );
}
