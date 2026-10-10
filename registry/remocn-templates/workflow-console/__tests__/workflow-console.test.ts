import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  resolveWorkflowProps,
  terminalContent,
  workflowBars,
  workflowContent,
} from "../content";
import { countryOutlines, defaultCountries } from "../countries";
import {
  barHeights,
  chapterAt,
  chartBarGrowth,
  recommendationCamera,
  toolRunExit,
  typed,
  WORKFLOW_FRAMES,
  workflowTimeline,
} from "../motion";

test("chart growth is continuous, bounded and reaches each bar's final height", () => {
  for (let index = 0; index < 8; index++) {
    let previous = 0;
    for (let frame = 2328; frame < 2448; frame++) {
      const growth = chartBarGrowth(frame / 60, index);
      expect(growth).toBeGreaterThanOrEqual(previous);
      expect(growth).toBeLessThanOrEqual(1);
      previous = growth;
    }
    expect(chartBarGrowth(40.7, index)).toBe(1);
    for (const t of [39.3, 40.1]) {
      const dt = 0.0001;
      const delta =
        chartBarGrowth(t + dt, index) -
        2 * chartBarGrowth(t, index) +
        chartBarGrowth(t - dt, index);
      expect(Math.abs(delta / dt)).toBeLessThan(0.01);
    }
  }
});

test("recommendation camera is monotonic and velocity-continuous at zoom boundaries", () => {
  for (const length of [0, 8, 48, 120]) {
    let previous = recommendationCamera(32.85, length);
    for (let frame = 1972; frame <= 2241; frame++) {
      const current = recommendationCamera(frame / 60, length);
      expect(current.x).toBeLessThanOrEqual(previous.x);
      expect(current.y).toBeGreaterThanOrEqual(previous.y);
      expect(current.scale).toBeGreaterThanOrEqual(previous.scale);
      expect(current.scale).toBeLessThanOrEqual(1.65);
      previous = current;
    }
    const dt = 0.0001;
    for (const t of [32.85, 35.5, 37.15, 37.2]) {
      for (const key of ["x", "y", "scale"] as const) {
        const before = recommendationCamera(t - dt, length)[key];
        const current = recommendationCamera(t, length)[key];
        const after = recommendationCamera(t + dt, length)[key];
        expect(
          Math.abs((after - current) / dt - (current - before) / dt),
        ).toBeLessThan(1);
      }
    }
  }
});

test("tool log wipes fully before delivery without stopping partway", () => {
  expect(toolRunExit(19)).toBe(0);
  expect(toolRunExit(19.35)).toBe(0);
  expect(toolRunExit(19.9)).toBe(1);
  expect(toolRunExit(20)).toBe(1);
  let previous = 0;
  for (let frame = 1162; frame < 1194; frame++) {
    const progress = toolRunExit(frame / 60);
    expect(progress).toBeGreaterThan(previous);
    expect(progress).toBeLessThan(1);
    previous = progress;
  }
});

test("all 2810 output frames have exactly one owning chapter", () => {
  expect(workflowTimeline[0].from).toBe(0);
  expect(workflowTimeline.at(-1)?.to).toBe(WORKFLOW_FRAMES);
  for (let frame = 0; frame < WORKFLOW_FRAMES; frame++) {
    expect(
      workflowTimeline.filter((shot) => frame >= shot.from && frame < shot.to),
    ).toHaveLength(1);
    expect(chapterAt(frame)).toBeDefined();
  }
  for (const shot of [...workflowTimeline].reverse()) {
    expect(chapterAt(shot.from)?.id).toBe(shot.id);
    expect(chapterAt(shot.to - 1)?.id).toBe(shot.id);
  }
  expect(chapterAt(WORKFLOW_FRAMES)).toBeUndefined();
});

test("frame-rate conversion keeps chapter boundaries contiguous", () => {
  for (const fps of [24, 30, 60]) {
    const shots = workflowTimeline.map((shot) => ({
      from: Math.round((shot.from / 60) * fps),
      to: Math.round((shot.to / 60) * fps),
    }));
    for (let i = 1; i < shots.length; i++)
      expect(shots[i].from).toBe(shots[i - 1].to);
  }
});

test("Studio has an explicit named instance for every documented chapter", () => {
  const source = readFileSync(
    path.resolve(import.meta.dir, "../index.tsx"),
    "utf8",
  );
  const shots = [
    ...source.matchAll(
      /name="([^"]+)"\s+from=\{at\((\d+)\)\}\s+durationInFrames=\{at\((\d+)\) - at\((\d+)\)\}/g,
    ),
  ].map((match) => {
    expect(Number(match[2])).toBe(Number(match[4]));
    return { id: match[1], from: Number(match[2]), to: Number(match[3]) };
  });
  expect(shots).toEqual([...workflowTimeline]);
});

test("typing is seek-safe and never splits supplementary Unicode characters", () => {
  const text = "𝕏 Ads MCP";
  expect(typed(text, -1, 0, 1)).toBe("");
  expect(typed(text, 1, 0, 1)).toBe(text);
  expect(typed(text, 0.2, 0, 1)).toBe("𝕏");
  expect(typed(text, 0.5, 0, 1)).toBe(typed(text, 0.5, 0, 1));
});

test("partial props retain defaults and list inputs have valid fallbacks", () => {
  const scene = resolveWorkflowProps({
    productName: "Studio",
    content: { closing: "Build it", prefix: undefined },
    countries: [],
    bars: [{ label: "bad", value: Number.NaN, detail: "" }],
  });
  expect(scene.content.product).toBe("Studio");
  expect(scene.content.prefix).toBe(workflowContent.prefix);
  expect(scene.content.closing).toBe("Build it");
  expect(scene.countries).toEqual(defaultCountries);
  expect(scene.bars).toEqual(workflowBars);
  expect(resolveWorkflowProps({ accentColor: "" }).accent).toBe("#8ed8f8");
});

test("chart data normalizes safely, including all-zero values", () => {
  expect(barHeights([0, 0], 1, 100)).toEqual([0, 0]);
  expect(barHeights([25, 50], 1, 100)).toEqual([50, 100]);
  expect(barHeights([25, 50], 0.5, 100)).toEqual([25, 50]);
  expect(barHeights([25], -1, 100)).toEqual([0]);
});

test("every country has a self-contained outline and terminal rows are timed", () => {
  for (const country of defaultCountries) {
    expect(countryOutlines[country]).toStartWith("M");
    expect(countryOutlines[country]).toEndWith("Z");
    expect(countryOutlines[country]).not.toContain("NaN");
  }
  for (const run of ["campaign", "launched", "stats"] as const) {
    const rows = terminalContent(run, workflowContent);
    expect(rows.length).toBeGreaterThan(0);
    for (let i = 1; i < rows.length; i++)
      expect(rows[i].at).toBeGreaterThanOrEqual(rows[i - 1].at);
  }
});

test("registry includes every local module and declares primitive dependencies", () => {
  const base = path.resolve(import.meta.dir, "../..");
  const registry = JSON.parse(
    readFileSync(path.join(base, "registry.json"), "utf8"),
  );
  const item = registry.items.find(
    (entry: { name: string }) => entry.name === "workflow-console",
  );
  const files = new Set<string>(
    item.files.map((file: { path: string }) => path.resolve(base, file.path)),
  );
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(
      /(?:from\s+|import\s*)["'](\.[^"']+)["']/g,
    )) {
      const resolved = path.resolve(path.dirname(file), match[1]);
      expect(
        [resolved, `${resolved}.ts`, `${resolved}.tsx`].some((candidate) =>
          files.has(candidate),
        ),
      ).toBe(true);
    }
    for (const forbidden of [
      "/Downloads/",
      "@/registry/",
      "Math.random()",
      "Date.now()",
      "<Video",
      "<OffthreadVideo",
      "setInterval(",
    ])
      expect(source).not.toContain(forbidden);
  }
  expect(item.registryDependencies).toEqual([
    "@remocn/typed-split-wipe",
    "@remocn/caret",
  ]);
  expect(item.dependencies).toContain("@fontsource/roboto-mono");
});
