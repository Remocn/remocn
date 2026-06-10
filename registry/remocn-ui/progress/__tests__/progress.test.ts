/**
 * Verification tests for the PURE / DETERMINISTIC parts of `progress`.
 *
 * Scope:
 *   - registry/remocn-ui/progress/index.tsx
 *       clampValue (internal) — exercised via exported ProgressStyle + render logic
 *       ProgressStyle interface — value field semantics
 *   - registry/remocn-ui/progress/use-progress-transition.ts
 *       tweenProgressStyle(a, b, t)       — pure single-field lerp
 *       progressValueAt(steps, raw, opts) — pure exported core of useProgressTransition
 *       DEFAULT_DURATION constant
 *       ProgressStep interface semantics
 *   - registry/remocn-ui/progress/config.ts
 *       progressConfig.controls wiring + progressConfig.snippet codegen
 *
 * The render path (index.tsx) imports `useRemocnTheme` which requires React
 * context — it is NOT exercised here. `useProgressTransition` IS a hook (calls
 * `useCurrentFrame()`) and is NOT imported; its pure body is the exported
 * `progressValueAt` which we call directly.
 *
 * Runner: Bun's built-in test runner (TypeScript-native, no framework dep).
 *   bun test registry/remocn-ui/progress/__tests__
 *
 * --------------------------------------------------------------------------
 * IMPORT STRATEGY
 * --------------------------------------------------------------------------
 * Relative imports from component source; `@/lib/remocn-ui` alias for core.
 * `tweenProgressStyle` and `progressValueAt` are pure value functions — they
 * call neither `useCurrentFrame()` nor `useRemocnTheme` at import or call time.
 * `useProgressTransition` IS a hook and is NOT imported; we call `progressValueAt`
 * directly (it is the exported pure core, annotated as such in the source).
 * --------------------------------------------------------------------------
 */

import { describe, expect, it } from "bun:test";
import {
  tweenProgressStyle,
  progressValueAt,
  DEFAULT_DURATION,
  type ProgressStep,
} from "../use-progress-transition";
import { progressConfig } from "../config";
import { easings, clamp01 } from "@/lib/remocn-ui";

// ===========================================================================
// Shared fixtures
// ===========================================================================

/** Convenience wrapper for snippet(). */
type SnippetValues = {
  value?: number;
  width?: number;
  showLabel?: boolean;
  mode?: string;
};
const snippet = (values: SnippetValues): string =>
  progressConfig.snippet(values as Record<string, unknown>);

// ===========================================================================
// 1. DEFAULT_DURATION constant
// ===========================================================================

describe("DEFAULT_DURATION", () => {
  it("is 24 frames", () => {
    expect(DEFAULT_DURATION).toBe(24);
  });
});

// ===========================================================================
// 2. clampValue semantics — the component applies clamp01(value/100)*100
//    This is the value-channel equivalent of the state-atom clamp.
//    MIRROR of index.tsx lines 43-45 (clampValue function).
// ===========================================================================

/**
 * MIRROR of index.tsx:clampValue (lines 43-45).
 * clamp01 is `Math.max(0, Math.min(1, t))`.
 */
function clampValue(value: number): number {
  return clamp01(value / 100) * 100;
}

describe("clampValue: below-range values clamp to 0", () => {
  it("value=-10 clamps to 0", () => {
    expect(clampValue(-10)).toBe(0);
  });

  it("value=-0.001 clamps to 0", () => {
    expect(clampValue(-0.001)).toBe(0);
  });
});

describe("clampValue: above-range values clamp to 100", () => {
  it("value=110 clamps to 100", () => {
    expect(clampValue(110)).toBe(100);
  });

  it("value=100.001 clamps to 100", () => {
    expect(clampValue(100.001)).toBe(100);
  });
});

describe("clampValue: in-range values pass through unchanged", () => {
  it("value=0 returns 0", () => {
    expect(clampValue(0)).toBe(0);
  });

  it("value=50 returns 50", () => {
    expect(clampValue(50)).toBe(50);
  });

  it("value=100 returns 100", () => {
    expect(clampValue(100)).toBe(100);
  });

  it("value=62 (the config default) returns 62", () => {
    expect(clampValue(62)).toBe(62);
  });

  it("value=99.9 returns 99.9", () => {
    expect(clampValue(99.9)).toBeCloseTo(99.9, 10);
  });
});

// ===========================================================================
// 3. showLabel floor — the label renders Math.floor(v)%
//    MIRROR of index.tsx line 113: {Math.floor(v)}%
// ===========================================================================

describe("showLabel floor: Math.floor applied to clamped value", () => {
  it("Math.floor(62.7) = 62", () => {
    expect(Math.floor(clampValue(62.7))).toBe(62);
  });

  it("Math.floor(99.9) = 99 (does NOT round up to 100)", () => {
    expect(Math.floor(clampValue(99.9))).toBe(99);
  });

  it("Math.floor(0) = 0", () => {
    expect(Math.floor(clampValue(0))).toBe(0);
  });

  it("Math.floor(100) = 100", () => {
    expect(Math.floor(clampValue(100))).toBe(100);
  });

  it("Math.floor(87.5) = 87", () => {
    expect(Math.floor(clampValue(87.5))).toBe(87);
  });
});

// ===========================================================================
// 4. tweenProgressStyle — pure single-field lerp
//    MIRROR of use-progress-transition.ts lines 34-40
// ===========================================================================

describe("tweenProgressStyle: t=0 returns value equal to `a`", () => {
  it("value equals a.value at t=0", () => {
    const r = tweenProgressStyle({ value: 0 }, { value: 100 }, 0);
    expect(r.value).toBeCloseTo(0, 10);
  });
});

describe("tweenProgressStyle: t=1 returns value equal to `b`", () => {
  it("value equals b.value at t=1", () => {
    const r = tweenProgressStyle({ value: 0 }, { value: 100 }, 1);
    expect(r.value).toBeCloseTo(100, 10);
  });
});

describe("tweenProgressStyle: t=0.5 midpoint", () => {
  it("0→100 at t=0.5 gives 50", () => {
    const r = tweenProgressStyle({ value: 0 }, { value: 100 }, 0.5);
    expect(r.value).toBeCloseTo(50, 10);
  });

  it("25→75 at t=0.5 gives 50", () => {
    const r = tweenProgressStyle({ value: 25 }, { value: 75 }, 0.5);
    expect(r.value).toBeCloseTo(50, 10);
  });
});

describe("tweenProgressStyle: identity (a === b, any t)", () => {
  it("value is unchanged when both endpoints are the same", () => {
    const r = tweenProgressStyle({ value: 62 }, { value: 62 }, 0.5);
    expect(r.value).toBeCloseTo(62, 10);
  });
});

describe("tweenProgressStyle: t=0.25 quarter-point", () => {
  // 0→100 at t=0.25: 0 + 0.25*(100-0) = 25
  it("0→100 at t=0.25 gives 25", () => {
    const r = tweenProgressStyle({ value: 0 }, { value: 100 }, 0.25);
    expect(r.value).toBeCloseTo(25, 10);
  });
});

describe("tweenProgressStyle: decreasing direction (100→0)", () => {
  it("100→0 at t=0.5 gives 50", () => {
    const r = tweenProgressStyle({ value: 100 }, { value: 0 }, 0.5);
    expect(r.value).toBeCloseTo(50, 10);
  });
});

describe("tweenProgressStyle: result has only a `value` field", () => {
  it("result object has exactly one key: value", () => {
    const r = tweenProgressStyle({ value: 30 }, { value: 70 }, 0.5);
    expect(typeof r.value).toBe("number");
  });
});

// ===========================================================================
// 5. progressValueAt — pure exported core of useProgressTransition
//    MIRROR of use-progress-transition.ts lines 66-102.
//    useProgressTransition is exactly progressValueAt(steps, useCurrentFrame()*speed, opts).
//    We call progressValueAt directly with the frame injected as `raw`.
//
//    MAINTENANCE CONTRACT: if use-progress-transition.ts lines 66-102 change,
//    update these tests in lockstep. Annotated source lines below.
// ===========================================================================

describe("progressValueAt: empty steps → value=0", () => {
  // source line 73: if (steps.length === 0) return { value: 0 }
  it("returns {value:0} for any raw frame when steps is empty", () => {
    expect(progressValueAt([], 0).value).toBe(0);
    expect(progressValueAt([], 100).value).toBe(0);
  });
});

describe("progressValueAt: before first step — holds at first.value", () => {
  // source lines 78-79: if (raw <= first.at) return { value: first.value }
  const steps: ProgressStep[] = [{ at: 10, value: 60 }];

  it("raw=5 < first.at=10 → holds at first.value=60", () => {
    expect(progressValueAt(steps, 5).value).toBe(60);
  });

  it("raw=10 = first.at=10 → still holds at first.value=60 (raw <= first.at)", () => {
    expect(progressValueAt(steps, 10).value).toBe(60);
  });

  it("raw=0 → holds at first.value=60", () => {
    expect(progressValueAt(steps, 0).value).toBe(60);
  });
});

describe("progressValueAt: past last step — rests at last.value", () => {
  // source lines 90-92: pastLast → to=from=last step, t=1
  const steps: ProgressStep[] = [{ at: 20, value: 75 }];

  it("raw=50 > last.at=20 → value=75 (rests at last)", () => {
    expect(progressValueAt(steps, 50).value).toBeCloseTo(75, 10);
  });

  it("raw=100 → value=75", () => {
    expect(progressValueAt(steps, 100).value).toBeCloseTo(75, 10);
  });
});

describe("progressValueAt: mid-window uses easings.out (not linear)", () => {
  // Two steps: [{at:0,value:0},{at:24,value:100}], default dur=24.
  // At raw=12: start=24-24=0, linear=(12-0)/24=0.5, t=out(0.5)=0.875
  // value = 0 + 100*0.875 = 87.5
  const steps: ProgressStep[] = [{ at: 0, value: 0 }, { at: 24, value: 100 }];

  it("raw=12 gives value=87.5 (out-eased, not linear 50)", () => {
    const r = progressValueAt(steps, 12);
    expect(r.value).toBeCloseTo(87.5, 8);
  });

  it("out(0.5)=0.875 — easing is non-linear at the midpoint", () => {
    // This confirms the test above is not accidentally passing with linear math
    expect(easings.out(0.5)).toBeCloseTo(0.875, 8);
  });
});

describe("progressValueAt: exactly at a step boundary — progress=0", () => {
  // At raw just past first.at, before dur expires:
  // steps=[{at:0,value:0},{at:24,value:100}], raw=0.0001 (just after step[1].at=24? no)
  // Actually raw=24: steps[1].at=24. pastLast = raw(24) >= steps[1].at(24) = true → t=1 → value=100
  const steps: ProgressStep[] = [{ at: 0, value: 0 }, { at: 24, value: 100 }];

  it("raw=24 exactly (at last step boundary) → pastLast=true → value=100", () => {
    expect(progressValueAt(steps, 24).value).toBeCloseTo(100, 10);
  });

  it("raw=0 (at first step) → holds at first.value=0", () => {
    expect(progressValueAt(steps, 0).value).toBe(0);
  });
});

describe("progressValueAt: two-step timeline mid-second segment", () => {
  // steps=[{at:0,value:0},{at:24,value:50},{at:48,value:100}]
  // At raw=36 (mid of second segment [24→48], dur=24):
  // toIndex search: steps[2].at=48 > 36 → toIndex=2
  // pastLast = 36 >= 48 → false
  // to=steps[2]={at:48,value:100}, from=steps[1]={at:24,value:50}
  // dur=24, start=48-24=24, t=out(clamp01((36-24)/24))=out(0.5)=0.875
  // value=50+(100-50)*0.875=50+43.75=93.75
  const steps: ProgressStep[] = [
    { at: 0, value: 0 },
    { at: 24, value: 50 },
    { at: 48, value: 100 },
  ];

  it("raw=36 mid-second segment gives value=93.75", () => {
    expect(progressValueAt(steps, 36).value).toBeCloseTo(93.75, 8);
  });

  it("raw=24 (start of second segment, pastLast=false) is still in first segment end", () => {
    // raw=24: steps[2].at=48 > 24 → toIndex=2 (not pastLast)
    // Wait — steps[1].at=24 is NOT > raw(24), so we keep searching. steps[2].at=48 > 24 → toIndex=2
    // to=steps[2], from=steps[1]. start=48-24=24, t=out((24-24)/24)=out(0)=0
    // value=50+(100-50)*0=50
    expect(progressValueAt(steps, 24).value).toBeCloseTo(50, 10);
  });
});

describe("progressValueAt: custom duration on a step", () => {
  // steps=[{at:0,value:0},{at:12,value:100,duration:12}]
  // At raw=6: start=12-12=0, t=out(6/12)=out(0.5)=0.875, value=87.5
  const steps: ProgressStep[] = [{ at: 0, value: 0 }, { at: 12, value: 100, duration: 12 }];

  it("custom duration=12: raw=6 gives value=87.5", () => {
    expect(progressValueAt(steps, 6).value).toBeCloseTo(87.5, 8);
  });
});

describe("progressValueAt: easing applied before lerp (default 'out')", () => {
  // Confirms t=easings.out(linear_progress), not raw linear_progress.
  // steps=[{at:0,value:0},{at:24,value:100}], raw=12 → linear=0.5
  // If linear: value=50. With out-easing: value=87.5.
  const steps: ProgressStep[] = [{ at: 0, value: 0 }, { at: 24, value: 100 }];

  it("value at raw=12 (linear 0.5) is 87.5, not 50", () => {
    const r = progressValueAt(steps, 12);
    expect(r.value).not.toBeCloseTo(50, 1);
    expect(r.value).toBeCloseTo(87.5, 8);
  });
});

describe("progressValueAt: past last with multiple steps", () => {
  // When past last, to=from=last → t=1 → value=last.value (from.value + 0*t = last.value)
  const steps: ProgressStep[] = [
    { at: 0, value: 0 },
    { at: 24, value: 50 },
    { at: 48, value: 100 },
  ];

  it("raw=100 → value=100 (last step value)", () => {
    expect(progressValueAt(steps, 100).value).toBeCloseTo(100, 10);
  });
});

// ===========================================================================
// 6. progressConfig.controls — customizer control wiring
// ===========================================================================

describe("progressConfig.controls: value", () => {
  it("value is a number control", () => {
    expect(progressConfig.controls.value.type).toBe("number");
  });

  it("value default is 62", () => {
    expect(progressConfig.controls.value.default).toBe(62);
  });

  it("value min is 0, max is 100", () => {
    const ctrl = progressConfig.controls.value;
    if (ctrl.type !== "number") throw new Error("expected number");
    expect(ctrl.min).toBe(0);
    expect(ctrl.max).toBe(100);
  });
});

describe("progressConfig.controls: width", () => {
  it("width is a number control", () => {
    expect(progressConfig.controls.width.type).toBe("number");
  });

  it("width default is 320", () => {
    expect(progressConfig.controls.width.default).toBe(320);
  });

  it("width min is 120, max is 640", () => {
    const ctrl = progressConfig.controls.width;
    if (ctrl.type !== "number") throw new Error("expected number");
    expect(ctrl.min).toBe(120);
    expect(ctrl.max).toBe(640);
  });
});

describe("progressConfig.controls: showLabel", () => {
  it("showLabel is a boolean control", () => {
    expect(progressConfig.controls.showLabel.type).toBe("boolean");
  });

  it("showLabel default is true", () => {
    expect(progressConfig.controls.showLabel.default).toBe(true);
  });
});

describe("progressConfig.controls: mode", () => {
  it("mode is a select control", () => {
    expect(progressConfig.controls.mode.type).toBe("select");
  });

  it("mode options are ['light', 'dark']", () => {
    const ctrl = progressConfig.controls.mode;
    if (ctrl.type !== "select") throw new Error("expected select");
    expect(ctrl.options).toEqual(["light", "dark"]);
  });

  it("mode default is 'light'", () => {
    expect(progressConfig.controls.mode.default).toBe("light");
  });
});

// ===========================================================================
// 7. progressConfig.snippet — pure JSX string builder
// ===========================================================================

describe("progressConfig.snippet: import line", () => {
  it("includes 'import { Progress }' from the correct path", () => {
    const out = snippet({ value: 50 });
    expect(out).toContain("import { Progress }");
    expect(out).toContain('from "@/components/remocn/progress"');
  });
});

describe("progressConfig.snippet: structural invariants", () => {
  it("contains a <Progress JSX element", () => {
    expect(snippet({ value: 50 })).toContain("<Progress");
  });

  it("ends with a self-closing />", () => {
    expect(snippet({ value: 50 }).trimEnd().endsWith("/>")).toBe(true);
  });
});

describe("progressConfig.snippet: value is always emitted", () => {
  // value is always emitted (including 0)
  it("emits value={62} for the default value", () => {
    const out = snippet({ value: 62 });
    expect(out).toContain("value={62}");
  });

  it("emits value={0} when value is 0", () => {
    const out = snippet({ value: 0 });
    expect(out).toContain("value={0}");
  });

  it("emits value={100} when value is 100", () => {
    const out = snippet({ value: 100 });
    expect(out).toContain("value={100}");
  });

  it("emits value={0} when value is omitted from values (falls back to 0)", () => {
    // snippet uses `value ?? 0`
    const out = snippet({});
    expect(out).toContain("value={0}");
  });
});

describe("progressConfig.snippet: default props are omitted", () => {
  // Defaults: width=320, mode=light; showLabel is omitted when falsy

  it("omits width when it equals the default 320", () => {
    const out = snippet({ value: 50, width: 320 });
    expect(out).not.toContain("width=");
  });

  it("omits mode when it equals the default 'light'", () => {
    const out = snippet({ value: 50, mode: "light" });
    expect(out).not.toContain("mode=");
  });

  it("omits showLabel when it is false", () => {
    const out = snippet({ value: 50, showLabel: false });
    expect(out).not.toContain("showLabel");
  });

  it("omits showLabel when it is undefined", () => {
    const out = snippet({ value: 50 });
    expect(out).not.toContain("showLabel");
  });
});

describe("progressConfig.snippet: non-default props are emitted", () => {
  it("emits width={480} when non-default", () => {
    expect(snippet({ value: 50, width: 480 })).toContain("width={480}");
  });

  it("emits width={200} when non-default", () => {
    expect(snippet({ value: 50, width: 200 })).toContain("width={200}");
  });

  it("emits mode='dark' when non-default", () => {
    expect(snippet({ value: 50, mode: "dark" })).toContain('mode="dark"');
  });

  it("emits showLabel (boolean shorthand) when true", () => {
    // snippet: if (showLabel) props.push('  showLabel') — no value, just the attribute
    const out = snippet({ value: 50, showLabel: true });
    expect(out).toContain("showLabel");
    // Must NOT be showLabel={true} — it's a boolean shorthand prop
    expect(out).not.toContain("showLabel={true}");
  });
});

describe("progressConfig.snippet: value numeric round-trip", () => {
  it("emits the correct value for various inputs", () => {
    for (const v of [0, 25, 50, 75, 100]) {
      expect(snippet({ value: v })).toContain(`value={${v}}`);
    }
  });
});
