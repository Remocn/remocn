import { describe, expect, it } from "bun:test";

import { pageTurnPose } from "../index";

const sample = (poses: number, steps = 400) =>
  Array.from({ length: steps + 1 }, (_, i) => pageTurnPose(i / steps, poses));

describe("pageTurnPose", () => {
  it("hits the ends exactly", () => {
    for (const poses of [2, 4, 8, 16]) {
      expect(pageTurnPose(0, poses)).toBe(0);
      expect(pageTurnPose(1, poses)).toBe(1);
    }
  });

  it("never decreases", () => {
    for (const poses of [2, 8, 16]) {
      const values = sample(poses);
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
      }
    }
  });

  it("produces exactly `poses` distinct values", () => {
    for (const poses of [2, 4, 8, 16]) {
      expect(new Set(sample(poses)).size).toBe(poses);
    }
  });

  it("stays inside [0, 1]", () => {
    for (const value of sample(8)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it("holds a plateau then jumps", () => {
    const values = sample(8, 800);
    const jumps = values.filter((v, i) => i > 0 && v !== values[i - 1]).length;
    expect(jumps).toBe(7);
  });

  it("eases in — the first pose lasts longer than the last", () => {
    const values = sample(8, 800);
    const first = values.filter((v) => v === values[0]).length;
    const last = values.filter((v) => v === 1).length;
    expect(first).toBeGreaterThan(last);
  });

  it("clamps progress outside [0, 1]", () => {
    expect(pageTurnPose(-0.5, 8)).toBe(0);
    expect(pageTurnPose(1.5, 8)).toBe(1);
  });

  it("degrades safely for poses <= 1", () => {
    expect(pageTurnPose(0.5, 1)).toBe(0);
    expect(pageTurnPose(1, 1)).toBe(1);
    expect(Number.isNaN(pageTurnPose(0.5, 0))).toBe(false);
  });
});
