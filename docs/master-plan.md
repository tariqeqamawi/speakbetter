# Speak Better — Master Plan

*A speaking course built on practice, not playback — and a way to see, in color, how dynamic a speaker someone is becoming.*

> Draft v2 · Prepared 2026-08-07 · revised 2026-08-17 with the on-screen cue engine (§03), the XP model and the finish moment (§11), and the card deck as built (§16) · revised 2026-09-26 with everything built from 23 to 26 September (summary below; new §20 and §21).
> The live formatted version of this plan is published as an artifact; this file is the repo's canonical copy.

---

## Changes since 23 September

Four days, and the product changed shape more than in any week before it. The day-by-day record is `docs/requests.md` (the *Shipped* log) and the commit messages; this is what it adds up to.

- **The road is a real 3D world.** The tilted CSS map is gone from `/challenges`. In its place is a three.js road through five lands, one per STORY phase, with portals for challenges, Coach speaking from the sky, trophies standing beside the portals they are won at, and a flat 2D map for anyone who would rather scroll (§14, *The road, rebuilt*). Challenges inside an open section can now be taken in any order (§04).
- **The trophies are real objects.** Seventy rendered trophies in five materials, a trophy room with a stage and a reveal wherever one is won, and harder rules that ask for consistency across different challenges rather than one good take (§11, §14).
- **The offer settled, then its price.** No free trial anywhere. A founding cohort of 20 starting 3 October, at **$299 / $498 / $997** (Starter / Complete / VIP Ultimate), each shown beside its later price struck through, a 14-day any-reason guarantee, an optional monthly plan after the six weeks, and a Starter-to-Complete upgrade for the $199 difference within 14 days (§15). The paywall stays **off** until Tariq says the first students are coming (§21).
- **The landing page became nine numbered chapters** with a navigator down the right edge, Read more on long copy, three Join buttons, testimonials placed once each, and one core claim: **Speak Better's Speaking Spectrum makes it unlike any other course or app** (§05, §15). The origin story moved to `/about`; Terms of Service and a Privacy Policy exist (`/terms`, `/privacy`).
- **Consent is a condition of the course.** Students agree that their speech is kept anonymously, as text, under a student number, so Coach can be trained and their own progress measured. No video is ever stored (§13).
- **Coach can now be trained.** Every review is rated 👌/🤏/👎, nine areas of the app carry 🔥/👇 reactions, Today asks for check-ins (confidence at the start and end, recommend, what changed), and `supabase/training.sql` is the database all of this goes into (§07, §13).
- **Tariq and investors have a view.** `/admin` (Cohort insights) and `/admin/data-room`, running on a sample cohort until Supabase is on (§20).
- **The app looks and moves differently.** A green, purple and teal glow behind glass cards; a phone dashboard led by a sticky sections bar and a ☰ menu; the spectrum drawn as a wave above the bars in every review; the tour cut from nineteen stops to ten and renamed *Guided Tour* / *Full Guided Tour* (§14).

---

## 01 · The problem we're solving

Almost every speaking course works the same way: you watch someone else speak for a long time, hope to extract the useful ideas, and carry them out into real life on memory alone.

**That's like trying to learn to sing by attending a concert, instead of practicing singing.**

The format is passive. There's no rehearsal built in, no feedback on your own attempt, and nothing tracking whether you're actually getting better. Whatever you learn is only as useful as your ability to remember it, weeks later, under pressure, in a real conversation or presentation. For most people, that link breaks — and the course's ideas stay theoretical.

Speak Better starts from the opposite assumption: speaking is a physical, practiced skill, closer to singing or sport than to trivia. It should be taught the way those are taught — short instruction, immediate attempt, honest feedback, repeat.

## 02 · The Speak Better method

The course is built from two kinds of content that work together, not two separate products:

| Pillar | Scale | What it is |
|---|---|---|
| **Skills** | 83 lessons · 1–2 min each | Short, focused lessons — the "what." Reference material, organized by the different dimensions of dynamic speaking. |
| **Challenges** | 24 challenges · 5 STORY phases | Real speaking tasks — the "practice." Each one asks the student to perform, on camera, not just watch. |

Lessons stay short on purpose: the goal is to get a student from curiosity to attempt in minutes, not hours. Every challenge is designed to be repeatable, so a student can fail, get specific feedback, and immediately try again while the lesson is still fresh. Repetition with feedback — not runtime of video watched — is the thing the whole course is optimized for.

### Three frameworks, three altitudes

The method is articulated as three named frameworks, each operating at a different altitude — a philosophy the student carries, a cycle they repeat, and a journey they travel.

**SPARK — the core philosophy.** The mindset and approach behind the whole journey:

| | Principle | Description |
|---|---|---|
| 🔥 **S** | Start Simple | Remove overwhelm with quick wins and doable actions. |
| 🎯 **P** | Precision Practice | Practice targeted skills inside real challenges. |
| 🌈 **A** | Authentic Action | Speak from your truth and lived experiences. |
| 🎥 **R** | Record & Review | Watch yourself grow and refine over time. |
| 🚀 **K** | Keep Going | Track your visible growth and stay motivated. |

**STEP — the action cycle.** What a student does inside every single challenge: **S**ee the Challenge (watch the short demo video), **T**ap Into Tools (learn from quick lessons in Skills), **E**xpress & Upload (record and post their version), **P**rogress (watch it back, receive feedback, move on). Unpacked in full in §06.

**STORY — the skill-building journey.** The path the challenges themselves are arranged along, from first words to speaking mastery — five phases that structure the whole curriculum, laid out in §04.

The three nest cleanly: SPARK is how a student approaches everything, STEP is what they do each time, and STORY is where the sequence carries them.

## 03 · Pillar one — Skills

Skills breaks "being a good speaker" into distinct, learnable categories. Each category is assigned a color, which becomes important later — the color isn't decoration, it's the vocabulary the whole feedback system is built on.

| Color | Hex | Category |
|---|---|---|
| 🟡 Neon yellow | `#ffd60a` | Storytelling techniques |
| 🟠 Bright orange | `#ff9500` | Figurative language |
| 🔴 Bright red | `#ff4a2b` | Acting skills for speakers |
| 🩵 Bright cyan | `#22d9f5` | Body language & physical expression |
| 🟣 Magenta | `#f53de0` | Structure & framing |
| 🟢 Neon green | `#1fe890` | Speaker's mindset & psychology |
| ❤️ Deep crimson | `#d11149` | Advanced tips & tricks |

The palette is deliberately neon and highly saturated — these colors are meant to feel alive against the dark ground, not decorative. Each one is verified to clear a 3:1 contrast ratio on the background and to stay perceptually distinct from the other six, so a student can tell colors apart at a glance in the spectrum chart. (An earlier turquoise for Advanced was replaced: it sat too close to both the green and the cyan.)

Seven is the working set, and it's treated as a ceiling rather than a target — categories are deliberately held to seven or fewer, growing only if a skill genuinely doesn't nest into any existing color as Skills is built out. What matters structurally is that every lesson belongs to exactly one category, and every category has one color, consistently across the course, the book, and the card deck.

Students aren't expected to work through Skills front to back like a syllabus. It's meant to be dipped into — a student heading into a specific challenge is pointed to the handful of lessons most relevant to it, watches those in a few minutes, and goes straight into attempting the challenge.

The library is **83 lessons** as of 25 September: *Posture Warm Up* joined Body & Physical and *Don't Give Your Power Away* joined Confidence & Presence. Both already had transcripts, summaries and cues; they only needed to be made lessons. The count is said as 83 everywhere a student or a buyer reads it, and the two tour lines that say it were re-voiced.

Each color also carries a **short code** — the deck's shorthand, used anywhere a full category name won't fit, and printed in the corner of every card (§16):

| Code | Category |
|---|---|
| STORY | Storytelling techniques |
| IMAGE | Figurative language |
| ACT | Acting skills for speakers |
| FRAME | Structure & framing |
| MIND | Speaker's mindset & psychology |
| BODY | Body language & physical expression |
| PRO | Advanced tips & tricks |

### Two ways through the library — Skills and Cards

Skills is one section with two tabs. **Skills** is the video library: the seven colors as a dial, press a color and let go, and its lessons open. **Cards** is the same library in the hand — every lesson that has key points written for it becomes a card in its section's color (§16). Watching the lesson and holding the card are two modes of the same material, so they sit as two tabs of one section rather than as two destinations in the navigation.

### The lesson player — what appears beside the teacher

A lesson is one to two minutes of a person talking to camera, and the margins either side of him are dead space. The player uses them as a second channel of teaching: **about every ten seconds, one complete thought from what he is saying right now appears in the margin** — his own words, lifted whole, or a single-color stroke icon where a drawing says it faster than reading would.

Two things it is not. It is not a keyword track: a cue is a **thought** — a clause of his, three to ten words, that stands on its own. FIND THE SCENE THAT SHOWS IT is a point; FIND THE SCENE is a topic, and SCENE could be anything. And it is not subtitles: what appears is one thing he said, chosen because it names the idea, never the whole sentence when the sentence runs on.

What appears is neither hand-written nor arbitrary. A build step reads each lesson's own transcript, cuts it where he paused and where he joined one thought to the next, and walks down it taking the strongest unshown thought in each window. Strength is the vocabulary inside it — how much of it belongs to this lesson rather than to the whole course, how much of it can be pictured — weighted by how strongly the sentence around it reads as a point being made, which the engine hears in the rhetoric ("I promise you", "remember", "it's not about *what* you say, it's about *how*", "if you… then…") and in passages that make their point by painting rather than announcing. A thought opens and closes where he did: never cut short in front of a preposition, never a fragment lifted from the middle of a clause.

And it is not the same every time. Each slot keeps a couple of runners-up — other things he says in the same stretch, about something else — and the player deals one option per slot at random every time a lesson is played from the top. A lesson watched twice shows different things; a lesson watched three times has said everything it has to say.

Three rules keep a second channel from becoming noise:

- **An idea appears once per lesson**, counted by word stem, so OVATION can never follow STANDING OVATION. The single exception is an idea he returns to half a minute later in different words, and then only where the alternative is a hole in the cadence — at that distance it reads as a callback rather than as the screen stuttering.
- **An idea rarely repeats across the course**, so the lessons don't all surface the same handful of words.
- **A stretch with nothing worth naming shows nothing.** Where the material runs out the gap stretches; the bar never drops. Silence beats a phrase that names nothing.

Around 700 cues across the 121 videos — the 81 Skills lessons plus the challenge explainers and intros — with runners-up behind more than half of them. Two in three land inside the eight-to-thirteen-second promise and the rest are the stretches where he genuinely isn't saying anything that stands whole: the ceiling is the material, not the engine, which is worth knowing before anyone tries to tune it further. Because they're generated from the transcripts rather than maintained by hand, the whole course can be re-cut by rerunning one script, and every lesson's cues can be reviewed on one page without watching a single video.

### What sits under a lesson

Under the video, three things, in the order a student wants them.

**Key ideas** — the lesson's spine, four or five lines, each one a thing to do rather than a thing to know. **The summary** — the same lesson again in natural prose, three or four sentences in the second person ("You start your journey toward becoming a confident communicator by…"), because a list tells a student what was *covered* and a paragraph tells them what was *said*; a student who watched it last week wants the paragraph. **The transcript**, fetched only when it's asked for (`/api/transcript`), because eighty-one transcripts shipped in the bundle is a slower app for a page almost nobody opens.

The summaries are generated once per lesson from its own transcript (`scripts/build-lesson-summaries.mjs` → `src/data/lesson-summaries.json`), so nothing is called at watch time and the cost is paid once. One lesson learned the hard way: the script now merges with what is already on disk on every write, after a background run and a foreground run each flushed a stale copy and overwrote the other's work.

## 04 · Pillar two — Challenges, on the STORY journey

The challenges are the spine of the course, and they're arranged along the **STORY** framework — five phases that carry a student from first words to speaking mastery. Each phase has a clear purpose, and each challenge inside it targets a real situation a speaker might face. A challenge is a task with a clear goal, not a topic to learn about.

- Each challenge has its own short explainer video describing exactly what "success" looks like for that task.
- Each challenge draws on specific categories from Skills, and points the student to those lessons before they attempt it.
- Completing a challenge means recording and uploading a real, on-camera attempt — there's no way to pass a challenge without actually speaking. (One deliberate exception: the passive Mindset Toolbox item in phase one.)
- Challenges can be retried. A student can attempt one again to raise their score, or move on and return to it later.
- **Inside an open phase, the order is the student's.** Since 25 September every challenge in a phase that is open can be taken in any order. The phases themselves still open in sequence, at the ranks in §11. A challenge in a phase not yet open says *"Complete your current section to unlock this one."*

Difficulty and scope build phase by phase: STORY opens with baseline self-awareness, trains the voice as an instrument, moves into storytelling craft, deepens into emotional truth, and ends with real-world formats. Early challenges are approachable wins; later ones ask for more range — more categories in play at once, less room to lean on one strength.

### The STORY curriculum — with its matched course videos

Nearly every challenge below already has its explainer video filmed and hosted; the matches were made against the course's actual video library.

#### 🧭 S — Start With Awareness
*Reflect, baseline, and map your voice's starting point.*

| Challenge | Matched course video |
|---|---|
| Record Your Speaking Baseline | [Speak Your Truth (Baseline Challenge 1)](https://vimeo.com/1081200493) |
| Tell a Story Without Any Help | [Tell a Story, Any Story (Baseline Challenge 2)](https://vimeo.com/1081200781) |
| Watch the Mindset Toolbox (passive) | The green Mindset & Psychology category in Skills — e.g. [Why You Have a Fear of Public Speaking](https://vimeo.com/1081029629), [You Are One Talk Away From Changing Your Life](https://vimeo.com/1081029780), [You Were a Born Public Speaker](https://vimeo.com/1081197407) |

#### 🎤 T — Train Your Instrument
*Build vocal clarity, rhythm, tone, and presence through skill warm-ups.*

| Challenge | Matched course video |
|---|---|
| Say What You Love — With No Filler Words | [Challenge 5: Speak About Something You Are Passionate About](https://vimeo.com/1081280579) |
| Avoid Boring Words (Amazing, Beautiful, Exciting) | [Challenge 4: Amazing, Beautiful, Exciting](https://vimeo.com/1081200895) |
| Play With Your Voice (Tone and Melody) | [Challenge 6: Make Your Message A Melody](https://vimeo.com/1081281914) |
| Tongue Twister Challenge | [Tongue Twister Warm-Up](https://vimeo.com/1081940261) |
| Beatbox or Rhythm Flow | [BONUS Challenge: Overcoming Self Consciousness With Beatboxing](https://vimeo.com/1081935006) |

#### 🛠️ O — Own Your Stories
*Practice storytelling techniques, scene work, and personal expression.*

| Challenge | Matched course video |
|---|---|
| Create Your Storybook | [Challenge 2: Creating Your Story Book](https://vimeo.com/1081200682) |
| Paint the Scene With Sound | [Challenge 8: Bring A Scene to Life With Sound](https://vimeo.com/1082010596) |
| Describe a Place or Person Vividly | [Challenge 9: Describe a Landscape Or Person Using Figurative Language](https://vimeo.com/1081932833) |
| Tell a Real-Life Moment From Your Day | [Challenge 13: Narrate A Scene From Your Day](https://vimeo.com/1081938254) |
| Act Out a High-Stakes Moment | [Challenge 14: Act Out A Story With High Stakes](https://vimeo.com/1081956346) |
| Add a Twist in Third-Person | [Challenge 11: Own Your Story With A Plot Twist](https://vimeo.com/1081933936) |

#### 💓 R — Reveal Deeper Truths
*Connect emotionally, explore vulnerability, and expand empathy.*

| Challenge | Matched course video |
|---|---|
| Trigger 3 Emotions in 1 Story | [Challenge 22: Tell A Story With 3 Different Emotions](https://vimeo.com/1081948719) |
| Tell Someone Else's Story | [Challenge 10: Tell Someone Else's Story](https://vimeo.com/1081932244) |
| Bring a Story to Life With Multiple Characters | [Challenge 19: Tell A Story With Multiple Characters](https://vimeo.com/1081947627) |
| Share a Story You've Healed | [Challenge 12: Share A Story You've Healed](https://vimeo.com/1081936936) |

#### 🌍 Y — Your Impact
*Apply what you've learned in real-world speaking formats and challenges.* (Renamed from "Your Voice in the World" on 24 September.)

| Challenge | Matched course video |
|---|---|
| Explain It With Analogies | [Challenge 16: Using Analogies To Explain Abstract Concepts](https://vimeo.com/1081945708) |
| Podcast Introduction Challenge | [Challenge 18: Podcast Intro & Guest Edification](https://vimeo.com/1081953650) |
| Pitch Your Idea in 30 Seconds | [Challenge 17: Mastering Your Elevator Pitch](https://vimeo.com/1081950736) |

Three more filmed challenges have since been placed, which makes the road 24 challenges: [Challenge 7: Story with Set & Scene](https://vimeo.com/1081955083) and [Challenge 20: Tell A Story Using Foreshadowing & Fulfilment](https://vimeo.com/1081952336) in **O**, and [Challenge 21: Tell A Story With A Mic Drop Moment](https://vimeo.com/1081949655) at the end of **Y** (`src/data/challenges.ts`). Two further videos — [Welcome To The Challenges!](https://vimeo.com/1081200318) and [How To Use The Skills In Your Challenges](https://vimeo.com/1081200420) — serve as the section's introduction rather than challenges themselves.

## 05 · The color-spectrum scoring system

This is the idea that ties the two pillars together, and the thing that makes Speak Better's feedback different from a written critique.

A genuinely engaging two-to-three-minute talk is almost never one-dimensional. It usually draws on several categories of skill at once — a bit of story, a vivid comparison, a change in posture, a shift in tone. A flat, forgettable talk usually leans on only one or two.

Because every skill category already has a color, a student's uploaded performance can be read the same way: the AI watches the video, identifies which categories showed up, and effectively "lights up" the corresponding colors. A talk that touches most categories shows nearly the full spectrum — visibly dynamic, visibly diverse. A talk that only ever shows one or two colors makes the gap obvious at a glance, without needing paragraphs of explanation.

**The score isn't just "good" or "bad." It's a picture of which colors were present — and which ones weren't, yet.**

This turns feedback into something visual and intuitive — a spectrum or pie-style breakdown of color rather than a wall of notes — while the specific coaching text underneath still explains, in plain language, what to do differently next time.

### The Speaking Spectrum is the differentiator (26 September)

This idea now has a name, **the Speaking Spectrum**, and it is the claim the whole sales page rests on: *Speak Better's Speaking Spectrum makes it unlike any other course or app on the market.* Other speaking apps give generic advice, even the ones with AI coaching. This one reads a take across seven color-coded areas of skill and says which lit, which didn't, and which lesson to watch next. Every other feature can be copied. A scoring system built on the same seven categories as the curriculum, the book and the deck cannot be copied without copying the method too.

It is drawn the same way everywhere. **Every review, in the app and in the landing page's sample, shows the take's spectrum as the wave**, the colors the challenge needed glowing, **above the bars** that name each color and its score. The wave is the picture and the bars are the reading of it, so a student never has to decode one without the other. Over time the same drawing compares first and latest (§14, *The spectrum, in words*), and the cohort's version of it is what `/admin` shows an investor (§20).

## 06 · The challenge experience, step by step

This is the **STEP** cycle from the method (§02) — See, Tap Into Tools, Express & Upload, Progress — unpacked into its full working detail.

1. **Watch the challenge.** A short video explains the task and exactly what completing it successfully looks like.
2. **Warm up (optional).** The student is offered the small set of Skills lessons most relevant to this challenge — a few minutes of viewing, not the whole library.
3. **Record.** The student films themselves on their phone, selfie-style, attempting the challenge — two minutes ideal, three minutes maximum.
4. **Upload.** The recording goes into the course for review.
5. **AI review.** The AI watches the performance: whether it met the challenge's success criteria, which skill categories/colors showed up, and how strong the delivery was — filler words, pauses, gestures, eye contact, storytelling detail, and more.
6. **Feedback.** The student receives a score, a color-spectrum breakdown of the performance, and specific coaching notes tied back to the relevant lessons.
7. **Retry or advance.** The student can attempt the same challenge again to improve, or move on to the next one. Both their best attempt and their most recent attempt stay visible, so a strong early try is never buried by a weaker later one.

The raw video isn't kept long-term — see §13 — but the feedback itself (score, spectrum, notes) is something the student can keep and look back on.

## 07 · The AI coach — what it watches for

To assess a challenge, the AI needs to watch a video the way a human speaking coach would — reading both what's said and how it's delivered. Broadly, it's tracking three layers:

| Layer | What it's watching for |
|---|---|
| Physical delivery | Hand gestures, eye contact, posture, physical energy and expression |
| Vocal delivery | Filler words, pacing, awkward pauses, vocal variety |
| Craft & content | Storytelling structure, sensory and immersive detail, figurative language, framing, mindset and confidence — the same material taught in Skills |

This only works if the underlying AI can genuinely watch the video, not just transcribe the audio and read the words back — something like Google Gemini's video-understanding capability, which reasons over the visual frames directly rather than working from text alone. Gestures, eye contact, posture, and physical energy don't exist in a transcript at all; they only show up on screen, so the model has to actually see the performance to judge it and suggest how to make the next one more compelling.

Because every observation maps back to a category in Skills, the AI's coaching is never generic. It can always point to the specific color that's missing and the specific lesson that addresses it — the assessment and the curriculum are speaking the same language.

### How the coach works — built

Gemini watches the recording natively, frames and audio together. Before it watches, it is briefed with the teacher's methodology: the challenge's brief and criteria, the full transcripts of the lessons the challenge cites and of their neighbouring lessons, four "voice" transcripts that carry his stories and phrasing (the Almost Snowboarder pair, the standing ovation, the challenges intro), and the rest of the library as its cards. It is told to coach only from that material, to sound like him and reach for his stories, and never to invent one.

**The standard is quality, not presence.** A gesture that is there is not a gesture that works. Someone miming a friend hauled up a cliff is judged on whether the weight is believable — visible strain, tensed muscles, effort on the face — and someone lifting an imaginary mug on whether they hold a handle and it arrives at the mouth the way a mug does. Present-but-loose gets credit for the attempt and a precise note on what would make an audience believe it.

**Every review makes three decisions, in order.** Was the brief completed — each criterion judged on its own, met or not, with a timestamp and what was seen or heard, and no rounding up out of kindness. Did they use the lessons the challenge cites — each one used or not, how well (0–100), with evidence or with what using it would have looked like at a specific moment. And the reach: what else from the library would make the next take more compelling, scaled by level — a Beginner gets one or two natural next steps, an Intermediate three or four across colors, an Advanced student the full library and the demanding techniques.

It also spots **skills the student used without being asked** — a rhetorical question, a pause before the key line, a metaphor — and names the lesson each belongs to; Intermediate and Advanced see the list, a Beginner sees the count. And it notices **the setup**: a phone held in one hand takes that hand out of the performance, so good one-handed gestures earn "next time prop the phone up so you've got both of them free".

Every note has the shape *well done for X — next time try Y*, names a color, cites a lesson, and gives the moment in the student's own video. **Praise is qualified, never bare:** not "brilliant energy" but what made it — "your tone was upbeat and you held the lens the whole way through". A lesson reference names the part used — "you opened with a hook, told one short anecdote, closed with an invitation: all three parts". And once or twice the coach mentions something particular in the frame — the wall color, a plant, a shirt, a prop — as proof it watched rather than processed. The register is grounded and reassuring, not effusive; flattery is what makes a student stop believing the rest. The seven-color spectrum is scored with fixed anchors (40 lights a color; 70+ needs several distinct, deliberate uses listed in the evidence; 85+ is the teacher's own standard). **The score is discerning where the words are warm:** a brief met plainly sits 56–65 and that is where a first take belongs, 76–85 is rare, 86+ almost never a first attempt — a student told 85 on their first take has been told there is nothing left to learn. The model scores the take on one scale whatever the level; the app adds the level's allowance (+6 Beginner, +3 Intermediate, none at Advanced), so the same take never scores lower at an easier level. The app holds the pass rule, not the model: every criterion met and the score at the level's bar.

**Time limits are the challenge's own** — three minutes unless it says otherwise, the pitch is thirty seconds — with five seconds of grace and no more, on the phone and on the server: being succinct is part of what the course teaches, and a limit that bends teaches the opposite.

**The video's path:** phone → a private store (the server only issues the permission) → Gemini → deleted from both the moment the answer is back, or the moment it fails. Nothing about a recording persists on our side (§13). A review of a 45-second take costs a few cents and returns in under a minute.

### How Coach gets better — the student tells us when he misses (26 September)

A coach only improves if somebody knows when he was wrong, and until now nobody did. Every review ends with **"How did Coach do?"**: 👌 *spot on*, 🤏 *partly right*, 👎 *way off the mark*, with one optional line on what he missed. Those ratings, the student's words as text, and Coach's own review go into a **training queue** (`training_takes` in `supabase/training.sql`) where a take can be corrected, flagged as a gold example, and **scored by Tariq himself**. The gap between Coach's score and Tariq's, week by week, is the measure of whether the coach is learning the method. That gap is also the moat an investor is shown (§20).

This rests on the consent in §13: the speech is kept as text under a student number, never as video and never under a name. The trade has to be one a student can see and agree to, or it isn't worth making.

## 08 · The transcript and video reference

Every lesson in Skills has a transcript. Collected together, these transcripts become the reference the AI actually checks a student's performance against — this is what turns the skill categories from a list of topics into something the AI can genuinely detect, rather than judge on vibes. When the AI reviews a challenge video, it isn't guessing what "good storytelling" looks like in the abstract; it's checking the performance against the same explanations the student was just taught.

For the physical, visual skills especially — gestures, eye contact, posture — the AI can go a step further than the transcript and reference the Skills lesson video itself, watching the skill actually being demonstrated rather than reading a description of it. A transcript can define what confident eye contact means in words; the source video shows what it actually looks like.

This reference layer is also where feedback restraint comes from — though how much restraint applies depends on the student's level. A single performance might reveal five or six things worth improving, but handing all of them to a Beginner at once is overwhelming and nothing sticks.

**For a Beginner, the goal isn't to hand back everything that's wrong. It's to hand back the two or three things the challenge itself was built to test — plus whatever else the AI judges as closely adjacent — and hold the rest back for later.**

The primary feedback stays the same shape at every level — the two or three main and adjacent skills tied to the challenge itself. What changes is whether a student can go further. At Intermediate and Advanced, a click reveals a fuller set of skills and colors the AI would recommend to make the talk more diverse — nuance that stays nested and optional, never dumped on top of the primary feedback. At Beginner, that deeper reveal stays closed, so the focus stays narrow.

## 09 · Skill levels — beginner to advanced

Students don't all start from the same place, so Speak Better offers a starting level rather than one fixed difficulty. Rather than asking a technical self-rating, the question put to a new student is plain and human: *how do you feel about speaking?*

| A student says… | Starting level | What changes |
|---|---|---|
| "Nervous and shy" | Beginner | Feedback stays narrow — just the two or three skills the challenge is built to test, plus close adjacents — with no deeper reveal on offer, and challenge thresholds are forgiving. |
| "Fairly confident" | Intermediate | Same focused primary feedback, plus a click-through to the fuller set of skills and colors the AI recommends for a more diverse talk. More categories are expected to show up in a performance. |
| "Very confident" | Advanced | The same click-through reveal, at its most demanding — near full-spectrum performances are expected, and challenges push hardest. |

The level isn't a locked track so much as a sliding scale across two things at once: how much is being asked of the student in a challenge, and how nuanced and rigorous the AI's feedback is. A Beginner and an Advanced student can attempt the same challenge, but what counts as success — and how much they're told about how to improve — differs.

Movement between levels is manual, never automatic. A widening spectrum might make it obvious a student has outgrown Beginner, but nothing reassigns them on its own — the student decides when to move themselves from Beginner to Intermediate to Advanced.

## 10 · Progress and repetition over time

Because both the lessons and the challenges are short, the full loop — watch, attempt, get feedback, retry or advance — can happen many times in a single sitting, and many times a week. That repetition is the actual mechanism of improvement; the short format exists to make repetition realistic.

Over time, a student should be able to see their own spectrum widen. An early challenge might light up two colors. A later one, on the same student, might light up six or seven. That visible widening — more than any single score — is the real measure of becoming a more dynamic speaker, and by the end of all five STORY phases, the goal is a student who can produce a genuinely full-spectrum talk on demand.

A nice-to-have for later, not a requirement of the first build: the AI noticing not just that a retry scored higher, but how the delivery itself changed from one attempt to the next. Worth layering in once the core loop is working, not something the core loop depends on.

## 11 · Gamification and positive reinforcement

Repetition only works if it feels good to keep doing. This layer is the SPARK philosophy's *Keep Going* principle (§02) made tangible: alongside the score and the color-spectrum breakdown, the course carries a visible, celebratory layer — badges, streaks, and congratulatory messages that recognize effort as much as achievement.

In the student's own feed, for example:

- *"Well done — you just uploaded your first video."*
- *"You've uploaded five videos now."*
- *"You are a practicing machine. You've already tried the same challenge five times. Go you — you're getting so much better."*

These moments are meant to be felt, not just read — a short on-screen animation accompanying a badge or streak, so a milestone registers as a small celebration rather than a line of text sliding by. The aim is the same feeling a well-made game gives a player leveling up: excitement, momentum, a pull toward the next attempt.

A progress bar across the full STORY journey — every challenge, through all five phases — gives the same reinforcement at a glance: a student should always be able to see, visually, how far through the course they've come.

This layer applies equally to every student, at every level. Unlike the deeper skill-and-color feedback reserved for Intermediate and Advanced (§08), positive reinforcement isn't gated — a Beginner celebrates their first upload exactly as loudly as an Advanced student closing out the final phase.

### XP — what each thing is worth, said before it's done

Every action worth doing carries a number, and the number is shown *before* the action as well as after: on unwatched lesson cards, in the lesson and challenge headers, on the up-next button, and on each node of the STORY map. A student can see what something is worth while deciding whether to start it.

| Action | Worth |
|---|---|
| Watching a lesson | 8–22 XP, scaled by the lesson's length |
| Passing a challenge | up to 100–200 XP, rising through the five STORY phases — paid by score (see below) |
| The one passive challenge item | 50 XP |
| Uploading an attempt | 25 XP |
| Earning a badge | 50 XP |
| Completing a three-quest day | 50 XP |

Lesson XP is deliberately not rounded to a tidy grid. A two-and-a-half minute lesson pays 22 and a thirty-second one pays 8, landing on fourteen distinct values across the library — **8, 11, 12, 14 reads as this lesson's own number; a course of 10s and 15s reads as a tariff applied to a list.** Each lesson becomes a small thing to complete rather than one identical unit among a hundred and twenty-one.

Challenges pay an order of magnitude more, because a lesson is watched while a challenge is performed, recorded, and judged — and they climb through the phases, since the same effort late in the journey is being asked of someone doing harder things with it.

**A challenge pays by score.** Its figure is the most it can pay, shown as "up to 150 XP" on the challenge; a pass at 60 earns about two thirds of it, 100 earns all of it, and the line between is straight (`scoreShare` in `lib/progress.ts`). A challenge counts its best passing take, so a better score on one already passed is worth more and never less. This is a scale the student can see before recording, not a variable reward — the anti-dark-pattern rule holds. The moment the verdict lands, a splash says what the take was worth and what a better one would be: *"Congratulations — you passed. 72 / 100. +141 XP. This challenge pays up to 150 — improve your score to unlock more."* A miss pays the upload and says what a pass would pay.

### XP is a key, not a number — the phases open at a rank

Each STORY phase asks for a **rank** on top of the phase before it being done: **T** opens at *Finding Your Voice* (250 XP), **O** at *Storyteller* (600), **R** at *Performer* (1,200), **Y** at *Orator* (2,000). The numbers are set so that a student who passes each phase's challenges properly clears the next gate with a little to spare, and a student who scraped through at low scores — XP pays by score — comes up short, and makes it up by the things the course wants them doing anyway: the lessons the next phase leans on, or a better take on a challenge already passed. The map's banner says which rank, and how far: *"Opens at Storyteller (600 XP) — 30 XP to go. Lessons and better takes both count."* A locked challenge reached by its link says the same instead of taking a recording it wouldn't count.

Two things this deliberately is not. **The lessons are never locked** — a milestone unlock on the deck was tried and cut, the student paid for the library, and the coach prescribes lessons in its feedback; a prescription can't land on a lock. And there is no **all-time leaderboard**: the community's board (§12) is this week's XP, opt-in, so a newcomer can lead in their first week and nobody is demotivated by a table they'll never climb. If XP ever unlocks content, it is *bonus* content — the teacher's extras — not the curriculum.

### Trophies are earned, not collected

A trophy asks for a thing actually done well, and usually more than once. **A skill is something you bring to everything**, so since 24 September the skill trophies count **different challenges**, not takes. Recording the same challenge twice with good gestures was the same story told twice, not a habit. Handy wants body language at 75 in four different challenges, I See You 70 in six, Storyteller and Sensational 80 in four, Oscar acting at 85 in five, and Full Spectrum all seven colors at 60 or more in one talk. The count trophies pair a count with a rank or with minutes on camera (five uploads and 250 XP; fifteen uploads and thirty minutes). **A challenge's trophy wants a pass at 75**, because a scrape-through pass is a pass but the trophy waits for the better take, which is also where the XP is. Its **gold twin** wants 90, which is the reason to record a challenge already passed. The early wins stay early on purpose (the first upload, the first pass, three days in a row) because a student needs something in the case in week one. A student who has barely started holds a few, not fifteen, and every trophy says under it exactly what it takes.

Seventy trophies, and **material is the rank**: glass for the challenges, ceramic for how you speak and feel doing it, chrome for turning up again and again, gold for mastering a challenge, the S.T.O.R.Y. letters in spectrum blown glass for finishing a phase, enamel *Library* trophies for watching every lesson in a skill, obsidian for the rare ones (Iron Will is thirty days in a row), and one *Legendary*, The Lion's Roar, for finishing everything. A **Founding Cohort** trophy can be won only by recording a take before the first cohort's last session, and no later cohort can ever win it. How the case looks is in §14.

### Ask your coach

The lion in the header opens the coach's own page. **Hold to ask**, or type — *"how have I been improving over my last few takes?"*, *"what keeps coming up?"* — and the coach answers aloud, with captions, from the student's own record: every take, its score and spectrum, every note. The record goes up with the question and comes straight back with the answer; nothing is kept. The rule that governs the reviews governs this: every claim has to be in the record, and a thin record is said to be thin. Below the conversation, everything the coach has said, newest first, with the spectrum and the spoken review a tap away.

### Recording with the clock in view

*Record* opens the camera inside the app: a full-screen preview, the clock counting down from the challenge's own limit, a ring filling as the time goes, amber inside the last thirty seconds and red inside the last ten (ten and five on a short challenge), and a stop at the limit — a two-minute challenge records two minutes and no more. **The brief stays on screen** as a shorthand checklist while they speak: a line the clock can judge ("at least 60 seconds", "under three minutes") ticks itself, the rest tick on the student's own tap, and the whole thing folds away with a tap. Where the browser can't record, the phone's camera app is the fallback.

### Sound and confetti — where the record changes

The sound design lives in one file (`lib/feedback-fx.ts`) and follows what the apps people keep coming back to do: a sound on every action that changes the record, scaled to its size, the same sound for the same moment every time, warm and short and low in the mix, silent under reduced motion. A click on record and a falling one on stop; a whoosh on send; two notes when the review lands; **a fanfare and neon confetti in the seven colors for a pass** — the confetti tumbles, flutters, and moves away from a finger drawn through it; a settling two-note for a miss (the app mustn't go quiet exactly when it's needed); a ding when the XP lands; an arpeggio and confetti when a rank opens a phase; three notes for a trophy, two for a lesson.

### Notes from the coach — push, rationed

The app sends notifications, and only five kinds: **your review is ready** (the one with plain utility — a review takes a minute or two and people leave the page; the review is kept for them and picked up on their next open), **an evening nudge** if today's practice hasn't happened and a streak is on the line, **a Monday recap** (colors reached, XP), **the next rank within reach** and what it opens (once per rank), and **"improving about N% a take"** when the last three takes on a challenge each scored higher (once per challenge). Asked once, right after a first review, when the student has just seen what a note would be about; a "no" is kept. One note a day at most. On an iPhone in Safari the app says to add it to the home screen first, which is where push works. The device reports a handful of true figures on each open and the daily job decides — the coach's rule holds: nothing is said that isn't so.

### The moment a lesson finishes

When a lesson ends, the XP it paid rises off the player and out of frame over about three seconds, carried by a two-note chime — the smaller sibling of the badge celebration, which gets three. It's quieter and shorter on purpose: finishing a lesson happens a hundred times across a course and earning a badge happens rarely, so this has to be a sound a student still likes on the hundredth hearing.

It fires only when the XP is genuinely being earned. A lesson already watched plays through in silence — **you don't earn it twice, and the course doesn't pretend you did**, the same rule the coach lives under (§14).

### Nothing plays itself

A finished lesson never rolls into the next one. The next lesson is offered — named, with its XP on the button — and waits to be chosen. This matters most inside Challenges, where only the lessons serving that challenge are worth watching, and an autoplay would carry a student somewhere they never asked to go.

## 12 · Community

Students should be able to see how they're progressing relative to other students. Rankings and peer scores are visible by default — a way to stay motivated and to see that becoming a full-spectrum, dynamic speaker is achievable and visibly happening for others too — but each student can choose to hide their own score from others if they'd rather keep it private.

Even so, the community layer isn't meant to be the main source of competitiveness — that should come from students competing with their earlier selves. The clearest version of that: letting a student set their very first challenge attempt side by side with their most recent one, so the improvement is undeniable. *This is where I started. This is where I am now.*

Two pieces of the layer are built ahead of the rest. **The feed of before-and-afters**: each student's baseline score beside their latest, the two spectra, and the colors lit between — never the videos, which stay on the student's phone (§13). A feed of other people's distance traveled is the most persuasive thing the app can show someone at challenge three. And **the crowd on the road**: a button beside the journey map that opens who else is walking it — how many students are on the challenge you're on, who uploaded an attempt at it in the last few hours (first names, and only that an attempt was made — never the video, never the score), and where everyone else is along the road. None of it is about you; all of it is the reason to keep going. Both read from sample data until the community layer lands, at marked swap points.

**This week's board.** A leaderboard of XP earned *this week*, reset every Monday, joined by choice with a display name — never all-time, never automatic. A weekly window means the top is reachable by whoever practiced most in the last seven days, which is the behaviour the app wants, and a lapsed Orator can't sit on it.

Beyond visible-by-default scores, opt-out privacy, and the first-vs-latest comparison, the finer mechanics of the community layer are still open — the intent here is to establish its shape alongside Challenges and Skills, not to fully specify it.

## 13 · Video and data handling

- Uploaded challenge videos are held only temporarily — long enough for the AI to review them — and are not kept long-term, to control storage cost and limit privacy exposure.
- Because videos aren't being kept long-term, resolution doesn't need to be capped low purely to save storage — higher-resolution recording is fine as long as it isn't sticking around.
- Students need to be able to watch back the video they submitted, and the answer is the student's own device rather than storage of ours: the app keeps no copy anywhere. A web app can't hold a pointer to a file in the camera roll, so the file the student picked is kept in the browser's own storage for the site, on that device only, and never leaves it. **The last three recordings per challenge** sit on a shelf above the upload box, each with the score and spectrum it earned, so the attempt about to be made can be measured against the ones already made without leaving the page. Older recordings are dropped as new ones arrive; their feedback stays. A recording made on another device, or let go by the browser, shows as gone — the feedback is the record, the video is a convenience.
- **The two baselines are the exception.** The first take of *Record Your Speaking Baseline* and *Tell a Story Without Any Help* is the student as they arrived, before a single technique, and it is pinned on the device for good — never dropped for a newer take, not removable from the shelf, and re-recording the challenge later doesn't move the starting line.
- **Then and now.** Ten challenges in, the Challenges page sets that baseline beside the student's most recent passed attempt: the two videos, the two scores, the two spectra, and which colors lit up since. The improvement is shown rather than announced — a student who watches their own baseline after ten challenges doesn't need to be told. Before ten, the panel names the number and counts toward it, because the comparison is a reason to keep going and should be visible as one. When every challenge is passed, the same panel is the whole road.
- **The reel.** From that panel, a before-and-after the student can post: ten seconds of the baseline, a card with both scores, ten seconds of the latest attempt, and a closing card with the spectrum and the colors lit since — about thirty seconds, portrait, the shape a phone posts in. Ten rather than twenty because the point is the difference, and the difference is visible in ten. It's cut on the phone: the frames and the videos' sound are recorded as it plays, and the file goes straight to the share sheet. Nothing is rendered anywhere but the device — no upload, no server, no cost. Where a browser can't record, the closing card shares as a picture. The same tap can share it with the other students, which posts the scores and spectra to the community feed and never the video.
- The lasting record of a challenge attempt is the feedback: the score, the color-spectrum breakdown, and the coaching notes. Students can download or keep this.
- Across retries, the AI keeps track of which attempt scored best against the same criteria each time, without the app needing to retain every video file — both the best attempt and the most recent attempt stay visible to the student.
- The annotated-video enhancement (returning a student's video with their skills highlighted as they happen) is explicitly out of scope for the current build — it would mean handling and moving more video, which works against keeping storage and cost to a minimum. Worth revisiting later, not now.

### A safety net under the record (24 September)

Until accounts are switched on, a student's whole record lives in one browser. That is a fine privacy stance and a fatal durability one: iOS deletes the storage of a site not opened for a week, storage is per address (so the same app on a second hostname starts empty, which is how Tariq lost his own progress), and clearing site data takes everything. A cohort member losing four weeks of work in week five is a refund conversation.

So there are three nets. The record, never the recordings, is **copied to our side as it changes**, and an empty or thinner record is never allowed to overwrite a fuller one. **`/restore`** puts it back, and can carry a record from one hostname to another. And a **progress file** the student downloads and keeps, which depends on nothing of ours still working. Restoring always **merges**: takes, lessons, trophies and streak days are combined and the counters take the higher value, so a restore can only ever give somebody more. None of this is a sync between devices. That is Supabase's job.

### Consent is a condition of the course (26 September)

Coach learns from what students say, so agreeing to that is part of joining, not a setting that can be switched off. What is agreed, in Tariq's words (`src/data/consent.ts`), is one line: *"By agreeing to use Speak Better you agree to our Terms of Service"*, and under it the reassurance that *your videos are never stored, and your name is never attached to what you say*. It does not say "personal information is never stored", because an email and a receipt are. **What does that mean?** opens his explanation: speech is used anonymously, **as text, transcripts only, never video**, to improve the service, and that is also how a student's own progress is tracked. There is an honest no. If they don't want this, Speak Better isn't the right fit, no harm done, and the 14-day guarantee refunds them.

It is asked in three places so nobody meets it for the first time after paying: under the prices, with links to the Terms and Privacy Policy; at the end of welcome (**Yes, I agree** before *Send it*); and as a one-time gate over the app for anyone who was already inside.

Underneath, `supabase/training.sql` holds what consent covers, and nothing in it is keyed by name. **`student_numbers`** gives each student a pseudonymous number, and every other table is written only through functions that look that number up, so nothing downstream ever sees an account id. The other tables are `training_takes` (transcript, Coach's review, rating, correction, gold flag, Tariq's score), `coach_questions`, `feature_reactions` (the 🔥/👇 on nine areas: the road, the dial, the deck, the dashboard, the trophies, Ask Coach, lessons, live sessions and the community), `events` (views, time on screen, tour steps), `check_ins`, `payments` and `insight_reports`. Until the database is on, all of it queues on the device.

**Check-ins** give the evidence a voice (`check-in.tsx`, on Today). On day one: how confident do you feel on camera? At the end: the same question again, how likely are you to recommend it, and what changed. The last answer is quotable only if the student ticks that it is, and never with their name.

The **Terms of Service** and **Privacy Policy** (`/terms`, `/privacy`) are standard documents rewritten around what this product actually does: one payment for a six-week cohort, the 14-day any-reason refund, an AI coach whose feedback can be wrong, and learning from speech as text under a number. The privacy policy follows the code: recordings go to private storage, are reviewed by Gemini and deleted; recent takes stay on the device; transcripts are kept under a student number. A refunded VIP keeps the printed deck and the book. What they deliberately leave out, and what still needs a lawyer, is in §21.

### Accounts — many students, one app (23 September 2026)

Everything above was built against one student in one browser's storage. A cohort needs an account, and the account is **Supabase** (`supabase/schema.sql`, `src/lib/supabase/`): profiles, attempts, watched lessons, badges, streak days, quest chests, shares and cheers, every table behind Row Level Security that lets a student read and write only their own rows — with the two exceptions the community needs, where a share and a cheer are readable by everyone and writable only by the student they belong to. `week_board` is a `security_invoker` view, so the board is computed under the reader's own permissions rather than around them.

Signing in is a **magic link** — an email and one tap, no password to reset for someone who is here to speak, not to administer an account (`sign-in.tsx`, `/auth/callback`, the session refreshed in `src/proxy.ts`).

**The video still never moves.** Accounts sync the record — scores, spectra, coaching notes, streaks, trophies — and not a single recording. The last three takes per challenge stay in the browser's own storage on the device that made them, exactly as §13 already promised. An account means a student's *record* survives a new phone; it doesn't mean their face is on a server.

**Two pathways, one app.** Which one a student is on is their plan (§15), and the difference is what Coach gives back:

1. **The full coach** — the review watched and spoken aloud with the words as captions, *Ask your coach* on call, the board, the notes when a review lands.
2. **Written feedback** (`Starter`) — Coach's face and the same review in writing, scored the same way and with the same rigour. Tapping Coach on Starter says what it includes, in Tariq's words: *"Written and visual feedback only. To have Coach talk to you and have Coach talk back to you, please upgrade."* The written review is a real review, not a teaser with the substance removed — which is the only version of this that's honest, and the only version that makes the upgrade look like more rather than like the end of a hostage situation.

The whole layer is **inert until it's configured**: with no `NEXT_PUBLIC_SUPABASE_URL` and anon key in the environment, the app runs exactly as it did on local storage alone, so nothing about the single-student build was traded away to get here. What remains before a cohort can actually run: the project created and the schema applied, the two keys in Vercel, `RequireAccess` made to require an account rather than a local unlock, and a cohort invite path — a code on the link that sets the plan when the account is made. As of 26 September none of this is done, and there are three more schema files to apply with it (`training.sql`, `chat.sql`, `live.sql`). The full list is in §21.

## 14 · Design principles

The interface should feel minimalist, clean, modern, and inviting — never clinical, never cluttered. Detail should be nested rather than laid flat: a student sees a score first, and can go a level deeper for the full breakdown, rather than everything being presented at once.

Visually, a deep **midnight blue** base carries the whole app, calm and consistent throughout. It isn't a flat block of color: three wide, very low-opacity pools of category color — cyan, magenta, and crimson — wash across the backdrop as a fixed radial gradient, giving the background depth and a modern feel without ever competing with the content in front of it.

Those lights are not static. Each drifts slowly on its own long cycle — fifty to ninety seconds, deliberately out of sync with each other — so the background is always faintly in motion without ever drawing the eye. Two smaller spotlights wander further than the rest, adding a little visual intrigue. All of it holds still for anyone who prefers reduced motion.

Against that dark ground, the category colors are the one place the interface gets genuinely loud. They're neon and fully saturated, used deliberately — skill tags, the spectrum chart, progress indicators — so the color-spectrum idea is something a student actually feels while using the app, not just a scoring mechanic explained in a paragraph. The contrast between a calm, deep background and vivid category color is the core of the app's visual identity.

Navigation stays deliberately small — four destinations: **Community**, **Challenges**, **Skills**, **Profile**. Each carries a matched outline icon, stroke-only and quiet, so the navigation reads as part of the interface rather than sitting on top of it. Keeping it to four keeps the app approachable rather than like a sprawling course platform with dozens of sections to get lost in. Skills is also where the digital card deck lives, alongside the lesson library — see §16.

**Profile** is the student's own corner: their standing (challenges complete, videos uploaded, colors reached, day streak), their demonstrated range as a spectrum of the strongest each color has ever shown, their badges, and their recent attempts. It's also the only place the level is changed — which keeps §09's promise that level movement is always the student's own decision.

The brand mark — a lion with a spectrum-colored mane, speaking into a microphone over a soundwave — sits in the top bar beside the wordmark, and appears in full on the landing page. Its own palette (magenta and violet through to blue, with a warm amber lion) is where the category colors came from, so the identity and the scoring system are visibly the same idea.

### The navigation, as one thing (22 September 2026)

Five destinations, the same five everywhere, in the same order: **Today · Challenges · Skills · Coach · Dash** (the last was *You* until 24 September; it opens the dashboard, so it says so). On a phone they are the bottom bar with **Coach raised out of the middle as the lion himself** - which retires the pill in the header corner and the second navigation it implied. On a laptop they are a **rail down the left** (`Sidebar` in `nav.tsx`, the column set by `app-shell.tsx`), always in view, with the content beside it instead of under a header of four links; between the two, at tablet width, the header carries them.

**Community stopped being a destination.** Who's on your challenge, and this week's board, are part of **Today** (`today-community.tsx`), where a student actually asks the question, with *See everyone →* through to the full page. **Jump** (`/` or ctrl-K, or the button in the header) finds any lesson, challenge or section by name - eighty-one lessons is more than anyone will browse for a particular one.

**A guided tour** (`guided-tour.tsx`): seven stops that dim the app, ring the real thing they're naming, and walk the real pages - offered once on a first visit, always available from the dashboard. Coach's pop-ins stand down while it runs.

### The community, redrawn

Every student has **a face and a spectrum trace**. The face is their photo where they have given one and otherwise their initial on one of the seven colors, hashed from their name so it is theirs and the same every time (`avatar.tsx`) — a wall of names was a spreadsheet. The trace is their first take under their latest, **both in full color** — the first at half strength, the latest over it at nine tenths — after the dashed “before” line proved to be the thing nobody could see, which is a problem when the distance between the two lines is the entire message. Beside each trace, their STORY letters filled as far as they have walked, and the challenge they are on now. **Three boards** replace the single XP ladder (colors gained since the baseline, takes this week, biggest jump in score), so a beginner can lead one of them in their first week, and above them **the week's shared goal** that everybody's takes fill: the one board where the whole cohort is on the same side. A **cheer** is one tap, with no comments to moderate. The joinable XP board (the real backend) sits below.

### The surfaces are glass

Every card is now slightly see-through with the page blurred behind it, so the drifting lights (above) carry through the panels instead of stopping at their edges, and the app reads as one lit room rather than a stack of opaque boxes laid on a picture. It is done in `globals.css` **by attribute rather than by hand** — anything rounded carrying a `bg-navy-800` gets the translucency and the blur — so the whole app changed at once instead of four hundred components changing one at a time.

**One bar of sub-navigation, not two.** A page used to carry the top bar, then its own tabs, then a row of filters: three bands of chrome before any content began. Tabs and filters are one bar now, directly under the top bar, and it is the only thing on the page that sticks.

**The app took the landing page's light (25 September).** Behind the app, instead of flat navy, a soft green glow top left, purple top right and teal low down. The cards became true glass on top of it: dark navy fading to a lighter blue-grey, translucent enough for the glow to show through, a faint green and purple tint in the corners, and a hairline of light along the top edge. The app and the page that sells it now look like the same place, which matters because a visitor who pays should feel they walked into what they were shown.

### The trophy case

*Superseded on 24 September by the trophy room, below. What follows is the CSS case it replaced, kept for the reasoning.*

The grid of circles is gone. A trophy case holds **one trophy at a time**, on a lit podium under a beam, turning slowly so the lion on the back of the medal comes round (`trophy-stand.tsx`, `badge-collection.tsx`). Every badge became a real trophy without a single piece of the medal art being redrawn: the existing medallion is mounted in a ring, with two handles, on a stem, on a plinth. Each owns one of the seven colors, settled by a hash of its id so it never changes between visits. Won, it wears that color and shines; not yet won, it is the same shape in dull metal — an empty stand with a name on it is an invitation, where a hidden one is nothing at all.

The podium and its pool of light **do not move**; only the trophy standing on them changes, arriving with a small lift. A stage that jumps on every tap is not a stage. The lion is watermarked across the back of the case at four per cent, **Won / All** filters the shelf, arrows or the buttons either side walk it, and the rest of the collection sits **behind a dropdown** — forty-odd trophies spread out under the case was a wall, and the case is the thing to look at.

### The trophy room (24 September)

Every trophy is now a **rendered object** rather than a drawn medallion: seventy of them, made with Higgsfield from prompts kept in the repo (`scripts/trophy-prompts.mjs`), because a set is only reproducible if the words that made it are kept. Each is a real thing in its material (a harp for Heartstrings, a tipped-forward theatre seat for Edge of the Seat, a T-rex in reading glasses for Thesaurus Rex), standing on the same plinth with a line of its skill's color along the base. The colors were measured against the Speaking Spectrum's swatches and corrected until every one sits within two degrees of its own, so the case doubles as a picture of what somebody is good at.

The case is a room. One trophy stands in a spotlight on a podium, with smoke drifting through the beam and its reflection in the floor. The others wait either side in the dark, smaller the further out, and step forward when chosen. A phone gets a portrait stage with the neighbours tucked in close. Below that, every trophy is grouped by material: lit if won, a black **silhouette** if not, so a student can see there is a prize without seeing what it is. A trophy can be shared as a 1080×1350 picture drawn on the device, so nobody's name goes to a server to be drawn back. "Held by N% of this cohort" is shown only when it is true, which means ten or more students, counted from the progress backups.

**Winning one is a reveal, wherever it happens.** The stage fills the screen, the lights go down, the trophy is lowered onto the disc, applause plays (synthesised, so there is no licence to track), and Coach says one of 21 fixed lines, *"Victory is yours"*, *"I want one of those"*, never the same one twice running. It waits its turn behind a review still landing, the XP splash, or Coach mid-sentence, and it never swallows a trophy if autoplay is refused.

### The road, rebuilt in 3D (24–25 September)

The CSS map tilted a flat picture back, which looks like perspective and isn't: nothing ever came towards you. Tariq's specification on 24 September asked for a road you travel, and on 25 September it replaced the map on `/challenges` (`live-adventure.tsx`, built on three.js, the same road on the landing page through `roadStops()`). Several sections below describe the map it replaced (the levels and checkered flags, *The map sleeps*, *The road does not drag sideways*, the pinch-to-zoom and the GPS trophy pins); their reasoning still holds, but those surfaces are gone.

**Five lands, one road.** Each STORY phase is its own land of dark glass, lit by its own pattern of neon: ripples for S, a sound wave for T, a field of points for O, an uneven lattice over R's peaks, hexagons on Y's plain. A wave of light rolls through the land every few seconds. The road is *driven, not drawn*: built from a heading and a slope, so the story shapes it. T climbs, O sweeps through S-curves with the camera banking, R plunges into the depths, and Y crosses mountains towards a city of dark glass spires in all seven colors that you travel towards and never reach. Walls of color rise at each threshold, *Now entering* sweeps across the screen, and a brass fanfare (four of them, synthesised) plays as you cross into a phase you have actually reached. The sky is a painted purple planet with stars, chosen on `/prototype/skies`.

**Portals, not circles.** Each challenge is a vortex in its phase's color with its number at the centre and its name above. Portals in the student's own section are live, with *Start challenge* diving the traveller into the eye of the vortex; portals in sections beyond are dormant rings; passed ones offer *Replay challenge*. Tapping a locked one says so and brings you back to where you are. The **traveller** carries the student's own photo with a neon trail behind it. Beside each portal stands the trophy it holds, as a silhouette until won. Classmates stand at the checkpoints they are on, with their profile pictures once they have uploaded one.

**Coach in the sky.** He appears above the road as a head of light, speaks, and drifts away: his three lines from Tariq's specification, plus seventeen more of Tariq's lines in Coach's voice (arriving in each phase, halfway between challenges, *"Deep breath…"* before the plunge), and Tariq's own words at the finish line. All of it is recorded once, captioned, said once a day, and only on road actually travelled. Browsing ahead is allowed; being congratulated for it is not. **One Coach voice at a time**, app-wide (`lib/voice-floor.ts`), so the tour, a trophy, the road and a pop-in never talk over each other. The student's level lion sits beside the view switch, and tapping it changes level.

**3D or 2D.** The switch is remembered on the device. 2D is the same road as a scrolling map: numbered stops down a winding path, Start on the current one, Replay and the score on passed ones. Some people would rather scroll than travel, and a phone with a weak graphics chip should not decide whether somebody can see their progress. The 3D scene draws only while it is on screen, at a slightly lower resolution cap, and is lighter on laptops for it.

### The journey's levels, and the line at the end

*Describes the CSS map, retired on 25 September; the 3D road has its own finish (above).*

The five STORY phases are numbered on the map — **Level 1** to **Level 5**, each on its own rule across the road, in the phase's color once it is open and gray while it is locked — because *phase four* is a word and *Level 4* is a place in a game, and the map is a game board. At the end of the road, two **checkered flags on poles**, waving on a slow cycle, with the number of challenges still between the student and the line said underneath. They are dim until the road is walked and lit when it is.

### A streak worth keeping

Freezes (below) cover one missed day on their own. Past that, a broken streak can be **bought back with XP** while the day is still recent, at a price that climbs with the length of the streak being saved (`streakPrice()` in `lib/progress.ts`, `keepStreak()` on the store, the spend subtracted from standing). It is offered on Today as one card and never mentioned again once the day has gone. XP is a key rather than a number in this app (§11), so spending it has to cost something — and a student who pays to keep a nine-day streak has just told themselves the streak matters.

### The first screen of an empty app

A brand-new student's Today was a greeting and three zeroes. It now opens with one instruction — *Start here: record your speaking baseline, two minutes, no preparation* — what Coach does with it, the promise that nobody else ever sees the video, and one button. It is gone the moment there is a single attempt behind them. The emptiest version of a screen is the one a student sees first and the one that gets designed last.

### Being shown around, at the moment it helps

The tour is offered **at the end of welcome** rather than the next time a student happens to open Today: the last screen offers *Show me around — one minute* or *Straight in, thanks*, and drops them on Today either way. Two things it learned from being walked on a real phone. It rings the **visible** match for each stop — the same selector also matches the desktop rail, which a phone is not showing, and ringing a hidden element dims the whole screen and points at nothing. And Coach's pop-ins stand down while it runs (`body[data-tour]`), so two voices never arrive at once.

### The map sleeps when it is not watched

*The CSS map is retired; the 3D road inherited the rule and draws only while on screen.*

The landing page idled hot, and none of the suspects were guilty: not the three films, not the roaring mark, not the soundwave, not the drifting lights. It was the **live journey map**, animating a full 3D scene far below the fold where nobody was looking. It now pauses whenever it is off screen — one line, `animation-play-state: paused` on everything inside it (`.map-asleep`). Measured in production across three seconds: 972ms of work down to 881ms, layout operations from 178 to 6. Worth keeping as a method more than as a fix — the page was measured rather than guessed at, and the guess would have been wrong.

### Watching a take back

Every moment Coach put a time on rises through the frame as the replay reaches it - the color's icon and the name of the technique (`take-playback.tsx`). It happens on the replay rather than during recording **on purpose**: nothing on the phone can judge a gesture or a story in the moment, so an icon during a take would be a guess dressed as a fact, and this app's whole standing rests on never doing that.

### The dashboard, quieter

The dashboard's panels lost their pictures with the review's (above): a tinted-ring icon, a large title and a color rule head each one, with more air between the tabs and the panel and between the rows inside it. In the lessons panel, the squares light **by count from the left** — two lessons watched in a color is the first two squares lit, wherever in the color they were watched — because the squares are a count, not a map, and a lit square after a run of dark ones read as clutter. The strip of stills beneath each color shows only the watched lessons, with their ticks; the dimmed unwatched ones are gone. (The squares still read as busy, so the fallback was taken: each color is now **one bar**, filled to the proportion watched, with the count beside it.) The challenges panel keeps its squares by position, because the road is walked in order.

### The dashboard on a phone

On a laptop the dashboard's panels sit two to a row and read as one heads-up display. On a phone one panel is open at a time, at the full width of the screen. A rail down the side was tried first and squeezed every panel into two-thirds of a phone. Two rows of tabs came next.

**Since 26 September the phone dashboard starts with its sections bar**: straight under the header with no dead space above, pinned there, scrolling sideways, with glowing arrows at each end to say there is more to either side (the fear that a single scrolling strip hides half the sections is answered by the arrows). Under it, the **live session** strip, with a glowing border because it is the one thing on the page that can be missed. Then the student's card, then the open panel. **A ☰ menu** in the top right, with search to its left, opens any section from anywhere: Challenges, Skills, Spectrum, Streak, Trophies, Community. On a phone it switches the tab and on a laptop it scrolls to the panel. The header sits above everything pinned under it, so the menu is never covered. Community has been the sixth section since 24 September, because five screens of your own numbers raise one question none of them answer.

The panels count in figures a student feels rather than in totals: **Challenges** shows how many were attempted, how many passed, and the **minutes spent speaking to a lens** ("13 minutes of speaking practiced and uploaded — well done, every minute in front of the lens counts"); **Lessons** shows lessons and **minutes watched**, and each color's lessons as a strip of stills, watched ones in color, so the library reads as something to look at rather than a list; **Attempts** carry a frame of the recording from the device's own copy, where one is still kept. **The trophy case** is the case described above: one trophy at a time on a lit podium, the day it was won and what won it, or — for one not yet won — what would.

### The dashboard's banner, and its road

**The banner is thin.** Name, level, rank, XP and the bar to the next rank; the chevron folds *Why you started* and the day's tip away rather than opening a second copy of the same information, so at rest the panels start most of a screen higher. It was a thin bar that, tapped, replaced the panel below it - which meant seeing who you are closed whatever you had open.

**The road hides nothing.** Every phase lists its challenges, greyed and padlocked the way the challenges page greys them. Veiling the far end of the road is right on the journey; on a dashboard - a page whose whole job is to show what a student has and what is left - it hid the answer to the question they came to ask. Tapping a letter opens that phase, and the space goes to the challenges themselves, each with the line that says what it asks for.

**Skills, not Lessons**, because the section has one name everywhere a student can tap it - and both it and Challenges carry a door out at the top of the panel, not only at the bottom.

### A streak that costs something

Buying a missed day back started at 40 XP. A day you can replace for pocket change was never a commitment, and the mechanic quietly became decoration. It starts at **200** - about two challenges' work - and climbs 50 a day to a **1,000** cap, so rescuing a long streak is expensive precisely because a long streak is worth rescuing (`streakPrice()`).

Nothing a student earned is ever at risk: the XP, the trophies and the reviews stay, and only the run of days resets. The streak panel says all of this in a fold - how to keep it running, that a running streak pays a bonus on everything earned, how many freezes are left, and what a buy-back costs at each end of the scale.

### The ask, and the moment of passing

**"Ready for the challenge?"** is built like Coach's own page rather than like another panel: him large in the middle, lit from below, the record button under him, nothing competing. Everything else on a challenge page is information; this is the ask. He speaks when the card is properly on screen - one of ten fixed lines, *let me hear you roar*, *lights camera action*, *show me your true colors* - once per visit, because a lion who shouts every time you scroll past is a lion you mute.

**The verdict waits to be earned.** The pass box used to sit blank and invisible until the spoken review ended, so a student who had not pressed play saw an empty rectangle. It now says *"Listen to Coach's feedback to find out whether you passed"*, which turns the wait into an instruction and makes the confetti the payoff for listening. A pass is a taller box, lit from inside, with sixty-four pieces of confetti falling **through** it - ribbons and discs in all seven colors, drifting sideways as they go, because one shape falling straight reads as rain. And *Hear it again* is on the button once he has finished.

**The review uses the width.** "For next time" was cut off on the right because the note's text column had no minimum width - inside a flex row a long line pushed past the card instead of wrapping in it. A review opened from Coach's page was also a card inside a card inside a card, each taking its own padding off; the outer two gave theirs up.

### The spectrum, in words

The spectrum's history was a row of stacked color blocks, one column per attempt: a chart that looked like data and said almost nothing, because counting the blocks in the third column to compare them with the seventh is work and the answer was a number with no meaning attached. It is one line per color now, largest first - *"Storytelling increased by 13 points"*, *"Confidence & presence stayed about the same"* - with where each sits now. **Points, not percent**: the spectrum is scored out of 100, so "up 13 points" is what happened and "up 13%" would be a different and wrong number. It compares the first third of the road with the last third, so one unusual take cannot pretend to be a trend.

**Over time, as bars (26 September).** The *Over time* view of *Your spectrum* keeps the two waves, first take faint under the latest, and in place of the list of takes shows each color as a bar pair: the first take dark, the latest in full color, with both numbers and the change. The lines of words above are what happened; the bars show it at a glance.

### The road does not drag sideways

*Written for the CSS map, retired on 25 September.*

At rest the STORY road fits the screen and the only way through it is down - but the territory washes reach past the plane's edges by design, and an `auto` overflow turned that into 121 pixels of pointless horizontal travel on every phone. Measured before and after: it is now zero, and the scene pans sideways only once it has been zoomed past its own width. Pinching still works; the magnifier is the advertised way, because a pinch is the one gesture a phone browser fights the page over.

### Seven trophies, to choose between

*Decided on 24 September: none of these. The trophies became rendered objects (see* The trophy room *above).*

At `/prototype/trophies`, in two families. Four take the badge art that already exists - the forty-four medallions are the most characterful thing in the app, each its own little painting and its own colors - and only ask what it is standing in: a stepped plinth with its reflection on the floor, an open collector's ring on a post, a tapered column under a cone of light, or tilted back on a wedge the way a medal sits in a presentation case. Three draw a disc from scratch with the lion on it: a medal on a ribbon, a cup, a coin on its edge.

All of it is CSS - a real perspective, an edge built from stacked layers so the thickness is genuine when it turns, a rim that catches light all the way round, and a gleam travelling across the face every few seconds, which is the one thing that makes a flat disc read as polished metal rather than a picture of one. Undecided; the case still shows the drawn cup.

### One spelling

American throughout - color, practiced, gray, center - in every user-facing string, every comment and this document. The coach's brief matters most: it is what he writes every review from, so the spelling a student reads comes out of that file.

### Small things that move

The lion in each dial's hub **roars** every five to ten seconds — the brand animation itself, scrubbed through the talking lion's frames, at no clock. On the streak calendar a neon glow **runs along the streak's days**, oldest to today, then rests and runs again. The lessons panel shows each color as one square per lesson, watched ones lit, and a tick in the color on every watched still.

### The dials

The skill dial and the deck's dial share one hub: **the lion holds the center and keeps its shape**; the name of the color under the pointer sits above the dial, in its color, with its count, and the hub's ring glows that color. (The name used to change inside the hub, which turned the circle into an oval on a long name.) The seven names have a short form for a dial or a tab — Storytelling, Figurative, Acting skills, Structure, Speaker's mindset, Body & physical, Advanced. The ring is the seven colors joined end to end, and one bright length of it — the color under the pointer — **slides round to the next color** rather than jumping, changing color on the way. On a phone the deck's color carousel is worked with a thumb drawn across it.

### The coach's page is the lion

Everything that is not him folds away: who he is sits behind *Read more*, and every review he has written sits behind its own header. What is left is the lion at full size, an example question drifting above him, and one button.

**The button is the wave.** The ribbons under him were the best-looking thing on the page and did nothing; the button under them was the most important thing on the page and looked like a button. They are one object now (`ask-wave.tsx`): calm and dim at rest, standing up and running bright while he listens, swelling wide and slow while he thinks - so half a minute of waiting looks like something happening.

**One tap to start, one to stop.** Holding a button down through a spoken question means a student cannot gesture, cannot think with their hands, and loses the question if their thumb slips. *Ask Coach* → *Listening* → *Processing*, and a tap on his own face cuts him off mid-word, the way interrupting a person does.

**He says hello from a file.** Twenty-one fixed lines, spoken once into `public/coach/` and shipped (`data/greetings.ts`, `scripts/build-greetings.mjs`) - instant, free per visit, and still there on a day the voice model's balance is empty, which is the day a new cohort is most likely to arrive. He used to open by reviewing the student's whole record, which put the page into its answering state before a question had been asked: the button read "Coach is answering" to somebody who had just arrived.

**And he keeps his size.** He was changing size - measured at 224, then 345, then 294 pixels wide across twelve seconds - because his column was a flex item sizing itself to its own contents: every longer example question and every change of button label made it wider. An explicit width settles it.

### The wait, made honest

Coach's answer takes six to twenty seconds; his **voice** takes about thirty-five, because it is made a word at a time. Measured, that is where the wait lives - not in the thinking, and lowering the thinking budget was tested and rejected: it halves the latency but costs the small factual accuracy (it got a weekday wrong that full thinking got right), and this app's standing rests on him never claiming what the record does not show.

So the words arrive first. The written answer appears the moment it is ready, open, and Coach says so out loud from a file: *"Start looking at your review while I put my thoughts together."* The wait stops being dead air and becomes a person gathering their thoughts, which is what it actually is.

**And he is loud enough to hear.** The clips peak at -1.4 dBFS but averaged -21.2 - about five decibels under speech meant to be heard on a phone in a room with people in it. Turning the volume up could not fix that, because the peaks were already at the ceiling; one soft knee and one gain could (`lib/coach/loudness.ts`). Measured after: -16.7 average, -0.3 peak, nothing clipped.

### The guided tour, spoken (23 September 2026)

Coach walks a new student round the place, out loud.

He arrives in the middle of the screen at full size - *"Hey there, welcome to Speak Better. I'm going to show you around the place. You can call me Coach. Tariq delivers the lessons; I review your uploads and give you feedback."* - and then retreats to the corner of the card. The same element moves, so the eye follows him there.

**Every line is fixed, and spoken from a file.** Forty-odd of them, built once (`data/tour-script.ts`, `scripts/build-tour-voice.mjs`). A tour that says something different on the second run is not orientation, and a tour that needs a working API to speak is a tour that is silent on exactly the wrong day. The line on screen is the line that is spoken - the same words, so reading and listening are the same tour.

**How a stop is shown depends on the screen, because the two sizes have opposite problems.** On a phone the card explaining a highlight covers the thing being highlighted and what is left of the app is a strip, so a stop with a film **is** that film, near enough full screen, with Coach talking over it: a student watches somebody do the thing they are about to do. On a laptop the card is a small box in a large window and the live thing is right there, so the ring stays - dimmed panels, a pulsing ring, and a second ring travelling outwards like a drop landing, because merely being undimmed does not take an eye anywhere.

**Eleven films** of the real app, recorded by a real browser at phone size (`scripts/film-tour.mjs`) - the road scrolled, a thumb round the dial, a color pressed out of the deck, the dashboard tab by tab, Today, a challenge, Coach's own page, the community, the trophy case, Jump. The recorder signs itself in as a student who has already paid and already been shown around, after the first set came back with the landing page and the tour's own offer card in shot.

**Six section tours** as well as the long one - challenges, skills, cards, dashboard, community, and how to talk to Coach - three to six stops each, living on the page they are about. The whole-app tour is for arriving; these are for the other way a student gets lost, landing straight on the cards three weeks in with nobody to ask. They share one runner (`tour-runner.tsx`), so the short ones cannot drift from the long one. A section tour has no title card: pressing *Tour this section* is the decision to take it, and a second press on a card saying "let me show you around" is a door in front of a door.

The top bar offers the tour that fits the page - **Full Guided Tour** on Today, **Guided Tour** anywhere with one of its own (renamed on 26 September from *Take the full tour* and *Tour this section*) - and it is the only door, because two doors into one room is clutter. A stop can also say two different things depending on the screen: telling somebody at a laptop to tap the portrait button is telling them about a control they do not have.

**Ten stops, not nineteen (25 September).** The six dashboard stops became one and the challenge stops became *Inside a challenge*, told over the real baseline challenge page, dimmed and untouchable. The challenges stop now describes the new road, in Tariq's words, with a film of it in 3D. Section tours never start themselves: an unasked-for tour interrupts at exactly the moment somebody is trying to look at what they just tapped. **The app cannot be clicked while a tour runs.** A stray tap used to end the tour, which is what threw people out on the skills dial, so the tour's own buttons are now the only way through or out. Welcome ends in one button, *Send it*, straight into the tour, skippable from inside. And **a tap on the lion pauses Coach** and a second tap carries on from the same place, on his page, in the tour and in Meet Coach.

### The review, spoken and seen

One button — *Listen to your coach's feedback*, with the lion's head and a listening icon. As the lion speaks, **the words come up as captions** a phrase at a time, over the wave, so the feedback is heard and seen together the way a reel's captions are followed; the spoken text isn't printed under the lion, and *Read the transcript* opens it full screen. The review then reads as rooms rather than a page of text: the brief isn't read back (it's at the top of the page), and each part sits under its own plate — *What worked*, *Your color spectrum*, *The lessons this challenge asked for*, *Skills you used without being asked* (with a glowing border), *For next time — do more of this* — and the verdict last, said plainly: *"Didn't pass this time."* A miss is named in the spoken review too, after the credit: the criterion, and the one turn that would have made it.

### The review, folded — and kept

The review arrived as sections under full-color plates — the streak's fire, the neon lion — and the pictures competed with the data, which is also in color. Now each section is a card that opens: a large plain title, a one-line summary readable while folded (*3 things Coach saw working*, *5 of 7 colors lit — 2 of the 2 this challenge needed*), the spectrum open to begin with and the rest closed. Three header treatments were tried (a muted plate, clean, a thumbnail); **clean** won — the icon in a ring tinted the section's color, a rule in it, no picture — and the same header now tops every dashboard panel and the landing page's sample review: the pictures are gone from the panels altogether (`section-banner.tsx` keeps its `image` prop and draws nothing with it).

**A review is never lost.** Every review lives at `/review/<attempt id>` — the page it landed on, Coach's voice playable again, the recording where the device still holds it — reached from the challenge's attempt cards (*Open the review →*), the coach page's history (*Open the full review*) and the dashboard's recent attempts. A visitor who recorded the free first challenge on the landing page can come back to theirs without unlocking anything. **A lesson opened from a review returns to it**: it opens at `/review/<id>/lessons/<lesson>` — only the lessons Coach named in that review, why he named this one (used and how well, spotted at a moment, or the note it belongs to), the others a tap away, and *Back to your review* at the top and the bottom — never the library, where the review was getting lost.

**After a take, two words: Redo, or Send it.** The send shows a bar filling in the seven colors under *Sending it*; the watch shows the lion, the still, and a bar that fills over the minute or two it takes (honest about time rather than progress, since nothing arrives until it's done) under *Coach is watching your video* — the colors sweeping through the words so the wait reads as something happening.

### The lion is "Coach"

The lion has a name, and it is Coach — introduced once with the quotes (*Meet "Coach"* on his page; *feedback directly from "Coach" — the lion* on the landing page), plain after: *Coach's review* (the drifting neon pill that plays the spoken review), *Ask Coach*, *Send it to Coach*, *Coach is watching your video*, *What Coach has said*. He speaks first on his page: a greeting written live from the record and how many times they've opened the page today (counted on the device) — never canned, never the same twice — that touches one true thing from their takes, says he's been tracking their progress, and asks how he can help. Autoplays where the browser allows it; a tap otherwise.

### What the coach's brief learned from a real upload (20 September 2026)

- **What the camera couldn't see isn't scored.** A selfie-mode take that shows head and shoulders can only light body language and acting for what the face and voice did, and the review says why in the coach's words and puts the fix — prop the phone up, whole body in frame — near the top of the improvements. The recorder says it before the first take.
- **Expected length.** `expectedSecondsFor` — a minute for the baselines, two for a story, most of a short limit — goes to the coach with the brief; a short take is credited for its time and told plainly what it would take, and cannot pass a brief that asks for a complete story.
- **Show the line.** Every improvement gives the example itself, in quotation marks, in the student's own story: reliving a moment shown the teacher's way (present tense, the senses, the dialogue, the turn), a missing metaphor written for them, any asked-for skill demonstrated at the moment it belonged — the line written out or the move described beat by beat.
- **Filler words**, counted and coached: one or two is natural, more than a handful is named, with the fix — close your mouth while you think.
- **Eye contact, at every level** — a staple, not an advanced note: where the eyes went and how much of the time, and what it did to the one watching (*I didn't feel you were looking at me — next time, try looking at the lens more, so I feel you're looking me in the eye*).
- **Coach speaks as the one who watched.** The review is in the first person — *I felt, I leaned in, I couldn't see your hands, I loved that you asked me a question there* — and then extended to the audience they'll have. A rhetorical question was asked of him; a held lens was held on him. And the rule above all: what the camera didn't show isn't scored, at any level, and the low color is explained as a setup to fix, never left as a bare number.
- **The voice itself — resonance, support, where it drops** (Advanced in full; Intermediate where it helps; Beginner only when plain). Gemini hears tone and melody well but can't measure, so the phone measures (`lib/voice-profile.ts`, run while the take uploads): the pitch's median and range, how far the pitch and the volume fall at the ends of phrases (the voice dropping, the last words lost), where the weight of the voice sits in the spectrum (a rough proxy for chest-forward vs thin), and the pauses. The numbers go up with the take and into the brief, marked as proxies — the range, the phrase-end falls and the pauses dependable, the spectral weight rough — and Coach says only what the ear and the numbers agree on, in the teacher's images: *you made your message a melody… your voice will project even more, and feel even more resonant, if you imagine speaking from your belly — and keep the last word of each sentence as full as the first.* Never a diagnosis. (What a phone can't tell: diaphragmatic support as such, or nasality reliably — the codec and the room color both; the proxies are honest about that.)
- **Coached across time.** Every review now records the same few observations (filler words counted, where the eyes were, how much of the student the frame showed, hands visible, the voice in a clause, the pace) and keeps the phone's voice measurements; the last eight takes go up with each new one, and Coach adds **Since you started** — its own section, and a line in the spoken review: improvements celebrated with the numbers (*three to five filler words when you started, one today*), a slip named gently as awareness (*lately it's thinned a little — not a big thing, I'm pointing it out so you can be aware of it*), never scolding, never a change the record can't show.
- **The advanced color is rare.** It lights only when a professional technique is actually demonstrated and named with its moment — a mic drop, a callback, an open loop closed, memorised delivery, a live audience worked — never for general confidence or a strong take.
- **The levels say what they change.** Beginner: Coach looks for the basic implementation of the lessons a challenge asks for. Intermediate: more of the spectrum in every take, the techniques used without being asked named, the reach into other lessons. Advanced: nuance and detail — projection and resonance, the dropped-in register, eye contact with the lens, whether the gestures accurately describe what's said, whether what's said is also painted. Said on the welcome page and in the level menu; the brief's level guide matches.

### What the brief learned from the first real baseline (23 September 2026)

One student, one baseline upload, four faults - and all four were the brief's, not the model's.

- **A criterion that was met was marked unmet.** "Say something true about yourself" was not ticked for a take that said "I've always loved speaking". Everything in the brief pushed towards strictness and nothing pushed back, so strictness now cuts both ways: where a criterion is marked unmet the evidence must say what was missing and where it was looked for, and if that sentence cannot be written honestly, it was met. The criterion is read as written and no more strictly than it is written - a true thing does not have to be a confession.
- **A color is a shelf of lessons, not a mood.** Acting and figurative lit up on a take that used neither. A color now lights only for a technique **taught in one of its own lessons**, with the lesson and the moment both named in the evidence, and the brief says what each color is *not*: figurative is metaphor and imagery, not an enthusiastic adjective; acting is a change of register or reliving a moment, not a lively voice; structure is a shape a listener can feel, not finished sentences. It also says the true shape of a first take - **one or two colors** - because five lit on day one tells a student they have arrived and leaves nothing to watch grow.
- **A lesson only counts when its situation happened.** *Don't Sell, Invite and Recommend* was credited to somebody who was not selling anything; it is a lesson about making an **offer**, and saying speaking is a superpower is not an offer. Every lesson gets the same test - a pause lesson needs a pause you can point to, a callback needs the thing being called back - and an empty `skillsSpotted` is an honest one.
- **No dates, and numbers as numbers.** Coach places a take by what it was ("your bus story", "three takes ago"), never by a weekday: working out which day the 20th fell on is arithmetic he can get wrong, and a coach who gets the day wrong sounds like one who is guessing. The delivery is the subject, not the calendar. And he writes 62 rather than sixty-two, because every word of a review is read on a screen as well as heard.

### Who is in the video

Before anything else, Coach looks at what he was actually sent.

**No speaker at all** - a pet, a room, a screen recording, silence - is not reviewed as a take, and the response is a joke rather than a correction: *"Cute dog - is he taking the course too?"*, *"Have you taught him to speak? Now THAT is a trick I want to see."*, *"I watched all forty seconds of that wall. Strong, silent type. Your turn."* A student who uploads their dog is testing the coach, and a coach who plays along has proved he is watching. Then one plain line asking for one of them instead; no criteria met, no colors lit, and never a pretence of having watched a performance that was not there.

**Somebody else speaking** is allowed, and gets a review in full - the score, the colors, the strengths, the improvements - because somebody spoke and that performance deserves the same attention. What follows is one aside, warm and a little amused: *"You do look rather different from your last few, though. You're welcome to have a friend do the talking, I'll review whatever you send me. I just can't show you how YOU are coming along unless it's you in the frame."* Each review keeps a short, neutral note of who was in frame (`observations.speakerLooks`) purely so the next one can tell - never shown as-is, never a remark about anybody's looks. And never a suspicion: a student who changed their hair should not be interrogated about it, so where he cannot tell, he says nothing.

### Every moment, not every technique

The review's `moments` list is one entry **per instance**, not per technique: four gestures is four entries at four different seconds. It is what rises through the frame while a student watches their own take back, and repetition is the whole point - somebody who sees the blue hand rise five times across two minutes can see for themselves that they are doing it steadily, which no score conveys. Each carries its own symbol rather than its color's: a hand for a gesture, an eye for holding the lens, a brush for an image, a book for a scene (`moment-icon.tsx`). One of each kind per second, so a gesture and a held lens in the same breath both rise but the same thing twice does not.

### The review's colors

On the review's spectrum and the attempt cards, the colors a challenge needs to pass **glow and pulse softly**, marked *needed*; the rest are marked *bonus*. The attempt cards draw the same resonance wave the dashboard does, with a key beneath — each color's score and short code, in its color — so a wave reads as clearly as the bars, and the score is written out of a hundred. Record is a neon red button; Upload a neon cyan edge; sending a take is a round send icon; while the coach watches, the student's own still sits beside the lion with a pair of eyes tracking side to side; and the feedback is one button, *Play feedback*, with the lion's head and a listening icon.

### The level lion

The three levels are each represented by a tinted version of the brand mark: **yellow for Beginner, orange for Intermediate, red for Advanced** — a warming scale that reads as increasing heat rather than arbitrary labels. A student picks their level by choosing a lion at onboarding, and from then on that lion follows them: beside their level in the top bar, and on their Profile. The mark becomes their standing rather than a word.

### Icons throughout

Nothing in the interface is a filled emoji. Every icon is drawn stroke-only on a shared 24×24 grid and takes its color from whatever surface it sits on, so the whole set reads as one family. That covers the four navigation destinations, every badge, and **one icon per skill category** — a book for storytelling, quote marks for figurative language, a mask for acting, stacked blocks for structure, a head for mindset, a figure with arms out for body language, a star for advanced — each carrying its own category color.

### Video stills, not title cards

Lessons and challenges are presented as vertical carousels of **stills taken from the middle of each video**, where the coach is mid-gesture and visibly teaching. This is deliberate: the platform's own thumbnails come from the opening seconds, where these videos show a title card, so half the library would otherwise present as a logo wall rather than a person. Seeing a real teacher on every row is the point.

### Today — the daily home

The app opens onto **Today**, not the challenge library. A library of 21 challenges invites browsing; a daily surface produces practice, and practice is the entire method. Today carries the greeting, the daily goal, one **named next action** chosen from real progress (resume what's underway, else the next unpassed challenge in journey order), where the student stands, their last talk's spectrum, and lessons to pick back up.

Since 25 September Today opens with Tariq's own short film, *From shy to shining*, playing in place on a tap: the teacher's face is the first thing a student sees each day, not a number. The **check-ins** (§13) sit here too, once at the start of the cohort and once at the end, because Today is the page a student is guaranteed to open.

**Streaks survive one missed day.** Every student holds a small number of freezes, spent automatically when exactly one day is missed between two active ones. Losing a long streak to a single busy day is the most common reason people abandon a habit app, and the SPARK principle here is literally *Keep Going*. The bonus a streak pays climbs 5% a day to +50% at ten days, then 2.5% a day to +100% at thirty, and stops. Past that the reward is a freeze every ten days rather than more XP, because an uncapped multiplier would make the hundredth day worth more than the work.

### The coach speaks up

Beyond challenge feedback, the coach **drops in unprompted** with encouragement built from the student's own figures — that their spectrum widened from two colors to six, that their score climbed nineteen points, that they went back at one challenge five times, that a streak is holding. It's rationed to once a day, never appears over a badge celebration, and stays silent when there's nothing true worth saying.

The rule that governs it: **every claim is checked against the record first.** The coach never congratulates anyone on something that didn't happen. That constraint holds when a language model replaces the composer — the model receives the same verified figures and phrases them, rather than inventing them.

### The lion speaks — settled

The coach's voice and the lion that says it are decided, after an audition of Gemini's thirty stock voices against real lines of coaching (the bench is at `/prototype/voice`), and these are the settings the app ships with:

- **Voice: Charon** (Gemini text-to-speech), **British** — Received Pronunciation, London.
- **Direction:** *"in an extremely deep, low, rumbling, gravelly bass-baritone — a lion's voice, rough and resonant, right down in the chest — calm and even, with little rise and fall, at a natural conversational pace."* Even, not melodic: the delivery was over-expressive when the direction asked for energy, so it asks for steadiness instead.
- **Pace: 1.43×**, pitch preserved, applied on the server (`src/lib/coach/stretch.ts`, WSOLA) so the clip arrives at pace and the phone plays it straight — the browser's own playbackRate chopped words on Safari. Gemini takes pace in a direction loosely, so the exact part is ours.
- Only a voice that is still one of the app's presets is honoured from a browser's saved choice; anything older falls back to these, so a phone that auditioned weeks ago doesn't keep an old lion.

**The lion's mouth** is the brand animation itself, not a puppet of it: twenty-eight frames of the mark's own roar (ten real, two motion-interpolated in-betweens after each), scrubbed by the loudness of the voice. Its resting frame has been closed — the mark is drawn with the lips slightly parted, so the dark wedge is shrunk to 40% with the outline untouched — and it never reaches the roar itself, which read as exaggerated on ordinary coaching. Between frames the two neighbours are blended, so it blurs while it moves and is crisp while it doesn't. And it opens on **a beat of speech, not a syllable**: a sound opens it, it holds for about two syllables, closes promptly, and the next sound opens it again — "momentary" is two opens, *moment* and *tary* — which is what talking looks like from across a room. The sprite is rebuilt from the delivered MOV by `scripts/build-lion-mouth.py`.

The teacher's own cloned voice remains a later swap behind the same function (`src/lib/coach/voice.ts`).

### Showing the mechanic before the sale

The color-spectrum score is the product's one genuinely novel idea, and a visitor previously couldn't see it until they had paid, onboarded and uploaded. The landing page now **plays it**: a sample review runs end to end — the coach watches, the spectrum fills, the notes land one after another, and the lion says it aloud. A second demo shows the same speaker before and after, two colors against seven. An instructor section answers who is teaching this.

### The STORY journey, phase by phase

Each of the five phases owns a color, borrowed from the skill it leans on most — **S** green (awareness/mindset), **T** cyan (the physical instrument), **O** yellow (storytelling), **R** red (emotional truth), **Y** magenta (structure and the world). Every phase is drawn as its own bordered section holding just its challenges, so the journey reads as five distinct stages rather than one long list, and the phase's color runs through its letter, its heading, and its progress bars.

Each challenge card carries a still, its brief, a **progress meter**, and a single action button that names where the student actually is: *Start challenge* when untouched, *Resume challenge* once underway, *Practice again* once passed. Progress is weighted across the real sequence rather than being all-or-nothing — warming up on the related skills, recording an attempt, and passing it each move the meter.

**The road remembers.** Beside a passed challenge, one line the coach said about that take — proof it watched, and a reason to read the review again. And when a rank opens the next phase, the graduation card floods with the phase's color, the lion roars it open, and the first challenge's still rises out of the dark.

*The pins, the pinch zoom and the faces in the circles below belonged to the CSS map; on the 3D road a trophy stands beside its portal and the traveller carries the student's photo (above).*

**Trophies pinned where they were won.** A badge is earned on a take, so it stands beside that take's node: a small gold GPS pin — a dot at the whole-road scale, its name shown when the map is zoomed in. The road is a record as well as a route.

**A pinch to look closer.** The map zooms — a pinch or a double tap on a phone, ctrl+wheel or the −/+ buttons on a desktop — using the CSS `zoom` property, so it's a real layout scale: the page grows and scrolls as ever, and the scene scrolls sideways for the width that no longer fits. Zoomed in, the trophy pins say their names and the other students on each challenge appear beneath it (their initials and a count, from the same presence the *Students here* panel reads). Two rendering notes from building it: inside the tilted 3D plane a `box-shadow`, and any box shared by a pin and its label, rasterised as a dark square — so a pin's glow is a radial gradient and its label is a sibling, not a child.

**Your own face on the road.** Where the device still holds the recording, a passed challenge's circle on the map wears a frame of the student's own take instead of the challenge's still. Held under a finger it plays a few seconds, muted; now and then one plays by itself, at random — proof, in their own face, that the road behind them was walked. If the copy is gone (the app keeps three per challenge, on the device only — §13), the circle shows the challenge's still as before.

One small piece of routing follows from this: a student who opens a lesson from a challenge's warm-up is offered **"Back to the challenge"** rather than the next lesson in the library, because the lesson was a detour rather than a destination.

### Portrait zoom for video playback

The lesson and challenge videos are filmed in landscape, but most students will watch them on a phone held in portrait — where a landscape video plays small, and the details that matter most in a speaking course (hand gestures, posture, eye contact) shrink with it.

So every video player carries a small zoom-icon button. Tapping it zooms into the center of the landscape frame — where the speaker is — and fills the phone's portrait screen with them. The effect is like having the lesson play fullscreen in portrait: the speaker large and close, their body language actually visible, instead of a distant figure in a letterboxed strip. Tapping again returns to the standard landscape view.

**The captions come with it.** Zoomed into portrait, the video's own captions used to be left behind with the letterbox, which took the words away exactly when the student had chosen to look closer. They are drawn inside the takeover now, a line at a time, from the player's own caption track (`caption-line.tsx`, the `cuechange` event with the text track enabled but hidden) — the same karaoke shape the coach's spoken review uses, so words under a face look the same everywhere in the app.

It's a small control, but it serves the course's core subject directly: a course that teaches physical expression has to make physical expression easy to *see*, on the device students actually use.

## 15 · The landing page and purchase

The landing page is the one place a stranger decides, and until 26 September it was twenty-one thousand pixels read as one scroll. It said *practise, don't just watch* five times before it made the case properly, and it showed the same review twice. It is now **nine numbered chapters** (`landing-sections.tsx`): **01 Overview · 02 Meet Coach · 03 Why it's different · 04 How it works · 05 What's in the app · 06 Skill Lessons · 07 The challenges · 08 Two mentors · 09 Pricing.** Each opens with a numbered mark (*02 · Meet Coach*). A navigator runs down the right edge on a laptop as dots, with names on hover or always shown on wide screens; on a phone it is a *Sections* button that also says where you are. Long paragraphs and long testimonials fold behind **Read more**, which appears only when the text is actually cut off. The rule behind all of it: every idea is said once, in the chapter where it proves something.

- **01 Overview** is the promise and nothing else: the lion (it talks, mouth moving with the words, when *Listen to Coach* plays the headline), the headline, Tariq's *"You can't rely on AI in person"* video beside it on a laptop, the cohort's date, five ticks, and the door. A **founding cohort panel** says *Only 20 spots available* and gives the first two lines of why it is priced as it is; the rest of the reason, the six-week run and the Founding Cohort trophy are behind Read more.
- **02 Meet Coach** is one card: *Tariq teaches. I review.*, the positioning line (*the only AI coach trained on a complete speaking method*), and the sample review in the app's own shape, spoken with captions, spectrum wave above the bars, confetti over the pass. The testimonials follow it, rising continuously without pausing on hover, and no quote appears twice on the page. The quotes that stand alone between chapters are still pull-quotes on **blue glass**, placed away from the testimonial walls.
- **03 Why it's different** opens on the collage (*Imagine the cameras are rolling…*: candid phone-quality shots of people vlogging, podcasting and speaking) and then **three beats** side by side across the full width, or as a carousel on a phone: *you don't learn to sing by going to concerts*, *you didn't learn to drive by buying a course*, *you won't learn to speak just by watching videos*. Then the core claim, in one blue-glass container with Tariq's *"not just another online course"* video: **Speak Better's Speaking Spectrum makes it unlike any other course or app on the market** (§05), the before-and-after spectrum, and the comparison cards as the proof.
- **04 How it works** is the five steps (watch, record, upload, receive feedback, improve) with a photo on each, then *This is how you actually record yourself*: "No studio, no crew, no fancy equipment. Simply prop up your phone and press record through the Speak Better Selfie feature." Four **selfie phones** each sit on a real challenge (a story, no filler words, describe vividly, the thirty-second pitch) and show what the recorder shows: the brief and that challenge's own criteria ticking off one by one as the take runs.
- **05 What's in the app** is *What you get*: the five numbers as the things themselves, **animated tiles** (83 lessons as a collage of their thumbnails bordered in their colors, the 24 challenges as the 2D road scrolling, the deck fanning through its colors, Coach talking with captions, the spectrum turning from wave to bars), the other six features in a strip beneath, and **eight films** of the real app: the road in 3D and in 2D, skills, the deck, Ask Coach, the dashboard, the community, Today.
- **06 Skill Lessons**: *Here is a preview of the full library of skills you are about to unlock, color-coded and waiting for you.* Pick a color, and its lessons run down one side while the chosen one plays.
- **07 The challenges**: *Introducing true interactive challenges and the Speak Better S.T.O.R.Y. framework*, trophies, completing them together, and the road itself in a phone with its own 2D/3D switch. It is shown once, here. The 3D film no longer opens on an empty *Start challenge* screen; it starts already moving down the road.
- **08 Two mentors**: the best of human and AI. Every lesson and challenge is studio-recorded by Tariq, and Coach reviews, encourages and guides. Two phones, Coach's arriving first and Tariq's sliding out from under it. The collage returns as the last thing read before the prices, as the reality waiting on the other side.
- **09 Pricing**: the three tiers, the guarantee, the FAQ, and the consent line (§13, and below).

**Three Join buttons** in the page (after the opening, after Meet Coach, before the prices), plus *Join Now* held in the header on a laptop and a join bar at the foot of a phone, *from $299*, which steps aside while the tiers are on screen. Every one lands on the tiers. The calls to action are frosted glass pills with a tint drifting through the seven colors. The 14-day guarantee is a minted gold seal carrying the lion, placed beside the first and last asks and under the tiers and nowhere else, because a seal on every door stops being a promise.

**The origin story moved to `/about` (26 September).** In the middle of the pitch it asked a buyer to read a biography on the way to the prices; on its own page it is there for the people who go looking for it. It is linked as *About* in the header, on phones too, and ends with a Join door. It is Tariq's own telling, lightly edited: Bali in 2011 and the email from TEDx, the first speech, the stages, the formula behind a standing ovation, *Communicate and Captivate*, Coach the Lion, the mission. It is pictured as half-remembered photographs, a real-looking photo underneath each and an underdeveloped-film, neon-halation treatment on top, chosen on `/prototype/origin-styles`. The page footer links the **Terms of Service** and **Privacy Policy**.

Two things came off the page and are worth remembering why. **The free first challenge and the live recorder**: mounting the camera on a sales page asks a large thing of a stranger who has decided nothing, and a free challenge beside a paid cohort sells two different things. There is no free trial anywhere now; the guarantee is how somebody tries it (§15, *The offer*). And **the placeholders**: the concert and lecture pictures were byte-for-byte copies of other images on the page until 23 September. A placeholder of the right shape is the kind that ships, and the kind that quietly stays.

### The offer — course + membership

*This is the offer as first proposed. The cohort pricing below replaced it on 23 September and was settled on 25 September; the table is kept for the reasoning and the market comparison, not the numbers.*

The shape is course plus membership, because the method deserves a price that says *this is the method*, and the coach costs something every time it's used. Three tiers, on the landing page and at `/pricing` — side by side on a desktop, as tabs on a phone (`tier-tabs.tsx`):

| Tier | Price | What it is |
|---|---|---|
| **Starter** (`foundations`) | **$149**, one payment, lifetime | The method: all 81 lessons, the deck, the 24-challenge STORY journey, the standing coach's written feedback on every take, XP, ranks, trophies, streaks. No video review, no *Ask your coach*, no board. |
| **Full Experience** (`coached`, the default) | **$29/month or $249/year** | Everything in Starter plus the coach who watches every take, spoken feedback with captions, *Ask your coach*, this week's board, notes when a review is ready. Up to 20 reviews a month. Cancel any time; Starter stays theirs. |
| **Ultimate** (`founders` — *the Founders complete set, including the physical card deck and the physical book*) | **$599**, one payment, limited seats | A year of the Full Experience, a monthly live group session with the teacher, a live cohort that starts and finishes together, the printed deck posted to them, the book when it ships, first access to new lessons. |

Why these numbers: $149 sits under the "think about it" line for a named course; $29 is above the AI-feedback apps because the curriculum is in it, and the yearly at $249 is less than the one-off plus two months, so the yearly is the obvious choice; at a few cents a review the membership's margin holds. Comparable market: AI-feedback apps at $10–30 a month with no curriculum, named speaking courses at $200–600 one-off, coaching at $150–400 an hour.

Two things to build on this: **pay-as-you-go by phase** for Starter buyers who won't subscribe — the coach for one phase at $39, the same gate the ranks already draw — and **teams** at $20 a seat a month, ten seats minimum, with a manager's board; one team contract is thirty consumer subscriptions.

**Other structures worth exploring for launch** (weighed 19 September 2026, none built): a **founding-member price** — the first hundred at a yearly rate that never rises, which makes urgency honest and seeds the board and the testimonials; **a review pack** — ten reviews for $39 with no clock on them, for the Starter buyer who wants the coach for one talk rather than a month, sold from the *review spent* gate; **the cohort as the product** — a dated six-week *Communicate and Captivate* at $399–$599 with the app inside it, which is what the teacher has already sold and what people already write letters about, run three or four times a year as the launch moments; **a gift and a team seat** — a one-line "give a year" at checkout, and the team plan above with a manager's board, because a company paying for ten seats is the cheapest acquisition there is; **a results guarantee** on the Full Experience — pass the baseline and a phase within thirty days or the month back, cheap to honour because the coach actually watches. The one to avoid: a free tier with unlimited written feedback — it would move the coach's cost to the wrong side of the card.

In the code the plan lives on the student's state (`data/pricing.ts`, `lib/plan.ts`) and the checkout is still a stub — Stripe arrives with service integration (§19), and the webhook calls the same unlock the stub does.

### Paying, and the cohort's prices (23 September 2026)

The first cohort is three one-off payments for **six weeks** of access, not a subscription: a cohort starts and finishes together, so a monthly plan would be asking somebody to keep paying for a thing that has already ended. Six weeks is said everywhere a price is, including on Stripe's receipt and on the screen a student lands on after paying.

The tiers were renamed on 23 September and priced for a **founding cohort** on 25 September (`src/data/pricing.ts`):

| Tier | Founding price | Later price, shown struck through | What it adds |
|---|---|---|---|
| **Starter** (`foundations`) | **$299** | $997 | The full six weeks: every lesson, the challenges, the deck, Coach's written and visual feedback on every take, and every weekly live session. |
| **Complete** (`coached`, featured) | **$498** | $1,498 | Coach on call 24/7: spoken reviews with captions, *Ask Coach*, the board. |
| **VIP Ultimate** (`founders`) | **$997** | $2,497 | Tariq watching the student's takes himself and answering one to one, plus the **printed card deck** and **the book**, *Speak Better: Unleash Your True Colors and Roar on Screen and Stage*, shown in its tile as the real book. Both are theirs to keep, even after a refund. |

The live cohort and the weekly sessions are in **every** tier. A cohort where only the top tier can attend the calls is a course with a VIP room attached, and it leaves out the students who most need to watch somebody else be coached. What VIP Ultimate sells is the one thing that genuinely cannot be given to everybody: the teacher's own time. So it has its own box above the ticks, not a sixteenth identical line. The name is set in gold.

**Why a founding cohort, and why the struck prices.** There are **only 20 spots**, starting **3 October** (`src/data/cohort.ts`). They are priced low in return for something real: before Speak Better opens wider, Tariq wants these students' feedback on the app and their testimonial. The later price beside each one makes the discount a fact rather than a slogan, and says honestly that future cohorts will likely cost more. This is the "founding-member price" weighed on 19 September, made concrete.

**No free trial, anywhere (24 September).** The offer is the cohort with a **14-day money-back guarantee, for any reason** (`guarantee` in `pricing.ts`, read by the panel, the FAQ and `/pricing`), and a page that also says "try the first challenge free" is selling two different things. The trial plan is gone from the product too: someone without a paid tier is sent to the tiers, and a stored `"trial"` reads as no plan. **Upgrading from Starter to Complete costs the difference, $199, within the first 14 days.** After the six weeks, staying on is optional and month to month: Starter $14.99, Complete and VIP Ultimate $29.99. Nine folded questions under the tiers answer the rest, and every figure in them is read from the file that owns it, so an answer can never quote a price the checkout does not charge.

**Starter is Coach in writing.** He watches every take and writes the full review card; there is no spoken review and no asking him questions. Opening his page on Starter says so in Tariq's words, *"Written and visual feedback only. To have Coach talk to you and have Coach talk back to you, please upgrade"*, with a button charging **$199**: the difference between what they paid and Complete, never a second full price. Their written reviews keep working the whole time, because taking something away to make an offer look better is the wrong trade.

**Checkout is Stripe Checkout.** One press opens a session on our own server and the browser goes to Stripe; no card field is ever rendered by this app, which is the point - the least designed part of a payment should be the part that touches the card. The webhook is the only thing that may grant a plan on the server and it verifies the signature before reading a single field. The return page confirms the session **with Stripe** rather than trusting a query string, then lets the device in immediately so nobody waits on a spinner after paying.

Prices live as cents in `data/pricing.ts` and the session is built with `price_data`, so changing the code changes the charge and there is no second catalogue to keep in step; `STRIPE_PRICE_*` is the hook for moving to dashboard Price ids when the offer grows past three one-off tiers. And with no `STRIPE_SECRET_KEY` the buy buttons do exactly what they did before checkout existed, so previews and the landing page's demo keep working with no keys at all.

What remains before money can actually be taken: the secret key and the webhook signing secret in Vercel, `NEXT_PUBLIC_SITE_URL`, and - for the plan to land on an account rather than only on a device - the Supabase service-role key. And the paywall itself: `PAYWALL_ON` in `lib/plan.ts` is **false** until Tariq says the first students are coming. While it is off the app is open to everyone, and a tier somebody does pick is honoured, so each tier's experience can be tried exactly as it will be sold (§21).

**Consent under the prices.** Before anyone pays, the pricing chapter carries the consent line, *What does that mean?*, and *By joining you agree to the Terms and Privacy Policy* (§13). Somebody should learn what they are agreeing to before the card, not after it.

### Social proof — live (24–26 September)

The teacher's real testimonials, from past students, are on the page: **25 live, 2 held back** while an attribution is unsettled. They were captured verbatim, with nothing tightened, brightened or merged, because a testimonial that has been improved is not a testimonial. Every name was confirmed by Tariq, and none was guessed from a misheard spelling. Putting one person's words in another's mouth is the one mistake a testimonial cannot survive, so a quote with two names attached stays held.

The faces are **not** generated portraits, reversing the earlier plan. An invented face beside a real name is a picture of somebody who does not exist presented as them, on the page where a stranger decides whether to trust this. Each quote carries the app's own initial-avatar instead, and real photographs with permission will drop into the same slot. The quotes are dark navy on white cards, because on an all-dark page a white card reads as words lifted from somewhere else, which is what a quotation is. They rise continuously in two walls, one after Meet Coach and one in the pricing chapter, and **no quote appears twice** on the page.

## 16 · A three-part system: course, book, and card deck

The course isn't meant to stand alone. It's the first of three reinforcing formats — a **trinity speaking system** — built from the same underlying skill material: the course, a companion book, and a card deck. All three teach the same skills, in the same categories, using the same color-coding, so a student who's learned "storytelling is yellow" from the course recognizes the same yellow the moment they open the book or pull a card.

| Format | Mode |
|---|---|
| The course | Watch a short lesson, then practice it on camera and get scored. |
| The book | Read the skills in full, woven together with personal stories. |
| The card deck | Pull a single skill at a time — fast, physical, usable anywhere, even away from a screen. |

### The book

The transcript library serves a second purpose beyond powering the AI coach: it's the source material for the companion book, also called *Speak Better*. The book mirrors the course's own category structure — organized around the same skill areas, storytelling, body language, figurative language, mindset, and so on — rather than being written from scratch as a separate work.

It isn't the transcripts republished as-is. Personal stories are interspersed throughout alongside the skill explanations — roughly half story, half skill content, woven together rather than kept in separate halves — turning the reference material into a full, robust, narrative book: *How To Be a Powerful Unforgettable Speaker.*

The book is sold as its own standalone product, not bundled by default, with the course and the card deck offered as an upsell from it.

It has a title now: *Speak Better - The 7 Colors of Fearless, Unforgettable Speaking*, with the strapline *"Find your true colors. Overcome your nerves. Roar on screen and stage."* By Tariq EQ Amawi - TEDx Speaker, Slam Poetry Winner & Creator of the Mic Drop Method. The cover: the lion enlarged on the app's dark glass with a bold speaking-spectrum wave (public/book/speak-better-book-v3.webp), shown in the VIP tier; alternatives on /prototype/printed.

### The card deck

The card deck carries the same skills and the same color-coded categories as the course and book, but compressed to their most essential form: one skill per card, a succinct explanation of what it is, and a concrete example of it in action.

It exists in two forms: a physical, printed deck sold as its own product, and a digital version living inside the app itself, inside Skills — so a student can pull a card on their phone as quickly as flipping through the physical one.

#### The mechanic — one card of each color

The deck is built to be pulled from, not read cover to cover. A student preparing for a real, upcoming talk **pulls one card of every color**: a yellow one for the story they'll tell, orange for the language they'll paint it in, red for how they'll perform it, magenta for the shape they'll build, green for what they'll bring to it, cyan for what their body will do, crimson for the finish. Seven cards on the table and they hold the ingredients for a talk that moves — not one technique used well, but a range, which is the whole argument of the course.

And when they want one idea and nothing else, they reach for a color: yellow for a storytelling skill, cyan for body language. **The color is the index.** That is why every card is its section's color edge to edge, and why a card face down gives away its color and nothing more.

**Pulling cards from different colors is the color-spectrum score (§05) worked backwards: instead of finding out afterward which colors were missing, a student uses the deck beforehand to make sure the talk touches many of them from the start.**

It's also why the deck can't be curated thin. A hand is only as good as the choice behind each card, so the depth of each color is what makes pulling from it feel like a decision rather than a draw.

#### The card

**Format.** Oracle-deck size — 89 × 127 mm (3.5 × 5 in) — not the smaller poker size a playing deck uses. These are cards you *read*: held one at a time, carrying text, meant to sit face up on a table while a talk is being built. The larger stock is also what lifts the printed body text from roughly 6pt to roughly 9pt.

**The colored face.** The section's color edge to edge, the lion mark in a navy well, the section name, and the section's short code (§03) in both corners. It carries no card number and no lesson title — **face down a card gives away its color and its section and nothing else; a deck whose backs can be told apart isn't a deck.**

**The lesson face.** A navy gradient, and across the top a lit plate: the lesson's own motif drawn as a neon tube in the section's color, glow bleeding into the dark and a reflection beneath it — the same glyph the player floats during that video (§03), and the same neon as the dashboard's section banners, drawn rather than photographed. Drawn, because vector stays sharp at print size and runs as one ink; a photographic neon is thousands of colors and cannot be a spot color.

Under it, the mark and section, the lesson title, and then the card teaches rather than reminds — the key points beside a video are enough when the lesson is playing two feet away, but a card is held by somebody who may not have watched it this week, or at all. So it carries the shape a skill lesson actually has: **what** the thing is, **how** you use it, and **like this** — the teacher's own lines, lifted from that lesson's transcript and trimmed, never paraphrased and never invented. Invented examples are the fastest way to make a card feel written by a machine, and they teach a worse line than the one he already gave.

**Print.** Spot inks on neon stock for any real run. These seven colors sit outside CMYK's gamut and four-color printing returns them dull; they are how the entire course is organized, and a deck that misreports which section a card came from is worse than no deck at all.

#### The digital deck

The digital deck lives inside Skills as the **Cards** tab (§03), and carries **every skill lesson in the library** — 77 cards. Four lessons are left out. The two section introductions frame a section rather than handing you a move you can make. The two Story Time lessons — the man a phone call away from the national snowboard team, told end to end and then taken apart — are the demonstration the section is built around, but they're his story rather than a technique: every transferable thing in them is already a card of its own, taught by the lesson that names it. A card you can't act on wastes a pull. Every card in the deck is a skill. Three surfaces, one gesture each:

- **The dial** is the closed deck seen from above: seven face-down cards, one per color, each showing its section's icon. It's worked with the same press-slide-release as the Skills dial — hold a thumb down, slide until the color you want lifts, let go — so the hand already knows it.
- **The color** is that section fanned into a stacked carousel: the card in front is face up and readable, the rest of the color stacks away behind it to either side. Swipe, drag or arrow through them and take the one you want — nothing has to be walked past to reach anything. The cards behind stay face down, because a stack of readable faces is a list with extra steps; what the fan is for is seeing how deep the color you're choosing from goes. The seven colors sit along the bottom as a strip, so moving to another section never means going back out first.
- **The spread** is one card pulled at random from every color at once — seven ingredients for one talk, which is the whole argument of the deck in a single gesture. Deal it again and you have a different talk. Random on purpose: a hand you chose is a hand of what you already do. It's drawn as a hand: seven cards fanned over each other, face up, in the order the colors run, with the seven lessons named under the fan. Under a mouse a card lifts out of the fan and comes forward while it's pointed at — or while its name is — so it can be read where it lies. On a phone the fan is worked like the dial: press, slide until the card you want lifts, let go, and it opens full size — with the whole hand along the bottom as a strip, so the seven are a swipe or a tap apart.

**Any card opens full size**, as tall as the screen allows and never wider than it, so it's whole in either orientation — with no cap on a laptop, where this is the full-screen view — and a tap still turns it over. On a laptop the deck also takes the room it's given: the fan opens wider, its cards grow with it, and the front card swells while the pointer rests on it, so a card reads without being opened. The card carries three blocks of text at about 3% of its own width — legible on an 89 mm card in the hand, marginal on a phone inside a carousel — so a card that can't be read at arm's length isn't doing its job.

**Shaking the phone shuffles the deck and pulls a card at random** — the one thing a physical deck does that a list of links never will, and the honest answer to not knowing what to work on today. A button does the same job on a laptop, and asks for motion permission where the platform requires it.

**The whole deck is open from the first minute.** Not card by card as each lesson is watched, and not behind a milestone: the deck is a tool, and a tool handed over one piece at a time is useless — the mechanic is pull one card of every color, which needs every color to be there. Nothing about it is a reward to be earned, and a student who opens the tab on day one gets all 77. **Which cards a student pulls is never logged** — see below.

The deck ships with one card that isn't a lesson: the instruction card, explaining the pull-one-of-each-color mechanic. A deck explains itself in the hand, not in a manual.

Where the course scores a talk after it's given and the book teaches the reasoning behind each skill, the deck is the fastest of the three — built for the few minutes before speaking, not for study. And unlike everything else in the system, deck use stays deliberately untracked: pulling a card, physical or digital, is never logged or connected back to challenge performance.

## 17 · What success looks like

- A new student can complete their first challenge within minutes of arriving, because the content in front of them is short.
- A student who was one-note — always informative, never vivid, say — starts naturally reaching for story, gesture, or humor, because the spectrum makes the gap visible rather than abstract.
- Growth is something the student can see, not just feel — a widening spectrum and a rising score become their own motivation, replacing "remember to use what you learned" with a structured habit of practice.
- By the end of the STORY journey, a student can produce a genuinely dynamic, full-spectrum talk on demand — not because they remembered a lecture, but because they've done it, with feedback, dozens of times.
- **And it can be shown, not only claimed (26 September).** Each student is measured against their own first take, so a student who leaves can't lift the average. Their self-rated confidence on camera is asked on day one and again at the end. Coach's scores converge on Tariq's own. These are the numbers `/admin` and the data room are built to show (§20), and the first cohort is the first time they will be real.

## 18 · Open questions

Most of the questions raised during this plan's development have been resolved and folded into the sections above. What's genuinely still open:

- The exact final count of skill categories — seven or fewer — once all ~80 lessons are sorted and it's clear whether every skill nests cleanly into an existing color.
- The exact form of the first-attempt-vs-latest-attempt comparison in Community — the student's own then-and-now (§13) is side-by-side video with score, spectrum and the colors lit since; whether Community shows the same or only the spectrum chart is still open.
- Whether the printed deck ships all 77 cards or a curated subset. The digital deck carries every skill lesson; a physical run may be cut for cost, and that cut is a separate decision from the one made here.
- Whether IMAGE is the right short code for Figurative language — it names what the section teaches (imagery) but could be misread as photography.
- Whether the book and card deck get their own cross-sell moment on the landing page, or are sold only inside VIP Ultimate (§15) and as standalone products later. (The landing page's lead video is settled: Tariq's *"You can't rely on AI in person"* in the hero.)
- How a cohort is let in (§13). A code on the invitation link that sets the plan when the account is made is the cheapest version and the one assumed above; a list of emails admitted by hand is the safest for a first cohort of a known size. Not decided.
- Whether a Starter student — written feedback, no spoken review — appears on the community boards. They earn real scores on real takes, so the case for including them is strong; the case against is that the boards then mix two levels of feedback. Leaning towards including them.
- The testimonials (§15). 25 are live; two are held until it is known which of two people said them, and three sets of initials still have no quote to go with them. Real photographs, with permission, would replace the initial-avatars.
- **Where the rendered trophies replace the round medallions** that remain (the list is kept in `docs/requests.md`). The renders are tall objects and the old slots crop to a circle, so each surface needs a design decision; it is not a swap.
- **The landing page's middle.** Nine chapters made it navigable, but *What's in the app*, *Skill Lessons* and *The challenges* still answer overlapping questions. The Speaking Spectrum claim now leads *Why it's different* rather than having its own chapter; whether more should merge is open.

## 19 · The stack

Speak Better is being built on Light Brands' standard stack — the same foundation used across the studio's wider portfolio — rather than a bespoke one assembled from scratch. That standard lives inside **QIE**, Light Brands' internal operating intelligence: the system that carries the studio's module maps, creative doctrine, and routing rules, and scaffolds every new product against them. Building on it means Speak Better inherits proven defaults instead of re-deciding them from zero.

### Application layer

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS; shadcn/Radix components; Lucide icons |
| Motion & animation | Framer Motion and GSAP for the celebrations in §11; Three.js for the 3D road on `/challenges` and the landing page (§14) |
| Backend | Next.js route handlers for API endpoints, webhooks, and agent calls; middleware for auth gates |
| Database & auth | Supabase (Postgres with Row Level Security), Supabase Auth, cookie-based server sessions |
| Hosting | Vercel — a preview deployment for every branch, production on merge |

### AI & video

| Layer | Choice |
|---|---|
| Video-understanding coach | Google's Gemini SDK — the model that actually watches a student's performance (§07) |
| Language tasks | Anthropic and OpenAI available alongside it for anything better suited to a language model than a video one |

### Commerce & communication

| Layer | Choice |
|---|---|
| Payments | Stripe Checkout — one-off cohort payments and the Starter-to-Complete upgrade (§15); built, awaiting keys (§21) |
| Email | Resend, for transactional messages |
| Forms & validation | React Hook Form with Zod |

### Performance on a phone

The challenge page's brief sits behind its poster until played — the embed's player script is the heaviest thing on the page. Any glow that pulses is drawn once and animated as a compositor opacity change on its own layer, never as an animated blur or box-shadow; the resonance wave's highlighted colors are each their own SVG for that reason. Long stretches of the coach's audio are paced on the server, not the phone (§14, *The lion speaks*).

### Observability & quality

| Layer | Choice |
|---|---|
| Error tracking | Sentry, including session replay |
| Product analytics | PostHog, plus Vercel Analytics and Speed Insights |
| Testing | Vitest, Playwright, Testing Library |
| CI/CD | GitHub Actions, with Claude Code wired into the review pipeline |

A few deliberate exclusions keep the studio's products consistent with each other: no Prisma, no MongoDB, no Firebase, no Remix, Astro, or SvelteKit. Uniformity across the portfolio is treated as a feature, not a limitation — it's what lets tooling, monitoring, and institutional knowledge carry over from one product to the next.

**Two non-negotiables carry over from the studio's wider practice: observability wired in from day one, and Supabase as the default unless a deviation is explicitly documented.**

The studio's creative doctrine — seven laws governing user-facing surfaces: breath, tension, presence, honesty, memory, weight, silence — sits alongside, not in place of, the design principles (§14) already set out for Speak Better specifically. The doctrine is the studio-wide baseline; this plan's design section is how it's expressed for this product.

## 20 · Cohort insights and the data room (26 September)

Two private pages for the people who run the course and the people who might fund it. Both are built now so the first cohort's data has somewhere to land on day one, rather than being reconstructed afterwards from memory.

### `/admin` — Cohort insights

For Tariq: is it working, where do students get stuck, and is Coach any good. One tab at a time, and the open tab is kept in the address so a link opens straight onto it.

| Tab | What it answers |
|---|---|
| **Overview** | The cohort at a glance. |
| **Cohort progress** | *Is their speaking getting better?* Each student against their own first take, so leavers can't lift the average; average score by week; all seven colors by week; each color's growth from first to latest. **The cohort's Speaking Spectrum** is drawn as the app draws it, the first take as a faint trace under the latest, with **colors lit challenge by challenge** (lit at 40, as in the app). A button copies the numbers for an investor deck. |
| **Usage** | A heatmap of where time goes, by area of the app and by day. |
| **Drop-off** | Where along the road students stop. |
| **Coach quality** | The 👌/🤏/👎 split by challenge, and the **training queue**: takes to correct, flag as gold, or **score as Tariq**. |
| **Voice of the student** | What they wrote on 👇 and on Coach's misses, and their check-in stories (only those who agreed to be quoted, never by name). |
| **AI insights** | Rule-based insights for now, standing in for the agent that will write `insight_reports`. |
| **Student journeys** | **All students**: every score line over the cohort average (finished, stopped, refunded) and a lane per student across the 42 days, lit by their best score each day. **One student**: by number, with tier, confidence, recommend and their story. |

### `/admin/data-room` — for investors

The evidence an investor asks for, built from the cohort's own records rather than written up afterwards.

| Tab | What it shows |
|---|---|
| **One-pager** | A printable summary, with *Download as PDF* for an investor email. |
| **Does it work?** | Self-rated confidence on day one vs the end; before-and-after students who agreed to be quoted; the cohort spectrum. |
| **What students love** | 🔥/👇 for every area of the app, most loved first, with what students wrote on 👇; the 👌/🤏/👎 split on Coach's reviews. |
| **Traction** | Revenue, refunds, tier mix, upgrades, completion, month-to-month take-up after the six weeks, NPS, students practising each week. |
| **Unit economics** | Per tier, with editable costs. |
| **Forecast** | Three years, with tier mix, refund and monthly rates taken from the cohort rather than assumed. |
| **The moat** | Coach's gap from Tariq's own scores narrowing week by week, and the spot-on rate. A method-trained coach that measurably converges on the teacher is the part a competitor can't buy. |

**Two skins**, remembered on the device: *Speak Better*, the app's glow, glass and neon; and *Brass Tacks*, the same panels on white paper in black, greys and one brass accent, for reading numbers and printing. Only the color tokens change (`.skin-plain` in `globals.css`), so the two can't drift apart.

**It runs on a sample cohort until Supabase is on** (`src/data/admin-sample.ts`): a seeded six weeks, 3 October to 13 November, with customers' tiers, refunds, a spectrum on every take, and check-in answers, so every panel can be judged before there is real data. The swap is at the data layer, not in the panels. Neither page has a login yet (§21).

## 21 · Where things stand before the first cohort (26 September)

The founding cohort starts **Saturday 3 October, 11:00 AM** Central (the page says "CST"; on that date it is actually CDT, and "CT" would avoid an hour of confusion). The product is ready to be walked through. What stands between it and taking money from twenty real people:

- **The paywall is off, on purpose.** `PAYWALL_ON = false` in `lib/plan.ts` until Tariq says the first students are coming. Until then the app is open to everyone, which is how each tier can be tried as it will be sold. Turning it on is one line, and it is his call, not a build step.
- **Stripe keys.** Checkout is built; the secret key, the webhook signing secret and `NEXT_PUBLIC_SITE_URL` are not in Vercel yet.
- **Supabase.** The project isn't created. Before it is: fix the multi-user gaps (no sign-out, and a sign-in merges device state into the account; `plan` is writable by the client; `profiles.plan` still defaults to `'trial'`), so the schema goes up correct rather than needing a week-one migration. Then apply `schema.sql`, `chat.sql`, `live.sql` and `training.sql`, set the keys, and give Tariq the coach role. Until then accounts, the training data and the admin pages all run on the device or on sample data.
- **`/admin` has no login.** It shows sample data today, but it must sit behind Tariq's account before a single real record reaches it.
- **One address.** Three hostnames serve the same build and each remembers a different student. One should be primary and the other two should redirect to it.
- **The 14-day upgrade window is copy only.** Nothing records when a student joined, so the in-app offer doesn't close on day 14. It needs the purchase date from the server-side plan.
- **Legal, deliberately unfinished.** The terms leave out the **business name and governing law** on purpose, until they are decided, rather than guessing at them. **Consent as a condition of the course** (§13) should be checked by a lawyer: it is honest and it is refundable, but making agreement a condition of access is the kind of clause that varies by jurisdiction.
- **Gemini's paid tier.** The privacy policy tells students their take goes to Gemini to be reviewed and is then deleted, and that their speech is used only to improve Speak Better. On Gemini's free tier Google may use what it is sent to improve its own models, so that promise holds only on the paid tier. The account has to be on it before a real student uploads.
- **Waiting on Tariq:** the two held testimonials, real testimonial photographs with permission, and any further obsidian trophies.
