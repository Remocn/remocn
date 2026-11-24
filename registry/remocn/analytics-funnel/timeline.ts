import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The funnel dashboard: the panel rises, the bars grow one after another, a
// cursor clicks the variant toggle and each bar morphs to the variant, the
// uplift badge pops, the cursor moves onto a bar and its tooltip opens, then
// the cursor fades out while the camera pushes in the whole time. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type AnalyticsFunnelElementId =
  | "panel"
  | `bar:${number}`
  | "camera"
  | "cursor"
  | "click"
  | `morph:${number}`
  | "hover"
  | "badge"
  | "tip"
  | "leave";

export interface FunnelStep {
  label: string;
  event: string;
  control: number;
  variant: number;
}

export interface AnalyticsFunnelTimingProps {
  steps?: FunnelStep[];
}

export const DEFAULT_STEPS: FunnelStep[] = [
  {
    label: "Visit",
    event: "Viewed landing page",
    control: 18420,
    variant: 18420,
  },
  { label: "Sign up", event: "Signed up", control: 7920, variant: 8288 },
  {
    label: "Activate",
    event: "Created first project",
    control: 4277,
    variant: 5304,
  },
  { label: "Pay", event: "Started subscription", control: 1540, variant: 1820 },
];

const T = {
  win: 0,
  bars: 8,
  cursorIn: 26,
  click: 50,
  morph: 56,
  badge: 74,
  toHover: 70,
  tip: 96,
  end: 165,
};
/** Frames between one bar (or one bar's morph) and the next. */
const STAGGER = 3;

// The panel fades in over its length and springs up; the headline, total and
// stats rise on its beats. A bar grows on a spring from its start, its label
// fades in from `labelAt`. The click presses `pressAt` before it and flips
// the toggle `toggleAt` after. A morph springs the bar to the variant and
// draws its control line from `ghostAt` to `ghostEnd`. The tooltip's rows
// fill `rowStep` apart from `rowAt`. The camera pushes in until the end.
export const analyticsFunnelTimeline = defineTimeline<
  AnalyticsFunnelElementId,
  AnalyticsFunnelTimingProps
>(({ steps = DEFAULT_STEPS }): TimelineElement<AnalyticsFunnelElementId>[] => {
  const elements: TimelineElement<AnalyticsFunnelElementId>[] = [
    {
      id: "panel",
      lane: "Panel",
      label: "dashboard",
      start: T.win,
      length: 10,
      beats: {
        headAt: 4,
        headEnd: 16,
        bigAt: 6,
        bigEnd: 20,
        totalAt: 8,
        totalEnd: 22,
        statAt: 12,
        statEnd: 24,
        statStep: 3,
      },
    },
  ];
  steps.forEach((st, i) => {
    elements.push({
      id: `bar:${i}`,
      lane: "Bars",
      label: st.label,
      start: T.bars + i * STAGGER,
      length: 18,
      follows: i > 0 ? `bar:${i - 1}` : undefined,
      beats: { labelAt: 6 },
    });
  });
  elements.push(
    {
      id: "camera",
      lane: "Camera",
      label: "push in",
      start: 20,
      length: T.end - 20,
    },
    {
      id: "cursor",
      lane: "Cursor",
      label: "cursor in",
      start: T.cursorIn,
      length: 6,
    },
    {
      id: "click",
      lane: "Cursor",
      label: "toggle variant",
      start: T.click,
      length: T.morph - T.click,
      follows: "cursor",
      beats: { pressAt: -3, toggleAt: 2 },
    },
  );
  steps.forEach((st, i) => {
    elements.push({
      id: `morph:${i}`,
      lane: "Morph",
      label: st.label,
      start: T.morph + i * STAGGER,
      length: 16,
      follows: i > 0 ? `morph:${i - 1}` : "click",
      beats: { ghostAt: 6, ghostEnd: 16, legendAt: 4, legendEnd: 14 },
    });
  });
  elements.push(
    {
      id: "hover",
      lane: "Cursor",
      label: "hover bar",
      start: T.toHover,
      length: T.tip - T.toHover,
      follows: "click",
    },
    {
      id: "badge",
      lane: "Badge",
      label: "uplift",
      start: T.badge,
      length: 10,
      follows: "click",
    },
    {
      id: "tip",
      lane: "Tooltip",
      label: "tooltip",
      start: T.tip,
      length: 8,
      follows: "hover",
      beats: { rowAt: 6, rowStep: 3 },
    },
    {
      id: "leave",
      lane: "Cursor",
      label: "cursor out",
      start: T.end - 20,
      length: 10,
      follows: "tip",
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
