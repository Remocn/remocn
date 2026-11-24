import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The lead line rising in, then each place pulling in from the right like a
// train, braking to its stop, holding, and leaving to the left as the next
// one comes in. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type PullInElementId = "lead" | `place:${number}`;

export interface PullInTimingProps {
  places?: string[];
  hold?: number;
  stagger?: number;
  brake?: number;
}

export const DEFAULT_PLACES = ["vertical.", "4K.", "your codebase."];
export const HEADWAY = 1.25;
export const BRAKE = 20;
export const SETTLE = 12;
const ARRIVE = BRAKE + SETTLE;
const DEPART_GAP = 9;
const LEAD_AT = 0;
const LEAD_RISE = 16;
const FIRST_AT = 4;

/** The places to show; an empty list falls back to one. */
export function placesOf(places: string[]) {
  return places.length > 0 ? places : ["your codebase."];
}

// `place:<k>` starts when its first letter reaches the right edge and lasts
// until the next place does; the letters before that are already rolling in.
// Its beats: `brake` (frames to its stop), `stagger` (between letters) and
// `gap` (it leaves this long before its end). The places are a chain; the
// last one has no departure and lasts as long as its own arrival.
export const pullInTimeline = defineTimeline<
  PullInElementId,
  PullInTimingProps
>(
  ({
    places = DEFAULT_PLACES,
    hold = 24,
    stagger = HEADWAY,
    brake = BRAKE,
  }) => {
    const list = placesOf(places);
    const STEP = ARRIVE + (brake - BRAKE) + Math.max(8, hold) + DEPART_GAP;
    const elements: TimelineElement<PullInElementId>[] = [
      {
        id: "lead",
        lane: "Lead",
        label: "lead",
        start: LEAD_AT,
        length: LEAD_RISE,
      },
      ...list.map(
        (word, k): TimelineElement<PullInElementId> => ({
          id: `place:${k}`,
          lane: "Places",
          label: word,
          start: FIRST_AT + k * STEP,
          length:
            k < list.length - 1
              ? STEP
              : brake + SETTLE + (Array.from(word).length - 1) * stagger,
          follows: k > 0 ? `place:${k - 1}` : undefined,
          beats: { brake, stagger, gap: DEPART_GAP },
        }),
      ),
    ];
    return elements;
  },
);
