import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// One day at a time: each entry rolls in as the one before rolls out, the
// gaps fitted so the last day can hold before the end. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type WeekShippedElementId = `entry:${number}`;

export interface WeekShippedTimingProps {
  entries?: { day: string; item: string }[];
  /** Frames between one day and the next. */
  beat?: number;
  /** Frames the last day holds before the end. */
  hold?: number;
}

export const DEFAULT_ENTRIES: { day: string; item: string }[] = [
  { day: "Monday,", item: "captions that keep up." },
  { day: "Tuesday,", item: "shaders you can scrub." },
  { day: "Wednesday,", item: "icons that draw themselves." },
  { day: "Thursday,", item: "vertical, from the same file." },
  { day: "Friday,", item: "renders on your own server." },
  { day: "Saturday,", item: "one tiny fix." },
  { day: "Sunday,", item: "we rested." },
];

const FIRST = 24;
const BEAT = 13;
const BREATH = 26;
const ROLL = 7;
const LAST_ROLL = 13;
const HOLD_MIN = 36;
/** The first entry's lines rise from `lead` to `rise` frames, one frame apart. */
const INTRO_LEAD = -3;
const INTRO_RISE = 11;

// Entry `k` runs until the next one takes over. Its `out` beat is when the
// previous entry has rolled away, `enter` and `roll` bound its own roll in.
// The first entry rises in over `lead` → `rise` instead.
export const weekShippedTimeline = defineTimeline<
  WeekShippedElementId,
  WeekShippedTimingProps
>(({ entries = DEFAULT_ENTRIES, beat = BEAT, hold = HOLD_MIN }, { length }) => {
  const list = entries.length > 0 ? entries : DEFAULT_ENTRIES;
  const n = list.length;
  const total = length;
  const natural = Array.from({ length: n - 1 }, (_, k) =>
    k === 0 ? FIRST : k === n - 2 && n > 2 ? BREATH : beat,
  );
  const sum = natural.reduce((s, d) => s + d, 0);
  const fit = sum > 0 ? Math.min(1, (total - hold - LAST_ROLL) / sum) : 1;
  const starts: number[] = [0];
  for (let k = 0; k < n - 1; k++)
    starts.push(starts[k] + Math.max(8, Math.round(natural[k] * fit)));

  return list.map((entry, k): TimelineElement<WeekShippedElementId> => {
    const last = k === n - 1 && n > 1;
    const roll = last ? LAST_ROLL : ROLL;
    return {
      id: `entry:${k}`,
      lane: "Days",
      label: entry.day,
      start: starts[k],
      length:
        k < n - 1 ? starts[k + 1] - starts[k] : Math.max(0, total - starts[k]),
      follows: k > 0 ? `entry:${k - 1}` : undefined,
      beats:
        k === 0
          ? { lead: INTRO_LEAD, rise: INTRO_RISE }
          : { out: roll * 0.5, enter: roll * 0.35, roll },
    };
  });
});
