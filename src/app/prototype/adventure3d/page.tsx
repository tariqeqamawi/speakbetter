import type { Metadata } from "next";
import { challenges, storyPhases } from "@/data/challenges";
import { challengeChatter } from "@/data/challenge-chatter";
import { AdventureScreen } from "@/components/adventure/adventure-screen";
import type { WorldPhase, WorldStop } from "@/components/adventure/adventure-world";

export const metadata: Metadata = { title: "The adventure, in 3D" };

// The S.T.O.R.Y. road in real 3D, before it replaces the live map. A
// student part-way through: seven challenges done, on the eighth.

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

const phases: WorldPhase[] = storyPhases.map((p) => ({
  id: p.id,
  name: p.name,
  color: HEX[p.bgClass.replace("bg-", "")] ?? "#ffffff",
}));

const stops: WorldStop[] = challenges.map((c, i) => ({
  slug: c.slug,
  title: c.title,
  phase: c.phase,
  state: i < 7 ? "done" : i === 7 ? "here" : i < 10 ? "ahead" : "locked",
  image: c.vimeoId ? `/thumbs/${c.vimeoId}.jpg` : "/lion-head.png",
  trophy: `/trophy/challenge-${c.slug}.webp`,
  score: i < 7 ? [82, 91, 77, 88, 79, 94, 85][i] : undefined,
  // Stand-ins for the cohort: a few people at the checkpoints just
  // ahead, where most of a cohort is at any moment.
  classmates: i === 7 ? ["Maya Chen", "Leo"] : i === 8 ? ["Amara", "Jonas Berg", "Priya"] : i === 10 ? ["Sam"] : undefined,
  comment: challengeChatter[c.slug]?.[0] && {
    name: challengeChatter[c.slug][0].name,
    body: challengeChatter[c.slug][0].body,
  },
}));

export default function Adventure3DPage() {
  return <AdventureScreen stops={stops} phases={phases} fallbackAvatar="/prototype/tariq-avatar.jpg" />;
}
