import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A node graph that relayouts itself: the first layout builds in, then a
// cursor drags one node at a time and the whole graph reflows into the next
// use case, each relayout a little quicker than the last. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type GraphRelayoutElementId = `layout:${number}`;

export type LayoutSpec = {
  title: string;
  nodes: Record<string, [number, number]>;
  edges: [string, string][];
  note?: { node: string; text: string };
};

export interface GraphRelayoutTimingProps {
  layouts?: readonly { title: string }[];
  hold?: number;
}

export const DEFAULT_LAYOUTS: LayoutSpec[] = [
  {
    title: "A launch film",
    nodes: {
      prompt: [0.08, 0.5],
      script: [0.3, 0.5],
      scenes: [0.5, 0.5],
      render: [0.7, 0.5],
      wide: [0.9, 0.5],
    },
    edges: [
      ["prompt", "script"],
      ["script", "scenes"],
      ["scenes", "render"],
      ["render", "wide"],
    ],
  },
  {
    title: "Social cutdowns",
    nodes: {
      prompt: [0.08, 0.26],
      brand: [0.08, 0.74],
      script: [0.29, 0.5],
      scenes: [0.5, 0.26],
      voice: [0.5, 0.74],
      render: [0.71, 0.5],
      wide: [0.91, 0.26],
      tall: [0.91, 0.74],
    },
    edges: [
      ["prompt", "script"],
      ["brand", "script"],
      ["script", "scenes"],
      ["script", "voice"],
      ["scenes", "render"],
      ["voice", "render"],
      ["render", "wide"],
      ["render", "tall"],
    ],
  },
  {
    title: "Captions in every language",
    nodes: {
      prompt: [0.08, 0.3],
      script: [0.28, 0.3],
      scenes: [0.49, 0.3],
      captions: [0.49, 0.78],
      render: [0.7, 0.3],
      wide: [0.9, 0.3],
    },
    edges: [
      ["prompt", "script"],
      ["script", "scenes"],
      ["script", "captions"],
      ["scenes", "render"],
      ["captions", "render"],
      ["render", "wide"],
    ],
    note: { node: "captions", text: "12 languages, synced to voice" },
  },
  {
    title: "Every format at once",
    nodes: {
      prompt: [0.07, 0.5],
      scenes: [0.28, 0.16],
      voice: [0.28, 0.5],
      music: [0.28, 0.84],
      render: [0.5, 0.5],
      wide: [0.72, 0.16],
      tall: [0.72, 0.5],
      square: [0.72, 0.84],
      publish: [0.93, 0.5],
    },
    edges: [
      ["prompt", "scenes"],
      ["prompt", "voice"],
      ["prompt", "music"],
      ["scenes", "render"],
      ["voice", "render"],
      ["music", "render"],
      ["render", "wide"],
      ["render", "tall"],
      ["render", "square"],
      ["wide", "publish"],
      ["tall", "publish"],
      ["square", "publish"],
    ],
  },
];

export const FIRST_HOLD = 36;
const STEP_GAPS = [34, 30, 28, 26];
const FINAL_HOLD = 58;

/** The relayouts' starts and the scene's end, in frames. */
export function relayoutPlan(count: number, hold = FIRST_HOLD) {
  const starts: number[] = [];
  let t = hold;
  for (let i = 1; i < count; i++) {
    starts.push(t);
    t += STEP_GAPS[Math.min(i - 1, STEP_GAPS.length - 1)];
  }
  const last = starts.length ? starts[starts.length - 1] : 0;
  return { starts, end: last + FINAL_HOLD };
}

// `layout:0` builds the first layout: its nodes pop in from `node` and its
// edges draw from `edge` over `edgeLen`, both spread along the graph, and
// its title rises from `title` + `titleIn` over `titleLen` (its note from
// `noteIn` over `noteLen`). `layout:<i>` relayouts into layout i: the cursor
// approaches from `approach` over `approachLen`, presses from `press` over
// `pressLen` and holds the dragged node until `dragEnd`; the nodes spring to
// their new places from its start, leaving nodes fade over `exit` and new
// ones pop at `enter`; old edges retract over `edgeOut` and new ones draw
// from `edgeIn` over `edgeInLen`; the cursor lets go from `release` over
// `releaseLen` and lifts from `unpress` over `unpressLen`; the previous
// title and note fade over `fadeOut`. After the last relayout the cursor
// drifts off from `drift` over `driftLen`. The layouts form a chain.
export const relayoutTimeline = defineTimeline<
  GraphRelayoutElementId,
  GraphRelayoutTimingProps
>(({ layouts = DEFAULT_LAYOUTS, hold = FIRST_HOLD }) => {
  const { starts, end } = relayoutPlan(layouts.length, hold);
  const at = (i: number) => (i === 0 ? 0 : starts[i - 1]);
  const elements: TimelineElement<GraphRelayoutElementId>[] = [];
  layouts.forEach((l, i) => {
    const start = at(i);
    const next = i + 1 < layouts.length ? at(i + 1) : end;
    const titles = {
      title: i === 0 ? -14 : 0,
      titleIn: 6,
      titleLen: 12,
      noteIn: 16,
      noteLen: 12,
    };
    elements.push({
      id: `layout:${i}`,
      lane: "Layouts",
      label: l.title,
      start,
      length: next - start,
      follows: i > 0 ? `layout:${i - 1}` : undefined,
      beats:
        i === 0
          ? { node: -5, edge: 3, edgeLen: 10, ...titles }
          : {
              ...titles,
              approach: i === 1 ? -18 : -12,
              approachLen: i === 1 ? 16 : 11,
              press: -3,
              pressLen: 3,
              dragEnd: 20,
              exit: 8,
              enter: 6,
              edgeOut: 7,
              edgeIn: 9,
              edgeInLen: 11,
              release: 18,
              releaseLen: 6,
              unpress: 16,
              unpressLen: 4,
              fadeOut: 7,
              drift: 24,
              driftLen: 30,
            },
    });
  });
  return elements;
});
