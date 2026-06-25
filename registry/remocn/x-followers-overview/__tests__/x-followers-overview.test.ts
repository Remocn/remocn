/**
 * Unit tests for pure helpers in registry/remocn/x-followers-overview/index.tsx.
 *
 * Run with:
 *   bun add -d vitest
 *   bunx vitest run registry/remocn/x-followers-overview/__tests__/x-followers-overview.test.ts
 *
 * No React DOM or Remotion player needed — only pure JS logic is exercised.
 * All tests are fully deterministic (no network, no Date.now).
 */

import { describe, expect, it } from "vitest";

import { blurIn, flipEase, slotProgress } from "../index";

describe("slotProgress", () => {
  it("advances index one per slot and tracks the in-slot fraction", () => {
    expect(slotProgress(0, 30, 5)).toEqual({ idx: 0, frac: 0 });
    expect(slotProgress(15, 30, 5)).toEqual({ idx: 0, frac: 0.5 });
    expect(slotProgress(30, 30, 5)).toEqual({ idx: 1, frac: 0 });
    expect(slotProgress(75, 30, 5)).toEqual({ idx: 2, frac: 0.5 });
  });

  it("clamps the index to the last item past the end", () => {
    expect(slotProgress(1000, 30, 5)).toEqual({ idx: 4, frac: 1 });
  });

  it("is safe for degenerate inputs", () => {
    expect(slotProgress(10, 0, 5)).toEqual({ idx: 0, frac: 0 });
    expect(slotProgress(10, 30, 0)).toEqual({ idx: 0, frac: 0 });
  });
});

describe("flipEase", () => {
  it("holds at 0 through the hold window, then ramps to 1", () => {
    expect(flipEase(0, 0.58)).toBe(0);
    expect(flipEase(0.58, 0.58)).toBe(0);
    expect(flipEase(1, 0.58)).toBeCloseTo(1, 6);
  });

  it("is monotonically non-decreasing", () => {
    let prev = -1;
    for (let f = 0; f <= 1.0001; f += 0.05) {
      const v = flipEase(f, 0.58);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  it("returns 0 when there is no room to ramp", () => {
    expect(flipEase(0.5, 1)).toBe(0);
  });
});

describe("blurIn", () => {
  it("is hidden+blurred before start and fully resolved after end", () => {
    const before = blurIn(0, 6, 24);
    expect(before.opacity).toBe(0);
    expect(before.blur).toBe(10);
    expect(before.translateY).toBe(12);

    const after = blurIn(100, 6, 24);
    expect(after.opacity).toBe(1);
    expect(after.blur).toBe(0);
    expect(after.translateY).toBe(0);
  });

  it("interpolates monotonically across the window", () => {
    const mid = blurIn(15, 6, 24);
    expect(mid.opacity).toBeGreaterThan(0);
    expect(mid.opacity).toBeLessThan(1);
    expect(mid.blur).toBeGreaterThan(0);
    expect(mid.blur).toBeLessThan(10);
  });
});
