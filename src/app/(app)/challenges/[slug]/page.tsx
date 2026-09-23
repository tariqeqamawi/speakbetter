import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { challengeBySlug, challenges, storyPhases } from "@/data/challenges";
import { lessonByVimeoId } from "@/data/lessons";
import { categoryById } from "@/data/categories";
import { CategoryChip } from "@/components/category-chip";
import { XpBadge } from "@/components/xp-badge";
import { challengeXp } from "@/lib/progress";
import { LazyVimeoPlayer } from "@/components/lazy-vimeo-player";
import { PracticePanel } from "@/components/practice-panel";
import { CircleIcon } from "@/components/icons";
import { PlayFillIcon } from "@/components/player-icons";

export function generateStaticParams() {
  return challenges.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(props: PageProps<"/challenges/[slug]">) {
  const { slug } = await props.params;
  const challenge = challengeBySlug.get(slug);
  return { title: challenge ? challenge.title : "Challenge" };
}

export default async function ChallengePage(props: PageProps<"/challenges/[slug]">) {
  const { slug } = await props.params;
  const challenge = challengeBySlug.get(slug);
  if (!challenge) notFound();

  const phase = storyPhases.find((p) => p.id === challenge.phase)!;
  const warmUp = challenge.relatedLessonIds
    .map((id) => lessonByVimeoId.get(id))
    .filter((l) => l !== undefined);

  return (
    <div className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <BackLink href="/challenges">Challenges</BackLink>
        <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">
          {phase.id} - {phase.name}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            {challenge.title}
          </h1>
          {/* Several times what a lesson pays: a lesson is watched, a
              challenge is performed, recorded and judged. */}
          <XpBadge
            xp={challengeXp(challenge)}
            size="md"
            upTo={!challenge.passive}
            className={`border border-navy-600 ${phase.textClass}`}
          />
        </div>
        <p className="max-w-lg text-ink-muted">{challenge.brief}</p>
        <div className="mt-1 flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-ink-faint">Speaking colours used</span>
          <div className="flex flex-wrap gap-1.5">
            {challenge.targetSkills.map((skill) => (
              <CategoryChip key={skill} category={skill} />
            ))}
          </div>
        </div>
      </header>

      {/* A poster until it's played: the embed's player script is the
          heaviest thing on the page, and the student may be here to
          record, not to rewatch the brief. */}
      {challenge.vimeoId && (
        <LazyVimeoPlayer
          vimeoId={challenge.vimeoId}
          title={challenge.title}
          poster={`/thumbs/${challenge.vimeoId}.jpg`}
        />
      )}

      <section className="rounded-xl border border-navy-600 bg-navy-800 p-4">
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-ink-faint">
          What success looks like
        </h2>
        <ul className="flex flex-col gap-1.5">
          {challenge.criteria.map((criterion) => (
            <li key={criterion} className="flex items-start gap-2 text-sm text-ink">
              <CircleIcon className="mt-1 size-3.5 shrink-0 text-ink-faint" />
              {criterion}
            </li>
          ))}
        </ul>
      </section>

      {warmUp.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wider text-ink-faint">
            Warm up - a few minutes of skills
          </h2>
          {/* Big stills with a play mark: these are video lessons, and a
              line of text didn't look like one. */}
          <ul className="grid gap-3 sm:grid-cols-2">
            {warmUp.map((lesson) => {
              const cat = categoryById.get(lesson.category)!;
              return (
                <li key={lesson.vimeoId}>
                  <Link
                    href={`/skills/${lesson.category}/${lesson.vimeoId}?from=${challenge.slug}`}
                    className={`group flex flex-col overflow-hidden rounded-xl border border-navy-600 bg-navy-800 transition-colors hover:border-current ${cat.textClass}`}
                  >
                    <span className="relative block aspect-video w-full overflow-hidden bg-navy-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/thumbs/${lesson.vimeoId}.jpg`}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-navy-950/80 to-transparent" />
                      <span className="absolute inset-0 grid place-items-center">
                        <span className="grid size-12 place-items-center rounded-full border border-white/25 bg-navy-950/70 text-ink backdrop-blur-sm transition-transform group-hover:scale-110">
                          <PlayFillIcon className="size-5 translate-x-0.5" />
                        </span>
                      </span>
                      <span className={`absolute left-2 top-2 rounded-full bg-navy-950/80 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${cat.textClass}`}>
                        {cat.short}
                      </span>
                    </span>
                    <span className="p-3 text-sm font-medium text-ink">{lesson.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <PracticePanel challenge={challenge} />
    </div>
  );
}
