// The drawings the player floats beside the teacher.
//
// Same rules as the navigation set in icons.tsx - 24x24 grid, stroke
// only, round caps and joins, no fill and no second color - because
// these sit over live video where a filled shape would read as a sticker
// pasted on the picture. Taking their color from `currentColor` lets the
// player tint one the same way it tints a word, so a drawn cue and a
// written cue are visibly the same thing said two ways.
//
// Which concept gets which drawing is decided in
// scripts/cues/lexicon.mjs; the names here are the contract between the
// two. An icon named in the data but missing from this file simply
// doesn't draw - the cue falls back to its words.

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Rows of heads - the room you're speaking to. */
function Audience({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="5.5" cy="9" r="2" />
      <circle cx="12" cy="7.5" r="2.2" />
      <circle cx="18.5" cy="9" r="2" />
      <path d="M2.5 17c.4-2.2 1.6-3.4 3-3.4s2.6 1.2 3 3.4" />
      <path d="M8.7 18.5c.45-2.6 1.8-4 3.3-4s2.85 1.4 3.3 4" />
      <path d="M15.5 17c.4-2.2 1.6-3.4 3-3.4s2.6 1.2 3 3.4" />
    </svg>
  );
}

/** An open book - the story, and the storybook you build. */
function Book({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 6.6C10.3 5.4 8.2 4.9 5 5.1v12.4c3.2-.2 5.3.3 7 1.5 1.7-1.2 3.8-1.7 7-1.5V5.1c-3.2-.2-5.3.3-7 1.5Z" />
      <path d="M12 6.6v12.4" />
    </svg>
  );
}

/** The lens you speak into when there's no room in front of you. */
function Camera({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="2.6" y="6.6" width="12.4" height="10.8" rx="2.2" />
      <path d="M15 11.2l5.2-3v7.6l-5.2-3z" />
    </svg>
  );
}

/** Time - the pause you hold, the minutes you have. */
function Clock({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.2V12l3.2 2" />
    </svg>
  );
}

/** Authority worn lightly. */
function Crown({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.6 8.4l2.8 3.4 3-4.8 2.6 4.4 2.6-4.4 3 4.8 2.8-3.4-1.6 9.2H5.2z" />
      <path d="M5.2 17.6h13.6" />
    </svg>
  );
}

/** Where you're looking. */
function Eye({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M2.4 12S5.9 6.4 12 6.4 21.6 12 21.6 12 18.1 17.6 12 17.6 2.4 12 2.4 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

/** Two people looking at each other, which is the whole technique. */
function EyeContact({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M1.8 8.4S3.9 5.6 7 5.6s5.2 2.8 5.2 2.8-2.1 2.8-5.2 2.8S1.8 8.4 1.8 8.4Z" />
      <circle cx="7" cy="8.4" r="1.2" />
      <path d="M11.8 15.6s2.1-2.8 5.2-2.8 5.2 2.8 5.2 2.8-2.1 2.8-5.2 2.8-5.2-2.8-5.2-2.8Z" />
      <circle cx="17" cy="15.6" r="1.2" />
    </svg>
  );
}

/** A strip of film - the scene, the movie in their mind. */
function Film({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7.4 5v14M16.6 5v14M3 12h18M3 8.5h4.4M3 15.5h4.4M16.6 8.5H21M16.6 15.5H21" />
    </svg>
  );
}

/** Energy, passion, the thing they feel coming off you. */
function Flame({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.2s5.6 4.4 5.6 9.2a5.6 5.6 0 1 1-11.2 0c0-2 1-3.7 2-5 .2 1.4.9 2.4 1.9 2.4 1.4 0 2-1.6 1.7-6.6Z" />
    </svg>
  );
}

/** What your hands are doing while you talk. */
function Hand({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 11V5.6a1.4 1.4 0 0 1 2.8 0V11" />
      <path d="M11.8 10.6V4.4a1.4 1.4 0 0 1 2.8 0v6.2" />
      <path d="M14.6 11V6.4a1.4 1.4 0 0 1 2.8 0V14c0 3.6-2.4 6.4-5.8 6.4-2.4 0-4-1-5.2-3l-2.2-3.8a1.4 1.4 0 0 1 2.3-1.6L9 14.4" />
      <path d="M9 11v3.4" />
    </svg>
  );
}

/** Feeling - the channel underneath the words. */
function Heart({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 19.6S3.6 14.8 3.6 9.4A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 8.4 1.8c0 5.4-8.4 10.2-8.4 10.2Z" />
    </svg>
  );
}

/** The production studio in your mind. */
function Imagination({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M15.8 19.6v-2.2a6.4 6.4 0 1 0-7.6 0v2.2" />
      <path d="M8.4 19.6h7.2" />
      <path d="M12 13.6l1-2.2 2.2-1-2.2-1-1-2.2-1 2.2-2.2 1 2.2 1z" />
    </svg>
  );
}

/** Breath, and where the voice is actually powered from. */
function Lungs({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.4v8.8" />
      <path d="M12 8.6c-1.6 0-2.6-1-3.4-1S6 8.4 5.4 11c-.7 2.8-.9 5.4-.4 7 .4 1.3 2.8 1.6 3.9.5 1.2-1.2 3.1-4 3.1-6.3" />
      <path d="M12 8.6c1.6 0 2.6-1 3.4-1s2.6.8 3.2 3.4c.7 2.8.9 5.4.4 7-.4 1.3-2.8 1.6-3.9.5-1.2-1.2-3.1-4-3.1-6.3" />
    </svg>
  );
}

/** The one thing you came to say. */
function Message({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20.4 15.2a2.4 2.4 0 0 1-2.4 2.4H8.4L4 21V6.4A2.4 2.4 0 0 1 6.4 4H18a2.4 2.4 0 0 1 2.4 2.4z" />
    </svg>
  );
}

/** This thing standing in for that thing. */
function Metaphor({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="6.8" cy="12" r="4" />
      <rect x="13.2" y="8" width="8" height="8" rx="1.4" />
      <path d="M10.8 12h2.4" />
    </svg>
  );
}

/** Pace, kept honest. */
function Metronome({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9.2 3.6h5.6l3.6 16.8H5.6z" />
      <path d="M7 15h10" />
      <path d="M12 18.4L16.2 6.6" />
    </svg>
  );
}

/** The instrument, when the instrument is you. */
function Microphone({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="9" y="2.6" width="6" height="11.2" rx="3" />
      <path d="M5.6 11.6a6.4 6.4 0 0 0 12.8 0" />
      <path d="M12 18v3.4M8.6 21.4h6.8" />
    </svg>
  );
}

/** Practice, and watching yourself do it. */
function Mirror({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="6" y="2.6" width="12" height="14.4" rx="6" />
      <path d="M12 17v4.4M9 21.4h6" />
    </svg>
  );
}

/** The obstacle in the story, the one you climbed. */
function Mountain({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M2.4 19.2L9 7.2l4.2 7.2 2.4-3.6 6 8.4z" />
      <path d="M6.8 11.4l2.4 1.8" />
    </svg>
  );
}

/** Melody - the tune a sentence carries. */
function Note({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9.4 17.6V5.2l9.2-1.8v12.4" />
      <circle cx="6.6" cy="17.6" r="2.8" />
      <circle cx="15.8" cy="15.8" r="2.8" />
    </svg>
  );
}

/** Hands up, everybody standing. */
function Ovation({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M8.6 21V13a1.5 1.5 0 0 0-3 0v2.6" />
      <path d="M8.6 14.4V9.6a1.5 1.5 0 0 1 3 0v4.4" />
      <path d="M11.6 13.4V9a1.5 1.5 0 0 1 3 0v5" />
      <path d="M14.6 14V11a1.5 1.5 0 0 1 3 0v4.6c0 3-1.6 5.4-4.2 5.4H8.6" />
      <path d="M4.2 6.6L2.6 5M8 4.6V2.6M12.6 5.6l1.2-1.8" />
    </svg>
  );
}

/** The journey you take them on. */
function Path({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 21c0-4.6 12-3.6 12-8.4S8.4 8.6 8.4 4.6" />
      <circle cx="8.4" cy="3.4" r="1.6" />
      <circle cx="6" cy="21" r="0.4" />
    </svg>
  );
}

/** The silence you leave on purpose. */
function Pause({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M10.2 9v6M13.8 9v6" />
    </svg>
  );
}

/** How you're standing while you say it. */
function Posture({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="4.8" r="2.4" />
      <path d="M12 7.6v7.2" />
      <path d="M7.6 10.4h8.8" />
      <path d="M12 14.8L9 21M12 14.8L15 21" />
    </svg>
  );
}

/** Say it again - the technique and the practice both. */
function Repeat({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4.4 12a7.6 7.6 0 0 1 12.9-5.5l2.3 2.1" />
      <path d="M19.6 12a7.6 7.6 0 0 1-12.9 5.5l-2.3-2.1" />
      <path d="M19.8 4.6v4.2h-4.2M4.2 19.4v-4.2h4.2" />
    </svg>
  );
}

/** The ride you take them on, up and down. */
function RollerCoaster({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M2.4 18.4c3.6 0 3.2-11.2 7.2-11.2s3.4 8 6 8c2 0 2.2-4 6-4" />
      <path d="M2.4 21h19.2" />
      <path d="M6 18.6V21M12.4 15.8V21M18.4 12.6V21" />
    </svg>
  );
}

/** The light finding you. */
function Spotlight({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="8.4" y="2.6" width="7.2" height="4.4" rx="1.4" />
      <path d="M9 7l-5 12.6M15 7l5 12.6" />
      <path d="M6.4 19.6h11.2" />
    </svg>
  );
}

/** The boards, and the space you own on them. */
function Stage({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M2.6 15.6h18.8" />
      <path d="M4.6 15.6L2.6 21M19.4 15.6L21.4 21" />
      <path d="M4.6 15.6V6.4c0-1 .8-1.8 1.8-1.8h11.2c1 0 1.8.8 1.8 1.8v9.2" />
      <path d="M9.4 4.6c0 3.8-1 6.4-1 11M14.6 4.6c0 3.8 1 6.4 1 11" />
    </svg>
  );
}

/** Noise where a word should be. */
function Static({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M2.6 12h2.8l1.6-4.4L9.4 16l2-8 2 6 1.6-3.4 1.4 2.4h4" />
    </svg>
  );
}

/** Nerves, and the weather of a room. */
function Storm({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M7.2 15.4a4 4 0 0 1 .5-8 5.4 5.4 0 0 1 10.2 1.6 3.4 3.4 0 0 1-.5 6.4" />
      <path d="M12.8 11.6L9.6 16.4h3.6L10 21.4" />
    </svg>
  );
}

/** The point you're making. */
function Target({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.75" />
      <circle cx="12" cy="12" r="1.15" />
    </svg>
  );
}

/** The voice itself. */
function Waveform({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M2.8 12h1.6M7.2 7.6v8.8M11.2 4.4v15.2M15.2 8.8v6.4M19.2 10.4v3.2M21.8 12h-.2" />
    </svg>
  );
}

/**
 * The registry the player looks a cue up in. Names come from the built
 * cue data, which gets them from the lexicon - keep the three in step.
 */
export const cueIcons: Record<string, (props: IconProps) => React.ReactNode> = {
  Audience,
  Book,
  Camera,
  Clock,
  Crown,
  Eye,
  EyeContact,
  Film,
  Flame,
  Hand,
  Heart,
  Imagination,
  Lungs,
  Message,
  Metaphor,
  Metronome,
  Microphone,
  Mirror,
  Mountain,
  Note,
  Ovation,
  Path,
  Pause,
  Posture,
  Repeat,
  RollerCoaster,
  Spotlight,
  Stage,
  Static,
  Storm,
  Target,
  Waveform,
};
