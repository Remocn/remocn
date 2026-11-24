import {
  defineTimeline,
  type ResolvedTimeline,
  type TimelineElement,
} from "@/lib/remocn/timeline";

// An agent run in a chat panel: the panel and the prompt rising in, the
// status thinking while the plan streams in, the tool calls one after
// another and the answer streaming in. Frames on the 30 fps scene timeline,
// after `speed`. The ids are public: a saved `timing` prop refers to them.

export type AgentRunElementId =
  | "panel"
  | "bubble"
  | "think"
  | "plan"
  | "swap"
  | `tool:${number}`
  | "answer";

export interface AgentRunTimingProps {
  run?: AgentRunScript;
  compression?: number;
  seed?: number;
}

export interface AgentRunPlanOptions {
  seed?: number;
  compression?: number;
}

export const PANEL_IN = 14;
export const BUBBLE_AT = 4;
export const BUBBLE_IN = 10;
export const RUN_START = 16;
const THINK_LEAD = 14;
const THINK_TAIL = 8;
export const SWAP = 8;
const TOOL_GAP = 5;
const TOOL_MIN = 12;
const TOOL_MAX = 120;
const ANSWER_GAP = 8;
const SETTLE = 16;
const MIN_COMPRESSION = 0.25;
const MAX_COMPRESSION = 20;
const DEFAULT_SEED = 1;
const DEFAULT_COMPRESSION = 3;

const SIZE_WEIGHTS = [8, 16, 22, 22, 17, 15];
const GAP_WEIGHTS = [42, 33, 16, 9];
const PAUSE_CHANCE = 0.06;
const PAUSE_MIN = 4;
const PAUSE_SPREAD = 4;
const BLOCK_MIN = 2;
const BLOCK_SPREAD = 3;

const finite = (value: number | undefined, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const seedOf = (seed: number | undefined) => finite(seed, DEFAULT_SEED);
const compressionOf = (compression: number | undefined) =>
  clamp(
    finite(compression, DEFAULT_COMPRESSION),
    MIN_COMPRESSION,
    MAX_COMPRESSION,
  );

// Remotion's `random()` for a string seed, so the stream's chunks stay
// exactly as they were.
function mulberry32(a: number) {
  let t = a + 1831565813;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function seeded(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return mulberry32(hash);
}

export type AgentRunIcon =
  | "chart"
  | "database"
  | "search"
  | "book"
  | "globe"
  | "terminal"
  | "file";

export interface AgentRunStep {
  name: string;
  detail?: string;
  duration: number;
  icon?: AgentRunIcon;
  sources?: readonly string[];
}

export interface AgentRunScript {
  title?: string;
  prompt: string;
  plan?: readonly string[];
  steps?: readonly AgentRunStep[];
  answer: string;
}

export const DEFAULT_RUN: AgentRunScript = {
  title: "Checkout conversion drop",
  prompt: "Why did checkout conversion drop last week?",
  plan: [
    "Compare the checkout funnel with the week before",
    "Break the drop down by browser and step",
    "Check what shipped and what the error logs say",
  ],
  steps: [
    {
      icon: "chart",
      name: "Query analytics",
      detail: "checkout funnel, last 7 days vs prior 7",
      duration: 1.4,
    },
    {
      icon: "database",
      name: "Run SQL",
      detail: "conversion by browser and step",
      duration: 2.3,
    },
    {
      icon: "search",
      name: "Search logs",
      detail: "Apple Pay errors on Safari",
      duration: 1.1,
    },
    {
      icon: "book",
      name: "Read 12 sources",
      duration: 3.2,
      sources: [
        "Checkout funnel",
        "Browser report",
        "Release 4.12",
        "PR #2186",
        "webkit.org",
        "developer.mozilla.org",
        "Payments runbook",
        "Error log",
        "Incident notes",
        "Apple Pay guide",
        "Support tickets",
        "Status page",
      ],
    },
  ],
  answer: [
    "## Apple Pay broke on Safari in release 4.12",
    "",
    "Checkout conversion fell from 3.4% to 2.7% last week, a 21% drop [1]. All of it comes from the payment step on Safari, 41% of checkouts [2].",
    "",
    "- Safari conversion halved, from 3.5% to 1.8%",
    "- Chrome and Firefox held steady at 3.3%",
    '- 4.12 moved the card form into an iframe without `allow="payment"` [3]',
    "",
    "```tsx",
    "<iframe",
    "  src={cardFormUrl}",
    '  allow="payment"',
    "/>",
    "```",
    "",
    "**Fix:** add the attribute and ship 4.12.1 today.",
  ].join("\n"),
};

const isLetter = (code: number) =>
  (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || code >= 192;
const isDigit = (code: number) => code >= 48 && code <= 57;

export function agentRunTokens(text: string): number[] {
  const ends: number[] = [];
  let index = 0;
  while (index < text.length) {
    if (text[index] === "\n") {
      index += 1;
      ends.push(index);
      continue;
    }
    while (
      index < text.length &&
      (text[index] === " " || text[index] === "\t")
    ) {
      index += 1;
    }
    if (index < text.length && text[index] !== "\n") {
      const code = text.charCodeAt(index);
      if (isLetter(code)) {
        while (index < text.length && isLetter(text.charCodeAt(index))) {
          index += 1;
        }
      } else if (isDigit(code)) {
        const stop = Math.min(text.length, index + 3);
        while (index < stop && isDigit(text.charCodeAt(index))) {
          index += 1;
        }
      } else {
        index += 1;
      }
    }
    ends.push(index);
  }
  return ends;
}

export interface AgentRunChunk {
  index: number;
  at: number;
  start: number;
  end: number;
  tokens: number;
  block: boolean;
}

function pick(weights: readonly number[], value: number) {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = value * total;
  for (const [index, weight] of weights.entries()) {
    if (cursor < weight) return index;
    cursor -= weight;
  }
  return weights.length - 1;
}

export function agentRunChunks(
  text: string,
  seed = DEFAULT_SEED,
  stream = "answer",
): AgentRunChunk[] {
  const ends = agentRunTokens(text);
  const startOf = (token: number) => (token > 0 ? ends[token - 1] : 0);
  const isNewline = (token: number) =>
    token < ends.length && text[startOf(token)] === "\n";
  const key = `agent-run-${seedOf(seed)}-${stream}`;
  const chunks: AgentRunChunk[] = [];
  let token = 0;
  let at = 0;
  let block = false;
  while (token < ends.length) {
    const index = chunks.length;
    const size = pick(SIZE_WEIGHTS, seeded(`${key}-size-${index}`)) + 1;
    let stop = Math.min(ends.length, token + size);
    let cut = false;
    for (let cursor = token; cursor < stop; cursor++) {
      if (isNewline(cursor) && isNewline(cursor + 1)) {
        stop = cursor + 2;
        cut = true;
        break;
      }
    }
    if (!cut && isNewline(stop - 1) && isNewline(stop)) {
      stop += 1;
      cut = true;
    }
    while (cut && isNewline(stop)) stop += 1;
    if (index > 0) {
      at += pick(GAP_WEIGHTS, seeded(`${key}-gap-${index}`)) + 1;
      if (seeded(`${key}-pause-${index}`) < PAUSE_CHANCE) {
        const hold = seeded(`${key}-hold-${index}`) * PAUSE_SPREAD;
        at += PAUSE_MIN + Math.floor(hold);
      }
      if (block) {
        const extra = seeded(`${key}-block-${index}`) * BLOCK_SPREAD;
        at += BLOCK_MIN + Math.floor(extra);
      }
    }
    chunks.push({
      index,
      at,
      start: startOf(token),
      end: ends[stop - 1],
      tokens: stop - token,
      block,
    });
    block = cut;
    token = stop;
  }
  return chunks;
}

function lastArrival(chunks: readonly AgentRunChunk[]) {
  return chunks.length > 0 ? chunks[chunks.length - 1].at : 0;
}

export interface AgentRunSegment {
  kind: "think" | "gap" | "tool" | "answer";
  from: number;
  to: number;
  realFrom: number;
  real: number;
}

export interface AgentRunToolSpan {
  index: number;
  start: number;
  end: number;
  span: number;
  duration: number;
  realStart: number;
}

function planTextOf(run: AgentRunScript) {
  return (run.plan ?? []).join("\n");
}

/** `chunks` with arrivals scaled to end at `length`; the same list untouched. */
function paced(chunks: AgentRunChunk[], length: number) {
  const natural = lastArrival(chunks);
  const factor = natural > 0 ? length / natural : 1;
  return factor === 1
    ? chunks
    : chunks.map((chunk) => ({ ...chunk, at: chunk.at * factor }));
}

/**
 * The run's plan: when the status starts, the plan and the answer stream in,
 * and each tool runs, with the clock's real seconds per stretch. With
 * `placed` (the resolved `agentRunTimeline`), its elements set those moments
 * and a stretched plan or answer streams slower; untouched, the numbers are
 * the ones this function computes on its own.
 */
export function agentRunPlan(
  run: AgentRunScript = DEFAULT_RUN,
  options: AgentRunPlanOptions = {},
  placed?: ResolvedTimeline<AgentRunElementId>,
) {
  const seed = seedOf(options.seed);
  const compression = compressionOf(options.compression);
  const perFrame = compression / 30;
  const planText = planTextOf(run);
  const naturalPlan =
    planText.length > 0 ? agentRunChunks(planText, seed, "plan") : [];
  const runStart = placed ? placed.get("think").start : RUN_START;
  const planEl = placed && planText.length > 0 ? placed.get("plan") : undefined;
  const planChunks = planEl ? paced(naturalPlan, planEl.length) : naturalPlan;
  const planStart = planEl ? planEl.start : RUN_START + THINK_LEAD;
  const planEnd = planStart + lastArrival(planChunks);
  const swapEl = placed?.get("swap");
  const thinkEnd = swapEl ? swapEl.start : planEnd + THINK_TAIL;
  const segments: AgentRunSegment[] = [];
  let real = 0;
  const push = (
    kind: AgentRunSegment["kind"],
    from: number,
    to: number,
    seconds: number,
  ) => {
    segments.push({ kind, from, to, realFrom: real, real: seconds });
    real += seconds;
  };
  push("think", runStart, thinkEnd, (thinkEnd - runStart) * perFrame);
  const thinkSeconds = real;
  const tools: AgentRunToolSpan[] = [];
  let cursor = thinkEnd;
  for (const [index, step] of (run.steps ?? []).entries()) {
    const toolEl = placed?.get(`tool:${index}`);
    const start = toolEl ? toolEl.start : cursor + TOOL_GAP;
    push("gap", cursor, start, Math.max(0, start - cursor) * perFrame);
    cursor = start;
    const duration = Math.max(0, finite(step.duration, 0));
    const span = toolEl
      ? toolEl.length
      : clamp(Math.round(duration / perFrame), TOOL_MIN, TOOL_MAX);
    const realStart = real;
    push("tool", cursor, cursor + span, duration);
    tools.push({
      index,
      start: cursor,
      end: cursor + span,
      span,
      duration,
      realStart,
    });
    cursor += span;
  }
  const answerEl = placed?.get("answer");
  const answerStart = answerEl ? answerEl.start : cursor + ANSWER_GAP;
  push(
    "gap",
    cursor,
    answerStart,
    Math.max(0, answerStart - cursor) * perFrame,
  );
  const naturalAnswer = agentRunChunks(run.answer, seed, "answer");
  const answerChunks = answerEl
    ? paced(naturalAnswer, answerEl.length)
    : naturalAnswer;
  const answerEnd = answerStart + lastArrival(answerChunks);
  push("answer", answerStart, answerEnd, (answerEnd - answerStart) * perFrame);
  const panel = placed?.get("panel");
  const bubble = placed?.get("bubble");
  return {
    compression,
    panelAt: panel ? panel.start : 0,
    panelIn: panel ? panel.length : PANEL_IN,
    bubbleAt: bubble ? bubble.start : BUBBLE_AT,
    bubbleIn: bubble ? bubble.length : BUBBLE_IN,
    runStart,
    planStart,
    planEnd,
    thinkEnd,
    swapLength: swapEl ? swapEl.length : SWAP,
    thinkSeconds,
    tools,
    answerStart,
    answerEnd,
    runEnd: answerEnd,
    settled: answerEnd + SETTLE,
    realTotal: real,
    segments,
    planChunks,
    answerChunks,
  };
}

// The panel and the prompt bubble rising in, the status coming up and
// thinking (think), the plan streaming in (plan), "Thinking" swapping to
// "Thought for Ns" (swap), each tool call running (tool:<i>, one after
// another) and the answer streaming in (answer). Stretching the plan or the
// answer slows its stream; stretching a tool lengthens its spinner.
export const agentRunTimeline = defineTimeline<
  AgentRunElementId,
  AgentRunTimingProps
>(({ run = DEFAULT_RUN, compression, seed }) => {
  const plan = agentRunPlan(run, { compression, seed });
  const hasPlan = planTextOf(run).length > 0;
  const elements: TimelineElement<AgentRunElementId>[] = [
    {
      id: "panel",
      lane: "Panel",
      label: "panel rises in",
      start: 0,
      length: PANEL_IN,
    },
    {
      id: "bubble",
      lane: "Prompt",
      label: run.prompt,
      start: BUBBLE_AT,
      length: BUBBLE_IN,
    },
    {
      id: "think",
      lane: "Status",
      label: "thinking",
      start: plan.runStart,
      length: plan.planStart - plan.runStart,
    },
  ];
  if (hasPlan) {
    elements.push({
      id: "plan",
      lane: "Status",
      label: "plan",
      start: plan.planStart,
      length: plan.planEnd - plan.planStart,
      follows: "think",
    });
  }
  elements.push({
    id: "swap",
    lane: "Status",
    label: "thought",
    start: plan.thinkEnd,
    length: SWAP,
    follows: hasPlan ? "plan" : "think",
  });
  let previous: AgentRunElementId = "swap";
  for (const tool of plan.tools) {
    const id: AgentRunElementId = `tool:${tool.index}`;
    elements.push({
      id,
      lane: "Tools",
      label: run.steps?.[tool.index]?.name ?? "",
      start: tool.start,
      length: tool.span,
      follows: previous,
    });
    previous = id;
  }
  elements.push({
    id: "answer",
    lane: "Answer",
    label: "answer",
    start: plan.answerStart,
    length: plan.answerEnd - plan.answerStart,
    follows: previous,
  });
  return elements;
});
