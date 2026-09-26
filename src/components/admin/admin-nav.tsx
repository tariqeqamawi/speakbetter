import Link from "next/link";

// The two rooms of /admin: what's happening in the cohort, and the case
// for backing it.
export function AdminNav({ at }: { at: "insights" | "data-room" }) {
  const tab = (href: string, id: typeof at, label: string) => (
    <Link
      href={href}
      aria-current={at === id ? "page" : undefined}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
        at === id ? "bg-ink text-navy-900" : "text-ink-muted hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <nav className="flex w-fit gap-1 rounded-full border border-navy-600 bg-navy-900/60 p-1 print:hidden">
      {tab("/admin", "insights", "Cohort insights")}
      {tab("/admin/data-room", "data-room", "Data room")}
    </nav>
  );
}
