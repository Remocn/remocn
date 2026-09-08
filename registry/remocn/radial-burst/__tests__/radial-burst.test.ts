import { describe, expect, it } from "bun:test";
import {
  getRadialBurstDuration,
  getRadialBurstRibbonPath,
  getRadialBurstSegmentPath,
  getRadialBurstState,
  radialBurstLength,
} from "..";
import { radialBurstConfig } from "../config";

describe("radial burst timeline", () => {
  it("starts and finishes on a clean frame, staying clear after one pass", () => {
    for (const frame of [0, radialBurstLength, 120, 1000]) {
      const state = getRadialBurstState(frame);
      expect(state.dotRadius).toBe(0);
      expect(state.showSegments).toBe(false);
      expect(state.showRing).toBe(false);
    }
    expect(getRadialBurstState(12).dotRadius).toBeGreaterThan(0);
    expect(getRadialBurstState(36).showSegments).toBe(true);
    expect(getRadialBurstState(90).showRing).toBe(true);
  });

  it("welds the arcs into the ring without a jump in radius or thickness", () => {
    const before = getRadialBurstState(84 - 0.0001);
    const after = getRadialBurstState(84);
    expect(before.showSegments).toBe(true);
    expect(after.showRing).toBe(true);
    expect(before.curl).toBe(1);
    expect(before.arcAngle * before.count).toBeGreaterThan(Math.PI * 2);
    expect(before.radius).toBeCloseTo(after.radius, 3);
    expect(before.strokeWidth).toBeCloseTo(after.strokeWidth, 3);
  });

  it("loops repeatably and can be sampled in any order", () => {
    for (const frame of [0, 12, 30, 61, 84, 109, 119]) {
      const pose = getRadialBurstState(frame, { loop: true });
      getRadialBurstState(1000, { loop: true });
      expect(getRadialBurstState(frame + 120, { loop: true })).toEqual(pose);
    }
  });

  it("adjusts preview duration with speed", () => {
    expect(getRadialBurstDuration()).toBe(120);
    expect(radialBurstConfig.getDurationInFrames?.({ speed: 0.5 })).toBe(240);
    expect(getRadialBurstDuration({ speed: 2 })).toBe(60);
    expect(getRadialBurstDuration({ speed: 0 })).toBe(1);
  });
});

describe("radial burst geometry", () => {
  it("uses the intensity control to restore the classic plane and symmetrical geometry", () => {
    const classic = getRadialBurstState(54, { intensity: 0 });
    const sculptural = getRadialBurstState(54, { intensity: 1 });
    expect(classic.planeScale).toBe(1);
    expect(classic.planeAngle).toBe(0);
    expect(classic.offsetX).toBe(0);
    expect(classic.energy).toBe(0);
    expect(sculptural.planeScale).toBeLessThan(1);
    expect(sculptural.energy).toBeGreaterThan(0.5);
    expect(getRadialBurstRibbonPath(sculptural, 0)).not.toBe(
      getRadialBurstRibbonPath(sculptural, 1),
    );
  });

  it("keeps closed ribbon silhouettes finite at maximum intensity and reversed twist", () => {
    for (const frame of [18, 30, 54, 72, 83]) {
      const state = getRadialBurstState(frame, {
        intensity: 1.5,
        thickness: 60,
        radius: 100,
      });
      for (const twist of [-180, 0, 180]) {
        const path = getRadialBurstRibbonPath(state, 0, twist);
        expect(path.endsWith(" Z")).toBe(true);
        expect(path).not.toMatch(/NaN|Infinity/);
      }
    }
  });

  it("moves the inner ring edge beyond all corners, including on wide and portrait frames", () => {
    for (const [width, height] of [
      [1280, 720],
      [720, 1280],
      [720, 720],
      [2560, 720],
    ]) {
      for (const thickness of [8, 30, 60]) {
        const state = getRadialBurstState(radialBurstLength, {
          width,
          height,
          thickness,
        });
        expect(state.radius - state.strokeWidth / 2).toBeGreaterThan(
          Math.hypot(width, height) / 2,
        );
      }
    }
  });

  it("starts with straight spokes and curves their endpoints onto the ring", () => {
    const straight = getRadialBurstState(30);
    const values =
      getRadialBurstSegmentPath(straight)
        .match(/-?\d+(?:\.\d+)?/g)
        ?.map(Number) ?? [];
    expect(values).toHaveLength(8);
    expect([values[1], values[3], values[5], values[7]]).toEqual([0, 0, 0, 0]);
    const curved = getRadialBurstState(83);
    const points =
      getRadialBurstSegmentPath(curved)
        .match(/-?\d+(?:\.\d+)?/g)
        ?.map(Number) ?? [];
    expect(Math.hypot(points[0], points[1])).toBeCloseTo(curved.radius, 2);
    expect(Math.hypot(points[6], points[7])).toBeCloseTo(curved.radius, 2);
  });

  it("keeps geometry finite at control extremes and normalizes invalid numeric input", () => {
    for (const segments of [4, 16, -20, Number.NaN]) {
      for (const frame of [0, 20, 54, 83, 96, 114]) {
        const state = getRadialBurstState(frame, {
          segments,
          thickness: 60,
          radius: 100,
        });
        expect(state.count).toBeGreaterThanOrEqual(4);
        expect(state.count).toBeLessThanOrEqual(16);
        expect(getRadialBurstSegmentPath(state)).not.toMatch(/NaN|Infinity/);
      }
    }
  });

  it("reverses the assembly direction independently of radius and segment count", () => {
    const forward = getRadialBurstState(60, { rotation: 180, segments: 6 });
    const backward = getRadialBurstState(60, { rotation: -180, segments: 6 });
    expect(forward.rotation).toBeCloseTo(-backward.rotation);
    expect(forward.radius).toBe(backward.radius);
    expect(backward.count).toBe(6);
  });
});
