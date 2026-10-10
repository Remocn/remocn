import { describe, expect, it } from "bun:test";
import { getDefaults, resolveControls } from "@/lib/customizer-config";
import {
  type AgentRunModel,
  agentRunDefaults,
  agentRunLength,
  defaultAgentRun,
  estimateAgentRunWidth,
  fitAgentRunChips,
  formatAgentRunSeconds,
  getAgentRunArrival,
  getAgentRunChunks,
  getAgentRunDuration,
  getAgentRunElapsed,
  getAgentRunFrame,
  getAgentRunGrowth,
  getAgentRunLayout,
  getAgentRunModel,
  getAgentRunReveal,
  getAgentRunScroll,
  getAgentRunShimmer,
  getAgentRunSpinner,
  getAgentRunState,
  getAgentRunTimeline,
  parseAgentRunMarkdown,
  tokenizeAgentRun,
} from "..";
import { agentRunConfig } from "../config";

const ANSWER = defaultAgentRun.answer;

function tokensIn(text: string, start: number, end: number) {
  const tokens: string[] = [];
  let previous = 0;
  for (const stop of tokenizeAgentRun(text)) {
    if (stop > start && stop <= end) tokens.push(text.slice(previous, stop));
    previous = stop;
  }
  return tokens;
}

function blockAt(model: AgentRunModel, frame: number, index: number) {
  const state = getAgentRunState(frame, model);
  return state.blocks.find((block) => block.key === `block-${index}`);
}

function headingAt(model: AgentRunModel, frame: number) {
  for (const block of getAgentRunState(frame, model).blocks) {
    if (block.kind === "heading") return block;
  }
  return undefined;
}

function codeAt(model: AgentRunModel, frame: number) {
  for (const block of getAgentRunState(frame, model).blocks) {
    if (block.kind === "code") return block;
  }
  return undefined;
}

describe("agent run timeline", () => {
  it("chains the prompt, the thinking, the tools and the answer", () => {
    const timeline = getAgentRunTimeline();
    expect(timeline.runStart).toBe(16);
    expect(timeline.planStart).toBe(30);
    expect(timeline.planEnd).toBe(48);
    expect(timeline.thinkEnd).toBe(timeline.planEnd + 8);
    expect(timeline.tools.map((tool) => [tool.start, tool.end])).toEqual([
      [61, 75],
      [80, 103],
      [108, 120],
      [125, 157],
    ]);
    let cursor = timeline.thinkEnd;
    for (const tool of timeline.tools) {
      expect(tool.start).toBe(cursor + 5);
      expect(tool.end - tool.start).toBe(tool.span);
      cursor = tool.end;
    }
    expect(timeline.answerStart).toBe(cursor + 8);
    expect(timeline.answerStart).toBe(165);
    expect(timeline.answerEnd).toBe(294);
    expect(timeline.runEnd).toBe(timeline.answerEnd);
    expect(timeline.settled).toBe(timeline.answerEnd + 16);
    expect(agentRunLength).toBe(310);
  });

  it("sizes the preview from the run, the speed and the compression", () => {
    expect(getAgentRunDuration()).toBe(355);
    expect(getAgentRunDuration()).toBe(agentRunConfig.durationInFrames);
    expect(getAgentRunDuration(undefined, { speed: 2 })).toBe(200);
    expect(getAgentRunDuration(undefined, { speed: 0.5 })).toBe(665);
    expect(getAgentRunDuration(undefined, { speed: 0 })).toBe(45);
    expect(getAgentRunDuration(undefined, { compression: 1 })).toBe(514);
    const resolve = agentRunConfig.getDurationInFrames;
    expect(resolve?.({ speed: 2, seed: 1, compression: 3 })).toBe(200);
    expect(resolve?.({ compression: 1 })).toBe(514);
  });

  it("compresses tool calls into video time and clamps the extremes", () => {
    const spans = (compression: number) => {
      const { tools } = getAgentRunTimeline(defaultAgentRun, { compression });
      return tools.map((tool) => tool.span);
    };
    expect(spans(1)).toEqual([42, 69, 33, 96]);
    expect(spans(3)).toEqual([14, 23, 12, 32]);
    expect(spans(6)).toEqual([12, 12, 12, 16]);
    expect(spans(0.1)).toEqual([120, 120, 120, 120]);
    expect(spans(Number.NaN)).toEqual(spans(3));
  });

  it("still runs without a plan, tools or an answer", () => {
    const bare = { prompt: "Summarize the launch notes", answer: "" };
    const timeline = getAgentRunTimeline(bare);
    expect(timeline.thinkEnd).toBe(16 + 14 + 8);
    expect(timeline.tools).toEqual([]);
    expect(timeline.answerStart).toBe(timeline.thinkEnd + 8);
    expect(timeline.answerEnd).toBe(timeline.answerStart);
    const model = getAgentRunModel(bare);
    expect(model.layout.plan).toBeNull();
    expect(model.layout.tools).toBeNull();
    const state = getAgentRunState(80, model);
    expect(state.blocks).toEqual([]);
    expect(state.header.done).toBe(true);
  });
});

describe("agent run timer", () => {
  it("lands every tool row on its real duration", () => {
    const timeline = getAgentRunTimeline();
    expect(getAgentRunElapsed(0, timeline)).toBe(0);
    expect(getAgentRunElapsed(timeline.runStart, timeline)).toBe(0);
    for (const tool of timeline.tools) {
      const start = getAgentRunElapsed(tool.start, timeline);
      const end = getAgentRunElapsed(tool.end, timeline);
      expect(start).toBeCloseTo(tool.realStart, 6);
      expect(end - start).toBeCloseTo(tool.duration, 6);
    }
    const thinking = timeline.thinkEnd - timeline.runStart;
    const thought = getAgentRunElapsed(timeline.thinkEnd, timeline);
    expect(thought).toBeCloseTo(thinking * 0.1, 6);
    expect(timeline.realTotal).toBeCloseTo(27.7, 6);
    const late = getAgentRunElapsed(timeline.runEnd + 120, timeline);
    expect(late).toBeCloseTo(timeline.realTotal, 6);
  });

  it("ticks forward only and freezes when the run ends", () => {
    const timeline = getAgentRunTimeline();
    let previous = 0;
    for (let frame = 0; frame <= 400; frame += 0.5) {
      const elapsed = getAgentRunElapsed(frame, timeline);
      expect(elapsed).toBeGreaterThanOrEqual(previous);
      previous = elapsed;
    }
    const model = getAgentRunModel();
    const done = getAgentRunState(timeline.runEnd + 20, model);
    expect(done.header.label).toBe("27.7s");
    expect(done.header.done).toBe(true);
    expect(done.status.thought).toBe("Thought for 4s");
    const durations = done.tools?.rows.map((row) => row.duration);
    expect(durations).toEqual(["1.4s", "2.3s", "1.1s", "3.2s"]);
  });

  it("formats seconds for the timer and the rows", () => {
    expect(formatAgentRunSeconds(0)).toBe("0.0s");
    expect(formatAgentRunSeconds(1.44)).toBe("1.4s");
    expect(formatAgentRunSeconds(59.9)).toBe("59.9s");
    expect(formatAgentRunSeconds(75)).toBe("1m 15s");
    expect(formatAgentRunSeconds(Number.NaN)).toBe("0.0s");
    expect(formatAgentRunSeconds(-3)).toBe("0.0s");
  });
});

describe("agent run thinking status", () => {
  it("sweeps a restrained, periodic shimmer across the label", () => {
    for (let time = 16; time < 46; time++) {
      const levels = getAgentRunShimmer(time, 8);
      expect(levels).toHaveLength(8);
      expect(Math.min(...levels)).toBeGreaterThanOrEqual(0.45);
      expect(Math.max(...levels)).toBeLessThanOrEqual(1);
      expect(getAgentRunShimmer(time + 30, 8)).toEqual(levels);
    }
    const peaks = [20, 26, 32].map((time) => {
      const levels = getAgentRunShimmer(time, 8);
      return levels.indexOf(Math.max(...levels));
    });
    expect(peaks).toEqual([0, 1, 4]);
  });
});

describe("agent run bursty streaming", () => {
  it("tokenizes words, digit groups, punctuation and newlines", () => {
    const ends = tokenizeAgentRun("Fix 4.12\n\nNow 12345");
    expect(ends).toEqual([3, 5, 6, 8, 9, 10, 13, 17, 19]);
    expect(tokenizeAgentRun("")).toEqual([]);
  });

  it("delivers 1 to 6 tokens per chunk on whole, irregular frames", () => {
    const chunks = getAgentRunChunks(ANSWER, 1);
    expect(chunks[0].at).toBe(0);
    expect(chunks[0].start).toBe(0);
    expect(chunks[chunks.length - 1].end).toBe(ANSWER.length);
    const sizes = new Set<number>();
    const gaps = new Set<number>();
    for (const [index, chunk] of chunks.entries()) {
      const tokens = tokensIn(ANSWER, chunk.start, chunk.end);
      const words = tokens.filter((token) => token !== "\n");
      expect(tokens.length).toBe(chunk.tokens);
      expect(tokens.length).toBeGreaterThan(0);
      expect(words.length).toBeLessThanOrEqual(6);
      if (words.length > 0) sizes.add(words.length);
      if (index === 0) continue;
      const gap = chunk.at - chunks[index - 1].at;
      expect(chunk.start).toBe(chunks[index - 1].end);
      expect(Number.isInteger(gap)).toBe(true);
      expect(gap).toBeGreaterThanOrEqual(1);
      expect(gap).toBeLessThanOrEqual(15);
      gaps.add(gap);
    }
    expect(sizes.size).toBeGreaterThanOrEqual(5);
    expect(gaps.size).toBeGreaterThanOrEqual(5);
    expect(Math.max(...gaps)).toBeGreaterThanOrEqual(5);
  });

  it("never reveals text at a constant rate", () => {
    const chunks = getAgentRunChunks(ANSWER, 1);
    const deltas: number[] = [];
    for (let local = 1; local <= chunks[chunks.length - 1].at; local++) {
      const now = getAgentRunReveal(chunks, local);
      deltas.push(now - getAgentRunReveal(chunks, local - 1));
    }
    const idle = deltas.filter((delta) => delta === 0).length;
    const bursts = new Set(deltas.filter((delta) => delta > 0));
    expect(idle).toBeGreaterThan(deltas.length / 4);
    expect(bursts.size).toBeGreaterThanOrEqual(10);
    expect(Math.max(...deltas)).toBeGreaterThanOrEqual(20);
    expect(deltas.every((delta) => delta >= 0)).toBe(true);
    expect(getAgentRunReveal(chunks, -1)).toBe(0);
    expect(getAgentRunReveal(chunks, 9999)).toBe(ANSWER.length);
  });

  it("starts every markdown block on a fresh chunk after a short beat", () => {
    const chunks = getAgentRunChunks(ANSWER, 1);
    let blocks = 0;
    for (const [index, chunk] of chunks.entries()) {
      const body = ANSWER.slice(chunk.start, chunk.end);
      if (!body.includes("\n\n")) continue;
      expect(body).toMatch(/\n\n+$/);
      const next = chunks[index + 1];
      if (next === undefined) continue;
      expect(next.block).toBe(true);
      expect(next.at - chunk.at).toBeGreaterThanOrEqual(3);
      blocks += 1;
    }
    expect(blocks).toBe(4);
  });

  it("reseeds the rhythm without touching the content", () => {
    const first = getAgentRunChunks(ANSWER, 1);
    expect(getAgentRunChunks(ANSWER, 1)).toEqual(first);
    const other = getAgentRunChunks(ANSWER, 2);
    const firstTimes = first.map((chunk) => chunk.at);
    expect(other.map((chunk) => chunk.at)).not.toEqual(firstTimes);
    expect(other[other.length - 1].end).toBe(ANSWER.length);
    const layout = getAgentRunLayout();
    const reseeded = getAgentRunModel(defaultAgentRun, { seed: 2 });
    expect(reseeded.layout).toEqual(layout);
  });
});

describe("agent run progressive markdown", () => {
  const model = getAgentRunModel();
  const { timeline } = model;
  const arrival = (raw: number) =>
    timeline.answerStart + getAgentRunArrival(timeline.answerChunks, raw);

  it("parses the supported markdown subset", () => {
    const source = [
      "# Weekly summary",
      "",
      "Some **bold** and `code` [2].",
      "",
      "* one",
      "- two",
      "",
      "```sql",
      "select 1;",
    ].join("\n");
    const blocks = parseAgentRunMarkdown(source);
    expect(blocks.map((block) => block.kind)).toEqual([
      "heading",
      "paragraph",
      "item",
      "item",
      "code",
    ]);
    const [heading, paragraph, , , code] = blocks;
    expect(heading.kind === "heading" && heading.level).toBe(1);
    const inline = paragraph.kind === "paragraph" ? paragraph.inline : [];
    expect(inline.map((part) => [part.kind, part.text])).toEqual([
      ["text", "Some "],
      ["bold", "bold"],
      ["text", " and "],
      ["code", "code"],
      ["text", " "],
      ["cite", "2"],
      ["text", "."],
    ]);
    expect(code.kind === "code" && code.lang).toBe("sql");
    const lines =
      code.kind === "code" ? code.lines.map((line) => line.text) : [];
    expect(lines).toEqual(["select 1;"]);
  });

  it("styles the heading only once its line completes", () => {
    const [heading] = parseAgentRunMarkdown(ANSWER);
    const done = arrival(heading.end);
    expect(done).toBe(170);
    expect(headingAt(model, timeline.answerStart - 1)).toBeUndefined();
    for (let frame = timeline.answerStart; frame < done; frame++) {
      const block = headingAt(model, frame);
      expect(block?.styled).toBe(false);
      expect(block?.morph).toBe(0);
      expect(block?.mark).toBe("## ");
    }
    expect(headingAt(model, done)?.styled).toBe(true);
    expect(headingAt(model, done)?.morph).toBe(0);
    expect(headingAt(model, done + 3)?.morph).toBeGreaterThan(0.8);
    expect(headingAt(model, done + 8)?.morph).toBe(1);
  });

  it("pops each bullet as its item starts", () => {
    const items = parseAgentRunMarkdown(ANSWER)
      .map((block, index) => ({ block, index }))
      .filter(({ block }) => block.kind === "item");
    const starts = items.map(({ block }) => arrival(block.raw));
    expect(starts).toEqual([217, 233, 244]);
    for (const [row, { index }] of items.entries()) {
      const start = starts[row];
      expect(blockAt(model, start - 1, index)).toBeUndefined();
      let peak = 0;
      for (let frame = start; frame < start + 8; frame++) {
        const block = blockAt(model, frame, index);
        const dot = block?.kind === "item" ? block.dot : 0;
        if (frame === start) {
          expect(dot).toBeGreaterThan(0);
          expect(dot).toBeLessThan(1);
        }
        peak = Math.max(peak, dot);
      }
      expect(peak).toBeGreaterThan(1.05);
      expect(peak).toBeLessThan(1.12);
      const settled = blockAt(model, start + 7, index);
      expect(settled?.kind === "item" && settled.dot).toBe(1);
    }
  });

  it("opens the code panel on its fence and streams its lines inside", () => {
    expect(codeAt(model, 261)).toBeUndefined();
    const opened = codeAt(model, 262);
    expect(opened?.lines).toHaveLength(0);
    expect(opened?.lang).toBe("tsx");
    expect(opened?.height).toBeGreaterThan(0);
    const linesAt = (frame: number) => codeAt(model, frame)?.lines.length;
    expect([263, 265, 268, 272].map(linesAt)).toEqual([1, 2, 3, 4]);
    let previous = 0;
    for (let frame = 262; frame <= 290; frame++) {
      const height = codeAt(model, frame)?.height ?? 0;
      expect(height).toBeGreaterThanOrEqual(previous);
      previous = height;
    }
    expect(previous).toBe(142);
  });

  it("shows a citation chip only when its bracket closes", () => {
    const lineAt = (frame: number) => {
      const block = blockAt(model, frame, 1);
      return block?.kind === "paragraph" ? block.lines[0].spans : [];
    };
    const cites = (frame: number) =>
      lineAt(frame).filter((span) => span.kind === "cite");
    expect(cites(200)).toHaveLength(0);
    expect(cites(201)).toHaveLength(1);
    expect(cites(201)[0].opacity).toBeGreaterThan(0);
    expect(cites(210)[0].scale).toBe(1);
    const text = lineAt(200)
      .flatMap((span) => span.fragments.map((part) => part.text))
      .join("");
    expect(text).not.toContain("[");
  });

  it("fades each arriving chunk in over a few frames", () => {
    const opacities = (frame: number) => {
      const values: number[] = [];
      for (const block of getAgentRunState(frame, model).blocks) {
        for (const line of block.lines) {
          for (const span of line.spans) {
            for (const part of span.fragments) values.push(part.opacity);
          }
        }
      }
      return values;
    };
    const { answerStart, answerEnd, settled } = timeline;
    for (let frame = answerStart; frame <= answerEnd; frame++) {
      const values = opacities(frame);
      expect(values.every((value) => value > 0 && value <= 1)).toBe(true);
    }
    const arriving = opacities(answerStart);
    expect(arriving.some((value) => value < 1)).toBe(true);
    const rested = opacities(settled);
    expect(rested.every((value) => value === 1)).toBe(true);
  });
});

describe("agent run tool rows", () => {
  const model = getAgentRunModel();
  const { timeline } = model;

  const rows = (frame: number) => getAgentRunState(frame, model).tools?.rows;

  it("resolves each spinner into a check at the step's end", () => {
    for (const tool of timeline.tools) {
      const hidden = rows(tool.start - 1)?.map((row) => row.index) ?? [];
      expect(hidden).not.toContain(tool.index);
      const running = rows(tool.end - 1)?.[tool.index];
      expect(running?.spinner.resolved).toBe(false);
      expect(running?.spinner.check).toBe(0);
      expect(running?.label).toBe(0);
      const resolved = rows(tool.end + 10)?.[tool.index];
      expect(resolved?.spinner.resolved).toBe(true);
      expect(resolved?.spinner.arc).toBe(1);
      expect(resolved?.spinner.done).toBe(1);
      expect(resolved?.spinner.check).toBe(1);
      expect(resolved?.label).toBe(1);
    }
  });

  it("spins at a constant rate and coasts to rest as it closes", () => {
    const running = getAgentRunSpinner(10, 0, 20);
    expect(running).toEqual({
      angle: 30,
      arc: 0.28,
      done: 0,
      check: 0,
      resolved: false,
    });
    const end = getAgentRunSpinner(20, 0, 20);
    expect(end.angle).toBe(150);
    expect(getAgentRunSpinner(28, 0, 20).angle).toBe(198);
    expect(getAgentRunSpinner(60, 0, 20).angle).toBe(198);
    expect(getAgentRunSpinner(30, 0, 20).check).toBe(1);
  });

  it("pops the source chips in order inside the read step", () => {
    const read = timeline.tools[3];
    const rowAt = (frame: number) => rows(frame)?.[3];
    const first = rowAt(read.start);
    expect(first?.chips.map((chip) => chip.label)).toEqual([
      "Checkout funnel",
      "Browser report",
      "Release 4.12",
      "PR #2186",
      "webkit.org",
    ]);
    expect(first?.more?.count).toBe(7);
    const early = rowAt(read.start + 3)?.chips.some((chip) => chip.visible);
    expect(early).toBe(false);
    let previous = 0;
    for (let frame = read.start; frame <= read.end; frame++) {
      const row = rowAt(frame);
      const shown = row?.chips.filter((chip) => chip.visible).length ?? 0;
      expect(shown).toBeGreaterThanOrEqual(previous);
      previous = shown;
    }
    const full = rowAt(read.start + Math.ceil(0.7 * read.span) + 1);
    expect(full?.chips.every((chip) => chip.visible)).toBe(true);
    expect(full?.more?.visible).toBe(true);
  });

  it("fits source chips on one line with a +N chip", () => {
    const sources = defaultAgentRun.steps?.[3].sources ?? [];
    expect(fitAgentRunChips(sources).chips).toHaveLength(5);
    expect(fitAgentRunChips(sources).more).toBe(7);
    expect(fitAgentRunChips(["docs.example.com"]).chips).toEqual([
      { label: "docs.example.com", icon: "globe" },
    ]);
    const many = fitAgentRunChips(["a", "b", "c", "d", "e", "f", "g", "h"]);
    expect(many.chips).toHaveLength(6);
    expect(many.more).toBe(2);
  });
});

describe("agent run calm column", () => {
  it("scrolls forward gently and keeps new text above the fold", () => {
    for (const [width, height] of [
      [1280, 720],
      [1080, 1080],
    ]) {
      const model = getAgentRunModel(defaultAgentRun, { width, height });
      const growth = getAgentRunGrowth(model.layout, model.timeline);
      let previous = 0;
      for (let frame = 0; frame <= agentRunLength + 20; frame++) {
        const scroll = getAgentRunScroll(frame, model.scroll);
        expect(scroll).toBeGreaterThanOrEqual(previous - 1e-9);
        expect(scroll - previous).toBeLessThan(10);
        previous = scroll;
        const bottoms = growth
          .filter((event) => event.at <= frame)
          .map((event) => event.bottom);
        const bottom = Math.max(0, ...bottoms);
        expect(bottom).toBeLessThanOrEqual(scroll + model.stage.viewport);
      }
      const rest = model.layout.height + 40 - model.stage.viewport;
      expect(getAgentRunScroll(10_000, model.scroll)).toBeCloseTo(rest, 3);
    }
  });

  it("keeps a burst's newest line above the fold on every seed", () => {
    let margin = Number.POSITIVE_INFINITY;
    for (let seed = 1; seed <= 99; seed++) {
      const model = getAgentRunModel(defaultAgentRun, { seed });
      const growth = getAgentRunGrowth(model.layout, model.timeline);
      let bottom = 0;
      let next = 0;
      for (let frame = 0; frame <= model.timeline.settled; frame++) {
        while (next < growth.length && growth[next].at <= frame) {
          bottom = Math.max(bottom, growth[next].bottom);
          next += 1;
        }
        const scroll = getAgentRunScroll(frame, model.scroll);
        margin = Math.min(margin, scroll + model.stage.viewport - bottom);
      }
    }
    expect(margin).toBeGreaterThanOrEqual(16);
  });

  it("does not scroll when the whole run fits the panel", () => {
    const model = getAgentRunModel(defaultAgentRun, {
      width: 1080,
      height: 1920,
    });
    expect(model.scroll).toEqual([]);
    expect(getAgentRunState(300, model).scroll).toBe(0);
  });

  it("scales the panel by height and caps it by width", () => {
    const frame = (width: number, height: number) => {
      const { unit, panelHeight, viewport } = getAgentRunFrame(width, height);
      return [unit, panelHeight, viewport];
    };
    expect(frame(1280, 720)).toEqual([1, 640, 590]);
    expect(frame(1920, 1080)).toEqual([1.5, 640, 590]);
    expect(frame(1080, 1080)).toEqual([1.227, 800, 750]);
    expect(frame(1080, 1920)).toEqual([1.227, 960, 910]);
    expect(frame(Number.NaN, Number.NaN)).toEqual([1, 640, 590]);
  });
});

describe("agent run layout", () => {
  const layout = getAgentRunLayout();

  it("lays out the default answer in short, legible lines", () => {
    expect(layout.blocks.map((block) => block.lines.length)).toEqual([
      1, 2, 1, 1, 1, 4, 1,
    ]);
    expect(layout.height).toBe(829);
    for (const block of layout.blocks) {
      if (block.kind === "code") continue;
      const size = block.kind === "heading" ? 20 : 16;
      const limit = block.kind === "item" ? 658 : 680;
      for (const line of block.lines) {
        const text = line.pieces
          .filter((piece) => piece.kind === "text" || piece.kind === "bold")
          .map((piece) => piece.text)
          .join("");
        expect(estimateAgentRunWidth(text, size)).toBeLessThanOrEqual(limit);
      }
    }
  });

  it("keeps every character of the answer across the wrapped lines", () => {
    const paragraph = layout.blocks[1];
    const shown = paragraph.lines
      .map((line) => line.pieces.map((piece) => piece.text).join(""))
      .join(" ");
    expect(shown).toBe(
      "Checkout conversion fell from 3.4% to 2.7% last week, a 21% drop 1. All of it comes from the payment step on Safari, 41% of checkouts 2.",
    );
    const lines = layout.blocks.flatMap((block) => block.lines);
    expect(lines.every((line) => line.pieces.length > 0)).toBe(true);
  });
});

describe("agent run determinism", () => {
  const model = getAgentRunModel();

  it("renders any frame identically in any sampling order", () => {
    const frames = [0, 12, 40, 90, 170, 230, 266, 300, 400];
    const forward = frames.map((frame) => getAgentRunState(frame, model));
    const backward = [...frames]
      .reverse()
      .map((frame) => getAgentRunState(frame, model))
      .reverse();
    expect(backward).toEqual(forward);
    expect(getAgentRunState(230, getAgentRunModel())).toEqual(forward[5]);
  });

  it("maps other frame rates and speeds onto the 30 fps timeline", () => {
    const base = getAgentRunState(180, model);
    expect(getAgentRunState(360, model, { fps: 60 })).toEqual(base);
    expect(getAgentRunState(360, model, { speed: 0.5 })).toEqual(base);
    const frozen = getAgentRunState(200, model, { speed: 0 });
    expect(frozen).toEqual(getAgentRunState(0, model));
  });
});

describe("agent run config", () => {
  it("matches the component defaults", () => {
    const controls = resolveControls("agent-run", agentRunConfig.controls);
    expect(getDefaults(controls)).toEqual({
      theme: agentRunDefaults.theme,
      accentColor: agentRunDefaults.accentColor,
      compression: agentRunDefaults.compression,
      seed: agentRunDefaults.seed,
      speed: agentRunDefaults.speed,
    });
    const theme = controls.theme;
    expect(theme.type === "select" ? theme.options : []).toEqual([
      "light",
      "dark",
    ]);
    const compression = controls.compression;
    const range =
      compression.type === "number" ? [compression.min, compression.max] : [];
    expect(range).toEqual([1, 8]);
    expect(agentRunConfig.componentName).toBe("AgentRun");
    expect(agentRunConfig.importPath).toBe("@/components/remocn/agent-run");
  });
});
