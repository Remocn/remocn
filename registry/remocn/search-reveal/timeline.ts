import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Construction circles spread apart, cut to a search pill that grows and
// straightens, the copy types in and the graphic panel opens behind it.
// Frames on the 30 fps scene timeline, after `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type SearchRevealElementId = "circles" | "field" | "typing" | "panel";

export interface SearchRevealTimingProps {
  text?: string;
  framesPerCharacter?: number;
}

export const finite = (value: number | undefined, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
export const letters = (text: string) =>
  Array.from(
    new Intl.Segmenter("en", { granularity: "grapheme" }).segment(text),
    (part) => part.segment,
  );

// The circles run until the cut to the field. The field grows over its
// length, its height and tilt settle over `grow` and `tilt`, the search icon
// fades in at `iconAt`. Typing lands a letter every `step` frames, the caret
// shows from `caretAt` (before the first letter) and blinks every `blink`
// once the copy is in; the scene holds `hold` frames after it. The panel
// fades in over `fade` and opens over its length.
export const searchRevealTimeline = defineTimeline<
  SearchRevealElementId,
  SearchRevealTimingProps
>((props): TimelineElement<SearchRevealElementId>[] => {
  const text = props.text ?? "remocn";
  const characters = letters(text);
  const step = clamp(finite(props.framesPerCharacter, 4), 1, 12);
  return [
    {
      id: "circles",
      lane: "Shape",
      label: "circles",
      start: 0,
      length: 26,
    },
    {
      id: "field",
      lane: "Shape",
      label: "field",
      start: 26,
      length: 22,
      follows: "circles",
      beats: { grow: 20, tilt: 21, iconAt: 8, icon: 12 },
    },
    {
      id: "typing",
      lane: "Text",
      label: text,
      start: 54,
      length: characters.length * step,
      follows: "field",
      beats: { step, caretAt: -2, blink: 12, hold: 10 },
    },
    {
      id: "panel",
      lane: "Panel",
      label: "panel",
      start: 56,
      length: 34,
      follows: "field",
      beats: { fade: 4 },
    },
  ];
});
