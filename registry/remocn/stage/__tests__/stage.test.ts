import { describe, expect, it } from "bun:test";
import { Easing } from "remotion";
import {
  getStagePlaneGeometry,
  getStageShake,
  getStageTransform,
  normalizeStageKeys,
  resolveStagePose,
} from "../index";

describe("normalizeStageKeys", () => {
  it("sorts keys without mutating the input", () => {
    const moves = [
      { at: 30, y: 0.8 },
      { at: 0, y: 0.1 },
    ];
    expect(normalizeStageKeys(moves).map((key) => key.at)).toEqual([0, 30]);
    expect(moves.map((key) => key.at)).toEqual([30, 0]);
  });

  it("uses the last supplied key when frames collide", () => {
    expect(
      normalizeStageKeys([
        { at: 10, y: 0.2 },
        { at: 10, y: 0.6 },
      ]),
    ).toEqual([{ at: 10, y: 0.6 }]);
  });
});

describe("resolveStagePose", () => {
  it("centers an empty stage", () => {
    expect(resolveStagePose(42, [])).toEqual({
      x: 0.5,
      y: 0.5,
      zoom: 1,
      rotate: 0,
    });
  });

  it("clamps normalized targets and timeline endpoints", () => {
    const moves = [
      { at: 10, x: -1, y: 0.2, zoom: 1.1 },
      { at: 20, x: 2, y: 0.8, zoom: 1.4 },
    ];
    expect(resolveStagePose(-100, moves)).toEqual({
      x: 0,
      y: 0.2,
      zoom: 1.1,
      rotate: 0,
    });
    expect(resolveStagePose(100, moves)).toEqual({
      x: 1,
      y: 0.8,
      zoom: 1.4,
      rotate: 0,
    });
  });

  it("applies destination easing and expresses holds", () => {
    const eased = resolveStagePose(5, [
      { at: 0, x: 0 },
      { at: 10, x: 1, easing: Easing.in(Easing.quad) },
    ]);
    expect(eased.x).toBeCloseTo(0.25, 6);

    const hold = [
      { at: 0, y: 0.1 },
      { at: 10, y: 0.4, easing: Easing.linear },
      { at: 20, y: 0.4, easing: Easing.linear },
      { at: 30, y: 0.8, easing: Easing.linear },
    ];
    expect(resolveStagePose(15, hold).y).toBe(0.4);
  });
});

describe("stage plane geometry", () => {
  it("preserves a tall source ratio and pins its target to frame center", () => {
    const pose = { x: 0.52, y: 0.955, zoom: 1, rotate: 0 };
    const geometry = getStagePlaneGeometry(
      1280,
      720,
      { width: 1265, height: 10022 },
      pose,
    );

    expect(geometry.width).toBeCloseTo(1075.2, 6);
    expect(geometry.height).toBeCloseTo(8518.304, 3);
    expect(geometry.left + geometry.targetX + geometry.translateX).toBe(640);
    expect(geometry.top + geometry.targetY + geometry.translateY).toBe(360);
  });

  it("falls back safely when content dimensions are invalid", () => {
    const geometry = getStagePlaneGeometry(
      1280,
      720,
      { width: 0, height: -1 },
      { x: 0.5, y: 0.5, zoom: 1, rotate: 0 },
    );
    expect(geometry.height).toBeCloseTo(604.8, 6);
  });
});

describe("stage transform", () => {
  it("combines target translation, camera roll, perspective pose, and shake", () => {
    const pose = { x: 0.5, y: 0.5, zoom: 1.2, rotate: 2 };
    const geometry = getStagePlaneGeometry(1280, 720, undefined, pose);
    expect(
      getStageTransform(geometry, pose, {
        scale: 0.8,
        rotateX: 14,
        rotateY: -20,
        entryY: 10,
        shake: { x: 2, y: -3, rotate: 0.5 },
      }),
    ).toBe(
      "translate3d(-2px, 13px, 0) scale(0.96) rotateZ(-2.5deg) rotateX(14deg) rotateY(-20deg)",
    );
  });
});

describe("getStageShake", () => {
  it("is deterministic, seed-sensitive, and strength-clamped", () => {
    expect(getStageShake(18, 0.8, "a")).toEqual(getStageShake(18, 0.8, "a"));
    expect(getStageShake(18, 0.8, "a")).not.toEqual(
      getStageShake(18, 0.8, "b"),
    );
    expect(getStageShake(18, 0, "a")).toEqual({ x: 0, y: 0, rotate: 0 });
    expect(getStageShake(18, 2, "a")).toEqual(getStageShake(18, 1, "a"));
  });
});
