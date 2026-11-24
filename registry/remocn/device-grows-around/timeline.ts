import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The app that grows a phone around itself: the avatar pops, the name and
// subtitle type in, the phone grows out around the header and the screen
// fills section by section, then the camera pushes into the live counter
// and it locks. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type DeviceGrowsAroundElementId =
  | "avatar"
  | "name"
  | "badge"
  | "subtitle"
  | "grow"
  | "status"
  | "icons"
  | "price"
  | "delta"
  | "chart"
  | "tabs"
  | "card"
  | "list"
  | "flood"
  | "push"
  | "lock";

export interface DeviceGrowsAroundTimingProps {
  name?: string;
  subtitle?: string;
}

export const DEFAULT_NAME = "Launch Film";
export const DEFAULT_SUBTITLE = "Remocn Studio export";

const B = {
  avatar: 2,
  name: 6,
  nameStep: 2,
  sub: 30,
  subStep: 1,
  grow: 48,
  status: 54,
  icons: 60,
  price: 60,
  delta: 66,
  chart: 66,
  tabs: 78,
  card: 84,
  list: 90,
  flood: 96,
  push: 108,
  lock: 150,
  end: 186,
};

/** Length of the demo the scene is cut for. */
export const SCENE_END = B.end;

// Typed lines show a character every `step` frames, each tinted with the
// accent for `tint`. The card's counters run until `lock`. `push` is the
// camera's push into the card; the bezel fades from `outAt`, and a slow
// drift follows over `drift`.
export const deviceGrowsAroundTimeline = defineTimeline<
  DeviceGrowsAroundElementId,
  DeviceGrowsAroundTimingProps
>(
  ({
    name = DEFAULT_NAME,
    subtitle = DEFAULT_SUBTITLE,
  }): TimelineElement<DeviceGrowsAroundElementId>[] => {
    const nameChars = Array.from(name);
    const subChars = Array.from(subtitle);
    const badgeAt = B.name + nameChars.length * B.nameStep;
    const subStart = Math.max(B.sub, badgeAt);
    const elements: TimelineElement<DeviceGrowsAroundElementId>[] = [
      {
        id: "avatar",
        lane: "Header",
        label: "avatar",
        start: B.avatar,
        length: B.name - B.avatar,
      },
      {
        id: "name",
        lane: "Typing",
        label: name,
        start: B.name,
        length: nameChars.length * B.nameStep,
        follows: "avatar",
        beats: { step: B.nameStep, tint: 9 },
      },
      {
        id: "badge",
        lane: "Header",
        label: "badge",
        start: badgeAt,
        length: 8,
        follows: "name",
      },
      {
        id: "subtitle",
        lane: "Typing",
        label: subtitle,
        start: subStart,
        length: subChars.length * B.subStep,
        follows: "name",
        beats: { step: B.subStep, tint: 8, caretHold: 6 },
      },
      {
        id: "grow",
        lane: "Phone",
        label: "phone grows",
        start: B.grow,
        length: 18,
        beats: { caretOff: 14 },
      },
      {
        id: "status",
        lane: "Screen",
        label: "status bar",
        start: B.status,
        length: 12,
        follows: "grow",
        beats: { iconsAt: 4, icons: 10 },
      },
      {
        id: "icons",
        lane: "Header",
        label: "buttons",
        start: B.icons,
        length: 6,
        follows: "grow",
        beats: { btnAt: 2, btnStep: 2 },
      },
      {
        id: "price",
        lane: "Screen",
        label: "metric",
        start: B.price,
        length: 14,
        follows: "status",
      },
      {
        id: "delta",
        lane: "Screen",
        label: "delta",
        start: B.delta,
        length: 14,
        follows: "price",
      },
      {
        id: "chart",
        lane: "Chart",
        label: "chart",
        start: B.chart,
        length: 30,
        follows: "price",
        beats: { grid: 10 },
      },
      {
        id: "tabs",
        lane: "Screen",
        label: "tabs",
        start: B.tabs,
        length: 22,
        follows: "delta",
        beats: { step: 2, tab: 12 },
      },
      {
        id: "card",
        lane: "Card",
        label: "live counter",
        start: B.card,
        length: B.lock - B.card,
        follows: "tabs",
      },
      {
        id: "list",
        lane: "Screen",
        label: "sources",
        start: B.list,
        length: 38,
        follows: "tabs",
        beats: {
          title: 12,
          rowAt: 4,
          rowStep: 3,
          row: 14,
          barAt: 8,
          bar: 24,
        },
      },
      {
        id: "flood",
        lane: "Phone",
        label: "screen floods",
        start: B.flood,
        length: 26,
        follows: "grow",
      },
      {
        id: "push",
        lane: "Camera",
        label: "push in",
        start: B.push,
        length: 36,
        beats: { outAt: 18, out: 16, drift: B.end - B.push - 36 },
      },
      {
        id: "lock",
        lane: "Card",
        label: "lock",
        start: B.lock,
        length: 10,
        follows: "card",
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
