import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A caret blinks in, types the word with one letter missing, runs back into
// the word as the letters part for it, becomes the missing letter, and the
// subline rises under the word. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type CaretLetterElementId =
  | "caret"
  | "type"
  | "slide"
  | "open"
  | "morph"
  | "subline";

export interface CaretLetterTimingProps {
  typeLength?: number;
}

const TYPE_LEN = 46;
const CARET_IN = 0;
const CARET_LEN = 10;
const BLINK_AT = 8;
const TYPE = 46;
const LETTER_LEN = 16;
const SLIDE = 110;
const SLIDE_LEN = 26;
const OPEN = 118;
const OPEN_LEN = 24;
const MORPH = 134;
const MORPH_LEN = 16;
const SUB = 150;
const SUB_LEN = 30;

// `caret` fades the caret in; it blinks from its `blink` beat until the
// typing's `lead` beat (before the typing starts). `type` sweeps the caret
// across the word; each letter grows over `letter` frames, from `letterLead`
// frames before the caret clears it (where it clears it is measured). The
// caret blinks again from `idle` frames after the typing ends until `lead`
// frames before the slide. `slide` runs the caret home, `open` parts the
// letters for it, `morph` turns it into the letter and `subline` rises; each
// follows the one before.
export const caretLetterTimeline = defineTimeline<
  CaretLetterElementId,
  CaretLetterTimingProps
>(({ typeLength = TYPE_LEN }): TimelineElement<CaretLetterElementId>[] => {
  const shift = typeLength - TYPE_LEN;
  return [
    {
      id: "caret",
      lane: "Caret",
      label: "caret",
      start: CARET_IN,
      length: CARET_LEN,
      beats: { blink: BLINK_AT },
    },
    {
      id: "type",
      lane: "Caret",
      label: "type",
      start: TYPE,
      length: typeLength,
      beats: { lead: -4, letter: LETTER_LEN, letterLead: -2, idle: 2 },
    },
    {
      id: "slide",
      lane: "Caret",
      label: "slide home",
      start: SLIDE + shift,
      length: SLIDE_LEN,
      follows: "type",
      beats: { lead: -2 },
    },
    {
      id: "open",
      lane: "Word",
      label: "letters part",
      start: OPEN + shift,
      length: OPEN_LEN,
      follows: "slide",
    },
    {
      id: "morph",
      lane: "Caret",
      label: "become the letter",
      start: MORPH + shift,
      length: MORPH_LEN,
      follows: "open",
    },
    {
      id: "subline",
      lane: "Subline",
      label: "subline",
      start: SUB + shift,
      length: SUB_LEN,
      follows: "morph",
    },
  ];
});
