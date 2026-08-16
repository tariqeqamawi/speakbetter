import type { CategoryId } from "./categories";

// The Skills library - every lesson video, sorted into its color category.
// Vimeo ids come from the course's actual video library. The category sort
// is a strong first pass awaiting Tariq's review (build plan, Phase 1);
// vocal-delivery lessons are nested under "acting" pending that review.

export interface Lesson {
  vimeoId: string;
  title: string;
  category: CategoryId;
}

export const lessons: Lesson[] = [
  // ── Storytelling techniques (yellow) ────────────────────────────────
  { vimeoId: "1081030429", title: "Stories Make The World Go Round", category: "storytelling" },
  { vimeoId: "1081031042", title: "Storytelling: Don't Tell it, Relive The Experience", category: "storytelling" },
  { vimeoId: "1081031146", title: "Imagination: The Production Studio In Your Mind", category: "storytelling" },
  { vimeoId: "1081031433", title: "Life Scene NOT Life Story", category: "storytelling" },
  { vimeoId: "1081031495", title: "Facts Tell, Stories Sell", category: "storytelling" },
  { vimeoId: "1081031584", title: "Story Time: The Almost Snowboarder", category: "storytelling" },
  { vimeoId: "1081031902", title: "Story Time: The Almost Snowboarder - Debrief", category: "storytelling" },
  { vimeoId: "1081289259", title: "Your StoryBook: How to Find YOUR Stories", category: "storytelling" },
  { vimeoId: "1081290890", title: "How To Create Your Story Book - Step 1", category: "storytelling" },
  { vimeoId: "1081292518", title: "How To Create Your Story Book - Step 2", category: "storytelling" },
  { vimeoId: "1081292414", title: "Add The Moral or Message", category: "storytelling" },
  { vimeoId: "1081294121", title: "Give The Setting Then Dive Into The Scene", category: "storytelling" },
  { vimeoId: "1081198327", title: "The Client In The Hero's Journey", category: "storytelling" },
  { vimeoId: "1081198162", title: "Link Your Call To Action To The Moral Of The Story", category: "storytelling" },
  { vimeoId: "1080679081", title: "Visual, Aural & Kinaesthetic Speaking", category: "storytelling" },

  // ── Figurative language (orange) ────────────────────────────────────
  { vimeoId: "1081032328", title: "Introduction To Figurative Language", category: "figurative" },
  { vimeoId: "1081032404", title: "Using Cultural Reference To Shorten Descriptions", category: "figurative" },
  { vimeoId: "1081032528", title: "Metaphors: What They Are And How To Use Them", category: "figurative" },
  { vimeoId: "1081032662", title: "Similes: Examples & Explanation", category: "figurative" },
  { vimeoId: "1081032763", title: "Anthropomorphism: Examples & Uses", category: "figurative" },
  { vimeoId: "1081032892", title: "Personification: Examples & Uses", category: "figurative" },
  { vimeoId: "1081706536", title: "Hyperbole: What It Is & How To Use It", category: "figurative" },
  { vimeoId: "1081707157", title: "Onomatopoeia: Examples & Uses", category: "figurative" },
  { vimeoId: "1081707642", title: "Analogies Masterclass", category: "figurative" },
  { vimeoId: "1080654991", title: "Alliteration", category: "figurative" },
  { vimeoId: "1081164442", title: "Using Rhyme", category: "figurative" },

  // ── Acting skills for speakers (red) - includes vocal delivery ──────
  { vimeoId: "1081162752", title: "Acting Tip For Speakers: Don't Just Say It, Imagine It", category: "acting" },
  { vimeoId: "1081162875", title: "Don't Just Speak It, Act Out The Scene", category: "acting" },
  { vimeoId: "1081163248", title: "Narrate The Scene To Zoom Into Moments", category: "acting" },
  { vimeoId: "1081163466", title: "How To Convey Multiple Characters", category: "acting" },
  { vimeoId: "1081163657", title: "Simulate Sounds & Embody Emotions", category: "acting" },
  { vimeoId: "1081163798", title: "Using Props To Anchor Your Talk", category: "acting" },
  { vimeoId: "1080443133", title: "Voice: Conversational vs Commanding", category: "acting" },
  { vimeoId: "1080612884", title: "Warming Up The Voice", category: "acting" },
  { vimeoId: "1080675446", title: "Making Your Message a Melody", category: "acting" },
  { vimeoId: "1081285460", title: "Vocal Delivery: Make Your Message a Melody", category: "acting" },
  { vimeoId: "1081162033", title: "Powerful Pause vs Awkward Silence", category: "acting" },
  { vimeoId: "1081200064", title: "Using Tongue Twisters To Improve Speech", category: "acting" },
  { vimeoId: "1080629747", title: "What Are Filler Words And How To Remove Them", category: "acting" },

  // ── Structure & framing (purple) ────────────────────────────────────
  { vimeoId: "1080624037", title: "Inform, Inspire, Invite, Empower, Entertain, Educate", category: "structure" },
  { vimeoId: "1080648113", title: "Say Things in Triplets", category: "structure" },
  { vimeoId: "1080660643", title: "Repetition and Emphasis", category: "structure" },
  { vimeoId: "1080677865", title: "Repetition for Emphasis - Expanded", category: "structure" },
  { vimeoId: "1080662335", title: "Rhetorical Questions", category: "structure" },
  { vimeoId: "1081163913", title: "Using Promise & Payoff", category: "structure" },
  { vimeoId: "1081197526", title: "Open Loops", category: "structure" },
  { vimeoId: "1081197216", title: "Balances & Reversals", category: "structure" },
  { vimeoId: "1081197062", title: "Using A Pattern Interrupt", category: "structure" },
  { vimeoId: "1081198709", title: "How To Structure Longer Talks", category: "structure" },
  { vimeoId: "1081198798", title: "How To Open Your Talk", category: "structure" },
  { vimeoId: "1081198886", title: "Framework: Tell, Teach, Action", category: "structure" },
  { vimeoId: "1081198957", title: "Framework: Hook, Story, Close", category: "structure" },
  { vimeoId: "1080635988", title: "Speak As If To a Room of 9 Year Olds", category: "structure" },

  // ── Speaker's mindset & psychology (green) ──────────────────────────
  { vimeoId: "1081029629", title: "Why You Have a Fear of Public Speaking", category: "mindset" },
  { vimeoId: "1081029780", title: "You Are One Talk Away From Changing Your Life", category: "mindset" },
  { vimeoId: "1081029881", title: "Imagine Your Heart Is The One Speaking", category: "mindset" },
  { vimeoId: "1081030261", title: "Become The Voice of Your Values & Messenger Of Your Mission", category: "mindset" },
  { vimeoId: "1081197407", title: "You Were a Born Public Speaker", category: "mindset" },
  { vimeoId: "1094881996", title: "How To Overcome Your Fear Of Speaking: Soften", category: "mindset" },
  { vimeoId: "1081162517", title: "As The Speaker You Have ALL The Power!", category: "mindset" },
  { vimeoId: "1081162691", title: "You Are Delivering An Experience, Not A Talk", category: "mindset" },
  { vimeoId: "1081199069", title: "NLP & Autosuggestion", category: "mindset" },
  { vimeoId: "1081199902", title: "Building A Thank Account", category: "mindset" },
  { vimeoId: "1082732774", title: "Being Professional vs Being Serious", category: "mindset" },
  { vimeoId: "1081162172", title: "Make It About Your Audience", category: "mindset" },

  // ── Body language & physical expression (blue) ──────────────────────
  { vimeoId: "1081708997", title: "Introduction To Body & Physical Expression", category: "body-language" },
  { vimeoId: "1080653314", title: "Hand Gestures: Express Visually What You Say Verbally", category: "body-language" },
  { vimeoId: "1081161934", title: "Hand Gestures Pro Tip", category: "body-language" },
  { vimeoId: "1081137961", title: "Opening Your Posture", category: "body-language" },
  { vimeoId: "1081162384", title: "How To Move On Stage", category: "body-language" },
  { vimeoId: "1080435328", title: "Your Speaking Tools: Body, Voice, Words", category: "body-language" },

  // ── Advanced tips & tricks (dark red) ───────────────────────────────
  { vimeoId: "1081161473", title: "How To Receive A Standing Ovation", category: "advanced" },
  { vimeoId: "1081161658", title: "How To Use Slides Like A Pro", category: "advanced" },
  { vimeoId: "1081161815", title: "How To Build Mic Drop Moments", category: "advanced" },
  { vimeoId: "1081162283", title: "Going Live On Socials", category: "advanced" },
  { vimeoId: "1081164747", title: "Don't Sell - Invite & Recommend", category: "advanced" },
  { vimeoId: "1081198604", title: "How To Memorize Your Talks", category: "advanced" },
  { vimeoId: "1081165164", title: "Memorized Inserts", category: "advanced" },
  { vimeoId: "1081200223", title: "Staying Succinct: Pro Tip", category: "advanced" },
  { vimeoId: "1081032074", title: "How To Speak Naturally To a Phone or Camera", category: "advanced" },
  { vimeoId: "1081032253", title: "Keep The Light Source In Front", category: "advanced" },
];

export const lessonByVimeoId = new Map(lessons.map((l) => [l.vimeoId, l]));

export function lessonsInCategory(category: CategoryId): Lesson[] {
  return lessons.filter((l) => l.category === category);
}
