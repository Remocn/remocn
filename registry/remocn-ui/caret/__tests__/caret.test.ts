import { describe, expect, it } from "bun:test";

import { caretBlinkOpacity } from "../index";

const FPS = 30;

describe("caretBlinkOpacity", () => {
  it("returns only 0 or 1 across a full range of frames", () => {
    for (let f = 0; f <= 300; f++) {
      const v = caretBlinkOpacity(f, { fps: FPS, blinkPerSecond: 1, speed: 1 });
      expect(v === 0 || v === 1).toBe(true);
    }
  });

  it("starts visible at frame 0", () => {
    expect(caretBlinkOpacity(0, { fps: FPS, blinkPerSecond: 1, speed: 1 })).toBe(1);
  });

  it("toggles after one half-period for blinkPerSecond=1", () => {
    const halfPeriod = FPS / 1 / 2;
    const on = caretBlinkOpacity(0, { fps: FPS, blinkPerSecond: 1, speed: 1 });
    const off = caretBlinkOpacity(halfPeriod, {
      fps: FPS,
      blinkPerSecond: 1,
      speed: 1,
    });
    expect(on).toBe(1);
    expect(off).toBe(0);
  });

  it("is deterministic for identical inputs", () => {
    const a = caretBlinkOpacity(37, { fps: FPS, blinkPerSecond: 2, speed: 1 });
    const b = caretBlinkOpacity(37, { fps: FPS, blinkPerSecond: 2, speed: 1 });
    expect(a).toBe(b);
  });

  it("blinks twice as fast when blinkPerSecond doubles", () => {
    const slowToggle = FPS / 1 / 2;
    const fastToggle = FPS / 2 / 2;
    expect(
      caretBlinkOpacity(fastToggle, { fps: FPS, blinkPerSecond: 2, speed: 1 }),
    ).toBe(0);
    expect(
      caretBlinkOpacity(fastToggle, { fps: FPS, blinkPerSecond: 1, speed: 1 }),
    ).toBe(1);
    expect(
      caretBlinkOpacity(slowToggle, { fps: FPS, blinkPerSecond: 1, speed: 1 }),
    ).toBe(0);
  });

  it("speed=2 at frame f matches speed=1 at frame 2f", () => {
    for (let f = 0; f <= 120; f++) {
      const fast = caretBlinkOpacity(f, { fps: FPS, blinkPerSecond: 1, speed: 2 });
      const normal = caretBlinkOpacity(2 * f, {
        fps: FPS,
        blinkPerSecond: 1,
        speed: 1,
      });
      expect(fast).toBe(normal);
    }
  });

  it("stays visible when blinkPerSecond is 0 or negative", () => {
    expect(caretBlinkOpacity(13, { fps: FPS, blinkPerSecond: 0, speed: 1 })).toBe(1);
  });
});
