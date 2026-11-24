import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The inner grid turning into line with the field, the moiré locking into
// the solid figure, and the caption rising under it. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type MoireRevealElementId = "turn" | "lock" | "caption";

// `turn` rotates the inner grid level over its length and detunes its
// spacing from `detune` to `detuneEnd`. `lock` fills the figure in; the
// field around it dims from `dim` to `dimEnd`. `caption` rises the caption.
export const moireRevealTimeline = defineTimeline<MoireRevealElementId, object>(
  () => {
    const elements: TimelineElement<MoireRevealElementId>[] = [
      {
        id: "turn",
        lane: "Grid",
        label: "Turn",
        start: 0,
        length: 86,
        beats: { detune: 32, detuneEnd: 82 },
      },
      {
        id: "lock",
        lane: "Grid",
        label: "Lock",
        start: 100,
        length: 14,
        follows: "turn",
        beats: { dim: 4, dimEnd: 24 },
      },
      {
        id: "caption",
        lane: "Caption",
        label: "Caption",
        start: 110,
        length: 20,
        follows: "lock",
      },
    ];
    return elements;
  },
);
