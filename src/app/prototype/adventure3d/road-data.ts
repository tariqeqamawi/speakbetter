import { challenges, storyPhases } from "@/data/challenges";
import { challengeChatter } from "@/data/challenge-chatter";
import type { WorldPhase, WorldStop } from "@/components/adventure/adventure-world";

// The preview's road: a student part-way through - seven challenges
// done, on the eighth. Shared by the 3D road and the sky comparison.

// three.js cannot read the app's CSS variables, so the five phase
// colours are spelled out here - the same values as --color-* in
// globals.css.
const HEX: Record<string, string> = {
  mindset: "#1fe890",
  "body-language": "#22d9f5",
  storytelling: "#ffd60a",
  acting: "#ff4a2b",
  structure: "#f53de0",
};

export const phases: WorldPhase[] = storyPhases.map((p) => ({
  id: p.id,
  name: p.name,
  color: HEX[p.bgClass.replace("bg-", "")] ?? "#ffffff",
}));

export const stops: WorldStop[] = challenges.map((c, i) => ({
  slug: c.slug,
  title: c.title,
  phase: c.phase,
  state: i < 7 ? "done" : i === 7 ? "here" : i < 10 ? "ahead" : "locked",
  image: c.vimeoId ? `/thumbs/${c.vimeoId}.jpg` : "/lion-head.png",
  trophy: `/trophy/challenge-${c.slug}.webp`,
  score: i < 7 ? [82, 91, 77, 88, 79, 94, 85][i] : undefined,
  // Stand-ins for the cohort: a few people at the checkpoints just
  // ahead, where most of a cohort is at any moment.
  // Four with a profile picture, two without - initials until they add one.
  classmates:
    i === 7
      ? [{ name: "Maya Chen", avatar: "/prototype/classmates/maya.jpg" }, { name: "Leo" }]
      : i === 8
        ? [
            { name: "Amara", avatar: "/prototype/classmates/amara.jpg" },
            { name: "Jonas Berg", avatar: "/prototype/classmates/jonas.jpg" },
            { name: "Priya" },
          ]
        : i === 10
          ? [{ name: "Sam", avatar: "/prototype/classmates/sam.jpg" }]
          : undefined,
  comment: challengeChatter[c.slug]?.[0] && {
    name: challengeChatter[c.slug][0].name,
    body: challengeChatter[c.slug][0].body,
  },
}));

