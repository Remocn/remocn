import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The prompt box bouncing in, the greeting and the box fading up, and the
// prompt being typed while the mic button turns into send. Frames on the
// 30 fps scene timeline, after `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type V0ElementId = "bounce" | "heading" | "box" | "typing";

export interface V0TimingProps {
  prompt?: string;
}

export const DEFAULT_PROMPT =
  "a landing page for my SaaS with pricing and testimonials";
export const TYPE_START = 42;
export const TYPE_CPS = 22;

/** Frames the prompt takes to type at its natural rate. */
export function typedFrames(prompt: string) {
  return (prompt.length / TYPE_CPS) * 30;
}

// The send button's morph springs from the start of `typing`.
export const v0Timeline = defineTimeline<V0ElementId, V0TimingProps>(
  ({ prompt = DEFAULT_PROMPT }): TimelineElement<V0ElementId>[] => [
    {
      id: "bounce",
      lane: "Intro",
      label: "bounce in",
      start: 0,
      length: 26,
    },
    {
      id: "heading",
      lane: "Greeting",
      label: "greeting",
      start: 4,
      length: 16,
    },
    {
      id: "box",
      lane: "Box",
      label: "prompt box",
      start: 10,
      length: 16,
      follows: "heading",
    },
    {
      id: "typing",
      lane: "Box",
      label: prompt,
      start: TYPE_START,
      length: typedFrames(prompt),
      follows: "box",
    },
  ],
);
