import Link from "next/link";

const categories = [
  { name: "Storytelling techniques", className: "bg-storytelling" },
  { name: "Figurative language", className: "bg-figurative" },
  { name: "Acting skills for speakers", className: "bg-acting" },
  { name: "Structure & framing", className: "bg-structure" },
  { name: "Speaker's mindset & psychology", className: "bg-mindset" },
  { name: "Body language & physical expression", className: "bg-body-language" },
  { name: "Advanced tips & tricks", className: "bg-advanced" },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-12 py-6">
      <section className="flex flex-col gap-4">
        <div className="spectrum-rule h-1 w-24 rounded-full" />
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance">
          Speaking is a practiced skill. Practice it.
        </h1>
        <p className="max-w-lg text-lg text-ink-muted">
          Short lessons. Real on-camera challenges. Feedback in full color.
          Speak Better is built on practice, not playback.
        </p>
        <div className="mt-2 flex gap-3">
          <Link
            href="/challenges"
            className="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-navy-900 transition-opacity hover:opacity-90"
          >
            Start a challenge
          </Link>
          <Link
            href="/skills"
            className="rounded-lg border border-navy-600 px-5 py-2.5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            Browse skills
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-ink-faint">
          The spectrum of speaking
        </h2>
        <ul className="flex flex-wrap gap-2">
          {categories.map(({ name, className }) => (
            <li
              key={name}
              className="flex items-center gap-2 rounded-full border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-muted"
            >
              <span className={`size-2 rounded-full ${className}`} />
              {name}
            </li>
          ))}
        </ul>
        <p className="max-w-lg text-sm text-ink-faint">
          Every skill in the course belongs to one of seven color-coded
          categories. The more colors your talk lights up, the more dynamic a
          speaker you&apos;re becoming.
        </p>
      </section>
    </div>
  );
}
