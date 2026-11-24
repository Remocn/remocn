import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The launch date: the month drawing itself as hairlines while the header
// and the day numbers settle, the days lighting up in a sweep to the launch
// day, a slow push onto it while a stroke circles it, then the grid falling
// away as the day slides into a big date lockup, the circle tightening into
// its full stop and echoing out as a halo, the other half of the date and
// the label landing over a long drift. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type LaunchDateElementId =
  | "lines"
  | "settle"
  | "header"
  | "days"
  | "sweep"
  | "push"
  | "circle"
  | "fall"
  | "drift"
  | "hand"
  | "stop"
  | "echo"
  | "other"
  | "label";

/** The date as the schedule reads it (`LaunchDateValue`). */
export interface LaunchDay {
  month: number;
  day: number;
  year: number;
}

export interface LaunchDateTimingProps {
  date?: LaunchDay;
}

export const DEFAULT_LAUNCH_DATE: LaunchDay = {
  month: 10,
  day: 30,
  year: 2026,
};

/** Day of week, 0 = Monday (Sakamoto). Pure arithmetic, no Date. */
export function weekdayOf(year: number, month: number, day: number) {
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const y = month < 3 ? year - 1 : year;
  const sun0 =
    (y +
      Math.floor(y / 4) -
      Math.floor(y / 100) +
      Math.floor(y / 400) +
      t[month - 1] +
      day) %
    7;
  return (sun0 + 6) % 7;
}

export function daysInMonth(year: number, month: number) {
  if (month === 2) {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return leap ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

// `lines` draws the grid: row line `r` at `r` × `stagger`, column line `c`
// at `colsAt` + `c` × `stagger`, each over `draw`. `settle` eases the camera
// in, `push` pushes it onto the launch day and `drift` keeps it creeping
// over the hold; they form a chain. `header` brings the month header in over
// its length and fades it from `outAt` to `out`. `days` brings row `r` of
// the day numbers in at `r` × `row` over `fade`. `sweep` lights day `d` at
// `d - 1` × `step` frames, flashing to `flashPeak` and back by `flash`, its
// lit state over `lit`. `circle` draws the stroke around the day. `fall`
// drops each cell `ripple` frames per cell of distance from the launch day
// over `drop`, the grid lines fading from `linesAt` to `lines`. `hand`
// slides the day into the lockup, `stop` tightens the circle into the full
// stop (filling from `closeAt` to `close`), `echo` rings it out (fading in
// over `fade`, the halo turning until `spin`), `other` brings the other half
// of the date in, and `label` rises line `k` at `k` × `stagger` over `rise`.
export const launchDateTimeline = defineTimeline<
  LaunchDateElementId,
  LaunchDateTimingProps
>(({ date = DEFAULT_LAUNCH_DATE }): TimelineElement<LaunchDateElementId>[] => {
  const month = Math.min(12, Math.max(1, Math.round(date.month)));
  const total = daysInMonth(date.year, month);
  const launchDay = Math.min(total, Math.max(1, Math.round(date.day)));
  const lead = weekdayOf(date.year, month, 1);
  const rows = Math.ceil((lead + total) / 7);
  const step = 28 / Math.max(1, launchDay);
  return [
    {
      id: "lines",
      lane: "Grid",
      label: "hairlines",
      start: 0,
      length: Math.max(rows * 2, 4 + 6 * 2) + 16,
      beats: { stagger: 2, colsAt: 4, draw: 16 },
    },
    { id: "settle", lane: "Camera", label: "settle", start: 0, length: 20 },
    {
      id: "header",
      lane: "Header",
      label: "header",
      start: 4,
      length: 22,
      beats: { outAt: 56, out: 80 },
    },
    {
      id: "days",
      lane: "Days",
      label: "days",
      start: 8,
      length: (rows - 1) * 2.5 + 16,
      beats: { row: 2.5, fade: 16 },
    },
    {
      id: "sweep",
      lane: "Days",
      label: "sweep",
      start: 16,
      length: (launchDay - 1) * step + 14,
      beats: { step, flashPeak: 3, flash: 14, lit: 10 },
    },
    {
      id: "push",
      lane: "Camera",
      label: "push",
      start: 20,
      length: 70,
      follows: "settle",
    },
    { id: "circle", lane: "Circle", label: "circle", start: 64, length: 26 },
    {
      id: "fall",
      lane: "Grid",
      label: "fall away",
      start: 90,
      length: 18,
      beats: { ripple: 2.2, drop: 18, linesAt: -4, lines: 14 },
    },
    {
      id: "drift",
      lane: "Camera",
      label: "drift",
      start: 90,
      length: 105,
      follows: "push",
    },
    {
      id: "hand",
      lane: "Lockup",
      label: "day to lockup",
      start: 92,
      length: 28,
    },
    {
      id: "stop",
      lane: "Circle",
      label: "full stop",
      start: 114,
      length: 22,
      beats: { closeAt: 10, close: 20 },
    },
    {
      id: "echo",
      lane: "Circle",
      label: "echo",
      start: 124,
      length: 40,
      follows: "stop",
      beats: { fade: 6, spin: 71 },
    },
    {
      id: "other",
      lane: "Lockup",
      label: "other half",
      start: 128,
      length: 24,
      follows: "hand",
    },
    {
      id: "label",
      lane: "Label",
      label: "label",
      start: 140,
      length: 6 + 24,
      follows: "other",
      beats: { stagger: 3, rise: 24 },
    },
  ];
});
