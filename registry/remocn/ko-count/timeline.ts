import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The count, one to ten, each number a hard cut; the word slamming in; the
// hit (impact, shake and the slow push); the subline wiping in and the logo
// rising. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The scene runs one frame ahead of the schedule (`PREROLL`), so the first
// number is already there on frame 0. The ids are public: a saved `timing`
// prop refers to them.

export type KoCountElementId =
  | `count:${number}`
  | "word"
  | "hit"
  | "subline"
  | "logo";

export interface KoCountTimingProps {
  hold?: number;
}

/** Frames the scene's clock runs ahead of the schedule. */
export const PREROLL = 1;

const GAPS = [8, 8, 7, 7, 6, 6, 5, 5, 4];
const HOLD_TEN = 8;
const SLAM_LEN = 5;
const SUB_DELAY = 11;
const LOGO_DELAY = 19;

// `count:<i>` shows number `i + 1` until the next; it slams in over `slam`,
// drifts larger from `settle` over `settleLen`, and kicks the camera from
// `kick` over `kickLen`. Ten holds for `hold`. The word slams in over its
// length and fades in over `fade`; the hit shakes the camera over `shake`
// and pushes in over its length. The counts form a chain; the word follows
// ten, the hit follows the word, and the subline and logo follow the hit.
export const koCountTimeline = defineTimeline<
  KoCountElementId,
  KoCountTimingProps
>(({ hold = HOLD_TEN }) => {
  const countAt: number[] = [0];
  for (const g of GAPS) countAt.push(countAt[countAt.length - 1] + g);
  const koAt = countAt[9] + hold;
  const hitAt = koAt + SLAM_LEN;
  const subAt = hitAt + SUB_DELAY;
  const logoAt = hitAt + LOGO_DELAY;
  const elements: TimelineElement<KoCountElementId>[] = [
    ...countAt.map(
      (at, i): TimelineElement<KoCountElementId> => ({
        id: `count:${i}`,
        lane: "Count",
        label: String(i + 1),
        start: at - PREROLL,
        length: i < 9 ? GAPS[i] : hold,
        follows: i > 0 ? `count:${i - 1}` : undefined,
        beats: { slam: 3, settle: 3, settleLen: 10, kick: 2, kickLen: 5 },
      }),
    ),
    {
      id: "word",
      lane: "Word",
      label: "Word slams in",
      start: koAt - PREROLL,
      length: SLAM_LEN,
      follows: "count:9",
      beats: { fade: 2 },
    },
    {
      id: "hit",
      lane: "Word",
      label: "Impact",
      start: hitAt - PREROLL,
      length: 60,
      follows: "word",
      beats: { shake: 14 },
    },
    {
      id: "subline",
      lane: "Subline",
      label: "Subline",
      start: subAt - PREROLL,
      length: 12,
      follows: "hit",
    },
    {
      id: "logo",
      lane: "Logo",
      label: "Logo",
      start: logoAt - PREROLL,
      length: 10,
      follows: "hit",
    },
  ];
  return elements;
});
