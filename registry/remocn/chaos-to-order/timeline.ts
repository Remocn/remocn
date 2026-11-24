import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Windows, notes and toasts drop onto the pile one after another while the
// unread counter climbs, then the pile is pulled into the product window,
// which springs up and fills its rows. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type ChaosToOrderElementId =
  | `piece:${number}`
  | "unread"
  | "pull"
  | "app";

export interface ChaosToOrderTimingProps {
  items?: string[];
  hold?: number;
}

export const DEFAULT_ITEMS = [
  "#launch-war-room",
  "Q4 roadmap v7 FINAL.xlsx",
  "Inbox",
  "Launch plan (draft 3)",
  "Pricing · Kitebase",
  "fix onboarding!!",
  "Payment failed",
  "who owns billing??",
  "Standup in 2 min",
  "14 new comments",
  "ship by Fri???",
  "Build #482 failed",
  "call Maya re: assets",
  "3 unread in #design",
];

/** Frame each piece of the pile drops in, in pile order. */
const DROPS = [-3, 6, 11, 16, 20, 24, 27, 30, 32, 34, 36, 37.5, 39, 40];
export const PIECE_COUNT = DROPS.length;
const DROP = 18;
export const DEFAULT_HOLD = 56;
const PULL_LEN = 18;
/** The pieces leave over this many frames, far ones first. */
const SPREAD = 5;
/** Frames after the pull starts that the pieces are still drawn. */
const PULL_TAIL = PULL_LEN + 6;
/** The camera settles back this long after the pull starts. */
const SETTLE = PULL_LEN + 10;
const APP_LEAD = 10;
const APP = 32;

// A piece's own motion is its drop. The pull runs from `hold` until the
// last piece is gone; the camera settles over its `settle` beat. The product
// window springs up `APP_LEAD` frames into the pull, its rows entering
// `rows` frames later, `stagger` apart.
export const chaosToOrderTimeline = defineTimeline<
  ChaosToOrderElementId,
  ChaosToOrderTimingProps
>(({ items = DEFAULT_ITEMS, hold = DEFAULT_HOLD }) => {
  const elements: TimelineElement<ChaosToOrderElementId>[] = DROPS.map(
    (d, i) => ({
      id: `piece:${i}` as const,
      lane: "Pile",
      label: items[i] ?? DEFAULT_ITEMS[i],
      start: d,
      length: DROP,
      follows: i > 0 ? (`piece:${i - 1}` as const) : undefined,
    }),
  );
  elements.push(
    {
      id: "unread",
      lane: "Unread",
      label: "Unread count climbs",
      start: 6,
      length: Math.max(7, hold - 4) - 6,
    },
    {
      id: "pull",
      lane: "Pull",
      label: "Pulled into the app",
      start: hold,
      length: PULL_TAIL,
      beats: { pull: PULL_LEN, spread: SPREAD, settle: SETTLE },
    },
    {
      id: "app",
      lane: "App",
      label: "App springs up",
      start: hold + APP_LEAD,
      length: APP,
      follows: "pull",
      beats: { rows: 3, stagger: 1.3 },
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
