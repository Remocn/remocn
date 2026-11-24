import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The title rising in, the beam drawing across it, the gap opening wide on
// the inner line and, after `hold`, narrowing again. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type BeamSplitElementId = "rise" | "beam" | "open" | "close";

export interface BeamSplitTimingProps {
  hold?: number;
}

const RISE_AT = -6;
const RISE_END = 14;
const BEAM_AT = 10;
const BEAM_END = 30;
const OPEN_AT = 34;
const OPEN_END = 60;
const CLOSE_AT = 92;
const CLOSE_END = 116;
export const HOLD = CLOSE_AT - OPEN_END;
/** The beam's glow fades in over this many frames. */
const GLOW_IN = 6;
/** The glow and the mark stay on this long after a move lands. */
const AFTER = 8;
/** The light in the gap keeps drifting this long after the close. */
const SWAY_TAIL = 30;

// The rise starts before the scene does. The beam's `glow` beat is its
// glow fading in. On `open` and `close`, `moving` is how long the glow and
// the mark stay on (past the move's end); on `open` the glow fades from
// `glowOut` to `glowGone`; on `close` it comes back from `glowIn` (negative)
// to `glowFull` and fades from `glowOut` to `glowGone`, and `sway` is when
// the light in the gap stops drifting. The close follows the open.
export const beamSplitTimeline = defineTimeline<
  BeamSplitElementId,
  BeamSplitTimingProps
>(({ hold = HOLD }) => {
  const closeAt = OPEN_END + hold;
  const closeLen = CLOSE_END - CLOSE_AT;
  const openLen = OPEN_END - OPEN_AT;
  const elements: TimelineElement<BeamSplitElementId>[] = [
    {
      id: "rise",
      lane: "Title",
      label: "rise",
      start: RISE_AT,
      length: RISE_END - RISE_AT,
    },
    {
      id: "beam",
      lane: "Beam",
      label: "beam",
      start: BEAM_AT,
      length: BEAM_END - BEAM_AT,
      beats: { glow: GLOW_IN },
    },
    {
      id: "open",
      lane: "Gap",
      label: "open",
      start: OPEN_AT,
      length: openLen,
      beats: {
        moving: openLen + AFTER,
        glowOut: openLen - 4,
        glowGone: openLen + 10,
      },
    },
    {
      id: "close",
      lane: "Gap",
      label: "close",
      start: closeAt,
      length: closeLen,
      follows: "open",
      beats: {
        moving: closeLen + AFTER,
        glowIn: -2,
        glowFull: 6,
        glowOut: closeLen - 2,
        glowGone: closeLen + 12,
        sway: closeLen + SWAY_TAIL,
      },
    },
  ];
  return elements;
});
