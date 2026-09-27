// The top of a website page: a huge, faint word set behind the heading -
// the page's name as texture, the way a book site sets its title in giant
// ghosted letters behind the cover - then the kicker, the heading and a
// line under it.

export function SiteHero({
  ghost,
  kicker,
  title,
  children,
  accent = "text-structure",
}: {
  /** The giant faint word behind it all. */
  ghost: string;
  kicker: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  /** The kicker's colour class. */
  accent?: string;
}) {
  return (
    <header className="relative isolate flex flex-col items-center gap-4 overflow-hidden px-2 pb-4 pt-10 text-center sm:pt-16">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-2 -z-10 select-none whitespace-nowrap text-center text-[22vw] font-black uppercase leading-none tracking-tighter text-white/[0.035] sm:top-4 sm:text-[11rem]"
      >
        {ghost}
      </span>
      <span className="spectrum-rule block h-1 w-16 rounded-full" />
      <p className={`text-xs font-bold uppercase tracking-[0.25em] ${accent}`}>{kicker}</p>
      <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">{title}</h1>
      {children && <div className="max-w-2xl text-base text-ink-muted text-balance sm:text-lg">{children}</div>}
    </header>
  );
}

/** A section heading in the same voice. */
export function SiteHeading({ kicker, title, accent = "text-ink-faint" }: { kicker?: string; title: React.ReactNode; accent?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {kicker && <p className={`text-xs font-bold uppercase tracking-[0.22em] ${accent}`}>{kicker}</p>}
      <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h2>
    </div>
  );
}

/** The one button style for "talk to us" / "join the waitlist" asks. */
export function SiteAsk({ href, children, big = false }: { href: string; children: React.ReactNode; big?: boolean }) {
  return (
    <a href={href} className="cta-neon-wrap rounded-xl">
      <span className="cta-neon-glow rounded-xl" aria-hidden />
      <span className={`cta-neon block rounded-xl ${big ? "px-9 py-4 text-base" : "px-6 py-2.5 text-sm"}`}>{children}</span>
    </a>
  );
}
