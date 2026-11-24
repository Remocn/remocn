import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each code fragment typed into the editor, one after another; the preview
// button takes the fragment's style once it is fully typed. Frames on the
// 30 fps scene timeline, after `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type LiveCodeCompilationElementId = `edit:${number}`;

/** The scene's timing does not depend on its props. */
export type LiveCodeCompilationTimingProps = object;

export interface UIState {
  background?: string;
  color?: string;
  padding?: string;
  borderRadius?: string;
  fontWeight?: number;
  label?: string;
}

export interface CodeEvent {
  code: string;
  ui: UIState;
}

export const EVENTS: CodeEvent[] = [
  {
    code: "export function Button() {\n  return (\n    <button",
    ui: {},
  },
  { code: "\n      style={{", ui: {} },
  {
    code: '\n        background: "#3b82f6",',
    ui: { background: "#3b82f6" },
  },
  {
    code: '\n        color: "white",',
    ui: { color: "white" },
  },
  {
    code: '\n        padding: "12px 28px",',
    ui: { padding: "12px 28px" },
  },
  {
    code: '\n        borderRadius: "999px",',
    ui: { borderRadius: "999px" },
  },
  {
    code: "\n        fontWeight: 600,",
    ui: { fontWeight: 600 },
  },
  {
    code: "\n      }}\n    >\n      Ship it\n    </button>\n  );\n}",
    ui: { label: "Ship it" },
  },
];

export const CHARS_PER_FRAME = 1.6;
const DWELL_FRAMES = 5;
const INITIAL_OFFSET = 8;

/** Frames a fragment takes to type at the natural rate. */
export function typingFrames(code: string) {
  return Math.ceil(code.length / CHARS_PER_FRAME);
}

// `edit:<i>` is fragment `i`, typed over its length; each follows the one
// before it after a short dwell.
export const liveCodeCompilationTimeline = defineTimeline<
  LiveCodeCompilationElementId,
  LiveCodeCompilationTimingProps
>(() => {
  let cursor = INITIAL_OFFSET;
  return EVENTS.map((ev, i): TimelineElement<LiveCodeCompilationElementId> => {
    const start = cursor;
    const end = start + typingFrames(ev.code);
    cursor = end + DWELL_FRAMES;
    return {
      id: `edit:${i}`,
      lane: "Code",
      label: ev.code.trim().split("\n")[0],
      start,
      length: end - start,
      follows: i > 0 ? `edit:${i - 1}` : undefined,
    };
  });
});
