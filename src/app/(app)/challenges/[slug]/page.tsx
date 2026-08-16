import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { challengeBySlug, challenges, storyPhases } from "@/data/challenges";
import { lessonByVimeoId } from "@/data/lessons";
import { categoryById } from "@/data/categories";
import { CategoryChip } from "@/components/category-chip";
import { VimeoPlayer } from "@/components/vimeo-player";
import { PracticePanel } from "@/components/practice-panel";
import { CircleIcon } from "@/components/icons";

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
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {challenge.title}
        </h1>
        <p className="max-w-lg text-ink-muted">{challenge.brief}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {challenge.targetSkills.map((skill) => (
            <CategoryChip key={skill} category={skill} />
          ))}
        </div>
      </header>

      {challenge.vimeoId && (
        <VimeoPlayer vimeoId={challenge.vimeoId} title={challenge.title} />
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
          <ul className="flex flex-col gap-2">
            {warmUp.map((lesson) => {
              const cat = categoryById.get(lesson.category)!;
              return (
                <li key={lesson.vimeoId}>
                  <Link
                    href={`/skills/${lesson.category}/${lesson.vimeoId}?from=${challenge.slug}`}
                    className="flex min-h-11 items-center gap-3 rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 text-sm transition-colors hover:bg-navy-700"
                  >
                    <span className={`size-2 shrink-0 rounded-full ${cat.bgClass}`} />
                    <span className="flex-1 font-medium text-ink">{lesson.title}</span>
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
