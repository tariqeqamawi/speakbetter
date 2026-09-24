import type { Metadata } from "next";
import Link from "next/link";
import { Pricing } from "@/components/pricing";

export const metadata: Metadata = {
  title: "Pricing",
};

// The offer on its own page (master plan §15) - linked from the landing
// page and reachable by anyone weighing it up.

export default function PricingPage() {
  return (
    <div className="flex flex-col gap-8 py-8">
      <header className="flex flex-col items-center gap-3 text-center">
        <Link href="/" className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-faint hover:text-ink">
          Speak Better
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Start free. Keep the method. Add the coach.</h1>
        <p className="max-w-xl text-ink-muted">
          Record your baseline for nothing and get one real review. Then the cohort is one payment for six weeks - and the
          coach who watches every take is a membership you can stop any time.
        </p>
      </header>
      <Pricing />
      <section className="grid gap-4 sm:grid-cols-2">
        {[
          ["Why is the coach a membership?", "Every review is the model actually watching your video - a real cost each time. A membership keeps that honest, and lets you stop when you've got what you came for. The lessons are yours either way."],
          ["What happens to my videos?", "They never leave your phone except to be reviewed, and the copy the coach watched is deleted the moment the review is back. The feedback is what's kept."],
          ["Can I try the coach before paying?", "Yes - the free baseline includes one real review: your score, your seven-color spectrum, and what to do next."],
          ["What's in VIP Ultimate?", "Everything in Complete, and the part that does not scale: Tariq watches your takes personally and gives you feedback one to one. Plus the founders set - the printed deck posted to you and the book when it ships. Every tier is in the live cohort with weekly sessions; VIP Ultimate is the one where the teacher works with you directly, so seats are strictly limited."],
        ].map(([q, a]) => (
          <div key={q} className="flex flex-col gap-1.5 rounded-2xl border border-navy-600 bg-navy-800/60 p-5">
            <h3 className="text-sm font-semibold text-ink">{q}</h3>
            <p className="text-sm text-ink-muted">{a}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
