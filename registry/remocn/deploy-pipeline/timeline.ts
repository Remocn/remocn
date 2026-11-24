import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The deployment page: the panel rises, the build starts and its log
// streams in line by line, then the deployment turns ready. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type DeployPipelineElementId =
  | "panel"
  | "build"
  | `line:${number}`
  | "ready";

export type DeployLogTone = "default" | "muted" | "success" | "warn";

export interface DeployLogLine {
  text: string;
  tone?: DeployLogTone;
  /** Frames to wait after the previous line (default 3). */
  wait?: number;
}

export interface DeployPipelineTimingProps {
  logs?: (string | DeployLogLine)[];
}

export const DEFAULT_LOGS: DeployLogLine[] = [
  { text: "Running build in Washington, D.C., USA (East) – iad1", wait: 0 },
  { text: "Build machine configuration: 4 cores, 8 GB" },
  { text: "Cloning git.kitebase.dev/remocn-web (branch main, commit a4f9c21)" },
  { text: "Cloning completed: 412.000ms", wait: 7 },
  { text: "Restored build cache from previous deployment (8kQ2v1Xa)" },
  { text: 'Running "bun install"' },
  {
    text: 'Warning: "engines": { "node": ">=20" } will upgrade the runtime on the next major',
    tone: "warn",
  },
  { text: "bun install v1.2.4 (a3f1e2c4)", tone: "muted", wait: 4 },
  { text: "312 packages installed [4.21s]", wait: 11 },
  { text: 'Running "bun run build"' },
  { text: "  Creating an optimized production build ...", wait: 4 },
  { text: "✓ Compiled successfully in 9.8s", tone: "success", wait: 13 },
  { text: "✓ Generating static pages (24/24)", tone: "success", wait: 6 },
  {
    text: "Route                         Size   First load",
    tone: "muted",
    wait: 5,
  },
  { text: "┌ ○ /                       5.21 kB       112 kB", wait: 2 },
  { text: "├ ○ /docs                   3.08 kB       109 kB", wait: 2 },
  { text: "├ ƒ /api/render                 0 B       101 kB", wait: 2 },
  { text: "└ ○ /changelog              1.84 kB       104 kB", wait: 2 },
  { text: "Build completed in /out [21s]", wait: 6 },
  { text: "Deploying outputs...", wait: 5 },
  { text: "Deployment completed", tone: "success", wait: 10 },
];

/** Log entries as lines: a plain string is a line in the default tone. */
export const logLinesOf = (logs: (string | DeployLogLine)[]) =>
  logs.map((l): DeployLogLine => (typeof l === "string" ? { text: l } : l));

const LOG_START = 16;
/** Frames a log line takes to slide in. */
const LINE_IN = 6;
/** Frames from the last line to the deployment turning ready. */
const READY_GAP = 8;

// The panel fades in over its length and rises on a spring; the camera
// pushes in over `push`. `build` runs from the first log line to ready: the
// duration counter counts across it. Each line follows the one before it,
// and `ready` follows the last line: the status swaps, the preview replaces
// the skeleton and the Visit button pops in on its beats.
export const deployPipelineTimeline = defineTimeline<
  DeployPipelineElementId,
  DeployPipelineTimingProps
>(({ logs = DEFAULT_LOGS }): TimelineElement<DeployPipelineElementId>[] => {
  const lines = logLinesOf(logs);
  const ats: number[] = [];
  let at = LOG_START;
  lines.forEach((l, i) => {
    at += l.wait ?? (i === 0 ? 0 : 3);
    ats.push(at);
  });
  const readyAt = (ats[ats.length - 1] ?? LOG_START) + READY_GAP;
  const elements: TimelineElement<DeployPipelineElementId>[] = [
    {
      id: "panel",
      lane: "Panel",
      label: "deployment panel",
      start: 0,
      length: 12,
      beats: { push: 180, headAt: 4, headEnd: 20 },
    },
    {
      id: "build",
      lane: "Status",
      label: "building",
      start: LOG_START,
      length: readyAt - LOG_START,
    },
  ];
  lines.forEach((l, i) => {
    elements.push({
      id: `line:${i}`,
      lane: "Log",
      label: l.text,
      start: ats[i],
      length: LINE_IN,
      follows: i > 0 ? `line:${i - 1}` : undefined,
    });
  });
  elements.push({
    id: "ready",
    lane: "Status",
    label: "ready",
    start: readyAt,
    length: 14,
    follows: lines.length > 0 ? `line:${lines.length - 1}` : "build",
    beats: {
      swap: 8,
      skeleton: 8,
      previewAt: 2,
      previewEnd: 14,
      barOutAt: 2,
      barOutEnd: 12,
      visitAt: 10,
      pulse: 24,
    },
  });
  return elements.sort((a, b) => a.start - b.start);
});
