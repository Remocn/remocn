import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The dial building (ticks, ring, hand, readout, arc) as the camera settles
// and pushes in, the hand sweeping to `minutes` and stopping with a kick,
// the camera gliding left, the headline rising word by word, and the slow
// drifts that hold the frame alive. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type ClockSweepElementId =
  | "intro"
  | "ticks"
  | "ring"
  | "hand"
  | "readout"
  | "push"
  | "arc"
  | "sweep"
  | "stop"
  | "glide"
  | "drift"
  | `word:${number}`
  | "breathe";

export interface ClockSweepTimingProps {
  minutes?: number;
  title?: string;
  stagger?: number;
}

/** The headline: the `title` prop, or the default built from `minutes`. */
export function headlineOf(title: string | undefined, minutes: number) {
  return (
    title ??
    `From idea to video\nin ${minutes} ${minutes === 1 ? "minute" : "minutes"}`
  );
}

/** The headline's lines, each split into words. */
export function headlineLines(headline: string) {
  return headline.split("\n").map((l) => l.split(/\s+/).filter(Boolean));
}

// In `ticks` tick `i` grows in from `start + i * step` over `each`. `stop`
// is the hand landing: it flashes up to `peak` and fades by the end, the end
// dot shows over `dot` and the readout lights over `lit`; the hand's kick
// rings out from its start. The stop, the glide left and the first word
// follow the sweep; the words form a chain.
export const clockSweepTimeline = defineTimeline<
  ClockSweepElementId,
  ClockSweepTimingProps
>(
  ({
    minutes = 4,
    title,
    stagger = 2.5,
  }): TimelineElement<ClockSweepElementId>[] => {
    const words = headlineLines(headlineOf(title, minutes)).flat();
    const elements: TimelineElement<ClockSweepElementId>[] = [
      { id: "intro", lane: "Camera", label: "settle", start: 0, length: 30 },
      {
        id: "ticks",
        lane: "Dial",
        label: "ticks",
        start: 2,
        length: 59 * 0.32 + 10,
        beats: { step: 0.32, each: 10 },
      },
      { id: "ring", lane: "Dial", label: "ring", start: 6, length: 20 },
      { id: "hand", lane: "Hand", label: "hand", start: 12, length: 18 },
      {
        id: "readout",
        lane: "Readout",
        label: "readout",
        start: 18,
        length: 16,
      },
      { id: "push", lane: "Camera", label: "push in", start: 20, length: 46 },
      { id: "arc", lane: "Dial", label: "arc", start: 28, length: 6 },
      { id: "sweep", lane: "Hand", label: "sweep", start: 32, length: 34 },
      {
        id: "stop",
        lane: "Hand",
        label: "stop",
        start: 66,
        length: 18,
        follows: "sweep",
        beats: { peak: 3, dot: 10, lit: 6 },
      },
      {
        id: "glide",
        lane: "Camera",
        label: "glide left",
        start: 70,
        length: 34,
        follows: "sweep",
      },
      {
        id: "drift",
        lane: "Headline",
        label: "drift",
        start: 76,
        length: 94,
      },
      ...words.map(
        (w, i): TimelineElement<ClockSweepElementId> => ({
          id: `word:${i}`,
          lane: "Words",
          label: w,
          start: 82 + i * stagger,
          length: 20,
          follows: i > 0 ? `word:${i - 1}` : "sweep",
        }),
      ),
      {
        id: "breathe",
        lane: "Camera",
        label: "breathe",
        start: 104,
        length: 66,
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
