import { describe, expect, it } from "bun:test";

import { inkArrowControls, inkArrowHead, inkArrowViewport } from "../index";

const FROM = { x: 0, y: 0 };
const TO = { x: 100, y: 0 };

const cross = (
  a: { x: number; y: number },
  b: { x: number; y: number },
): number => a.x * b.y - a.y * b.x;

const sideOf = (point: { x: number; y: number }) =>
  Math.sign(cross({ x: TO.x - FROM.x, y: TO.y - FROM.y }, point));

describe("inkArrowControls", () => {
  it("is deterministic for identical inputs", () => {
    expect(inkArrowControls(FROM, TO, 0.35, "arrow")).toEqual(
      inkArrowControls(FROM, TO, 0.35, "arrow"),
    );
  });

  it("differs across seeds", () => {
    expect(inkArrowControls(FROM, TO, 0.35, "arrow")).not.toEqual(
      inkArrowControls(FROM, TO, 0.35, "other"),
    );
  });

  it("places the controls at 30% and 70% along the segment", () => {
    const { c1, c2 } = inkArrowControls(FROM, TO, 0, "arrow");
    expect(c1.x).toBeGreaterThan(20);
    expect(c1.x).toBeLessThan(40);
    expect(c2.x).toBeGreaterThan(60);
    expect(c2.x).toBeLessThan(80);
  });

  it("bows to opposite sides for opposite curvature signs", () => {
    const positive = inkArrowControls(FROM, TO, 0.5, "arrow");
    const negative = inkArrowControls(FROM, TO, -0.5, "arrow");
    expect(sideOf(positive.c1)).toBe(1);
    expect(sideOf(negative.c1)).toBe(-1);
    expect(sideOf(positive.c2)).toBe(-sideOf(negative.c2));
  });

  it("keeps the controls on the segment when curvature is 0", () => {
    const { c1, c2 } = inkArrowControls(FROM, TO, 0, "arrow");
    const maxWobble = 100 * 0.06;
    expect(Math.abs(c1.y)).toBeLessThanOrEqual(maxWobble);
    expect(Math.abs(c2.y)).toBeLessThanOrEqual(maxWobble);
  });

  it("scales the bow linearly with distance", () => {
    const near = inkArrowControls(FROM, { x: 100, y: 0 }, 0.5, "arrow");
    const far = inkArrowControls(FROM, { x: 400, y: 0 }, 0.5, "arrow");
    expect(far.c1.y).toBeCloseTo(4 * near.c1.y, 6);
    expect(far.c2.y).toBeCloseTo(4 * near.c2.y, 6);
  });

  it("survives a zero-length segment", () => {
    const { c1 } = inkArrowControls(FROM, FROM, 0.35, "arrow");
    expect(Number.isFinite(c1.x)).toBe(true);
    expect(Number.isFinite(c1.y)).toBe(true);
  });
});

describe("inkArrowViewport", () => {
  it("stays positive for negative coordinates", () => {
    const { width, height } = inkArrowViewport(
      { x: -500, y: -500 },
      { x: -400, y: -400 },
      0.35,
      24,
      3,
    );
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });

  it("stays positive when `to` sits before `from`", () => {
    const { width, height } = inkArrowViewport(
      { x: 300, y: 200 },
      { x: 0, y: 0 },
      0.35,
      24,
      3,
    );
    expect(width).toBeGreaterThan(300);
    expect(height).toBeGreaterThan(200);
  });

  it("leaves room for the bow, the head and the pen width", () => {
    const { width } = inkArrowViewport(FROM, TO, 0.5, 24, 3);
    expect(width).toBeCloseTo(100 + 24 + 50 + 3, 6);
  });
});

describe("inkArrowHead", () => {
  const c2 = { x: 60, y: 0 };

  it("anchors both arms headSize away from the tip", () => {
    const { left, right } = inkArrowHead(c2, TO, 24);
    expect(Math.hypot(left.x - TO.x, left.y - TO.y)).toBeCloseTo(24, 6);
    expect(Math.hypot(right.x - TO.x, right.y - TO.y)).toBeCloseTo(24, 6);
  });

  it("puts both arms behind the tip along the end tangent", () => {
    const { left, right } = inkArrowHead(c2, TO, 24);
    const tangent = { x: TO.x - c2.x, y: TO.y - c2.y };
    for (const arm of [left, right]) {
      const back = { x: arm.x - TO.x, y: arm.y - TO.y };
      expect(back.x * tangent.x + back.y * tangent.y).toBeLessThan(0);
    }
  });

  it("opens the arms to opposite sides of the tangent", () => {
    const { left, right } = inkArrowHead(c2, TO, 24);
    expect(Math.sign(left.y - TO.y)).toBe(-Math.sign(right.y - TO.y));
  });

  it("scales with headSize", () => {
    const small = inkArrowHead(c2, TO, 12);
    const large = inkArrowHead(c2, TO, 24);
    expect(Math.hypot(large.left.x - TO.x, large.left.y - TO.y)).toBeCloseTo(
      2 * Math.hypot(small.left.x - TO.x, small.left.y - TO.y),
      6,
    );
  });

  it("follows the tangent direction, not the axis", () => {
    const vertical = inkArrowHead({ x: 100, y: -60 }, TO, 24);
    for (const arm of [vertical.left, vertical.right]) {
      expect(arm.y).toBeLessThan(TO.y);
    }
  });
});
