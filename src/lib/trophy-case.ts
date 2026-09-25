import { badgeDefs, trophyArt } from "@/data/badges";
import { MATERIALS, trophyMeta } from "@/data/trophy-materials";
import type { StageTrophy } from "@/components/trophy-stage";

// Every trophy, as the case and the reveal draw them: the badge's words,
// the render, the material it was made in, and whether this student has
// won it. One place, so the case, the reveal and the preview page can
// never disagree about what a trophy is called or what it is made of.

const rank = new Map(MATERIALS.map((m, i) => [m.key, i]));

/** One trophy by id, won or not. Undefined for an id with no render. */
export function caseTrophy(id: string, earnedAt?: string | null): StageTrophy | undefined {
  const def = badgeDefs.find((b) => b.id === id);
  const meta = trophyMeta(id);
  if (!def || !meta) return undefined;
  return {
    id,
    name: def.title,
    how: def.how ?? "",
    message: def.message,
    won: !!earnedAt,
    earnedAt: earnedAt ?? undefined,
    color: meta.color,
    material: meta.material,
    grand: meta.grand,
    onceOnly: meta.onceOnly,
    ...trophyArt(id),
  };
}

/** The whole case, highest material first, won or not by `badges`. */
export function caseTrophies(badges: { id: string; earnedAt: string }[]): StageTrophy[] {
  const won = new Map(badges.map((b) => [b.id, b.earnedAt]));
  return badgeDefs
    .flatMap((b) => {
      const t = caseTrophy(b.id, won.get(b.id));
      return t ? [t] : [];
    })
    .sort((a, b) => (rank.get(a.material as never) ?? 99) - (rank.get(b.material as never) ?? 99));
}
