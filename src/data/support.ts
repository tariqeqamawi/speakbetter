// Where a person goes when something is wrong.
//
// One constant, because this address ends up in the community rooms,
// the landing page, the checkout confirmation and every email the app
// ever sends - and a support address that is right in three places and
// stale in the fourth is worse than not offering one.

export const SUPPORT_EMAIL = "speakbetterforlife@gmail.com";

/** A mailto with the subject already filled in, so a reply thread is
 *  sortable without asking the student to label anything. */
export function supportMailto(about: string): string {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Speak Better - ${about}`)}`;
}
