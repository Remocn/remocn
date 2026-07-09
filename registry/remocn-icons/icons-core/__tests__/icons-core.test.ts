import { describe, expect, it } from "bun:test";

import {
  drawnPathProps,
  iconTimeline,
  staggeredProgress,
} from "../index";

const FPS = 30;
const props = (over: Partial<Parameters<typeof iconTimeline>[2]> = {}) => over;
const timings = (over: Partial<Parameters<typeof iconTimeline>[3]> = {}) => ({
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 20,
  ...over,
});

describe("iconTimeline draw phase", () => {
  it("starts at 0 draw and reaches 1 by the draw duration", () => {
    expect(iconTimeline(0, FPS, props(), timings()).drawProgress).toBe(0);
    expect(
      iconTimeline(14, FPS, props(), timings()).drawProgress,
    ).toBeCloseTo(1, 6);
  });

  it("clamps drawProgress to 1 past the draw window", () => {
    expect(iconTimeline(40, FPS, props(), timings()).drawProgress).toBe(1);
  });

  it("never goes negative before frame 0", () => {
    expect(iconTimeline(-5, FPS, props(), timings()).drawProgress).toBe(0);
  });
});

describe("iconTimeline animation modes", () => {
  it('action mode: drawProgress is 1 at frame 0 and action starts immediately', () => {
    const t = iconTimeline(0, FPS, props({ animation: "action" }), timings());
    expect(t.drawProgress).toBe(1);
    expect(t.actionFrame).toBe(0);
    expect(t.actionProgress).toBe(0);
  });

  it("draw mode: action never progresses", () => {
    const late = iconTimeline(100, FPS, props({ animation: "draw" }), timings());
    expect(late.drawProgress).toBe(1);
    expect(late.actionProgress).toBe(0);
    expect(late.cycleIndex).toBe(0);
  });

  it("both mode: action is gated behind draw + delay", () => {
    const before = iconTimeline(15, FPS, props({ animation: "both" }), timings());
    expect(before.actionFrame).toBeLessThan(0);
    expect(before.actionProgress).toBe(0);

    const atStart = iconTimeline(16, FPS, props({ animation: "both" }), timings());
    expect(atStart.actionFrame).toBe(0);
    expect(atStart.actionProgress).toBe(0);
  });
});

describe("iconTimeline non-loop action", () => {
  it("progresses linearly then freezes at 1", () => {
    const half = iconTimeline(16 + 10, FPS, props(), timings());
    expect(half.actionProgress).toBeCloseTo(0.5, 6);
    const done = iconTimeline(16 + 20, FPS, props(), timings());
    expect(done.actionProgress).toBe(1);
    const past = iconTimeline(16 + 60, FPS, props(), timings());
    expect(past.actionProgress).toBe(1);
    expect(past.cycleIndex).toBe(0);
  });
});

describe("iconTimeline loop action", () => {
  it("wraps actionProgress and increments cycleIndex", () => {
    const opts = props({ loop: true });
    const start = iconTimeline(16, FPS, opts, timings());
    expect(start.cycleIndex).toBe(0);
    expect(start.actionProgress).toBe(0);

    const mid = iconTimeline(16 + 10, FPS, opts, timings());
    expect(mid.cycleIndex).toBe(0);
    expect(mid.actionProgress).toBeCloseTo(0.5, 6);

    const wrap = iconTimeline(16 + 20, FPS, opts, timings());
    expect(wrap.cycleIndex).toBe(1);
    expect(wrap.actionProgress).toBe(0);
    expect(wrap.actionFrame).toBe(0);

    const secondMid = iconTimeline(16 + 30, FPS, opts, timings());
    expect(secondMid.cycleIndex).toBe(1);
    expect(secondMid.actionProgress).toBeCloseTo(0.5, 6);
  });

  it("timings.loop is overridden by the prop", () => {
    const t = iconTimeline(16 + 25, FPS, props({ loop: false }), timings({ loop: true }));
    expect(t.cycleIndex).toBe(0);
    expect(t.actionProgress).toBe(1);
  });
});

describe("iconTimeline defaults and guards", () => {
  it("applies the documented defaults when timings are empty", () => {
    const t = iconTimeline(14, FPS, props(), {});
    expect(t.drawProgress).toBeCloseTo(1, 6);
  });

  it("treats a zero action duration as instantly complete", () => {
    const t = iconTimeline(20, FPS, props(), timings({ actionDurationInFrames: 0 }));
    expect(t.actionProgress).toBe(1);
  });

  it("scaleIn stays within 0..1", () => {
    for (const f of [-2, 0, 7, 14, 40]) {
      const s = iconTimeline(f, FPS, props(), timings()).scaleIn;
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
    }
  });
});

describe("staggeredProgress", () => {
  it("returns the raw progress for a single stroke", () => {
    expect(staggeredProgress(0.4, 0, 1)).toBeCloseTo(0.4, 6);
    expect(staggeredProgress(1.5, 0, 1)).toBe(1);
  });

  it("tiles windows with no overlap", () => {
    expect(staggeredProgress(0.25, 0, 2, 0)).toBeCloseTo(0.5, 6);
    expect(staggeredProgress(0.25, 1, 2, 0)).toBe(0);
    expect(staggeredProgress(0.75, 1, 2, 0)).toBeCloseTo(0.5, 6);
  });

  it("makes all strokes simultaneous at full overlap", () => {
    expect(staggeredProgress(0.3, 0, 3, 1)).toBeCloseTo(0.3, 6);
    expect(staggeredProgress(0.3, 2, 3, 1)).toBeCloseTo(0.3, 6);
  });

  it("staggers earlier strokes ahead of later ones", () => {
    const first = staggeredProgress(0.5, 0, 3, 0.5);
    const last = staggeredProgress(0.5, 2, 3, 0.5);
    expect(first).toBeGreaterThan(last);
  });

  it("clamps every window to 0..1", () => {
    for (let i = 0; i < 4; i++) {
      const v = staggeredProgress(0.6, i, 4, 0.5);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe("drawnPathProps", () => {
  const d = "M0 0 L10 0 L10 10";

  it("has a fully hidden stroke at progress 0 and a closed offset at 1", () => {
    const hidden = drawnPathProps(d, 0);
    expect(hidden.strokeDasharray.length).toBeGreaterThan(0);
    const shown = drawnPathProps(d, 1);
    expect(shown.strokeDashoffset).toBeCloseTo(0, 6);
  });

  it("clamps out-of-range progress", () => {
    expect(drawnPathProps(d, 2).strokeDashoffset).toBeCloseTo(0, 6);
    expect(() => drawnPathProps(d, -1)).not.toThrow();
  });
});
