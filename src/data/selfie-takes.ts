import { challenges } from "@/data/challenges";

// The rendered takes of people recording themselves (public/selfie, made
// with Higgsfield), each on a real challenge - so the recording screen
// over them shows that challenge's brief and the lines that complete it,
// exactly as the app's recorder does. Plain data, so server pages can
// list them and the client component (components/selfie-take.tsx) can
// play them.

const TAKES = [
  { src: "/selfie/maya-story", challenge: "story-without-help", brief: "Tell a story from your life - beginning, middle and end." },
  { src: "/selfie/ben-point", challenge: "no-filler-words", brief: "Say what you love - with no filler words." },
  { src: "/selfie/claire-calm", challenge: "describe-vividly", brief: "Describe a place so vividly we can see it." },
  { src: "/selfie/jay-laugh", challenge: "thirty-second-pitch", brief: "Pitch your idea in thirty seconds." },
] as const;

export const SELFIE_TAKES = TAKES.map((t) => ({
  ...t,
  criteria: challenges.find((c) => c.slug === t.challenge)?.criteria ?? [],
}));

export type SelfieTakeClip = (typeof SELFIE_TAKES)[number];
