# Speak Better

A speaking course built on practice, not playback. Students watch short skill lessons, attempt real on-camera speaking challenges, and an AI coach that genuinely watches their video scores each performance across a color-coded spectrum of speaking skills — storytelling, body language, figurative language, and more. The wider the spectrum, the more dynamic the speaker.

Part of a three-part **trinity speaking system**: this course, a companion book, and a color-coded card deck, all built from the same skill material.

## Documents

- **[Master plan](docs/master-plan.md)** — the full product vision in plain English: the method, the two pillars (Skills and Challenges), the color-spectrum scoring system, the AI coach, levels, gamification, community, and the chosen stack.
- **[Build plan](docs/build-plan.md)** — the phased path from this repo to the full product, easiest and most self-contained phases first.

## Status

Phases 0–5 of the [build plan](docs/build-plan.md) are built and verified locally, plus PWA installability. External services (Stripe, Gemini, Supabase, Sentry/PostHog) are deliberately stubbed at marked `INTEGRATION SWAP POINT` comments — search the codebase for that phrase to find every seam. Run locally:

```
npm install
npm run dev
```

## Stack

Light Brands standard (via QIE): Next.js · React · TypeScript · Tailwind · Supabase · Vercel · Gemini (video-understanding AI review) · Stripe · Sentry · PostHog. Full detail in [master plan §19](docs/master-plan.md#19--the-stack).
