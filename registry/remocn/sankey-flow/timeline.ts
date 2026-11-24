import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The sankey: the stage fading up under a slow push, each source node and
// its label growing in, each flow running from its source into the target,
// then the chart settling back as the total lands and counts up, and the
// caption under it. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type SankeyFlowElementId =
  | "stage"
  | "push"
  | `node:${number}`
  | `flow:${number}`
  | "settle"
  | "land"
  | "caption";

/** A source as the schedule reads it (`SankeySource`). */
export interface FlowSource {
  label: string;
  value: number;
}

export interface SankeyFlowTimingProps {
  sources?: FlowSource[];
  stagger?: number;
  flowLength?: number;
}

export const DEFAULT_SOURCES: FlowSource[] = [
  { label: "Kitebase", value: 4100 },
  { label: "Lumen", value: 3200 },
  { label: "Fernway", value: 2400 },
  { label: "Quarry", value: 1700 },
  { label: "Halcyon", value: 1000 },
];

const NODE_START = 2;
const NODE_STAGGER = 3;
const FLOW_START = 16;
const FLOW_STAGGER = 6;
const FLOW_LEN = 34;

/** Frames from `a` to `b`, so that `a` plus it lands on `b` exactly. */
const span = (a: number, b: number) => b - a;

// `node:<i>` grows source `i` over its length, its label rising from
// `labelAt` to `label`; the nodes form a chain. `flow:<i>` runs source `i`
// into the target over its length; the flows form a chain. `settle` dims the
// chart back, `land` brings the total in (fading over `fade`, sharpening
// over `blur`, counting over its length) and `caption` rises under it; the
// first two follow the last flow, the caption follows the landing.
export const sankeyFlowTimeline = defineTimeline<
  SankeyFlowElementId,
  SankeyFlowTimingProps
>(
  ({
    sources = DEFAULT_SOURCES,
    stagger = FLOW_STAGGER,
    flowLength = FLOW_LEN,
  }) => {
    const list = sources.slice(0, 6);
    const elements: TimelineElement<SankeyFlowElementId>[] = [
      { id: "stage", lane: "Stage", label: "fade up", start: 0, length: 8 },
      { id: "push", lane: "Camera", label: "push", start: 0, length: 150 },
    ];
    list.forEach((s, i) => {
      elements.push({
        id: `node:${i}`,
        lane: "Sources",
        label: s.label,
        start: NODE_START + i * NODE_STAGGER,
        length: 16,
        follows: i > 0 ? `node:${i - 1}` : undefined,
        beats: { labelAt: 2, label: 18 },
      });
    });
    list.forEach((s, i) => {
      elements.push({
        id: `flow:${i}`,
        lane: "Flows",
        label: s.label,
        start: FLOW_START + i * stagger,
        length: flowLength,
        follows: i > 0 ? `flow:${i - 1}` : undefined,
      });
    });
    const lastFlow = FLOW_START + (list.length - 1) * stagger + flowLength;
    const HIT = lastFlow - 4;
    const leader: SankeyFlowElementId | undefined = list.length
      ? `flow:${list.length - 1}`
      : undefined;
    elements.push(
      {
        id: "settle",
        lane: "Stage",
        label: "settle",
        start: HIT - 4,
        length: span(HIT - 4, HIT + 18),
        follows: leader,
      },
      {
        id: "land",
        lane: "Total",
        label: "total",
        start: HIT,
        length: 26,
        follows: leader,
        beats: { fade: 8, blur: 14 },
      },
      {
        id: "caption",
        lane: "Total",
        label: "caption",
        start: HIT + 10,
        length: span(HIT + 10, HIT + 28),
        follows: "land",
      },
    );
    return elements.sort((a, b) => a.start - b.start);
  },
);
