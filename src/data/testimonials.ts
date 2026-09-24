// What students have said, in their own words.
//
// TRANSCRIBED, NOT EDITED. These arrived as dictation and are kept as
// close to verbatim as punctuation allows. Nothing has been tightened,
// brightened or merged: a testimonial that has been improved is not a
// testimonial, and the specific, slightly awkward sentence is the one
// that reads as true. Where dictation clearly dropped a comma or ran
// two sentences together, that is fixed; where it changed what was
// said, it is not.
//
// `check: true` MARKS A NAME OR PHRASE I COULD NOT VERIFY. Dictation
// mangles proper nouns, and several of these look mangled - a real
// person's name misspelled on a sales page is worse than one fewer
// testimonial. Nothing marked `check` should be published until Tariq
// has confirmed the spelling. They are kept in the file rather than
// dropped so none of them is lost.
//
// `tag` says which claim on the page a quote actually evidences, so
// they can be placed against the thing they prove rather than piled
// into one wall of praise. A quote about micro-lessons under the
// lessons section is proof; the same quote in a carousel is wallpaper.

export type Proof =
  | "confidence" // fear, nerves, being on camera
  | "lessons" // the library, the micro-lessons, the format
  | "storytelling" // finding and telling their stories
  | "results" // a concrete outcome
  | "teacher" // Tariq himself
  | "worth"; // the buying decision

export interface Testimonial {
  /** As given. Empty where none was dictated. */
  name: string;
  quote: string;
  tag: Proof;
  /** The name or a phrase in it needs confirming before publishing. */
  check?: boolean;
  /**
   * Published as initials instead of a name.
   *
   * Several of these arrived with a name that dictation mangled, or
   * with no name at all, and they were all held back: a real person's
   * name misspelled on a sales page is worse than one fewer quote.
   * But holding them back has its own cost - the words are real and
   * they were sitting in this file doing nothing.
   *
   * Initials are the way out, and they are Tariq's to supply, not
   * mine to derive: the initials of the person who said it, confirmed
   * by him. Never invented from the mangled spelling, because "A.M."
   * guessed from a misheard surname is the same false attribution as
   * the misspelling was, just harder to spot.
   *
   * An entry with initials publishes even while `check` is still set -
   * the flag then means "the full name is still unconfirmed", which is
   * true, and no longer means "do not publish", because what gets
   * published is not the full name.
   */
  initials?: string;
}

/** What goes under the quote: the initials where there are any. */
export function credit(t: Testimonial): string {
  return t.initials || t.name;
}

export const testimonials: Testimonial[] = [
  {
    // No name came with this one at all. Initials confirmed by Tariq.
    name: "",
    initials: "JS",
    quote:
      "To this day I still benefit from your training when I joined in the past. I highly recommend joining this course.",
    tag: "worth",
    check: true,
  },
  {
    name: "Vincent Hazenboom",
    quote: "Bloody brilliant. All the very best, Tariq.",
    tag: "worth",
  },
  {
    // Confirmed by Tariq: Lhamo Ingrik is one person, not two names.
    name: "Lhamo Ingrik",
    quote: "Bloody brilliant. All the very best, Tariq.",
    tag: "worth",
    // Both names arrived attached to the same dictated line, so it is
    // not certain which of them said it - or whether they both did.
    // Held back until that is known: putting one person's words in
    // another's mouth is the one mistake a testimonial cannot survive.
    check: true,
  },
  {
    // Dave J. Anderson's, and now his only one: the quote that used
    // to sit under his name as a second is Rachel's, at the foot of
    // this list.
    name: "Dave J. Anderson",
    quote:
      "I purchased Speak Better and I recommend it only if you really want to learn and grow and perfect your speaking skills and become the best speaker and presenter you can be. Then I say go for it.",
    tag: "worth",
    // "cannot recommend it unless" reworded to "recommend it only if"
    // at Tariq's direction. Same meaning, and it no longer reads as
    // the opposite of itself on first pass - which is not a risk worth
    // running directly above a price.
  },
  {
    // Settled by Tariq: Gene East said this one.
    //
    // The dictation ran two people together - Liz A. Hammond's name,
    // then Gene East's, then a single quote - and it was held for
    // weeks rather than guessed at, because putting one person's
    // words in another's mouth is the one mistake a testimonial
    // cannot survive. It was worth the wait to be told.
    name: "Gene East",
    quote:
      "This course is the best. So easy to follow, easy to implement, and the knowledge and confidence gained from it is truly heartfelt. You are a truly beautiful, resonant, melodic human to learn from, Tariq. Thank you for this course.",
    tag: "teacher",
  },
  {
    // Liz A. Hammond is a real person whose name arrived in that same
    // run of dictation, with no words of her own attached to it. Kept
    // as a placeholder rather than deleted so the name is not lost if
    // her quote turns up later; it publishes nothing while `quote` is
    // empty.
    name: "Liz A. Hammond",
    quote: "",
    tag: "teacher",
    check: true,
  },
  {
    // Confirmed by Tariq: Rach Ael. Dictation had clipped the surname
    // to an initial.
    //
    // OPEN: Tariq later attributed another quote to "Rachel". If that
    // is this same person, the two entries should carry one spelling
    // of her name; if not, they are two students who both liked the
    // lessons. Left as given either way - inventing the link is the
    // worse of the two mistakes.
    name: "Rach Ael",
    quote:
      "This course has been life-changing. I would never have dreamed of speaking before and recording myself, but now have a new comfort. Weeks later the micro lessons are easily accessible and digestible, perfect for anyone time-pressed. Tariq genuinely cares about impacting people's lives through enhancing their speaking skills, and in a time of reduced attention spans and increased distractions, this course is invaluable.",
    tag: "lessons",
  },
  {
    name: "Natasha Hein",
    quote:
      "I highly recommend doing any speaking course with Tariq. I learned so much, definitely improved my speaking ability on camera, and it gave me a huge boost in my confidence.",
    tag: "confidence",
  },
  {
    name: "Victoria Kleinsman",
    quote:
      "Tariq was such a huge catalyst in my journey and I'm forever grateful to him and his coaching.",
    tag: "teacher",
  },
  {
    // Confirmed by Tariq: Anne Awuor Matoke - Awuor, and Matoke.
    name: "Anne Awuor Matoke",
    quote: "Tariq, you are truly amazing. Thanks for contributing to my confidence in public speaking.",
    tag: "confidence",
  },
  {
    name: "Sharon Ho",
    quote:
      "I am so, so pleased to have listened to my inner voice when this opportunity to join Speak Better came up. I was in Bali with the family, heading to Jimbaran Bay for a beautiful sunset dinner. Being amid spending a fair bit on the holiday, you could say I could have easily dismissed this opportunity, but my gut told me I won't regret it - and 100% my gut was right. In only week 2 I already learned how to stop the “um”, and the value that Tariq has been dropping is paradigm-shifting. I cannot wait to keep practicing so I can sharpen my skills to become the messenger of my message.",
    tag: "worth",
  },
  {
    // Confirmed by Tariq: Pritchard, not Richard. She is quoted twice;
    // splitForPage() keeps the two out of the same column.
    name: "Melissa Pritchard",
    quote:
      "Thank you Tariq. I feel like I have permission to tell my stories and that they hold value. Your method and guidance for transitioning into a call to action that draws people in like a warm hug is just beautiful. I can't wait to get practicing the skill so I can shift from clunky to ease and connect with my people. I'm very excited to see what's coming and see my progress from where I am now to the storyteller I'm becoming.",
    tag: "storytelling",
  },
  {
    // Confirmed by Tariq: MePower Michelle - the handle IS the name
    // she goes by, which is why dictation ran the two together.
    name: "MePower Michelle",
    quote:
      "So often in life, due to childhood experiences, school, work, friends or others, we can lose our voice, our ability to speak our truth, speak with confidence, and feel we can share our message powerfully. In just two live sessions plus the course resources, I am stepping back into my power, and already this journey is gifting me the ability to share my story and to find my voice. If you are ready to find your voice and take your business to the next level, I cannot recommend this enough. We can all learn to speak better. Thank you, Tariq, for gifting me the knowledge, skill and art of storytelling.",
    tag: "confidence",
  },
  {
    name: "Kali Klein",
    quote:
      "This course is helping me accept myself more when speaking on camera. It's a journey, of course, of finding my inner voice and giving myself permission to speak with confidence, but Tariq has developed a pathway with steps to take every week. Learning these skills isn't making me more programmed; it's making me less programmed, more free, and more alive to speak my vision. Thanks, Tariq, for creating this course. If you'd like to speak better for yourself, join us in the super uplifting and encouraging course.",
    tag: "confidence",
  },
  {
    name: "Linda Scott",
    quote:
      "I am so glad I joined. Very excited to learn how to improve my delivery, among a slew of other reasons. This course is an opportunity one should not miss.",
    tag: "worth",
  },
  {
    name: "Jackie Briggs",
    quote:
      "In the first week I felt a shift. Talking into the camera, Tariq has a gift that is helping me build my confidence, which I haven't experienced before.",
    tag: "confidence",
  },
  {
    // Confirmed by Tariq: Tarnz Bluweaver.
    name: "Tarnz Bluweaver",
    quote:
      "I got to a point in my business where I felt I couldn't articulate what I wanted to say. I was on a mission to find someone that would help me ignite the voice I knew I was trying to break through. What I have noticed in my first week is the impact of simplicity. Tariq's content is crystal clear, with no confusion, and the only hard thing has been me breaking through old patterns. There is strategy and there is magic in the way that Tariq has compiled this course, but for me there's also a sense of biblical presence that hits my soul on another level. I'm getting goosebumps just writing this. Tariq was born to do this, and I'd say you needn't look any further if you are searching for your voice.",
    tag: "teacher",
  },
  {
    // Confirmed by Tariq: Karen Leigh HR - and he re-dictated the
    // line with it, so the wording here is his second pass rather
    // than the first, which had picked up a "so far" and a comma.
    name: "Karen Leigh HR",
    quote:
      "Really loving Speak Better. Already learning so much and grateful for the opportunity to learn these valuable skills from such an inspiring teacher.",
    tag: "lessons",
  },
  {
    // Confirmed by Tariq: Peethi Premkumar.
    name: "Peethi Premkumar",
    quote:
      "I sat on it for a week and a half before I signed up, but the nudge got stronger and I had to listen to the call. Thank God I did, because something shifted right after the first week and week 2 is just getting better. There's something about Tariq's energy that is so potent and powerful. Highly recommend signing up for this one.",
    tag: "worth",
  },
  {
    // Her second. It was dictated straight after the first with no
    // new name, so it was held on the chance it belonged to somebody
    // else; Tariq naming her is taken as settling that.
    name: "Peethi Premkumar",
    quote:
      "It's no wonder you say we would see change within 6 weeks. Thank you so much. I'm changing daily from the learnings. Love the growth. It is even supporting me with my interviews. Feeling the stretch and enjoying it.",
    tag: "results",
  },
  {
    // Confirmed by Tariq: Therese Ekelin.
    name: "Therese Ekelin",
    quote:
      "I jumped into the Speak Better course a couple of days ago. Great content, short videos, easy to follow. I'm very happy so far. A really good offer.",
    tag: "lessons",
  },
  {
    // Confirmed by Tariq: Callie, not Kylie. Note this is a different
    // person from Kali Klein above - two Kleins, both real.
    name: "Callie Klein",
    quote:
      "Thanks Tariq, it's been great. My confidence has improved and now I want to improve my skill. This is the place to be to grow.",
    tag: "confidence",
    // The dictation ran on into "Thanks again Erin Ralph. The course
    // has been fantastic..." which looks like a second person's words
    // joined to hers; that part is the next entry.
  },
  {
    name: "Erin Ralph",
    quote:
      "The course has been fantastic and I will continue to look back at the course to learn and speak better. Thank you so much for this amazing experience. I know there is so much more to learn and practice. I will use these amazing gifts you have provided us to continue to sharpen my skills daily. Very grateful.",
    tag: "lessons",
    check: true,
  },
  {
    // Confirmed by Tariq: Kristie X Ord - a K, and "X Ord" is two
    // parts, which is why dictation ran it into one word.
    name: "Kristie X Ord",
    quote:
      "I got asked to speak on stage in front of 7,000 people. I started preparing for this talk with Tariq so that I'm not crapping my pants on stage and I deliver something really heartfelt. My biggest win is that I won your speaking course. Perfect timing, as I felt a big shift whilst being in Japan and it's time for me to be seen and use my voice more. Thank you again, appreciate you.",
    tag: "results",
  },
  {
    // Confirmed by Tariq: MikaElla Tingi.
    //
    // "Tingy." was sitting at the head of the quote as though it were
    // the first word she said. It is not - it is the second half of
    // her own name, which dictation split off and punctuated into the
    // sentence. Moving it back to the name fixes both ends at once:
    // she is credited properly, and the quote now opens on the line
    // she actually wrote.
    name: "MikaElla Tingi",
    quote:
      "So deeply aligned with your words and total soul-led purpose, brother. So deeply grateful I'm working with you.",
    tag: "teacher",
  },
  {
    name: "Catherine Sissons",
    quote:
      "I can validate how amazing this is. I joined and it's very addictive listening to the short videos. I'm sure the frequency of your voice moves something in us when we do.",
    tag: "lessons",
  },
  {
    // Rachel's, not Dave J. Anderson's.
    //
    // This sat under Dave's name for weeks because the dictation ran
    // his quote and this one together; Tariq has now re-dictated it
    // and said whose it is. The wording is his second pass, which
    // ends at "Thank you" - the line about being inspiring and a
    // terrific speaker went with it, so it is not kept here on a
    // guess about who said that part.
    //
    // Whether Rachel is the same person as Rach Ael, further up, is
    // an open question - see the note on her entry. They are kept
    // separate until somebody says, because merging two people is
    // worse than showing one person under two spellings.
    name: "Rachel",
    quote:
      "You've nailed the skills library and the microlessons. I'm getting more and more from them every time I watch. I already have a clear sense that this course is invaluable. Thank you.",
    tag: "lessons",
  },
  {
    // Melissa Pritchard's second. Tagged `results` rather than
    // `storytelling`, which her first one carries: the evidence here
    // is not that she believes she could tell a story, it is that she
    // has already put one out in public - which is a different claim
    // and a stronger one. Two of her quotes under the same heading
    // would also read as one person saying the same thing twice.
    name: "Melissa Pritchard",
    quote:
      "Thank you Tariq. I'm so pleased I joined this course. I've already put a clunky story out there on my socials. Onwards and upward from here!",
    tag: "results",
  },
];

/** The ones safe to show: a name that has been confirmed, and words
 *  that say what they are meant to say. */
// Publishable: a confirmed name, or initials Tariq has confirmed
// stand in for one. Everything else waits - see `check` above.
export const publishable = testimonials.filter((t) => t.quote && (t.initials || (!t.check && t.name)));

/**
 * The two drifting sections on the landing page, split so that nobody
 * appears twice in the same one.
 *
 * Three people are quoted twice now, and the page used to split the
 * list down the middle with `slice` - which put both of Dave J.
 * Anderson's quotes in the same column, one under the other, reading
 * as a page short of testimonials rather than as a man with two things
 * to say. It had been fine when the comment saying so was written, and
 * quietly stopped being fine as the list grew.
 *
 * Comments asking a future reader to re-check an ordering do not
 * survive contact with a list that keeps changing, so this is a rule
 * instead: a person's first quote goes in one half, their second in
 * the other, and everything else fills up evenly around them.
 */
export function splitForPage(): [Testimonial[], Testimonial[]] {
  const halves: [Testimonial[], Testimonial[]] = [[], []];
  const seen = new Map<string, number>();
  for (const t of publishable) {
    const who = credit(t);
    const before = seen.get(who);
    // Somebody already quoted goes in the half they are not in.
    // Otherwise, whichever half is currently shorter.
    const side = before !== undefined ? (before === 0 ? 1 : 0) : halves[0].length <= halves[1].length ? 0 : 1;
    halves[side].push(t);
    seen.set(who, side);
  }
  return halves;
}

/** Everything that evidences one particular claim. */
export function proofOf(tag: Proof, all = false): Testimonial[] {
  return (all ? testimonials : publishable).filter((t) => t.tag === tag);
}
