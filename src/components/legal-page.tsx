import Link from "next/link";
import { LEGAL_UPDATED } from "@/data/consent";

// The frame the terms and the privacy policy share: a readable column,
// a summary box in plain English at the top (the part people actually
// read), and numbered sections under it.

export function LegalPage({
  title,
  summary,
  children,
}: {
  title: string;
  summary: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6 py-10 text-sm leading-relaxed text-ink-muted">
      <header className="flex flex-col gap-2">
        <div className="spectrum-rule h-1 w-16 rounded-full" />
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        <p className="text-xs text-ink-faint">Last updated {LEGAL_UPDATED}</p>
      </header>
      <aside className="flex flex-col gap-2 rounded-2xl border border-mindset/40 bg-mindset/5 p-5">
        <b className="text-ink">In plain English</b>
        {summary}
      </aside>
      <div className="flex flex-col gap-6 [&_h2]:pt-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
        {children}
      </div>
      <footer className="flex gap-4 border-t border-navy-600 pt-4 text-xs">
        <Link href="/terms" className="hover:text-ink">
          Terms of Service
        </Link>
        <Link href="/privacy" className="hover:text-ink">
          Privacy Policy
        </Link>
        <Link href="/" className="hover:text-ink">
          Speak Better home
        </Link>
      </footer>
    </article>
  );
}

export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      <Link href="/terms" className="underline decoration-ink-faint underline-offset-2 hover:text-ink">
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link href="/privacy" className="underline decoration-ink-faint underline-offset-2 hover:text-ink">
        Privacy Policy
      </Link>
    </span>
  );
}
