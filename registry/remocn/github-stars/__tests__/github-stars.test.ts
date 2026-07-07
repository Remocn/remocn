/**
 * Unit tests for pure helpers in registry/remocn/github-stars/index.tsx.
 *
 * Run with:
 *   bun add -d vitest
 *   bunx vitest run registry/remocn/github-stars/__tests__/github-stars.test.ts
 *
 * No React DOM or Remotion player needed — only pure JS logic is exercised.
 * All tests are fully deterministic (no network, no Date.now).
 */

import { describe, expect, it } from "bun:test";

import {
  computeCounterProgress,
  computeScrollProgress,
  computeSpacerRows,
  downsampleStargazers,
  getStarCount,
  isScrollContained,
  SAMPLE_STARGAZERS,
  type Stargazer,
} from "../index";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a synthetic stargazer array of length `n`. */
function makeStargazers(n: number): Stargazer[] {
  return Array.from({ length: n }, (_, i) => ({
    login: `user${i}`,
    avatarUrl: `https://avatars.githubusercontent.com/u/${i + 1}?v=4`,
    starredAt: `2021-01-${String((i % 28) + 1).padStart(2, "0")}`,
  }));
}

// ---------------------------------------------------------------------------
// downsampleStargazers
// ---------------------------------------------------------------------------

describe("downsampleStargazers", () => {
  it("reduces a large array to at most 60 entries", () => {
    const input = makeStargazers(5000);
    const result = downsampleStargazers(input);
    expect(result.length).toBeLessThanOrEqual(60);
  });

  it("preserves the first entry from a large array", () => {
    const input = makeStargazers(5000);
    const result = downsampleStargazers(input);
    expect(result[0]).toBe(input[0]);
  });

  it("preserves the last entry from a large array", () => {
    const input = makeStargazers(5000);
    const result = downsampleStargazers(input);
    expect(result[result.length - 1]).toBe(input[input.length - 1]);
  });

  it("keeps entries in original order (no resorting)", () => {
    const input = makeStargazers(5000);
    const result = downsampleStargazers(input);
    let prevIdx = -1;
    for (const entry of result) {
      const idx = input.indexOf(entry);
      expect(idx).toBeGreaterThan(prevIdx);
      prevIdx = idx;
    }
  });

  it("returns the array unchanged when length < max (default 60)", () => {
    const input = makeStargazers(12);
    const result = downsampleStargazers(input);
    expect(result).toBe(input); // same reference — no copy needed
  });

  it("returns the array unchanged when length === max", () => {
    const input = makeStargazers(60);
    const result = downsampleStargazers(input);
    expect(result).toBe(input);
  });

  it("returns an empty array for empty input", () => {
    expect(downsampleStargazers([])).toEqual([]);
  });

  it("returns a single-element array unchanged", () => {
    const input = makeStargazers(1);
    const result = downsampleStargazers(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(input[0]);
  });

  it("respects a custom max parameter", () => {
    const input = makeStargazers(200);
    const result = downsampleStargazers(input, 10);
    expect(result.length).toBeLessThanOrEqual(10);
    expect(result[0]).toBe(input[0]);
    expect(result[result.length - 1]).toBe(input[input.length - 1]);
  });

  it("returns exactly 1 entry when max=1 with a large input", () => {
    // Under a strict cap of 1 only the FIRST entry can be kept (there is no
    // room to also preserve the last). first+last preservation applies at max>=2.
    const input = makeStargazers(100);
    const result = downsampleStargazers(input, 1);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(input[0]);
  });
});

// ---------------------------------------------------------------------------
// computeScrollProgress
// ---------------------------------------------------------------------------

const BASE = { speed: 1, durationInFrames: 300 } as const;

// Mirror of the (unexported) SCROLL_OVERSHOOT bound in index.tsx so the elastic
// peak can be asserted without leaking the constant into the public API.
const SCROLL_OVERSHOOT = 1.0658;

describe("computeCounterProgress", () => {
  it("is 0 at frame 0", () => {
    expect(computeCounterProgress({ frame: 0, ...BASE })).toBe(0);
  });

  it("returns exactly 1 at frame === durationInFrames", () => {
    expect(
      computeCounterProgress({ frame: BASE.durationInFrames, ...BASE }),
    ).toBe(1);
  });

  it("returns exactly 1 for frames beyond durationInFrames", () => {
    expect(
      computeCounterProgress({ frame: BASE.durationInFrames + 100, ...BASE }),
    ).toBe(1);
  });

  it("is monotonically non-decreasing across the full duration", () => {
    let prev = -Infinity;
    for (let f = 0; f <= BASE.durationInFrames; f++) {
      const val = computeCounterProgress({ frame: f, ...BASE });
      expect(val).toBeGreaterThanOrEqual(prev);
      prev = val;
    }
  });

  it("stays within [0, 1] for every frame in the duration", () => {
    for (let f = 0; f <= BASE.durationInFrames + 10; f++) {
      const val = computeCounterProgress({ frame: f, ...BASE });
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it("speed=0.5 at frame 150 yields the same progress as speed=1 at frame 75", () => {
    const slow = computeCounterProgress({
      frame: 150,
      speed: 0.5,
      durationInFrames: 300,
    });
    const normal = computeCounterProgress({ frame: 75, ...BASE });
    expect(slow).toBeCloseTo(normal, 6);
  });
});

describe("computeScrollProgress", () => {
  it("is 0 at frame 0", () => {
    expect(computeScrollProgress({ frame: 0, ...BASE })).toBe(0);
  });

  it("returns exactly 1 at frame === durationInFrames", () => {
    expect(
      computeScrollProgress({ frame: BASE.durationInFrames, ...BASE }),
    ).toBe(1);
  });

  it("returns exactly 1 for frames beyond durationInFrames (clamped)", () => {
    expect(
      computeScrollProgress({ frame: BASE.durationInFrames + 100, ...BASE }),
    ).toBe(1);
  });

  it("stays within [0, SCROLL_OVERSHOOT] for every frame in the duration", () => {
    for (let f = 0; f <= BASE.durationInFrames + 10; f++) {
      const val = computeScrollProgress({ frame: f, ...BASE });
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(SCROLL_OVERSHOOT);
    }
  });

  it("returns to exactly 1 by the final frame", () => {
    expect(
      computeScrollProgress({ frame: BASE.durationInFrames, ...BASE }),
    ).toBe(1);
  });

  it("speed=0.5 at frame 150 yields the same progress as speed=1 at frame 75", () => {
    const slow = computeScrollProgress({
      frame: 150,
      speed: 0.5,
      durationInFrames: 300,
    });
    const normal = computeScrollProgress({ frame: 75, ...BASE });
    expect(slow).toBeCloseTo(normal, 6);
  });
});

describe("maxScrollOvershoot / elastic peak", () => {
  it("peaks at ≈1.0183 near t≈0.72 (frame≈217 at dur=300)", () => {
    const dur = 300;
    let max = -Infinity;
    let maxFrame = -1;
    for (let f = 0; f <= dur; f++) {
      const val = computeScrollProgress({
        frame: f,
        speed: 1,
        durationInFrames: dur,
      });
      if (val > max) {
        max = val;
        maxFrame = f;
      }
    }
    expect(max).toBeCloseTo(1.0183, 3);
    expect(maxFrame).toBeGreaterThanOrEqual(213);
    expect(maxFrame).toBeLessThanOrEqual(221);
  });
});

describe("isScrollContained", () => {
  const GEO = { rowH: 88, viewportH: 600, visibleRows: 6 } as const;

  it("is contained for N=12 and reserves 2 spacer rows", () => {
    expect(isScrollContained({ N: 12, ...GEO })).toBe(true);
    expect(computeSpacerRows({ N: 12, ...GEO })).toBe(2);
  });

  it("is contained for N=30 and reserves 3 spacer rows", () => {
    expect(isScrollContained({ N: 30, ...GEO })).toBe(true);
    expect(computeSpacerRows({ N: 30, ...GEO })).toBe(3);
  });

  it("is contained for N=60 and reserves 5 spacer rows", () => {
    expect(isScrollContained({ N: 60, ...GEO })).toBe(true);
    expect(computeSpacerRows({ N: 60, ...GEO })).toBe(5);
  });

  it("is contained for a tiny list (N=3) where D clamps to 0", () => {
    expect(isScrollContained({ N: 3, ...GEO })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getStarCount
// ---------------------------------------------------------------------------

describe("getStarCount", () => {
  it("returns 0 when progress is 0", () => {
    expect(getStarCount(0, 24813)).toBe(0);
  });

  it("returns totalStars when progress is 1", () => {
    expect(getStarCount(1, 24813)).toBe(24813);
  });

  it("rounds to the nearest integer", () => {
    // 0.5 * 3 = 1.5 → rounds to 2
    expect(getStarCount(0.5, 3)).toBe(2);
    // 0.4 * 5 = 2.0 → 2
    expect(getStarCount(0.4, 5)).toBe(2);
    // 0.1 * 3 = 0.3 → rounds to 0
    expect(getStarCount(0.1, 3)).toBe(0);
  });

  it("returns 0 when totalStars is 0", () => {
    expect(getStarCount(0.5, 0)).toBe(0);
    expect(getStarCount(1, 0)).toBe(0);
  });

  it("is monotonically non-decreasing as progress increases for a fixed totalStars", () => {
    const steps = 1000;
    const total = 24813;
    let prev = -1;
    for (let i = 0; i <= steps; i++) {
      const count = getStarCount(i / steps, total);
      expect(count).toBeGreaterThanOrEqual(prev);
      prev = count;
    }
  });

  it("never exceeds totalStars", () => {
    const total = 100;
    for (let i = 0; i <= 100; i++) {
      expect(getStarCount(i / 100, total)).toBeLessThanOrEqual(total);
    }
  });
});

// ---------------------------------------------------------------------------
// SAMPLE_STARGAZERS
// ---------------------------------------------------------------------------

describe("SAMPLE_STARGAZERS", () => {
  it("is non-empty", () => {
    expect(SAMPLE_STARGAZERS.length).toBeGreaterThan(0);
  });

  it("each entry has login, avatarUrl, and starredAt fields", () => {
    for (const sg of SAMPLE_STARGAZERS) {
      expect(typeof sg.login).toBe("string");
      expect(sg.login.length).toBeGreaterThan(0);
      expect(typeof sg.avatarUrl).toBe("string");
      expect(sg.avatarUrl.length).toBeGreaterThan(0);
      expect(typeof sg.starredAt).toBe("string");
      expect(sg.starredAt.length).toBeGreaterThan(0);
    }
  });

  it("each starredAt is a valid ISO date string parseable by Date", () => {
    for (const sg of SAMPLE_STARGAZERS) {
      const d = new Date(sg.starredAt);
      expect(Number.isNaN(d.getTime())).toBe(false);
    }
  });

  it("avatarUrls are HTTPS GitHub avatar URLs", () => {
    for (const sg of SAMPLE_STARGAZERS) {
      expect(sg.avatarUrl).toMatch(
        /^https:\/\/avatars\.githubusercontent\.com\//,
      );
    }
  });

  it("logins are unique within the sample set", () => {
    const logins = SAMPLE_STARGAZERS.map((sg) => sg.login);
    const unique = new Set(logins);
    expect(unique.size).toBe(logins.length);
  });
});
