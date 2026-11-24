import { defineTimeline } from "@/lib/remocn/timeline";

// The terminal prints its lines one after another, each typed out in
// chunks, with a freeze after lines that end in "...". Frames on the 30 fps
// scene timeline, after `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type TerminalSimulatorElementId = `line:${number}`;

export type TerminalLineType = "command" | "log" | "success" | "error";

export interface TerminalLine {
  text: string;
  type: TerminalLineType;
  delay?: number;
  /**
   * Extra freeze-frame pause AFTER this line finishes typing, in frames.
   * Use this to build dramatic tension before the next batch of logs.
   * If omitted, lines whose text ends in "..." auto-freeze for 18 frames.
   */
  pause?: number;
}

export interface TerminalSimulatorTimingProps {
  lines?: TerminalLine[];
  charsPerFrame?: number;
  chunkSize?: number;
}

export const DEFAULT_LINES: TerminalLine[] = [
  { text: "npm run build", type: "command", delay: 0 },
  { text: "Resolving dependencies...", type: "log", delay: 6 },
  { text: "> remocn@1.0.0 build", type: "log", delay: 4 },
  { text: "> next build", type: "log", delay: 4 },
  { text: "Compiling...", type: "log", delay: 12 },
  { text: "Compiled successfully in 4.2s", type: "success", delay: 14 },
  { text: "Generating static pages (24/24)", type: "log", delay: 10 },
  { text: "Build completed without errors", type: "success", delay: 12 },
];

/** Auto freeze-frame heuristic: any line ending in "..." holds the camera. */
function autoPause(line: TerminalLine): number {
  if (line.pause !== undefined) return line.pause;
  if (line.text.trimEnd().endsWith("...")) return 18;
  return 0;
}

// A line runs until the next one starts: its typing, its pause and the next
// line's delay. The `type` beat is how long its characters take to reveal.
// Each line follows the one before it.
export const terminalSimulatorTimeline = defineTimeline<
  TerminalSimulatorElementId,
  TerminalSimulatorTimingProps
>(({ lines = DEFAULT_LINES, charsPerFrame = 1, chunkSize = 1 }) => {
  // Cumulative start frames for each line, including auto/explicit pauses
  // AFTER a line finishes typing.
  const starts: number[] = [];
  const own: number[] = [];
  let acc = 10;
  for (let i = 0; i < lines.length; i++) {
    const delay = lines[i].delay ?? 8;
    acc += delay;
    starts.push(acc);
    // Approximate typing duration (in frames) for chunked output.
    const typingFrames = Math.ceil(
      lines[i].text.length / (chunkSize * charsPerFrame),
    );
    own.push(typingFrames + autoPause(lines[i]));
    acc += typingFrames + autoPause(lines[i]);
  }
  return lines.map((line, i) => ({
    id: `line:${i}`,
    lane: "Lines",
    label: line.text,
    start: starts[i],
    length: i + 1 < lines.length ? starts[i + 1] - starts[i] : own[i],
    follows: i > 0 ? `line:${i - 1}` : undefined,
    beats: { type: line.text.length / charsPerFrame },
  }));
});
