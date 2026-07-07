import { describe, expect, it } from "bun:test";

import { TYPING_CPS, TYPING_START_FRAME, morphProgressAt } from "../index";

const FPS = 30;

describe("typing constants", () => {
  it("starts typing on a positive frame offset", () => {
    expect(TYPING_START_FRAME).toBeGreaterThan(0);
  });

  it("types at a positive characters-per-second rate", () => {
    expect(TYPING_CPS).toBeGreaterThan(0);
  });
});

describe("morphProgressAt", () => {
  it("is at or near 0 before the start frame", () => {
    for (let f = 0; f < TYPING_START_FRAME; f++) {
      const val = morphProgressAt(f, { fps: FPS, speed: 1 });
      expect(val).toBeLessThanOrEqual(0.001);
    }
  });

  it("increases after the start frame", () => {
    const early = morphProgressAt(TYPING_START_FRAME + 3, {
      fps: FPS,
      speed: 1,
    });
    const later = morphProgressAt(TYPING_START_FRAME + 12, {
      fps: FPS,
      speed: 1,
    });
    expect(later).toBeGreaterThan(early);
  });

  it("stays within [0, 1] for every frame", () => {
    for (let f = 0; f <= 300; f++) {
      const val = morphProgressAt(f, { fps: FPS, speed: 1 });
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it("approaches 1 for large frames", () => {
    expect(morphProgressAt(300, { fps: FPS, speed: 1 })).toBeCloseTo(1, 2);
  });
});
