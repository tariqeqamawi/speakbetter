// The product journey (the /journey page): how Speak Better went from a
// scaffold to the product it is, and why. Distilled from the git history
// (src/data/journey-commits.json, regenerated from `git log`) and the
// conversations behind it. "Result" means what changed in the product or
// what Tariq said when he saw it - there is no conversion data yet (Vercel
// Web Analytics still to be switched on), so no number here is invented.

export const AREAS = {
  learn: { name: "Lessons & Cards", color: "var(--color-storytelling)" },
  coach: { name: "Coach", color: "var(--color-figurative)" },
  practice: { name: "Practice & Recording", color: "var(--color-acting)" },
  game: { name: "Gamification", color: "var(--color-advanced)" },
  road: { name: "The S.T.O.R.Y. Road", color: "var(--color-structure)" },
  nav: { name: "Navigation & Tour", color: "var(--color-voice)" },
  landing: { name: "Landing Page", color: "var(--color-body-language)" },
  share: { name: "Share Cards", color: "var(--color-mindset)" },
  biz: { name: "Offer & Business", color: "#f5cf5a" },
  brand: { name: "Brand System", color: "#c9cdfd" },
  speed: { name: "Performance", color: "#9be7ff" },
  community: { name: "Community & Live", color: "#ffb4e6" },
  platform: { name: "Platform & Data", color: "#a6adc4" },
  ads: { name: "Marketing & Ads", color: "#ffc58a" },
  notes: { name: "Plans & Notes", color: "#767e99" },
  other: { name: "Other", color: "#767e99" },
} as const;
export type Area = keyof typeof AREAS;

export const PHASES = [
  {
    when: "Aug 7",
    from: "2026-08-07",
    to: "2026-08-07",
    title: "The Whole Loop In A Day",
    summary:
      "A Next.js scaffold, then five phases shipped back to back: the skills library (81 lessons in 7 colours), the S.T.O.R.Y. challenges, a landing page and unlock flow, the practice loop (upload, AI review, spectrum feedback), gamification, and an installable app.",
  },
  {
    when: "Aug 10 - 19",
    from: "2026-08-10",
    to: "2026-08-19",
    title: "Brand And Feel",
    summary:
      "The neon-on-midnight palette, the lion, every emoji replaced by a drawn icon, the animated soundwave, our own video player, on-screen cues that follow what the teacher says, and the lesson deck - every lesson a card you could hold.",
  },
  {
    when: "Sep 17 - 20",
    from: "2026-09-17",
    to: "2026-09-20",
    title: "Coach Comes Alive",
    summary:
      "Gemini reviews each recording against the lessons; the lion gets a voice and a mouth that moves with it; reviews become rooms you can read; Coach gets stricter and measures change across time. The first offer and tiers.",
  },
  {
    when: "Sep 22 - 24",
    from: "2026-09-22",
    to: "2026-09-24",
    title: "Systems, Trust And Retention",
    summary:
      "One navigation, a guided tour Coach speaks, glass cards, trophies earned not collected (47 rendered cups), 26 verbatim testimonials, a 14-day guarantee instead of a free trial, and safety nets under every student's record.",
  },
  {
    when: "Sep 25 - 27",
    from: "2026-09-25",
    to: "2026-09-27",
    title: "The Road And The Website",
    summary:
      "The challenges become a 3D road - Tron light, portals, loops, a city - plus a 2D map. The landing page switches to candid, real-looking imagery; the origin story, checkout, terms, consent, mentorship and website pages all land. The busiest stretch: over 240 changes.",
  },
  {
    when: "Sep 28 - 30",
    from: "2026-09-28",
    to: "2026-09-30",
    title: "Refinement",
    summary:
      "An eighth colour (Voice), lessons re-shelved where students would look for them, the road's Tron look darkened, the Dial / Grid switch, and the marketing decks and Instagram carousels built on the app's own look.",
  },
  {
    when: "Oct 1",
    from: "2026-10-01",
    to: "2026-10-01",
    title: "The Conversion Rebuild",
    summary:
      'The landing page pared back and rebuilt around the visitor: a pain-led headline, "This Is For You If...", roles, proof beside Join, screen-sized folds for laptop and phone, the app\'s glass, share cards for WhatsApp - and the first ads.',
  },
  {
    when: "Oct 2",
    from: "2026-10-02",
    to: "2026-10-02",
    title: "The First Student Speaks",
    summary:
      "The first feedback from a new student changes the start of the course: challenge 1 becomes watching five Presence lessons instead of going on camera, and Skills opens on Presence alone, with the other seven colours unlocking after five lessons.",
  },
];

export type Decision = {
  area: Area;
  when: string;
  title: string;
  what: string;
  why: string;
  result: string;
};

export const DECISIONS: Decision[] = [
  // ---------- foundations & brand ----------
  {
    area: "platform",
    when: "Aug 7",
    title: "Build the whole loop before polishing any part",
    what: "Library, challenges, landing page, practice loop (upload, AI review, spectrum feedback), gamification and an installable app - all in the first day.",
    why: "Speak Better's value is the loop: watch, practise, get feedback, progress. A polished fragment proves nothing.",
    result:
      "Every one of the next 750 changes refined something a student could already use end to end.",
  },
  {
    area: "brand",
    when: "Aug 10",
    title: "One mood, one motif: neon on midnight, and the soundwave",
    what: "Neon palette on a midnight-blue ground with drifting light; the lion logo; every emoji replaced by a matched outline icon; an animated soundwave in the header and hero.",
    why: "The default look read as a template. A brand needs one mood and one signature shape.",
    result:
      "The waveform became the signature: under the lion, inside Coach's button, on every share card and ad.",
  },
  {
    area: "learn",
    when: "Aug 12 - 17",
    title: "Our own player, and cues that follow the teacher",
    what: "Vimeo's controls replaced with our own; a cue engine puts on screen what the teacher is making a point of - settled at a whole thought every ten seconds.",
    why: "Watching passively is the problem the course exists to fix; the screen should reinforce the point being made.",
    result:
      "Lessons read as active, and the player became something we control (XP, chimes, progress).",
  },
  {
    area: "learn",
    when: "Aug 17 → Oct 1",
    title: "Every lesson is a card you could hold",
    what: "The deck: oracle-card size (89 x 127 mm), fanned in the hand per colour, dealt as a spread of one card per colour; later the Cards screen opens straight onto a fan, with a Full Spread and a shuffle.",
    why: "A hand of cards is a recipe for a talk; something tactile is remembered better than a list - and fewer taps reach the content.",
    result:
      '"Digital Flashcards" became one of the four headline features, and a printed deck is part of VIP.',
  },
  {
    area: "learn",
    when: "Sep 27 - Oct 1",
    title: "Eight colours, short names, one order",
    what: "Voice (royal blue) split out of Act; colours renamed Tell, Paint, Act, Pro, Frame, Voice, Body, Presence with the familiar term as a subtitle; listed in colour-wheel order everywhere.",
    why: "Vocal delivery is its own skill. A fixed order makes every rainbow on every screen read as one system.",
    result:
      "One palette across the app, the book (The 8 Colors), the printed deck, the website and the ads.",
  },
  {
    area: "learn",
    when: "Sep 29",
    title: "Lessons re-shelved where students would look for them",
    what: "Rhyme, the Hero's Journey, linking a call to action to the moral and others moved to Pro (advanced); speaking-tools and values lessons moved to their natural colours.",
    why: "A lesson in the wrong colour is a lesson nobody finds.",
    result:
      "Pro now holds genuinely advanced techniques, and each colour reads as one skill.",
  },
  {
    area: "learn",
    when: "Sep 18 → Oct 1",
    title: "Reach any colour from anywhere, in one gesture",
    what: 'A skill dial with the lion in the hub, then a Dial / Grid switch shrunk to a small pill, then a pinned bar on every colour page with a dropdown and a press-slide-release "Color" tab.',
    why: "Tariq kept asking to jump colours without going back. Navigation should never cost a trip home.",
    result:
      "One layout whichever way you arrive, and the eight colours always one gesture away.",
  },
  {
    area: "learn",
    when: "Oct 1",
    title: "Honest progress: watched means 80% actually played",
    what: "A lesson counts as watched at 80% played (not five seconds), and the lesson page opens on the next unwatched lesson.",
    why: "Progress that can be faked teaches nothing and devalues every badge built on it.",
    result:
      "Completion numbers - and the trophies that read them - now mean something.",
  },
  // ---------- coach ----------
  {
    area: "coach",
    when: "Sep 17",
    title: "Feedback that points back to the teaching",
    what: "Gemini watches each recording and reviews it against the lessons the challenge asked for - scored, in order, and never mentioning anything it didn't see.",
    why: "Generic praise teaches nothing. Feedback is only useful if it names the lesson that fixes the problem.",
    result:
      "The product's strongest differentiator - the landing page's \"Meet Coach\" demo is a real review.",
  },
  {
    area: "coach",
    when: "Sep 18",
    title: "A lion you want to hear from",
    what: "Voice auditions in one day (around twenty versions), settled on a low, gravelly British baritone at 1.43x; a mouth that moves with each syllable.",
    why: "A character people like is listened to. The voice was settled by listening, not by spec.",
    result:
      "Coach now voices reviews, the tour, trophy moments, the road and the onboarding - one consistent character.",
  },
  {
    area: "coach",
    when: "Sep 18 - 20",
    title: "The review as rooms, with captions",
    what: "Reviews laid out as: what worked, the spectrum, the lessons asked for, skills used without being asked, next time - spoken aloud with karaoke captions.",
    why: "A wall of text isn't read. Sections can be scanned; captions work with the sound off.",
    result:
      "Students can read a review back, open the lessons it names, and ask Coach about it.",
  },
  {
    area: "coach",
    when: "Sep 19 - 23",
    title: "A score you have to earn",
    what: 'A more discerning score, eye contact at every level, Coach speaking in the first person as the one who watched, measuring the same things across time - and "stops being generous".',
    why: "A score is only trusted if it can go down. Generous scores make every compliment worthless.",
    result:
      "Reviews now say what has shifted since last time, which is the feedback that motivates.",
  },
  {
    area: "coach",
    when: "Sep 27 - 29",
    title: "Know what Coach costs, and cache what repeats",
    what: "One cost model (per review, worst case per tier) in the admin and data room; Coach's voice made once and replayed from the device.",
    why: "AI feedback has a real cost per student; the business has to know it, and repeats shouldn't be paid for twice.",
    result:
      "Unit economics per tier are known, and replays are instant, offline and free.",
  },
  // ---------- practice ----------
  {
    area: "practice",
    when: "Sep 17 - 22",
    title: "Practice is recording yourself - so make recording easy",
    what: "Record in the app with the challenge's brief and clock on screen; the last three takes kept on the device; a baseline kept for good and a then-and-now at ten challenges; the challenge page as one question per step.",
    why: 'The course\'s promise is practice, not playback. Every bit of friction before "record" loses a rep.',
    result:
      "A clear loop: brief, record, upload, review - with visible improvement over time.",
  },
  // ---------- gamification ----------
  {
    area: "game",
    when: "Aug 17 - Sep 18",
    title: "Reward the behaviour you want, immediately",
    what: "XP for every lesson and take, with a chime and a number rising off the player; challenges pay by score; streaks with protection.",
    why: "The two behaviours that matter are watching and practising well - so those are what pay, and they pay at once.",
    result:
      "Progress is felt in the moment, and a missed day doesn't break a streak.",
  },
  {
    area: "game",
    when: "Sep 18 - 24",
    title: "Trophies earned, not collected",
    what: "47 trophies rendered as real cups; skill trophies ask for consistency, not one good take; each revealed on a stage with applause and a line from Coach; silhouettes show what's not yet won.",
    why: "A badge for showing up means nothing. Difficulty gives a trophy its meaning, and seeing the locked ones creates the pull.",
    result:
      "A trophy case students can aim at, with rarity and requirements shown under each.",
  },
  {
    area: "road",
    when: "Sep 24 → Oct 1",
    title: "Progress you can ride: the S.T.O.R.Y. road",
    what: "The 25 challenges as a 3D road inspired by Tron and Extreme-G: a land per phase, portals, a loop, a corkscrew, a city of light, a sky dome with a planet - plus a 2D map for anyone who'd rather scroll.",
    why: "A list of challenges is a to-do list. A journey you travel makes progress visible and worth showing off.",
    result:
      'The most eye-catching thing in the product - it\'s the hook of the "Inside The App" ad.',
  },
  {
    area: "road",
    when: "Oct 1",
    title: "The views are earned, and the locks show what's waiting",
    what: "2D to start; 3D opens after the first phase; 4D (the full ride) later. Each lock shows a real picture of the view behind it.",
    why: "The ride is the reward. Showing exactly what's locked creates more pull than hiding it.",
    result: "A reason to finish the next challenge that isn't just points.",
  },
  {
    area: "road",
    when: "Oct 1",
    title: "Celebrate where it happens",
    what: "Cheers and confetti cannons fire in the finish tunnel as you reach them; Coach's finish lines in Tariq's own words.",
    why: "A celebration after the fact is a notification. In the moment, it's a feeling.",
    result: "Finishing the road ends on a high.",
  },
  // ---------- navigation ----------
  {
    area: "nav",
    when: "Sep 22",
    title: "One navigation, Coach in the middle",
    what: "Five destinations in one bar, Coach at the centre; a rail on a laptop; sections as a strip on a phone.",
    why: "Every screen should be one tap from every other, and the coach should be the centre of the app, literally.",
    result: "No dead ends, and Coach always in reach.",
  },
  {
    area: "nav",
    when: "Sep 22 → Oct 1",
    title: "A tour that shows the real thing",
    what: "A guided tour Coach speaks, ringing the real element at each stop - re-filmed whenever the screens change.",
    why: "Showing beats explaining, and a tour that shows old screens erodes trust.",
    result:
      "New students are shown around in Coach's voice, on the app as it is.",
  },
  {
    area: "nav",
    when: "Oct 1",
    title: "Back takes you back to where you were",
    what: "The road remembers your position; a lesson opened from a dealt spread returns to the same hand; explanations moved into a small eye icon.",
    why: "Losing your place is the most common small frustration in an app.",
    result: "Exploring costs nothing - you always land where you left.",
  },
  // ---------- offer ----------
  {
    area: "biz",
    when: "Sep 23 - 25",
    title: "A founding cohort with a date, a cap and anchored prices",
    what: "Starter, Complete and VIP Ultimate; a founding cohort of 20 spots starting October 3; later prices shown struck through.",
    why: "A start date, a real cap and a visible later price give a reason to decide now.",
    result: "Students are already buying through the landing page's tiers.",
  },
  {
    area: "biz",
    when: "Sep 24",
    title: "No free trial - a 14-day money-back guarantee instead",
    what: "Every way in is a paid tier; a gold guarantee seal sits beside every ask and under the prices.",
    why: "The guarantee is how someone tries it, without attracting people who never intended to buy.",
    result:
      "The seal is now a fixture beside Join - the promise is where the question is asked.",
  },
  {
    area: "biz",
    when: "Sep 26 - 27",
    title: "Trust, written down",
    what: 'Terms and privacy fitted to the product; consent asked in one line with "What does that mean?"; checkout with the agreement asked there, not while browsing.',
    why: "Students upload videos of themselves; they need to know exactly what happens to them.",
    result:
      "A clear, legal footing for reviewing videos, without friction while people browse.",
  },
  {
    area: "biz",
    when: "Oct 1",
    title: "The paywall stays off for now",
    what: "Briefly switched on, then back off by Tariq's choice so the app stays open for testing; buyers still come through the tiers.",
    why: "Tariq needs to test freely before the cohort starts; no buyer gets in any other way.",
    result: "Testing continues; sales are unaffected.",
  },
  // ---------- landing ----------
  {
    area: "landing",
    when: "Sep 19 - 25",
    title: "Show the app, don't describe it",
    what: "Phone films of the real app, a real Coach review, the road in 3D on the landing page.",
    why: "Claims about an app are weak. The app is the proof.",
    result:
      "The landing page sells by demonstration - and the same films became the ads.",
  },
  {
    area: "landing",
    when: "Sep 24",
    title: "Testimonials exactly as they were said",
    what: "26 testimonials captured verbatim, checked name by name, with initials where a surname was misheard.",
    why: "An improved testimonial isn't a testimonial; a misspelled name is worse than none.",
    result: "25 published, every one checkable.",
  },
  {
    area: "landing",
    when: "Sep 25",
    title: "Real-looking people, not AI renders",
    what: "Every photo re-shot as a candid phone snapshot (Higgsfield Soul 2.0), under a new filename each time.",
    why: "Polished, cinematic AI images read as fake - and fake people undermine a course about being real on camera.",
    result:
      "Tariq: this is exactly what he wants. The recipe is now a standing rule.",
  },
  {
    area: "landing",
    when: "Sep 26",
    title: "Say it once",
    what: "Numbered chapters with a section navigator; long copy behind Read more; quotes used once each; three Join buttons instead of seven.",
    why: "A page that repeats itself tells the reader they can skim - and then they skim past the ask.",
    result: "A shorter, more confident page.",
  },
  {
    area: "landing",
    when: "Oct 1",
    title: "Two versions side by side, then pick one",
    what: "Version A and Version B built as separate live pages to compare on a real phone.",
    why: "Seeing beats imagining. Decisions are faster between two real things.",
    result: 'Tariq: "make b the new landing page, i love it."',
  },
  {
    area: "landing",
    when: "Oct 1",
    title: "The date, the cap, the price and the door - always on screen",
    what: 'A sticky strip under the header: "Starts October 3 · 20 spots · from $299 · Join".',
    why: "Anyone ready to buy should never have to scroll to find out how.",
    result: "A Join button is visible on every screen of the page.",
  },
  {
    area: "landing",
    when: "Oct 1",
    title: "Try one challenge free, with a real Coach review",
    what: "One free review per visitor, remembered in the browser.",
    why: "Feeling the product beats reading about it - and one review keeps the AI cost capped.",
    result: "Visitors can experience Coach before paying.",
  },
  {
    area: "landing",
    when: "Oct 1",
    title: "Lead with the visitor's pain, not an identity",
    what: 'Five headlines in a day: "Become Confident Speaking On Video In Minutes" → "Become A Natural, Confident Speaker On Video" → "Remove Filler Words And Tell Your Stories More Powerfully On Video" (laptop) and "Overcome Fears, Remove Filler Words & Tell Your Stories..." (phone), with "Become A Natural, Confident Speaker - In Minutes, Not Months!" beside the film.',
    why: '"Become" is vague; named problems are recognised instantly. The result moves into the subline.',
    result:
      "The visitor's problem is in the first line, and the outcome right next to the film.",
  },
  {
    area: "landing",
    when: "Oct 1",
    title: "Let the visitor recognise themselves before any feature",
    what: '"This Is For You If..." straight after the hero: eight cards each starting "You..."; problems marked with a yellow caution circle, wants with a green tick; two camera lines merged so the grid is even.',
    why: "People buy when they see their own situation. A green tick on a problem sends a positive signal about a negative.",
    result:
      "Added at Tariq's prompt - and it should have come before the feature work. Now the second screen of the page.",
  },
  {
    area: "landing",
    when: "Oct 1",
    title: "One role at a time, big",
    what: 'Seven small chips with thumbnails became "Speak Better Is Perfect For [Role]": the name cascading in, a one-line want, a large photo, swipeable on a phone - five roles plus Podcasters.',
    why: "An exhaustive list excludes whoever isn't on it; one big role at a time lets each visitor find themselves.",
    result: "A section that moves and reads instantly, on laptop and phone.",
  },
  {
    area: "landing",
    when: "Oct 1",
    title: "Proof beside the ask, as the brightest thing there",
    what: "A quote card beside Join, rotating three verbatim on-camera results (Sharon Ho, Jackie Briggs, Natasha Hein) - the one white card on a dark page.",
    why: "The moment someone considers clicking Join is the moment they need evidence.",
    result: "The eye lands on proof, then the button, then the guarantee.",
  },
  {
    area: "landing",
    when: "Oct 1",
    title: "One idea per screen - decided separately for laptop and phone",
    what: "Laptop: headline across the top, film beside the lion; each opening chapter fills the screen, with a numbered divider at its top edge and dots down the right. Phone: its own split - lion and promise; film and Join; quotes and guarantee; who it's for; who it's made for.",
    why: "A screen that tries to say three things says none. The two devices need different splits.",
    result:
      'Tariq: "I like the phone screen split into folds more. I think that works better than it did before."',
  },
  {
    area: "landing",
    when: "Oct 1",
    title: "The website should feel like the app it sells",
    what: "The app's glass (green and purple tints on translucent blue-grey) on every landing card, then 20% darker in both at once; Title Case on every heading; a soft neon trail behind the mouse.",
    why: "A visitor should recognise the product the moment they open it after buying.",
    result: "One material and one voice across site and app.",
  },
  {
    area: "landing",
    when: "Oct 1",
    title: "Decorative film ships as an animated image",
    what: 'A faint montage of people talking to phones behind "Is It For You?" (and behind the lion on a phone). Three video versions vanished or froze on Tariq\'s laptop; an animated WebP worked.',
    why: "Browsers treat video specially (graphics layers, autoplay rules, power saving); an image just animates.",
    result:
      'Tariq: "video looks great now." Lesson kept: test on the real device - headless browsers passed every broken version.',
  },
  // ---------- share ----------
  {
    area: "share",
    when: "Sep 27 → Oct 1",
    title: "The link is the first impression",
    what: "A designed preview card; darkened; a square version served only to WhatsApp's link crawler; wording kept in step with the headline; the hero's own waveform redrawn under the wordmark.",
    why: "Most people meet the product as a shared link in a chat - at thumbnail size.",
    result:
      "Every share shows the lion, the name and the promise - square in WhatsApp, wide everywhere else.",
  },
  // ---------- performance ----------
  {
    area: "speed",
    when: "Sep 18 → Oct 1",
    title: "Smooth is part of the product",
    what: "The header wave moved off the main thread; nothing blurred is repainted while it moves; the 3D road rests when out of view and renders lighter on phones; no CSS blur on speed streaks; a crash guard that rebuilds the road.",
    why: "Choppiness reads as low quality, whatever the design.",
    result:
      "Smooth scrolling and a smooth ride on ordinary laptops and phones.",
  },
  // ---------- the first students ----------
  {
    area: "road",
    when: "Oct 2",
    title: "Watch first, record second",
    what: 'Challenge 3, "Watch Any 5 Presence Skills", moved to challenge 1. The speaking baseline is now challenge 2 and the unaided story challenge 3. Today\'s "Start here", the checkout page and the welcome email all now name the Presence lessons as the first step. Progress is saved per challenge, so students already under way kept everything and simply see the new order.',
    why: 'A new student said being asked to go on video as the very first challenge was daunting. Watching is passive and safe; it builds some confidence before the camera comes out. Tariq: "That makes it more passive and less scary."',
    result: "Shipped Oct 2, across the whole app. No data yet - the test is whether the next new students get as far as recording their baseline.",
  },
  {
    area: "learn",
    when: "Oct 2",
    title: "Skills unlock gradually, starting with Presence",
    what: "Until challenge 1 is done, Presence is the only colour open. Skills opens straight onto Presence with all its lessons listed and a note: watch any five and the other seven colours open (with a countdown). Other colours show a lock in the colour menus, and links into them lead back to Presence. Five lessons watched, or challenge 1 passed, opens everything, so students who were already using the library aren't locked out.",
    why: "The same student went straight into Storytelling, landed on the storybook lessons, felt they had missed earlier lessons, and stopped. Opening one colour at a time gives a clear first step and makes the library feel supportive rather than overwhelming.",
    result: "Shipped Oct 2. The whole-app tour still walks through every colour, because the lock stands aside while the tour is running.",
  },

  // ---------- marketing ----------
  {
    area: "ads",
    when: "Sep 27 → Oct 1",
    title: "Marketing built from the product itself",
    what: "Phone deck viewer for webinar and investor decks, Instagram carousels, the book's covers, and the first ads (3 videos, 5 images) - all from the app's real screens, films and look.",
    why: "The product is the best advertisement, and one visual system makes every touchpoint recognisable.",
    result: "Ads and posts that look like the app people will open.",
  },
];

export const PRINCIPLES = [
  [
    "Build the whole core loop first, then refine what's real.",
    "Refining a fragment wastes work when the loop changes.",
  ],
  [
    "Name the visitor's pain in the first line.",
    "Problems are recognised instantly; identities and outcomes are vaguer.",
  ],
  [
    "Self-recognition before features.",
    '"You..." lines let people find themselves; then features land.',
  ],
  [
    "Mark problems and wants differently.",
    "A tick on a problem sends a positive signal about a negative.",
  ],
  [
    "Proof goes beside the ask, brightest on the screen.",
    "The decision moment is when evidence is needed.",
  ],
  [
    "One idea per screen - laptop and phone decided separately.",
    "Different screens need different splits.",
  ],
  [
    "One system everywhere.",
    "One material, one call-to-action style, one palette order, one heading case, one motif.",
  ],
  [
    "Show the product instead of describing it.",
    "Films and real reviews prove what claims can't.",
  ],
  [
    "Earned progress beats collected badges - and show what's locked.",
    "Difficulty gives meaning; a visible lock creates pull.",
  ],
  [
    "Feedback must point back to the teaching.",
    "A note without a lesson to fix it teaches nothing.",
  ],
  [
    "Motion only where it means something, and only while on screen.",
    "Decoration that competes with the words costs attention and battery.",
  ],
  [
    "The real device is the test.",
    "Headless checks passed every version that failed on Tariq's laptop.",
  ],
  [
    "Candid, checked imagery - and a new filename every time.",
    "Real-looking people build trust; caches keep old images alive.",
  ],
  [
    "Make the first step small, and open the rest in order.",
    "A first task that feels like a performance, or a library with no clear start, makes new students stop - so the first thing they do is watch.",
  ],
  [
    "Log the why.",
    "Five headlines in a day are only useful if the reasons survive.",
  ],
];

export const PROCESS = [
  [
    "Ship live, show the URL",
    "Every change goes to speakbetter.app and is checked there before it's called done; drafts are live preview pages, never mockups.",
  ],
  [
    "Benches before builds",
    "Options built side by side on the real thing (skies, land patterns, review layouts, landing A/B), then one chosen.",
  ],
  [
    "A written list",
    "requests.md and the master plan hold every ask, so nothing depends on memory.",
  ],
  [
    "Opinions when asked, then Tariq's call",
    "Recommendations given plainly; once Tariq decides, it's built without re-arguing.",
  ],
  [
    "Admit misses",
    "When something should have been suggested earlier (the qualification section), say so and fix the method.",
  ],
];
