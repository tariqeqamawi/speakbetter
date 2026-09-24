import { cohort } from "@/data/cohort";
import { creditPacks, includedReviews } from "@/data/credits";
import { guarantee, monthly, tiers, upgradeOffer } from "@/data/pricing";

// The questions somebody has with their card half out, answered under
// the tiers rather than on a page of their own. Every number here is
// read from the file that owns it - the prices, the dates, the credit
// packs - so an answer can never quote a price the checkout does not
// charge.

const tier = (id: string) => tiers.find((t) => t.id === id)!;
const starter = tier("foundations");
const complete = tier("coached");
const vip = tier("founders");
const packs = creditPacks.map((p) => p.price).join(", ");

export const faq: { q: string; a: string }[] = [
  {
    q: "What if it isn't for me?",
    a: `Every tier comes with a ${guarantee.days}-day money-back guarantee, for any reason whatsoever. Ask within ${guarantee.days} days of paying and you get every cent back - no forms, no questions, no hard feelings.`,
  },
  {
    q: "Is this a subscription?",
    a: `No. Each tier is one payment for ${cohort.accessLabel} - ${starter.price}, ${complete.price} or ${vip.price}. Nothing renews on its own. If you want to keep going after the six weeks, there is a monthly option - but only if you choose it.`,
  },
  {
    q: "What happens after the six weeks?",
    a: `You can stay on month to month: ${starter.name} for ${monthly.foundations} a month, or ${complete.name} for ${monthly.coached} a month. It is entirely optional - the six weeks are yours either way, and nobody is moved onto a monthly plan without choosing it.`,
  },
  {
    q: "When does it start?",
    a: `The cohort begins ${cohort.startLabel} and runs ${cohort.runLabel}. ${cohort.doorsLine} The lessons, the tour and your baseline challenge are all there from the moment you join.`,
  },
  {
    q: "What's the difference between the tiers?",
    a: `${starter.name} is the whole course: every lesson, the STORY adventure, the weekly live sessions, and Coach watching every take and writing you the review. ${complete.name} adds Coach out loud - the review spoken in his voice with captions - and on call, so you can ask him anything about how you're developing. ${vip.name} adds the part that does not scale: Tariq watches your takes himself and gives you feedback one to one, plus the printed card deck and the book when it ships.`,
  },
  {
    q: "Can I upgrade later?",
    a: `Yes - from ${starter.name} to ${complete.name} at any point in the six weeks, for the difference: ${upgradeOffer.cta.replace("Upgrade for ", "")}. You are never asked to pay the full price twice.`,
  },
  {
    q: "How many reviews do I get?",
    a: `${starter.name} includes ${includedReviews.foundations} reviews from Coach, ${complete.name} ${includedReviews.coached} and ${vip.name} ${includedReviews.founders} - comfortably more than a take a day for six weeks. If you want more, coaching credits top you up in packs of ${packs}.`,
  },
  {
    q: "Are the live sessions in every tier?",
    a: "Yes. Every tier is in the cohort and at every weekly live session with Tariq. The point of a cohort is that everybody walks it together.",
  },
  {
    q: "What happens to my videos?",
    a: "They stay on your phone. A take leaves it only to be reviewed, and the copy Coach watched is deleted the moment the review comes back. The feedback is what's kept.",
  },
  {
    q: "Can I try it before paying?",
    a: "Yes - the first challenge is free. Record it, and Coach reviews it for real: your score, your seven-color spectrum, and what to do next. No card needed.",
  },
];
