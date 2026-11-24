import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The phone rises, a finger swipes the first card right, the second left and
// super-likes the third, then the match screen morphs in while the camera
// pushes. Three lines of copy beside the phone hand over on those beats.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type SwipeDeckElementId =
  | "phone"
  | `line:${number}`
  | "touch"
  | `swipe:${number}`
  | "match";

export interface SwipeDeckTimingProps {
  lines?: [string, string, string];
}

export const DEFAULT_LINES: [string, string, string] = [
  "Swipe right on what fits.",
  "Skip the rest.",
  "Install the match.",
];

export type SwipeKind = "like" | "nope" | "super";

/** The three swipes, in order: finger down, release, and the card's flight. */
const SWIPES: {
  kind: SwipeKind;
  label: string;
  down: number;
  release: number;
  fly: number;
}[] = [
  { kind: "like", label: "Swipe right", down: 24, release: 48, fly: 12 },
  { kind: "nope", label: "Swipe left", down: 60, release: 78, fly: 12 },
  { kind: "super", label: "Super like", down: 92, release: 96, fly: 14 },
];
export const SWIPE_KINDS: SwipeKind[] = SWIPES.map((s) => s.kind);

const PHONE_RISE = 21;
const TOUCH = 12;
const TOUCH_IN = 8;
const MATCH = 114;
const END = 180;
const LINE_IN = 16;
const LINE_OUT = 8;

// A swipe runs from the finger going down until its card has flown off:
// `release` is when the finger lets go, `fly` how long the card flies.
// The match runs to the end of the camera push, its parts entering on beats.
// A line of copy holds until the next one takes over.
export const swipeDeckTimeline = defineTimeline<
  SwipeDeckElementId,
  SwipeDeckTimingProps
>(({ lines = DEFAULT_LINES }) => {
  const line1 = SWIPES[1].down - 4;
  const elements: TimelineElement<SwipeDeckElementId>[] = [
    {
      id: "phone",
      lane: "Phone",
      label: "Phone rises",
      start: 0,
      length: PHONE_RISE,
    },
    {
      id: "line:0",
      lane: "Copy",
      label: lines[0],
      start: 6,
      length: line1 - 6,
      beats: { in: LINE_IN, out: LINE_OUT },
    },
    {
      id: "touch",
      lane: "Touch",
      label: "Finger appears",
      start: TOUCH,
      length: TOUCH_IN,
    },
  ];
  SWIPES.forEach((s, i) => {
    if (i === 1) {
      elements.push({
        id: "line:1",
        lane: "Copy",
        label: lines[1],
        start: line1,
        length: MATCH - line1,
        follows: "swipe:0",
        beats: { in: LINE_IN, out: LINE_OUT },
      });
    }
    elements.push({
      id: `swipe:${i}`,
      lane: "Swipes",
      label: s.label,
      start: s.down,
      length: s.release - s.down + s.fly,
      follows: i > 0 ? `swipe:${i - 1}` : undefined,
      beats: { release: s.release - s.down, fly: s.fly },
    });
  });
  elements.push(
    {
      id: "match",
      lane: "Match",
      label: "It’s a match",
      start: MATCH,
      length: END - MATCH,
      follows: "swipe:2",
      beats: {
        title: 4,
        titleEnd: 18,
        avatar: 6,
        avatar2: 9,
        heart: 16,
        text: 18,
        textEnd: 32,
        cta: 22,
      },
    },
    {
      id: "line:2",
      lane: "Copy",
      label: lines[2],
      start: MATCH,
      length: END - MATCH,
      follows: "swipe:2",
      beats: { in: LINE_IN, out: LINE_OUT },
    },
  );
  return elements;
});
