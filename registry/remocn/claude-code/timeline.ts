import { defineTimeline } from "@/lib/remocn/timeline";

// The terminal bouncing in, its welcome panel's two columns and the prompt
// box fading up one after another, then the prompt typing in. Frames on
// the 30 fps scene timeline, after `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type ClaudeCodeElementId =
  | "intro"
  | "left"
  | "right"
  | "prompt"
  | "typing";

export interface ClaudeCodeTimingProps {
  prompt?: string;
}

export const DEFAULT_PROMPT = "edit src/theme.ts to add a dark mode toggle";
/** The prompt starts typing here, at `TYPE_CPS` characters a second. */
export const TYPE_AT = 48;
export const TYPE_CPS = 18;
/** Frames the intro spring takes to settle. */
const INTRO = 18;

// `typing` lasts as long as the prompt takes to type: stretching it types
// slower.
export const claudeCodeTimeline = defineTimeline<
  ClaudeCodeElementId,
  ClaudeCodeTimingProps
>(({ prompt = DEFAULT_PROMPT }) => [
  { id: "intro", lane: "Window", label: "bounce in", start: 0, length: INTRO },
  { id: "left", lane: "Fades", label: "welcome", start: 6, length: 16 },
  { id: "right", lane: "Fades", label: "tips", start: 12, length: 18 },
  { id: "prompt", lane: "Fades", label: "prompt box", start: 18, length: 18 },
  {
    id: "typing",
    lane: "Prompt",
    label: prompt,
    start: TYPE_AT,
    length: (prompt.length / TYPE_CPS) * 30,
  },
]);
