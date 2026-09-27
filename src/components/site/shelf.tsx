import Image from "next/image";
import Link from "next/link";

// The author's work on one shelf - the book, the deck and the app side by
// side on an oak board - so whichever brought a visitor here, they see
// the other two.

const ITEMS = [
  { href: "/deck", src: "/deck/printed-deck-oak.webp", alt: "The printed Speak Better card deck", label: "The Deck", w: 1600, h: 1063 },
  { href: "/book", src: "/book/book-oak-v1-portrait.webp", alt: "The Speak Better book", label: "The Book", w: 850, h: 1062, big: true },
  { href: "/landing", src: "/screenshots/today-narrow.png", alt: "The Speak Better app on a phone", label: "The App", w: 824, h: 1600, phone: true },
];

export function Shelf() {
  return (
    <div className="w-full max-w-4xl">
      <div className="flex items-end justify-center gap-3 px-4 sm:gap-8">
        {ITEMS.map((it) => (
          <Link key={it.href} href={it.href} className="group flex flex-col items-center gap-2">
            <span
              className={`relative block overflow-hidden transition-transform duration-300 group-hover:-translate-y-2 ${
                it.phone
                  ? "aspect-[824/1600] w-20 rounded-[1.1rem] border-[3px] border-navy-950 shadow-xl shadow-black/60 sm:w-28"
                  : it.big
                    ? "aspect-[3/4] w-32 rounded-lg shadow-2xl shadow-black/70 sm:w-52"
                    : "aspect-[3/4] w-24 rounded-lg shadow-xl shadow-black/60 sm:w-40"
              }`}
            >
              <Image src={it.src} alt={it.alt} fill sizes="220px" className="object-cover" />
            </span>
          </Link>
        ))}
      </div>
      {/* The oak board. */}
      <div
        aria-hidden
        className="h-4 rounded-sm shadow-[0_18px_30px_-8px_rgba(0,0,0,0.8)] sm:h-5"
        style={{ background: "linear-gradient(180deg, #d9a86a 0%, #b9824a 45%, #8a5a2e 100%)" }}
      />
      <div className="mt-4 flex justify-center gap-6 text-sm font-semibold text-ink-muted sm:gap-16">
        {ITEMS.map((it) => (
          <Link key={it.href} href={it.href} className="hover:text-ink">
            {it.label} →
          </Link>
        ))}
      </div>
    </div>
  );
}
