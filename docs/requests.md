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

### The road — the big one, and now specified

**Decided 24 Sep: real 3D (three.js), built in four stages at a new preview page, the live
map untouched until the swap.**
- [ ] Stage 1 - the world: continuous terrain in the five phase colours, fog and light, the lit
      road, a camera that travels as you drag (down = forward), checkpoints with their
      thumbnails, the finish gate. Phone-first.
- [ ] Stage 2 - life: phase banners flying at you, flags at boundaries, the S.T.O.R.Y. jump bar,
      Coach beside the road three times with his three lines, the avatar as the traveller.
- [ ] Stage 3 - play: the selection model, trophies and what-went-well carried over, surprises,
      the finish celebration.
- [ ] Stage 4 - swap it live, re-record the tour film, re-check the tour stop's wording.

**Tariq's spec, 24 September, in his words and to be built next:**

- **One continuous terrain**, not five scenes. It changes colour as you pass from one set
  of challenges into the next.
- **Tapping a letter of S.T.O.R.Y. jumps you** to that stretch of the terrain.
- **A ribbon or banner announces each phase** — "S: Start With Awareness" — that travels
  toward you and off the screen as you enter it. The next one raises a flag saying
  "Train Your Instrument", so crossing a boundary is something you SEE rather than infer
  from a colour change.
- **A lit line down the centre** is the path the player moves along.
- **The scroll is flipped**: dragging a thumb DOWN the screen moves you forward along the
  road. (It is currently the other way, which is correct for a page and wrong for a road.)
- **Surprises along the way**, triggered by completing challenges — which other students
  are on the challenge you are on; a comment somebody left on it. Small, occasional, and
  tied to progress.
- **Coach standing beside the road, three times.** He appears as an icon; as you move
  past his head he animates and speaks. His words, verbatim:

  1. *"Welcome to the adventure of a lifetime, becoming the speaker you've always wanted
     to be."*
  2. *"Keep going. I'm here as your guide. Who knows what you'll discover about yourself
     along the way?"*
  3. *"The path to mastery is littered with challenges. Luckily for you, they're fun."*

  These need rendering through `scripts/build-welcome.mjs` (it takes clip names now), and
  they should speak in **captions** — one line at a time, word lit — like the tour and the
  welcome page, using `onSay` in `talking-lion.tsx` and the shared `Caption` component.

**Still true from before:** the travelling piece should be the student's avatar
(`state.avatar`), challenge thumbnails play inside the circles, there is a finish line to
pass through with a celebration on the other side, and the selection model is
free-scroll / only-the-current-one-clickable / "Unlock previous challenge first".

**And the three that must follow the swap,** as one task and never three: re-record the
tour film (`node scripts/film-tour.mjs journey`), re-check the `adventure` tour stop's
wording, and carry over the unlocked trophies and the what-went-well line from the old map.


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

### Higgsfield — unblocked 24 September
Tariq topped up the account, so the cap is gone.

- [x] **All 47 trophy renders — done** (`bb75ff6`), re-rendered in five materials (`52e2818`), staged on the podium (`fb7b687`). Prompts in
      `scripts/trophy-prompts.mjs`, alpha cut and WebP in `scripts/build-trophies.mjs`,
      and `trophyArt(id)` in `data/badges.ts` is the one way to ask for a picture.
      Preview: **/prototype/spotlight**.
- [ ] **Decide where they replace the circular medallions** (70 now, with the gold twins). The renders are tall
      objects (2:3); `BadgeMedal` crops to a circle, so they cannot simply be swapped in.
      The trophy case, the dashboard trophy panel and the map's won-trophy markers each
      need a look. Nothing has been changed outside the prototype.
- [ ] **Three landing images:** the concert seen from the back row; the lecture ticking
      by; the confident speaker under lights ("Imagine the cameras are rolling…")
- [ ] **The "going live" hero still** for the reality section — the component is built
      and falls back to text-only until the image exists (`the-reality.tsx`, `STILL`)

### Asked for and not yet started

### Decided, for the record
- **The streak past day ten.** 5% a day to +50% at ten days (unchanged), then 2.5% a day
  to **+100% at thirty days**, and it stops there. Past the ceiling the reward is a
  **freeze every ten days** rather than more XP — it protects the streak instead of
  paying it, so it can keep coming forever without making the hundredth day worth more
  than the work. Still on the table if more is wanted: long-streak trophies at 14/30/100,
  a streak leaderboard, and a title beside the name on the boards.

### Waiting on Tariq
- [ ] **Coach's finish-line words** - drafted: "You made it to the end of the road. Take a bow -
      you earned every step." Approve or replace.
- [ ] **More obsidian trophies** - Iron Will built. Still proposed: Standing Ovation (95+), Then
      and Now (beat your baseline in all seven colours), The Golden Phase (gold on every challenge
      in a phase), Seven Summits (80+ in each colour).
- [ ] **2 testimonials still held back.** 25 are live, up from 13 at the start of
      24 September. Tariq named almost the whole list that evening.

      - **Erin Ralph** — the spelling is still unconfirmed. A name or initials will do.
      - **"Bloody brilliant. All the very best, Tariq."** — Vincent Hazenboom is live with
        it; Lhamo Ingrik's name arrived attached to the same dictated line, so it is not
        known whether she said it too. Held rather than guessed.

      **Two open questions from that evening:**

      - **Is "Rachel" the same person as "Rach Ael"?** Tariq confirmed Rach Ael, then
        later attributed the skills-library quote to "Rachel". They are two entries on
        the page until somebody says. Merging two people is worse than one person under
        two spellings, so it was left as given.
      - **DN, RJ and LN have nowhere to go.** Four initials were given; JS went to the one
        quote with no name at all. The other three were provisionally placed on three
        quotes that turned out to have real names, and were taken off again when Tariq
        supplied them. They need matching to quotes, and must never be derived from a
        spelling — initials guessed from a misheard surname are the same false
        attribution the misspelling was.

      **Also settled:** Gene East said "This course is the best" (Liz A. Hammond is kept
      as a name with no words attached, in case hers turns up). MikaElla Tingi's quote no
      longer opens with "Tingy." — that was the second half of her own name.

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
- [ ] **Trophy case follow-ups:** rarity counts one student on two devices twice and cannot tell
      cohorts apart (Supabase badges would fix both); journey-map pins still use medallions (the
      slots are too small for a render); "See it in your trophy case" does not switch the phone
      tab if the profile page is already open; old medallion components not yet removed.
- [ ] **Left over from the speed pass:** the Coach pill's colour drift repaints its glow
      (most of what is left at idle - a known trade-off); coach-demo lesson thumbnails load
      960px files into 60px slots; the story phone frame captures the mouse wheel; on a
      phone the gallery's title overlay covers its Next button; the gallery's arrow keys
      listen page-wide.
- [ ] **The 14-day upgrade window is copy only.** Nothing records when a student joined, so
      the in-app Starter-to-Complete offer does not close on day 14. Needs a purchase date on
      the server-side plan (see the multi-user item below) - then `UPGRADE_WINDOW_DAYS` gates it.
- [ ] **Supabase still defaults `profiles.plan` to 'trial'** (`schema.sql`; `chat.sql` checks
      `plan <> 'trial'`). The app treats it as no plan, so it is safe; fix the default in the
      schema before the project is created, with the multi-user work below.
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
- 3D road: Coach x3 + finish, reacting checkpoints, finish celebration, fireflies, classmates,
  road sound, scenery per phase — `5f59572`
- 3D road (/prototype/adventure3d): traveller with neon trail, higher camera, phase gates +
  "Now entering" banner, S.T.O.R.Y. jump letters, roadside trophies and comments — `6eaa46e`
- Coach says one of 21 pre-recorded lines as each trophy lands (captioned); five missing
  record-button lines rendered — `8381e51`
- The trophy room is the real case in the app: the reveal (wherever a trophy is won, applause,
  waits for Coach to finish), silhouettes, progress by material, rarity from backups (shown only
  at 10+ students), share card (1080x1350), Founding Cohort, "Replay the moment" — `12ebb3d`,
  `0dfaf63`, `5440f7a`, `0c997cc`
- Library trophies: one per skill for watching every lesson in it (7, enamel); Unstoppable
  moved to chrome — `f9a087f`
- Skill trophies need consistency across different challenges (Handy 4, I See You 6, Oscar 5,
  ...); Full Spectrum 60+; Founding Cohort once-only trophy — `34f8831`
- Iron Will (obsidian, 30 days); The Lion's Roar with neon LEDs in its own Legendary category;
  Chekhov's Gun a level revolver; Founding Cohort bronze art — `968427d`
- Challenge trophies painted in full, real colour (23), exotic materials kept for the special
  ones — `6658f11`
- Coach trophies: In the Lion's Den (chrome & gold, 25 questions) and The Lion's Roar
  (obsidian & gold, larger, every challenge and every lesson) — `d737938`
- The free trial removed from the app: no plan means the tiers; paid plans unchanged; a
  stored "trial" is treated as no plan without crashing — `349f59e`
- Every trophy states its requirement (Full Spectrum, The Whole STORY, Practicing Machine
  had none); shown under each tile in the trophy room — `40ba2b6`
- Top Narrator: a head mid-sentence with sound waves, replacing the pocket watch — `b975b08`
- Trophy room: neighbours receding either side, portrait stage with close neighbours on a
  phone, smoke that visibly moves (the first loop barely did), S.T.O.R.Y. letters in
  spectrum blown glass — `be84dcf`
- VIP Ultimate continues at $29.99/month, same as Complete — `0282ac7`
- Trophy room: seamless 5s smoke loop in the spotlight, 118KB, loads only on screen — `bd52517`
- 14-day money-back guarantee seal with the lion, beside the first and last calls to action
  and under the tiers — `c481897`
- Four calls to action down the landing page (Join Speak Better Now, Start My Speaking
  Journey, I'm Ready, Sign Me Up), each gliding to the tiers — `bb59da6`
- Landing speed pass: the page no longer scrolls itself ~9,300px down to the library on
  load; requests in the first 6s 89 -> 40, 1.95MB -> 1.39MB; idle main-thread work on a slow
  laptop roughly halved; off-screen animations sleep — `fe1b4ad`
- Coach's pill shows its waveform at last (it had never rendered), dark body, bigger;
  testimonials float up one by one instead of marching in columns — `55a2e93`
- No "try it free" anywhere public; "Challenge Preview"; the free-challenge button removed;
  upgrades within 14 days — `dc6f8dd`
- Landing headline: "Listen to Coach" in the big waveform pill, replacing "Hear it" — `5f10e2c`
- FAQ: optional monthly plan after the six weeks — Starter $14.99, Complete $29.99 — `4dae93e`
- Trophy colours matched to the Speaking Spectrum (every one within 2° of its swatch);
  Twisted re-glazed storytelling yellow — `642c9ba`
- Edge of the Seat is a tipped-forward theatre chair; Chekhov's Gun an antique flintlock;
  both gold twins re-made — `eaed221`
- Gold twin for every scored challenge, won at 90+ (23 new, 70 trophies); S.T.O.R.Y.
  letters now multicolour neon; eight look-alike trophies redrawn (Silver Tongue, Heartstrings,
  Hitmaker, Hollywood Worthy, Thesaurus Rex in reading glasses, The Before Shot, On the Air,
  No Net) — `dccd6c2`
- A 14-day money-back guarantee, for any reason, under the tiers; nine FAQs folded
  beneath it, every figure read from the pricing and cohort data; no separate pricing
  page needed — `f825ca2`
- The trophies whole again: every one re-cut by the model's own transparent background
  instead of by brightness, which had deleted the obsidian, the plinths and the deep
  glass — `b80867b`
- Every button under Coach is the big waveform pill (`CoachPill`) — `71726a4`
- The lesson library fills its card on desktop; the list runs the preview's full
  height — `71726a4`
- The trophy room: every trophy standing on the podium under the light, its
  reflection in the floor; all 47 in a grid by material below; "part-way through"
  shows the case as a student sees it — `fb7b687`. At **/prototype/spotlight**.
- Five materials as the rank, a shorter stem, 3:4 renders, a zoom that works — `52e2818`
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
