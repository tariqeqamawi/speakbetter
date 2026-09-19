import Image from "next/image";

// How Speak Better came to be, told in four moments, picture beside
// words, zigzagging down the page - the talk, the letters, the cohorts,
// the coach. The pictures are painted in the app's own palette on its
// own navy (generated for this section, kept in public/origin), so the
// story reads as part of the product rather than a stock photo essay.

const MOMENTS: { image: string; year: string; title: string; body: React.ReactNode; accent: string }[] = [
  {
    image: "/origin/tedx.jpg",
    year: "2011",
    title: "One talk",
    accent: "text-figurative",
    body: (
      <>
        Tariq&apos;s very first public speech was a TEDx talk. After diving deep into what made the most
        memorable speeches so memorable, he built his out of stories, poetic turns of phrase, mic-drop
        moments, and a moral worth keeping. It went on to gather more than ten times the views of every other
        talk at the conference.
      </>
    ),
  },
  {
    image: "/origin/letters.jpg",
    year: "The letters",
    title: "Not something you listen to",
    accent: "text-body-language",
    body: (
      <>
        Then people started writing. <em>I watched your talk and quit my job. I watched your talk and bought
        a plane ticket. I watched your talk and proposed.</em> That was when Tariq understood what speaking
        is: not something you listen to, but something you experience - a transformation - and he set out
        to deepen the craft and teach others to do on stage what he had done.
      </>
    ),
  },
  {
    image: "/origin/cohort.jpg",
    year: "The cohorts",
    title: "Hundreds of students, take by take",
    accent: "text-storytelling",
    body: (
      <>
        Hundreds of students went from shy and nervous on camera to speaking confidently and competently
        within weeks - starting podcasts, getting booked to speak. He has helped others to standing
        ovations, and been the speechwriter behind talks given to rooms of eight thousand. He is the coach
        people trust to get them ready for the stage - and after running live cohort after live cohort,
        giving feedback on every take, the Speak Better methodology was born.
      </>
    ),
  },
  {
    image: "/origin/coach.jpg",
    year: "Now",
    title: "A coach trained on the method",
    accent: "text-structure",
    body: (
      <>
        Thanks to what technology makes possible, Tariq has trained an AI coach on that methodology so he can
        serve many - a lion that watches every take the way he did in the room. Welcome to the fastest, most
        effective way to master public speaking, for the stage or for the screen.
      </>
    ),
  },
];

export function OriginStory() {
  return (
    <section className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-faint">Who&apos;s teaching this</span>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How Speak Better came to be</h2>
      </div>
      <ol className="flex w-full flex-col gap-10 sm:gap-14">
        {MOMENTS.map((m, i) => {
          const flip = i % 2 === 1;
          return (
            <li
              key={m.title}
              className={`flex flex-col items-center gap-5 sm:gap-10 ${flip ? "sm:flex-row-reverse" : "sm:flex-row"}`}
            >
              <div className={`relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-navy-600 bg-navy-950 shadow-2xl shadow-navy-950/80 sm:w-[54%] ${m.accent}`}>
                <Image
                  src={m.image}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 54vw, 100vw"
                  className="object-cover"
                />
                <span className="absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_color-mix(in_oklab,currentColor_35%,transparent)]" />
              </div>
              <div className={`flex w-full flex-col gap-2 sm:w-[46%] ${flip ? "sm:text-right sm:items-end" : ""}`}>
                <span className={`text-[0.65rem] font-bold uppercase tracking-[0.3em] ${m.accent}`}>{m.year}</span>
                <h3 className="text-2xl font-semibold tracking-tight text-ink">{m.title}</h3>
                <p className="max-w-md text-sm leading-relaxed text-ink-muted">{m.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
