// What the cohort said about each challenge, before there is a cohort.
//
// WHY THESE ARE WRITTEN AND NOT GENERATED. A challenge thread is read
// by somebody standing on that exact challenge, about to record,
// looking for a reason to believe it is doable. Generic filler - the
// same four cheerful lines shuffled across twenty-four challenges -
// actively fails that person: it is obvious within two threads that
// nobody is really there, and a room that is obviously fake is worse
// than a room that is honestly empty.
//
// So every one of these is about the thing that challenge actually
// asks for, and most of them carry a tip somebody could use in the
// next ten minutes. The useful shape turned out to be: one person
// admitting it went badly, one person saying what fixed it.
//
// These are stand-ins. The moment Supabase is configured the real
// cohort's messages replace them entirely (lib/chat-local is only
// reached when there are no keys), and the threads are deliberately
// not cohort-scoped, so cohort two arrives to find cohort one's real
// advice waiting instead of this.

export interface Chatter {
  name: string;
  body: string;
  /** Staggered so the day separators have something to separate. */
  hoursAgo: number;
}

export const challengeChatter: Record<string, Chatter[]> = {
  "speaking-baseline": [
    { name: "Amara", body: "Mine was 41 and I nearly deleted it. Leave it up. In week five it is the most satisfying thing in the app.", hoursAgo: 50 },
    { name: "Jonas", body: "Do not prepare. I scripted mine and Coach clocked it in about nine seconds - said I was reciting, not speaking.", hoursAgo: 27 },
    { name: "Maya", body: "Two minutes is much longer than you think with nothing planned. Say the boring true thing and keep going.", hoursAgo: 5 },
  ],
  "story-without-help": [
    { name: "Priya", body: "Told the one I always tell at dinner. Watched it back and I say “and then” eleven times. Eleven.", hoursAgo: 44 },
    { name: "Leo", body: "The point is that it is unpolished. Resist doing a second take before you have even watched the first one.", hoursAgo: 8 },
  ],
  "mindset-toolbox": [
    { name: "Ken", body: "You finish this one by watching, not recording. The nerves lesson is the one I keep going back to.", hoursAgo: 39 },
    { name: "Lena", body: "Did all the green ones on two commutes. Watch the pause one twice - it is the shortest and the most useful.", hoursAgo: 11 },
  ],
  "no-filler-words": [
    { name: "Tomas", body: "Zero ums is brutal. What actually worked was slowing right down and letting silence do the job the um was doing.", hoursAgo: 46 },
    { name: "Sofia", body: "Pick something you genuinely love. It is hard to say um when you are that keen to get to the next bit.", hoursAgo: 22 },
    { name: "Ines", body: "Four takes. On take four I finally stopped trying to sound clever and it just came out.", hoursAgo: 4 },
  ],
  "avoid-boring-words": [
    { name: "Julia", body: "Banning “amazing” was harder than the filler challenge. I had to work out what I actually meant.", hoursAgo: 35 },
    { name: "Ravi", body: "Tip that unlocked it: describe what the thing DOES to you instead of reaching for an adjective.", hoursAgo: 9 },
  ],
  "voice-melody": [
    { name: "Elsa", body: "Felt completely ridiculous doing it. Watched it back and the flat version was the ridiculous one.", hoursAgo: 41 },
    { name: "Danil", body: "Pick a dull topic on purpose. Mine was a kettle and it worked far better than something dramatic.", hoursAgo: 13 },
  ],
  "tongue-twisters": [
    { name: "Marco", body: "Round three fast is where it falls apart. Keep going anyway - that is the challenge, not the failure.", hoursAgo: 30 },
    { name: "Maya", body: "Clarity beats speed. Coach marked me down for rushing into mush and was completely right.", hoursAgo: 6 },
  ],
  "beatbox-rhythm": [
    { name: "Leo", body: "Genuinely the most exposed I have felt so far. Also the one that unlocked everything after it.", hoursAgo: 47 },
    { name: "Omar", body: "Did mine in the car with the doors shut. Nobody sees it but Coach - that is the whole reason it works.", hoursAgo: 25 },
    { name: "Priya", body: "Being willing to look silly is the actual skill being taught here. Once I got that it stopped being scary.", hoursAgo: 3 },
  ],
  "create-storybook": [
    { name: "Ines", body: "Pick the three moments and title them BEFORE you record. Doing both at once was a mess.", hoursAgo: 33 },
    { name: "Ken", body: "Title it like a chapter of a book. It genuinely changes how you tell it.", hoursAgo: 10 },
  ],
  "scene-with-sound": [
    { name: "Danil", body: "Turned my commute into a film. The engine noise got me more credit than any sentence did.", hoursAgo: 38 },
    { name: "Sofia", body: "Do the sounds bigger than feels natural. Mine were far too polite on the first take.", hoursAgo: 12 },
  ],
  "describe-vividly": [
    { name: "Julia", body: "Described my grandmother's kitchen and could smell it again halfway through. Did not expect that.", hoursAgo: 43 },
    { name: "Ravi", body: "Specific beats clever. “Like a wet coat” landed; “like a symphony” got nothing.", hoursAgo: 7 },
  ],
  "moment-from-your-day": [
    { name: "Lena", body: "One moment, not the day. I did my whole morning first and it was so boring I deleted it myself.", hoursAgo: 36 },
    { name: "Tomas", body: "Zoom all the way in. Mine was ninety seconds about a lift door and it was the best one I have done.", hoursAgo: 14 },
  ],
  "high-stakes-moment": [
    { name: "Amara", body: "Be it, do not report it. Coach told me my voice stayed perfectly calm while I described panicking.", hoursAgo: 40 },
    { name: "Elsa", body: "Stand up to record this one. I cannot explain why it changes everything but it does.", hoursAgo: 15 },
  ],
  "set-and-scene": [
    { name: "Ken", body: "Build the room before anybody walks into it. I always skipped straight to the action and never knew.", hoursAgo: 31 },
    { name: "Maya", body: "Thirty seconds of setting up the place bought me a much better story for the remaining ninety.", hoursAgo: 8 },
  ],
  "twist-third-person": [
    { name: "Marco", body: "Hold the reveal longer than is comfortable. My first take gave it away in the setup without me noticing.", hoursAgo: 34 },
    { name: "Ines", body: "Third person makes it strangely easier to be honest about yourself. Worth doing for that alone.", hoursAgo: 11 },
  ],
  foreshadowing: [
    { name: "Ravi", body: "Plant something small and boring. If the detail is interesting, everybody sees it coming.", hoursAgo: 37 },
    { name: "Julia", body: "I planted a set of keys in the first line. Coach spotted the payoff and it is the best note I have had.", hoursAgo: 6 },
  ],
  "three-emotions": [
    { name: "Sofia", body: "Three is harder than it sounds. Two is a story; three is a journey and you feel the difference.", hoursAgo: 29 },
    { name: "Jonas", body: "Do not announce the emotions. I said “and I was furious” and Coach pointed out my face was doing nothing.", hoursAgo: 9 },
  ],
  "someone-elses-story": [
    { name: "Omar", body: "Told my father's. Had to ring him for details I had somehow never asked for in thirty years.", hoursAgo: 42 },
    { name: "Priya", body: "Tell it as though they are going to watch it. That one thought changed my whole delivery.", hoursAgo: 16 },
  ],
  "multiple-characters": [
    { name: "Elsa", body: "Played all four and my dog was the audience. Give each one a posture, not just a voice.", hoursAgo: 32 },
    { name: "Leo", body: "Distinct matters more than accurate. Mine were broad and slightly silly and it worked.", hoursAgo: 10 },
  ],
  "story-youve-healed": [
    { name: "Omar", body: "Scary to record and completely worth it. Tell it from the far side of it, not from inside it.", hoursAgo: 45 },
    { name: "Amara", body: "If you are still in the middle of it, pick a different one. That is not dodging - it is what the brief asks.", hoursAgo: 21 },
    { name: "Ken", body: "Nobody sees this except Coach, and the video is deleted after. That is the only reason I could do it.", hoursAgo: 4 },
  ],
  "explain-with-analogies": [
    { name: "Ravi", body: "Explained compound interest with a snowball to an imaginary nine-year-old and finally understood it myself.", hoursAgo: 28 },
    { name: "Lena", body: "If the analogy needs explaining, it is not the analogy. I went through three before one held.", hoursAgo: 12 },
  ],
  "podcast-introduction": [
    { name: "Julia", body: "Made my guest sound like a legend and they had not even arrived yet. Really fun one.", hoursAgo: 26 },
    { name: "Danil", body: "Energy in the first two seconds. I opened flat and had to do the whole thing again.", hoursAgo: 7 },
  ],
  "thirty-second-pitch": [
    { name: "Tomas", body: "28 seconds, two under the limit. The cutting is the entire exercise.", hoursAgo: 24 },
    { name: "Maya", body: "Harder than the two-minute story, which surprised me. Far less room to hide.", hoursAgo: 13 },
    { name: "Sofia", body: "Say what it IS before you say why it matters. I had it the wrong way round for three takes.", hoursAgo: 5 },
  ],
  "mic-drop": [
    { name: "Marco", body: "Dropped the line and just stopped. The silence afterwards was loud and I have never felt better on camera.", hoursAgo: 23 },
    { name: "Ines", body: "Write the last line first and build backwards to it. Completely changed the story I ended up telling.", hoursAgo: 8 },
  ],
};
