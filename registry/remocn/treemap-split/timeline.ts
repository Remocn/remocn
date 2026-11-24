import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The treemap: the stage fading in under a slow push, the root block
// splitting in two, each half splitting again down to one cell per item,
// then the highlighted cell filling with the accent while its figure counts
// up and the rest dims. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type TreemapSplitElementId = "enter" | "push" | "splits" | "accent";

/** An item as the schedule reads it (`TreemapItem`). */
export interface TreemapEntry {
  label: string;
  value: number;
}

export interface TreemapSplitTimingProps {
  items?: TreemapEntry[];
  split?: number;
}

export const DEFAULT_TREEMAP_ITEMS: TreemapEntry[] = [
  { label: "Captions", value: 38 },
  { label: "Transitions", value: 16 },
  { label: "Text", value: 12 },
  { label: "Backgrounds", value: 9 },
  { label: "Shaders", value: 8 },
  { label: "Icons", value: 6 },
  { label: "Charts", value: 5 },
  { label: "UI", value: 4 },
  { label: "Effects", value: 2 },
];

const T0 = 12;
const STEP = 16;
const LAG = 2;
export const TREEMAP_SPLIT = 22;
// The frame the splits are laid out for: the tree, and with it when the
// last split ends, depends on the treemap's aspect.
const REF_W = 1280;
const REF_H = 720;

/** The items drawn: positive values, largest first, ten at most. */
export function treemapList<T extends TreemapEntry>(items: T[]) {
  return items
    .map((it, i) => ({ ...it, i, value: Math.max(0, it.value) }))
    .filter((it) => it.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

/** The treemap's box in a frame this size. */
export function treemapRoot(width: number, height: number) {
  const mx = width * 0.07;
  const my = height * 0.1;
  return { x: mx, y: my, w: width - mx * 2, h: height - my * 2 };
}

export interface SplitNode {
  id: string;
  leaf: number | null;
  depth: number;
  vertical: boolean;
  f: number;
  /** Second halves on the way down from the root. */
  lag: number;
  a: SplitNode | null;
  b: SplitNode | null;
}

function worst(idx: number[], vals: number[], w: number, h: number): number {
  if (idx.length === 1) {
    const a = Math.max(w / Math.max(h, 1e-6), h / Math.max(w, 1e-6));
    return vals[idx[0]] * Math.log(a) * (a > 2.2 ? 2 : 1);
  }
  const sum = idx.reduce((s, i) => s + vals[i], 0) || 1;
  const vertical = w >= h;
  let best = Number.POSITIVE_INFINITY;
  let acc = 0;
  for (let j = 0; j < idx.length - 1; j++) {
    acc += vals[idx[j]];
    const ff = acc / sum;
    const s =
      worst(
        idx.slice(0, j + 1),
        vals,
        vertical ? w * ff : w,
        vertical ? h : h * ff,
      ) +
      worst(
        idx.slice(j + 1),
        vals,
        vertical ? w * (1 - ff) : w,
        vertical ? h : h * (1 - ff),
      );
    if (s < best) best = s;
  }
  return best;
}

/**
 * The split tree for cells of this size. Node `n` splits `n.depth` × `step`
 * plus `n.lag` × `stagger` frames into the splits.
 */
export function buildSplitTree(
  idx: number[],
  vals: number[],
  w: number,
  h: number,
  depth: number,
  id: string,
  lag: number,
): SplitNode {
  if (idx.length === 1) {
    return {
      id,
      leaf: idx[0],
      depth,
      vertical: true,
      f: 1,
      lag,
      a: null,
      b: null,
    };
  }
  const sum = idx.reduce((s, i) => s + vals[i], 0) || 1;
  const vertical = w >= h;
  let k = 1;
  let best = Number.POSITIVE_INFINITY;
  let acc = 0;
  for (let j = 0; j < idx.length - 1; j++) {
    acc += vals[idx[j]];
    const ff = acc / sum;
    const s =
      worst(
        idx.slice(0, j + 1),
        vals,
        vertical ? w * ff : w,
        vertical ? h : h * ff,
      ) +
      worst(
        idx.slice(j + 1),
        vals,
        vertical ? w * (1 - ff) : w,
        vertical ? h : h * (1 - ff),
      );
    if (s < best - 1e-6) {
      best = s;
      k = j + 1;
    }
  }
  const left = idx.slice(0, k);
  const right = idx.slice(k);
  const f = left.reduce((s, i) => s + vals[i], 0) / sum;
  const aw = vertical ? w * f : w;
  const ah = vertical ? h : h * f;
  const bw = vertical ? w - aw : w;
  const bh = vertical ? h : h - ah;
  return {
    id,
    leaf: null,
    depth,
    vertical,
    f,
    lag,
    a: buildSplitTree(left, vals, aw, ah, depth + 1, `${id}a`, lag),
    b: buildSplitTree(right, vals, bw, bh, depth + 1, `${id}b`, lag + 1),
  };
}

function lastEnd(n: SplitNode, split: number): number {
  if (!n.a || !n.b) return 0;
  return Math.max(
    T0 + n.depth * STEP + n.lag * LAG + split,
    lastEnd(n.a, split),
    lastEnd(n.b, split),
  );
}

function splitsDone(
  list: TreemapEntry[],
  split: number,
  width: number,
  height: number,
) {
  const root = treemapRoot(width, height);
  const tree = buildSplitTree(
    list.map((_, i) => i),
    list.map((x) => x.value),
    root.w,
    root.h,
    0,
    "n",
    0,
  );
  return Math.max(lastEnd(tree, split), T0);
}

/**
 * How much later the last split ends in a frame this size than in the frame
 * the schedule is laid out for: 0 at 1280×720.
 */
export function treemapLate(
  list: TreemapEntry[],
  split: number,
  width: number,
  height: number,
) {
  return (
    splitsDone(list, split, width, height) -
    splitsDone(list, split, REF_W, REF_H)
  );
}

// `enter` fades the stage in. `splits` runs the whole split tree: node `n`
// starts `n.depth` × `step` + `n.lag` × `stagger` frames in, draws its line
// and opens over `split`, and each cell's label comes up from `labelAt` to
// `label` around the moment its parent split ends. `accent` follows the
// splits: the highlighted cell fills over `fill` (its small label fading
// from `preFillAt` to `preFill`), the figure comes in from `heroAt` to
// `hero` and counts up to `count`, its label rises from `labelAt` to
// `label` and the other cells dim over `dim`. `push` is the slow camera
// push, ending 50 frames into the accent.
export const treemapSplitTimeline = defineTimeline<
  TreemapSplitElementId,
  TreemapSplitTimingProps
>(
  ({
    items = DEFAULT_TREEMAP_ITEMS,
    split = TREEMAP_SPLIT,
  }): TimelineElement<TreemapSplitElementId>[] => {
    const done = splitsDone(treemapList(items), split, REF_W, REF_H);
    const ACC = done + 8;
    return [
      { id: "enter", lane: "Stage", label: "fade in", start: 0, length: 14 },
      { id: "push", lane: "Camera", label: "push", start: 0, length: ACC + 50 },
      {
        id: "splits",
        lane: "Cells",
        label: "splits",
        start: T0,
        length: done - T0,
        beats: { step: STEP, stagger: LAG, split, labelAt: -4, label: 12 },
      },
      {
        id: "accent",
        lane: "Highlight",
        label: "accent",
        start: ACC,
        length: 36,
        follows: "splits",
        beats: {
          fill: 18,
          preFillAt: -8,
          preFill: 2,
          heroAt: 10,
          hero: 30,
          labelAt: 18,
          label: 34,
          count: 36,
          dim: 20,
        },
      },
    ];
  },
);
