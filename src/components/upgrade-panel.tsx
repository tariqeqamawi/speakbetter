import Link from "next/link";
import { LockIcon } from "@/components/icons";

// Where the plan stops (lib/plan.ts): what this is, and the way to the
// rest of it. Never a wall of gray - it says what's behind it.

export function UpgradePanel({
  title,
  body,
  cta = "See what's included",
}: {
  title: string;
  body: string;
  cta?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-structure/40 bg-navy-800 p-5 shadow-[0_0_32px_-14px_var(--color-structure)]">
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
        <LockIcon className="size-4 text-structure" />
        {title}
      </p>
      <p className="text-sm text-ink-muted">{body}</p>
      <Link
        href="/pricing"
        className="rounded-lg bg-structure px-5 py-2.5 text-sm font-semibold text-navy-950 transition-opacity hover:opacity-90"
      >
        {cta}
      </Link>
    </div>
  );
}
