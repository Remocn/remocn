import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The note card pops in, the opening words type out, then each suggestion
// shows as ghost text and is accepted with a key press that fills it in;
// the logo follows the last fill while the camera pushes in slowly. Frames
// on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type GhostCompleteElementId =
  | "push"
  | "card"
  | "type"
  | `ghost:${number}`
  | `accept:${number}`
  | "logo";

export interface GhostCompleteTimingProps {
  typed?: string;
  suggestions?: string[];
  /** Frames a ghost suggestion waits before it is accepted. */
  hold?: number;
}

export const DEFAULT_TYPED = "Ship the";
export const DEFAULT_SUGGESTIONS = ["launch video", "\nbefore lunch."];

const TYPE_START = 6;
const PER_CHAR = 2;
const GHOST_LEAD = 4;
const HOLD_GHOST = 16;
const AFTER_FILL = 8;
const SETTLE = 12;

/** A suggestion as it is drawn: led by a space unless it opens a line. */
export const suggestionText = (raw: string) =>
  raw.startsWith("\n") || raw.startsWith(" ") ? raw : ` ${raw}`;

// The opening words type a character every `char` frames. A ghost shows
// its letters `stagger` apart, each over `appear`, and waits for its
// accept; the first one waits 6 frames longer. An accept fills the
// suggestion over its length and settles it into the ink `settleAt` after;
// the key goes down `pressAt` before it. The logo lands on the end of the
// last accept, rising from `in` before it. The push runs from frame 0 to
// 40 frames past that.
export const ghostCompleteTimeline = defineTimeline<
  GhostCompleteElementId,
  GhostCompleteTimingProps
>(
  ({
    typed = DEFAULT_TYPED,
    suggestions = DEFAULT_SUGGESTIONS,
    hold = HOLD_GHOST,
  }) => {
    const elements: TimelineElement<GhostCompleteElementId>[] = [
      {
        id: "card",
        lane: "Card",
        label: "card",
        start: 0,
        length: TYPE_START,
      },
      {
        id: "type",
        lane: "Text",
        label: typed,
        start: TYPE_START,
        length: typed.length * PER_CHAR,
        beats: { char: PER_CHAR, busyTail: 2 },
      },
    ];
    let clock = TYPE_START + typed.length * PER_CHAR + GHOST_LEAD;
    suggestions.forEach((raw, k) => {
      const chars = Array.from(suggestionText(raw));
      const fillDur = Math.max(7, Math.min(12, chars.length * 0.6));
      const ghostIn = clock;
      const accept = ghostIn + hold + (k === 0 ? 6 : 0);
      elements.push(
        {
          id: `ghost:${k}`,
          lane: "Text",
          label: raw.trim(),
          start: ghostIn,
          length: accept - ghostIn,
          follows: k === 0 ? "type" : `accept:${k - 1}`,
          beats: {
            showAt: -0.5,
            stagger: 0.35,
            appear: 6,
            breakAt: -2,
            break: 14,
            armAt: 2,
            armEnd: 12,
            keyAt: -4,
          },
        },
        {
          id: `accept:${k}`,
          lane: "Text",
          label: `accept ${raw.trim()}`,
          start: accept,
          length: fillDur,
          follows: `ghost:${k}`,
          beats: {
            busyAt: -2,
            busyTail: 3,
            settleAt: AFTER_FILL,
            settle: SETTLE,
            hintAt: 4,
            hintEnd: 12,
            pressAt: -3,
            releaseAt: 2,
          },
        },
      );
      clock = accept + fillDur + AFTER_FILL;
    });
    elements.push({
      id: "logo",
      lane: "Logo",
      label: "logo",
      start: clock,
      length: 12,
      follows:
        suggestions.length > 0 ? `accept:${suggestions.length - 1}` : undefined,
      beats: { in: -2 },
    });
    elements.unshift({
      id: "push",
      lane: "Camera",
      label: "push",
      start: 0,
      length: clock + 40,
    });
    return elements;
  },
);
