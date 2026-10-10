import { expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  contraction,
  FOMO_FRAMES,
  fomoTimeline,
  phoneBorderPoint,
} from "../motion";

test("the six shots cover all 1108 frames exactly once", () => {
  const frames = new Uint8Array(FOMO_FRAMES);
  for (const scene of fomoTimeline) {
    for (let frame = scene.from; frame < scene.to; frame++) frames[frame]++;
  }
  expect(frames.every((count) => count === 1)).toBe(true);
  expect(fomoTimeline.find((scene) => scene.id === "confirmation")?.from).toBe(
    756,
  );
});

test("the measured slider contraction does not reverse or overshoot", () => {
  let previous = 0;
  for (let i = 0; i <= 120; i++) {
    const value = contraction(i / 120);
    expect(value).toBeGreaterThanOrEqual(previous - 1e-8);
    expect(value).toBeLessThanOrEqual(1);
    previous = value;
  }
});

test("the install includes the full local import graph without private media or repository aliases", () => {
  const base = path.resolve(import.meta.dir, "../..");
  const registry = JSON.parse(
    readFileSync(path.join(base, "registry.json"), "utf8"),
  );
  const item = registry.items.find(
    (entry: { name: string }) => entry.name === "fomo-limit-orders",
  );
  const shipped = new Set<string>(
    item.files.map((file: { path: string }) => path.resolve(base, file.path)),
  );
  for (const file of shipped) {
    expect(existsSync(file)).toBe(true);
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(
      /(?:from\s+|import\s*)["'](\.[^"']+)["']/g,
    )) {
      const imported = path.resolve(path.dirname(file), match[1]);
      expect(
        [imported, `${imported}.ts`, `${imported}.tsx`].some((p) =>
          shipped.has(p),
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
    ]) {
      expect(source).not.toContain(forbidden);
    }
  }
  expect(item.dependencies).toContain("@fontsource/manrope");
});

test("the ball center stays on the rounded border through both tangent joins", () => {
  for (let i = 0; i <= 1000; i++) {
    const p = phoneBorderPoint(i / 1000);
    const distance =
      p.x >= 59
        ? Math.abs(p.y - 679.15)
        : p.y <= 621
          ? Math.abs(p.x - 0.85)
          : Math.abs(Math.hypot(p.x - 59, p.y - 621) - 58.15);
    expect(distance).toBeLessThan(1e-8);
  }
});
