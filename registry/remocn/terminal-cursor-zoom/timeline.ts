import { defineTimeline } from "@/lib/remocn/timeline";

// The camera rides the cursor of one typed command. The terminal inside is
// `terminal-simulator`, so the one element is its first line, with the same
// id and the same numbers: a `timing` on `line:0` moves the typing and the
// zoom together. Frames on the 30 fps scene timeline, after `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type TerminalCursorZoomElementId = "line:0";

export interface TerminalCursorZoomTimingProps {
  command?: string;
  charsPerFrame?: number;
  chunkSize?: number;
}

export const DEFAULT_COMMAND = "npx shadcn add @remocn/terminal-cursor-zoom";

/** The simulator's first line starts here: 10 frames plus its delay of 0. */
const FIRST_LINE_FRAME = 10;

// The line runs for its typing plus the freeze the simulator adds after a
// line ending in "...". The `type` beat is how long its characters take to
// reveal, and how long the camera travels.
export const terminalCursorZoomTimeline = defineTimeline<
  TerminalCursorZoomElementId,
  TerminalCursorZoomTimingProps
>(({ command = DEFAULT_COMMAND, charsPerFrame = 1, chunkSize = 1 }) => {
  const typingFrames = Math.ceil(command.length / (chunkSize * charsPerFrame));
  const pause = command.trimEnd().endsWith("...") ? 18 : 0;
  return [
    {
      id: "line:0",
      lane: "Lines",
      label: command,
      start: FIRST_LINE_FRAME,
      length: typingFrames + pause,
      beats: { type: command.length / charsPerFrame },
    },
  ];
});
