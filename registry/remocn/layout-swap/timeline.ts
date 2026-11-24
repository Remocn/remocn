import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The ground drifting under the whole scene, the first headline's words
// rising in, and each swap to the next headline: shared words travel to
// their new places, dropped words fall away, new words rise in. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. The ids are public:
// a saved `timing` prop refers to them.

export type LayoutSwapElementId = "drift" | "enter" | `swap:${number}`;

export interface LayoutSwapTimingProps {
  headlines?: string[];
  hold?: number;
  move?: number;
}

export const DEFAULT_HEADLINES = [
  "Animations.",
  "Animations, transitions, backgrounds.",
  "Animations, transitions and backgrounds, ready to install.",
];

const ENTER = 20;

/** The headlines shown: `headlines`, or one placeholder when it is empty. */
export function layoutSwapSteps(headlines: string[]) {
  return headlines.length > 0 ? headlines : ["remocn"];
}

// The ground drifts over the whole scene. The first headline's words rise
// `stagger` apart, `word` frames each. `swap:<k>` is the move onto headline
// `k`, a chain: it starts after the headline before it has held for `hold`
// frames and runs `move` frames.
export const layoutSwapTimeline = defineTimeline<
  LayoutSwapElementId,
  LayoutSwapTimingProps
>(({ headlines = DEFAULT_HEADLINES, hold = 28, move = 28 }, { length }) => {
  const steps = layoutSwapSteps(headlines);
  const firstWords = steps[0].split(/\s+/).filter(Boolean).length;
  const stepStart = (k: number) => ENTER + k * (hold + move);
  const elements: TimelineElement<LayoutSwapElementId>[] = [
    {
      id: "drift",
      lane: "Ground",
      label: "drift",
      start: 0,
      length,
    },
    {
      id: "enter",
      lane: "Headlines",
      label: steps[0],
      start: 0,
      length: 16 + 2.5 * Math.max(0, firstWords - 1),
      beats: { stagger: 2.5, word: 16 },
    },
    ...steps.slice(1).map(
      (h, i): TimelineElement<LayoutSwapElementId> => ({
        id: `swap:${i + 1}`,
        lane: "Headlines",
        label: h,
        start: stepStart(i) + hold,
        length: move,
        follows: i > 0 ? `swap:${i}` : undefined,
      }),
    ),
  ];
  return elements;
});
