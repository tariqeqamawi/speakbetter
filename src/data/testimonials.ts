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
}

export const testimonials: Testimonial[] = [
  {
    name: "",
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
    // Confirmed by Tariq: this is Dave J. Anderson's, and it is his
    // second - he is quoted twice, on two different things, which is
    // fine and rather good. The two are placed in different halves of
    // the page so his name does not appear twice in one column.
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
    name: "Dave J. Anderson",
    quote:
      "You've nailed the skills library and the micro lessons. I'm getting more and more from them every time I watch, and already have a clear sense that this course is invaluable. Thank you. You are so inspiring and a terrific speaker.",
    tag: "lessons",
  },
  {
    // Confirmed by Tariq: Gene East is a separate person. The dictated
    // line ran two people together - Liz A. Hammond's name, then
    // Gene East's, then one quote. Which of them said it is still
    // open, so both are held back rather than guessed at.
    name: "Liz A. Hammond",
    quote:
      "This course is the best. So easy to follow, easy to implement, and the knowledge and confidence gained from it is truly heartfelt. You are a truly beautiful, resonant, melodic human to learn from, Tariq. Thank you for this course.",
    tag: "teacher",
    check: true,
  },
  {
    name: "Gene East",
    quote: "",
    tag: "teacher",
    // A confirmed name with no words yet - the quote that followed it
    // in the dictation belongs to Liz A. Hammond or to her, and there
    // is no way to tell from here. Kept as a placeholder so the name
    // is not lost.
    check: true,
  },
  {
    name: "Rach L.",
    quote:
      "This course has been life-changing. I would never have dreamed of speaking before and recording myself, but now have a new comfort. Weeks later the micro lessons are easily accessible and digestible, perfect for anyone time-pressed. Tariq genuinely cares about impacting people's lives through enhancing their speaking skills, and in a time of reduced attention spans and increased distractions, this course is invaluable.",
    tag: "lessons",
    check: true,
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
    name: "Anne Awour Matoket",
    quote: "Tariq, you are truly amazing. Thanks for contributing to my confidence in public speaking.",
    tag: "confidence",
    check: true,
  },
  {
    name: "Sharon Ho",
    quote:
      "I am so, so pleased to have listened to my inner voice when this opportunity to join Speak Better came up. I was in Bali with the family, heading to Jimbaran Bay for a beautiful sunset dinner. Being amid spending a fair bit on the holiday, you could say I could have easily dismissed this opportunity, but my gut told me I won't regret it - and 100% my gut was right. In only week 2 I already learned how to stop the “um”, and the value that Tariq has been dropping is paradigm-shifting. I cannot wait to keep practicing so I can sharpen my skills to become the messenger of my message.",
    tag: "worth",
  },
  {
    name: "Melissa Richard",
    quote:
      "Thank you Tariq. I feel like I have permission to tell my stories and that they hold value. Your method and guidance for transitioning into a call to action that draws people in like a warm hug is just beautiful. I can't wait to get practicing the skill so I can shift from clunky to ease and connect with my people. I'm very excited to see what's coming and see my progress from where I am now to the storyteller I'm becoming.",
    tag: "storytelling",
  },
  {
    name: "Michelle",
    quote:
      "So often in life, due to childhood experiences, school, work, friends or others, we can lose our voice, our ability to speak our truth, speak with confidence, and feel we can share our message powerfully. In just two live sessions plus the course resources, I am stepping back into my power, and already this journey is gifting me the ability to share my story and to find my voice. If you are ready to find your voice and take your business to the next level, I cannot recommend this enough. We can all learn to speak better. Thank you, Tariq, for gifting me the knowledge, skill and art of storytelling.",
    tag: "confidence",
    // Dictated as "Mepower Michelle" - likely a handle rather than a
    // surname.
    check: true,
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
    name: "Tarns Blueweaver",
    quote:
      "I got to a point in my business where I felt I couldn't articulate what I wanted to say. I was on a mission to find someone that would help me ignite the voice I knew I was trying to break through. What I have noticed in my first week is the impact of simplicity. Tariq's content is crystal clear, with no confusion, and the only hard thing has been me breaking through old patterns. There is strategy and there is magic in the way that Tariq has compiled this course, but for me there's also a sense of biblical presence that hits my soul on another level. I'm getting goosebumps just writing this. Tariq was born to do this, and I'd say you needn't look any further if you are searching for your voice.",
    tag: "teacher",
    check: true,
  },
  {
    name: "Karen Lay",
    quote:
      "Really loving Speak Better so far. Already learning so much, and grateful for the opportunity to learn these valuable skills from such an inspiring teacher.",
    tag: "lessons",
    check: true,
  },
  {
    name: "Preethi",
    quote:
      "I sat on it for a week and a half before I signed up, but the nudge got stronger and I had to listen to the call. Thank God I did, because something shifted right after the first week and week 2 is just getting better. There's something about Tariq's energy that is so potent and powerful. Highly recommend signing up for this one.",
    tag: "worth",
  },
  {
    name: "Preethi",
    quote:
      "It's no wonder you say we would see change within 6 weeks. Thank you so much. I'm changing daily from the learnings. Love the growth. It is even supporting me with my interviews. Feeling the stretch and enjoying it.",
    tag: "results",
    // Dictated straight after Preethi's first quote with no new name,
    // so attributed to her - worth confirming it is not somebody else.
    check: true,
  },
  {
    name: "Teresa Ecclin",
    quote:
      "I jumped into the Speak Better course a couple of days ago. Great content, short videos, easy to follow. I'm very happy so far. A really good offer.",
    tag: "lessons",
    check: true,
  },
  {
    name: "Kylie Klein",
    quote:
      "Thanks Tariq, it's been great. My confidence has improved and now I want to improve my skill. This is the place to be to grow.",
    tag: "confidence",
    // The dictation ran on into "Thanks again Erin Ralph. The course
    // has been fantastic..." which looks like a second person's words
    // joined to hers; that part is the next entry.
    check: true,
  },
  {
    name: "Erin Ralph",
    quote:
      "The course has been fantastic and I will continue to look back at the course to learn and speak better. Thank you so much for this amazing experience. I know there is so much more to learn and practice. I will use these amazing gifts you have provided us to continue to sharpen my skills daily. Very grateful.",
    tag: "lessons",
    check: true,
  },
  {
    name: "Christie Xord",
    quote:
      "I got asked to speak on stage in front of 7,000 people. I started preparing for this talk with Tariq so that I'm not crapping my pants on stage and I deliver something really heartfelt. My biggest win is that I won your speaking course. Perfect timing, as I felt a big shift whilst being in Japan and it's time for me to be seen and use my voice more. Thank you again, appreciate you.",
    tag: "results",
    check: true,
  },
  {
    // Confirmed by Tariq: she is Michaela, and the word is "Tingy" -
    // dictation heard "Mika Ella" and "Tingly". Both now as she wrote
    // them, which is the point of a testimonial.
    name: "Michaela",
    quote:
      "Tingy. So deeply aligned with your words and total soul-led purpose, brother. So deeply grateful I'm working with you.",
    tag: "teacher",
  },
  {
    name: "Catherine Sissons",
    quote:
      "I can validate how amazing this is. I joined and it's very addictive listening to the short videos. I'm sure the frequency of your voice moves something in us when we do.",
    tag: "lessons",
  },
];

/** The ones safe to show: a name that has been confirmed, and words
 *  that say what they are meant to say. */
export const publishable = testimonials.filter((t) => !t.check && t.name);

/** Everything that evidences one particular claim. */
export function proofOf(tag: Proof, all = false): Testimonial[] {
  return (all ? testimonials : publishable).filter((t) => t.tag === tag);
}
