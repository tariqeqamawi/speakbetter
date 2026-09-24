import { LazyVimeoPlayer } from "@/components/lazy-vimeo-player";
import { PhoneFilm } from "@/components/phone-film";
import {
  ChallengesIcon,
  DeckIcon,
  FlameIcon,
  ListenIcon,
  MedalIcon,
  SpectrumIcon,
  TrophyIcon,
  VideoIcon,
  ZapIcon,
} from "@/components/icons";

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

const FEATURES: { Icon: (p: { className?: string }) => React.ReactNode; color: string; title: string; body: string }[] = [
  { Icon: VideoIcon, color: "text-acting", title: "Record with the clock in view", body: "The camera opens in the app with the challenge's own limit counting down, the brief on screen, and a stop at the limit." },
  { Icon: ListenIcon, color: "text-advanced", title: "A coach who watched", body: "Gestures, eyes, voice, the story - judged for quality, not presence, and said aloud with captions. It'll mention your shirt." },
  { Icon: SpectrumIcon, color: "text-body-language", title: "Seven colors", body: "Every take scored as a spectrum. The colors a challenge needs glow; the rest are bonus." },
  { Icon: ChallengesIcon, color: "text-structure", title: "The STORY adventure", body: "Twenty-four challenges in five phases, each opening at a rank - your own face in the circles you've passed." },
  { Icon: ZapIcon, color: "text-storytelling", title: "XP that pays by score", body: "A better take on a challenge you've passed is worth more. Ranks open the road; trophies are earned, not collected." },
  { Icon: DeckIcon, color: "text-figurative", title: "The card deck", body: "Seventy-nine cards, one per lesson, seven colors. Pull one of each and you have the ingredients for a talk that moves." },
  { Icon: MedalIcon, color: "text-mindset", title: "Ask your coach", body: "Hold to ask how you're developing. The answer comes from your own record - every take, every note - and nothing else." },
  { Icon: FlameIcon, color: "text-acting", title: "Streaks, board, notes", body: "A streak that glows, this week's board, and a note when your review is ready. Recordings stay on your phone." },
];

export function LandingShowcase() {
  return (
    <>
      {/* A lesson, as it plays inside */}
      <section className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-balance">A lesson, exactly as you&apos;ll see it</h2>
        <p className="max-w-lg text-center text-ink-muted">
          Short, taught to camera, and with the idea of each sentence landing beside the teacher as he says it - a
          word, a symbol - so the lesson is seen as well as heard. Press play.
        </p>
        <div className="w-full max-w-2xl">
          <LazyVimeoPlayer vimeoId="1081030429" title="Stories Make The World Go Round" poster="/thumbs/1081030429.jpg" />
        </div>
        <p className="text-xs text-ink-faint">Storytelling · &ldquo;Stories Make The World Go Round&rdquo; · 2 minutes</p>
      </section>

      {/* Everything in it */}
      <section className="flex flex-col items-center gap-6">
        <h2 className="text-2xl font-semibold tracking-tight">What&apos;s in the app</h2>
        <ul className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex flex-col gap-2 rounded-2xl border border-navy-600 bg-navy-800/70 p-4">
              <f.Icon className={`size-6 ${f.color}`} />
              <h3 className="text-sm font-semibold text-ink">{f.title}</h3>
              <p className="text-xs leading-relaxed text-ink-muted">{f.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* A preview of the app - three short films of the real pages */}
      <section className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">A preview of how the app looks and feels</h2>
        <p className="max-w-lg text-center text-ink-muted">
          Your STORY challenge journey; the skills and lesson videos, reached through a color-coded dial; and
          your gamified student dashboard - your trophies, your streak, the speaking spectrum, and more.
        </p>
        <div className="-mx-4 flex w-[calc(100%+2rem)] gap-6 overflow-x-auto px-4 pb-2 sm:mx-0 sm:w-full sm:justify-center sm:overflow-visible sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Phone label="The journey">
            <PhoneFilm src="/film/tour-journey.mp4" poster="/film/tour-journey.jpg" label="The journey, scrolled" />
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
          <ol className="flex flex-col gap-2">
            {[
              ["Record yourself speaking", "text-acting"],
              ["Upload your take for the lion", "text-body-language"],
              ["Receive detailed feedback", "text-mindset"],
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
