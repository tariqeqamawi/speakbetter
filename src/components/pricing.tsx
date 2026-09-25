import { guarantee } from "@/data/pricing";
import { TierTabs } from "@/components/tier-tabs";
import { GuaranteeSeal } from "@/components/guarantee-seal";
import { PricingFaq } from "@/components/pricing-faq";

// The offer, laid out (master plan §15): the three tiers side by side,
// the middle one drawn larger because it's the product, the guarantee
// under them and the questions under that. There is no free trial -
// the fourteen-day guarantee is how somebody tries it. Used on the
// landing page and on /pricing.

export function Pricing() {
  return (
    <div className="flex flex-col gap-6">
      {/* The tiers - side by side on a desktop, tabs on a phone */}
      <TierTabs />

      {/* The guarantee, directly under the prices - it answers the one
          question every price raises, so it sits where that question is
          asked rather than in the small print. */}
      <div className="mx-auto flex max-w-xl items-center gap-4 rounded-2xl border border-mindset/40 bg-navy-800 px-5 py-4 shadow-[0_0_40px_-18px_var(--color-mindset)]">
        <GuaranteeSeal size={136} />
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
