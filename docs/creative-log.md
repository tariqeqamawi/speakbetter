# Speak Better - creative log

Commit messages say what changed; this log says why, what it did, and what was learned.
The full history up to 1 Oct 2026 is in the Creative Developer AI case study
(`~/.claude/skills/creative-developer-ai/case-studies/speak-better.md`) and on `/journey`.

## Rules learned
- Make the first step small and passive, and open the rest in order - a scary first task or a library with no clear start makes new students stop (2026-10-02, flagged by a new student via Tariq)

## Rubric snapshots
| Date | Total | Lowest three | Note |
|------|-------|--------------|------|

## Entries (newest first)

### 2026-10-02 - Skills unlock gradually, starting with Presence
- **What changed:** Until challenge 1 is done, Presence is the only colour open. Skills opens straight onto Presence with all its lessons listed and a "Start here" note with a countdown: watch any five and the other seven colors open. The other colours show a lock in both colour menus, and any link into them (search, challenge warm-ups) leads back to Presence. Five lessons watched, or challenge 1 passed, opens everything.
- **Why:** A new student went straight into Storytelling, landed on the storybook lessons, felt they had missed earlier lessons, and stopped. Tariq: "the skills unlock more gradually is going to feel more supportive for people."
- **Effect:** Expected: a clear first step, and fewer new students lost to an overwhelming library. Not measured yet.
- **Evidence:** Phone screenshots of a fresh student: /skills and /skills/storytelling both land on /skills/mindset?all=1. With five lessons watched, both open normally.
- **Notes:** "Five watched OR challenge passed" means students who were already using the library aren't locked out. The whole-app tour still visits every colour because the lock stands aside while the tour runs (`lib/tour-running.ts`). The card deck is not locked.
- **Reversible?:** Yes. Make `skillsOpen` in `src/lib/skills-lock.ts` return true.

### 2026-10-02 - Watch first, record second
- **What changed:** "Watch Any 5 Presence Skills" moved from challenge 3 to challenge 1. The speaking baseline is now challenge 2 and "Tell a Story Without Any Help" is challenge 3. Today's "Start here" card, the post-checkout page, the welcome email and the landing page's challenge preview ("Challenge 2 of 25", "the first challenge you record") were all updated to match.
- **Why:** A new student said it was daunting that the first challenge was going on video. Tariq agreed: "the first challenge should be to simply watch. That makes it more passive and less scary."
- **Effect:** Expected: more new students reach their first recording because they've built some confidence first. Not measured yet.
- **Notes:** Progress is stored per challenge slug, never by position, so students already under way kept every pass and simply see the new order. It applies to everyone.
- **Reversible?:** Yes. Move the block back in `src/data/challenges.ts` and revert the copy.
