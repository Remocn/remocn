import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A post scheduler: the composer rises over the queue board, the post types
// itself, the cursor adds media, opens the time picker and picks a slot,
// presses Schedule, and the composer folds into a card that flies onto the
// board, then a toast confirms it, under a slow camera push. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type SocialSchedulerElementId =
  | "comp"
  | "type"
  | "cursor"
  | "media"
  | "time"
  | "slot"
  | "sched"
  | "camera"
  | "land"
  | "toast";

export interface SocialSchedulerTimingProps {
  text?: string;
}

export const DEFAULT_TEXT =
  "remocn 2.0 is live: 120 Remotion components you copy, paste and own. Your next launch video takes an afternoon, not a sprint.";

const hash = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Frames from `start` to each next character, irregular like real typing. */
const keyGap = (text: string, i: number) =>
  0.38 + hash(i) * 0.22 + (/[.:,]/.test(text[i - 1] ?? "") ? 2 : 0);

/** How many characters of `text` are typed at `frame`, typing from `start`. */
export function typedCount(text: string, frame: number, start: number) {
  let t = start;
  for (let i = 0; i < text.length; i++) {
    t += keyGap(text, i);
    if (t > frame) return i;
  }
  return text.length;
}

const TYPE = 10;
const END = 228;

// `comp` rises the composer in on a spring, fading over its length; the
// board fades in over `board`, the big label rises from `label` to
// `labelEnd`, and the network chips fade in from `networks` over
// `networksLen`, `stagger` apart. `type` types the post over its length.
// `cursor` fades the cursor in and sends it to the media tile. `media`,
// `time`, `slot` and `sched` are clicks; after each the cursor leaves at
// `leave`. `media` adds the photo at `add`. `time` opens the picker at `pop`,
// fading it in from `fade` to `fadeEnd`. `slot` picks the slot at `pick`
// (hovered from `hover`) and closes the picker from `close` to `closeEnd`.
// `sched` folds the composer away from `fold` to `foldEnd` and brings the
// board into focus at `focus`. `camera` pushes in over its length. `land`
// lands the card on the board: it flies from `fly`, fading in until
// `fadeEnd`, the column shifts at its start, the card counts as landed at
// `landed`, and its ring glows from `ring` to `ringEnd` and dims from `dim`
// to `dimEnd`. `toast` pops the toast, fading in over `fade`; the cursor
// fades from `leave` to `leaveEnd`.
export const socialSchedulerTimeline = defineTimeline<
  SocialSchedulerElementId,
  SocialSchedulerTimingProps
>(({ text = DEFAULT_TEXT }): TimelineElement<SocialSchedulerElementId>[] => {
  let typed = TYPE;
  for (let i = 0; i < text.length; i++) typed += keyGap(text, i);
  return [
    {
      id: "comp",
      lane: "Composer",
      label: "Composer",
      start: 0,
      length: 10,
      beats: {
        board: 8,
        label: 4,
        labelEnd: 18,
        networks: 6,
        networksLen: 10,
        stagger: 3,
      },
    },
    {
      id: "type",
      lane: "Composer",
      label: "Type post",
      start: TYPE,
      length: typed - TYPE,
    },
    {
      id: "cursor",
      lane: "Cursor",
      label: "Cursor",
      start: 62,
      length: 6,
    },
    {
      id: "media",
      lane: "Cursor",
      label: "Add media",
      start: 90,
      length: 20,
      follows: "cursor",
      beats: { add: 2, leave: 6 },
    },
    {
      id: "time",
      lane: "Cursor",
      label: "Open time",
      start: 110,
      length: 18,
      follows: "media",
      beats: { pop: 2, fade: 1, fadeEnd: 7, leave: 4 },
    },
    {
      id: "slot",
      lane: "Cursor",
      label: "Pick slot",
      start: 128,
      length: 16,
      follows: "time",
      beats: { pick: 2, hover: -8, close: 3, closeEnd: 9, leave: 4 },
    },
    {
      id: "sched",
      lane: "Cursor",
      label: "Schedule",
      start: 144,
      length: 16,
      follows: "slot",
      beats: { fold: 4, foldEnd: 16, focus: 11, leave: 8 },
    },
    {
      id: "camera",
      lane: "Camera",
      label: "Push",
      start: 144,
      length: END - 144,
      follows: "slot",
    },
    {
      id: "land",
      lane: "Board",
      label: "Land card",
      start: 160,
      length: 24,
      follows: "sched",
      beats: {
        fly: -4,
        fadeEnd: 2,
        landed: 18,
        ring: 14,
        ringEnd: 22,
        dim: 50,
        dimEnd: 70,
      },
    },
    {
      id: "toast",
      lane: "Board",
      label: "Toast",
      start: 184,
      length: 8,
      follows: "land",
      beats: { fade: 8, leave: 20, leaveEnd: 28 },
    },
  ];
});
