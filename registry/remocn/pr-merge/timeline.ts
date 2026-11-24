import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The pull request merging: the title block and card come in, each check
// row slides in and starts running, the checks pass one by one, the cursor
// clicks merge, then confirm, and the card folds its list as the PR turns
// merged. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type PrMergeElementId =
  | "push"
  | `line:${number}`
  | "card"
  | `check:${number}`
  | `pass:${number}`
  | "ready"
  | "merge"
  | "confirm"
  | "merged";

export interface PrMergeTimingProps {
  checks?: (string | { name: string })[];
  stagger?: number;
}

export const DEFAULT_CHECKS: {
  name: string;
  workflow?: string;
  seconds?: number;
}[] = [
  { name: "lint", workflow: "ci", seconds: 18 },
  { name: "typecheck", workflow: "ci", seconds: 41 },
  { name: "build", workflow: "ci", seconds: 72 },
  { name: "e2e", workflow: "playwright", seconds: 128 },
];
export const DEFAULT_STAGGER = 12;

const LINES = ["repo", "title", "status", "branch", "diff stats"];

export const prMergeTimeline = defineTimeline<
  PrMergeElementId,
  PrMergeTimingProps
>(({ checks = DEFAULT_CHECKS, stagger = DEFAULT_STAGGER }) => {
  const names = checks.map((k) => (typeof k === "string" ? k : k.name));
  const n = names.length;
  const dones = names.map((_, i) => 46 + i * stagger);
  const allDone = (dones[n - 1] ?? 46) + 6;
  const T = {
    mergeClick: allDone + 22,
    confirmClick: allDone + 46,
    merged: allDone + 56,
  };
  const elements: TimelineElement<PrMergeElementId>[] = [
    // The slow push-in under the whole scene.
    { id: "push", lane: "Camera", label: "push in", start: 0, length: 210 },
  ];
  LINES.forEach((label, k) => {
    elements.push({
      id: `line:${k}`,
      lane: "Title",
      label,
      start: k * 3,
      length: 16,
      follows: k > 0 ? `line:${k - 1}` : undefined,
    });
  });
  elements.push({
    id: "card",
    lane: "Card",
    label: "card",
    start: 4,
    length: 10,
  });
  names.forEach((name, i) => {
    elements.push({
      id: `check:${i}`,
      lane: "Rows",
      label: name,
      start: 8 + i * 3,
      length: 14,
      follows: i > 0 ? `check:${i - 1}` : undefined,
      // The check starts running `run` after its row slides in.
      beats: { run: 2 },
    });
  });
  names.forEach((name, i) => {
    elements.push({
      id: `pass:${i}`,
      lane: "Checks",
      label: `${name} passes`,
      start: dones[i],
      length: i + 1 < n ? dones[i + 1] - dones[i] : 6,
      follows: i > 0 ? `pass:${i - 1}` : undefined,
    });
  });
  elements.push(
    {
      id: "ready",
      lane: "Merge",
      label: "merge enabled",
      start: allDone,
      length: 22,
      follows: n > 0 ? `pass:${n - 1}` : undefined,
      // The cursor fades in from `cursor` over `cursorIn`.
      beats: { cursor: -14, cursorIn: 8 },
    },
    {
      id: "merge",
      lane: "Merge",
      label: "click merge",
      start: T.mergeClick,
      length: 24,
      follows: "ready",
      // The cursor arrives at `reach` and leaves at `leave`; the footer swaps
      // to confirm from `swap` over `swapOut`.
      beats: { reach: -4, leave: 8, swap: 1, swapOut: 7 },
    },
    {
      id: "confirm",
      lane: "Merge",
      label: "click confirm",
      start: T.confirmClick,
      length: 10,
      follows: "merge",
      beats: { reach: -4, run: 1 },
    },
    {
      id: "merged",
      lane: "Merge",
      label: "merged",
      start: T.merged,
      length: 34,
      follows: "confirm",
      beats: {
        collapse: 22,
        status: 2,
        card: 6,
        listOut: 8,
        footOut: 7,
        openOut: 6,
        cursorAway: 8,
        cursorOff: 34,
      },
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
