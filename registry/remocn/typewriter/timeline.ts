import { defineTimeline } from "@/lib/remocn/timeline";

// When the text types out. Frames on the 30 fps scene timeline, after
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type TypewriterElementId = "type";

export interface TypewriterTimingProps {
  text: string;
  charsPerSecond?: number;
}

const CHARS_PER_SECOND = 22;
const FPS = 30;

// `type` runs from the first character to the last; its length is the
// frames the whole text takes at `charsPerSecond`.
export const typewriterTimeline = defineTimeline<
  TypewriterElementId,
  TypewriterTimingProps
>(({ text, charsPerSecond = CHARS_PER_SECOND }) => [
  {
    id: "type",
    lane: "Text",
    label: text,
    start: 0,
    length: (text.length / charsPerSecond) * FPS,
  },
]);
