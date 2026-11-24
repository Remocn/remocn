import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The speed strips whipping in with the title, each letter braking into its
// slant (the last letter leads), the strips retracting into the underline,
// then the subtitle sliding up. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type ItalicSpeedElementId = `char:${number}` | "retract" | "subtitle";

export interface ItalicSpeedTimingProps {
  title?: string;
  /** Frames each letter trails the one after it. */
  stagger?: number;
}

/** The lead (last) letter arrives here. */
const ARRIVE = 13;
/** A letter rides in over `TRAVEL` before it arrives... */
const TRAVEL = 11;
/** ...and its slant starts snapping `BRAKE` before. */
const BRAKE = 2;
const STAGGER = 1.2;
const RETRACT_AT = 18;
const RETRACT_LEN = 11;
/** Each strip retracts half a frame after the one above; there are nine. */
const RETRACT_STAGGER = 0.5;
const STRIPS = 9;
const SUB_AT = 32;
const SUB_LEN = 11;

/** The title as set: trimmed, upper case, "GO" when empty. */
export function titleText(title: string) {
  return title.trim().toUpperCase() || "GO";
}

// A letter's element starts the moment it arrives; `travel` and `brake`
// (negative) reach back to when it set off and when its slant snaps.
export const italicSpeedTimeline = defineTimeline<
  ItalicSpeedElementId,
  ItalicSpeedTimingProps
>(({ title = "FASTER", stagger = STAGGER }) => {
  const text = titleText(title);
  const n = text.length;
  const letters = text
    .split("")
    .map((ch, i) => ({ ch, i, arrive: ARRIVE + (n - 1 - i) * stagger }))
    .sort((a, b) => a.arrive - b.arrive);
  const elements: TimelineElement<ItalicSpeedElementId>[] = letters.map(
    ({ ch, i, arrive }, k) => ({
      id: `char:${i}`,
      lane: "Letters",
      label: ch,
      start: arrive,
      length: TRAVEL,
      follows: k > 0 ? `char:${letters[k - 1].i}` : undefined,
      beats: { travel: -TRAVEL, brake: -BRAKE },
    }),
  );
  elements.push(
    {
      id: "retract",
      lane: "Strips",
      label: "retract",
      start: RETRACT_AT,
      length: RETRACT_LEN + (STRIPS - 1) * RETRACT_STAGGER,
      follows: `char:${n - 1}`,
      beats: { stagger: RETRACT_STAGGER, strip: RETRACT_LEN },
    },
    {
      id: "subtitle",
      lane: "Subtitle",
      label: "subtitle",
      start: SUB_AT,
      length: SUB_LEN,
      follows: "retract",
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
