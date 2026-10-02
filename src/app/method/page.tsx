import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Method",
  robots: { index: false, follow: false },
};

// Tariq's product-design method, made conscious: the kinds of change he
// asks for, the need behind each, what it does to the screen, the
// patterns he follows without naming them, and the workflow that makes
// the work fast. Drawn from 605 product changes (plan/notes commits
// excluded) and the conversations behind them. The same content lives in
// the creative-developer-ai skill (conscious-competence.md). Unlisted.

const TYPES = [
  {
    name: "Arrange",
    pct: 28,
    color: "var(--color-voice)",
    need: "The right things exist, but in the wrong place or order - the reader meets them at the wrong moment.",
    change:
      "Move it, reorder it, put it beside what it supports, give it its own screen or tab.",
    ui: "The page reads like a conversation: problem, proof, then the ask - one thing at a time.",
    example:
      'The quote and the guarantee moved beside Join; "This Is For You If" moved straight after the hero; the app films got their own screen.',
  },
  {
    name: "Unify",
    pct: 27,
    color: "var(--color-body-language)",
    need: "Two things that should feel like one system look different - the eye notices, even if the mind doesn't.",
    change: "Make one version and apply it everywhere at once.",
    ui: "Calm. Fewer styles to decode, so the content stands out.",
    example:
      "Title Case on every heading; the same glass in app and site; one colour order everywhere; the share card always says what the headline says.",
  },
  {
    name: "Clarify",
    pct: 22,
    color: "var(--color-storytelling)",
    need: "The words are vague, long, or written from the product's side instead of the reader's.",
    change:
      "Rewrite until it is specific, short, and about the reader - word by word.",
    ui: "Shorter lines, bigger meaning; headings a stranger understands in two seconds.",
    example:
      '"Become a natural speaker" became "Remove filler words & tell your stories more powerfully on video"; every list item starts "You..."; "and" became "&".',
  },
  {
    name: "Reveal",
    pct: 18,
    color: "var(--color-figurative)",
    need: "Something good is described, hidden or locked away where nobody can feel it.",
    change:
      "Show the real thing - a film, a preview, a demo, a silhouette of what's still to win.",
    ui: "Pictures and motion of the actual product replace paragraphs about it.",
    example:
      "Phone films of the app; a real Coach review on the landing page; locked road views showing exactly what's waiting.",
  },
  {
    name: "Subtract",
    pct: 15,
    color: "var(--color-acting)",
    need: "Too much on screen - repetition, extra buttons, explanations nobody reads.",
    change: 'Remove it, merge it, fold it behind "Read more" or a small icon.',
    ui: "Negative space; one clear action per screen.",
    example:
      'Seven Join buttons became three; seven role chips became one role at a time; "What this is" dropdowns became a small eye; two similar cards merged into one.',
  },
  {
    name: "Reward",
    pct: 12,
    color: "var(--color-advanced)",
    need: "Doing the right thing (watching, practising) doesn't feel like anything.",
    change:
      "Pay it back immediately - points, a sound, a trophy, a view you unlock.",
    ui: "Moments of payoff tied to real effort, never handed out for nothing.",
    example:
      "XP rising off the player; trophies for consistency; 3D and 4D road views earned by progress.",
  },
  {
    name: "Delight",
    pct: 11,
    color: "var(--color-structure)",
    need: "It works, but it feels flat - nothing makes you smile.",
    change:
      "Add one moment of life - then soften it until it supports instead of shouts.",
    ui: "A neon trail, confetti at the finish, a lion that talks - subtle by default.",
    example:
      'The mouse tracer, asked for, then "much softer", then "slightly wider and more tapered".',
  },
  {
    name: "Resize & Space",
    pct: 9,
    color: "var(--color-mindset)",
    need: "Hierarchy is off - something important is small, or everything is crowded.",
    change:
      "Make the key thing bigger, the secondary thing smaller, and add room around both.",
    ui: "The eye knows where to go first; the page breathes.",
    example:
      "The app phones sized to fill their screen; the mobile headline made smaller with space above and below; the lion made larger.",
  },
  {
    name: "Shortcut",
    pct: 7,
    color: "#9be7ff",
    need: "Getting somewhere takes a trip back home, or you lose your place.",
    change:
      "One gesture to anywhere; back returns you where you were; swipe where a thumb expects to.",
    ui: "Nothing feels like a dead end.",
    example:
      'The colour dropdown on every lesson page; the road remembering your spot; swiping through "Perfect For".',
  },
  {
    name: "Make It Real",
    pct: 6,
    color: "#f5cf5a",
    need: "Something looks stock, generated, polished or invented - and trust leaks out.",
    change:
      "Use the real thing: real quotes word for word, real footage, candid phone-style photos, your own face.",
    ui: "It looks like real people and a real product.",
    example:
      "Testimonials verbatim with initials when unsure; candid Soul photos over cinematic renders; your podcast studio as the backdrop.",
  },
];

const PATTERNS = [
  [
    "You judge the real thing, not the plan.",
    "You almost never asked for a spec - you looked at the live page on your laptop or phone and said what felt off. Every decision was made in front of the actual product.",
    "Always look at it live, on the device your customer will use, before deciding.",
  ],
  [
    "You add, then you subtract.",
    "Ideas arrive generously (seven roles, many buttons, a tracer), then get pared back once you see them (five roles, three buttons, a softer tracer). The final version is almost always smaller than the first.",
    "Let yourself add freely - then always do a second pass whose only job is removing.",
  ],
  [
    "You read as the visitor, not the owner.",
    '"So the viewer sees themselves", "it feels too bright", "I can\'t see it" - your notes describe what a stranger experiences, not what the product contains.',
    "Before reviewing a screen, decide who's looking and what they want in the next three seconds.",
  ],
  [
    "You climb from vague to specific.",
    'Headlines went from identity ("Become a confident speaker") to named pains ("Remove filler words") to named people ("Perfect for Podcasters"). Each step got more concrete.',
    "If a line could be on a competitor's site, make it more specific.",
  ],
  [
    "When one thing changes, you want it changed everywhere.",
    'Title Case "across the whole page"; glass "both across the app and the landing page"; the share card "updated with the latest wording".',
    "Treat every style decision as a rule, and ask: where else does this apply?",
  ],
  [
    "You feel proportion and space.",
    '"A little smaller", "more negative space below", "move it down a bit", "make the lion larger" - small nudges to size and room are a large share of your notes.',
    "Check every screen for one dominant thing and enough air around it.",
  ],
  [
    "You split by device without being asked.",
    '"Only on mobile", "on laptop I really like where it is", "for mobile, one column with arrows". You instinctively design phone and laptop separately.',
    "Review each screen twice - phone and laptop - and let them differ.",
  ],
  [
    "You choose the real over the impressive.",
    "Candid photos over glossy renders, your own podcast studio, testimonials word for word, a real Coach review.",
    "When choosing between polished and true, choose true.",
  ],
  [
    "You borrow from other worlds.",
    "Oracle cards for the lesson deck, Extreme-G and Tron for the road, Pixar for the lion, a podcast host for the ad.",
    "When a screen feels ordinary, ask: what game, film or object does this remind me of?",
  ],
  [
    "You ask for the feeling, then the thing.",
    '"Cheers when you finish", "you\'re ready for the stage", "so it stands out" - you name the emotion first; the feature follows.',
    "Start a request with the feeling you want the user to have.",
  ],
  [
    "You think in screens.",
    'Your later notes are organised as folds: "the first fold is...", "the second fold should be...". One idea per screen.',
    "Plan a page as a sequence of screens, each with one job.",
  ],
  [
    "You move fast in small steps.",
    "Many short notes, often sent while the last one is still being built. Each one is a small, reversible change.",
    "Keep changes small enough to ship in minutes - then react again.",
  ],
];

const WORKFLOW = [
  [
    "Ship every change live.",
    "Nothing is a mockup. Each change goes to the real site and is checked there - so every opinion is about the real thing.",
  ],
  [
    "Build options side by side.",
    "When unsure, build A and B as live pages (landing A/B, five skies, three review layouts) and pick one on the phone.",
  ],
  [
    "Screenshot laptop and phone after every change.",
    "Two screenshots catch most layout problems before you ever see them.",
  ],
  [
    "Test on your own device.",
    "Test browsers passed every broken version of the background film; only your laptop showed the truth.",
  ],
  [
    "Keep a written list.",
    "Requests go in a list as they arrive, so nothing depends on memory - and messages sent mid-build get picked up in order.",
  ],
  [
    "Turn decisions into rules.",
    "Once you say something twice (candid photos, no orphans, Title Case), it's saved as a rule and applied by default.",
  ],
  [
    "Log the why.",
    "Every change records its reason - which is how this page could be written at all.",
  ],
];

const LOOP = [
  ["Look", "Open the real thing on the real device."],
  ["Feel", "Notice where you hesitate, squint, scroll past or smile."],
  ["Name", "Say it in plain words - which of the ten change types it is."],
  [
    "Change",
    "The smallest change that fixes it - often moving, merging or cutting.",
  ],
  ["Show", "Ship it live; screenshot laptop and phone."],
  ["Spread", "Apply the same fix everywhere it belongs."],
  ["Record", "Write down what changed and why."],
];

const QUESTIONS = [
  "In three seconds, does a stranger know what this is and who it's for?",
  "Is the visitor's problem named in their own words?",
  'Can they find themselves on this screen ("You...")?',
  "Is the proof right next to the ask, and is it the brightest thing there?",
  "What is the one thing this screen is for? What can go?",
  "Does anything look different that should look the same?",
  "Is anything described that could be shown instead?",
  "Is there enough space around the most important thing?",
  "Does it work - and feel right - on a phone, separately?",
  "Is everything real: words, faces, footage?",
  "Can you get anywhere in one gesture, and back to where you were?",
  "When someone does the right thing, does it feel like something?",
];

function H({ n, title, intro }: { n: string; title: string; intro?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold uppercase tracking-[0.25em] text-ink-faint">
        {n}
      </span>
      <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        {title}
      </h2>
      {intro && (
        <p className="max-w-3xl text-sm text-ink-muted text-pretty sm:text-base">
          {intro}
        </p>
      )}
    </div>
  );
}

export default function MethodPage() {
  return (
    <div className="app-glass mx-auto flex w-full max-w-5xl flex-col gap-16 py-8">
      <header className="flex flex-col gap-5">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-ink-faint">
          Creative Developer AI
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          How You Design, Made Visible
        </h1>
        <p className="max-w-3xl text-base text-ink-muted text-pretty sm:text-lg">
          Over two months you made 605 changes to Speak Better, mostly by
          looking at it and saying what felt wrong. This page names what you
          were doing - the kinds of change, the need behind each, the patterns
          you follow without thinking, and the method that came out of it - so
          you can do it on purpose, teach it, and use it on the next product.
        </p>
        <div className="rounded-2xl border border-navy-600 bg-navy-900/60 px-5 py-4 text-sm text-ink text-pretty">
          <b>The headline finding:</b> almost none of the work was adding
          features. <b>Over three quarters</b> was arranging, unifying,
          clarifying, revealing and subtracting - making what already existed
          easier to understand. Good product design is mostly editing.
        </div>
      </header>

      <section className="flex flex-col gap-6">
        <H
          n="01 · Types Of Change"
          title="The Ten Kinds Of Change You Make"
          intro="Each one starts from a need (what felt wrong), makes a specific kind of change, and has a recognisable effect on the screen. Percentages are the share of all 605 changes that involved each type - most changes involve more than one."
        />
        <div className="flex flex-col gap-3">
          {TYPES.map((t) => (
            <article
              key={t.name}
              className="flex flex-col gap-3 rounded-2xl border border-navy-600 bg-navy-900/60 p-5"
            >
              <div className="flex items-center gap-3">
                <h3
                  className="text-lg font-semibold tracking-tight"
                  style={{ color: t.color }}
                >
                  {t.name}
                </h3>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-navy-700">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${t.pct * 3}%`, background: t.color }}
                  />
                </div>
                <span className="w-24 text-right text-sm font-semibold tabular-nums text-ink">
                  {t.pct}% of changes
                </span>
              </div>
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                {(
                  [
                    ["The need", t.need],
                    ["The change", t.change],
                    ["What it does to the screen", t.ui],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-faint">
                      {k}
                    </dt>
                    <dd className="mt-0.5 text-ink-muted text-pretty">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-sm text-ink text-pretty">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-faint">
                  In Speak Better ·{" "}
                </span>
                {t.example}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <H
          n="02 · Hidden Patterns"
          title="What You Do Without Thinking"
          intro="Your unconscious competence - twelve habits that showed up again and again in how you reviewed and changed the product. Each has what it looked like, and how to use it on purpose."
        />
        <div className="grid gap-3 lg:grid-cols-2">
          {PATTERNS.map(([title, seen, use], i) => (
            <article
              key={title}
              className="flex flex-col gap-2 rounded-2xl border border-navy-600 bg-navy-900/60 p-5"
            >
              <div className="flex items-baseline gap-3">
                <span className="text-xl font-bold tabular-nums text-figurative">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-base font-semibold text-ink text-balance">
                  {title}
                </h3>
              </div>
              <p className="text-sm text-ink-muted text-pretty">{seen}</p>
              <p className="text-sm text-ink text-pretty">
                <span className="font-semibold text-mindset">Use it: </span>
                {use}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <H
          n="03 · The Method"
          title="The Loop, In Seven Words"
          intro="What actually happened on every change, in order. Run it on any screen of any product."
        />
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LOOP.map(([k, v], i) => (
            <li
              key={k}
              className="rounded-2xl border border-navy-600 bg-navy-900/60 px-5 py-4"
            >
              <span className="text-xs font-bold tabular-nums text-ink-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-lg font-semibold text-ink">{k}</p>
              <p className="mt-1 text-sm text-ink-muted text-pretty">{v}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-6">
        <H
          n="04 · Review Questions"
          title="Twelve Questions For Any Screen"
          intro="Your instincts, written as questions. Ask them in order before calling a screen done."
        />
        <ol className="grid gap-2 sm:grid-cols-2">
          {QUESTIONS.map((q, i) => (
            <li
              key={q}
              className="flex gap-3 rounded-xl border border-navy-600 bg-navy-900/50 px-4 py-3 text-sm text-ink"
            >
              <span className="font-bold tabular-nums text-figurative">
                {i + 1}
              </span>
              <span className="text-pretty">{q}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-6">
        <H
          n="05 · Workflow"
          title="The Way Of Working That Made It Fast"
          intro="New approaches we found along the way that made the work easier, faster and more accurate."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {WORKFLOW.map(([k, v]) => (
            <div
              key={k}
              className="rounded-2xl border border-navy-600 bg-navy-900/60 px-5 py-4"
            >
              <p className="font-semibold text-ink">{k}</p>
              <p className="mt-1 text-sm text-ink-muted text-pretty">{v}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="rounded-2xl border border-navy-600 bg-navy-900/60 px-5 py-4 text-sm text-ink-muted text-pretty">
        This method is saved as the{" "}
        <b className="text-ink">Creative Developer AI</b> Claude skill, so
        it&apos;s applied automatically to every future product. The full record
        of what changed in Speak Better, decision by decision, is at{" "}
        <a
          href="/journey"
          className="font-semibold text-figurative underline-offset-2 hover:underline"
        >
          /journey
        </a>
        .
      </footer>
    </div>
  );
}
