import Image from "next/image";

// How Speak Better came to be, told as moments down the page - the
// talk, the letters, the stage, the cohorts, the bottleneck, the coach.
// A moment with a picture sits beside its words, zigzagging left and
// right; a moment without one runs as a full-width band in its color,
// so the story keeps a rhythm of picture, band, picture. The pictures
// are painted in the app's own palette on its own navy (generated for
// this section, kept in public/origin), so the story reads as part of
// the product rather than a stock photo essay.

interface Moment {
  image?: string;
  year: string;
  title: string;
  body: React.ReactNode;
  accent: string;
  border: string;
}

const MOMENTS: Moment[] = [
  {
    image: "/origin/tedx.jpg",
    year: "2011",
    title: "One talk",
    accent: "text-figurative",
    border: "border-figurative/40",
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
    border: "border-body-language/40",
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
    year: "The stage and the page",
    title: "Standing ovations, and the poems to go with them",
    accent: "text-acting",
    border: "border-acting/40",
    body: (
      <>
        Along the way Tariq won multiple poetry slams and national writing competitions, received standing
        ovation after standing ovation on stage, and spoke to thousands - in person, and virtually over Zoom.
        The same skills carry across: they apply whether you&apos;re speaking on a stage or to a screen.
      </>
    ),
  },
  {
    image: "/origin/cohort.jpg",
    year: "Communicate and Captivate",
    title: "From shy to shining, take by take",
    accent: "text-storytelling",
    border: "border-storytelling/40",
    body: (
      <>
        Feeling he had cracked the code for becoming instantly memorable as a speaker, Tariq set out to prove
        the methodology, running live cohorts called <em>Communicate and Captivate</em>. Students recorded
        takes of specific challenges and uploaded them to the group, and he watched every video, giving
        detailed feedback on how to improve. It worked: people went from shy to shining, from awkward to
        awesome - starting podcasts, getting booked to speak, being invited to deliver TED talks, and finally
        finding the confidence to go live on their socials and share their message.
      </>
    ),
  },
  {
    year: "The bottleneck",
    title: "A handful of students at a time",
    accent: "text-mindset",
    border: "border-mindset/40",
    body: (
      <>
        The problem was that it relied on him watching every video, which meant he could only serve a handful
        of students at a time. That desire to serve many became the driving motivation behind designing a
        system that would duplicate his abilities as a speaking coach - one that could serve hundreds, if not
        thousands, of students simultaneously. Over many years, he built the Speak Better methodology and
        framework.
      </>
    ),
  },
  {
    image: "/origin/coach.jpg",
    year: "Now",
    title: "A coach trained on the method",
    accent: "text-structure",
    border: "border-structure/40",
    body: (
      <>
        Now, thanks to advances in technology and the ability to train an AI coach that actually watches your
        videos and knows what it&apos;s looking for, Tariq can realize his dream: helping a million people
        become the messengers of their mission and the voice of their values. Speak Better is born - the
        fastest, most effective way to master public speaking, for the stage or for the screen.
      </>
    ),
  },
];

export function OriginStory() {
  let pictured = 0;
  return (
    <section className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-faint">Who&apos;s teaching this</span>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How Speak Better came to be</h2>
      </div>
      <ol className="flex w-full flex-col gap-10 sm:gap-14">
        {MOMENTS.map((m) => {
          if (!m.image) {
            return (
              <li
                key={m.title}
                className={`flex flex-col items-center gap-2 rounded-2xl border bg-navy-800/60 px-6 py-7 text-center sm:px-10 ${m.border}`}
              >
                <span className={`text-[0.65rem] font-bold uppercase tracking-[0.3em] ${m.accent}`}>{m.year}</span>
                <h3 className="text-2xl font-semibold tracking-tight text-ink text-balance">{m.title}</h3>
                <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">{m.body}</p>
              </li>
            );
          }
          const flip = pictured++ % 2 === 1;
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
