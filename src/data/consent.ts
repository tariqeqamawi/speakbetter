// The agreement every student makes to take Speak Better, in one place:
// read by the consent ask at welcome and the gate (components/consent-
// gate.tsx), said under the prices before anyone pays (components/
// pricing.tsx), and set out in full in the terms and privacy policy
// (/terms, /privacy). A plain module, not a client one, so server pages
// can read it too. The words are Tariq's.

/** The one line a student is asked to say yes to. */
export const CONSENT_SHORT = "By agreeing to use Speak Better you agree to our Terms of Service.";

/** The reassurance under it. Deliberately not "your personal
 *  information is never stored" - an email and a receipt are - but the
 *  two things people actually worry about. */
export const CONSENT_REASSURE = "Don't worry - your videos are never stored, and your name is never attached to what you say.";

/** "What does that mean?" - the explanation, a paragraph at a time. */
export const CONSENT_EXPLAIN = [
  "Speak Better is something we're passionate about, and it's in its early days. Coach is trained to spot the different techniques and skills people use when they speak.",
  "Your speech will be used anonymously, as text - transcripts only, never video - to help improve the service. This is also how you're able to track your own progress over time and meaningfully see your improvement.",
];

/** Said to anyone who says no. */
export const CONSENT_DECLINE = [
  "If you don't want this, then unfortunately Speak Better isn't the right fit for you. No harm done.",
  "Thank you for your interest - and if you ever change your mind, we're here to support you to become the speaker you've always dreamed of being.",
];

/** The fuller wording, as the terms and privacy policy state it. */
export const CONSENT_AGREE =
  "Speak Better is an evolving system that we are passionate about improving by using Speak Better and Coach. In using Speak Better and Coach you agree to transcripts of your speech being used anonymously as text to help improve the service. This is also how you are able to track your improvement over time.";

/** What that means in practice. */
export const CONSENT_LINE =
  "None of your videos are ever stored. Your speech is turned into text and kept under a student number - never your name, and any names you mention are removed - so we can follow how you grow and help Coach become an even better coach.";

/** When the terms and privacy policy last changed. */
export const LEGAL_UPDATED = "26 September 2026";
