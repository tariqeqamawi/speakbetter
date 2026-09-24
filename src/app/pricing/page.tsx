import type { Metadata } from "next";
import Link from "next/link";
import { Pricing } from "@/components/pricing";
import { guarantee } from "@/data/pricing";

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
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Six weeks. One payment. Coach on every take.</h1>
        <p className="max-w-xl text-ink-muted">
          The cohort is one payment for six weeks, with a {guarantee.days}-day money-back guarantee for any reason -
          so the way to try it is to join it.
        </p>
      </header>
      <Pricing />
    </div>
  );
}
