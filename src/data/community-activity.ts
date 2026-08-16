// Sample community activity for the prototype. The real community layer
// arrives in Phase 6; until then these seed the ambient pop-ups on the
// journey map so the road feels walked. First names only, short posts -
// the map shows just the opening words.

export interface CommunityPost {
  name: string;
  text: string;
}

export const communityPosts: CommunityPost[] = [
  { name: "Maya", text: "Third take on the tongue twisters and I finally kept up" },
  { name: "Jonas", text: "My baseline video is so awkward and I love it" },
  { name: "Priya", text: "Used a pause instead of a filler word and it felt powerful" },
  { name: "Leo", text: "Beatboxed on camera today, self-consciousness officially broken" },
  { name: "Amara", text: "Told my storybook story at dinner and everyone went quiet" },
  { name: "Danil", text: "The sound effects challenge turned my commute into a movie" },
  { name: "Sofia", text: "Three emotions in one story is harder than it looks" },
  { name: "Ken", text: "My plot twist landed, my brother did not see it coming" },
  { name: "Ines", text: "Described my grandmother's kitchen and I could smell it again" },
  { name: "Tomas", text: "Pitched in 28 seconds, two under the limit" },
  { name: "Lena", text: "Day nine of the streak, this is becoming a habit" },
  { name: "Ravi", text: "Told someone else's story and finally understood empathy on camera" },
  { name: "Julia", text: "My podcast intro made my guest sound like a legend" },
  { name: "Omar", text: "The healed story was scary to record and worth it" },
  { name: "Elsa", text: "Played all four characters and my dog was the audience" },
  { name: "Marco", text: "Dropped the mic line and just stopped, the silence was loud" },
];
