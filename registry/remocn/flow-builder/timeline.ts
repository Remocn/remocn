import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The builder window rising in, the nodes dropping onto the canvas one by
// one and wiring up, the cursor pressing Run, the run passing level by level
// down the graph, then the cursor pressing Publish and the toast landing.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type FlowBuilderElementId =
  | "app"
  | "header"
  | `node:${number}`
  | "cursor"
  | "run"
  | `level:${number}`
  | "publish";

export type FlowIconKind =
  | "bolt"
  | "kite"
  | "split"
  | "mail"
  | "hash"
  | "sheet";

export interface FlowStep {
  id: string;
  title: string;
  subtitle: string;
  icon: FlowIconKind;
  /** Icon tint. */
  color: string;
  /** Run time shown once the packet passes, e.g. "0.4s". */
  duration: string;
  width?: number;
  /** Ids of the nodes this one connects to. */
  next?: string[];
}

export interface FlowBuilderTimingProps {
  nodes?: readonly FlowStep[];
  stagger?: number;
}

export const DEFAULT_NODES: FlowStep[] = [
  {
    id: "signup",
    title: "New signup",
    subtitle: "Webhook · /signup",
    icon: "bolt",
    color: "#E8590C",
    duration: "0.1s",
    next: ["enrich"],
  },
  {
    id: "enrich",
    title: "Enrich lead",
    subtitle: "Company and role",
    icon: "kite",
    color: "#0E9F9A",
    duration: "1.2s",
    next: ["paths"],
  },
  {
    id: "paths",
    title: "Split by plan",
    subtitle: "2 paths",
    icon: "split",
    color: "#7A7F8C",
    duration: "12ms",
    width: 176,
    next: ["email", "notify"],
  },
  {
    id: "email",
    title: "Welcome email",
    subtitle: "Free plan · Day 0",
    icon: "mail",
    color: "#D6455D",
    duration: "0.4s",
  },
  {
    id: "notify",
    title: "Notify #growth",
    subtitle: "Pro plan · post",
    icon: "hash",
    color: "#3B82C4",
    duration: "0.3s",
  },
];

const NODE = 10;
const NODE_STEP = 6;
const CURSOR = 46;
const RUN = 72;
const LEVEL = 18;
const TRAVEL = 10;
/** The slow camera push, in frames from the start. */
const CAMERA = 205;

/** Each node's depth in the graph: roots are 0, then a level per hop. */
export function flowDepths(nodes: readonly FlowStep[]) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const parents = new Map<string, string>();
  for (const n of nodes)
    for (const id of n.next ?? []) if (!parents.has(id)) parents.set(id, n.id);
  const depth = new Map<string, number>();
  const queue = nodes.filter((n) => !parents.has(n.id)).map((n) => n.id);
  for (const id of queue) depth.set(id, 0);
  while (queue.length) {
    const id = queue.shift() as string;
    for (const nx of byId.get(id)?.next ?? []) {
      if (!depth.has(nx)) {
        depth.set(nx, (depth.get(id) ?? 0) + 1);
        queue.push(nx);
      }
    }
  }
  return depth;
}

// `app` rises the builder in on a spring, fading over `fade`, and pushes
// the camera in over its length. `header` fades the title bar in. `node:<i>`
// drops node i onto the canvas, fading over its length; the edge into it
// draws from `edge` after both its ends have dropped, over `edgeLen`. The
// nodes form a chain. `cursor` fades the cursor in. `run` is the press on
// Run, the cursor reaching it at `reach`. `level:<d>` is the run reaching
// depth d: its nodes light up, check at `check`, and the packets travel on
// over `travel`; the levels form a chain after the run. `publish` (after the
// last level) is the press on Publish: the cursor reaches it at `reach`, the
// button goes live at `live`, the toast rises from `toast` and fades in by
// `toastIn`, its check draws from `check` to `checkEnd`, and the cursor
// rests at `rest` and leaves by `leave`.
export const flowBuilderTimeline = defineTimeline<
  FlowBuilderElementId,
  FlowBuilderTimingProps
>(({ nodes = DEFAULT_NODES, stagger = NODE_STEP }) => {
  const depth = flowDepths(nodes);
  const maxDepth = Math.max(0, ...depth.values());
  const arriveAt = (d: number) => RUN + 4 + d * LEVEL;
  const checkAt = (d: number) => arriveAt(d) + 8;
  const runEnd = checkAt(maxDepth);
  const elements: TimelineElement<FlowBuilderElementId>[] = [
    {
      id: "app",
      lane: "Window",
      label: "Window",
      start: 0,
      length: CAMERA,
      beats: { fade: 12 },
    },
    { id: "header", lane: "Window", label: "Header", start: 4, length: 16 },
  ];
  nodes.forEach((n, i) => {
    elements.push({
      id: `node:${i}`,
      lane: "Nodes",
      label: n.title,
      start: NODE + i * stagger,
      length: 8,
      follows: i > 0 ? `node:${i - 1}` : undefined,
      beats: { edge: 6, edgeLen: 12 },
    });
  });
  elements.push(
    {
      id: "cursor",
      lane: "Cursor",
      label: "Cursor",
      start: CURSOR,
      length: 8,
    },
    {
      id: "run",
      lane: "Run",
      label: "Run",
      start: RUN,
      length: 4,
      beats: { reach: -2 },
    },
  );
  for (let d = 0; d <= maxDepth; d++) {
    elements.push({
      id: `level:${d}`,
      lane: "Run",
      label: nodes
        .filter((n) => (depth.get(n.id) ?? 0) === d)
        .map((n) => n.title)
        .join(", "),
      start: arriveAt(d),
      length: LEVEL,
      follows: d > 0 ? `level:${d - 1}` : "run",
      beats: { check: 8, travel: TRAVEL },
    });
  }
  elements.push({
    id: "publish",
    lane: "Run",
    label: "Publish",
    start: runEnd + 12,
    length: 42,
    follows: `level:${maxDepth}`,
    beats: {
      reach: -2,
      live: 2,
      toast: 8,
      toastIn: 18,
      check: 14,
      checkEnd: 24,
      rest: 18,
      leave: 42,
    },
  });
  return elements
    .map((e, k) => ({ e, k }))
    .sort((a, b) => a.e.start - b.e.start || a.k - b.k)
    .map(({ e }) => e);
});
