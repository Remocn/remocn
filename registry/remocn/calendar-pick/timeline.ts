import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The calendar pick: the card tilting in, the days filling in row by row
// under the title, the camera zooming onto the day, the pointer flying in
// and clicking it, the day opening into an input that types the time range,
// then the event committing, the day flooding with the accent and its label
// landing as the camera pulls back. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type CalendarPickElementId =
  | "enter"
  | "days"
  | "title"
  | "zoom"
  | "cursor"
  | "click"
  | "open"
  | "type"
  | "commit"
  | "flood"
  | "label"
  | "pull";

export interface CalendarPickTimingProps {
  firstWeekday?: number;
  daysInMonth?: number;
  timeRange?: string;
}

export const DEFAULT_TIME_RANGE = "10:00 AM – 4:00 PM";

const B = {
  enter: -8,
  rows: 0,
  title: 6,
  zoom: 24,
  cursor: 42,
  click: 66,
  open: 70,
  type: 78,
  commit: 120,
  flood: 122,
  label: 130,
  pull: 132,
  end: 168,
};

// `enter` tilts the card in, fading it from `fadeAt` over `fade` and
// sharpening it over `blur`. `days` brings day `d` in at its `row` × `row`
// + its column × `col` frames, each over `fade`. `title` fades the title in.
// `zoom` moves the camera onto the picked day. The interaction is a chain:
// `cursor` flies the pointer in (fading over `fade`), `click` presses the
// day (back up at `up`, the ripple over its length), `open` opens the input
// (its text fading from `textAt` over `text`), `type` types one character
// every `step` frames (the return key fading from `keyAt` over `key`),
// `commit` closes the input and sends the pointer off (fading from `fadeAt`
// over `fade`), `flood` fills the day, `label` brings the event label in and
// `pull` pulls the camera back, then drifts in from `driftAt` over `drift`.
export const calendarPickTimeline = defineTimeline<
  CalendarPickElementId,
  CalendarPickTimingProps
>(
  ({
    firstWeekday = 0,
    daysInMonth = 30,
    timeRange = DEFAULT_TIME_RANGE,
  }): TimelineElement<CalendarPickElementId>[] => {
    const lead = ((firstWeekday % 7) + 7) % 7;
    const rows = Math.ceil((lead + daysInMonth) / 7);
    return [
      {
        id: "enter",
        lane: "Card",
        label: "enter",
        start: B.enter,
        length: 15,
        beats: { fadeAt: 2, fade: 8, blur: 15 },
      },
      {
        id: "days",
        lane: "Days",
        label: "days",
        start: B.rows,
        length: (rows - 1) * 2 + 6 * 0.5 + 12,
        beats: { row: 2, col: 0.5, fade: 12 },
      },
      {
        id: "title",
        lane: "Title",
        label: "title",
        start: B.title,
        length: 15,
      },
      { id: "zoom", lane: "Camera", label: "zoom", start: B.zoom, length: 36 },
      {
        id: "cursor",
        lane: "Pointer",
        label: "pointer in",
        start: B.cursor,
        length: 24,
        beats: { fade: 4 },
      },
      {
        id: "click",
        lane: "Pointer",
        label: "click",
        start: B.click,
        length: 18,
        follows: "cursor",
        beats: { up: 4 },
      },
      {
        id: "open",
        lane: "Input",
        label: "open",
        start: B.open,
        length: B.type - B.open,
        follows: "click",
        beats: { textAt: 4, text: 8 },
      },
      {
        id: "type",
        lane: "Input",
        label: timeRange,
        start: B.type,
        length: timeRange.length * 2,
        follows: "open",
        beats: { step: 2, keyAt: 30, key: 8 },
      },
      {
        id: "commit",
        lane: "Input",
        label: "commit",
        start: B.commit,
        length: 18,
        follows: "type",
        beats: { fadeAt: 6, fade: 9 },
      },
      {
        id: "flood",
        lane: "Day",
        label: "flood",
        start: B.flood,
        length: B.label - B.flood,
        follows: "commit",
      },
      {
        id: "label",
        lane: "Day",
        label: "event label",
        start: B.label,
        length: 12,
        follows: "flood",
      },
      {
        id: "pull",
        lane: "Camera",
        label: "pull back",
        start: B.pull,
        length: B.end - B.pull,
        follows: "label",
        beats: { driftAt: 20, drift: B.end - B.pull - 20 },
      },
    ];
  },
);
