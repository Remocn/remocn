import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The name fades up with the numeral as a superscript beside it; after the
// hold the numeral drops onto the baseline and grows huge while the name
// shrinks aside, then the tagline rises. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type SequelNumeralElementId =
  | "name"
  | "superscript"
  | "drop"
  | "grow"
  | "tagline";

export interface SequelNumeralTimingProps {
  name?: string;
  numeral?: string;
  tagline?: string;
  hold?: number;
}

export const DEFAULT_NAME = "remocn";
export const DEFAULT_NUMERAL = "2";
export const DEFAULT_TAGLINE = "Part two. Out now.";

const NAME_AT = 0;
const NAME_IN = 18;
const SUP_AT = 10;
const SUP_IN = 12;
const DROP_AT = 42;
const DROP_LEN = 10;
const GROW_AT = 50;
/** The settle spring is cut to this many frames. */
const SETTLE_LEN = 26;
const TAG_AT = 82;
const TAG_IN = 16;
export const DEFAULT_HOLD = DROP_AT - SUP_AT;

// The superscript fades in over `in` and holds until the drop. The grow
// starts before the drop has landed, and the tagline after the settle.
export const sequelNumeralTimeline = defineTimeline<
  SequelNumeralElementId,
  SequelNumeralTimingProps
>(
  ({
    name = DEFAULT_NAME,
    numeral = DEFAULT_NUMERAL,
    tagline = DEFAULT_TAGLINE,
    hold = DEFAULT_HOLD,
  }) => {
    const dropAt = SUP_AT + hold;
    const growAt = dropAt + (GROW_AT - DROP_AT);
    const tagAt = growAt + (TAG_AT - GROW_AT);
    const elements: TimelineElement<SequelNumeralElementId>[] = [
      {
        id: "name",
        lane: "Name",
        label: name,
        start: NAME_AT,
        length: NAME_IN,
      },
      {
        id: "superscript",
        lane: "Numeral",
        label: numeral,
        start: SUP_AT,
        length: hold,
        beats: { in: SUP_IN },
      },
      {
        id: "drop",
        lane: "Numeral",
        label: "Drop",
        start: dropAt,
        length: DROP_LEN,
        follows: "superscript",
      },
      {
        id: "grow",
        lane: "Lockup",
        label: "Grow and settle",
        start: growAt,
        length: SETTLE_LEN,
        follows: "drop",
      },
      {
        id: "tagline",
        lane: "Tagline",
        label: tagline || "Tagline",
        start: tagAt,
        length: TAG_IN,
        follows: "grow",
      },
    ];
    return elements;
  },
);
