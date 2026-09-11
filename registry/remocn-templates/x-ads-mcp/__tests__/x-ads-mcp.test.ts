import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  resolveXAdsProps,
  terminalContent,
  xAdsBars,
  xAdsContent,
} from "../content";
import { countryOutlines, defaultCountries } from "../countries";
import {
  barHeights,
  chapterAt,
  typed,
  X_ADS_FRAMES,
  xAdsTimeline,
} from "../motion";

test("all 2810 output frames have exactly one owning chapter", () => {
  expect(xAdsTimeline[0].from).toBe(0);
  expect(xAdsTimeline.at(-1)?.to).toBe(X_ADS_FRAMES);
  for (let frame = 0; frame < X_ADS_FRAMES; frame++) {
    expect(
      xAdsTimeline.filter((shot) => frame >= shot.from && frame < shot.to),
    ).toHaveLength(1);
    expect(chapterAt(frame)).toBeDefined();
  }
  for (const shot of [...xAdsTimeline].reverse()) {
    expect(chapterAt(shot.from)?.id).toBe(shot.id);
    expect(chapterAt(shot.to - 1)?.id).toBe(shot.id);
  }
  expect(chapterAt(X_ADS_FRAMES)).toBeUndefined();
});

test("frame-rate conversion keeps chapter boundaries contiguous", () => {
  for (const fps of [24, 30, 60]) {
    const shots = xAdsTimeline.map((shot) => ({
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
  expect(shots).toEqual([...xAdsTimeline]);
});

test("typing is seek-safe and never splits supplementary Unicode characters", () => {
  const text = "𝕏 Ads MCP";
  expect(typed(text, -1, 0, 1)).toBe("");
  expect(typed(text, 1, 0, 1)).toBe(text);
  expect(typed(text, 0.2, 0, 1)).toBe("𝕏");
  expect(typed(text, 0.5, 0, 1)).toBe(typed(text, 0.5, 0, 1));
});

test("partial props retain defaults and list inputs have valid fallbacks", () => {
  const scene = resolveXAdsProps({
    productName: "Studio",
    content: { closing: "Build it", prefix: undefined },
    countries: [],
    bars: [{ label: "bad", value: Number.NaN, detail: "" }],
  });
  expect(scene.content.product).toBe("Studio");
  expect(scene.content.prefix).toBe(xAdsContent.prefix);
  expect(scene.content.closing).toBe("Build it");
  expect(scene.countries).toEqual(defaultCountries);
  expect(scene.bars).toEqual(xAdsBars);
  expect(resolveXAdsProps({ accentColor: "" }).accent).toBe("#8ed8f8");
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
    const rows = terminalContent(run, xAdsContent);
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
    (entry: { name: string }) => entry.name === "x-ads-mcp",
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
