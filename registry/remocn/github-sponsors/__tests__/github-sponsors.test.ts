import { describe, expect, it } from "bun:test";

import {
  SAMPLE_SPONSORS,
  gridColumns,
  gridLayout,
  heartDrawProgress,
  heartPulseScale,
} from "../index";

describe("gridColumns", () => {
  it("is 0 for an empty set", () => {
    expect(gridColumns(0)).toBe(0);
  });

  it("never exceeds the count", () => {
    for (let n = 1; n <= 30; n++) {
      expect(gridColumns(n)).toBeLessThanOrEqual(n);
      expect(gridColumns(n)).toBeGreaterThanOrEqual(1);
    }
  });

  it("keeps the grid within a few rows for typical counts", () => {
    for (const n of [6, 12, 14, 20, 24]) {
      const cols = gridColumns(n);
      const rows = Math.ceil(n / cols);
      expect(rows).toBeLessThanOrEqual(4);
    }
  });
});

describe("gridLayout", () => {
  it("returns one point per cell", () => {
    expect(gridLayout(12, 6, 120, 120)).toHaveLength(12);
    expect(gridLayout(7, 4, 120, 120)).toHaveLength(7);
  });

  it("returns an empty array for non-positive counts or cols", () => {
    expect(gridLayout(0, 6, 120, 120)).toEqual([]);
    expect(gridLayout(6, 0, 120, 120)).toEqual([]);
  });

  it("centers a single full row horizontally on cx", () => {
    const cx = 640;
    const pts = gridLayout(6, 6, 120, 120, cx, 304);
    const avg = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    expect(avg).toBeCloseTo(cx, 6);
  });

  it("stacks rows symmetrically around cy", () => {
    const cy = 304;
    const pts = gridLayout(12, 6, 120, 120, 640, cy);
    const avg = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    expect(avg).toBeCloseTo(cy, 6);
  });

  it("keeps a short last row centered (centered grid, not left-packed)", () => {
    const cx = 640;
    const pts = gridLayout(8, 6, 120, 120, cx, 304);
    const lastRow = pts.slice(6);
    const avg = lastRow.reduce((s, p) => s + p.x, 0) / lastRow.length;
    expect(avg).toBeCloseTo(cx, 6);
  });
});

describe("heartDrawProgress", () => {
  it("is 0 at frame 0", () => {
    expect(heartDrawProgress(0)).toBe(0);
  });

  it("reaches 1 by the end of the draw window and clamps after", () => {
    expect(heartDrawProgress(40)).toBeCloseTo(1, 6);
    expect(heartDrawProgress(120)).toBe(1);
  });

  it("is monotonically non-decreasing", () => {
    let prev = -Infinity;
    for (let f = 0; f <= 45; f++) {
      const v = heartDrawProgress(f);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe("heartPulseScale", () => {
  it("settles back to 1 after the pulse window", () => {
    expect(heartPulseScale(62)).toBeCloseTo(1, 6);
    expect(heartPulseScale(200)).toBe(1);
  });

  it("dips below 1 during the compress beat", () => {
    expect(heartPulseScale(46)).toBeLessThan(1);
  });
});

describe("SAMPLE_SPONSORS", () => {
  it("ships a usable set of avatars", () => {
    expect(SAMPLE_SPONSORS.length).toBeGreaterThanOrEqual(8);
  });

  it("each entry has a login and an https github avatar url", () => {
    for (const s of SAMPLE_SPONSORS) {
      expect(typeof s.login).toBe("string");
      expect(s.login.length).toBeGreaterThan(0);
      expect(s.avatarUrl).toMatch(
        /^https:\/\/avatars\.githubusercontent\.com\//,
      );
    }
  });
});
