import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The "POV:" label popping in big, its shrink to a label, each setup word
// sliding up, the punchline slamming in and the ground rising behind it.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type PovSetupElementId =
  | "label"
  | "shrink"
  | `word:${number}`
  | "punch"
  | "ground";

export interface PovSetupTimingProps {
  setup?: string;
  /** Frames between setup words. */
  stagger?: number;
  /** Frame the punchline lands. */
  punchAt?: number;
}

export const DEFAULT_SETUP = "you shipped the launch video before standup";
const POV = 0;
const SHRINK = 6;
const SETUP = 10;
export const WORD_GAP = 3;
const WORD_LEN = 12;
/** A word fades in over `WORD_FADE` while it slides. */
const WORD_FADE = 4;
export const PUNCH = 54;
const RISE = 56;
const RISE_LEN = 30;

/** The setup line as words. */
export function setupWordsOf(setup: string) {
  return setup.split(/\s+/).filter(Boolean);
}

// `label` pops in (fading over `fade` from `fadeAt`, its camera kick at
// `kick`); `shrink` takes it down to a label, and the words (`word:<i>`, a
// chain) follow it. `punch` lands the punchline: the block lifts on `lift`,
// the setup steps back over its length, the camera kicks at `kick` and
// creeps until `creep`. `ground` rises behind it.
export const povSetupTimeline = defineTimeline<
  PovSetupElementId,
  PovSetupTimingProps
>(({ setup = DEFAULT_SETUP, stagger = WORD_GAP, punchAt = PUNCH }) => {
  const shift = punchAt - PUNCH;
  const punch = PUNCH + shift;
  const out: TimelineElement<PovSetupElementId>[] = [
    {
      id: "label",
      lane: "Label",
      label: "POV label",
      start: POV,
      length: SHRINK - POV,
      beats: { fadeAt: -1, fade: 2, kick: 4 },
    },
    {
      id: "shrink",
      lane: "Label",
      label: "shrink to label",
      start: SHRINK,
      length: SETUP - SHRINK,
      follows: "label",
    },
  ];
  setupWordsOf(setup).forEach((word, i) => {
    out.push({
      id: `word:${i}`,
      lane: "Setup",
      label: word,
      start: SETUP + i * stagger,
      length: WORD_LEN,
      follows: i > 0 ? `word:${i - 1}` : "shrink",
      beats: { fade: WORD_FADE },
    });
  });
  out.push(
    {
      id: "punch",
      lane: "Punch",
      label: "punchline",
      start: punch,
      length: 12,
      beats: { fade: 2, lift: 0, kick: 4, creep: 70 },
    },
    {
      id: "ground",
      lane: "Ground",
      label: "ground rise",
      start: RISE + shift,
      length: RISE_LEN,
      follows: "punch",
    },
  );
  return out.sort((a, b) => a.start - b.start);
});
