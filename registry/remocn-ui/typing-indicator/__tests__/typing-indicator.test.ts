
import { describe, expect, it } from "bun:test";
import { typingDotOffset, type TypingDotOptions } from "../index";
import { typingIndicatorConfig } from "../config";

const BASE_OPTS: TypingDotOptions = {
  fps: 30,
  dotCount: 3,
  amplitude: 5,
  speed: 1,
  cyclesPerSecond: 1.1,
};

describe("typingDotOffset: return shape", () => {
  it("returns translateY and opacity as numbers for frame=0 index=0", () => {
    const r = typingDotOffset(0, 0, BASE_OPTS);
    expect(typeof r.translateY).toBe("number");
    expect(typeof r.opacity).toBe("number");
  });

  it("returns translateY and opacity as numbers for frame=15 index=1", () => {
    const r = typingDotOffset(15, 1, BASE_OPTS);
    expect(typeof r.translateY).toBe("number");
    expect(typeof r.opacity).toBe("number");
  });

  it("returns translateY and opacity as numbers for frame=90 index=2", () => {
    const r = typingDotOffset(90, 2, BASE_OPTS);
    expect(typeof r.translateY).toBe("number");
    expect(typeof r.opacity).toBe("number");
  });
});

describe("typingDotOffset: translateY bounds [-amplitude, 0]", () => {
  const frames = [0, 1, 5, 7, 10, 13, 15, 20, 27, 30, 45, 60, 90];

  it("translateY is always >= -amplitude for index=0", () => {
    for (const frame of frames) {
      const { translateY } = typingDotOffset(frame, 0, BASE_OPTS);
      expect(translateY).toBeGreaterThanOrEqual(-BASE_OPTS.amplitude);
    }
  });

  it("translateY is always <= 0 for index=0", () => {
    for (const frame of frames) {
      const { translateY } = typingDotOffset(frame, 0, BASE_OPTS);
      expect(translateY).toBeLessThanOrEqual(0);
    }
  });

  it("translateY is always >= -amplitude for index=2", () => {
    for (const frame of frames) {
      const { translateY } = typingDotOffset(frame, 2, BASE_OPTS);
      expect(translateY).toBeGreaterThanOrEqual(-BASE_OPTS.amplitude);
    }
  });

  it("translateY is always <= 0 for index=2", () => {
    for (const frame of frames) {
      const { translateY } = typingDotOffset(frame, 2, BASE_OPTS);
      expect(translateY).toBeLessThanOrEqual(0);
    }
  });
});

describe("typingDotOffset: opacity bounds [0.45, 1.0]", () => {
  const frames = [0, 1, 5, 7, 10, 13, 15, 20, 27, 30, 45, 60, 90];

  it("opacity is always >= 0.45 for index=0", () => {
    for (const frame of frames) {
      const { opacity } = typingDotOffset(frame, 0, BASE_OPTS);
      expect(opacity).toBeGreaterThanOrEqual(0.45);
    }
  });

  it("opacity is always <= 1.0 for index=0", () => {
    for (const frame of frames) {
      const { opacity } = typingDotOffset(frame, 0, BASE_OPTS);
      expect(opacity).toBeLessThanOrEqual(1.0);
    }
  });

  it("opacity is always >= 0.45 for index=1", () => {
    for (const frame of frames) {
      const { opacity } = typingDotOffset(frame, 1, BASE_OPTS);
      expect(opacity).toBeGreaterThanOrEqual(0.45);
    }
  });

  it("opacity is always <= 1.0 for index=1", () => {
    for (const frame of frames) {
      const { opacity } = typingDotOffset(frame, 1, BASE_OPTS);
      expect(opacity).toBeLessThanOrEqual(1.0);
    }
  });
});

describe("typingDotOffset: dots are staggered (index 0 ≠ index 1 at frame 15)", () => {
  it("translateY of index=0 and index=1 differ at frame=15", () => {
    const r0 = typingDotOffset(15, 0, BASE_OPTS);
    const r1 = typingDotOffset(15, 1, BASE_OPTS);
    expect(r0.translateY).not.toBeCloseTo(r1.translateY, 3);
  });

  it("opacity of index=0 and index=1 differ at frame=15", () => {
    const r0 = typingDotOffset(15, 0, BASE_OPTS);
    const r1 = typingDotOffset(15, 1, BASE_OPTS);
    expect(r0.opacity).not.toBeCloseTo(r1.opacity, 3);
  });
});

describe("typingDotOffset: speed scales phase (speed=2, frame=f equals speed=1, frame=2f)", () => {
  it("translateY matches for frame=10 speed=2 vs frame=20 speed=1 (index=0)", () => {
    const fast = typingDotOffset(10, 0, { ...BASE_OPTS, speed: 2 });
    const slow = typingDotOffset(20, 0, { ...BASE_OPTS, speed: 1 });
    expect(fast.translateY).toBeCloseTo(slow.translateY, 10);
  });

  it("opacity matches for frame=10 speed=2 vs frame=20 speed=1 (index=0)", () => {
    const fast = typingDotOffset(10, 0, { ...BASE_OPTS, speed: 2 });
    const slow = typingDotOffset(20, 0, { ...BASE_OPTS, speed: 1 });
    expect(fast.opacity).toBeCloseTo(slow.opacity, 10);
  });

  it("translateY matches for frame=5 speed=2 vs frame=10 speed=1 (index=0)", () => {
    const fast = typingDotOffset(5, 0, { ...BASE_OPTS, speed: 2 });
    const slow = typingDotOffset(10, 0, { ...BASE_OPTS, speed: 1 });
    expect(fast.translateY).toBeCloseTo(slow.translateY, 10);
  });

  it("opacity matches for frame=5 speed=2 vs frame=10 speed=1 (index=0)", () => {
    const fast = typingDotOffset(5, 0, { ...BASE_OPTS, speed: 2 });
    const slow = typingDotOffset(10, 0, { ...BASE_OPTS, speed: 1 });
    expect(fast.opacity).toBeCloseTo(slow.opacity, 10);
  });
});

describe("typingIndicatorConfig.controls: dotCount", () => {
  it("dotCount is a number control", () => {
    expect(typingIndicatorConfig.controls.dotCount.type).toBe("number");
  });

  it("dotCount has a step property", () => {
    const ctrl = typingIndicatorConfig.controls.dotCount;
    if (ctrl.type !== "number") throw new Error("expected number");
    expect(typeof ctrl.step).toBe("number");
  });

  it("dotCount default is 3", () => {
    expect(typingIndicatorConfig.controls.dotCount.default).toBe(3);
  });
});

describe("typingIndicatorConfig.controls: size", () => {
  it("size is a number control", () => {
    expect(typingIndicatorConfig.controls.size.type).toBe("number");
  });

  it("size has a step property", () => {
    const ctrl = typingIndicatorConfig.controls.size;
    if (ctrl.type !== "number") throw new Error("expected number");
    expect(typeof ctrl.step).toBe("number");
  });

  it("size default is 8", () => {
    expect(typingIndicatorConfig.controls.size.default).toBe(8);
  });
});

describe("typingIndicatorConfig.controls: amplitude", () => {
  it("amplitude is a number control", () => {
    expect(typingIndicatorConfig.controls.amplitude.type).toBe("number");
  });

  it("amplitude has a step property", () => {
    const ctrl = typingIndicatorConfig.controls.amplitude;
    if (ctrl.type !== "number") throw new Error("expected number");
    expect(typeof ctrl.step).toBe("number");
  });

  it("amplitude default is 5", () => {
    expect(typingIndicatorConfig.controls.amplitude.default).toBe(5);
  });
});

describe("typingIndicatorConfig.snippet: import and element", () => {
  it("includes 'import { TypingIndicator }' from the correct path", () => {
    const out = typingIndicatorConfig.snippet({});
    expect(out).toContain("import { TypingIndicator }");
    expect(out).toContain('from "@/components/remocn/typing-indicator"');
  });

  it("contains a <TypingIndicator JSX element", () => {
    expect(typingIndicatorConfig.snippet({})).toContain("<TypingIndicator");
  });
});
