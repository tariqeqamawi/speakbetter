import { LionMouth } from "@/components/lion-mouth";

// Coach, talking to the visitor directly.
//
// WHY HE SPEAKS ON A SALES PAGE. Everything else on this page is a
// claim ABOUT him - that an AI coach watches your videos and gives you
// real feedback - and a claim about a thing is always weaker than the
// thing. Ten seconds of him actually speaking, in his own voice, with
// his mouth moving to his own words, settles the question the entire
// page is trying to answer. It is also the only moment a visitor meets
// the character they would be spending six weeks with.
//
// AND NOW HE DOES NOT SPEAK AT ALL. There was a "Hear it from Coach"
// button under this, and a visitor already meets his actual voice
// twice further down the page - the spoken headline above, and the
// full sample review in the section below, which is the one that
// settles the question. A third offer of the same voice, on a page
// with a button under every other paragraph, is one more thing to
// decline. The words stay; they are the introduction.
//
// `audioSrc` is kept in the signature so the callers need not change
// and so the clip is one prop away if it is ever wanted back.

export function LionPitch({ line }: { line: string; audioSrc?: string }) {
  return (
    <section className="flex w-full max-w-3xl flex-col items-center gap-5 self-center rounded-3xl border border-navy-600 bg-navy-800 px-5 py-8 sm:px-10">
      <div className="w-44 sm:w-56">
        {/* At rest. He used to be silent until a button was pressed
            and the button is gone, so there is nothing for a mouth to
            move to - a jaw flapping with no sound is worse than a
            still portrait. */}
        <LionMouth level={0} className="w-full" />
      </div>

      <p className="max-w-xl text-center text-lg leading-relaxed text-ink text-balance sm:text-xl">
        {line}
      </p>
    </section>
  );
}
