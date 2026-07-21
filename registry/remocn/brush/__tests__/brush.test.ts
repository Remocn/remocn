import { describe, expect, it } from "bun:test";

import {
  brushFilterId,
  brushGrainScale,
  brushHalfWidth,
  brushReach,
  brushRibbon,
  sampleCubic,
  sampleLine,
} from "../index";

const STROKE = 14;

const numbersIn = (d: string) =>
  d.match(/-?\d+(\.\d+)?(e-?\d+)?/g)?.map(Number) ?? [];

const straightSpine = sampleLine({ x: 0, y: 50 }, { x: 200, y: 50 }, 20);

describe("brushHalfWidth", () => {
  it("opens at pressure and closes at release", () => {
    expect(
      brushHalfWidth({ strokeWidth: STROKE, pressure: 0.2 }, 0),
    ).toBeCloseTo(1.4);
    expect(
      brushHalfWidth({ strokeWidth: STROKE, pressure: 0.2 }, 1),
    ).toBeCloseTo(7);
  });

  it("tapers the other way when release is below pressure", () => {
    const taper = { strokeWidth: STROKE, pressure: 1, release: 0.15 };
    expect(brushHalfWidth(taper, 0)).toBeCloseTo(7);
    expect(brushHalfWidth(taper, 1)).toBeCloseTo(1.05);
    expect(brushHalfWidth(taper, 0)).toBeGreaterThan(brushHalfWidth(taper, 1));
  });

  it("is monotonic in both directions", () => {
    const thickening = { strokeWidth: STROKE, pressure: 0.2, release: 1 };
    const thinning = { strokeWidth: STROKE, pressure: 1, release: 0.2 };
    for (let i = 1; i <= 20; i++) {
      expect(brushHalfWidth(thickening, i / 20)).toBeGreaterThan(
        brushHalfWidth(thickening, (i - 1) / 20),
      );
      expect(brushHalfWidth(thinning, i / 20)).toBeLessThan(
        brushHalfWidth(thinning, (i - 1) / 20),
      );
    }
  });

  it("is uniform when pressure equals release", () => {
    for (const t of [0, 0.4, 1]) {
      expect(
        brushHalfWidth({ strokeWidth: STROKE, pressure: 1, release: 1 }, t),
      ).toBeCloseTo(STROKE / 2);
    }
  });

  it("never exceeds half the stroke width inside the control range", () => {
    for (let p = 0.05; p <= 1.0001; p += 0.05) {
      for (let r = 0.05; r <= 1.0001; r += 0.05) {
        for (const t of [0, 0.5, 1]) {
          const half = brushHalfWidth(
            { strokeWidth: STROKE, pressure: p, release: r },
            t,
          );
          expect(half).toBeGreaterThan(0);
          expect(half).toBeLessThanOrEqual(STROKE / 2 + 1e-9);
        }
      }
    }
  });
});

describe("brushReach", () => {
  it("covers half the ribbon plus half the grain displacement", () => {
    expect(brushReach(STROKE, 1)).toBeCloseTo(
      STROKE / 2 + brushGrainScale(STROKE, 1) / 2,
    );
  });

  it("collapses to half the ribbon when grain is off", () => {
    expect(brushReach(STROKE, 0)).toBeCloseTo(STROKE / 2);
  });

  it("grows with grain", () => {
    expect(brushReach(STROKE, 2)).toBeGreaterThan(brushReach(STROKE, 1));
  });

  it("leaves the thin end narrower than the displacement, so it breaks up", () => {
    const opening = brushHalfWidth({ strokeWidth: STROKE, pressure: 0.2 }, 0);
    expect(opening * 2).toBeLessThan(brushGrainScale(STROKE, 1));
  });
});

describe("brushFilterId", () => {
  it("is stable for the same brush", () => {
    expect(brushFilterId("ink", 8, 1)).toBe(brushFilterId("ink", 8, 1));
  });

  it("separates brushes that share a seed but differ in weight or grain", () => {
    expect(brushFilterId("ink", 8, 1)).not.toBe(brushFilterId("ink", 14, 1));
    expect(brushFilterId("ink", 8, 1)).not.toBe(brushFilterId("ink", 8, 2));
  });

  it("is a valid css identifier", () => {
    expect(brushFilterId("ink", 8, 1)).toMatch(/^[a-zA-Z][\w-]*$/);
  });
});

describe("sampleCubic", () => {
  it("hits both endpoints exactly", () => {
    const from = { x: 0, y: 0 };
    const to = { x: 100, y: 40 };
    const curve = sampleCubic(
      from,
      { x: 30, y: 60 },
      { x: 70, y: -20 },
      to,
      24,
    );
    expect(curve).toHaveLength(24);
    expect(curve[0]).toEqual(from);
    expect(curve.at(-1)?.x).toBeCloseTo(to.x, 9);
    expect(curve.at(-1)?.y).toBeCloseTo(to.y, 9);
  });

  it("reduces to the straight segment when controls sit on it", () => {
    const curve = sampleCubic(
      { x: 0, y: 0 },
      { x: 25, y: 0 },
      { x: 75, y: 0 },
      { x: 100, y: 0 },
      9,
    );
    for (const point of curve) {
      expect(point.y).toBeCloseTo(0, 9);
    }
    expect(curve[4].x).toBeCloseTo(50, 9);
  });

  it("never returns fewer than two points", () => {
    expect(
      sampleCubic(
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 3 },
        0,
      ),
    ).toHaveLength(2);
  });
});

describe("sampleLine", () => {
  it("walks evenly from end to end", () => {
    const line = sampleLine({ x: 0, y: 0 }, { x: 10, y: 0 }, 11);
    expect(line[0]).toEqual({ x: 0, y: 0 });
    expect(line.at(-1)).toEqual({ x: 10, y: 0 });
    expect(line[5].x).toBeCloseTo(5, 9);
  });
});

describe("brushRibbon", () => {
  it("is a single closed subpath, not a stroked polyline", () => {
    const d = brushRibbon(straightSpine, { strokeWidth: STROKE });
    expect(d.match(/M/g)).toHaveLength(1);
    expect(d.match(/Z/g)).toHaveLength(1);
    expect(d.trimEnd().endsWith("Z")).toBe(true);
  });

  it("offsets the two sides by the taper, thin end first", () => {
    const d = brushRibbon(straightSpine, {
      strokeWidth: STROKE,
      pressure: 0.2,
      release: 1,
    });
    const ys = numbersIn(d).filter((_, i) => i % 2 === 1);
    const spread = Math.max(...ys) - Math.min(...ys);
    expect(spread).toBeCloseTo(STROKE, 0);
  });

  it("widens with strokeWidth", () => {
    const spread = (strokeWidth: number) => {
      const ys = numbersIn(
        brushRibbon(straightSpine, { strokeWidth, pressure: 1, release: 1 }),
      ).filter((_, i) => i % 2 === 1);
      return Math.max(...ys) - Math.min(...ys);
    };
    expect(spread(20)).toBeGreaterThan(spread(6));
    expect(spread(20)).toBeCloseTo(20, 6);
  });

  it("grows as progress advances", () => {
    let previous = 0;
    for (const progress of [0.1, 0.4, 0.8, 1]) {
      const length = numbersIn(
        brushRibbon(straightSpine, { strokeWidth: STROKE, progress }),
      ).length;
      expect(length).toBeGreaterThan(previous);
      previous = length;
    }
  });

  it("anchors the taper to the whole spine, not the drawn part", () => {
    const half = brushRibbon(straightSpine, {
      strokeWidth: STROKE,
      progress: 0.5,
    });
    const full = brushRibbon(straightSpine, { strokeWidth: STROKE });
    expect(full.startsWith(half.slice(0, 30))).toBe(true);
  });

  it("stays finite and well formed at zero progress", () => {
    const d = brushRibbon(straightSpine, { strokeWidth: STROKE, progress: 0 });
    expect(d.match(/M/g)).toHaveLength(1);
    expect(numbersIn(d).every(Number.isFinite)).toBe(true);
  });

  it("survives a spine with repeated points", () => {
    const stalled = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ];
    expect(
      numbersIn(brushRibbon(stalled, { strokeWidth: STROKE })).every(
        Number.isFinite,
      ),
    ).toBe(true);
  });
});
