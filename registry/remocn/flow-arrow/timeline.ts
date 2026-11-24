import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The stray stream passing through, the slow push, the dots flying in to
// fill the arrow, the baseline drawing, then the metric landing, the shine
// sweeping the arrow and the label. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type FlowArrowElementId =
  | "stream"
  | "push"
  | "fill"
  | "baseline"
  | "metric"
  | "shine"
  | "label";

export interface FlowArrowTimingProps {
  flight?: number;
}

const LAUNCH = 4;
const SPAN = 52;
const JITTER = 8;
const FLY = 32;

// `stream` is the strays that pass by: each starts somewhere in its first
// `spread` frames and takes `dur` plus up to `vary` frames. In `fill` each
// dot launches by its place along the arrow over `span`, plus up to
// `jitter`, flies for `flight` and settles over `settle`. The metric, the
// shine and the label follow the fill.
export const flowArrowTimeline = defineTimeline<
  FlowArrowElementId,
  FlowArrowTimingProps
>(({ flight = FLY }): TimelineElement<FlowArrowElementId>[] => {
  const hit = LAUNCH + SPAN + JITTER + flight;
  const elements: TimelineElement<FlowArrowElementId>[] = [
    {
      id: "stream",
      lane: "Stream",
      label: "strays",
      start: -14,
      length: 54 + 46 + 12,
      beats: { spread: 54, dur: 46, vary: 12 },
    },
    { id: "push", lane: "Camera", label: "push", start: 0, length: hit + 50 },
    {
      id: "fill",
      lane: "Arrow",
      label: "dots fly in",
      start: LAUNCH,
      length: SPAN + JITTER + flight,
      beats: { span: SPAN, jitter: JITTER, flight, settle: 6 },
    },
    { id: "baseline", lane: "Base", label: "baseline", start: 6, length: 54 },
    {
      id: "metric",
      lane: "Metric",
      label: "metric",
      start: hit - 6,
      length: 22,
      follows: "fill",
    },
    {
      id: "shine",
      lane: "Arrow",
      label: "shine",
      start: hit - 2,
      length: 28,
      follows: "fill",
    },
    {
      id: "label",
      lane: "Metric",
      label: "label",
      start: hit + 4,
      length: 18,
      follows: "fill",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
