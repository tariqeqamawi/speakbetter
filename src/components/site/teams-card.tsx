import Link from "next/link";

// Under the three tiers: the way in for a whole team - seats in packs of
// ten, and a conversation rather than a price.

export function TeamsCard() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 rounded-3xl border border-body-language/40 bg-navy-800/60 p-6 text-center sm:flex-row sm:text-left">
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-[0.22em] text-body-language">Teams &amp; enterprise</span>
        <b className="text-lg font-semibold text-ink">Bringing Speak Better to your team?</b>
        <span className="text-sm text-ink-muted">In packs of 10, 50 or 100+ seats, with live sessions with Tariq - shaped around your people.</span>
      </div>
      <Link
        href="/teams"
        className="shrink-0 rounded-full border border-body-language/70 bg-navy-700/70 px-6 py-2.5 text-sm font-semibold text-ink shadow-[0_0_12px_-2px_var(--color-body-language)]"
      >
        Talk to us
      </Link>
    </div>
  );
}
