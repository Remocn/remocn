import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The phone rising in (the mini variant first taps the mini player open),
// then the finger tapping play and the heart, the player scrolling to the
// lyrics and each lyric line taking its turn. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type NowPlayingElementId =
  | "phone"
  | "reach"
  | "open"
  | "play"
  | "heart"
  | "scroll"
  | `lyric:${number}`;

export interface NowPlayingTimingProps {
  lyrics?: string[];
  lineHold?: number;
  variant?: "full" | "mini";
}

export const DEFAULT_LYRICS = [
  "Shipped it at midnight",
  "and the build came green",
  "every frame in motion",
  "every pixel in line",
  "press play on launch day",
  "watch the counter climb",
  "we wrote it all in React",
  "and rendered it in time",
];

const LINE_LEN = 18;
/** The mini variant opens the player first; the rest runs this much later. */
export const MINI_OFFSET = 52;
const TAP_PLAY = 28;
const TAP_HEART = 64;
const LYRICS = 100;
const LINE0 = 124;
const MINI_TAP = 30;

// `phone` rises the phone in; the copy beside it fades from `copyAt` to
// `copyEnd`. `reach` brings the finger in, fading over `fadeIn`. In the
// mini variant `open` taps the mini player (the finger leaves for it at
// `approachAt`, the player expands from `expandAt`, the finger moves off at
// `leaveAt`). `play` taps play and `heart` the heart, the finger leaving for
// each at `approachAt`; after the heart it fades from `fadeAt` to `fadeEnd`.
// `scroll` scrolls the player down to the lyrics. `lyric:<i>` is line `i`
// (a chain): the big copy brings it in from `inAt` to `inEnd` and takes the
// one before out over `out`. Each step follows the one before.
export const nowPlayingTimeline = defineTimeline<
  NowPlayingElementId,
  NowPlayingTimingProps
>(({ lyrics = DEFAULT_LYRICS, lineHold = LINE_LEN, variant = "full" }) => {
  const mini = variant === "mini";
  const off = mini ? MINI_OFFSET : 0;
  const reachAt = mini ? 8 : 4;
  const elements: TimelineElement<NowPlayingElementId>[] = [
    {
      id: "phone",
      lane: "Phone",
      label: "Phone",
      start: 0,
      length: 10,
      beats: { copyAt: 10, copyEnd: 24 },
    },
    {
      id: "reach",
      lane: "Finger",
      label: "Reach",
      start: reachAt,
      length: (mini ? MINI_TAP : TAP_PLAY) - reachAt,
      beats: { fadeIn: 6 },
    },
  ];
  if (mini) {
    elements.push({
      id: "open",
      lane: "Finger",
      label: "Open the player",
      start: MINI_TAP,
      length: TAP_PLAY + off - MINI_TAP,
      follows: "reach",
      beats: {
        approachAt: -14,
        expandAt: 2,
        leaveAt: MINI_OFFSET - 4 - MINI_TAP,
      },
    });
  }
  elements.push(
    {
      id: "play",
      lane: "Finger",
      label: "Play",
      start: TAP_PLAY + off,
      length: TAP_HEART - TAP_PLAY,
      follows: mini ? "open" : "reach",
      beats: { approachAt: -16 },
    },
    {
      id: "heart",
      lane: "Finger",
      label: "Heart",
      start: TAP_HEART + off,
      length: LYRICS - TAP_HEART,
      follows: "play",
      beats: { approachAt: -16, fadeAt: 6, fadeEnd: 14 },
    },
    {
      id: "scroll",
      lane: "Player",
      label: "Scroll to the lyrics",
      start: LYRICS + off,
      length: LINE0 - LYRICS,
      follows: "heart",
    },
  );
  lyrics.forEach((line, i) => {
    elements.push({
      id: `lyric:${i}`,
      lane: "Lyrics",
      label: line,
      start: LINE0 + i * lineHold + off,
      length: lineHold,
      follows: i > 0 ? `lyric:${i - 1}` : "scroll",
      beats: { inAt: 4, inEnd: 15, out: 6 },
    });
  });
  return elements;
});
