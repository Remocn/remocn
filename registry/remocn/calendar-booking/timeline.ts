import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The booking card rising in, the camera push, the cursor picking a day, a
// slot and Confirm, then the card morphing into the success view. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type CalendarBookingElementId =
  | "card"
  | "camera"
  | "cursor"
  | "day"
  | "slot"
  | "confirm"
  | "success";

const BEAT = {
  card: 0,
  cursor: 8,
  day: 34,
  slot: 66,
  confirm: 88,
};
/** A click presses from `pressIn` and releases at `pressOut`, around its frame. */
const PRESS = { pressIn: -2, pressOut: 3 };

// `card` fades the card in; the calendar's cells appear from `gridAt`, `col`
// apart along a week and `row` apart down the month, each over `cell`.
// `camera` is the first push-in. `cursor` fades the cursor in over `fadeIn`
// and starts its first leg, to the day. `day` clicks it: the card widens
// from `widenAt`, the weekday shows from `labelAt` over `label`, and the
// slots slide in from `slotsAt`, `slotStagger` apart. `slot` clicks the time
// (the cursor leaves for it at `legAt`, hovers from `hoverAt` over `hover`)
// and splits it from `splitAt`. `confirm` clicks Confirm (the cursor leaves
// for it at `legAt`): the card morphs from `morphAt`, the booking fades out
// over `bookOut` and the success view in from `doneAt` over `done`; the
// cursor leaves at `exitAt` and fades from `fadeAt` over `fade`, and a second
// push runs from `pushAt` over `push`. `success` draws the success view:
// the disc pops at `discAt`, the tick draws from `tickAt` over `tick`, and
// the rows rise from `itemsAt`, `item` apart, each over `itemRise`.
export const calendarBookingTimeline = defineTimeline<
  CalendarBookingElementId,
  object
>(() => {
  const elements: TimelineElement<CalendarBookingElementId>[] = [
    {
      id: "card",
      lane: "Card",
      label: "Card",
      start: BEAT.card,
      length: 10,
      beats: { gridAt: 3, col: 0.7, row: 1.6, cell: 10 },
    },
    { id: "camera", lane: "Camera", label: "Push-in", start: 6, length: 80 },
    {
      id: "cursor",
      lane: "Cursor",
      label: "Cursor",
      start: BEAT.cursor,
      length: BEAT.day - BEAT.cursor,
      beats: { fadeIn: 5 },
    },
    {
      id: "day",
      lane: "Cursor",
      label: "Pick a day",
      start: BEAT.day,
      length: BEAT.slot - BEAT.day,
      follows: "cursor",
      beats: {
        ...PRESS,
        widenAt: 2,
        labelAt: 8,
        label: 10,
        slotsAt: 10,
        slotStagger: 2,
      },
    },
    {
      id: "slot",
      lane: "Cursor",
      label: "Pick a time",
      start: BEAT.slot,
      length: BEAT.confirm - BEAT.slot,
      follows: "day",
      beats: { ...PRESS, legAt: -20, hoverAt: -6, hover: 4, splitAt: 1 },
    },
    {
      id: "confirm",
      lane: "Cursor",
      label: "Confirm",
      start: BEAT.confirm,
      length: 6,
      follows: "slot",
      beats: {
        ...PRESS,
        legAt: -16,
        morphAt: 2,
        bookOut: 7,
        doneAt: 7,
        done: 9,
        exitAt: 10,
        fadeAt: 22,
        fade: 10,
        pushAt: 10,
        push: 60,
      },
    },
    {
      id: "success",
      lane: "Card",
      label: "Booked",
      start: BEAT.confirm + 6,
      length: 28,
      follows: "confirm",
      beats: {
        discAt: 2,
        tickAt: 6,
        tick: 10,
        itemsAt: 4,
        item: 3,
        itemRise: 12,
      },
    },
  ];
  return elements;
});
