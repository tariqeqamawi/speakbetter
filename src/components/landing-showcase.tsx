import { PhoneFilm } from "@/components/phone-film";
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
          Your interactive challenges in the S.T.O.R.Y. framework - travelled as a 3D adventure, or taken as a
          map in 2D; color-coded skills that you can dial into
          and watch; and your gamified dashboard - trophies, streak, speaking spectrum, leaderboards and the
          community, all in one place.
        </p>
        <div className="-mx-4 flex w-[calc(100%+2rem)] gap-6 overflow-x-auto px-4 pb-2 sm:mx-0 sm:w-full sm:justify-center sm:overflow-visible sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* The challenges both ways a student can take them: travelling
              the S.T.O.R.Y. road in 3D, or scrolling it as a map. */}
          <Phone label="The challenges, in 3D">
            <PhoneFilm src="/film/tour-road3d.mp4" poster="/film/tour-road3d.jpg" label="Travelling the S.T.O.R.Y. road in 3D" />
          </Phone>
          <Phone label="Or as a map, in 2D">
            <PhoneFilm src="/film/tour-road2d.mp4" poster="/film/tour-road2d.jpg" label="The same road as a map, scrolled" />
          </Phone>
          <Phone label="Skills, into a color">
            <PhoneFilm src="/film/tour-skills.mp4" poster="/film/tour-skills.jpg" label="The skills dial, then a color's lessons" />
          </Phone>
          <Phone label="The dashboard">
            <PhoneFilm src="/film/tour-dashboard.mp4" poster="/film/tour-dashboard.jpg" label="The dashboard, tab by tab" />
          </Phone>
        </div>
      </section>

      {/* Record, send, hear back */}
      <section className="flex flex-col items-center gap-8 rounded-2xl border border-navy-600 bg-navy-800 p-6 sm:flex-row sm:justify-center sm:gap-14 sm:p-10">
        <Phone label="Thirty seconds of the real thing">
          <PhoneFilm src="/film/record-to-review.mp4" poster="/film/record-to-review.jpg" label="A take sent and reviewed" />
        </Phone>
        <div className="flex max-w-md flex-col gap-4">
          {/* The same five as the How it works section higher up.
              
              It used to be three of them - record, upload, receive -
              which made the page describe its own loop two different
              ways depending on where you were reading. A visitor who
              notices that does not think "two summaries", they think
              "which one is true". Repetition is the smaller cost. */}
          <ol className="flex flex-col gap-2">
            {[
              ["Watch a challenge", "text-structure"],
              ["Record yourself speaking", "text-acting"],
              ["Upload your take for Coach", "text-body-language"],
              ["Receive detailed feedback", "text-mindset"],
              ["Improve quickly", "text-storytelling"],
            ].map(([step, color], i) => (
              <li key={step} className="flex items-center gap-3">
                <span className={`grid size-8 shrink-0 place-items-center rounded-full border border-current text-sm font-bold ${color}`}>
                  {i + 1}
                </span>
                <span className="text-lg font-semibold text-ink">{step}</span>
              </li>
            ))}
          </ol>
          <p className="text-ink-muted">
            Every recorded attempt goes from your phone to your lion coach, and is actually watched. The coach
            watches your physical delivery - what you&apos;re wearing, the props you use, how you deliver your
            stories, your body language and gestures, your eye contact - tells you which lessons you&apos;re using,
            and shows you which colors you&apos;re lighting across the spectrum of speaking skills. Then it gives a
            verdict - passed or not - and awards XP for every challenge completed.
          </p>
          <p className="text-ink-muted">
            It makes public speaking not only fun, but effective and efficient.
          </p>
          <ul className="flex flex-col gap-1.5 text-sm text-ink-muted">
            <li className="flex items-center gap-2"><TrophyIcon className="size-4 text-storytelling" />A pass pays by score - a better take is worth more.</li>
            <li className="flex items-center gap-2"><ListenIcon className="size-4 text-advanced" />Every review is kept to read back, and to ask about.</li>
          </ul>
        </div>
      </section>
    </>
  );
}
