import { creditPacks, includedReviews } from "@/data/credits";
import { tiers, type Plan } from "@/data/pricing";

// Said plainly wherever someone is buying or has just bought: Coach's
// reviews cost money to run, the tier includes plenty of them, and more
// are a cheap top-up. Tariq's words, with the tier's own number in.

export function reviewAllowanceLine(plan: Plan): string {
  const tier = tiers.find((t) => t.id === plan)!;
  const prices = creditPacks.map((p) => p.price);
  const packs = `${prices.slice(0, -1).join(", ")} and ${prices.at(-1)}`;
  return `We have a cost every time Coach watches your video and gives you a review. We've included ${includedReviews[plan]} of these in ${tier.name} - more than enough for you to get through the challenges. If you do a lot of takes and repeats and consult Coach regularly, you can top up to keep using these services. Top-ups are only ${packs}.`;
}

export function ReviewAllowance({ plan, className = "" }: { plan: Plan; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 rounded-2xl border border-navy-600 bg-navy-900/70 px-4 py-3 text-left text-sm ${className}`}>
      <span className="font-semibold text-ink">
        {includedReviews[plan]} Coach reviews included
      </span>
      <span className="text-ink-muted">{reviewAllowanceLine(plan)}</span>
    </div>
  );
}
