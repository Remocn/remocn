import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The logo rising in, the small tag beside it fading in and then lifting,
// dropping and sliding into its slot in the thank-you line, the status words
// rising beside the logo, and the words around the slot rising in. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. When the clip is too
// short, the whole schedule is compressed to fit it. The ids are public: a
// saved `timing` prop refers to them.

export type BetaThanksElementId =
  | "logo"
  | "tag"
  | "travel"
  | `status:${number}`
  | `before:${number}`
  | `after:${number}`;

export interface BetaThanksTimingProps {
  status?: string;
  before?: string;
  after?: string;
  stagger?: number;
}

const LOGO_IN = 22;
const T_TAG = 10;
const TAG_IN = 14;
const T_LIFT = 40;
const T_TURN = 58;
const T_LAND = 78;
const T_STATUS = 58;
const STATUS_STEP = 5;
const STATUS_RISE = 18;
const T_BEFORE = 64;
const T_AFTER = 78;
const RISE = 16;
const NATURAL_END = 94;

export function words(s: string) {
  return s.split(/\s+/).filter(Boolean);
}

// `travel` starts as the tag lifts (`lift` frames), drops from its `drop`
// to its `dropEnd` beat, slides from its `slide` beat and lands at its end.
// `status:<i>`, `before:<i>` and `after:<i>` are the words of the status,
// of the line before the slot and after it; each list is a chain. `length`
// here is the clip length without `speed`, as the pace is counted.
export const betaThanksTimeline = defineTimeline<
  BetaThanksElementId,
  BetaThanksTimingProps
>(
  (
    {
      status = "is out.",
      before = "Thank you,",
      after = "testers.",
      stagger = 4,
    },
    { length },
  ) => {
    const pace = Math.max(1, (NATURAL_END + 30) / Math.max(1, length));
    const liftAt = T_LIFT - 4;
    const list = (
      lane: string,
      prefix: "status" | "before" | "after",
      text: string,
      at: number,
      step: number,
      rise: number,
    ) =>
      words(text).map(
        (w, i): TimelineElement<BetaThanksElementId> => ({
          id: `${prefix}:${i}`,
          lane,
          label: w,
          start: (at + i * step) / pace,
          length: rise / pace,
          follows: i > 0 ? `${prefix}:${i - 1}` : undefined,
        }),
      );
    const elements: TimelineElement<BetaThanksElementId>[] = [
      {
        id: "logo",
        lane: "Logo",
        label: "logo",
        start: 0,
        length: LOGO_IN / pace,
      },
      {
        id: "tag",
        lane: "Tag",
        label: "tag in",
        start: T_TAG / pace,
        length: TAG_IN / pace,
      },
      {
        id: "travel",
        lane: "Tag",
        label: "into the slot",
        start: liftAt / pace,
        length: (T_LAND - liftAt) / pace,
        beats: {
          lift: (T_LIFT + 8 - liftAt) / pace,
          drop: (T_LIFT - liftAt) / pace,
          dropEnd: (T_TURN + 2 - liftAt) / pace,
          slide: (T_TURN - 2 - liftAt) / pace,
        },
      },
      ...list("Status", "status", status, T_STATUS, STATUS_STEP, STATUS_RISE),
      ...list("Thank you", "before", before, T_BEFORE, stagger, RISE),
      ...list("Thank you", "after", after, T_AFTER, stagger, RISE),
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
