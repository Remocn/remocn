import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The notification avalanche: the phone rises, the counter and its caption
// come in, notifications land faster and faster, the stack compresses while
// the counter runs away, everything is swiped off and the inbox-clear mark
// and copy settle. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type NotificationAvalancheElementId =
  | "phone"
  | "count"
  | "caption"
  | `notification:${number}`
  | "compress"
  | "swipe"
  | "clear";

/** The scene's timing does not depend on its props. */
export type NotificationAvalancheTimingProps = object;

const SWIPE = 66;
const CLEAR = SWIPE + 7;

// Each notification lands sooner after the last, down to every 2.5 frames.
const ARRIVE: number[] = (() => {
  const out: number[] = [];
  for (let t = 8, i = 0; t < SWIPE - 4; i++) {
    out.push(Math.round(t));
    t += Math.max(2.5, 14 * 0.66 ** i);
  }
  return out;
})();
const COMPRESS = ARRIVE[3] + 2;

export const notificationAvalancheTimeline = defineTimeline<
  NotificationAvalancheElementId,
  NotificationAvalancheTimingProps
>(() => {
  const elements: TimelineElement<NotificationAvalancheElementId>[] = [
    { id: "phone", lane: "Stage", label: "phone rises", start: 0, length: 14 },
    { id: "count", lane: "Copy", label: "counter", start: 2, length: 12 },
    { id: "caption", lane: "Copy", label: "caption", start: 6, length: 12 },
  ];
  ARRIVE.forEach((at, i) => {
    elements.push({
      id: `notification:${i}`,
      lane: "Notifications",
      label: `notification ${i + 1}`,
      start: at,
      length: (ARRIVE[i + 1] ?? SWIPE) - at,
      follows: i > 0 ? `notification:${i - 1}` : undefined,
    });
  });
  elements.push(
    {
      id: "compress",
      lane: "Stack",
      label: "stack compresses",
      start: COMPRESS,
      length: SWIPE - COMPRESS,
      follows: "notification:3",
      // The counter starts running away `count` after the stack compresses.
      beats: { count: 2 },
    },
    {
      id: "swipe",
      lane: "Stack",
      label: "swipe away",
      start: SWIPE,
      length: CLEAR - SWIPE,
      follows: `notification:${ARRIVE.length - 1}`,
      beats: {
        // Each card leaves over `card`, `stagger` after the one above it.
        card: 8,
        stagger: 0.75,
        // The counter stops at `countEnd` and leaves from `out` to `outEnd`;
        // the buzz fades from `buzzFade` to `buzzEnd`.
        countEnd: -4,
        out: -2,
        outEnd: 6,
        buzzFade: -8,
        buzzEnd: -2,
        // The camera starts to pull back at `pullBack`.
        pullBack: 2,
      },
    },
    {
      id: "clear",
      lane: "Clear",
      label: "all caught up",
      start: CLEAR,
      length: 60,
      follows: "swipe",
      beats: {
        draw: 2,
        drawEnd: 14,
        title: 14,
        sub: 5,
        subEnd: 19,
        rule: 8,
        ruleEnd: 24,
        settle: 14,
        drift: 60,
      },
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
