import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The word sliding in with its slices trailing behind, the trail opening and
// then catching up, the fluted ground fading in, and the rule and caption
// settling under the word. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type SlitScanElementId =
  | "move"
  | "ground"
  | "trail"
  | "resolve"
  | "rule"
  | "caption";

/** The scene's timing does not depend on its props. */
export type SlitScanTimingProps = object;

/** The word is already this far into its slide at frame 0 (negative). */
const MOVE_AT = -30;
const MOVE_END = 28;
const TRAIL_IN = 14;
const RESOLVE_AT = 36;
const RESOLVE_END = 76;
const CAPTION_AT = 78;
const CAPTION = 20;
/** The rule draws from `RULE_LEAD` before the caption, over `RULE`. */
const RULE_LEAD = 4;
const RULE = 22;
const GROUND_IN = 30;
/** The ground's colors drift across this many frames. */
const DRIFT = 125;

// `move` is the word's slide; each slice plays it late by its share of the
// trail. `trail` is the lag opening up, `resolve` the slices catching up.
export const slitScanTimeline = defineTimeline<
  SlitScanElementId,
  SlitScanTimingProps
>((): TimelineElement<SlitScanElementId>[] => [
  {
    id: "move",
    lane: "Word",
    label: "slide",
    start: MOVE_AT,
    length: MOVE_END - MOVE_AT,
  },
  {
    id: "ground",
    lane: "Ground",
    label: "ground",
    start: 0,
    length: GROUND_IN,
    beats: { drift: DRIFT },
  },
  {
    id: "trail",
    lane: "Trail",
    label: "trail opens",
    start: 0,
    length: TRAIL_IN,
  },
  {
    id: "resolve",
    lane: "Trail",
    label: "slices catch up",
    start: RESOLVE_AT,
    length: RESOLVE_END - RESOLVE_AT,
    follows: "trail",
  },
  {
    id: "rule",
    lane: "Rule",
    label: "rule",
    start: CAPTION_AT - RULE_LEAD,
    length: RULE,
    follows: "resolve",
  },
  {
    id: "caption",
    lane: "Caption",
    label: "caption",
    start: CAPTION_AT,
    length: CAPTION,
    follows: "resolve",
  },
]);
