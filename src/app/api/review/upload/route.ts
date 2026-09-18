import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { challengeBySlug, GRACE_SECONDS, maxSecondsFor } from "@/data/challenges";

// The phone can't hand a 100 MB video to a Vercel function - the body
// limit is a few megabytes - so the video goes straight from the phone
// to a private Blob store, and this route only issues the permission
// to do that: one token, one file, one challenge, a short life. The
// review route (../route.ts) reads the file from the store by its URL,
// hands it to Gemini, and deletes it.
//
// Private, because these are recordings of students' faces: a private
// blob can't be fetched by anyone who has the URL, only by code
// holding the store's token.

/** The most a recording may weigh. A phone's three minutes at 1080p
 *  is well under this; anything over it isn't a challenge video. */
const MAX_BYTES = 400 * 1024 * 1024;

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN)
    return NextResponse.json({ error: "Uploads aren't configured." }, { status: 503 });

  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // The client says which challenge and how long; the challenge
        // says how long is allowed. Refused here as well as on the
        // phone, so a hand-built request can't bypass the limit.
        const payload = (() => {
          try {
            return JSON.parse(clientPayload ?? "{}") as { challengeSlug?: string; durationSec?: number };
          } catch {
            return {};
          }
        })();
        const challenge = payload.challengeSlug ? challengeBySlug.get(payload.challengeSlug) : undefined;
        if (!challenge || challenge.passive) throw new Error("Unknown challenge.");
        const limit = maxSecondsFor(challenge);
        if (!payload.durationSec || payload.durationSec > limit + GRACE_SECONDS)
          throw new Error(`Recordings for this challenge are ${limit} seconds at most.`);
        if (!pathname.startsWith("attempts/")) throw new Error("Bad path.");

        return {
          allowedContentTypes: ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v", "video/3gpp"],
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
          // Ten minutes to finish the upload; the token is useless after.
          validUntil: Date.now() + 10 * 60 * 1000,
          tokenPayload: JSON.stringify({ challengeSlug: challenge.slug }),
        };
      },
      // Nothing to do on completion: the review route deletes the file
      // once Gemini has it, and a file whose review never ran is swept
      // by the store's own lifecycle.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload refused.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
