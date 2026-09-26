import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { CONSENT_AGREE } from "@/data/consent";
import { SUPPORT_EMAIL } from "@/data/support";

// A standard privacy policy, written for what this app actually does -
// checked against the code, not borrowed: recordings go to private
// storage, are watched by the AI and deleted (api/review); the last few
// stay on the student's own device (lib/attempt-videos); speech is kept
// as text under a student number (supabase/training.sql); usage is
// counted (lib/insights). If any of those change, this page changes.

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What Speak Better keeps, why, and for how long.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary={
        <ul className="flex flex-col gap-1.5 [&_li]:ml-5 [&_li]:list-disc">
          <li>
            <b className="text-ink">Your videos are not stored.</b> Each recording is sent to the AI for feedback and
            deleted from our systems as soon as your review is back - usually within minutes. Your latest few takes stay
            only on your own phone or computer.
          </li>
          <li>
            <b className="text-ink">Your speech is kept as text</b>, under a student number instead of your name, with
            names you mention removed. It shows you your progress and helps us make Coach a better coach.
          </li>
          <li>We never sell your information and there is no advertising.</li>
          <li>You can ask to see, download or delete your information at any time.</li>
        </ul>
      }
    >
      <section>
        <h2>1. Who we are</h2>
        <p>
          Speak Better (&ldquo;we&rdquo;, &ldquo;us&rdquo;) runs the Speak Better course, website and app. This policy
          explains what information we collect when you use it, why, who helps us process it, and your choices. It sits
          alongside our{" "}
          <Link href="/terms" className="underline">
            Terms of Service
          </Link>
          . Questions:{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </section>

      <section>
        <h2>2. What we collect</h2>
        <ul>
          <li>
            <b className="text-ink">Account details</b> - your name or display name, email address, profile picture if
            you add one, your level, and the note you write about why you&apos;re here.
          </li>
          <li>
            <b className="text-ink">Payment details</b> - handled by Stripe. We receive confirmation that you paid, your
            tier and your email, never your full card number.
          </li>
          <li>
            <b className="text-ink">Your recordings</b> - the videos you record for challenges, used only to produce your
            feedback (see section 4).
          </li>
          <li>
            <b className="text-ink">What you say, as text</b> - a transcript of your recordings and of the questions you
            ask Coach, with Coach&apos;s feedback, scores and your skill spectrum.
          </li>
          <li>
            <b className="text-ink">Your progress</b> - challenges completed, lessons watched, badges, streaks and
            similar.
          </li>
          <li>
            <b className="text-ink">Your feedback</b> - how you rate Coach&apos;s reviews, what you tell us he missed, and
            your reactions to parts of the app.
          </li>
          <li>
            <b className="text-ink">How you use the app</b> - which pages you open and for how long, and whether you
            finish the guided tour. This is counted inside the app, not by advertising trackers.
          </li>
          <li>
            <b className="text-ink">Community content</b> - messages you post in rooms, and scores or before-and-afters
            you choose to share or show on the leaderboard.
          </li>
          <li>
            <b className="text-ink">Device information</b> - basic technical details such as browser type, and a
            notification subscription if you turn reminders on.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. How we use it</h2>
        <ul>
          <li>To run the course: give you access, review your takes, and show you your progress.</li>
          <li>To have Coach answer your questions and remember how you&apos;re getting on.</li>
          <li>
            To improve Speak Better and Coach - studying de-identified transcripts, feedback and ratings to see where
            Coach is right and wrong, teaching and testing him with examples, and seeing which parts of the app help
            students most.
          </li>
          <li>
            To measure whether the course works, as totals across students (for example, &ldquo;scores rose by 19% over
            six weeks&rdquo;). Figures like these never identify anyone.
          </li>
          <li>To send you what you ask for: receipts, reminders, live-session details and replies to your emails.</li>
          <li>To keep the Service safe, prevent abuse, and meet legal obligations.</li>
        </ul>
        <p>
          <b className="text-ink">Why we are allowed to:</b> to provide the Service you bought (contract); to improve
          and measure it, which is a condition of taking the course that you agree to when you start (see below) and is
          in our legitimate interest in making the course work; and where the law requires it (legal obligation).
        </p>
      </section>

      <section>
        <h2>4. Your recordings</h2>
        <ul>
          <li>
            When you submit a take, the video goes from your device to private storage that only our servers can read.
          </li>
          <li>
            It is passed to Google&apos;s Gemini AI, which watches it and writes your feedback. As soon as the feedback
            is back, we delete the video from our storage and from Google - usually within a minute or two.
          </li>
          <li>
            Your most recent takes (the last three for each challenge) are kept only on your own device, so you can watch
            them back. They never leave it except to be reviewed. Clearing your browser&apos;s data removes them.
          </li>
          <li>
            If your tier includes personal reviews from Tariq, a recording you choose to send him is kept only until he
            has reviewed it, and then deleted.
          </li>
          <li>Voice questions you ask Coach are handled the same way: turned into text and an answer, not kept as audio.</li>
        </ul>
      </section>

      <section>
        <h2>5. Transcripts and your student number</h2>
        <p>
          <b className="text-ink">{CONSENT_AGREE}</b>
        </p>
        <p>
          In practice: every student is given a number (for example, Student #40). Transcripts, feedback, ratings and
          usage are stored against that number, not your name or email, and names you mention while speaking are removed.
          The only link between a number and a person is kept separately, locked away from the rest, and used only to
          show you your own history and to act on requests you make about your data. When we review how the course is
          going, we see numbers, never names.
        </p>
        <p>
          This follows your progress as one continuous journey - which is how the app shows you how far you&apos;ve come
          - and it is how Coach learns to coach better.
        </p>
      </section>

      <section>
        <h2>6. Who else handles your information</h2>
        <p>We use a small number of trusted providers to run Speak Better. They process information only on our behalf:</p>
        <ul>
          <li>Vercel - hosts the website and app, and the private storage recordings pass through.</li>
          <li>Google (Gemini) - the AI that reviews your takes, powers Coach and turns speech into text.</li>
          <li>Stripe - takes payments.</li>
          <li>Supabase - our database and sign-in.</li>
          <li>Vimeo - plays the lesson videos.</li>
          <li>Our email provider - sends receipts, reminders and replies.</li>
        </ul>
        <p>
          We never sell or rent your information, and we don&apos;t share it with advertisers. We may disclose it if the
          law requires us to, to protect people&apos;s safety, or - with the same protections - if Speak Better is ever
          sold or merged.
        </p>
      </section>

      <section>
        <h2>7. How long we keep it</h2>
        <ul>
          <li>Recordings: deleted from our systems as soon as your feedback is ready.</li>
          <li>Account details and progress: while you have an account, and up to 12 months after, unless you ask us to delete them sooner.</li>
          <li>Payment records: as long as tax and accounting law requires (usually several years).</li>
          <li>
            De-identified transcripts, feedback and ratings: for as long as they help us improve Speak Better. Once your
            account is deleted, the link to your student number is deleted too, so they can no longer be tied to you.
          </li>
        </ul>
      </section>

      <section>
        <h2>8. Your choices and rights</h2>
        <p>
          Depending on where you live (for example under the GDPR in the UK and EU, or the CCPA in California), you can
          ask to see the information we hold about you, correct it, download it, delete it, or object to or restrict how
          we use it. Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
            {SUPPORT_EMAIL}
          </a>{" "}
          and we will respond within 30 days. Deleting your account ends your access to the course. Text that has already
          been de-identified and used to improve Coach cannot be picked back out, because it no longer carries anything
          that links it to you. You can also complain to your local data-protection authority.
        </p>
      </section>

      <section>
        <h2>9. Keeping it safe</h2>
        <p>
          Recordings are held in private storage and deleted quickly; connections are encrypted; access to student data
          is limited to the people who need it; and the link between student numbers and people is kept apart from
          everything else. No system is perfectly secure, and if something went wrong that affected you, we would tell
          you.
        </p>
      </section>

      <section>
        <h2>10. Storage on your device</h2>
        <p>
          The app keeps your progress, preferences and recent takes in your browser&apos;s own storage so it works quickly
          and offline. We don&apos;t use advertising cookies or cross-site trackers.
        </p>
      </section>

      <section>
        <h2>11. Where your information is processed</h2>
        <p>
          Our providers may process information in the United States and other countries. Where information leaves the
          UK or EU, it is protected by the safeguards the law requires, such as standard contractual clauses.
        </p>
      </section>

      <section>
        <h2>12. Children</h2>
        <p>
          Speak Better is for adults and for teenagers aged 13 to 17 whose parent or guardian has signed them up. It is
          not for children under 13, and we don&apos;t knowingly collect their information.
        </p>
      </section>

      <section>
        <h2>13. Changes</h2>
        <p>
          If we change this policy we will update the date at the top and tell you about any important change before it
          takes effect.
        </p>
      </section>
    </LegalPage>
  );
}
