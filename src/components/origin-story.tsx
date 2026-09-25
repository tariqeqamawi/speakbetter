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

// Tariq's own telling, 25 September 2026 - his words, lightly edited
// for reading, in the order he gave them.
const MOMENTS: Moment[] = [
  {
    image: "/origin/tedx.jpg",
    year: "Bali, 2011",
    title: "A story told at a table",
    accent: "text-figurative",
    border: "border-figurative/40",
    body: (
      <>
        This all began late one night in Bali, at the Tugu Hotel, in 2011. Tariq sat opposite a woman, Susie
        Johnston, who asked him to share the story of how he got to Bali. The talk he delivered, sitting there at
        the table, was enough for her to take matters into her own hands. A few days later an email arrived from
        Deborah Berardi: <em>&ldquo;Hi Tariq, you&apos;ve come highly recommended by Susie Johnston to be a speaker
        for TEDx. We&apos;re bringing it to Bali. We&apos;d love to meet and hear your story.&rdquo;</em>
      </>
    ),
  },
  {
    image: "/origin/letters.jpg",
    year: "His first speech",
    title: "A time capsule",
    accent: "text-body-language",
    border: "border-body-language/40",
    body: (
      <>
        A month later - after studying the talks of the greats, distilling their style and their techniques (Les
        Brown, Martin Luther King, John F. Kennedy, Tony Robbins, Bob Proctor and many more) - Tariq wrote and
        delivered his TEDx talk, his first-ever public speech. What happened next floored him. It racked up more
        than ten times the views of every other talk at the conference, and people started reaching out:{" "}
        <em>I watched your talk and quit my job. I watched your talk and bought a plane ticket. I watched your talk
        and proposed.</em> He had given it months before, and it was still creating value. That was when he
        understood the true power of speaking: it immortalizes you on video, a time capsule that reaches people
        wherever they are, whenever they need it most. He knew this was a craft he wanted to master.
      </>
    ),
  },
  {
    year: "Stages around the world",
    title: "Standing ovations",
    accent: "text-acting",
    border: "border-acting/40",
    body: (
      <>
        Tariq went on to speak at sold-out transformational retreats around the world, and at festivals and
        institutions including Bali Spirit Festival, Freedom Fest in Australia and in Budapest, the Stockholm School
        of Economics in St. Petersburg, and Wild and Free in Sweden - routinely to standing ovations.
      </>
    ),
  },
  {
    year: "A formula, and a method",
    title: "Speeches for others",
    accent: "text-storytelling",
    border: "border-storytelling/40",
    body: (
      <>
        He realized a standing ovation was a formula - and that shifting an audience, so they leave as someone
        different from who walked in, was a methodology. So he began writing speeches for other high-level
        entrepreneurs: Brian Kelly, founder of 9D Breathwork, whose talk went on to get him a TED talk; Billage W.
        Cardos, an eight-figure entrepreneur, for his speech to 8,000 people at Enagic&apos;s 50th anniversary in
        Okinawa, Japan; and Dr. Michelle Patrick, whose talk on holistic health in Miami earned a standing ovation.
      </>
    ),
  },
  {
    image: "/origin/cohort.jpg",
    year: "Communicate and Captivate",
    title: "This method really works",
    accent: "text-mindset",
    border: "border-mindset/40",
    body: (
      <>
        Next came live virtual containers called <em>Communicate and Captivate</em>: a handful of students at a time,
        through interactive speaking challenges, uploading videos of themselves speaking into a Facebook group - and
        Tariq watching every one and giving feedback from the methodology he had distilled. Without knowing it, he
        was creating what would become Speak Better: a full, color-coded method across seven areas of speaking, with
        the real-world practice and repertoire of skills he wished he had been taught. He watched his students go
        from awkward and nervous on camera on day one to confident and eloquent by week four - starting podcasts,
        going live on their socials without fear, being complimented by their peers, and booking speaking gigs of
        their own. That&apos;s when he saw it: this method really works.
      </>
    ),
  },
  {
    image: "/origin/coach.jpg",
    year: "Now",
    title: "Coach the Lion",
    accent: "text-structure",
    border: "border-structure/40",
    body: (
      <>
        Fast forward a few years, and through the advances in technology and AI, Tariq created his Speak Better
        mascot - a lion with a mane of true colors who could roar on screen or stage. He put all of his methodology,
        his skills and his coaching approach into Coach the Lion, and for the first time is guiding a live cohort to
        experience it for themselves.
      </>
    ),
  },
  {
    year: "The mission",
    title: "The voice of their values",
    accent: "text-advanced",
    border: "border-advanced/40",
    body: (
      <>
        Tariq&apos;s mission is to empower a generation to become the voice of their values and the messengers of
        their mission. Now, through Speak Better, he can serve everyone who wants to become the speaker they were
        always destined to be.
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
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">The origin story of Speak Better</h2>
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
