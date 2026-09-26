// The agreement every student makes to take Speak Better, in one place:
// read by the welcome tick-box and the gate (components/consent-gate.tsx),
// said under the prices before anyone pays (components/pricing.tsx), and
// set out in full in the terms and privacy policy (/terms, /privacy).
// A plain module, not a client one, so server pages can read it too.

/** Tariq's wording - the thing a student agrees to. */
export const CONSENT_AGREE =
  "Speak Better is an evolving system that we are passionate about improving by using Speak Better and Coach. In using Speak Better and Coach you agree to transcripts of your speech being used anonymously as text to help improve the service. This is also how you are able to track your improvement over time.";

/** What that means in practice, said under it. */
export const CONSENT_LINE =
  "None of your videos are ever stored. Your speech is turned into text and kept under a student number - never your name, and any names you mention are removed - so we can follow how you grow and help Coach become an even better coach.";

/** When the terms and privacy policy last changed. */
export const LEGAL_UPDATED = "26 September 2026";
