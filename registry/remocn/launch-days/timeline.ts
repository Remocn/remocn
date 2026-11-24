import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The header fades down and the day cards rise one after another, then the
// active day's card opens wide and writes in: number, eyebrow, the title
// word by word, the description. With `from`, the cards stand from the start
// and the open day closes while the active one opens. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type LaunchDaysElementId =
  | "header"
  | `card:${number}`
  | "exit"
  | "open"
  | "number"
  | "eyebrow"
  | `word:${number}`
  | "description";

export interface LaunchDay {
  day: string;
  title: string;
  description?: string;
}

export interface LaunchDaysTimingProps {
  days?: LaunchDay[];
  active?: number;
  from?: number;
  stagger?: number;
}

export const DEFAULT_DAYS: LaunchDay[] = [
  {
    day: "Mon",
    title: "Captions",
    description: "31 transcript-driven caption styles.",
  },
  {
    day: "Tue",
    title: "Transitions",
    description: "Cuts that land on the beat.",
  },
  {
    day: "Wed",
    title: "Templates",
    description:
      "Whole launch films, installed into your project and yours to edit.",
  },
  {
    day: "Thu",
    title: "Agent skill",
    description: "Your agent reads the docs and picks the beat.",
  },
  {
    day: "Fri",
    title: "Studio",
    description: "Preview every scene before it renders.",
  },
];

const STAGGER = 3;
/** The card lift spring settles in this many frames. */
const RISE = 16;

/** The days on the strip: at least two, at most seven. */
export function launchDaysList(days: LaunchDay[]) {
  return days.length >= 2 ? days.slice(0, 7) : DEFAULT_DAYS;
}

/** The open day, and the day it swaps from (`null` without a swap). */
export function launchDaysPicks(n: number, active: number, from?: number) {
  const act = Math.min(Math.max(0, Math.round(active)), n - 1);
  const swap =
    from !== undefined && Math.round(from) !== act
      ? Math.min(Math.max(0, Math.round(from)), n - 1)
      : null;
  return { act, swap };
}

// `header` fades the header in. `card:<i>` lifts card `i` in, 2 frames
// after the one before; a chain (not with a swap: the cards stand). `exit`
// writes the day being swapped from out, its parts `stagger` apart (only
// with a swap). `open` morphs the strip over its length; the active card
// lights from `litAt` over `lit`, the swapped-from card goes dark over
// `unlit`. `number` and `eyebrow` fade in, `word:<k>` writes title word
// `k`, `stagger` after the one before; a chain. `description` follows.
export const launchDaysTimeline = defineTimeline<
  LaunchDaysElementId,
  LaunchDaysTimingProps
>(({ days = DEFAULT_DAYS, active = 2, from, stagger = STAGGER }) => {
  const list = launchDaysList(days);
  const { act, swap } = launchDaysPicks(list.length, active, from);
  const words = list[act].title.split(/\s+/).filter(Boolean);
  const elements: TimelineElement<LaunchDaysElementId>[] = [
    { id: "header", lane: "Header", label: "Header", start: 0, length: 18 },
  ];
  if (swap === null) {
    list.forEach((d, i) => {
      elements.push({
        id: `card:${i}`,
        lane: "Cards",
        label: d.day,
        start: i * 2,
        length: RISE,
        follows: i > 0 ? `card:${i - 1}` : undefined,
      });
    });
  } else {
    elements.push({
      id: "exit",
      lane: "Exit",
      label: list[swap].title,
      start: 6,
      length: 10,
      beats: { stagger: 2 },
    });
  }
  elements.push(
    {
      id: "open",
      lane: "Strip",
      label: list[act].day,
      start: 14,
      length: 28,
      beats: { litAt: 2, lit: 24, unlit: 22 },
    },
    { id: "number", lane: "Number", label: "Number", start: 24, length: 20 },
    { id: "eyebrow", lane: "Eyebrow", label: "Eyebrow", start: 26, length: 16 },
    ...words.map(
      (word, k): TimelineElement<LaunchDaysElementId> => ({
        id: `word:${k}`,
        lane: "Title",
        label: word,
        start: 30 + k * stagger,
        length: 18,
        follows: k > 0 ? `word:${k - 1}` : undefined,
      }),
    ),
    {
      id: "description",
      lane: "Description",
      label: list[act].description ?? "",
      start: 40 + words.length * 3,
      length: 20,
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
