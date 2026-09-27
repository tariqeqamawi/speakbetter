import { PhoneFilm } from "@/components/phone-film";
import { HowItWorks } from "@/components/how-it-works";
import { WhatItIs } from "@/components/what-it-is";
import { WhatsInside } from "@/components/whats-inside";
import { SelfieTake } from "@/components/selfie-take";
import { SELFIE_TAKES } from "@/data/selfie-takes";
import { ListenIcon, TrophyIcon } from "@/components/icons";

// Two chapters of the landing page (master plan §15), the app shown
// rather than described.
//
// How it works: the five steps, then the step people doubt - recording
// yourself - shown being done, four people on their own phones with the
// app's recording screen over them.
//
// What's in the app: what you get (the numbers), the features at a
// glance, and the app itself - short films of the real pages, the
// challenges among them.

/** A phone outline around whatever it's given. */
function Phone({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <figure className="flex w-52 shrink-0 flex-col items-center gap-2 sm:w-auto">
      <div className="relative w-full rounded-[2.2rem] border-4 border-navy-600 bg-navy-950 p-1.5 shadow-2xl shadow-navy-950">
        <span className="absolute left-1/2 top-3 z-10 h-1.5 w-14 -translate-x-1/2 rounded-full bg-navy-700" />
        <div className="relative aspect-[390/844] overflow-hidden rounded-[1.8rem] bg-navy-950">{children}</div>
      </div>
      <figcaption className="text-xs font-semibold text-ink-muted">{label}</figcaption>
    </figure>
  );
}

/** The app's real pages on film, in the order a student meets them. */
const FILMS = [
  { src: "/film/tour-road3d-v2", label: "The challenges, in 3D", alt: "Travelling the S.T.O.R.Y. road in 3D" },
  { src: "/film/tour-road2d", label: "Or as a map, in 2D", alt: "The same road as a map, scrolled" },
  { src: "/film/tour-skills", label: "Skills, into a color", alt: "The skills dial, then a color's lessons" },
  { src: "/film/tour-deck", label: "The card deck", alt: "Dealing a spread from the card deck" },
  { src: "/film/tour-coach", label: "Ask Coach", alt: "Asking Coach a question" },
  { src: "/film/tour-dashboard", label: "Your dashboard", alt: "The dashboard, tab by tab" },
  { src: "/film/tour-community", label: "The community", alt: "The community's boards and rooms" },
  { src: "/film/tour-today", label: "Today", alt: "The day's page: what to do next" },
];

export function HowItWorksSection() {
  return (
    <div className="flex flex-col gap-14">
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

      {/* Step two, shown being done: people recording themselves on their
          own phones, the app's recording screen - the brief, and the lines
          that complete it - over them. */}
      <section className="flex flex-col items-center gap-6">
        <div className="flex max-w-2xl flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            This is how you actually record yourself
          </h2>
          <p className="text-ink-muted text-balance">
            No studio, no crew, no fancy equipment. Simply prop up your phone and press record through the Speak
            Better Selfie feature. Talk for a minute or two - then Coach watches it and gives you expert feedback.
          </p>
        </div>
        <div className="-mx-4 flex w-[calc(100%+2rem)] gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:w-full sm:max-w-4xl sm:grid-cols-4 sm:overflow-visible sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SELFIE_TAKES.map((t) => (
            <div key={t.src} className="w-60 shrink-0 rounded-[2.2rem] border-4 border-navy-600 bg-navy-950 p-1.5 shadow-2xl shadow-navy-950 sm:w-auto">
              <SelfieTake take={t} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function WhatsInTheApp() {
  return (
    <div className="flex flex-col gap-14">
      {/* What you get - the numbers. */}
      <div className="flex justify-center">
        <WhatItIs />
      </div>

      {/* Features at a glance - the cards. */}
      <WhatsInside />

      {/* The app in action - short films of the real pages. */}
      <section className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">See the app in action</h2>
        <p className="max-w-xl text-center text-ink-muted text-balance">
          Your challenges as a 3D adventure or a 2D map, color-coded skills you can dial into, the card deck, Coach
          on call, your gamified dashboard and the community - all in one place.
        </p>
        <div className="-mx-4 flex w-[calc(100%+2rem)] gap-6 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:w-full sm:max-w-5xl sm:grid-cols-4 sm:overflow-visible sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILMS.map((f) => (
            <Phone key={f.src} label={f.label}>
              <PhoneFilm src={`${f.src}.mp4`} poster={`${f.src}.jpg`} label={f.alt} />
            </Phone>
          ))}
        </div>
      </section>
    </div>
  );
}
