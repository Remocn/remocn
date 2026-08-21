import { describe, expect, it } from "bun:test";
import { Easing } from "remotion";
import {
  getCameraShake,
  getCameraTransform,
  normalizeCameraKeys,
  resolveCameraPose,
} from "../index";

describe("normalizeCameraKeys", () => {
  it("sorts keys without mutating the input", () => {
    const moves = [
      { at: 30, x: 1 },
      { at: 0, x: 0 },
    ];
    expect(normalizeCameraKeys(moves).map((key) => key.at)).toEqual([0, 30]);
    expect(moves.map((key) => key.at)).toEqual([30, 0]);
  });

  it("uses the last supplied key when frames collide", () => {
    expect(
      normalizeCameraKeys([
        { at: 10, x: 0.2 },
        { at: 10, x: 0.6 },
      ]),
    ).toEqual([{ at: 10, x: 0.6 }]);
  });
});

describe("resolveCameraPose", () => {
  it("returns a neutral pose for an empty storyboard", () => {
    expect(resolveCameraPose(42, [])).toEqual({
      x: 0,
      y: 0,
      zoom: 1,
      rotate: 0,
    });
  });

  it("clamps to the first and last pose", () => {
    const moves = [
      { at: 10, x: 0.25, zoom: 1.1 },
      { at: 20, x: 0.5, zoom: 1.4 },
    ];
    expect(resolveCameraPose(-100, moves)).toEqual({
      x: 0.25,
      y: 0,
      zoom: 1.1,
      rotate: 0,
    });
    expect(resolveCameraPose(100, moves)).toEqual({
      x: 0.5,
      y: 0,
      zoom: 1.4,
      rotate: 0,
    });
  });

  it("applies the destination key easing per segment", () => {
    const pose = resolveCameraPose(5, [
      { at: 0, x: 0 },
      { at: 10, x: 1, easing: Easing.in(Easing.quad) },
    ]);
    expect(pose.x).toBeCloseTo(0.25, 6);
  });

  it("expresses a hold with adjacent identical poses", () => {
    const moves = [
      { at: 0, zoom: 1 },
      { at: 10, zoom: 1.4, easing: Easing.linear },
      { at: 20, zoom: 1.4, easing: Easing.linear },
      { at: 30, zoom: 1, easing: Easing.linear },
    ];
    expect(resolveCameraPose(15, moves).zoom).toBe(1.4);
  });
});

describe("camera transform", () => {
  it("keeps pan in unzoomed composition pixels", () => {
    expect(
      getCameraTransform({ x: 0.25, y: -0.5, zoom: 2, rotate: 4 }, 1280, 720),
    ).toBe("translate3d(-320px, 360px, 0) rotate(-4deg) scale(2)");
  });
});

describe("getCameraShake", () => {
  it("is deterministic and seed-sensitive", () => {
    expect(getCameraShake(18, 0.8, "a")).toEqual(getCameraShake(18, 0.8, "a"));
    expect(getCameraShake(18, 0.8, "a")).not.toEqual(
      getCameraShake(18, 0.8, "b"),
    );
  });

  it("clamps strength and returns zero when disabled", () => {
    expect(getCameraShake(18, 0, "a")).toEqual({ x: 0, y: 0, rotate: 0 });
    expect(getCameraShake(18, 2, "a")).toEqual(getCameraShake(18, 1, "a"));
  });
});
