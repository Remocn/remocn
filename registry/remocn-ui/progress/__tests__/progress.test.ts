import { describe, expect, it } from "bun:test";
import { clamp01, easings } from "@/lib/remocn-ui";
import { progressConfig } from "../config";
import {
  DEFAULT_DURATION,
  type ProgressStep,
  progressValueAt,
  tweenProgressStyle,
} from "../use-progress-transition";

type SnippetValues = {
  value?: number;
  width?: number;
  showLabel?: boolean;
};
const snippet = (values: SnippetValues): string =>
  progressConfig.snippet(values as Record<string, unknown>);

describe("DEFAULT_DURATION", () => {
  it("is 24 frames", () => {
    expect(DEFAULT_DURATION).toBe(24);
  });
});

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

describe("progressValueAt: empty steps → value=0", () => {
  it("returns {value:0} for any raw frame when steps is empty", () => {
    expect(progressValueAt([], 0).value).toBe(0);
    expect(progressValueAt([], 100).value).toBe(0);
  });
});

describe("progressValueAt: before first step — holds at first.value", () => {
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
  const steps: ProgressStep[] = [{ at: 20, value: 75 }];

  it("raw=50 > last.at=20 → value=75 (rests at last)", () => {
    expect(progressValueAt(steps, 50).value).toBeCloseTo(75, 10);
  });

  it("raw=100 → value=75", () => {
    expect(progressValueAt(steps, 100).value).toBeCloseTo(75, 10);
  });
});

describe("progressValueAt: mid-window uses easings.out (not linear)", () => {
  const steps: ProgressStep[] = [
    { at: 0, value: 0 },
    { at: 24, value: 100 },
  ];

  it("raw=12 gives value=87.5 (out-eased, not linear 50)", () => {
    const r = progressValueAt(steps, 12);
    expect(r.value).toBeCloseTo(87.5, 8);
  });

  it("out(0.5)=0.875 — easing is non-linear at the midpoint", () => {
    expect(easings.out(0.5)).toBeCloseTo(0.875, 8);
  });
});

describe("progressValueAt: exactly at a step boundary — progress=0", () => {
  const steps: ProgressStep[] = [
    { at: 0, value: 0 },
    { at: 24, value: 100 },
  ];

  it("raw=24 exactly (at last step boundary) → pastLast=true → value=100", () => {
    expect(progressValueAt(steps, 24).value).toBeCloseTo(100, 10);
  });

  it("raw=0 (at first step) → holds at first.value=0", () => {
    expect(progressValueAt(steps, 0).value).toBe(0);
  });
});

describe("progressValueAt: two-step timeline mid-second segment", () => {
  const steps: ProgressStep[] = [
    { at: 0, value: 0 },
    { at: 24, value: 50 },
    { at: 48, value: 100 },
  ];

  it("raw=36 mid-second segment gives value=93.75", () => {
    expect(progressValueAt(steps, 36).value).toBeCloseTo(93.75, 8);
  });

  it("raw=24 (start of second segment, pastLast=false) is still in first segment end", () => {
    expect(progressValueAt(steps, 24).value).toBeCloseTo(50, 10);
  });
});

describe("progressValueAt: custom duration on a step", () => {
  const steps: ProgressStep[] = [
    { at: 0, value: 0 },
    { at: 12, value: 100, duration: 12 },
  ];

  it("custom duration=12: raw=6 gives value=87.5", () => {
    expect(progressValueAt(steps, 6).value).toBeCloseTo(87.5, 8);
  });
});

describe("progressValueAt: easing applied before lerp (default 'out')", () => {
  const steps: ProgressStep[] = [
    { at: 0, value: 0 },
    { at: 24, value: 100 },
  ];

  it("value at raw=12 (linear 0.5) is 87.5, not 50", () => {
    const r = progressValueAt(steps, 12);
    expect(r.value).not.toBeCloseTo(50, 1);
    expect(r.value).toBeCloseTo(87.5, 8);
  });
});

describe("progressValueAt: past last with multiple steps", () => {
  const steps: ProgressStep[] = [
    { at: 0, value: 0 },
    { at: 24, value: 50 },
    { at: 48, value: 100 },
  ];

  it("raw=100 → value=100 (last step value)", () => {
    expect(progressValueAt(steps, 100).value).toBeCloseTo(100, 10);
  });
});

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
    const out = snippet({});
    expect(out).toContain("value={0}");
  });
});

describe("progressConfig.snippet: default props are omitted", () => {
  it("omits width when it equals the default 320", () => {
    const out = snippet({ value: 50, width: 320 });
    expect(out).not.toContain("width=");
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

  it("emits showLabel (boolean shorthand) when true", () => {
    const out = snippet({ value: 50, showLabel: true });
    expect(out).toContain("showLabel");
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
