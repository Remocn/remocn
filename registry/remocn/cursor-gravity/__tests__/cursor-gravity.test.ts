import { describe, expect, test } from "bun:test";
import {
  cursorGravityLength,
  getCursorGravityDuration,
  getCursorGravityState,
  getGravityButtonPath,
  getGravityCursorPath,
} from "..";

describe("cursor gravity extraction", () => {
  test("starts with the cursor and entire button outside the real viewport", () => {
    for (const [width, height] of [
      [1280, 720],
      [720, 1280],
      [1080, 1080],
    ]) {
      for (const frame of [0, 5, 10]) {
        const pose = getCursorGravityState(frame, { width, height });
        expect(pose.front).toBeGreaterThan(width);
        expect(pose.cursorY - 70 * pose.unit).toBeGreaterThan(height);
        expect(pose.tetherOpacity).toBe(0);
      }
    }
  });
  test("first two tugs advance, hold and recoil while the back stays hidden", () => {
    for (const [pull, hold, recoil] of [
      [59, 64, 70],
      [83, 87, 94],
    ]) {
      const a = getCursorGravityState(pull);
      const b = getCursorGravityState(hold);
      const c = getCursorGravityState(recoil);
      expect(b.front).toBe(a.front);
      expect(c.front).toBeGreaterThan(a.front);
      expect(a.right).toBeGreaterThan(1280);
      expect(a.strain).toBeGreaterThan(0);
      expect(a.neckHeight).toBeLessThan(a.bodyHeight);
    }
  });
  test("button settles at center and cursor exits for the final hold", () => {
    for (const [width, height] of [
      [1280, 720],
      [720, 1280],
      [1080, 1080],
    ]) {
      const pose = getCursorGravityState(cursorGravityLength, {
        width,
        height,
      });
      expect((pose.front + pose.right) / 2).toBeCloseTo(width / 2, 5);
      expect(pose.buttonWidth).toBeCloseTo(300 * pose.unit, 5);
      expect(pose.strain).toBe(0);
      expect(pose.cursorY - 70 * pose.unit).toBeGreaterThan(height);
      expect(pose.tetherOpacity).toBe(0);
      const late = getCursorGravityState(1000, { width, height });
      expect(late.front).toBe(pose.front);
      expect(late.right).toBe(pose.right);
      expect(late.centerY).toBe(pose.centerY);
    }
  });
  test("phase boundaries stay continuous and seeking does not change the result", () => {
    for (const t of [
      10, 39, 48, 59, 64, 70, 83, 87, 94, 112, 127, 132, 140, 151,
    ]) {
      const a = getCursorGravityState(t - 0.0001);
      const b = getCursorGravityState(t + 0.0001);
      for (const key of [
        "front",
        "right",
        "centerY",
        "cursorX",
        "cursorY",
        "cursorAngle",
      ] as const) {
        expect(Math.abs(a[key] - b[key])).toBeLessThan(0.05);
      }
      const expected = getCursorGravityState(t);
      getCursorGravityState(200);
      getCursorGravityState(0);
      expect(getCursorGravityState(t)).toEqual(expected);
    }
  });
  test("geometry stays finite at supported tensions and proportions", () => {
    for (const tension of [0, 1, 1.5, Number.NaN]) {
      for (let frame = 0; frame <= 180; frame++) {
        const pose = getCursorGravityState(frame, { tension });
        expect(getGravityButtonPath(pose)).not.toMatch(/NaN|Infinity/);
        expect(pose.neckHeight).toBeGreaterThan(0);
        expect(pose.buttonWidth).toBeGreaterThan(0);
      }
    }
  });
  test("cursor rear loads on each tug and relaxes without moving its tip", () => {
    for (const peak of [58, 81, 100]) {
      const pose = getCursorGravityState(peak);
      expect(pose.cursorEffort).toBeGreaterThan(0.7);
      expect(getGravityCursorPath(pose.cursorEffort)).toStartWith(
        "M -5 -4 Q 3 0 -5 4",
      );
      expect(getCursorGravityState(peak, { tension: 0 }).cursorEffort).toBe(0);
    }
    for (const rest of [0, 48, 70, 94, 118, 180]) {
      expect(getCursorGravityState(rest).cursorEffort).toBe(0);
    }
    for (const t of [48, 58, 64, 70, 81, 87, 94, 100, 104, 118]) {
      expect(
        Math.abs(
          getCursorGravityState(t - 0.0001).cursorEffort -
            getCursorGravityState(t + 0.0001).cursorEffort,
        ),
      ).toBeLessThan(0.001);
    }
  });
  test("speed scales the transition and final hold", () => {
    expect(getCursorGravityDuration()).toBe(180);
    expect(getCursorGravityDuration({ speed: 0.5 })).toBe(360);
    expect(getCursorGravityDuration({ speed: 2 })).toBe(90);
    expect(getCursorGravityDuration({ speed: 0 })).toBe(1);
    expect(getCursorGravityDuration({ speed: Number.NaN })).toBe(180);
  });
});
