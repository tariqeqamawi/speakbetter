// What a card actually says.
//
// The key takeaways (takeaways.ts) were written for the panel beside the
// video, where the lesson is playing two feet away and a reminder is
// enough. A card has to stand on its own - somebody holding it may not
// have watched the lesson this week, or at all - so it carries the shape
// a skill lesson actually has:
//
//     WHAT   what this thing is, in one line
//     HOW    how you use it
//     LIKE   what it sounds like out of his mouth
//
// TWO RULES, both learned the hard way:
//
// 1. THE EXAMPLES ARE HIS, WORD FOR WORD. Not "describe a sunset
//    vividly" - the actual line from the lesson: "this watercolor
//    painting of crimsons, oranges and pinks cast over the horizon."
//    Invented examples are the fastest way to make a card feel written
//    by a machine, and they teach a worse line than the one he already
//    gave. Every example below is lifted from that lesson's transcript
//    and trimmed, never paraphrased.
//
// 2. IT IS WRITTEN THE WAY HE TALKS. He says "you don't say it was like
//    this - that's a simile"; he doesn't say "avoid comparative
//    constructions employing 'like'." Contractions, second person, short
//    sentences, the odd fragment. Read it aloud; if it sounds like a
//    textbook, it's wrong.
//
// Lessons with no entry here fall back to their key takeaways, so the
// deck works today and improves a card at a time.

export interface CardContent {
  /** What it is. One line. */
  what: string;
  /** How you use it. One line. */
  how: string;
  /** His own lines, lifted from the lesson. */
  like: string[];
}

export const cardContent: Record<string, CardContent> = {
  // ── Metaphors: What They Are And How To Use Them ───────────────────
  "1081032528": {
    what: "You take one thing and compare it directly to something else. Not like it, not as if - it simply becomes the other thing.",
    how: "Say the comparison straight. The moment you reach for \"like\" or \"as if\" you've written a simile instead, and the image goes soft.",
    like: [
      "My legs turned into pistons and my blood turned into motor oil.",
      "He stayed under that glaring sun so long he turned into a lobster.",
      "My heart became lead in my chest and weighed me down from the inside.",
      "Those final words turned to ash in my mouth.",
    ],
  },

  // ── Hyperbole: What It Is & How To Use It ──────────────────────────
  "1081706536": {
    what: "Exaggeration, pushed far past true - usually for the laugh.",
    how: "Take the thing you're describing and overshoot it on purpose. Nobody's checking; they're getting the size of it, and the joke.",
    like: [
      "The waitress walked in with a stack of pancakes a mile high.",
      "I had to wade through the mountains of paperwork on my desk.",
      "That model's legs went on forever.",
    ],
  },

  // ── Acting Tip For Speakers: Don't Just Say It, Imagine It ─────────
  "1081162752": {
    what: "An actor's technique: if you can see the scene in your own mind, the audience sees it in your eyes.",
    how: "Before you describe something, look off and actually picture it. Then describe what you're seeing - not what you'd planned to say about it.",
    like: [
      "Flat: \"It was a beautiful sunset, oranges and yellows.\"",
      "Seen: \"This watercolor painting of crimsons, oranges and pinks cast over the horizon, the sun dipping below, everything turning red before day gradually turns to night.\"",
    ],
  },

  // ── Stories Make The World Go Round ───────────────────────────────
  "1081030429": {
    what: "Story is the format people are already tuned to - the news, the movies, the ads, the talks that land. It isn't decoration on a point, it's how a point travels.",
    how: "Before you argue a thing, find the scene that shows it. If your talk has no story in it, you're asking people to do work their brains would rather do for you.",
    like: [
      "It's 100,000 years ago. You're walking barefoot, you can feel the grass blades between your toes, and a campfire is lit in your village.",
      "An elder stands up and talks about which berries are safe and which ones are poisonous, and where the lion was last spotted.",
      "Miss the story and it's the difference between the safe berries and the poisonous ones.",
    ],
  },

  // ── Storytelling: Don't Tell it, Relive The Experience ─────────────
  "1081031042": {
    what: "We call it storytelling, but the best stories aren't told - they're relived in front of the room.",
    how: "Go back into the moment and take the audience with you. Feel the emotion again, let your body do what it did, and put in what you saw, heard and smelled.",
    like: [
      "There's a seat next to you on the roller coaster. You put the audience in it and say: we're going on a ride.",
      "I remember the rough texture on the couch.",
      "I was staring at the clock and the hands looked like they were going backwards - it was moving so slow. Stale coffee in the air, and chemical carpet cleaner.",
    ],
  },

  // ── Imagination: The Production Studio In Your Mind ────────────────
  "1081031146": {
    what: "Everybody still lives in their imagination. Engage it and they stop watching you and start seeing the thing.",
    how: "Feed the senses - how it sounded, smelled, tasted, felt - and their own production studio does the rest. Go back through the story you wrote and put the detail in.",
    like: [
      "You have your own casting department, your own special effects studio, your own director's chair, your own set and wardrobe.",
      "You open a good book, and suddenly you're on page 50 and three hours have gone by.",
      "They forget they're sitting and listening to you. They forget the time.",
    ],
  },

  // ── Life Scene NOT Life Story ──────────────────────────────────────
  "1081031433": {
    what: "A story in a talk is a scene, not a biography. One moment that carries the point.",
    how: "Pick the scene that holds the moral and start there. Age, dates and back story only earn their place if the point needs them.",
    like: [
      "Don't try and recount the last 15 or 20 years.",
      "It's okay to talk about yourself, as long as the value is for the listener.",
      "Tell the scene that has the moral or the message, not your whole life story.",
    ],
  },

  // ── Facts Tell, Stories Sell ───────────────────────────────────────
  "1081031495": {
    what: "Features and benefits are a list nobody remembers. The same information inside a story gets kept.",
    how: "Take the claim you were going to make and find the person it happened to - a client, or you. Put the proof inside the scene instead of beside it.",
    like: [
      "Instead of a bunch of features and benefits - which, hate to break it to you, nobody cares about - package the information inside a story.",
      "Tell the story of a client, or your own story of how you overcame it, quit the job, launched the business.",
      "Facts tell, stories sell.",
    ],
  },

  // ── Story Time: The Almost Snowboarder ─────────────────────────────
  "1081031584": {
    what: "One story told end to end, so you can see the shape whole before you take it apart. A man one phone call away from the national snowboard team.",
    how: "Watch the build: an ordinary opening, a decision, the weeks stacking up, then a turn nobody saw coming and a moral said slowly. Then go back and find the same shape in one of yours.",
    like: [
      "This guy in his corner office, in his power suit, calmly says: what's your idea of a crazy amount of money?",
      "Two weeks turn into four, four turn into six, six turn into eight, eight turn into 12.",
      "Doctors say he can never snowboard again. Your dreams need to be deeper than other people's pockets.",
    ],
  },

  // ── Story Time: The Almost Snowboarder - Debrief ───────────────────
  "1081031902": {
    what: "The same story taken apart: what was acted out, where the turn was planted, and why the last line lands.",
    how: "Build the excitement first so the turn has something to break. Set up, then punchline, then the moral - said slowly, with gravitas.",
    like: [
      "A story is like an accordion. You can tell it short and concise, or stretch it out - I can tell that same story in six minutes.",
      "I acted out the guy in the corner office fixing his tie. I acted out Colin's excitement - oh my God, man, I'm going to be on the snowboard scene.",
      "Then, doctors say he can never snowboard again, and it hits like a punch to the gut.",
    ],
  },

  // ── Your StoryBook: How to Find YOUR Stories ───────────────────────
  "1081289259": {
    what: "The place your stories come from: emotionally charged memories, written down as a list you can pull from.",
    how: "Hunt for the memories that still carry a charge, and write each one down as a movie title. A handful you can tell off the top of your head is a storybook.",
    like: [
      "The power of your story isn't in what happened. It's how you tell it.",
      "Phone Booth with Colin Farrell literally takes place in a phone booth. Not an exciting setting - really good storytelling.",
      "The first day of college, carrying that backpack of heavy books, walking the halls of an unfamiliar space.",
    ],
  },

  // ── How To Create Your Story Book - Step 1 ─────────────────────────
  "1081290890": {
    what: "Step one of the storybook: a title for each memory, and the bare sequence of what happened under it.",
    how: "Take three to five charged memories, give each one a movie title and its own page, then bullet the events - just the facts, no scene-setting, no feelings yet.",
    like: [
      "The car crash. Proposing to my beloved. The day I started college.",
      "I woke up in the morning. I got in the car. I arrived at the college. It was a giant castle. I walked into the first class.",
    ],
  },

  // ── How To Create Your Story Book - Step 2 ─────────────────────────
  "1081292518": {
    what: "Step two: the senses, added under the bullets you already have.",
    how: "Pick one story and go bullet by bullet - how it sounded, smelled, tasted, felt. Both kinds of feel: the surface under your hand, and what was going on inside you.",
    like: [
      "It was six in the morning, freezing cold because it was still dark outside, and my bones were chilling inside my body.",
      "It was a rough leather surface.",
      "I remember feeling empty that day. I remember feeling doubtful and worried.",
    ],
  },

  // ── Add The Moral or Message ───────────────────────────────────────
  "1081292414": {
    what: "The line between a story and information you happened to arrange in order: does it carry a moral?",
    how: "Ask what you learned by living it, and say that. A story with a moral carries value, and value shared over and over is how an audience comes to see you.",
    like: [
      "Does your story have a moral or a message? Otherwise, why tell it?",
      "What did you learn through having that experience?",
    ],
  },

  // ── Give The Setting Then Dive Into The Scene ──────────────────────
  "1081294121": {
    what: "Two beats at the top of a story: the setting, then the scene. Context, then content.",
    how: "Give them where and when and what state you were in - one or two lines - then drop straight into the moment. Skip it and the story plays against a green screen.",
    like: [
      "This was eight years ago. I was living in Bali, sitting outside a cafe, super broke, looking up at the sky.",
      "In a galaxy far, far away, the Imperium was on the rise - then it drops you into the scene.",
      "A bear ran away from the zoo and it's wandering the streets right now. Now we go to Rachel with the eyewitness account.",
    ],
  },

  // ── The Client In The Hero's Journey ───────────────────────────────
  "1081198327": {
    what: "The structure under most blockbusters, and the one casting mistake nearly everyone makes with it: you are the mentor, not the hero. The client is the hero.",
    how: "Stop pitching yourself as the one who conquered it. Stand a few steps ahead, tell them what you can see in them, and hand them the call to adventure.",
    like: [
      "Thomas Anderson meets Morpheus, goes through a death and a rebirth, and comes back as Neo.",
      "I'm Morpheus. I'm a few steps ahead of you. I know that you are the chosen one.",
      "Come with me and let me show you how deep the rabbit hole goes.",
    ],
  },

  // ── Link Your Call To Action To The Moral Of The Story ─────────────
  "1081198162": {
    what: "A call to action that grows out of the story you just told, instead of being bolted onto the end of it.",
    how: "Take the moral and make the ask out of the same words. A line people actually want to type beats an instruction that means nothing to anyone.",
    like: [
      "Drop the number three below - that means nothing to no one.",
      "It's won me six-figure contracts, sold out stages, festivals around the world. It has changed my life. I'd love for it to do the same for you.",
      "Just drop the words - change my life - below.",
    ],
  },

  // ── Visual, Aural & Kinaesthetic Speaking ──────────────────────────
  "1080679081": {
    what: "Three ways people take you in: how it looks, how it sounds, how it feels inside. Every audience holds all three at once.",
    how: "Move between them on purpose. Soft moments for the ones who go by feel, melody in the voice for the ones listening to your tone, big gestures for the ones watching. Change between the three and you cover the room.",
    like: [
      "The kinaesthetic people are waiting to see how you make them feel.",
      "The aural people are listening for changes and modulations in your tone of voice.",
      "The visual people like to see the big gestures, the grand expression.",
    ],
  },

  // ── Using Cultural Reference To Shorten Descriptions ───────────────
  "1081032404": {
    what: "A shortcut for describing a person or a thing: name two things everyone already knows and let the audience do the drawing.",
    how: "When a description is about to run long, swap it for a reference. It lands in a second, it's usually funnier, and you get to move on with the story.",
    like: [
      "He looked like a cross between Bob Marley and Gandalf the Grey.",
      "What's Monkey Man like? It's John Wick meets Slumdog Millionaire.",
      "Long sleeves, long dreadlocks, old shoes - that's going to take too much time.",
    ],
  },

  // ── Similes: Examples & Explanation ────────────────────────────────
  "1081032662": {
    what: "The metaphor's cousin. The comparison stays a comparison - it was like, it was as if.",
    how: "Use it when you want the image without claiming the thing has actually become something else. The two words that make a metaphor go soft are the two that make this work.",
    like: [
      "The man stalked the bar late at night as if he was a jungle cat looking for his prey.",
      "The trees grew out of the ground in winter and looked like bony witch's hands clawing their way to the heavens.",
      "My heart was thumping in my chest, as if it was a caged animal trying to burst free.",
    ],
  },

  // ── Anthropomorphism: Examples & Uses ──────────────────────────────
  "1081032763": {
    what: "Giving a person animal attributes, so the audience sees the animal without you ever naming it.",
    how: "Pick the animal in your head, then hand over its verbs instead of its name - prowled, slithered, barked, pecked. Naming it works too, but the attributes alone are the sophisticated version.",
    like: [
      "He walked in with his dapper suit and a hunter's look in his eyes, and prowled the bar for his next victim to pounce on.",
      "In slithers this guy, and he starts hissing these words at us.",
      "My boss barked at me, growling all these words.",
    ],
  },

  // ── Personification: Examples & Uses ───────────────────────────────
  "1081032892": {
    what: "The other direction: an object gets human qualities, and suddenly the audience feels something toward it.",
    how: "Describe the thing the way you'd describe a person - what it did, how it behaved toward you. Weather, furniture and the sky all take it well.",
    like: [
      "I was on the deck chair under the big blue sky and the sun lightly kissed my cheeks.",
      "I walked out into the starry night and watched all the constellations wink at me.",
      "The wardrobe stood there, proud and sturdy. The moon smiled at me as the clouds moved across it.",
    ],
  },

  // ── Onomatopoeia: Examples & Uses ──────────────────────────────────
  "1081707157": {
    what: "A word that makes the sound it describes. The audience hears the scene instead of being told about it.",
    how: "Wherever something in your story made a noise, use the noise as the word. It costs a syllable and buys color and energy.",
    like: [
      "The door creaked open. I was splish-splashing my way through the puddles.",
      "The flag flittered and fluttered in the wind. The fly was buzzing around my ears.",
      "I remember the drip, drip, drip of the tap. The plate crashed to the floor.",
    ],
  },

  // ── Analogies Masterclass ──────────────────────────────────────────
  "1081707642": {
    what: "A simile with the scene built out. Where a simile makes the comparison, an analogy walks around inside it - which is why it can teach an abstract idea in one go.",
    how: "Find the everyday thing your concept behaves like, then describe that thing in enough detail to picture. Two more sentences is the whole difference between a simile and an analogy.",
    like: [
      "Learning a skill is like driving your car through the snow. The first time there's no path - you have to chug and push the car through. But once you've made that groove, the car knows the path.",
      "Building a business is like climbing a mountain. You might be focused on the summit, but what you actually have to focus on is what you do next, and next, and next.",
    ],
  },

  // ── Alliteration ───────────────────────────────────────────────────
  "1080654991": {
    what: "The same sound starting words that sit near each other. It's why a phrase sounds finished rather than assembled.",
    how: "Two words, three at the most. Overdo it and people hear the trick; keep it to two and they only notice that it sounded good.",
    like: [
      "Polish and panache.",
      "Calm, confident, capable.",
      "I'm going to teach you how to become confident and capable, on stage or on screen.",
    ],
  },

  // ── Using Rhyme ────────────────────────────────────────────────────
  "1081164442": {
    what: "A rhyme at the end of a point turns it into something people can carry out of the room - a quote, a caption, a sound bite.",
    how: "Take the one line you most want remembered and make it rhyme. Then say it twice; the repeat is what sets it.",
    like: [
      "What vibrates through you migrates to you.",
      "The words you use become the reality you choose.",
      "I love using rhyme some of the time.",
    ],
  },

  // ── Don't Just Speak It, Act Out The Scene ─────────────────────────
  "1081162875": {
    what: "Speaking is theatre acting, not cinema acting. On camera an eye does the work; in a room, nobody sees the eye.",
    how: "Play it bigger than feels natural. Do the reach, the flinch, the shiver. Most people play it far too safe, and safe reads as nothing at all.",
    like: [
      "My friend was slipping. I reached my hand down, used all my strength, reached out again, and pulled him to safety.",
      "You walk out into minus 20 and freezing cold - act it, and they're out there with you.",
      "I was driving down the road, checking the mirrors, and all of a sudden - crash.",
    ],
  },

  // ── Narrate The Scene To Zoom Into Moments ─────────────────────────
  "1081163248": {
    what: "Saying what you're doing while you do it. It looks redundant on paper - it's what a sports commentator does - and it's how you slow a moment down.",
    how: "Find the beat the whole story turns on and narrate it action by action, with what you felt as you went. Everything else can stay at normal speed.",
    like: [
      "And now we see Ronaldo, and Ronaldo passes it to Carlos, and Carlos kicks it.",
      "I took the cup, felt the warmth against my palm, looked out the window, brought it to my lips, took a sip and felt it trickle down my throat. And in that moment I decided I was leaving.",
      "I opened the door handle, and I saw broken glass on the floor and blood stains, and I slowly went in.",
    ],
  },

  // ── How To Convey Multiple Characters ──────────────────────────────
  "1081163466": {
    what: "Playing the people in your story instead of reporting what they said. Voices, accents, and a different way of standing for each one.",
    how: "Give each character their own body - one turned this way, one that way - and switch between them cleanly so nobody has to be told who's talking. Practise this one in front of a mirror first.",
    like: [
      "The bouncer: alright mate, you're not coming in dressed like that. And the other guy: but what's wrong with what I'm wearing?",
      "My boss, in his Scottish accent: Tarek, what do you think you're doing? You've been cold and sick for two days.",
      "Man, I've got to tell you - I've been thinking. I quit.",
    ],
  },

  // ── Simulate Sounds & Embody Emotions ──────────────────────────────
  "1081163657": {
    what: "Being your own sound department, and letting the feeling show in your body. Mirror neurons do the rest - the audience feels what you're expressing.",
    how: "Make the noise instead of naming it, and hold the emotion in your body while you describe it. Don't tell them it howled; howl.",
    like: [
      "The door creaks - so creak.",
      "Rather than the wind was howling: the wind was howling all around.",
      "My head started to pound - it was as if somebody was playing a drum kit inside my skull.",
    ],
  },

  // ── Using Props To Anchor Your Talk ────────────────────────────────
  "1081163798": {
    what: "Something in your hand pulls every eye to it, and gives you a place to come back to when you lose your thread.",
    how: "Use the real object where the story has one - not a stand-in. Hold it while you tell its part, and put it down when you're done with it.",
    like: [
      "If you're telling a story about a red ball and you actually have that red ball, the ball means something to them.",
      "This mug has the Speak Better logo on it, and there's a story that goes with it - I thought of a lion, because a lion roars.",
      "The lion is in all those colors because you're roaring your truth in your true colors.",
    ],
  },

  // ── Voice: Conversational vs Commanding ────────────────────────────
  "1080443133": {
    what: "Two settings for the same voice. Conversation runs fast and sits high; authority comes from dropping the sound into your diaphragm.",
    how: "Notice where your voice wants to sit, then put it lower on purpose. Project from low down - calmly. Projecting is not shouting.",
    like: [
      "People speak faster in conversation than in a talk - so to sound natural on camera, learn to speak quickly too.",
      "Drop your voice into your stomach and speak from low in here.",
      "It has more resonance, more body. It feels warmer, rounder, richer.",
    ],
  },

  // ── Warming Up The Voice ───────────────────────────────────────────
  "1080612884": {
    what: "The voice is an instrument, and instruments get tuned before they're played.",
    how: "Drop as low as your voice goes, then slide slowly up to as high as it goes, and back down. It sounds silly. Do it anyway, before you speak.",
    like: [
      "Just like tuning a guitar or a piano, your voice also needs warming up.",
      "I know it might sound silly, but go with it for a moment - this is going to warm up your vocal cords.",
    ],
  },

  // ── Making Your Message a Melody ───────────────────────────────────
  "1080675446": {
    what: "Music isn't every note at the same volume and pace. Neither is a talk worth listening to.",
    how: "Speed up to carry excitement, then slow right down to land a point. The change between the two is the melody - not the speed itself.",
    like: [
      "You don't have all the notes jumbled together at the same volume. You have moments of pause, moments of rest, then a flurry of notes.",
      "Scandinavians sound different from Italians - people have a natural melody. You can enhance yours by bringing awareness to it.",
      "Do you go high and nasal, up in your head, or drop into the diaphragm and speak with gravity?",
    ],
  },

  // ── Vocal Delivery: Make Your Message a Melody ─────────────────────
  "1081285460": {
    what: "The controls you're actually working when the voice sounds musical: pace, pitch, volume, tone, register, inflection.",
    how: "Take them one at a time and move each one on purpose. Inflection up is a question, down is a statement; volume from a whisper to big and bold; pace from a flurry to a full stop.",
    like: [
      "Pace is how fast you're talking. Pitch is low in the diaphragm or high up in the head. Register is where you're sitting.",
      "Am I whispering like this? Or am I talking big and bold and loud?",
      "Rule of thumb: to make a point, slow right down and make it.",
    ],
  },

  // ── Powerful Pause vs Awkward Silence ──────────────────────────────
  "1081162033": {
    what: "A pause is only awkward if your face says it is. Held on purpose, it's the strongest punctuation you have.",
    how: "Say the line, slow down, stop, and look at people while it lands. If you genuinely lose your place, keep your eyes where they are and breathe - nobody can tell the difference.",
    like: [
      "Every second you pause is magnified by the number of people in the room. One second in front of a thousand feels much longer than one second in front of ten.",
      "It gets awkward when you start shifting your eyes, looking like you forgot what you were going to say.",
      "Take four or five seconds if you need them. They'll think you meant to do it.",
    ],
  },

  // ── Using Tongue Twisters To Improve Speech ────────────────────────
  "1081200064": {
    what: "Deliberately hard words, practised beforehand, so ordinary words come out clean under pressure.",
    how: "Run a few before you speak, slowly first, then faster. Give your mouth the difficult version and the real one gets easy.",
    like: [
      "Red leather, yellow leather. Short, and difficult to say.",
      "Sally sells seashells by the seashore, but the seashells she sells aren't seashells, I'm sure.",
      "It's kind of like an ace up my sleeve - practise your tongue twisters and you won't get tongue tied.",
    ],
  },

  // ── What Are Filler Words And How To Remove Them ───────────────────
  "1080629747": {
    what: "The sounds your mouth makes while your brain catches up - like, you know, so. It's the fastest tell between a beginner and someone experienced.",
    how: "When you're thinking of what comes next, close your lips and hold eye contact. Open them again when you have the words.",
    like: [
      "Hey, like, you know, so, welcome to, like, my course on speaking.",
      "It's like a computer loading screen - if you do that with your mouth, out come the words.",
      "It's not an awkward silence if you maintain eye contact.",
    ],
  },

  // ── Inform, Inspire, Invite, Empower, Entertain, Educate ───────────
  "1080624037": {
    what: "Six reasons worth opening your mouth for - the three I's and the three E's - and a decision not to use speech to bash, blame or argue.",
    how: "Before you post or step up, check which of the six you're doing. If it isn't one of them, it isn't worth the platform.",
    like: [
      "The three I's: speak to inspire, to inform, or to invite.",
      "The three E's: speak to empower, to entertain, or to educate.",
      "With great power comes great responsibility.",
    ],
  },

  // ── Say Things in Triplets ─────────────────────────────────────────
  "1080648113": {
    what: "One idea said three ways. Three is the number that sounds finished, and reaching for the second and third word stretches your vocabulary on the spot.",
    how: "Say the plain word, then push for two more that circle the same thing. Works on verbs, adjectives and the adverbs that modify them.",
    like: [
      "I was walking. I was sauntering. I was ambling forward.",
      "I was feeling so sad. I was feeling low. I was feeling down.",
      "I was running slowly, calmly, casually.",
    ],
  },

  // ── Repetition and Emphasis ────────────────────────────────────────
  "1080660643": {
    what: "The same sentence three times, with the stress on a different word each time. Same words, three different meanings.",
    how: "Pick the line you most want kept, then move the emphasis through it. A gesture on the key word - a hand on the heart - locks it in.",
    like: [
      "I think it's important that you follow your heart. I think it's important you follow your heart. I think it's important you follow your heart.",
      "Use words intentionally, to create emphasis, to create emphasis, to create emphasis.",
    ],
  },

  // ── Repetition for Emphasis - Expanded ─────────────────────────────
  "1080677865": {
    what: "The bigger version: when a line is genuinely well made, say it, let it land, and say it again whole.",
    how: "Deliver it, pause into the silence, then repeat it - and repeat the sharpest half once more. Repeating a good line takes nothing away from the talk; it adds.",
    like: [
      "If we want to change the world, we need more than just change in our pockets.",
      "If we want to change the world, we need more than just change in our pockets. We need more than just change in our pockets.",
    ],
  },

  // ── Rhetorical Questions ───────────────────────────────────────────
  "1080662335": {
    what: "A question you answer yourself, so a one-way broadcast starts to feel like a conversation.",
    how: "Ask it, leave the beat where the answer would go, then carry on as though they'd said it. Best on lives and to camera, where nobody can actually reply.",
    like: [
      "So are you enjoying this so far? It's pretty good, right? Yeah, thought so.",
      "Are you liking that the lessons are short, that it doesn't take you much time? That's exactly why I made it.",
      "It feels like we're all in the living room, speaking as a group of friends.",
    ],
  },

  // ── Using Promise & Payoff ─────────────────────────────────────────
  "1081163913": {
    what: "Foreshadowing and fulfilment. Plant something early, pick it up late, and the audience gets the satisfaction of having seen it coming.",
    how: "Find the object or phrase your ending turns on and put it in the opening, casually, as if it were just detail. Then bring it back when it matters.",
    like: [
      "She mimed sharpening the knife, then chopped, and kept drifting her hand closer while she talked about staring out the window. We could all see it coming.",
      "After work I'd pick up my Xbox and play Assassin's Creed, and Altair would stand on top of a mosque and swan dive off - they called it a leap of faith.",
      "And there I was on a roof in Liverpool, and I knew this was my moment to take a leap of faith.",
    ],
  },

  // ── Open Loops ─────────────────────────────────────────────────────
  "1081197526": {
    what: "A question asked at the start and answered at the end. People are curious by nature, and an unclosed loop is uncomfortable to walk away from.",
    how: "Open with something they want the answer to, say you'll get to it, then put the offer or the real content in the middle. Close the loop at the end - always close it.",
    like: [
      "Does a saltwater crocodile have enough force in its jaws to crush a human skull? Stick around to the end and I'll tell you.",
      "Stick around to the end and I have a free gift, only for those who watch to the end.",
      "So - since you stuck around to the end - the answer is yes. Stay away from saltwater crocodiles.",
    ],
  },

  // ── Balances & Reversals ───────────────────────────────────────────
  "1081197216": {
    what: "Two shapes that sound like wisdom. A balance is a statement in two halves that completes itself; a reversal is a balance with the words turned around.",
    how: "Write the point flat, then split it into two halves that answer each other. To make it a reversal, use the same words in the other order in the second half.",
    like: [
      "What got you here won't get you there.",
      "First you make your beliefs, then your beliefs make you.",
      "If you want things in your life to change, you have to change things in your life.",
    ],
  },

  // ── Using A Pattern Interrupt ──────────────────────────────────────
  "1081197062": {
    what: "Something at the top that breaks the state people arrived in - the scroll, the polite waiting, the arms folded.",
    how: "Make it specific to this room and let them participate. The shouting kind of interrupt works and costs you the room; the relevant kind buys rapport in seconds.",
    like: [
      "I only know one phrase in Swedish. Do you want to hear it? Do you want to hear it?",
      "Ju roligare jag har, desto mer pengar far jag - the more fun I have, the more money I make.",
      "If you're not Swedish, ask the person next to you what that meant.",
    ],
  },

  // ── How To Structure Longer Talks ──────────────────────────────────
  "1081198709": {
    what: "How a 20-minute talk is actually held together: a known opener, a known ending, and story-point-story-point in between.",
    how: "Memorise the opening and the close only. Fill the middle by alternating a story with the point it proves - either order - using stories you've already practised.",
    like: [
      "Memorising a 20-minute talk is really difficult, if you've ever tried it.",
      "Story, then point. Or point, then the story that proves it.",
      "It feels fluid and organic, and still comes across polished and prepared.",
    ],
  },

  // ── How To Open Your Talk ──────────────────────────────────────────
  "1081198798": {
    what: "The strongest opening is a question that makes the room think - not your name and your credentials.",
    how: "Open with something they have to answer for themselves, and have them answer it to the person next to them. The attention moves off you and onto what you're saying.",
    like: [
      "Don't walk up and introduce yourself - hate to break it to you, nobody cares.",
      "Can you remember the last time you actually chased your dreams?",
      "Turn to the person next to you and ask them when they last actively pursued theirs. Take a moment, do it now.",
    ],
  },

  // ── Framework: Tell, Teach, Action ─────────────────────────────────
  "1081198886": {
    what: "The shape of a lesson people act on: tell them what they're about to learn, teach it, then ask for something back.",
    how: "Name the thing in the first line. Teach it. Then close with a specific action small enough to do today - not 'think about this'.",
    like: [
      "In this lesson we're going to learn the three types of listener in your audience.",
      "Now take action: use the kinaesthetic, the aural and the visual, record a short message and upload it to the group.",
    ],
  },

  // ── Framework: Hook, Story, Close ──────────────────────────────────
  "1081198957": {
    what: "The shape for an ad or an offer: three to five seconds of hook, the story in the body, and a close that invites.",
    how: "Make the hook specific to your market - the wrong people tuning out is the point. Then tell the story, then ask for the one action.",
    like: [
      "The five things that transformed my public speaking from cowardly to confident.",
      "The one big secret that nobody knows that changes how you present and deliver.",
      "If you're interested in electronics you'll tune out - and that's fine. You want the right audience.",
    ],
  },

  // ── Speak As If To a Room of 9 Year Olds ───────────────────────────
  "1080635988": {
    what: "The dial everyone leaves too low. A teacher telling a story to nine-year-olds is animated, large-eyed and using their whole body - and adults watch that too.",
    how: "Turn it up further than feels right. You have far more room before it goes hammy than you think.",
    like: [
      "They're larger than life. They use their body, they use their hands, their eyes go large.",
      "Everybody's so timid and shy - you can dial it up way more than you think.",
      "Use your body. Learn to move. Dance with it.",
    ],
  },

  // ── Why You Have a Fear of Public Speaking ─────────────────────────
  "1081029629": {
    what: "The fear isn't a personality trait. It was installed - usually early, usually by a room that laughed or an adult who told you to be quiet.",
    how: "Take a notebook and trace it back. Find the first memory of your voice being unsafe, and name who was in it. You can't undo conditioning you haven't looked at.",
    like: [
      "You're daydreaming, drawing a dragon, and the teacher says: what's the answer on the board? You blurt out the wrong one, and everybody laughs.",
      "Use your indoor voice. Little girls should be seen and not heard.",
      "School isn't teaching you to be expressive. It's teaching you to be right or wrong - and speaking is expression.",
    ],
  },

  // ── You Are One Talk Away From Changing Your Life ──────────────────
  "1081029780": {
    what: "The reason any of this is worth the practice: one well-made talk, delivered to the right room, changes the shape of a life.",
    how: "Build the skills so the polish is there whether or not you had time to prepare. That's the standard - speak as if it were a rehearsed talk, from the moment you stand up.",
    like: [
      "Brene Brown's talk on vulnerability - nobody knew who she was before it.",
      "It takes one well-crafted presentation to get the seed funding, launch the company, impress the boardroom.",
      "The boardroom or the bedroom, professional or personal - you're one talk away.",
    ],
  },

  // ── Imagine Your Heart Is The One Speaking ─────────────────────────
  "1081029881": {
    what: "A way of aiming your voice: the words are made in your heart, and the mouth is only the speaker cone broadcasting them.",
    how: "Before you begin, connect the two on purpose - heart to throat - and feel the words as you say them rather than watching yourself say them.",
    like: [
      "This is where the sound is coming from. This is just broadcasting it out into the world.",
      "When people say speak from the heart - imagine you actually are.",
      "If you feel it when you speak it, people will feel it when they hear it.",
    ],
  },

  // ── Become The Voice of Your Values & Messenger Of Your Mission ────
  "1081030261": {
    what: "The reason to be the one at the front: anything you won't say yourself, you're asking somebody else to say for you.",
    how: "Stop outsourcing it. Name what you stand for, then build the speech to carry it - authority in a niche goes to the person willing to be its voice.",
    like: [
      "Why are we relying on someone else to be the mouthpiece for what we stand for? Why are we outsourcing our leadership?",
      "Learn to become a capable orator, narrator, raconteur, storyteller.",
      "Who better to stand up for your values than you?",
    ],
  },

  // ── You Were a Born Public Speaker ─────────────────────────────────
  "1081197407": {
    what: "Nobody is born afraid to speak. You were born using your voice at full volume with no interest in how it landed.",
    how: "Treat the work as unlearning rather than learning. You're not acquiring a talent you lack - you're getting back something that was trained out of you.",
    like: [
      "A baby crying for milk - does that baby give a damn who's listening?",
      "You had to use your voice powerfully, sometimes abrasively, to get your needs met.",
      "You were born to speak. You were conditioned out of it.",
    ],
  },

  // ── How To Overcome Your Fear Of Speaking: Soften ──────────────────
  "1094881996": {
    what: "Nerves are a body doing threat response. The way out is through the body's own cues - the breath and the eyes.",
    how: "Deep breaths in through the nose and out slowly. Soften your gaze instead of staring. Let the tension out of your shoulders. Soft eyes tell your brain there's no predator.",
    like: [
      "Out on the plains of Africa, facing a wild animal, are you taking nice deep breaths? You're panting.",
      "If there was harm or danger nearby, our eyes naturally open wide.",
      "Soften your gaze, soften your breathing, release the tension, and the fear starts to go.",
    ],
  },

  // ── As The Speaker You Have ALL The Power! ─────────────────────────
  "1081162517": {
    what: "From the stage an audience looks like one massed army. From a seat in that audience, everyone is alone in their own chair.",
    how: "Remember they tuned into you - they're on your channel, not you on theirs. You only lose that by handing it over: darting eyes, shifting feet, apologising for being new.",
    like: [
      "Have you ever been in an audience? Do you feel like one big mob, or like it's just you sitting in your chair?",
      "They're tuning into you. You're not tuning into them.",
      "Sorry, this is my first time, I'm not really used to going live - that's you giving away your power.",
    ],
  },

  // ── You Are Delivering An Experience, Not A Talk ───────────────────
  "1081162691": {
    what: "A change in what you think you're doing. Not a talk to be listened to - an experience to be gone through. He calls it experiential listening.",
    how: "Ask what the audience will have lived through by the end, not what they'll have been told. Then use the story and body techniques to build that.",
    like: [
      "You don't want them to simply listen to a talk. You want them to go on an adventure.",
      "You want them to join you on a journey.",
    ],
  },

  // ── NLP & Autosuggestion ───────────────────────────────────────────
  "1081199069": {
    what: "Seeding one word through a story so that by the time you ask for it, the audience is already holding it.",
    how: "Pick the single word your offer turns on. Land it naturally three or four times as the story goes, then make it the thing you ask them to type.",
    like: [
      "It was years ago and I really lacked confidence.",
      "The thing my clients tell me most is that they want more confidence.",
      "If you're looking to increase your confidence, drop the word confidence below.",
    ],
  },

  // ── Building A Thank Account ───────────────────────────────────────
  "1081199902": {
    what: "A thank account, not a bank account: how many times people have said thank you for something you gave them.",
    how: "Make deposits of value long before you ask for anything. When the offer finally comes, it's a withdrawal against a balance you built.",
    like: [
      "You walk up to an ATM you've never put money into, put your card in, and wonder why nothing comes out.",
      "If you deliver a lot of value, people perceive you as valuable.",
      "They buy into you before they buy from you.",
    ],
  },

  // ── Being Professional vs Being Serious ────────────────────────────
  "1082732774": {
    what: "Two things people confuse. Serious is a manner. Professional is whether you actually delivered what you came to deliver.",
    how: "Let the quirks and the idiosyncrasies through - let your face emote, your hands express, your body move. Being a real person is not a lapse in professionalism.",
    like: [
      "People think being a professional speaker means being all serious and news-anchor-like. That's not what makes people trust you.",
      "Not a cardboard cutout, not a movie poster or a billboard.",
      "Professionalism means: can you teach what you set out to teach?",
    ],
  },

  // ── Make It About Your Audience ────────────────────────────────────
  "1081162172": {
    what: "Taking yourself out of it. The bio, the background, the credentials - the MC already did that, and it was never the reason they're listening.",
    how: "Get on with the presentation. If shyness is stopping you, remember the attention isn't on you, it's on what you're carrying - be in service of the message.",
    like: [
      "It's not about you being a speaker. It's about having something worth saying.",
      "Somebody has already given you that layup onto the stage.",
      "Deliver the message, and people will remember you as its messenger.",
    ],
  },

  // ── Hand Gestures: Express Visually What You Say Verbally ──────────
  "1080653314": {
    what: "The answer to what do I do with my hands: they show what your mouth is saying, so people take it in through the eyes as well as the ears.",
    how: "Whatever you name, build it in the air - the size of it, the shape of it, where it sits. If there's a table in the sentence, make the table.",
    like: [
      "We must all come together, holistically.",
      "The ground was completely flat. The waves were crashing and undulating, big and small.",
      "If you're talking about drinking from a cup, hold an imaginary cup.",
    ],
  },

  // ── Hand Gestures Pro Tip ──────────────────────────────────────────
  "1081161934": {
    what: "What the hands do between the gestures. At your sides they go dead; lifted and loose, they ride the energy of what you're saying.",
    how: "Bring them up a little and let the wave move through. Tension is what stops it - and tense hands are how an audience reads nerves. Get out of their way.",
    like: [
      "It's much more natural to lift your arms a little and let the wave of energy move through them.",
      "You could put your eggs in one basket, or the other - and let your hands emote.",
      "Don't think about it too much. Your hands will do their own thing.",
    ],
  },

  // ── Opening Your Posture ───────────────────────────────────────────
  "1081137961": {
    what: "A thirty-second reset that puts the shoulders back where they belong before you speak.",
    how: "Raise your arms overhead, then take them out to the sides. Chin up and forward, spine straight. Do it before you go live or step out, then loosen up to actually talk.",
    like: [
      "Your shoulders naturally sit a little further back.",
      "A lot of people feel hunched or contracted - open up first.",
      "Change the posture and you let a lot more energy flow through you.",
    ],
  },

  // ── How To Move On Stage ───────────────────────────────────────────
  "1081162384": {
    what: "Movement with purpose instead of pacing. Pace, stop, share - then move somewhere else and do it again.",
    how: "Walk to one part of the stage, find one person's eyes, and make a few points there. Then change position and find someone else. Constant pacing reads as nerves; one fixed spot reads as fear.",
    like: [
      "Look one person directly in the eye, and everyone feels engaged. It's a crazy phenomenon, but it works.",
      "Pace, stop, share. Pace, stop, share.",
      "The whole platform is yours. Take up space.",
    ],
  },

  // ── Your Speaking Tools: Body, Voice, Words ────────────────────────
  "1080435328": {
    what: "Everything you have to work with, in three piles: your body, your voice, your words.",
    how: "When something isn't landing, ask which of the three is idle. Most people are running one and wondering why it feels flat.",
    like: [
      "A carpenter needs a saw, a screwdriver, a hammer and nails.",
      "Your body - how you move. Your voice - speed, texture, volume, pace, pitch. Your words - metaphor, analogy, figurative language.",
    ],
  },

  // ── How To Receive A Standing Ovation ──────────────────────────────
  "1081161473": {
    what: "A room stands up for what it felt, not for what it learned. The ovation is a response to emotional range.",
    how: "Build the talk as a journey with real lows in it - the grief, the thing that nearly finished you - before the triumph. A flat emotional line gets polite applause.",
    like: [
      "Take people into the depths of your pain, and then your triumph and elation, and the time you overcame something seemingly insurmountable.",
      "It's not about what you say. It's about how you say it and how you make people feel while you say it.",
      "Give enough range of emotion and you will get a standing ovation.",
    ],
  },

  // ── How To Use Slides Like A Pro ───────────────────────────────────
  "1081161658": {
    what: "Slides as checkpoints, not as the talk. Every time you turn to read one, you drop the room.",
    how: "Keep only the stations, not the stops in between. Talk freely until you've said everything that slide is for - then click.",
    like: [
      "Think of them like stations on a train ride. You only want the checkpoints.",
      "Improvise like a jazz musician - go off the dome, on the spot.",
      "Then you can put your attention on the people who came to see you, rather than on the information.",
    ],
  },

  // ── How To Build Mic Drop Moments ──────────────────────────────────
  "1081161815": {
    what: "The line that ends a story and lands like a punchline - because the story was the setup for it.",
    how: "Tell the story so it builds the feeling, then deliver its moral in a phrase shaped like a quote. Poetic, short, and said last.",
    like: [
      "The best punchlines are the ones with a long setup.",
      "Quotes are just things people say that sound nice - poetic to the ear.",
      "Your dreams need to be deeper than other people's pockets. After that story - boom.",
    ],
  },

  // ── Going Live On Socials ──────────────────────────────────────────
  "1081162283": {
    what: "What turns a live from a monologue into a room: using the names of the people who actually turned up.",
    how: "Greet them as they come in, and put real questions to them by name instead of rhetorical ones. Keep your eyes on the lens - that's where the eye contact happens.",
    like: [
      "Hey Rachel, hey David, how's it going? Yep, hi Lee, hi Taylor.",
      "I really liked that last Denis Villeneuve movie - what did you think, David? Have you seen Dune?",
      "It makes your live feel like a dialogue rather than a monologue.",
    ],
  },

  // ── Don't Sell - Invite & Recommend ────────────────────────────────
  "1081164747": {
    what: "People love to buy and hate being sold to. So do the two things that aren't selling: invite, or recommend something you actually love.",
    how: "Say it the way you'd invite someone to your birthday, or the way you'd tell a friend about a film you just saw. Neither one lists features.",
    like: [
      "Somebody comes up the second you walk in - can I help you with anything? - and you pull away, even though you came in to buy.",
      "I'm throwing an epic party, I've got DJs flying in from Berlin, I've curated the crowd - it's totally your vibe, and I'd love to see you.",
      "The grandma was in the kitchen making the pasta fresh and the smell was wafting over. You should totally try it.",
    ],
  },

  // ── How To Memorize Your Talks ─────────────────────────────────────
  "1081198604": {
    what: "Not memorising the words - keeping a small set of landmarks in sight so you stay on time and on point.",
    how: "To camera, stick a few post-its just outside the frame with the areas you want to cover. On stage, let the slide title be the prompt. Lose your place, look, say the next one.",
    like: [
      "Bullet points of the key areas you want to touch on in your live.",
      "Don't write everything out on the slide. Let the slide jog your memory.",
      "That's how you stop drifting and wafting off in different directions.",
    ],
  },

  // ── Memorized Inserts ──────────────────────────────────────────────
  "1081165164": {
    what: "A quote or a passage you know cold, dropped into the middle of something improvised. The prepared moment makes the free-flowing part around it sound prepared too.",
    how: "Learn two or three - a quote you like, a definition you've worked out - and know exactly how you'll deliver each one. Improvise everything else.",
    like: [
      "Barbara Marciniak says your beliefs are your agreements with reality.",
      "Coincidence is not the same as luck. Here's an incident across space and time, here's another - and the point where they overlap is the coincidence.",
      "All the other stuff is totally improvised. That moment, I've practised.",
    ],
  },

  // ── Staying Succinct: Pro Tip ──────────────────────────────────────
  "1081200223": {
    what: "A practice for anyone who talks too much: the one-minute voice note.",
    how: "Next time you'd text somebody, send exactly one minute of voice instead. Think first. Any fumble, any filler word, delete it and start again.",
    like: [
      "A scalpel instead of a sledgehammer.",
      "The lessons in this course run a minute or two, because I'm focusing like a laser on only what you need - trimming away the fat.",
      "A four-hour workshop is easier than a 14-minute talk. The shorter the timeframe, the harder it is.",
    ],
  },

  // ── How To Speak Naturally To a Phone or Camera ────────────────────
  "1081032074": {
    what: "You're not speaking to the camera. You're speaking through it, to one person on the other side.",
    how: "Find exactly where the lens is on your phone and look at that. Then picture a particular person - one who likes what you make - and talk to them.",
    like: [
      "You're chopping vegetables, someone passes the window and you wave. Are you waving at the window, or through it?",
      "Looking at you like this, or looking at you like this - can you feel it break?",
      "If you're worried about the trolls, speak to somebody you know loves your content, and let the phone be the thing in between.",
    ],
  },

  // ── Keep The Light Source In Front ─────────────────────────────────
  "1081032253": {
    what: "The one technical thing worth knowing before you go live: where the light is.",
    how: "Face the light, whatever it is - a window, a lamp, the sun. Keep any strong source out from behind you.",
    like: [
      "Don't face away from the sun unless you want the witness protection look.",
      "Make sure the source of light is in front of you. That's it.",
    ],
  },
};

/** The richer content for a lesson, if it's been written yet. */
export function contentFor(vimeoId: string): CardContent | undefined {
  return cardContent[vimeoId];
}
