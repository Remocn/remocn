import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A grid fades in, its walls rise one by one, the two markers pop, then the
// search floods outward cell by cell until it reaches the goal, the route
// draws back and the flood fades to a residue. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type PathSearchElementId =
  | "camera"
  | "ground"
  | "grid"
  | `wall:${number}`
  | "markers"
  | "flood"
  | "arrive"
  | "trace"
  | "fade";

export interface PathSearchWall {
  col: number;
  row: number;
  w: number;
  h: number;
}

export interface PathSearchTimingProps {
  cols?: number;
  rows?: number;
  start?: [number, number];
  goal?: [number, number];
  walls?: PathSearchWall[];
  floodStep?: number;
  trace?: number;
}

export const DEFAULT_WALLS: PathSearchWall[] = [
  { col: 4, row: 0, w: 1, h: 6 },
  { col: 8, row: 3, w: 1, h: 6 },
  { col: 12, row: 0, w: 1, h: 5 },
  { col: 9, row: 3, w: 2, h: 1 },
];
export const DEFAULT_START: [number, number] = [1, 4];
export const DEFAULT_GOAL: [number, number] = [15, 4];

const MARK_AT = 10;
const FLOOD_AT = 22;
const STEP = 1.45;
const TRACE = 32;

export type PathSearchCell = [number, number];

const DIRS: PathSearchCell[] = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];

/** Breadth-first search from `start`: distances, walls and the found route. */
export function search(
  cols: number,
  rows: number,
  start: PathSearchCell,
  goal: PathSearchCell,
  walls: PathSearchWall[],
) {
  const blocked = new Set<number>();
  for (const w of walls) {
    for (let c = w.col; c < w.col + w.w; c++) {
      for (let r = w.row; r < w.row + w.h; r++) blocked.add(r * cols + c);
    }
  }
  const idx = (c: number, r: number) => r * cols + c;
  const distArr = new Array<number>(cols * rows).fill(-1);
  const s = idx(start[0], start[1]);
  const g = idx(goal[0], goal[1]);
  blocked.delete(s);
  blocked.delete(g);
  distArr[s] = 0;
  const queue = [s];
  for (let qi = 0; qi < queue.length; qi++) {
    const cur = queue[qi];
    if (cur === g) break;
    const c = cur % cols;
    const r = Math.floor(cur / cols);
    for (const [dc, dr] of DIRS) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      const ni = idx(nc, nr);
      if (blocked.has(ni) || distArr[ni] >= 0) continue;
      distArr[ni] = distArr[cur] + 1;
      queue.push(ni);
    }
  }
  const dGoal = distArr[g];
  const path: PathSearchCell[] = [];
  if (dGoal > 0) {
    let c = goal[0];
    let r = goal[1];
    let dir: PathSearchCell = [0, 0];
    path.push([c, r]);
    while (distArr[idx(c, r)] > 0) {
      const here = distArr[idx(c, r)];
      const options = DIRS.filter(([dc, dr]) => {
        const nc = c + dc;
        const nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) return false;
        return distArr[idx(nc, nr)] === here - 1;
      });
      const keep = options.find(([dc, dr]) => dc === dir[0] && dr === dir[1]);
      dir = keep ?? options[0];
      c += dir[0];
      r += dir[1];
      path.push([c, r]);
    }
  }
  return { blocked, distArr, dGoal, path };
}

// The camera pushes in over the whole search and the ground glow drifts over
// 150 frames, each on its own lane. A wall rises over 14 frames, each
// following the one before. `markers` pops the start marker, the goal marker
// `goal` frames later and their labels at `startLabel` / `goalLabel`, each
// over `label`. The flood reaches a cell `step` frames per step of distance;
// a cell rises over `rise`, then cools between `peak` and `cool`. `arrive` is
// the goal ringing, `trace` the route drawing, and `fade` the flood dimming
// `ripple` frames per step of distance, each cell over `fade`.
export const pathSearchTimeline = defineTimeline<
  PathSearchElementId,
  PathSearchTimingProps
>(
  ({
    cols = 17,
    rows = 9,
    start = DEFAULT_START,
    goal = DEFAULT_GOAL,
    walls = DEFAULT_WALLS,
    floodStep = STEP,
    trace: traceDur = TRACE,
  }) => {
    const { dGoal } = search(cols, rows, start, goal, walls);
    const reach = FLOOD_AT + Math.max(0, dGoal) * floodStep;
    const traceAt = reach + 6;
    const fadeAt = traceAt + traceDur - 6;
    const doneAt = fadeAt + 22;

    const elements: TimelineElement<PathSearchElementId>[] = [
      {
        id: "camera",
        lane: "Camera",
        label: "push in",
        start: 0,
        length: doneAt + 20,
      },
      { id: "ground", lane: "Ground", label: "drift", start: 0, length: 150 },
      { id: "grid", lane: "Grid", label: "grid", start: 0, length: 14 },
      ...walls.map(
        (w, i): TimelineElement<PathSearchElementId> => ({
          id: `wall:${i}`,
          lane: "Walls",
          label: `wall ${w.col},${w.row}`,
          start: 3 + i * 3,
          length: 14,
          follows: i > 0 ? `wall:${i - 1}` : undefined,
        }),
      ),
      {
        id: "markers",
        lane: "Markers",
        label: "start and goal",
        start: MARK_AT,
        length: 21,
        beats: { goal: 3, startLabel: 4, goalLabel: 7, label: 14 },
      },
      {
        id: "flood",
        lane: "Search",
        label: "flood",
        start: FLOOD_AT,
        length: Math.max(0, dGoal) * floodStep,
        beats: { step: floodStep, rise: 4, peak: 3, cool: 16 },
      },
      {
        id: "arrive",
        lane: "Search",
        label: "goal reached",
        start: reach,
        length: 6,
        follows: "flood",
      },
      {
        id: "trace",
        lane: "Search",
        label: "route",
        start: traceAt,
        length: traceDur,
        follows: "arrive",
      },
      {
        id: "fade",
        lane: "Search",
        label: "flood fades",
        start: fadeAt,
        length: Math.max(0, dGoal) * 0.35 + 16,
        follows: "trace",
        beats: { ripple: 0.35, fade: 16 },
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
