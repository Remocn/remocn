import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The close-up shots, one per line of the name, the whip-zoom out to the
// poster, the spotlight band swinging in, the record and finishes slamming
// in, the nickname wiping in and the billing and logo rising. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type WalkoutNameElementId =
  | `shot:${number}`
  | "whip-out"
  | "band"
  | "record"
  | "finishes"
  | "nickname"
  | "meta";

export interface WalkoutNameTimingProps {
  name?: string[];
}

export const DEFAULT_NAME = ["The", "Launch", "Kid"];

/** The scene runs this many frames ahead of the schedule. */
export const PREROLL = 2;

const SHOT_2 = 12;
const SHOT_3 = 26;
const SLAM_LEN = 5;
const WHIP_OUT = 37;
const WHIP_OUT_LEN = 9;
const BAND_AT = 44;
const BAND_LEN = 18;
const BAND_DRIFT_END = 160;
const RECORD_AT = 52;
const FINISH_AT = 58;
const NICK_AT = 64;
const META_AT = 70;

/** The lines of the name as set: at most four, in capitals. */
export function walkoutLines(name: string[]) {
  return name.slice(0, 4).map((l) => l.toUpperCase());
}

// The beat sheet counts on a clock `PREROLL` frames ahead of the scene; the
// schedule counts scene frames. `shot:<k>` is the shot on line `k`, a chain,
// running until the next cut: it pushes in over `push` and whips in over
// `whip`; the last line instead slams down over `slam`, shows over `show`
// and shakes the camera for `shake` frames. The whip-out follows the last
// shot, the band follows it too and drifts on until `driftEnd`. The record
// and the finishes slam in over their length (shown over `show`, shaking
// for `shake`); the finishes' rule draws over `rule` from `ruleAt`. The
// nickname and the billing follow.
export const walkoutNameTimeline = defineTimeline<
  WalkoutNameElementId,
  WalkoutNameTimingProps
>(({ name = DEFAULT_NAME }) => {
  const lines = walkoutLines(name);
  const n = Math.max(1, lines.length);
  const shotAt = [0, SHOT_2, SHOT_3, SHOT_3 + 6].slice(0, n);
  const whipOut = n === 1 ? SHOT_2 : WHIP_OUT + (n > 3 ? 6 : 0);
  const last: WalkoutNameElementId = `shot:${n - 1}`;
  const elements: TimelineElement<WalkoutNameElementId>[] = [
    ...shotAt.map(
      (at, i): TimelineElement<WalkoutNameElementId> => ({
        id: `shot:${i}`,
        lane: "Shots",
        label: lines[i] ?? "",
        start: at - PREROLL,
        length: (i + 1 < n ? shotAt[i + 1] : whipOut) - at,
        follows: i > 0 ? `shot:${i - 1}` : undefined,
        beats: { push: 14, whip: 7, slam: SLAM_LEN, show: 2, shake: 9 },
      }),
    ),
    {
      id: "whip-out",
      lane: "Shots",
      label: "whip out",
      start: whipOut - PREROLL,
      length: WHIP_OUT_LEN,
      follows: last,
    },
    {
      id: "band",
      lane: "Band",
      label: "spotlight",
      start: BAND_AT - PREROLL,
      length: BAND_LEN,
      follows: last,
      beats: { driftEnd: BAND_DRIFT_END - BAND_AT },
    },
    {
      id: "record",
      lane: "Stats",
      label: "record",
      start: RECORD_AT - PREROLL,
      length: SLAM_LEN,
      follows: "whip-out",
      beats: { label: 3, show: 2, shake: 6 },
    },
    {
      id: "finishes",
      lane: "Stats",
      label: "finishes",
      start: FINISH_AT - PREROLL,
      length: SLAM_LEN,
      follows: "record",
      beats: { show: 2, shake: 6, ruleAt: -1, rule: 8 },
    },
    {
      id: "nickname",
      lane: "Nickname",
      label: "nickname",
      start: NICK_AT - PREROLL,
      length: 11,
      follows: "finishes",
    },
    {
      id: "meta",
      lane: "Meta",
      label: "billing and logo",
      start: META_AT - PREROLL,
      length: 10,
      follows: "nickname",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
