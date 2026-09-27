import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteAsk, SiteHeading } from "@/components/site/site-hero";
import { SiteFooter } from "@/components/site/site-footer";
import { LookInside } from "@/components/site/look-inside";
import { Shelf } from "@/components/site/shelf";
import { talkMailto } from "@/data/site";
import { credit, testimonials } from "@/data/testimonials";

// The book's own page. Laid out after the best author sites (Influex's
// book clients - Cameron Herold's The Second in Command above all): the
// title set huge and faint behind the cover; a line of praise straight
// under it; the book open on the page to leaf through; ordering for a
// group; the author in a split panel; the rest of the author's work on
// a shelf. The book isn't out, so every ask here is the waitlist - and
// the "coming soon" lives on this page rather than a page of its own.

export const metadata: Metadata = {
  title: "The Book",
  description:
    "Speak Better: The 7 Colors of Fearless, Unforgettable Speaking, by Tariq EQ Amawi. Find your true colors. Unleash your confidence. Roar on screen and stage.",
};

const WAITLIST = talkMailto("Book waitlist", ["Name", "Anything you'd like the book to cover"]);

export default function BookPage() {
  // A line about the teacher, from a student - never a made-up blurb for
  // a book nobody has read yet.
  const praise = testimonials.find((t) => t.tag === "teacher" && t.quote && (!t.check || t.initials) && t.quote.length < 140);

  return (
    <div className="flex flex-col gap-20 pb-10">
      {/* THE COVER. */}
      <section className="relative isolate grid items-center gap-8 overflow-hidden pt-8 lg:grid-cols-[1fr_1.15fr] lg:gap-4">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-6 -z-10 select-none whitespace-nowrap text-center text-[26vw] font-black uppercase leading-[0.85] tracking-tighter text-white/[0.04] lg:text-[15rem]"
        >
          7 Colors
        </span>
        <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
          <span className="rounded-full border border-storytelling/50 bg-storytelling/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-storytelling">
            The book · coming soon
          </span>
          <h1 className="flex flex-col gap-2">
            <span className="text-sm font-bold uppercase tracking-[0.35em] text-ink-muted">Speak Better</span>
            <span className="text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl">
              The 7 Colors of Fearless, Unforgettable Speaking
            </span>
          </h1>
          <p className="max-w-md text-lg text-ink-muted">
            Find your true colors. Unleash your confidence. Roar on screen and stage.
          </p>
          <p className="text-sm text-ink-faint">
            <b className="font-semibold text-ink">Tariq EQ Amawi</b> - TEDx Speaker, Slam Poetry Winner &amp; Creator of the
            Mic Drop Method
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <SiteAsk href={WAITLIST} big>
              Join the waitlist
            </SiteAsk>
            <a href="#inside" className="text-sm font-semibold text-ink-muted underline-offset-4 hover:text-ink hover:underline">
              Take a look inside ↓
            </a>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-2xl">
          <Image
            src="/book/book-mockup-neon.webp"
            alt="Speak Better: The 7 Colors of Fearless, Unforgettable Speaking - the book"
            width={1600}
            height={1063}
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="h-auto w-full rounded-3xl"
          />
        </div>
      </section>

      {praise && (
        <figure className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
          <blockquote className="text-xl font-semibold leading-snug text-balance sm:text-2xl">
            &ldquo;{praise.quote}&rdquo;
          </blockquote>
          <figcaption className="text-sm text-ink-faint">{credit(praise)}, a student of Tariq&apos;s</figcaption>
        </figure>
      )}

      {/* LOOK INSIDE. */}
      <section id="inside" className="flex scroll-mt-24 flex-col items-center gap-8">
        <SiteHeading kicker="Take a look inside" title="Seven colors. Seven chapters." accent="text-structure" />
        <p className="-mt-4 max-w-xl text-center text-ink-muted">
          Every skill a speaker needs sorts into one of seven colors - the same seven the Speak Better app is built on. The
          book gives each its own chapter.
        </p>
        <LookInside />
      </section>

      {/* WHY. */}
      <section className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <SiteHeading kicker="Why a book" title="Your voice, on paper, to keep" accent="text-figurative" />
        <p className="text-ink-muted">
          The app teaches the colors on video and coaches you through them take by take. The book is the same method
          you can carry, underline and come back to the night before a big talk - all seven colors in one place, and the
          stories behind them.
        </p>
      </section>

      {/* THE SHELF. */}
      <section className="flex flex-col items-center gap-8">
        <SiteHeading kicker="The Speak Better library" title="The book is one part of it" accent="text-mindset" />
        <Shelf />
      </section>

      {/* FOR A GROUP. */}
      <section className="flex flex-col items-center gap-8">
        <SiteHeading kicker="For your team, school or event" title="Ordering copies for a group?" accent="text-body-language" />
        <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-3">
          {[
            { n: "10+", line: "For a team or a class" },
            { n: "50+", line: "For a company or a conference" },
            { n: "100+", line: "Copies with the app, and Tariq, for your people" },
          ].map((b) => (
            <div key={b.n} className="flex flex-col items-center gap-2 rounded-2xl border border-navy-600 bg-navy-800/60 p-6 text-center">
              <span className="text-4xl font-bold tracking-tight text-ink">
                {b.n} <span className="text-lg font-semibold text-ink-muted">copies</span>
              </span>
              <span className="text-sm text-ink-muted">{b.line}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-2">
          <SiteAsk href={talkMailto("Group book order", ["Name", "Organisation", "How many copies", "When you need them"])}>
            Talk to us about a group order
          </SiteAsk>
          <Link href="/teams" className="text-xs text-ink-faint hover:text-ink">
            Or bring the whole course to your team →
          </Link>
        </div>
      </section>

      {/* THE AUTHOR. */}
      <section className="grid overflow-hidden rounded-3xl border border-navy-600 bg-navy-800/60 lg:grid-cols-2">
        <div className="flex flex-col justify-center gap-4 p-7 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-acting">Meet the author</p>
          <h2 className="text-3xl font-semibold tracking-tight">Tariq EQ Amawi</h2>
          <p className="text-ink-muted">
            <b className="font-semibold text-ink">TEDx speaker, slam poetry winner and creator of the Mic Drop Method.</b>{" "}
            His first-ever public speech was a TEDx talk in Bali that drew more than ten times the views of any other talk
            at the conference. Since then he has taken stages around the world - and built Speak Better so anyone can learn
            the craft he spent years studying.
          </p>
          <Link
            href="/about"
            className="self-start rounded-full border border-navy-500 px-5 py-2 text-sm font-semibold text-ink transition-colors hover:border-ink-faint"
          >
            Read Tariq&apos;s story
          </Link>
        </div>
        <div className="relative min-h-72">
          <Image src="/origin/real/stages.webp" alt="Tariq on stage, arms open to the crowd" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
      </section>

      {/* COMING SOON. */}
      <section className="flex flex-col items-center gap-6">
        <SiteHeading kicker="Coming soon" title="What's next" accent="text-storytelling" />
        <ol className="flex w-full max-w-2xl flex-col gap-3">
          {[
            { what: "The book", note: "Being written now. Waitlist first to know - and first to read it." },
            { what: "The printed deck on its own", note: "Today it comes with the VIP tier; soon it's yours to order by itself." },
            { what: "The readers' wall", note: "When your copy arrives, send us a photo with it - the best ones go right here." },
          ].map((s, i) => (
            <li key={s.what} className="flex gap-4 rounded-2xl border border-navy-600 bg-navy-800/50 p-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy-700 text-sm font-bold text-ink">{i + 1}</span>
              <span className="flex flex-col">
                <b className="font-semibold text-ink">{s.what}</b>
                <span className="text-sm text-ink-muted">{s.note}</span>
              </span>
            </li>
          ))}
        </ol>
        <SiteAsk href={WAITLIST} big>
          Join the waitlist
        </SiteAsk>
      </section>

      <SiteFooter />
    </div>
  );
}
