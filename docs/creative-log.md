# Speak Better - creative log

Commit messages say what changed; this log says why, what it did, and what was learned.
The full history up to 1 Oct 2026 is in the Creative Developer AI case study
(`~/.claude/skills/creative-developer-ai/case-studies/speak-better.md`) and on `/journey`.

## Rules learned
- Make the first step small and passive, and open the rest in order - a scary first task or a library with no clear start makes new students stop (2026-10-02, flagged by a new student via Tariq)
- One way to give feedback across a product - the same three answers (👌 🤏 👎) everywhere, so students learn it once (2026-10-02, Tariq)
- A question must name what's on screen - "how's the dial" under the grid gets meaningless answers (2026-10-02, Tariq)

## Rubric snapshots
| Date | Total | Lowest three | Note |
|------|-------|--------------|------|

## Entries (newest first)

### 2026-10-02 - Feedback in Coach's three, named for the view
- **What changed:** Every "How's ... working for you?" line moved from 🔥 / 👇 to 👌 working, 🤏 partly, 👎 not working, the same three used to rate Coach's reviews. 🤏 also opens "What would make it better?". On Skills the line says "the grid" or "the dial" to match the view. The section note's eye icon became an "i", and its panel is now drawn on the top layer and kept 12px inside the screen (it was running off the left edge on phones: x = -13px on Skills, -55px on Cards).
- **Why:** Tariq: "Let's actually have it be consistent with the coaching." Two answers had no option for something that half works. The Skills line asked about the dial while showing the grid.
- **Effect:** One feedback language across the app, plus a middle answer that tells us what to fix. The admin dashboards count 🤏.
- **Reversible?:** Yes. Reactions are stored as love / partly / dislike.

### 2026-10-02 - Colours open one at a time
- **What changed:** Replaces "Presence, then everything". The colours open in order: Presence, Body, Voice, Tell, Paint, Act, Frame, Pro. Five lessons watched in a colour (or all of them if it has fewer) opens the next. While anything is locked, Skills shows the grid in learning order (no dial), with the current colour lit and locked colours dimmed with "Opens after 5 Body lessons". Inside the current colour, a banner counts down. A challenge's warm-up lessons open when reached from that challenge (`?from=<slug>`), but stay locked when browsing Skills. Anyone who watched a lesson or sent a take before 2 Oct keeps everything open. Posture Warm Up is now second in Body.
- **Why:** Tariq: "if somebody is going through this course, then it needs to unlock in a certain order... otherwise it's going to be daunting." The order goes from feeling at ease on camera, to body and voice, to what you say, to shaping it, to the advanced craft.
- **Evidence:** Browser test on a fresh student. Everything leads to Presence. With 5 Presence lessons watched, Body opens and Voice redirects to Body. A Storytelling warm-up opens with `?from=story-without-help` and redirects without it.
- **Reversible?:** Yes. `openCount` in `src/lib/skills-lock.ts` returns 8 to open everything.

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
