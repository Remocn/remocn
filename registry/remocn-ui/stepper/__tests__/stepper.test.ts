
import { describe, expect, it } from "bun:test";
import {
  stepperStyle,
  stepperStyleContext,
  stepCircleAt,
  connectorFillAt,
} from "../index";
import {
  tweenStepperStyle,
  stepperStyleAt,
  DEFAULT_DURATION,
  type StepperStep,
} from "../use-stepper-transition";
import { stepperConfig } from "../config";
import { defaultLightTheme, easings } from "@/lib/remocn-ui";

type SnippetValues = {
  activeIndex?: number;
};
const snippet = (values: SnippetValues): string =>
  stepperConfig.snippet(values as Record<string, unknown>);

describe("DEFAULT_DURATION", () => {
  it("is a positive number", () => {
    expect(typeof DEFAULT_DURATION).toBe("number");
    expect(DEFAULT_DURATION).toBeGreaterThan(0);
  });

  it("equals 24 (the authored value)", () => {
    expect(DEFAULT_DURATION).toBe(24);
  });
});

describe("stepperStyleContext: token mapping (light theme)", () => {
  const ctx = stepperStyleContext(defaultLightTheme);

  it("primary equals theme.primary", () => {
    expect(ctx.primary).toBe(defaultLightTheme.primary);
  });

  it("primaryFg equals theme.primaryForeground", () => {
    expect(ctx.primaryFg).toBe(defaultLightTheme.primaryForeground);
  });

  it("mutedBg equals theme.muted", () => {
    expect(ctx.mutedBg).toBe(defaultLightTheme.muted);
  });

  it("border equals theme.border", () => {
    expect(ctx.border).toBe(defaultLightTheme.border);
  });

  it("mutedFg equals theme.mutedForeground", () => {
    expect(ctx.mutedFg).toBe(defaultLightTheme.mutedForeground);
  });

  it("foreground equals theme.foreground", () => {
    expect(ctx.foreground).toBe(defaultLightTheme.foreground);
  });
});

describe("stepperStyle: identity map", () => {
  it("stepperStyle(0) returns position=0", () => {
    expect(stepperStyle(0).position).toBe(0);
  });

  it("stepperStyle(1) returns position=1", () => {
    expect(stepperStyle(1).position).toBe(1);
  });

  it("stepperStyle(2) returns position=2", () => {
    expect(stepperStyle(2).position).toBe(2);
  });

  it("stepperStyle(1.5) returns position=1.5 (float passthrough)", () => {
    expect(stepperStyle(1.5).position).toBe(1.5);
  });
});

describe("stepCircleAt: position=0 (first step active, rest future)", () => {
  it("step 0: fill=0, checkDraw=0, active=true", () => {
    const r = stepCircleAt(0, 0);
    expect(r.fill).toBe(0);
    expect(r.checkDraw).toBe(0);
    expect(r.active).toBe(true);
  });

  it("step 1: fill=0, checkDraw=0, active=false (future)", () => {
    const r = stepCircleAt(1, 0);
    expect(r.fill).toBe(0);
    expect(r.checkDraw).toBe(0);
    expect(r.active).toBe(false);
  });

  it("step 2: fill=0, checkDraw=0, active=false (future)", () => {
    const r = stepCircleAt(2, 0);
    expect(r.fill).toBe(0);
    expect(r.checkDraw).toBe(0);
    expect(r.active).toBe(false);
  });
});

describe("stepCircleAt: position=0.5 (step 0 mid-fill, still active)", () => {
  it("step 0: fill=0.5, checkDraw=0.5, active=true", () => {
    const r = stepCircleAt(0, 0.5);
    expect(r.fill).toBeCloseTo(0.5, 10);
    expect(r.checkDraw).toBeCloseTo(0.5, 10);
    expect(r.active).toBe(true);
  });

  it("step 1: fill=0, checkDraw=0, active=false", () => {
    const r = stepCircleAt(1, 0.5);
    expect(r.fill).toBe(0);
    expect(r.checkDraw).toBe(0);
    expect(r.active).toBe(false);
  });
});

describe("stepCircleAt: position=1 (step 0 completed, step 1 active)", () => {
  it("step 0: fill=1, checkDraw=1, active=false (completed)", () => {
    const r = stepCircleAt(0, 1);
    expect(r.fill).toBe(1);
    expect(r.checkDraw).toBe(1);
    expect(r.active).toBe(false);
  });

  it("step 1: fill=0, checkDraw=0, active=true", () => {
    const r = stepCircleAt(1, 1);
    expect(r.fill).toBe(0);
    expect(r.checkDraw).toBe(0);
    expect(r.active).toBe(true);
  });

  it("step 2: fill=0, checkDraw=0, active=false (future)", () => {
    const r = stepCircleAt(2, 1);
    expect(r.fill).toBe(0);
    expect(r.checkDraw).toBe(0);
    expect(r.active).toBe(false);
  });
});

describe("stepCircleAt: position=1.5 (step 0 completed, step 1 mid-fill)", () => {
  it("step 0: fill=1, checkDraw=1, active=false (completed)", () => {
    const r = stepCircleAt(0, 1.5);
    expect(r.fill).toBe(1);
    expect(r.checkDraw).toBe(1);
    expect(r.active).toBe(false);
  });

  it("step 1: fill=0.5, checkDraw=0.5, active=true", () => {
    const r = stepCircleAt(1, 1.5);
    expect(r.fill).toBeCloseTo(0.5, 10);
    expect(r.checkDraw).toBeCloseTo(0.5, 10);
    expect(r.active).toBe(true);
  });

  it("step 2: fill=0, checkDraw=0, active=false (future)", () => {
    const r = stepCircleAt(2, 1.5);
    expect(r.fill).toBe(0);
    expect(r.checkDraw).toBe(0);
    expect(r.active).toBe(false);
  });
});

describe("stepCircleAt: position=2 (steps 0/1 completed, step 2 active)", () => {
  it("step 0: fill=1, checkDraw=1, active=false (completed)", () => {
    const r = stepCircleAt(0, 2);
    expect(r.fill).toBe(1);
    expect(r.checkDraw).toBe(1);
    expect(r.active).toBe(false);
  });

  it("step 1: fill=1, checkDraw=1, active=false (completed)", () => {
    const r = stepCircleAt(1, 2);
    expect(r.fill).toBe(1);
    expect(r.checkDraw).toBe(1);
    expect(r.active).toBe(false);
  });

  it("step 2: fill=0, checkDraw=0, active=true (last step reached)", () => {
    const r = stepCircleAt(2, 2);
    expect(r.fill).toBe(0);
    expect(r.checkDraw).toBe(0);
    expect(r.active).toBe(true);
  });
});

describe("stepCircleAt: fill clamps at 1 for large position", () => {
  it("step 0 at position=5 clamps fill to 1", () => {
    const r = stepCircleAt(0, 5);
    expect(r.fill).toBe(1);
    expect(r.checkDraw).toBe(1);
    expect(r.active).toBe(false);
  });
});

describe("stepCircleAt: fill clamps at 0 for negative (position - i)", () => {
  it("step 2 at position=0 clamps fill to 0 (no negative fill)", () => {
    const r = stepCircleAt(2, 0);
    expect(r.fill).toBe(0);
    expect(r.checkDraw).toBe(0);
  });
});

describe("stepCircleAt: fill and checkDraw are always equal", () => {
  for (const [i, pos] of [[0, 0], [0, 0.5], [0, 1], [1, 1.5], [2, 2]] as [number, number][]) {
    it(`i=${i} pos=${pos}: fill === checkDraw`, () => {
      const r = stepCircleAt(i, pos);
      expect(r.fill).toBeCloseTo(r.checkDraw, 10);
    });
  }
});

describe("connectorFillAt: connector between step 0 and 1", () => {
  it("position=0: fill=0 (connector empty)", () => {
    expect(connectorFillAt(0, 0)).toBe(0);
  });

  it("position=0.5: fill=0.5 (connector half full)", () => {
    expect(connectorFillAt(0, 0.5)).toBeCloseTo(0.5, 10);
  });

  it("position=1: fill=1 (connector fully filled)", () => {
    expect(connectorFillAt(0, 1)).toBe(1);
  });

  it("position=2: fill=1 (clamped, already passed)", () => {
    expect(connectorFillAt(0, 2)).toBe(1);
  });
});

describe("connectorFillAt: connector between step 1 and 2", () => {
  it("position=1: fill=0 (second connector empty)", () => {
    expect(connectorFillAt(1, 1)).toBe(0);
  });

  it("position=1.5: fill=0.5", () => {
    expect(connectorFillAt(1, 1.5)).toBeCloseTo(0.5, 10);
  });

  it("position=2: fill=1 (second connector full)", () => {
    expect(connectorFillAt(1, 2)).toBe(1);
  });
});

describe("connectorFillAt: negative result is clamped to 0", () => {
  it("connectorFillAt(2, 0) = 0 (not -2)", () => {
    expect(connectorFillAt(2, 0)).toBe(0);
  });
});

describe("tweenStepperStyle: t=0 returns value equal to a", () => {
  it("position equals a.position at t=0", () => {
    const r = tweenStepperStyle({ position: 0 }, { position: 2 }, 0);
    expect(r.position).toBeCloseTo(0, 10);
  });
});

describe("tweenStepperStyle: t=1 returns value equal to b", () => {
  it("position equals b.position at t=1", () => {
    const r = tweenStepperStyle({ position: 0 }, { position: 2 }, 1);
    expect(r.position).toBeCloseTo(2, 10);
  });
});

describe("tweenStepperStyle: t=0.5 midpoint (0 → 2)", () => {
  it("0 → 2 at t=0.5 gives position=1", () => {
    const r = tweenStepperStyle({ position: 0 }, { position: 2 }, 0.5);
    expect(r.position).toBeCloseTo(1, 10);
  });
});

describe("tweenStepperStyle: t=0.5 midpoint (1 → 0, reverse)", () => {
  it("1 → 0 at t=0.5 gives position=0.5", () => {
    const r = tweenStepperStyle({ position: 1 }, { position: 0 }, 0.5);
    expect(r.position).toBeCloseTo(0.5, 10);
  });
});

describe("tweenStepperStyle: identity (a === b)", () => {
  it("position is unchanged when both endpoints are the same", () => {
    const r = tweenStepperStyle({ position: 1 }, { position: 1 }, 0.5);
    expect(r.position).toBeCloseTo(1, 10);
  });
});

describe("tweenStepperStyle: t=0.25 quarter-point", () => {
  it("0 → 2 at t=0.25 gives position=0.5", () => {
    const r = tweenStepperStyle({ position: 0 }, { position: 2 }, 0.25);
    expect(r.position).toBeCloseTo(0.5, 10);
  });
});

describe("stepperStyleAt: empty steps → position=0", () => {
  it("returns {position:0} for any raw frame when steps is empty", () => {
    expect(stepperStyleAt([], 0).position).toBe(0);
    expect(stepperStyleAt([], 100).position).toBe(0);
  });
});

describe("stepperStyleAt: before first step — holds at first.index", () => {
  const steps: StepperStep[] = [{ at: 30, index: 1 }];

  it("raw=0 < first.at=30 → holds at first.index=1", () => {
    expect(stepperStyleAt(steps, 0).position).toBe(1);
  });

  it("raw=30 = first.at=30 → still holds at first.index=1 (raw <= first.at)", () => {
    expect(stepperStyleAt(steps, 30).position).toBe(1);
  });

  it("raw=29 → holds at first.index=1", () => {
    expect(stepperStyleAt(steps, 29).position).toBe(1);
  });
});

describe("stepperStyleAt: past last step — rests at last.index", () => {
  const steps: StepperStep[] = [{ at: 0, index: 0 }, { at: 24, index: 1 }];

  it("raw=50 past last.at=24 → position=1 (last index)", () => {
    expect(stepperStyleAt(steps, 50).position).toBeCloseTo(1, 10);
  });

  it("raw=100 → position=1", () => {
    expect(stepperStyleAt(steps, 100).position).toBeCloseTo(1, 10);
  });
});

describe("stepperStyleAt: mid-window uses easings.out (non-linear)", () => {
  const steps: StepperStep[] = [{ at: 0, index: 0 }, { at: 24, index: 1 }];

  it("raw=12 gives position=0.875 (out-eased, not linear 0.5)", () => {
    expect(stepperStyleAt(steps, 12).position).toBeCloseTo(0.875, 8);
  });

  it("out(0.5) = 0.875 — confirms easing is non-linear at midpoint", () => {
    expect(easings.out(0.5)).toBeCloseTo(0.875, 8);
  });

  it("value at raw=12 is 0.875, NOT 0.5 (rejects linear hypothesis)", () => {
    const r = stepperStyleAt(steps, 12);
    expect(r.position).not.toBeCloseTo(0.5, 1);
    expect(r.position).toBeCloseTo(0.875, 8);
  });
});

describe("stepperStyleAt: at last step boundary — pastLast → t=1", () => {
  const steps: StepperStep[] = [{ at: 0, index: 0 }, { at: 24, index: 1 }];

  it("raw=24 exactly at last step → position=1", () => {
    expect(stepperStyleAt(steps, 24).position).toBeCloseTo(1, 10);
  });
});

describe("stepperStyleAt: two-step multi-segment timeline", () => {
  const steps: StepperStep[] = [
    { at: 0, index: 0 },
    { at: 24, index: 1 },
    { at: 48, index: 2 },
  ];

  it("raw=36 mid-second segment gives position=1.875", () => {
    expect(stepperStyleAt(steps, 36).position).toBeCloseTo(1.875, 8);
  });

  it("raw=24 (start of second segment boundary) → pastLast=false, t=out(0)=0 → position=1", () => {
    expect(stepperStyleAt(steps, 24).position).toBeCloseTo(1, 10);
  });
});

describe("stepperStyleAt: custom duration on a step", () => {
  const steps: StepperStep[] = [{ at: 0, index: 0 }, { at: 12, index: 1, duration: 12 }];

  it("custom duration=12: raw=6 gives position=0.875", () => {
    expect(stepperStyleAt(steps, 6).position).toBeCloseTo(0.875, 8);
  });
});

describe("stepperStyleAt: past last with three steps", () => {
  const steps: StepperStep[] = [
    { at: 0, index: 0 },
    { at: 24, index: 1 },
    { at: 48, index: 2 },
  ];

  it("raw=100 past last → position=2 (last step index)", () => {
    expect(stepperStyleAt(steps, 100).position).toBeCloseTo(2, 10);
  });
});

describe("stepperStyleAt: single-step timeline (no from step)", () => {
  const steps: StepperStep[] = [{ at: 0, index: 1 }];

  it("raw=0 (at first.at) → holds at position=1", () => {
    expect(stepperStyleAt(steps, 0).position).toBe(1);
  });

  it("raw=50 past last → pastLast=true → position=1", () => {
    expect(stepperStyleAt(steps, 50).position).toBeCloseTo(1, 10);
  });
});

describe("stepperConfig.controls.activeIndex", () => {
  it("is a number control", () => {
    expect(stepperConfig.controls.activeIndex.type).toBe("number");
  });

  it("defaults to 1 (middle step of the 3-step default)", () => {
    expect(stepperConfig.controls.activeIndex.default).toBe(1);
  });

  it("min is 0", () => {
    const ctrl = stepperConfig.controls.activeIndex;
    if (ctrl.type !== "number") throw new Error("expected number");
    expect(ctrl.min).toBe(0);
  });

  it("max is 2", () => {
    const ctrl = stepperConfig.controls.activeIndex;
    if (ctrl.type !== "number") throw new Error("expected number");
    expect(ctrl.max).toBe(2);
  });

  it("step is 1 (integer steps only)", () => {
    const ctrl = stepperConfig.controls.activeIndex;
    if (ctrl.type !== "number") throw new Error("expected number");
    expect(ctrl.step).toBe(1);
  });
});

describe("stepperConfig.snippet: import line", () => {
  it("includes 'import { Stepper }' from the correct path", () => {
    const out = snippet({ activeIndex: 1 });
    expect(out).toContain("import { Stepper }");
    expect(out).toContain('from "@/components/remocn/stepper"');
  });
});

describe("stepperConfig.snippet: structural invariants", () => {
  it("contains a <Stepper JSX element", () => {
    expect(snippet({ activeIndex: 1 })).toContain("<Stepper");
  });

  it("ends with a self-closing />", () => {
    expect(snippet({ activeIndex: 1 }).trimEnd().endsWith("/>")).toBe(true);
  });

  it("starts with the import line", () => {
    expect(snippet({ activeIndex: 1 }).startsWith('import { Stepper }')).toBe(true);
  });
});

describe("stepperConfig.snippet: activeIndex is always emitted", () => {
  it("emits activeIndex={1} for the default value", () => {
    expect(snippet({ activeIndex: 1 })).toContain("activeIndex={1}");
  });

  it("emits activeIndex={0} when activeIndex is 0", () => {
    expect(snippet({ activeIndex: 0 })).toContain("activeIndex={0}");
  });

  it("emits activeIndex={2} when activeIndex is 2", () => {
    expect(snippet({ activeIndex: 2 })).toContain("activeIndex={2}");
  });

  it("emits activeIndex={0} when activeIndex is omitted from values (falls back to 0)", () => {
    expect(snippet({})).toContain("activeIndex={0}");
  });
});

describe("stepperConfig.snippet: steps inline literal always emitted", () => {
  it("always emits steps={[...]} inline", () => {
    const out = snippet({ activeIndex: 1 });
    expect(out).toContain("steps={");
    expect(out).toContain("Account");
    expect(out).toContain("Plan");
    expect(out).toContain("Done");
  });

  it("emits steps for every activeIndex value", () => {
    for (const i of [0, 1, 2]) {
      const out = snippet({ activeIndex: i });
      expect(out).toContain("steps={");
    }
  });
});

describe("stepperConfig.snippet: activeIndex numeric round-trip", () => {
  it("emits the correct activeIndex for 0, 1, 2", () => {
    for (const i of [0, 1, 2]) {
      expect(snippet({ activeIndex: i })).toContain(`activeIndex={${i}}`);
    }
  });
});
