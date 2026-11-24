import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The camera push, each ridge's baseline drawing in with its label, the axis
// fading in, the grey ridges rising one after another, the highlight ridge
// rising (the greys quieting under it), the highlight sliding right, and the
// hero stat landing with its caption. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type RidgelineElementId =
  | "push"
  | `row:${number}`
  | "axis"
  | `rise:${number}`
  | "highlight"
  | "shift"
  | "stat";

export interface RidgelineTimingProps {
  labels?: string[];
  highlightLabel?: string;
  stagger?: number;
}

export const DEFAULT_LABELS = ["2020", "2021", "2022", "2023", "2024", "2025"];

const BASE_AT = 0;
const BASE_STAGGER = 3;
const BASE_DRAW = 22;
export const RISE_STAGGER = 7;
const RISE_AT = 12;
/** About how long a grey ridge's spring takes to settle. */
const GREY_RISE = 24;
const ACCENT_RISE = 58;
const SHIFT = [62, 100] as const;
const HIT = 96;

/** The grey rows: the first six labels. */
export function greysOf(labels: string[]) {
  return labels.slice(0, 6);
}

// `row:<i>` draws ridge `i`'s baseline (the highlight is the last row) and
// slides its label in from `labelIn` to `labelShown`; a chain. `rise:<i>`
// springs grey ridge `i` up, also a chain. `highlight` springs the highlight
// ridge up while the greys quiet over its length. `stat` fades the value in
// over `fade` and the caption from `captionAt` to `captionEnd`.
export const ridgelineTimeline = defineTimeline<
  RidgelineElementId,
  RidgelineTimingProps
>(
  ({
    labels = DEFAULT_LABELS,
    highlightLabel = "With remocn",
    stagger = RISE_STAGGER,
  }) => {
    const greys = greysOf(labels);
    const n = greys.length + 1;
    const elements: TimelineElement<RidgelineElementId>[] = [
      {
        id: "push",
        lane: "Camera",
        label: "Push",
        start: 0,
        length: HIT + 30,
      },
      ...Array.from(
        { length: n },
        (_, i): TimelineElement<RidgelineElementId> => ({
          id: `row:${i}`,
          lane: "Baselines",
          label: i === n - 1 ? highlightLabel : greys[i],
          start: BASE_AT + i * BASE_STAGGER,
          length: BASE_DRAW,
          follows: i > 0 ? `row:${i - 1}` : undefined,
          beats: { labelIn: 4, labelShown: 18 },
        }),
      ),
      { id: "axis", lane: "Axis", label: "Axis", start: 10, length: 20 },
      ...greys.map(
        (g, i): TimelineElement<RidgelineElementId> => ({
          id: `rise:${i}`,
          lane: "Ridges",
          label: g,
          start: RISE_AT + i * stagger,
          length: GREY_RISE,
          follows: i > 0 ? `rise:${i - 1}` : undefined,
        }),
      ),
      {
        id: "highlight",
        lane: "Ridges",
        label: highlightLabel,
        start: ACCENT_RISE,
        length: 24,
      },
      {
        id: "shift",
        lane: "Shift",
        label: "Shift",
        start: SHIFT[0],
        length: SHIFT[1] - SHIFT[0],
      },
      {
        id: "stat",
        lane: "Stat",
        label: "Stat",
        start: HIT,
        length: 26,
        beats: { fade: 8, captionAt: 8, captionEnd: 26 },
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
