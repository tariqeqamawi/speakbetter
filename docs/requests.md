# Requests

Every outstanding ask, and a record of what shipped.

**Why this file exists.** Requests arrive in conversation, often several at a time and
often while something else is being worked on. Held only in a chat log, the only way to
check whether something was done is to scroll back and remember — which puts the work of
tracking on the person making the requests. That is backwards. This is the list, in the
repo, checkable without asking anyone.

**How it is kept.** A request is added the moment it is made, not when it is started. It
moves to Shipped only when it has been driven and verified, with the commit that did it.
Anything blocked says what on. Anything half-done says which half — a request that looks
answered but is not is worse than one that is plainly open.

Last updated: 24 September 2026.

---

## Open

### The road — the big one
Prototype lives at `/prototype/adventure`. The live `/challenges` map is untouched.

**Now blocking a landing-page section too.** The S.T.O.R.Y. section on the landing page
was cut back to the map alone on 24 September, because the challenge page beside it
duplicated the free challenge further down. Tariq's words: *"We'll update the story
framework and interactive challenges once we have the new UI done with the new terrain."*
So that section is deliberately thin until the road lands.

- [ ] **The travelling piece is the student's avatar** (`state.avatar`), not a generic map pin
- [ ] **Challenge thumbnails playing inside each circle**
- [ ] **A finish line you pass through, with a celebration** on the other side
- [ ] **Selection model:** free scrolling, but only the current challenge is clickable.
      Line the avatar up with a circle and it glows; a **Start challenge** button appears.
      Clicking a locked one says *"Unlock previous challenge first."*
- [ ] **Carry over from the current map:** unlocked trophies shown on the road, and the
      short line of what was done well on a passed take
- [ ] **Tuning:** checkpoint arrival pacing and the finish-line approach
- [ ] **When it replaces the live map:** re-record the tour film
      (`node scripts/film-tour.mjs journey`) and re-check the `adventure` tour stop's
      wording. These three are one task, never three — noted in `tour-script.ts` and
      `film-tour.mjs` too.

### Blocked on Higgsfield's daily cap
Not credits — a per-day generation limit on the grace-period account. PLUS annual
(~$39/mo) clears it and covers all of this several times over.

- [ ] **46 remaining trophy renders.** Pipeline proven end to end: render on black →
      cut alpha locally with ffmpeg → WebP ~30KB. One done (the amber glass flame).
      Use a fixed prompt template so all 47 read as one set.
- [ ] **Three landing images:** the concert seen from the back row; the lecture ticking
      by; the confident speaker under lights ("Imagine the cameras are rolling…")
- [ ] **The "going live" hero still** for the reality section — the component is built
      and falls back to text-only until the image exists (`the-reality.tsx`, `STILL`)

### Asked for and not yet started
- [ ] **Karaoke captions on the welcome and intention pages.** The guided tour has them
      (`2c9b0a1`); these two still show their paragraph all at once. The hard part is
      done — `onSay` in `talking-lion.tsx` hands the timing to whoever wants to draw it.
- [ ] **"Send it" goes straight into the tour** — no "Show me around / Straight in" choice,
      with a skip available
- [ ] **The intro video edit** — first ~20s after "screen or stage", then cut to ~1:38.
      *Needs a decision:* a real edit and re-upload (seamless, honest scrub bar, needs the
      source file) or a player-controlled seek (no re-upload, visible half-second stall,
      scrub bar shows the original duration).
- [ ] **The new tour copy** — Tariq wrote a full replacement script; it has not been sent
      through yet. The live tour is the version written from the earlier spec.
- [ ] **Master plan write-up** — ~40 commits of changes since 23 September are not yet in
      `docs/master-plan.md`

### Decided, for the record
- **The streak past day ten.** 5% a day to +50% at ten days (unchanged), then 2.5% a day
  to **+100% at thirty days**, and it stops there. Past the ceiling the reward is a
  **freeze every ten days** rather than more XP — it protects the streak instead of
  paying it, so it can keep coming forever without making the hundredth day worth more
  than the work. Still on the table if more is wanted: long-streak trophies at 14/30/100,
  a streak leaderboard, and a title beside the name on the boards.

### Waiting on Tariq
- [ ] **9 testimonials still held back.** 17 are live. Initials are the way through —
      see `initials` in `src/data/testimonials.ts` — and they must come from Tariq, never
      be derived from the mangled spelling, because initials guessed from a misheard
      surname are the same false attribution as the misspelling was.

      **Needing initials (7):** Tarns Blueweaver, Karen Lay, Preethi (her second quote),
      Teresa Ecclin, Kylie Klein, Erin Ralph, Christie Xord.

      **A different problem (2):** two quotes arrived with two names attached, so initials
      cannot fix them — somebody has to say who spoke. Which of Vincent Hazenboom /
      Lhamo Ingrik said "Bloody brilliant", and which of Liz A. Hammond / Gene East said
      "This course is the best".

      **Given so far, and worth checking the mapping:** JS, DN, RJ and LN were applied in
      file order to the four quotes that needed them — see the commit for which is which.
- [ ] **Real testimonial photographs, with permission** — the drift currently uses the
      app's initial-avatars, deliberately, because an invented portrait beside a real name
      is a picture of somebody who does not exist presented as them. Photos drop into the
      same slot.
- [ ] **Higgsfield plan** — see Blocked above
- [ ] **Supabase project + keys** — accounts are built but inert. `schema.sql`, `chat.sql`,
      `live.sql` to run; `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
      `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` to set; and
      `update profiles set role='coach'` for Tariq.
- [ ] **Redirect the duplicate hostnames.** `speakbetter-influex.vercel.app`,
      `speakbetterlive.vercel.app` and `speakbetter-git-main-influex.vercel.app` all serve
      the same build but are three different origins, so each remembers a different
      student. This is what lost Tariq's progress. One primary, two redirects.
- [ ] **"11:00 AM CST" on 3 October is actually CDT** — kept as dictated; "11:00 AM CT"
      would avoid an hour of confusion.

### Known issues, not yet fixed
- [ ] **Multi-user is not truly ready** — five gaps, all documented: no sign-out (and
      sign-in *merges* device state into the account, so a shared device cross-contaminates);
      `plan` is client-writable, so a student can grant themselves any tier from devtools;
      coaching credits have no server-side column; the board/push/reviews use a separate
      device id from the auth uuid; `watchedOn` never syncs. **Fix sign-out and the
      server-authoritative plan before creating the Supabase project**, so the schema goes
      up correct rather than needing a week-one migration.
- [ ] **Landing page middle is still long.** Much came out on 24 September (`12ae39d`) —
      the sample-data door, the studio lesson, a duplicate challenge page, a duplicate
      review, the "Hear it from Coach" button. What remains overlapping: "What's in the
      app", "See the app in action", "Speaking Spectrum", "Every lesson in the course"
      and the S.T.O.R.Y. section all answer the same question. Three would do.
- [ ] **One open question from 24 September, not yet answered by Tariq.** He asked to keep
      "Experience Speak Better" *with* the coaching review card, and separately that there
      be no second review. It was read as: one review total, in the Coach section where
      the claim is made, with the free-challenge section left as an illustration and a
      door. If the card should instead sit inside "Experience Speak Better", it is a
      one-line move.

---

## Shipped

Newest first. Each links the commit that did it; every commit message says why, not just
what.

**24 September**
- Testimonials on white; the landing page stops selling twice; four kinds of
  text that was cut off on a phone — `12ae39d`
- Tour captions, karaoke, and a dark screen for Coach's own moments — `6458f10`
- Landing: one coach demo, one baseline, wrapped lesson titles, new copy — `6458f10`
- The tab bar, the General room, chat reactions, the chest, the streak past
  day ten, folded attempts, swipeable boards, "Back to Dash" — `2351968`
- Coach rings the nav button and waits, instead of arriving over the page — `0da0f67`
- The streak pill: cascading neon, confetti, floating XP — `0da0f67`
- One wave on the Coach page, not two — `3406f13`
- Dashboard: streak explained, Community as the sixth tab, sticky Live sessions — `085385f`
- "Dash" tab; "How to use this deck" moved to the top of the cards page — `3406f13`
- The lit path down the road, and checkpoints that loom on approach — `2c30912`
- Tour films stop going stale under a rename; skills recipe repaired — `b8501bc`
- Landing: feature grid, tighter copy, wave inside the button, tier taglines — `d39d45e`
- Thumb scrubbing on every video; spoken headline; recorder off the landing page — `5ceb43e`
- Landing resequenced — Coach third, origin story down, Coach speaks — `d91810c`
- Testimonials: all 26 captured verbatim, two drifting sections, inline proof — `b01ecf1`, `5c78464`, `e8c66d1`
- Tour undimmed with a caption strip; Community pill — `305b296`
- The tour's voice rendered (19 clips) — `05a5a05`
- Today: "Current challenge" shows the challenge; Next Up thumbnail; back to Today — `032197b`
- The projected road, foundation then tuned — `05facea`, `bc6ecbf`

**23 September**
- Cards: cascading flip around the ring, and a deal that gathers and re-fans — `7beef28`
- Section tours stop starting themselves — `ec15d7f`
- STORY adventure rename, Coach introducing each phase — `7f28e7e`
- Progress file the student keeps; cross-origin recovery; server backup — `517e55a`, `c0cf87f`, `5b13903`, `4f46c1d`
- Coach speaks the onboarding — `acef57a`
- Starter / Complete / VIP Ultimate, cohort in all three — `7102ef1`
- Trophies: stem on D, warm spotlight on F, fog, zoom — `c29989e`, `a64d007`, `db937dd`, `8c44e28`
- Chat: schema, working rooms, per-challenge seeds, live sessions page — `ab43d17`, `24ec4f8`, `07e1c6d`
- The app's choppiness fixed (one keyframe, 13× main-thread work) and real glass — `728c360`
