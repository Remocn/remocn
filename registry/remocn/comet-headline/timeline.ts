import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The eyebrow wiping in, each word of the headline flying in on its comet
// trail and landing, the subhead rising and the trails cooling once the last
// word is down. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type CometHeadlineElementId =
  | "eyebrow"
  | `word:${number}`
  | "subhead"
  | "cool";

export interface CometHeadlineTimingProps {
  headline?: string;
  flight?: number;
}

export const DEFAULT_HEADLINE = "Every launch beat, already in orbit.";

// `word:<i>` is the flight of word `i`, a chain: it launches `stagger` after
// the word before and lands at its end; its weight settles over `settle`
// frames and the ring spreads over `ring` frames after landing. The subhead
// and the trails cooling follow the last word.
export const cometHeadlineTimeline = defineTimeline<
  CometHeadlineElementId,
  CometHeadlineTimingProps
>(({ headline = DEFAULT_HEADLINE, flight = 26 }) => {
  const words = headline.match(/\S+/g) ?? [];
  const n = words.length;
  const stagger = n > 1 ? Math.min(5, 34 / (n - 1)) : 0;
  const FLIGHT = flight;
  const launch = (i: number) => 6 + i * stagger;
  const land = (i: number) => launch(i) + FLIGHT;
  const lastLand = land(Math.max(0, n - 1));
  const last: CometHeadlineElementId | undefined =
    n > 0 ? `word:${n - 1}` : undefined;
  const elements: TimelineElement<CometHeadlineElementId>[] = [
    {
      id: "eyebrow",
      lane: "Eyebrow",
      label: "eyebrow",
      start: 0,
      length: 16,
    },
    ...words.map(
      (w, i): TimelineElement<CometHeadlineElementId> => ({
        id: `word:${i}`,
        lane: "Words",
        label: w,
        start: launch(i),
        length: FLIGHT,
        follows: i > 0 ? `word:${i - 1}` : undefined,
        beats: { settle: 12, ring: 16 },
      }),
    ),
    {
      id: "subhead",
      lane: "Subhead",
      label: "subhead",
      start: lastLand - 2,
      length: 22,
      follows: last,
    },
    {
      id: "cool",
      lane: "Trails",
      label: "trails cool",
      start: lastLand,
      length: 24,
      follows: last,
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
