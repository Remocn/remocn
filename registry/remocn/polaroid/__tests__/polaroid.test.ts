import { describe, expect, it } from "bun:test";

import { polaroidGeometry } from "../index";

const ASPECT = 620 / 349;

describe("polaroidGeometry", () => {
  it("reproduces the demo card at the default width", () => {
    const g = polaroidGeometry(652);
    expect(g.pad).toBe(16);
    expect(g.mediaWidth).toBe(620);
    expect(g.mediaHeight).toBe(349);
    expect(g.captionHeight).toBe(62);
    expect(g.height).toBe(427);
  });

  it("leaves the media window inset by pad on both sides", () => {
    for (const width of [320, 500, 652, 900]) {
      const g = polaroidGeometry(width);
      expect(g.mediaWidth + 2 * g.pad).toBeCloseTo(width, 6);
    }
  });

  it("keeps the media aspect at every width", () => {
    for (const width of [320, 500, 652, 900]) {
      const g = polaroidGeometry(width);
      expect(g.mediaWidth / g.mediaHeight).toBeCloseTo(ASPECT, 6);
    }
  });

  it("scales every metric linearly with width", () => {
    const base = polaroidGeometry(652);
    const half = polaroidGeometry(326);
    expect(half.pad).toBeCloseTo(base.pad / 2, 6);
    expect(half.mediaWidth).toBeCloseTo(base.mediaWidth / 2, 6);
    expect(half.mediaHeight).toBeCloseTo(base.mediaHeight / 2, 6);
    expect(half.captionHeight).toBeCloseTo(base.captionHeight / 2, 6);
    expect(half.height).toBeCloseTo(base.height / 2, 6);
  });

  it("stacks pad, media and caption into the card height", () => {
    for (const width of [320, 652, 900]) {
      const g = polaroidGeometry(width);
      expect(g.height).toBeCloseTo(g.pad + g.mediaHeight + g.captionHeight, 6);
    }
  });

  it("holds the card's own aspect at every width", () => {
    for (const width of [320, 500, 900]) {
      const g = polaroidGeometry(width);
      expect(g.height / width).toBeCloseTo(427 / 652, 6);
    }
  });
});
