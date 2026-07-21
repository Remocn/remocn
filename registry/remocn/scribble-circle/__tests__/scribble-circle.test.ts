import { describe, expect, it } from "bun:test";

import { brushReach } from "@/components/remocn/brush";
import { scribbleCircleConfig } from "../config";
import {
  scribbleCircleCentre,
  scribbleCirclePath,
  scribbleCirclePoints,
  scribbleCircleProgress,
} from "../index";

const W = 420;
const H = 240;
const STROKE = 14;

const numberControl = (name: string) => {
  const control = scribbleCircleConfig.controls[name];
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

const radiusFrom = (
  point: { x: number; y: number },
  centre: { x: number; y: number },
) => Math.hypot((point.x - centre.x) / (W / 2), (point.y - centre.y) / (H / 2));

const numbersIn = (d: string) =>
  d.match(/-?\d+(\.\d+)?(e-?\d+)?/g)?.map(Number) ?? [];

describe("scribbleCircleProgress", () => {
  const poses = (opts: { durationSteps: number; step: number }) =>
    Array.from({ length: opts.durationSteps + 1 }, (_, i) =>
      scribbleCircleProgress(i * opts.step, opts),
    );

  it("stays hidden until the first pose lands", () => {
    for (const frame of [0, 1, 2]) {
      expect(scribbleCircleProgress(frame)).toBe(0);
    }
    expect(scribbleCircleProgress(3)).toBeGreaterThan(0);
  });

  it("opens on a small arc rather than jumping most of the way round", () => {
    const first = scribbleCircleProgress(3);
    expect(first).toBeCloseTo(0.1);
    expect(first).toBeLessThan(0.2);
  });

  it("advances an equal arc every pose, so the pen reads as travelling", () => {
    const drawn = poses({ durationSteps: 10, step: 3 });
    const deltas = drawn.slice(1).map((value, i) => value - drawn[i]);
    for (const delta of deltas) {
      expect(delta).toBeCloseTo(0.1, 9);
    }
    expect(drawn.at(-1)).toBe(1);
  });

  it("holds each pose for the whole step, never moving between them", () => {
    for (const offset of [0, 1, 2]) {
      expect(scribbleCircleProgress(6 + offset)).toBe(
        scribbleCircleProgress(6),
      );
    }
  });

  it("keeps every pose distinct across the durationSteps control range", () => {
    for (const durationSteps of controlValues("durationSteps")) {
      const drawn = poses({ durationSteps, step: 3 });
      expect(new Set(drawn).size).toBe(durationSteps + 1);
    }
  });
});

describe("scribbleCirclePath", () => {
  it("is deterministic for a seed", () => {
    const a = scribbleCirclePath({ width: W, height: H, strokeWidth: STROKE });
    const b = scribbleCirclePath({ width: W, height: H, strokeWidth: STROKE });
    expect(a.d).toBe(b.d);
    expect(a.viewBox).toBe(b.viewBox);
  });

  it("gives a different loop for a different seed", () => {
    const a = scribbleCirclePath({
      width: W,
      height: H,
      strokeWidth: STROKE,
      seed: "one",
    });
    const b = scribbleCirclePath({
      width: W,
      height: H,
      strokeWidth: STROKE,
      seed: "two",
    });
    expect(a.d).not.toBe(b.d);
  });

  it("is a closed ribbon with one subpath, not a stroked polyline", () => {
    const { d } = scribbleCirclePath({
      width: W,
      height: H,
      strokeWidth: STROKE,
    });
    expect(d.match(/M/g)).toHaveLength(1);
    expect(d.match(/Z/g)).toHaveLength(1);
    expect(d.trimEnd().endsWith("Z")).toBe(true);
  });

  it("widens the ribbon when strokeWidth grows", () => {
    const spread = (strokeWidth: number) => {
      const xs = numbersIn(
        scribbleCirclePath({ width: W, height: H, strokeWidth }).d,
      ).filter((_, i) => i % 2 === 0);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(spread(28)).toBeGreaterThan(spread(8));
  });

  it("grows the spine with laps", () => {
    const one = scribbleCirclePoints({ width: W, height: H, laps: 1 });
    const two = scribbleCirclePoints({ width: W, height: H, laps: 2 });
    expect(one).toHaveLength(48);
    expect(two).toHaveLength(96);
  });

  it("derives both margins separately, since one scalar cannot bound both axes", () => {
    const { marginX, marginY } = scribbleCirclePath({
      width: W,
      height: H,
      strokeWidth: STROKE,
    });
    const reach = brushReach(STROKE, 1);
    expect(marginX).toBeCloseTo(reach + (W / 2) * 0.035 + W * 0.02);
    expect(marginY).toBeCloseTo(reach + (H / 2) * 0.035 + H * 0.02);
    expect(marginX).not.toBeCloseTo(marginY);
  });

  it("keeps every ribbon coordinate inside the padded viewBox", () => {
    for (const strokeWidth of controlValues("strokeWidth")) {
      for (const grain of controlValues("grain")) {
        for (const pressure of [0.05, 0.5, 1]) {
          const { d, marginX, marginY } = scribbleCirclePath({
            width: W,
            height: H,
            strokeWidth,
            grain,
            pressure,
          });
          const values = numbersIn(d);
          const xs = values.filter((_, i) => i % 2 === 0);
          const ys = values.filter((_, i) => i % 2 === 1);
          expect(Math.min(...xs)).toBeGreaterThanOrEqual(-marginX);
          expect(Math.max(...xs)).toBeLessThanOrEqual(W + marginX);
          expect(Math.min(...ys)).toBeGreaterThanOrEqual(-marginY);
          expect(Math.max(...ys)).toBeLessThanOrEqual(H + marginY);
        }
      }
    }
  });

  it("never produces a degenerate viewBox", () => {
    for (const grain of controlValues("grain")) {
      const [, , w, h] = scribbleCirclePath({
        width: W,
        height: H,
        strokeWidth: STROKE,
        grain,
      })
        .viewBox.split(" ")
        .map(Number);
      expect(w).toBeGreaterThan(0);
      expect(h).toBeGreaterThan(0);
    }
  });
});

describe("scribbleCirclePath drawing", () => {
  it("grows the ribbon as progress advances", () => {
    let previous = 0;
    for (const progress of [0.1, 0.3, 0.6, 1]) {
      const length = numbersIn(
        scribbleCirclePath({
          width: W,
          height: H,
          strokeWidth: STROKE,
          progress,
        }).d,
      ).length;
      expect(length).toBeGreaterThan(previous);
      previous = length;
    }
  });

  it("anchors the pressure profile to the whole gesture, not the drawn part", () => {
    const partial = scribbleCirclePath({
      width: W,
      height: H,
      strokeWidth: STROKE,
      progress: 0.5,
    });
    const full = scribbleCirclePath({
      width: W,
      height: H,
      strokeWidth: STROKE,
      progress: 1,
    });
    expect(full.d.startsWith(partial.d.slice(0, 40))).toBe(true);
  });

  it("stays a valid ribbon at the smallest possible progress", () => {
    const { d } = scribbleCirclePath({
      width: W,
      height: H,
      strokeWidth: STROKE,
      progress: 0,
    });
    expect(d.match(/M/g)).toHaveLength(1);
    expect(numbersIn(d).every(Number.isFinite)).toBe(true);
  });
});

describe("scribbleCirclePoints", () => {
  it("keeps a fixed hand-made irregularity now that wobble is gone", () => {
    const centre = scribbleCircleCentre(W, H);
    const radii = scribbleCirclePoints({ width: W, height: H }).map((point) =>
      radiusFrom(point, centre),
    );
    const spread = Math.max(...radii) - Math.min(...radii);
    expect(spread).toBeGreaterThan(0);
    expect(spread).toBeLessThan(0.08);
  });

  it("nudges the centre off the nominal one", () => {
    expect(scribbleCircleCentre(W, H)).not.toEqual({ x: W / 2, y: H / 2 });
  });

  it("passes its own starting angle at a different radius on the second lap", () => {
    const laps = 1.15;
    const points = scribbleCirclePoints({ width: W, height: H, laps });
    const centre = scribbleCircleCentre(W, H);
    const crossing = Math.round((points.length - 1) / laps);
    expect(crossing).toBe(48);
    expect(radiusFrom(points[crossing], centre)).not.toBeCloseTo(
      radiusFrom(points[0], centre),
      3,
    );
  });

  it("overshoots a full turn at the default laps", () => {
    expect(
      scribbleCirclePoints({ width: W, height: H }).length / 48,
    ).toBeGreaterThan(1);
  });
});

describe("scribbleCircleConfig", () => {
  it("exposes no wobble control", () => {
    expect(scribbleCircleConfig.controls.wobble).toBeUndefined();
  });

  it("lets grain be switched off entirely", () => {
    expect(numberControl("grain").min).toBe(0);
  });

  it("reaches a uniform brush at the top of the pressure range", () => {
    expect(numberControl("pressure").max).toBe(1);
  });

  it("covers the draw at the control maxima", () => {
    const longest =
      numberControl("durationSteps").max * numberControl("step").max;
    expect(longest).toBeLessThanOrEqual(scribbleCircleConfig.durationInFrames);
  });
});
