import { describe, expect, it } from "bun:test";

import { brushHalfWidth, brushReach } from "@/components/remocn/brush";
import { inkArrowConfig } from "../config";
import {
  inkArrowApex,
  inkArrowArmWidth,
  inkArrowControls,
  inkArrowHead,
  inkArrowHeadReach,
  inkArrowViewport,
} from "../index";

const numberControl = (name: string) => {
  const control = inkArrowConfig.controls[name];
  if (control.type !== "number") {
    throw new Error(`${name} is not a number control`);
  }
  return control;
};

const controlValues = (name: string) => {
  const { min, max, step } = numberControl(name);
  return Array.from(
    { length: Math.floor((max - min) / step + 1e-9) + 1 },
    (_, i) => min + i * step,
  );
};

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

  it("leaves room for the bow, the head and the brush reach", () => {
    const { width } = inkArrowViewport(FROM, TO, 0.5, 24, 8);
    expect(width).toBeCloseTo(100 + 24 + 50 + brushReach(8, 1), 6);
  });

  it("widens as grain grows, since the displacement pushes past the ribbon", () => {
    const clean = inkArrowViewport(FROM, TO, 0.5, 24, 8, 0).width;
    const rough = inkArrowViewport(FROM, TO, 0.5, 24, 8, 2).width;
    expect(rough).toBeGreaterThan(clean);
    expect(clean).toBeCloseTo(100 + 24 + 50 + 4, 6);
  });
});

describe("inkArrowHeadReach", () => {
  it("leaves headSize alone while the brush stays thin", () => {
    expect(inkArrowHeadReach(24, 8)).toBe(24);
    expect(inkArrowHeadReach(48, 8)).toBe(48);
  });

  it("grows the head once the brush would swallow it", () => {
    expect(inkArrowHeadReach(24, 24)).toBeCloseTo(62.4);
    expect(inkArrowHeadReach(24, 24)).toBeGreaterThan(inkArrowHeadReach(24, 8));
  });

  it("keeps the arms clear of the shaft across the whole control matrix", () => {
    for (const headSize of controlValues("headSize")) {
      for (const strokeWidth of controlValues("strokeWidth")) {
        const reach = inkArrowHeadReach(headSize, strokeWidth);
        expect(reach).toBeGreaterThan(strokeWidth / 2);
        expect(reach).toBeGreaterThanOrEqual(strokeWidth * 2);
      }
    }
  });

  it("never shrinks the head below what the user asked for", () => {
    for (const headSize of controlValues("headSize")) {
      for (const strokeWidth of controlValues("strokeWidth")) {
        expect(inkArrowHeadReach(headSize, strokeWidth)).toBeGreaterThanOrEqual(
          headSize,
        );
      }
    }
  });

  it("is what the viewport reserves, so a grown head is never clipped", () => {
    const wide = inkArrowViewport(FROM, TO, 0, 24, 24, 0).width;
    expect(wide).toBeCloseTo(
      100 + inkArrowHeadReach(24, 24) + brushReach(24, 0),
      6,
    );
  });
});

describe("inkArrowApex", () => {
  const c2 = { x: 60, y: 0 };

  it("sits ahead of the tip, so the two arms cross instead of meeting in a blob", () => {
    const apex = inkArrowApex(c2, TO, 24);
    expect(apex.x).toBeGreaterThan(TO.x);
    expect(apex.y).toBeCloseTo(TO.y, 9);
  });

  it("overshoots by a fraction of the head reach", () => {
    expect(Math.hypot(inkArrowApex(c2, TO, 50).x - TO.x, 0)).toBeCloseTo(8, 6);
    expect(Math.hypot(inkArrowApex(c2, TO, 25).x - TO.x, 0)).toBeCloseTo(4, 6);
  });

  it("follows the end tangent, not the axis", () => {
    const apex = inkArrowApex({ x: 100, y: 60 }, TO, 40);
    expect(apex.y).toBeLessThan(TO.y);
  });

  it("survives a degenerate tangent", () => {
    const apex = inkArrowApex(TO, TO, 24);
    expect(Number.isFinite(apex.x)).toBe(true);
    expect(Number.isFinite(apex.y)).toBe(true);
  });
});

describe("inkArrowArmWidth", () => {
  it("matches the shaft's own width where the shaft ends", () => {
    for (const strokeWidth of controlValues("strokeWidth")) {
      for (const release of [0.2, 0.5, 1]) {
        const shaftEnd =
          2 * brushHalfWidth({ strokeWidth, pressure: 0.2, release }, 1);
        expect(inkArrowArmWidth(strokeWidth, release)).toBeCloseTo(shaftEnd, 9);
      }
    }
  });

  it("follows release, so a shaft that lifts off thin gets a thin head", () => {
    expect(inkArrowArmWidth(24, 1)).toBe(24);
    expect(inkArrowArmWidth(24, 0.5)).toBe(12);
    expect(inkArrowArmWidth(24, 0.5)).toBeLessThan(inkArrowArmWidth(24, 1));
  });

  it("is independent of pressure, which only shapes the opening", () => {
    const end = (pressure: number) =>
      2 * brushHalfWidth({ strokeWidth: 16, pressure, release: 1 }, 1);
    expect(end(0.05)).toBeCloseTo(inkArrowArmWidth(16, 1), 9);
    expect(end(1)).toBeCloseTo(inkArrowArmWidth(16, 1), 9);
  });
});

describe("the head reads as a V at every brush width", () => {
  it("spreads the arms wider than the shaft is thick", () => {
    for (const headSize of controlValues("headSize")) {
      for (const strokeWidth of controlValues("strokeWidth")) {
        const reach = inkArrowHeadReach(headSize, strokeWidth);
        const { left, right } = inkArrowHead({ x: 60, y: 0 }, TO, reach);
        const span = Math.hypot(left.x - right.x, left.y - right.y);
        expect(span).toBeGreaterThan(strokeWidth);
      }
    }
  });

  it("keeps the arm tips behind the apex so the V never inverts", () => {
    const reach = inkArrowHeadReach(24, 24);
    const apex = inkArrowApex({ x: 60, y: 0 }, TO, reach);
    const { left, right } = inkArrowHead({ x: 60, y: 0 }, TO, reach);
    for (const arm of [left, right]) {
      expect(arm.x).toBeLessThan(apex.x);
    }
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
