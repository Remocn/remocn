import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The word rising out of the fog: the letters come in ring by ring from the
// center while the word converges and sharpens, then it falls away. Frames
// on the 30 fps scene timeline, after `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type FogRiseElementId = "rise" | `char:${number}` | "exit";

export interface FogRiseTimingProps {
  text: string;
  stagger?: number;
  resolveFrames?: number;
  fadeFrames?: number;
  exitAt?: number;
}

export const STAGGER = 5;
export const RESOLVE_FRAMES = 22;
const FADE_FRAMES = 18;
const EXIT_AT = 60;

export function rings(text: string) {
  const chars = Array.from(text);
  const center = (chars.length - 1) / 2;
  const minRing = chars.length % 2 === 0 ? 0.5 : 0;
  return {
    chars,
    center,
    maxRing: Math.floor(center),
    ringOf: (j: number) => Math.abs(j - center) - minRing,
  };
}

// The word converges on a spring from the start of `rise` and its blur
// clears over the whole of it. Each letter fades in over its own element,
// nearest the center first. The fall runs from `exit` to the end.
export const fogRiseTimeline = defineTimeline<
  FogRiseElementId,
  FogRiseTimingProps
>(
  (
    {
      text,
      stagger = STAGGER,
      resolveFrames = RESOLVE_FRAMES,
      fadeFrames = FADE_FRAMES,
      exitAt = EXIT_AT,
    },
    { length },
  ) => {
    const { chars, maxRing, ringOf } = rings(text);
    const letters = chars
      .map((char, j) => ({ char, j, start: ringOf(j) * stagger }))
      .sort((a, b) => a.start - b.start);
    const elements: TimelineElement<FogRiseElementId>[] = [
      {
        id: "rise",
        lane: "Word",
        label: text,
        start: 0,
        length: maxRing * stagger + resolveFrames,
      },
      ...letters.map(
        ({ char, j, start }, k): TimelineElement<FogRiseElementId> => ({
          id: `char:${j}`,
          lane: "Letters",
          label: char,
          start,
          length: fadeFrames,
          follows: k > 0 ? `char:${letters[k - 1].j}` : undefined,
        }),
      ),
    ];
    if (exitAt > 0) {
      elements.push({
        id: "exit",
        lane: "Exit",
        label: "fall",
        start: exitAt,
        length: Math.max(length - exitAt, 0),
      });
    }
    // A long word can still be coming in when the fall starts.
    return elements.sort((a, b) => a.start - b.start);
  },
);
