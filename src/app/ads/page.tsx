import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ads",
  robots: { index: false, follow: false },
};

// The Instagram and Facebook ads, for Tariq to look over and download -
// an unlisted page, kept out of search. Videos are 9:16 for Reels and
// Stories (captions sit clear of the app's buttons, built for sound off);
// images are 4:5 for the feed. Each comes with the copy to paste into
// Ads Manager.

const VIDEOS = [
  {
    file: "video-1-the-freeze",
    name: "The Freeze",
    angle:
      "Problem, then the fix: the moments people freeze on camera, why watching more videos won't help, then the app and Coach.",
    headline: "Speak More Confidently On Video",
    text: "You hit record... and freeze. Speak Better is a 6-week course where you actually practice on camera: 83 short lessons, 25 challenges, and an AI coach that reviews every take. The founding cohort starts October 3 - 20 spots.",
  },
  {
    file: "video-2-inside-the-app",
    name: "Inside The App",
    angle:
      "Show the product: the 4D ride as the hook, then lessons, flashcards, the dashboard and Coach's review.",
    headline: "The Speaking Course That Plays Like A Game",
    text: "This is a speaking course. 83 lessons of 1-2 minutes, digital flashcards, XP, ranks and trophies - and an AI coach on every take. Plus 6 weekly live sessions with Tariq. Starts October 3.",
  },
  {
    file: "video-3-learn-from-tariq",
    name: "Learn From Tariq",
    angle:
      "Authority and outcome: Tariq's credentials, speaking naturally on camera, on a podcast, on socials - a student's words - the guarantee.",
    headline: "Learn From A TEDx Speaker",
    text: "Speak naturally on camera, on your podcast and on your socials. Learn from TEDx speaker and slam poetry winner Tariq EQ Amawi - 6 weekly live sessions, an AI coach on every take, and a 14-day money-back guarantee.",
  },
];

const IMAGES = [
  {
    file: "image-1-hook",
    name: "The Promise",
    headline: "Speak More Confidently On Video",
    text: "Overcome your fears and tell your stories - in a 6-week course built on practice, not playback. Starts October 3. 20 spots, from $299.",
  },
  {
    file: "image-2-is-this-you",
    name: "Is This You?",
    headline: "Freeze On Camera? Read This.",
    text: "Shy on camera, full of ums and ahs, losing your place mid-sentence? Speak Better gives you 6 weeks of real practice - with an AI coach that reviews every take.",
  },
  {
    file: "image-3-proof",
    name: "Proof + Guarantee",
    headline: "Stop The 'Um' In Weeks",
    text: "\"In only week 2 I already learned how to stop the 'um'.\" - Sharon Ho. Join the founding cohort of Speak Better. 14-day money-back guarantee, for any reason.",
  },
  {
    file: "image-4-inside-the-app",
    name: "Inside The App",
    headline: "The Speaking Course That Plays Like A Game",
    text: "83 lessons, 25 challenges, XP and trophies - and an AI coach that watches your videos and tells you exactly what to work on next.",
  },
  {
    file: "image-5-tariq",
    name: "Learn From Tariq",
    headline: "Learn From A TEDx Speaker",
    text: "Tariq EQ Amawi - TEDx speaker, slam poetry winner, national writing winner - teaches you to speak on camera with ease. 6 weekly live sessions + an AI coach. Starts October 3.",
  },
];

function Copy({ headline, text }: { headline: string; text: string }) {
  return (
    <dl className="flex flex-col gap-2 text-left text-sm">
      <div>
        <dt className="text-xs font-bold uppercase tracking-[0.18em] text-ink-faint">
          Headline
        </dt>
        <dd className="font-semibold text-ink">{headline}</dd>
      </div>
      <div>
        <dt className="text-xs font-bold uppercase tracking-[0.18em] text-ink-faint">
          Primary text
        </dt>
        <dd className="text-ink-muted text-pretty">{text}</dd>
      </div>
    </dl>
  );
}

export default function AdsPage() {
  return (
    <div className="flex flex-col gap-14 py-8">
      <header className="flex flex-col items-center gap-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-faint">
          Speak Better
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Instagram &amp; Facebook Ads
        </h1>
        <p className="max-w-xl text-sm text-ink-muted text-balance">
          3 videos (9:16 - Reels and Stories, made to work with the sound off)
          and 5 images (4:5 - the feed). Download each, and paste its copy into
          Ads Manager. Call to action: Learn More, to speakbetter.app.
        </p>
      </header>

      <section className="flex flex-col items-center gap-6">
        <h2 className="text-2xl font-semibold tracking-tight">Video Ads</h2>
        <div className="grid w-full max-w-6xl gap-8 md:grid-cols-3">
          {VIDEOS.map((v) => (
            <figure
              key={v.file}
              className="flex flex-col gap-4 rounded-2xl border border-navy-600 bg-navy-900/60 p-4"
            >
              <video
                src={`/ads/${v.file}.mp4`}
                poster={`/ads/${v.file}.jpg`}
                controls
                playsInline
                preload="none"
                className="aspect-[9/16] w-full rounded-xl bg-navy-950"
              />
              <figcaption className="flex flex-col gap-3">
                <b className="text-lg font-semibold text-ink">{v.name}</b>
                <p className="text-sm text-ink-muted text-pretty">{v.angle}</p>
                <Copy headline={v.headline} text={v.text} />
                <a
                  href={`/ads/${v.file}.mp4`}
                  download
                  className="self-start rounded-full bg-figurative px-4 py-2 text-sm font-bold text-navy-950"
                >
                  Download video
                </a>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center gap-6">
        <h2 className="text-2xl font-semibold tracking-tight">Image Ads</h2>
        <div className="grid w-full max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {IMAGES.map((im) => (
            <figure
              key={im.file}
              className="flex flex-col gap-4 rounded-2xl border border-navy-600 bg-navy-900/60 p-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- the exact file to download, not a resized copy */}
              <img
                src={`/ads/${im.file}.png`}
                alt={im.name}
                className="w-full rounded-xl"
              />
              <figcaption className="flex flex-col gap-3">
                <b className="text-lg font-semibold text-ink">{im.name}</b>
                <Copy headline={im.headline} text={im.text} />
                <a
                  href={`/ads/${im.file}.png`}
                  download
                  className="self-start rounded-full bg-figurative px-4 py-2 text-sm font-bold text-navy-950"
                >
                  Download image
                </a>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
