// The rendered takes of people recording themselves (public/selfie, made
// with Higgsfield), each with the brief shown on its recording screen.
// Plain data, so server pages can list them and the client component
// (components/selfie-take.tsx) can play them.

export const SELFIE_TAKES = [
  { src: "/selfie/maya-story", brief: "Tell a story from your life - beginning, middle and end." },
  { src: "/selfie/ben-point", brief: "Say what you love - with no filler words." },
  { src: "/selfie/claire-calm", brief: "Describe a place so vividly we can see it." },
  { src: "/selfie/jay-laugh", brief: "Pitch your idea in thirty seconds." },
] as const;

export type SelfieTakeClip = (typeof SELFIE_TAKES)[number];
