import { describe, expect, it } from "bun:test";
import { getDefaults, resolveControls } from "@/lib/customizer-config";
import {
  getPeriodDropDot,
  getPeriodDropImpacts,
  getPeriodDropRise,
  getPeriodDropTime,
  periodDropDefaults,
  periodDropLength,
  periodDropTiming,
} from "..";
import { periodDropConfig } from "../config";

const sample = (from: number, to: number, step = 0.02) => {
  const out: number[] = [];
  for (let t = from; t <= to; t += step) out.push(t);
  return out;
};

describe("period-drop word", () => {
  it("raises each letter out of its line in turn", () => {
    expect(getPeriodDropRise(0, 0)).toBe(1);
    expect(getPeriodDropRise(12, 0)).toBe(0);
    expect(getPeriodDropRise(12, 1)).toBeGreaterThan(0);
    expect(getPeriodDropRise(14, 1)).toBe(0);
    const last = Array.from(periodDropDefaults.text).length - 1;
    expect(getPeriodDropRise(2 * last + 12, last)).toBe(0);
    expect(2 * last + 12).toBeLessThanOrEqual(periodDropTiming.dropStart + 2);
  });
});

describe("period-drop dot", () => {
  it("stays hidden above the frame until the drop", () => {
    expect(getPeriodDropDot(0).visible).toBe(false);
    expect(getPeriodDropDot(19.99).visible).toBe(false);
    const start = getPeriodDropDot(periodDropTiming.dropStart);
    expect(start.visible).toBe(true);
    expect(start.y).toBe(-1);
  });

  it("lands, then bounces twice with restitution 0.35", () => {
    const impacts = getPeriodDropImpacts();
    expect(impacts[0]).toBe(32);
    expect(impacts[1]).toBeCloseTo(40.4, 10);
    expect(impacts[2]).toBeCloseTo(43.34, 10);
    for (const t of impacts) expect(getPeriodDropDot(t).y).toBeCloseTo(0, 10);
    const apex = (from: number, to: number) =>
      Math.min(...sample(from, to).map((t) => getPeriodDropDot(t).y));
    expect(apex(impacts[0], impacts[1])).toBeCloseTo(-(0.35 ** 2), 3);
    expect(apex(impacts[1], impacts[2])).toBeCloseTo(-(0.35 ** 4), 3);
  });

  it("never sinks below the line", () => {
    for (const t of sample(0, 80, 0.05)) {
      expect(getPeriodDropDot(t).y).toBeLessThanOrEqual(0);
    }
  });

  it("stretches in flight and squashes on impact, within the caps", () => {
    let minY = Number.POSITIVE_INFINITY;
    let maxY = 0;
    let maxX = 0;
    for (const t of sample(20, 80, 0.01)) {
      const d = getPeriodDropDot(t);
      minY = Math.min(minY, d.scaleY);
      maxY = Math.max(maxY, d.scaleY);
      maxX = Math.max(maxX, d.scaleX);
      expect(d.scaleX * d.scaleY).toBeCloseTo(1, 10);
    }
    expect(minY).toBeCloseTo(0.78, 6);
    expect(maxY).toBeLessThanOrEqual(1.3);
    expect(maxY).toBeGreaterThan(1.29);
    expect(maxX).toBeLessThanOrEqual(1.3);
    expect(getPeriodDropDot(32).scaleY).toBeCloseTo(0.78, 10);
    expect(getPeriodDropDot(31.9).scaleY).toBeGreaterThan(1.25);
  });

  it("rests exactly from its length on", () => {
    for (const t of [periodDropLength, periodDropLength + 1, 120]) {
      expect(getPeriodDropDot(t)).toEqual({
        visible: true,
        y: 0,
        scaleX: 1,
        scaleY: 1,
      });
    }
    expect(getPeriodDropDot(periodDropLength - 1).scaleY).not.toBe(1);
  });
});

describe("period-drop time and config", () => {
  it("maps frames onto the 30 fps timeline", () => {
    expect(getPeriodDropTime(30)).toBe(30);
    expect(getPeriodDropTime(60, { fps: 60 })).toBe(30);
    expect(getPeriodDropTime(10, { speed: 2 })).toBe(20);
  });

  it("previews with the reel's orange dot", () => {
    const defaults = getDefaults(
      resolveControls("period-drop", periodDropConfig.controls),
    );
    expect(defaults.text).toBe(periodDropDefaults.text);
    expect(defaults.fontSize).toBe(periodDropDefaults.fontSize);
    expect(defaults.fontWeight).toBe(periodDropDefaults.fontWeight);
    expect(defaults.dotSize).toBe(periodDropDefaults.dotSize);
    expect(periodDropConfig.durationInFrames).toBeGreaterThan(periodDropLength);
  });
});
