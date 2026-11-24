import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The prompt starts typing, the camera punches in on the caret to type the
// focus phrase huge, pulls back out as the box and its toolbar come in, the
// rest of the prompt types, the cursor comes in and presses send, and the
// camera drifts in to the end. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type CaretDollyElementId =
  | "intro"
  | "punch"
  | "focus"
  | "pull"
  | "post"
  | "cursor"
  | "drift"
  | "press";

export interface CaretDollyTimingProps {
  prompt?: string;
  focus?: string;
}

export const DEFAULT_PROMPT =
  "Make a launch video for our new app with a bold title, product shots and a calm ending";
export const DEFAULT_FOCUS = "launch video";

const BEAT = {
  typeA: 2,
  punch: 24,
  punchLen: 12,
  focusLen: 22,
  pull: 60,
  pullLen: 24,
  post: 72,
  postLen: 30,
  cursor: 82,
  press: 108,
};

/** Where the focus phrase sits in the prompt, and how fast each part types. */
export function caretDollyPlan(prompt: string, focus: string) {
  const found = prompt.indexOf(focus);
  const fs = found >= 0 && focus.length > 0 ? found : 0;
  const fe = found >= 0 && focus.length > 0 ? found + focus.length : 0;
  const focusLen = fe - fs;
  const postLen = prompt.length - fe;
  const rateA = Math.max(0.6, fs / 18);
  const rateF = Math.max(0.5, focusLen / BEAT.focusLen);
  const rateP = Math.max(2, postLen / BEAT.postLen);
  return { fs, fe, focusLen, postLen, rateA, rateF, rateP };
}

// Each typing element runs as long as its characters take; the caret keeps
// blinking `tail` frames after. The pull fades the prompt's start back in
// from `fadeAt`, the box from `surfaceAt`, pops the toolbar from `toolsAt`
// `toolStagger` apart and the chip at `chipAt`. The post arms send at its
// end, over `arm`. The press dips the button from `dipAt`, swaps the arrow
// for a spinner and sends the cursor away at `awayAt`. The drift runs from
// the end of the pull to the end of the clip.
export const caretDollyTimeline = defineTimeline<
  CaretDollyElementId,
  CaretDollyTimingProps
>(
  (
    { prompt = DEFAULT_PROMPT, focus = DEFAULT_FOCUS },
    { length },
  ): TimelineElement<CaretDollyElementId>[] => {
    const { fs, focusLen, postLen, rateA, rateF, rateP } = caretDollyPlan(
      prompt,
      focus,
    );
    const punchEnd = BEAT.punch + BEAT.punchLen;
    const pullEnd = BEAT.pull + BEAT.pullLen;
    return [
      {
        id: "intro",
        lane: "Prompt",
        label: prompt.slice(0, fs),
        start: BEAT.typeA,
        length: fs / rateA,
        beats: { tail: 2 },
      },
      {
        id: "punch",
        lane: "Camera",
        label: "punch in",
        start: BEAT.punch,
        length: BEAT.punchLen,
        beats: { fade: 5 },
      },
      {
        id: "focus",
        lane: "Prompt",
        label: prompt.slice(fs, fs + focusLen),
        start: punchEnd,
        length: focusLen / rateF,
        follows: "punch",
        beats: { tail: 2 },
      },
      {
        id: "pull",
        lane: "Camera",
        label: "pull out",
        start: BEAT.pull,
        length: BEAT.pullLen,
        follows: "focus",
        beats: {
          fadeAt: 8,
          surfaceAt: 6,
          toolsAt: BEAT.pullLen - 8,
          toolStagger: 2,
          chipAt: BEAT.pullLen - 6,
        },
      },
      {
        id: "post",
        lane: "Prompt",
        label: prompt.slice(fs + focusLen),
        start: BEAT.post,
        length: postLen / rateP,
        follows: "pull",
        beats: { tail: 2, arm: 4, caretOutAt: 4 },
      },
      {
        id: "cursor",
        lane: "Cursor",
        label: "cursor",
        start: BEAT.cursor,
        length: BEAT.press - BEAT.cursor,
        follows: "post",
        beats: { lag: 3 },
      },
      {
        id: "drift",
        lane: "Camera",
        label: "drift",
        start: pullEnd,
        length: Math.max(0, length - pullEnd),
        follows: "pull",
      },
      {
        id: "press",
        lane: "Cursor",
        label: "press send",
        start: BEAT.press,
        length: 12,
        follows: "cursor",
        beats: {
          caretAt: -6,
          dipAt: -2,
          releaseAt: 3,
          stopAt: 3,
          arrowAt: 1,
          arrowEnd: 5,
          spinAt: 4,
          spinEnd: 12,
          awayAt: 8,
        },
      },
    ];
  },
);
