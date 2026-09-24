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
- [ ] **Karaoke captions** — word-by-word highlighting on the welcome page, the intention
      page, and the guided tour, matching how Coach's video feedback works.
      `talking-lion.tsx` already has `phrasesOf`, `captionIndex` and `wordIndex`; it is a
      matter of exposing that rather than inventing it.
- [ ] **"Send it" goes straight into the tour** — no "Show me around / Straight in" choice,
      with a skip available
- [ ] **The intro video edit** — first ~20s after "screen or stage", then cut to ~1:38.
      *Needs a decision:* a real edit and re-upload (seamless, honest scrub bar, needs the
      source file) or a player-controlled seek (no re-upload, visible half-second stall,
      scrub bar shows the original duration).
- [ ] **Challenges streak pill** — larger, cascading neon, confetti through it every few
      seconds, floating XP icons above it
- [ ] **Coach button rings** — a ring sound, tap opens a tooltip with positive
      reinforcement and a Close button, played in place rather than navigating to Coach
- [ ] **The new tour copy** — Tariq wrote a full replacement script; it has not been sent
      through yet. The live tour is the version written from the earlier spec.
- [ ] **Master plan write-up** — ~40 commits of changes since 23 September are not yet in
      `docs/master-plan.md`

### Waiting on Tariq
- [ ] **15 testimonials still need names confirmed** — see `src/data/testimonials.ts`,
      anything marked `check: true`. Two quotes arrived with two names attached and are
      held back rather than guessed at: which of Vincent Hazenboom / Lhamo Ingrik said
      "Bloody brilliant", and which of Liz A. Hammond / Gene East said "This course is
      the best". 13 are live.
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
- [ ] **Landing page middle is still long** — sections 5–12 all say "here's what's inside"
      and overlap. Tightening to three (lessons / practice loop / gamification) is the next
      real gain in clarity.

---

## Shipped

Newest first. Each links the commit that did it; every commit message says why, not just
what.

**24 September**
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
