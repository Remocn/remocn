import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A prompt node typing and pressing Run, then an edge drawing from node to
// node down the trail with the camera riding along, each a little quicker
// than the last, then the camera pulling back to the whole board and the
// headline landing. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type NodeTrailElementId =
  | "type"
  | "press"
  | `edge:${number}`
  | "pull"
  | "board"
  | "headline";

export type TrailIcon =
  | "doc"
  | "captions"
  | "frame"
  | "image"
  | "play"
  | "spark"
  | "wave"
  | "music"
  | "palette"
  | "wide"
  | "tall"
  | "square";

export type TrailTint =
  | "blue"
  | "violet"
  | "cyan"
  | "green"
  | "pink"
  | "amber"
  | "coral";

export type TrailStep = {
  label: string;
  icons: TrailIcon[];
  tint?: TrailTint;
  cols?: number;
};

export interface NodeTrailTimingProps {
  prompt?: string;
  steps?: readonly { label: string }[];
  draw?: number;
  pause?: number;
}

export const DEFAULT_STEPS: TrailStep[] = [
  { label: "Script", icons: ["doc", "captions"], tint: "violet", cols: 1 },
  {
    label: "Scenes",
    icons: ["frame", "image", "play", "frame"],
    tint: "cyan",
    cols: 2,
  },
  { label: "Render", icons: ["spark"], tint: "green", cols: 1 },
  {
    label: "Publish",
    icons: ["wide", "tall", "square"],
    tint: "pink",
    cols: 3,
  },
];

/** The trail's plan in frames: the edges one by one, then the pull back. */
export function trailPlan(
  stepCount: number,
  promptLength: number,
  draw = 22,
  pause = 10,
) {
  const edges: { start: number; dur: number; arrive: number }[] = [];
  let start = Math.max(30, promptLength + 9);
  let dur = draw;
  let hold = pause;
  for (let i = 0; i < stepCount; i++) {
    edges.push({ start, dur, arrive: start + dur - 3 });
    start = start + dur + hold;
    dur = Math.max(10, Math.round(dur * 0.8));
    hold = Math.max(5, Math.round(hold * 0.8));
  }
  const last = edges[edges.length - 1];
  const pull = last ? last.start + last.dur + 8 : 40;
  const pullDur = 24;
  return {
    typeStart: 3,
    press: (edges[0]?.start ?? 30) - 4,
    edges,
    pull,
    pullDur,
    board: pull + 10,
    headline: pull + 13,
    end: pull + pullDur + 42,
  };
}

export const DEFAULT_PROMPT = "A launch film for v2";

// `type` types the prompt over its length. `press` presses Run: the button
// dips over `dip`, bounces from `bounce` to `settle`, and the caret stops
// blinking at `caretOff`. `edge:<i>` draws the edge into step i over its
// length while the camera rides along from `cam`; the step's node arrives at
// `arrive`, and the node before it stays selected until `deselect`. The
// edges form a chain after the press. `pull` pulls the camera back to the
// whole board over its length, then it drifts in for `drift`. `board` draws
// the board's outline over its length, popping its name at `pop`.
// `headline` rises the headline in.
export const trailTimeline = defineTimeline<
  NodeTrailElementId,
  NodeTrailTimingProps
>(
  ({
    prompt = DEFAULT_PROMPT,
    steps = DEFAULT_STEPS,
    draw,
    pause,
  }): TimelineElement<NodeTrailElementId>[] => {
    const T = trailPlan(steps.length, prompt.length, draw, pause);
    const elements: TimelineElement<NodeTrailElementId>[] = [
      {
        id: "type",
        lane: "Prompt",
        label: prompt,
        start: T.typeStart,
        length: prompt.length,
      },
      {
        id: "press",
        lane: "Prompt",
        label: "Run",
        start: T.press,
        length: 9,
        beats: { dip: 6, bounce: 5, settle: 9, caretOff: 2 },
      },
    ];
    T.edges.forEach((ed, i) => {
      elements.push({
        id: `edge:${i}`,
        lane: "Trail",
        label: steps[i].label,
        start: ed.start,
        length: ed.dur,
        follows: i > 0 ? `edge:${i - 1}` : "press",
        beats: { cam: 2, arrive: ed.arrive - ed.start, deselect: 4 },
      });
    });
    elements.push(
      {
        id: "pull",
        lane: "Camera",
        label: "Pull back",
        start: T.pull,
        length: T.pullDur,
        follows: T.edges.length ? `edge:${T.edges.length - 1}` : undefined,
        beats: { drift: 48 },
      },
      {
        id: "board",
        lane: "Board",
        label: "Board",
        start: T.board,
        length: 12,
        follows: "pull",
        beats: { pop: 4 },
      },
      {
        id: "headline",
        lane: "Board",
        label: "Headline",
        start: T.headline,
        length: 14,
        follows: "pull",
      },
    );
    return elements;
  },
);
