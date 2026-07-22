import { describe, expect, it } from "bun:test";

import { handCountConfig } from "../config";
import {
  handCountDuration,
  handCountJitter,
  handCountPose,
  handCountText,
  handCountValue,
} from "../index";

const ON_GRID = { delay: 0, durationSteps: 12, step: 3 };
const OFF_GRID = { delay: 1, durationSteps: 12, step: 3 };
const EASES = ["in-out", "out", "linear"] as const;

const numberControl = (name: string) => {
  const control = handCountConfig.controls[name];
  if (control.type !== "number") {
    throw new Error(`${name} is not a number control`);
  }
  return control;
};

describe("handCountDuration", () => {
  it("equals the naive end when delay sits on the pose grid", () => {
    expect(handCountDuration(ON_GRID)).toBe(36);
    expect(handCountDuration({ delay: 9, durationSteps: 12, step: 3 })).toBe(
      45,
    );
  });

  it("rounds up past the naive end when delay is off grid", () => {
    const naive = OFF_GRID.delay + OFF_GRID.durationSteps * OFF_GRID.step;
    expect(naive).toBe(37);
    expect(handCountDuration(OFF_GRID)).toBe(39);
    expect(handCountDuration(OFF_GRID)).toBeGreaterThan(naive);
  });

  it("rounds up rather than down, so a Sequence never cuts the landing", () => {
    for (let delay = 0; delay < 12; delay++) {
      const options = { delay, durationSteps: 12, step: 3 };
      const naive = delay + 36;
      const settled = handCountDuration(options);
      expect(settled).toBeGreaterThanOrEqual(naive);
      expect(settled % 3).toBe(0);
      expect(settled - naive).toBeLessThan(3);
    }
  });

  it("lands on the pose grid for every step in the control range", () => {
    const stepControl = numberControl("step");
    for (let step = stepControl.min; step <= stepControl.max; step++) {
      for (const delay of [0, 1, 5, 7]) {
        const settled = handCountDuration({ delay, durationSteps: 12, step });
        expect(settled % step).toBe(0);
      }
    }
  });
});

describe("handCountValue", () => {
  const at = (
    frame: number,
    options = ON_GRID,
    ease?: (typeof EASES)[number],
  ) => handCountValue({ frame, from: 0, to: 100, ...options, ease });

  it("holds at `from` up to and including the delay frame", () => {
    expect(at(0)).toBe(0);
    expect(
      handCountValue({ frame: 5, from: 20, to: 100, delay: 6, step: 3 }),
    ).toBe(20);
    expect(
      handCountValue({ frame: 6, from: 20, to: 100, delay: 6, step: 3 }),
    ).toBe(20);
  });

  it("never goes backwards", () => {
    let previous = -1;
    for (let frame = 0; frame <= 60; frame++) {
      const value = at(frame);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });

  it("holds constant for every frame inside one pose", () => {
    for (const base of [6, 15, 27]) {
      for (const offset of [0, 1, 2]) {
        expect(at(base + offset)).toBe(at(base));
      }
    }
  });

  it("lands exactly on `to` at handCountDuration, not at the naive end", () => {
    expect(at(handCountDuration(ON_GRID))).toBe(100);
    expect(at(handCountDuration(OFF_GRID), OFF_GRID)).toBe(100);
  });

  it("has NOT landed at the naive end when delay is off grid", () => {
    const naive = OFF_GRID.delay + OFF_GRID.durationSteps * OFF_GRID.step;
    expect(at(naive, OFF_GRID)).not.toBe(100);
    expect(at(naive, OFF_GRID, "linear")).toBeCloseTo((35 / 36) * 100, 6);
    expect(at(naive + 2, OFF_GRID)).toBe(100);
  });

  it("stays on `to` forever once it has landed", () => {
    for (const frame of [36, 60, 300]) {
      expect(at(frame)).toBe(100);
    }
  });

  it("agrees at both ends across eases and differs in the middle", () => {
    for (const ease of EASES) {
      expect(at(0, ON_GRID, ease)).toBe(0);
      expect(at(36, ON_GRID, ease)).toBe(100);
    }
    expect(at(15, ON_GRID, "out")).toBeGreaterThan(at(15, ON_GRID, "linear"));
    expect(at(15, ON_GRID, "in-out")).toBeLessThan(at(15, ON_GRID, "linear"));
  });

  it("opens on a small move under in-out, instead of dumping a quarter of the count into the first pose", () => {
    expect(at(3, ON_GRID, "out") / 100).toBeCloseTo(0.23, 2);
    expect(at(3, ON_GRID, "in-out") / 100).toBeLessThan(0.01);
    expect(at(3, ON_GRID, "in-out")).toBeGreaterThan(0);
  });

  it("keeps the tail alive under in-out, where out has already stopped moving", () => {
    const tailOf = (ease: "in-out" | "out") =>
      at(36, ON_GRID, ease) - at(24, ON_GRID, ease);
    expect(tailOf("out")).toBeLessThan(10);
    expect(tailOf("in-out")).toBeGreaterThan(tailOf("out"));
  });

  it("is symmetric under in-out, so the ramp up mirrors the settle", () => {
    for (const t of [3, 9, 15]) {
      const rise = at(t, ON_GRID, "in-out");
      const fall = 100 - at(36 - t, ON_GRID, "in-out");
      expect(rise).toBeCloseTo(fall, 6);
    }
  });

  it("advances on every counting pose under in-out, never stalling", () => {
    for (let pose = 1; pose <= 12; pose++) {
      expect(at(pose * 3, ON_GRID, "in-out")).toBeGreaterThan(
        at((pose - 1) * 3, ON_GRID, "in-out"),
      );
    }
  });

  it("counts down when `from` is above `to`", () => {
    const down = (frame: number) =>
      handCountValue({ frame, from: 100, to: 0, ...ON_GRID });
    expect(down(0)).toBe(100);
    expect(down(36)).toBe(0);
    expect(down(15)).toBeLessThan(100);
  });
});

describe("handCountText", () => {
  it("renders the requested decimal places", () => {
    expect(handCountText(12.3456, { decimals: 2 })).toBe("12.35");
    expect(handCountText(12.3456, { decimals: 1 })).toBe("12.3");
  });

  it("never emits a decimal point at decimals 0", () => {
    for (const value of [0, 7.4, 99.99, -3.2]) {
      expect(handCountText(value)).not.toContain(".");
    }
    expect(handCountText(99.99)).toBe("100");
  });

  it("wraps the value in the affixes", () => {
    expect(handCountText(19, { prefix: "$", suffix: "/mo" })).toBe("$19/mo");
    expect(handCountText(19, { prefix: "$", decimals: 2, suffix: "/mo" })).toBe(
      "$19.00/mo",
    );
  });

  it("keeps the sign on negative values", () => {
    expect(handCountText(-42)).toBe("-42");
    expect(handCountText(-42.5, { decimals: 1, prefix: "$" })).toBe("$-42.5");
  });

  it("defaults to a bare integer", () => {
    expect(handCountText(5)).toBe("5");
  });
});

describe("handCountPose", () => {
  it("advances one pose per step while counting", () => {
    expect(handCountPose(0, ON_GRID)).toBe(0);
    expect(handCountPose(3, ON_GRID)).toBe(1);
    expect(handCountPose(6, ON_GRID)).toBe(2);
  });

  it("stops at the settle pose", () => {
    const settled = handCountPose(handCountDuration(ON_GRID), ON_GRID);
    expect(handCountPose(1000, ON_GRID)).toBe(settled);
  });
});

describe("handCountJitter", () => {
  const jitter = (frame: number, options = ON_GRID, index = 0) =>
    handCountJitter({ frame, index, seed: "count", ...options });

  it("is identical for every frame inside one pose", () => {
    for (const offset of [0, 1, 2]) {
      expect(jitter(6 + offset)).toEqual(jitter(6));
    }
  });

  it("redraws the glyph on every counting pose", () => {
    expect(jitter(6)).not.toEqual(jitter(9));
    expect(jitter(9)).not.toEqual(jitter(12));
  });

  it("freezes at completion and stays frozen 30 frames later", () => {
    const settled = handCountDuration(ON_GRID);
    expect(jitter(settled + 30)).toEqual(jitter(settled));
    expect(jitter(settled + 300)).toEqual(jitter(settled));
  });

  it("freezes at completion for an off-grid delay too", () => {
    const settled = handCountDuration(OFF_GRID);
    expect(settled).toBe(39);
    expect(jitter(settled + 30, OFF_GRID)).toEqual(jitter(settled, OFF_GRID));
  });

  it("still moves on the pose right before it settles", () => {
    const settled = handCountDuration(ON_GRID);
    expect(jitter(settled - 3)).not.toEqual(jitter(settled));
  });

  it("gives each glyph its own hand", () => {
    expect(jitter(6, ON_GRID, 0)).not.toEqual(jitter(6, ON_GRID, 1));
  });

  it("stays inside the amplitudes handwrite uses", () => {
    for (let frame = 0; frame <= 40; frame++) {
      for (let index = 0; index < 6; index++) {
        const { rot, dy } = jitter(frame, ON_GRID, index);
        expect(Math.abs(rot)).toBeLessThanOrEqual(3.2);
        expect(Math.abs(dy)).toBeLessThanOrEqual(1.8);
      }
    }
  });

  it("is deterministic per seed and differs across seeds", () => {
    const a = handCountJitter({ frame: 6, index: 2, seed: "one", ...ON_GRID });
    const b = handCountJitter({ frame: 6, index: 2, seed: "one", ...ON_GRID });
    const c = handCountJitter({ frame: 6, index: 2, seed: "two", ...ON_GRID });
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});

describe("handCountConfig", () => {
  const defaultSettle = () =>
    handCountDuration({
      durationSteps: numberControl("durationSteps").default,
      step: numberControl("step").default,
    });

  it("fits the default count with a beat left to read the number", () => {
    expect(defaultSettle()).toBe(54);
    expect(
      handCountConfig.durationInFrames - defaultSettle(),
    ).toBeGreaterThanOrEqual(30);
  });

  it("does not hold a settled number for most of the preview", () => {
    expect(handCountConfig.durationInFrames).toBeLessThanOrEqual(
      defaultSettle() * 2,
    );
  });

  it("records exactly where a maxed-out slider outruns the preview", () => {
    const fits = (durationSteps: number, step: number) =>
      handCountDuration({ durationSteps, step }) <=
      handCountConfig.durationInFrames;
    expect(fits(18, 3)).toBe(true);
    expect(fits(24, 3)).toBe(true);
    expect(fits(15, 6)).toBe(true);
    expect(fits(18, 6)).toBe(false);
    expect(fits(24, 6)).toBe(false);
  });

  it("exposes ease as the two the component accepts", () => {
    const ease = handCountConfig.controls.ease;
    if (ease.type !== "select") {
      throw new Error("ease is not a select control");
    }
    expect(ease.options).toEqual(["in-out", "out", "linear"]);
  });
});
