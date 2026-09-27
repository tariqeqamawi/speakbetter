import { PhoneFilm } from "@/components/phone-film";
import { HowItWorks } from "@/components/how-it-works";
import { WhatItIs } from "@/components/what-it-is";
import { WhatsInside } from "@/components/whats-inside";
import { ListenIcon, TrophyIcon } from "@/components/icons";

// The app, shown rather than described (master plan §15): a lesson as
// it plays inside, with the words and symbols that land on the sentence
// being spoken; the app itself in phone frames - the live preview
// pages, not screenshots, so they're never out of date; and the road
// from record to review as a short film of the real thing.

/** A phone outline around whatever it's given. */
function Phone({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <figure className="flex w-56 shrink-0 flex-col items-center gap-2">
      <div className="relative w-full rounded-[2.2rem] border-4 border-navy-600 bg-navy-950 p-1.5 shadow-2xl shadow-navy-950">
        <span className="absolute left-1/2 top-3 z-10 h-1.5 w-14 -translate-x-1/2 rounded-full bg-navy-700" />
        <div className="relative aspect-[390/844] overflow-hidden rounded-[1.8rem] bg-navy-950">{children}</div>
      </div>
      <figcaption className="text-xs font-semibold text-ink-muted">{label}</figcaption>
    </figure>
  );
}


export function LandingShowcase() {
  return (
    <>
      {/* How it works first - the five steps, with the two things a
          student gets for each take - then what's inside, then the app
          itself on film. The quick guide that used to close this section
          said the same five steps a second time, so it's gone. */}
      <section className="flex w-full flex-col items-center gap-5">
        <h2 className="max-w-2xl text-center text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          How it works
        </h2>
        <HowItWorks />
        <ul className="flex flex-col items-center gap-1.5 text-sm text-ink-muted sm:flex-row sm:gap-6">
          <li className="flex items-center gap-2">
            <TrophyIcon className="size-4 text-storytelling" />A pass pays by score - a better take is worth more.
          </li>
          <li className="flex items-center gap-2">
            <ListenIcon className="size-4 text-advanced" />Every review is kept to read back, and to ask about.
          </li>
        </ul>
      </section>

      {/* The numbers - what's in the box. */}
      <div className="flex justify-center">
        <WhatItIs />
      </div>

      {/* The standalone lesson player is gone.
          
          "A lesson, exactly as you'll see it" sat between the coach
          demo and the feature list saying nothing the page was not
          already saying - there is a studio lesson playing in the hero
          and the whole library further down, both of which show the
          same thing in context. A third video of the same kind in the
          middle is not more proof, it is a longer page. */}
      <WhatsInside />

      {/* A preview of the app - short films of the real pages */}
      <section className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">See the app in action</h2>
        <p className="max-w-lg text-center text-ink-muted">
          Color-coded skills you can dial into and watch, and your gamified dashboard - trophies, streak, speaking
          spectrum, leaderboards and the community, all in one place.
        </p>
        <div className="-mx-4 flex w-[calc(100%+2rem)] gap-6 overflow-x-auto px-4 pb-2 sm:mx-0 sm:w-full sm:justify-center sm:overflow-visible sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* The road (3D and 2D) is shown once, in "The challenges". */}
          <Phone label="Skills, into a color">
            <PhoneFilm src="/film/tour-skills.mp4" poster="/film/tour-skills.jpg" label="The skills dial, then a color's lessons" />
          </Phone>
          <Phone label="The dashboard">
            <PhoneFilm src="/film/tour-dashboard.mp4" poster="/film/tour-dashboard.jpg" label="The dashboard, tab by tab" />
          </Phone>
        </div>
      </section>

    </>
  );
}
