import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The scene fading up under a slow push, the root node landing with its
// label, every branch growing out of its parent once the parent has
// arrived, then the leaf count landing with its title. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type BranchTreeElementId =
  | "stage"
  | "push"
  | "root"
  | "root-label"
  | `branch:${number}`
  | "count"
  | "title";

export interface BranchTreeTimingProps {
  depth?: number;
  branching?: number | number[];
  grow?: number;
}

export const ROOT_IN = 4;
export const EDGE = 12;
const LEAD = 2;
const SIB = 2;
const MAX_LEAVES = 96;

export interface TreeNode {
  level: number;
  parent: number;
  sib: number;
  sibs: number;
  y: number;
  path: number[];
  children: number[];
  arrive: number;
  start: number;
}

/** Levels and children per level, capped so the leaves stay countable. */
export function treeShape(depth: number, branching: number | number[]) {
  const D = Math.min(5, Math.max(1, Math.round(depth)));
  const raw = Array.isArray(branching) ? branching : [branching];
  const fan: number[] = [];
  let leafCount = 1;
  for (let l = 0; l < D; l++) {
    const want = Math.min(
      6,
      Math.max(1, Math.round(raw[Math.min(l, raw.length - 1)] ?? 2)),
    );
    const k = Math.max(1, Math.min(want, Math.floor(MAX_LEAVES / leafCount)));
    fan.push(k);
    leafCount *= k;
  }
  return { D, fan, leafCount };
}

export function buildTree(depth: number, fan: number[], grow: number) {
  const nodes: TreeNode[] = [
    {
      level: 0,
      parent: -1,
      sib: 0,
      sibs: 1,
      y: 0,
      path: [],
      children: [],
      arrive: ROOT_IN,
      start: ROOT_IN,
    },
  ];
  let frontier = [0];
  for (let l = 1; l <= depth; l++) {
    const next: number[] = [];
    const k = fan[l - 1];
    for (const pi of frontier) {
      const parent = nodes[pi];
      for (let j = 0; j < k; j++) {
        const start = parent.arrive + LEAD + Math.abs(j - (k - 1) / 2) * SIB;
        const idx = nodes.length;
        nodes.push({
          level: l,
          parent: pi,
          sib: j,
          sibs: k,
          y: 0,
          path: [...parent.path, j],
          children: [],
          arrive: start + grow,
          start,
        });
        parent.children.push(idx);
        next.push(idx);
      }
    }
    frontier = next;
  }
  return { nodes, leaves: frontier };
}

// `root` lands at its start (ring over `ring`, dot over `dot`); its label
// follows. `branch:<i>` grows node i's edge from its parent over its length
// and the node pops at its end; it follows its parent's branch (level-one
// branches follow `root`). `count` lands 6 frames after the last leaf
// arrives and follows it: fade over `fade`, unblur over `blur`, the tree
// settles from `settleFrom` to `settleTo`. `title` follows the count.
export const branchTreeTimeline = defineTimeline<
  BranchTreeElementId,
  BranchTreeTimingProps
>(({ depth = 3, branching = [3, 4, 4], grow = EDGE }) => {
  const { D, fan } = treeShape(depth, branching);
  const { nodes, leaves } = buildTree(D, fan, grow);
  const lastArrive = Math.max(...leaves.map((i) => nodes[i].arrive));
  const lastLeaf = leaves.find((i) => nodes[i].arrive === lastArrive) ?? 0;
  const HIT = lastArrive + 6;
  const branchId = (i: number): BranchTreeElementId =>
    i === 0 ? "root" : `branch:${i}`;
  const elements: TimelineElement<BranchTreeElementId>[] = [
    { id: "stage", lane: "Scene", label: "Fade up", start: 0, length: 8 },
    {
      id: "push",
      lane: "Scene",
      label: "Push",
      start: 0,
      length: 140,
      beats: { drift: 150 },
    },
    {
      id: "root",
      lane: "Root",
      label: "Root",
      start: ROOT_IN,
      length: 6,
      beats: { dot: 5, ring: 6 },
    },
    {
      id: "root-label",
      lane: "Root",
      label: "Root label",
      start: ROOT_IN + 2,
      length: 16,
      follows: "root",
    },
    ...nodes.slice(1).map(
      (n, k): TimelineElement<BranchTreeElementId> => ({
        id: `branch:${k + 1}`,
        lane: `Level ${n.level}`,
        label: `Branch ${n.path.map((j) => j + 1).join(".")}`,
        start: n.start,
        length: grow,
        follows: branchId(n.parent),
      }),
    ),
    {
      id: "count",
      lane: "Count",
      label: "Count",
      start: HIT,
      length: 24,
      follows: branchId(lastLeaf),
      beats: { fade: 8, blur: 14, settleFrom: -4, settleTo: 18 },
    },
    {
      id: "title",
      lane: "Count",
      label: "Title",
      start: HIT + 10,
      length: 18,
      follows: "count",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
