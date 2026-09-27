import Link from "next/link";
import Image from "next/image";
import { SITE_FOOTER } from "@/data/site";
import { SUPPORT_EMAIL } from "@/data/support";

// The foot of every website page: every page, and the one address for
// everything else.

export function SiteFooter() {
  return (
    <footer className="flex flex-col items-center gap-5 border-t border-navy-600 pt-8 text-center">
      <Link href="/landing" className="flex items-center gap-2">
        <Image src="/logo-mark.png" alt="" width={320} height={256} className="h-7 w-auto" />
        <span className="font-semibold tracking-tight">Speak Better</span>
      </Link>
      <nav aria-label="Site" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ink-muted">
        {SITE_FOOTER.map((p) => (
          <Link key={p.href} href={p.href} className="hover:text-ink">
            {p.label}
          </Link>
        ))}
      </nav>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-ink-faint">
        <span>&copy; 2026 Speak Better</span>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-ink">
          {SUPPORT_EMAIL}
        </a>
      </div>
    </footer>
  );
}
