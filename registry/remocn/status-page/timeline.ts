import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The status page: the card rises, each service row fills its 90 bars, the
// banner resolves to operational, then a cursor hovers one incident, moves
// to a second and leaves while the camera pushes in and pulls back out.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type StatusPageElementId =
  | "card"
  | `row:${number}`
  | "resolve"
  | "cursor"
  | "push"
  | `hover:${number}`
  | "leave"
  | "pull";

export interface StatusIncident {
  day: number;
  level?: "degraded" | "outage";
  title?: string;
  minutes?: number;
  date?: string;
}

export interface StatusComponent {
  name: string;
  uptime: number;
  incidents?: StatusIncident[];
}

export interface StatusPageTimingProps {
  components?: StatusComponent[];
}

export const DEFAULT_COMPONENTS: StatusComponent[] = [
  {
    name: "API",
    uptime: 99.98,
    incidents: [
      {
        day: 69,
        level: "degraded",
        title: "Elevated latency",
        minutes: 12,
        date: "Oct 3",
      },
    ],
  },
  {
    name: "Studio",
    uptime: 99.99,
    incidents: [{ day: 41, level: "degraded", minutes: 6, date: "Sep 5" }],
  },
  {
    name: "Render farm",
    uptime: 99.91,
    incidents: [
      {
        day: 23,
        level: "outage",
        title: "Partial outage",
        minutes: 47,
        date: "Aug 18",
      },
      { day: 69, level: "degraded", minutes: 18, date: "Oct 3" },
    ],
  },
  { name: "Registry CDN", uptime: 100 },
  {
    name: "Docs",
    uptime: 99.99,
    incidents: [{ day: 55, level: "degraded", minutes: 4, date: "Sep 19" }],
  },
];

const B = {
  card: 0,
  bars: 8,
  resolve: 54,
  cursor: 64,
  pushIn: 70,
  hoverA: 92,
  moveB: 134,
  hoverB: 156,
  leave: 196,
  pullOut: 198,
};
/** Frames between one service row starting and the next. */
const ROW_STAGGER = 5;

// A row runs until its uptime figure settles; its name rises from `rowAt`
// to `rowEnd`, and its bars pop in `barStep` apart, each coloring over
// `barIn`. The cursor chain: it fades in and travels to the first incident,
// `hover:0` opens the tooltip with a click, `hover:1` moves to the second
// incident and clicks after `click`, `leave` closes the tooltip and fades
// the cursor out. `push` and `pull` are the camera.
export const statusPageTimeline = defineTimeline<
  StatusPageElementId,
  StatusPageTimingProps
>(
  ({
    components = DEFAULT_COMPONENTS,
  }): TimelineElement<StatusPageElementId>[] => {
    const elements: TimelineElement<StatusPageElementId>[] = [
      { id: "card", lane: "Card", label: "card", start: B.card, length: 12 },
    ];
    components.forEach((comp, r) => {
      elements.push({
        id: `row:${r}`,
        lane: "Rows",
        label: comp.name,
        start: B.bars + r * ROW_STAGGER,
        length: 40,
        follows: r > 0 ? `row:${r - 1}` : undefined,
        beats: { rowAt: -2, rowEnd: 10, settleAt: 2, barStep: 0.32, barIn: 8 },
      });
    });
    elements.push(
      {
        id: "resolve",
        lane: "Banner",
        label: "operational",
        start: B.resolve,
        length: 12,
        beats: { checkAt: 3, checkEnd: 12 },
      },
      {
        id: "cursor",
        lane: "Cursor",
        label: "cursor in",
        start: B.cursor,
        length: 8,
      },
      {
        id: "push",
        lane: "Camera",
        label: "push in",
        start: B.pushIn,
        length: B.hoverA + 6 - B.pushIn,
      },
      {
        id: "hover:0",
        lane: "Cursor",
        label: "first incident",
        start: B.hoverA,
        length: B.moveB - B.hoverA,
        follows: "cursor",
      },
      {
        id: "hover:1",
        lane: "Cursor",
        label: "second incident",
        start: B.moveB,
        length: B.leave - B.moveB,
        follows: "hover:0",
        beats: { swapAt: 4, swapEnd: 14, click: B.hoverB - B.moveB },
      },
      {
        id: "leave",
        lane: "Cursor",
        label: "leave",
        start: B.leave,
        length: 18,
        follows: "hover:1",
        beats: { tipOut: 7, fadeAt: 10, fadeEnd: 18 },
      },
      {
        id: "pull",
        lane: "Camera",
        label: "pull out",
        start: B.pullOut,
        length: 22,
        follows: "leave",
      },
    );
    return elements.sort((a, b) => a.start - b.start);
  },
);
