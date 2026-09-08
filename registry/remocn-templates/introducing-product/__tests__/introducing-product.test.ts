import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  introducingContent,
  introducingTheme,
  resolveIntroducingProps,
} from "../content";
import {
  INTRODUCING_DURATION,
  introducingTimeline,
  motion,
  sceneFrames,
} from "../motion";
import { createIntroducingScore, SCORE_SAMPLE_RATE } from "../soundtrack";

const projectRoot = path.resolve(import.meta.dir, "../../..");

describe("introducing product install and timing", () => {
  test("every native-rate frame belongs to exactly one scene, including non-60fps exports", () => {
    for (const fps of [24, 25, 30, 60]) {
      const frames = new Uint8Array(INTRODUCING_DURATION * fps);
      for (const scene of introducingTimeline) {
        const { from, durationInFrames } = sceneFrames(scene, fps);
        expect(durationInFrames).toBeGreaterThan(0);
        for (let i = from; i < from + durationInFrames; i++) frames[i]++;
      }
      expect(frames.every((count) => count === 1)).toBe(true);
    }
  });

  test("reference-derived curves are monotonic without overshoot", () => {
    for (const curve of Object.values(motion)) {
      let last = -0.001;
      for (let i = 0; i <= 100; i++) {
        const value = curve(i / 100);
        expect(value).toBeGreaterThanOrEqual(last - 0.00001);
        expect(value).toBeGreaterThanOrEqual(-0.00001);
        expect(value).toBeLessThanOrEqual(1.00001);
        last = value;
      }
    }
  });

  test("brand overrides, blank fields, partial lists, and theme validation preserve defaults", () => {
    const result = resolveIntroducingProps({
      productName: "Forma",
      website: "forma.example",
      content: {
        productName: "Ignored",
        hook: "  ",
        showcaseWords: ["Imagine."],
      },
      theme: { ink: "invalid", accent: "#112233" },
      accentColor: "#B7D7FA",
    });
    expect(result.content.productName).toBe("Forma");
    expect(result.content.website).toBe("forma.example");
    expect(result.content.hook).toBe(introducingContent.hook);
    expect(result.content.showcaseWords).toEqual([
      "Imagine.",
      "Compose.",
      "Ship.",
    ]);
    expect(result.theme.ink).toBe(introducingTheme.ink);
    expect(result.theme.accent).toBe("#B7D7FA");
    result.content.showcaseWords[0] = "Changed";
    expect(introducingContent.showcaseWords[0]).toBe("Create.");
  });

  test("the registry ships the complete local import graph and declares primitive dependencies", () => {
    const registry = JSON.parse(
      readFileSync(
        path.join(projectRoot, "remocn-templates/registry.json"),
        "utf8",
      ),
    );
    const item = registry.items.find(
      (entry: { name: string }) => entry.name === "introducing-product",
    );
    const targets = new Set<string>(
      item.files.map((f: { path: string }) =>
        path.resolve(projectRoot, "remocn-templates", f.path),
      ),
    );
    for (const filename of targets) {
      expect(existsSync(filename)).toBe(true);
      const source = readFileSync(filename, "utf8");
      for (const match of source.matchAll(
        /(?:from\s+|import\s*)["'](\.[^"']+)["']/g,
      )) {
        const resolved = path.resolve(path.dirname(filename), match[1]);
        expect(
          [resolved, `${resolved}.tsx`, `${resolved}.ts`].some((file) =>
            targets.has(file),
          ),
        ).toBe(true);
      }
      expect(source).not.toContain("/Downloads/");
      expect(source).not.toContain("@/registry/");
      expect(source).not.toContain("Math.random()");
    }
    expect(item.registryDependencies).toEqual([
      "@remocn/word-push",
      "@remocn/radial-burst",
    ]);
    expect(item.dependencies).toContain("@fontsource/manrope");
  });
});

test("the bundled score is repeatable, 32 seconds, non-silent, unclipped, and fades to zero", () => {
  const a = createIntroducingScore();
  const b = createIntroducingScore();
  const hash = (data: Uint8Array) =>
    createHash("sha256").update(data).digest("hex");
  expect(hash(a)).toBe(hash(b));
  const view = new DataView(a.buffer);
  expect(new TextDecoder().decode(a.subarray(0, 4))).toBe("RIFF");
  expect(view.getUint32(24, true)).toBe(SCORE_SAMPLE_RATE);
  expect(view.getUint32(40, true) / 2 / SCORE_SAMPLE_RATE).toBe(32);
  let peak = 0;
  for (let i = 44; i < a.length; i += 2)
    peak = Math.max(peak, Math.abs(view.getInt16(i, true)));
  expect(peak).toBeGreaterThan(1000);
  expect(peak).toBeLessThan(32767);
  expect(Math.abs(view.getInt16(a.length - 2, true))).toBeLessThan(5);
});
