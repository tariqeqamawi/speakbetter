import { LazyVimeoPlayer } from "@/components/lazy-vimeo-player";
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

/** A live preview page, scaled into the phone. Loads only when near. */
function Preview({ src, title }: { src: string; title: string }) {
  return (
    <iframe
      src={src}
      title={title}
      loading="lazy"
      tabIndex={-1}
      className="pointer-events-none absolute left-0 top-0 h-[844px] w-[390px] origin-top-left"
      style={{ transform: "scale(calc(216 / 390))" }}
    />
  );
}

const FEATURES: { Icon: (p: { className?: string }) => React.ReactNode; color: string; title: string; body: string }[] = [
  { Icon: VideoIcon, color: "text-acting", title: "Record with the clock in view", body: "The camera opens in the app with the challenge's own limit counting down, the brief on screen, and a stop at the limit." },
  { Icon: ListenIcon, color: "text-advanced", title: "A coach who watched", body: "Gestures, eyes, voice, the story - judged for quality, not presence, and said aloud with captions. It'll mention your shirt." },
  { Icon: SpectrumIcon, color: "text-body-language", title: "Seven colors", body: "Every take scored as a spectrum. The colors a challenge needs glow; the rest are bonus." },
  { Icon: ChallengesIcon, color: "text-structure", title: "The STORY journey", body: "Twenty-four challenges in five phases, each opening at a rank - your own face in the circles you've passed." },
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

      {/* The app, in your hand */}
      <section className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">The app, in your hand</h2>
        <p className="max-w-lg text-center text-ink-muted">
          Live pages with a worked-in student behind them, not mock-ups: the dashboard, the trophy case, the journey,
          the deck.
        </p>
        <div className="-mx-4 flex w-[calc(100%+2rem)] gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:w-full sm:justify-center sm:overflow-visible sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Phone label="Dashboard">
            <Preview src="/demo?bare=1" title="Dashboard preview" />
          </Phone>
          <Phone label="Trophy case">
            <Preview src="/demo?bare=1&tab=badges" title="Trophy case preview" />
          </Phone>
          <Phone label="The journey">
            <Preview src="/demo/challenges?bare=1" title="Journey preview" />
          </Phone>
          <Phone label="The deck">
            <Preview src="/demo/skills/cards?bare=1" title="Deck preview" />
          </Phone>
        </div>
      </section>

      {/* Record, send, hear back */}
      <section className="flex flex-col items-center gap-8 rounded-2xl border border-navy-600 bg-navy-800 p-6 sm:flex-row sm:justify-center sm:gap-14 sm:p-10">
        <Phone label="Thirty seconds of the real thing">
          <video
            src="/film/record-to-review.mp4"
            poster="/film/record-to-review.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="size-full object-cover"
          />
        </Phone>
        <div className="flex max-w-md flex-col gap-3">
          <h2 className="text-2xl font-semibold tracking-tight text-balance">Record. Send. Hear it back.</h2>
          <p className="text-ink-muted">
            A take goes straight from your phone to your coach. While it watches, your own still sits beside the lion.
            Then the score lands, the colors light one by one, the notes follow with the lesson behind each, and the
            verdict comes last - said aloud, with the words on screen.
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
