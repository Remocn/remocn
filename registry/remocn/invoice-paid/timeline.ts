import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The invoice's life: the document and its panel rise, a cursor clicks Send,
// the invoice is viewed, then paid, the PAID stamp lands on the document and
// the payout notification drops in. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type InvoicePaidElementId =
  | "doc"
  | "panel"
  | "cursor"
  | "send"
  | "viewed"
  | "paid"
  | "stamp"
  | "payout";

/** The scene's timing does not depend on its props. */
export type InvoicePaidTimingProps = object;

const T = {
  send: 40,
  viewed: 66,
  paid: 92,
  stamp: 100,
  payout: 128,
};

// `doc` and `panel` rise on springs; their rows rise `rowStep` apart from
// `rowAt` to `rowEnd`. `send` is the click: the cursor's waypoints, the
// press release, the button swap and the timeline reaching "Sent" are its
// beats. `viewed` and `paid` move the status on; the stamp lands and knocks
// the page from `knockAt` to `knockEnd`.
export const invoicePaidTimeline = defineTimeline<
  InvoicePaidElementId,
  InvoicePaidTimingProps
>((): TimelineElement<InvoicePaidElementId>[] => [
  {
    id: "doc",
    lane: "Invoice",
    label: "invoice",
    start: 0,
    length: 10,
    beats: { rowAt: 8, rowEnd: 20, rowStep: 3 },
  },
  {
    id: "panel",
    lane: "Panel",
    label: "panel",
    start: 6,
    length: 12,
    beats: { rowAt: 6, rowEnd: 18, rowStep: 3 },
  },
  {
    id: "cursor",
    lane: "Cursor",
    label: "cursor in",
    start: 14,
    length: 6,
  },
  {
    id: "send",
    lane: "Status",
    label: "sent",
    start: T.send,
    length: T.viewed - T.send,
    follows: "cursor",
    beats: {
      arriveAt: -2,
      release: 4,
      pillAt: 2,
      swapAt: 2,
      swapEnd: 10,
      reachAt: 4,
      leaveAt: 8,
      fadeOutAt: 20,
      fadeOutEnd: 28,
      awayAt: 30,
    },
  },
  {
    id: "viewed",
    lane: "Status",
    label: "viewed",
    start: T.viewed,
    length: T.paid - T.viewed,
    follows: "send",
  },
  {
    id: "paid",
    lane: "Status",
    label: "paid",
    start: T.paid,
    length: 8,
    follows: "viewed",
  },
  {
    id: "stamp",
    lane: "Invoice",
    label: "PAID stamp",
    start: T.stamp,
    length: 6,
    follows: "paid",
    beats: { fade: 3, knockAt: 3, knockEnd: 6 },
  },
  {
    id: "payout",
    lane: "Notification",
    label: "payout",
    start: T.payout,
    length: 10,
    follows: "stamp",
  },
]);
