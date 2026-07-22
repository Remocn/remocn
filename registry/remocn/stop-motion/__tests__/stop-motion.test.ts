import { describe, expect, it } from "bun:test";
import { spring } from "remotion";

import {
  DEFAULT_STEP,
  hash01,
  hashRange,
  paperJitter,
  qf,
  qstep,
  steppedRamp,
  steppedSpring,
} from "../index";

const FPS = 30;

describe("qf / qstep", () => {
  it("holds the first step at frame 0", () => {
    expect(qf(0)).toBe(0);
    expect(qf(1)).toBe(0);
    expect(qf(2)).toBe(0);
    expect(qstep(0)).toBe(0);
    expect(qstep(1)).toBe(0);
    expect(qstep(2)).toBe(0);
  });

  it("ticks at the step boundary", () => {
    expect(qf(3)).toBe(3);
    expect(qstep(3)).toBe(1);
    expect(qf(5)).toBe(3);
    expect(qf(6)).toBe(6);
    expect(qstep(6)).toBe(2);
  });

  it("defaults to a 3-frame step", () => {
    expect(DEFAULT_STEP).toBe(3);
    expect(qf(7)).toBe(qf(7, 3));
    expect(qstep(7)).toBe(qstep(7, 3));
  });

  it("honors a custom step", () => {
    expect(qf(7, 5)).toBe(5);
    expect(qf(4, 5)).toBe(0);
    expect(qstep(11, 5)).toBe(2);
    expect(qf(9, 1)).toBe(9);
  });
});

describe("hash01", () => {
  it("is deterministic per seed", () => {
    expect(hash01("paper")).toBe(hash01("paper"));
  });

  it("stays inside [0, 1)", () => {
    for (let i = 0; i < 500; i++) {
      const v = hash01(`seed:${i}`);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("differs across seeds", () => {
    expect(hash01("a")).not.toBe(hash01("b"));
    expect(hash01("card:x:0")).not.toBe(hash01("card:x:1"));
  });
});

describe("hashRange", () => {
  it("stays inside [lo, hi]", () => {
    for (let i = 0; i < 500; i++) {
      const v = hashRange(`range:${i}`, -1.4, 1.4);
      expect(v).toBeGreaterThanOrEqual(-1.4);
      expect(v).toBeLessThanOrEqual(1.4);
    }
  });

  it("is deterministic", () => {
    expect(hashRange("photo", 0, 10)).toBe(hashRange("photo", 0, 10));
  });
});

describe("paperJitter", () => {
  it("returns the same pose for every frame inside one step", () => {
    const a = paperJitter(3, "photo");
    const b = paperJitter(4, "photo");
    const c = paperJitter(5, "photo");
    expect(a).toEqual(b);
    expect(a).toEqual(c);
  });

  it("changes when the step ticks", () => {
    expect(paperJitter(2, "photo")).not.toEqual(paperJitter(3, "photo"));
  });

  it("respects amp and rotAmp bounds", () => {
    for (let f = 0; f <= 120; f++) {
      const j = paperJitter(f, "photo", { amp: 2, rotAmp: 0.5 });
      expect(Math.abs(j.x)).toBeLessThanOrEqual(2);
      expect(Math.abs(j.y)).toBeLessThanOrEqual(2);
      expect(Math.abs(j.rot)).toBeLessThanOrEqual(0.5);
    }
  });

  it("is deterministic per seed and differs across seeds", () => {
    expect(paperJitter(9, "photo")).toEqual(paperJitter(9, "photo"));
    expect(paperJitter(9, "photo")).not.toEqual(paperJitter(9, "note"));
  });

  it("honors a custom step", () => {
    expect(paperJitter(3, "photo", { step: 6 })).toEqual(
      paperJitter(5, "photo", { step: 6 }),
    );
    expect(paperJitter(5, "photo", { step: 6 })).not.toEqual(
      paperJitter(6, "photo", { step: 6 }),
    );
  });
});

describe("steppedRamp", () => {
  it("returns 0 at or before from", () => {
    expect(steppedRamp(0, 6, 18)).toBe(0);
    expect(steppedRamp(6, 6, 18)).toBe(0);
    expect(steppedRamp(8, 6, 18)).toBe(0);
  });

  it("returns 1 at or after to", () => {
    expect(steppedRamp(18, 6, 18)).toBe(1);
    expect(steppedRamp(40, 6, 18)).toBe(1);
  });

  it("is constant within a step", () => {
    expect(steppedRamp(9, 6, 18)).toBe(steppedRamp(11, 6, 18));
  });

  it("progresses linearly by default", () => {
    expect(steppedRamp(12, 6, 18)).toBeCloseTo(0.5, 10);
  });

  it("applies the ease", () => {
    const eased = steppedRamp(12, 6, 18, { ease: (t) => t * t });
    expect(eased).toBeCloseTo(0.25, 10);
  });

  it("honors a custom step", () => {
    expect(steppedRamp(11, 0, 12, { step: 6 })).toBe(
      steppedRamp(7, 0, 12, { step: 6 }),
    );
  });
});

describe("steppedSpring", () => {
  it("is constant within a step", () => {
    expect(steppedSpring({ frame: 6, fps: FPS })).toBe(
      steppedSpring({ frame: 8, fps: FPS }),
    );
  });

  it("equals spring() sampled at the quantized frame", () => {
    for (const frame of [0, 4, 7, 13, 25]) {
      expect(steppedSpring({ frame, fps: FPS })).toBe(
        spring({ frame: qf(frame), fps: FPS }),
      );
    }
  });

  it("shifts by delay and clamps below zero", () => {
    expect(steppedSpring({ frame: 15, fps: FPS, delay: 9 })).toBe(
      spring({ frame: qf(6), fps: FPS }),
    );
    expect(steppedSpring({ frame: 2, fps: FPS, delay: 9 })).toBe(
      spring({ frame: 0, fps: FPS }),
    );
  });

  it("honors a custom step", () => {
    expect(steppedSpring({ frame: 11, fps: FPS, step: 6 })).toBe(
      spring({ frame: 6, fps: FPS }),
    );
  });

  it("threads the spring config", () => {
    const config = { damping: 200, stiffness: 100, mass: 1 };
    expect(steppedSpring({ frame: 9, fps: FPS, config })).toBe(
      spring({ frame: 9, fps: FPS, config }),
    );
  });
});
