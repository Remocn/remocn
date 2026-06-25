
import { describe, expect, it } from "bun:test";
import {
  sliderThumbStyle,
  sliderStyleContext,
  type SliderThumbState,
} from "../index";
import {
  tweenSliderStyle,
  sliderStyleAt,
  DEFAULT_DURATION,
  type SliderStep,
} from "../use-slider-transition";
import { sliderConfig } from "../config";
import { defaultLightTheme, defaultDarkTheme, easings, clamp01 } from "@/lib/remocn-ui";

const VALID_THUMB_STATES: readonly SliderThumbState[] = ["idle", "hover", "press"];

type SnippetValues = {
  value?: number;
  thumbState?: string;
  width?: number;
  showValue?: boolean;
};
const snippet = (values: SnippetValues): string =>
  sliderConfig.snippet(values as Record<string, unknown>);

describe("DEFAULT_DURATION", () => {
  it("is 18 frames", () => {
    expect(DEFAULT_DURATION).toBe(18);
  });
});

function clampValue(value: number): number {
  return clamp01(value / 100) * 100;
}

describe("clampValue: below-range values clamp to 0", () => {
  it("value=-5 clamps to 0", () => {
    expect(clampValue(-5)).toBe(0);
  });

  it("value=-0.001 clamps to 0", () => {
    expect(clampValue(-0.001)).toBe(0);
  });
});

describe("clampValue: above-range values clamp to 100", () => {
  it("value=150 clamps to 100", () => {
    expect(clampValue(150)).toBe(100);
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

  it("value=40 (the config default) returns 40", () => {
    expect(clampValue(40)).toBe(40);
  });
});

describe("showValue label: Math.round applied to clamped value", () => {
  it("Math.round(62.4) = 62", () => {
    expect(Math.round(clampValue(62.4))).toBe(62);
  });

  it("Math.round(62.5) = 63 (rounds up at .5)", () => {
    expect(Math.round(clampValue(62.5))).toBe(63);
  });

  it("Math.round(99.9) = 100 (rounds up near max)", () => {
    expect(Math.round(clampValue(99.9))).toBe(100);
  });

  it("Math.round(0) = 0", () => {
    expect(Math.round(clampValue(0))).toBe(0);
  });
});

describe("sliderThumbStyle: idle state — default thumb", () => {
  const s = sliderThumbStyle("idle");

  it("thumbScale is 1 (no zoom)", () => {
    expect(s.thumbScale).toBe(1);
  });

  it("ringOpacity is 0 (ring hidden)", () => {
    expect(s.ringOpacity).toBe(0);
  });
});

describe("sliderThumbStyle: hover state — grown thumb + visible ring", () => {
  const s = sliderThumbStyle("hover");

  it("thumbScale is 1.1", () => {
    expect(s.thumbScale).toBeCloseTo(1.1, 10);
  });

  it("ringOpacity is 1 (ring fully visible)", () => {
    expect(s.ringOpacity).toBe(1);
  });
});

describe("sliderThumbStyle: press state — larger thumb + visible ring", () => {
  const s = sliderThumbStyle("press");

  it("thumbScale is 1.15 (larger than hover)", () => {
    expect(s.thumbScale).toBeCloseTo(1.15, 10);
  });

  it("ringOpacity is 1 (ring fully visible)", () => {
    expect(s.ringOpacity).toBe(1);
  });
});

describe("sliderThumbStyle: press thumbScale > hover thumbScale > idle", () => {
  it("press > hover > idle thumbScale ordering", () => {
    expect(sliderThumbStyle("press").thumbScale).toBeGreaterThan(sliderThumbStyle("hover").thumbScale);
    expect(sliderThumbStyle("hover").thumbScale).toBeGreaterThan(sliderThumbStyle("idle").thumbScale);
  });
});

describe("sliderThumbStyle: hover and press have identical ringOpacity", () => {
  it("hover.ringOpacity === press.ringOpacity === 1", () => {
    expect(sliderThumbStyle("hover").ringOpacity).toBe(1);
    expect(sliderThumbStyle("press").ringOpacity).toBe(1);
  });
});

describe("sliderThumbStyle: every state returns numeric fields", () => {
  it("every thumbState produces numeric thumbScale and ringOpacity", () => {
    for (const state of VALID_THUMB_STATES) {
      const s = sliderThumbStyle(state);
      expect(typeof s.thumbScale).toBe("number");
      expect(typeof s.ringOpacity).toBe("number");
    }
  });
});

describe("sliderStyleContext: light theme", () => {
  const ctx = sliderStyleContext(defaultLightTheme);

  it("track is a non-empty string (mixOklch of theme.input + theme.background, bg-input/90)", () => {
    expect(typeof ctx.track).toBe("string");
    expect(ctx.track.length).toBeGreaterThan(0);
  });

  it("range equals theme.primary", () => {
    expect(ctx.range).toBe(defaultLightTheme.primary);
  });

  it("thumbBg is the literal white 'oklch(1 0 0)' (shadcn white thumb, theme-independent)", () => {
    expect(ctx.thumbBg).toBe("oklch(1 0 0)");
  });

  it("thumbRing is the literal hairline 'rgba(0, 0, 0, 0.1)' (theme-independent)", () => {
    expect(ctx.thumbRing).toBe("rgba(0, 0, 0, 0.1)");
  });

  it("ring is a non-empty string (mixOklch blend of theme.ring+background, ring-ring/30)", () => {
    expect(typeof ctx.ring).toBe("string");
    expect(ctx.ring.length).toBeGreaterThan(0);
  });

  it("valueText equals theme.foreground", () => {
    expect(ctx.valueText).toBe(defaultLightTheme.foreground);
  });
});

describe("sliderStyleContext: thumbBg and thumbRing are theme-independent (always white/black)", () => {
  const ctxLight = sliderStyleContext(defaultLightTheme);
  const ctxDark = sliderStyleContext(defaultDarkTheme);

  it("thumbBg is 'oklch(1 0 0)' in both light and dark themes", () => {
    expect(ctxLight.thumbBg).toBe("oklch(1 0 0)");
    expect(ctxDark.thumbBg).toBe("oklch(1 0 0)");
  });

  it("thumbRing is 'rgba(0, 0, 0, 0.1)' in both light and dark themes", () => {
    expect(ctxLight.thumbRing).toBe("rgba(0, 0, 0, 0.1)");
    expect(ctxDark.thumbRing).toBe("rgba(0, 0, 0, 0.1)");
  });
});

describe("sliderStyleContext: dark theme differs from light on theme-derived fields", () => {
  const ctxLight = sliderStyleContext(defaultLightTheme);
  const ctxDark = sliderStyleContext(defaultDarkTheme);

  it("ring color differs between light and dark themes (uses theme.ring token)", () => {
    expect(ctxLight.ring).not.toBe(ctxDark.ring);
  });

  it("track differs between light and dark themes (uses theme.input token)", () => {
    expect(ctxLight.track).not.toBe(ctxDark.track);
  });
});

describe("sliderStyleContext: all fields are non-empty strings", () => {
  it("every SliderStyleContext field is a non-empty string for light theme", () => {
    const ctx = sliderStyleContext(defaultLightTheme);
    for (const key of ["track", "range", "thumbBg", "thumbRing", "ring", "valueText"] as const) {
      expect(typeof ctx[key]).toBe("string");
      expect(ctx[key].length).toBeGreaterThan(0);
    }
  });
});

describe("tweenSliderStyle: t=0 returns values equal to `a`", () => {
  const a = { value: 0,   thumbScale: 1,   ringOpacity: 0 };
  const b = { value: 100, thumbScale: 1.1, ringOpacity: 1 };
  const r = tweenSliderStyle(a, b, 0);

  it("value equals a.value at t=0", () => {
    expect(r.value).toBeCloseTo(a.value, 10);
  });
  it("thumbScale equals a.thumbScale at t=0", () => {
    expect(r.thumbScale).toBeCloseTo(a.thumbScale, 10);
  });
  it("ringOpacity equals a.ringOpacity at t=0", () => {
    expect(r.ringOpacity).toBeCloseTo(a.ringOpacity, 10);
  });
});

describe("tweenSliderStyle: t=1 returns values equal to `b`", () => {
  const a = { value: 0,   thumbScale: 1,   ringOpacity: 0 };
  const b = { value: 100, thumbScale: 1.1, ringOpacity: 1 };
  const r = tweenSliderStyle(a, b, 1);

  it("value equals b.value at t=1", () => {
    expect(r.value).toBeCloseTo(b.value, 10);
  });
  it("thumbScale equals b.thumbScale at t=1", () => {
    expect(r.thumbScale).toBeCloseTo(b.thumbScale, 10);
  });
  it("ringOpacity equals b.ringOpacity at t=1", () => {
    expect(r.ringOpacity).toBeCloseTo(b.ringOpacity, 10);
  });
});

describe("tweenSliderStyle: t=0.5 midpoint", () => {
  const a = { value: 0,   thumbScale: 1,   ringOpacity: 0 };
  const b = { value: 100, thumbScale: 1.1, ringOpacity: 1 };
  const r = tweenSliderStyle(a, b, 0.5);

  it("value midpoint: 0→100 gives 50", () => {
    expect(r.value).toBeCloseTo(50, 10);
  });
  it("thumbScale midpoint: 1→1.1 gives 1.05", () => {
    expect(r.thumbScale).toBeCloseTo(1.05, 10);
  });
  it("ringOpacity midpoint: 0→1 gives 0.5", () => {
    expect(r.ringOpacity).toBeCloseTo(0.5, 10);
  });
});

describe("tweenSliderStyle: identity (a === b, any t)", () => {
  const s = { value: 62, thumbScale: 1, ringOpacity: 0 };

  it("all fields unchanged when both endpoints are the same", () => {
    const r = tweenSliderStyle(s, s, 0.5);
    expect(r.value).toBeCloseTo(s.value, 10);
    expect(r.thumbScale).toBeCloseTo(s.thumbScale, 10);
    expect(r.ringOpacity).toBeCloseTo(s.ringOpacity, 10);
  });
});

describe("tweenSliderStyle: idle → press thumb channel", () => {
  const a = { value: 0, ...sliderThumbStyle("idle") };
  const b = { value: 0, ...sliderThumbStyle("press") };
  const r = tweenSliderStyle(a, b, 0.5);

  it("thumbScale midpoint idle→press: (1+1.15)/2 = 1.075", () => {
    expect(r.thumbScale).toBeCloseTo(1.075, 10);
  });
  it("ringOpacity midpoint idle→press: 0.5", () => {
    expect(r.ringOpacity).toBeCloseTo(0.5, 10);
  });
});

describe("sliderStyleAt: empty steps → value=0, thumb=idle", () => {
  it("empty steps returns {value:0, thumbScale:1, ringOpacity:0}", () => {
    const r = sliderStyleAt([], 0);
    expect(r.value).toBe(0);
    expect(r.thumbScale).toBe(sliderThumbStyle("idle").thumbScale);
    expect(r.ringOpacity).toBe(sliderThumbStyle("idle").ringOpacity);
  });
});

describe("sliderStyleAt: before first value step — holds at first.value", () => {
  const steps: SliderStep[] = [{ at: 10, value: 60 }];

  it("raw=5 < first.at=10 → holds at first.value=60", () => {
    expect(sliderStyleAt(steps, 5).value).toBe(60);
  });

  it("raw=10 = first.at → holds at first.value=60 (raw <= first.at)", () => {
    expect(sliderStyleAt(steps, 10).value).toBe(60);
  });
});

describe("sliderStyleAt: before first thumb step — holds at first.thumbState preset", () => {
  const steps: SliderStep[] = [{ at: 10, thumbState: "hover" }];

  it("raw=5 holds at hover preset (thumbScale=1.1)", () => {
    expect(sliderStyleAt(steps, 5).thumbScale).toBeCloseTo(1.1, 10);
  });
});

describe("sliderStyleAt: past last value step — rests at last.value", () => {
  const steps: SliderStep[] = [{ at: 0, value: 0 }, { at: 18, value: 75 }];

  it("raw=50 → value=75 (rests at last)", () => {
    expect(sliderStyleAt(steps, 50).value).toBeCloseTo(75, 10);
  });
});

describe("sliderStyleAt: value channel mid-window uses easings.out", () => {
  const steps: SliderStep[] = [{ at: 0, value: 0 }, { at: 18, value: 100 }];

  it("value at raw=9 is 87.5 (out-eased, not linear 50)", () => {
    expect(sliderStyleAt(steps, 9).value).toBeCloseTo(87.5, 8);
  });

  it("value is NOT linear at midpoint (87.5 ≠ 50)", () => {
    const r = sliderStyleAt(steps, 9);
    expect(r.value).not.toBeCloseTo(50, 1);
  });
});

describe("sliderStyleAt: thumb channel mid-window uses easings.out", () => {
  const steps: SliderStep[] = [{ at: 0, thumbState: "idle" }, { at: 18, thumbState: "hover" }];

  it("thumbScale at raw=9 is 1.0875 (out-eased)", () => {
    expect(sliderStyleAt(steps, 9).thumbScale).toBeCloseTo(1.0875, 8);
  });

  it("ringOpacity at raw=9 is 0.875 (out-eased, not linear 0.5)", () => {
    expect(sliderStyleAt(steps, 9).ringOpacity).toBeCloseTo(0.875, 8);
  });
});

describe("sliderStyleAt: dual-channel steps fold independently", () => {
  const steps: SliderStep[] = [
    { at: 0, value: 0, thumbState: "idle" },
    { at: 18, value: 100, thumbState: "hover" },
  ];

  it("both channels are active at raw=9", () => {
    const r = sliderStyleAt(steps, 9);
    expect(r.value).toBeCloseTo(87.5, 8);
    expect(r.ringOpacity).toBeCloseTo(0.875, 8);
  });

  it("value channel at raw=18 (past last) → value=100", () => {
    expect(sliderStyleAt(steps, 18).value).toBeCloseTo(100, 10);
  });
});

describe("sliderStyleAt: channels can have different step counts", () => {
  const valueOnlySteps: SliderStep[] = [{ at: 0, value: 0 }, { at: 18, value: 100 }];

  it("thumb is idle when no thumb steps are present", () => {
    const r = sliderStyleAt(valueOnlySteps, 9);
    expect(r.thumbScale).toBe(sliderThumbStyle("idle").thumbScale);
    expect(r.ringOpacity).toBe(sliderThumbStyle("idle").ringOpacity);
  });

  const thumbOnlySteps: SliderStep[] = [{ at: 0, thumbState: "idle" }, { at: 18, thumbState: "hover" }];

  it("value is 0 when no value steps are present", () => {
    expect(sliderStyleAt(thumbOnlySteps, 9).value).toBe(0);
  });
});

describe("sliderStyleAt: past last with both channels", () => {
  const steps: SliderStep[] = [{ at: 18, value: 75, thumbState: "press" }];

  it("raw=50 → value=75, thumbScale=press.thumbScale, ringOpacity=press.ringOpacity", () => {
    const r = sliderStyleAt(steps, 50);
    expect(r.value).toBeCloseTo(75, 10);
    expect(r.thumbScale).toBeCloseTo(sliderThumbStyle("press").thumbScale, 10);
    expect(r.ringOpacity).toBeCloseTo(sliderThumbStyle("press").ringOpacity, 10);
  });
});

describe("sliderConfig.controls: value", () => {
  it("value is a number control", () => {
    expect(sliderConfig.controls.value.type).toBe("number");
  });
  it("value default is 40", () => {
    expect(sliderConfig.controls.value.default).toBe(40);
  });
  it("value min=0, max=100", () => {
    const ctrl = sliderConfig.controls.value;
    if (ctrl.type !== "number") throw new Error("expected number");
    expect(ctrl.min).toBe(0);
    expect(ctrl.max).toBe(100);
  });
});

describe("sliderConfig.controls: thumbState", () => {
  it("thumbState is a select control", () => {
    expect(sliderConfig.controls.thumbState.type).toBe("select");
  });
  it("thumbState options are ['idle', 'hover', 'press']", () => {
    const ctrl = sliderConfig.controls.thumbState;
    if (ctrl.type !== "select") throw new Error("expected select");
    expect(ctrl.options).toEqual(["idle", "hover", "press"]);
  });
  it("thumbState default is 'idle'", () => {
    expect(sliderConfig.controls.thumbState.default).toBe("idle");
  });
  it("every thumbState option is a valid SliderThumbState", () => {
    const ctrl = sliderConfig.controls.thumbState;
    if (ctrl.type !== "select") throw new Error("expected select");
    for (const opt of ctrl.options) {
      expect(VALID_THUMB_STATES).toContain(opt as SliderThumbState);
    }
  });
});

describe("sliderConfig.controls: width", () => {
  it("width is a number control with default=320", () => {
    expect(sliderConfig.controls.width.type).toBe("number");
    expect(sliderConfig.controls.width.default).toBe(320);
  });
});

describe("sliderConfig.controls: showValue", () => {
  it("showValue is a boolean control with default=true", () => {
    expect(sliderConfig.controls.showValue.type).toBe("boolean");
    expect(sliderConfig.controls.showValue.default).toBe(true);
  });
});

describe("sliderConfig.snippet: import line", () => {
  it("includes 'import { Slider }' from the correct path", () => {
    const out = snippet({ value: 40 });
    expect(out).toContain("import { Slider }");
    expect(out).toContain('from "@/components/remocn/slider"');
  });
});

describe("sliderConfig.snippet: structural invariants", () => {
  it("contains a <Slider JSX element", () => {
    expect(snippet({ value: 40 })).toContain("<Slider");
  });
  it("ends with a self-closing />", () => {
    expect(snippet({ value: 40 }).trimEnd().endsWith("/>")).toBe(true);
  });
  it("value prop is always emitted", () => {
    expect(snippet({ value: 40 })).toContain("value={40}");
    expect(snippet({ value: 0 })).toContain("value={0}");
  });
  it("value is emitted as {0} when omitted from values (falls back to 0)", () => {
    expect(snippet({})).toContain("value={0}");
  });
});

describe("sliderConfig.snippet: default props are omitted", () => {
  it("omits thumbState when it equals the default 'idle'", () => {
    const out = snippet({ value: 40, thumbState: "idle" });
    expect(out).not.toContain("thumbState=");
  });
  it("omits width when it equals the default 320", () => {
    const out = snippet({ value: 40, width: 320 });
    expect(out).not.toContain("width=");
  });
  it("omits showValue when it is false", () => {
    const out = snippet({ value: 40, showValue: false });
    expect(out).not.toContain("showValue");
  });
  it("omits showValue when undefined", () => {
    expect(snippet({ value: 40 })).not.toContain("showValue");
  });
});

describe("sliderConfig.snippet: non-default props are emitted", () => {
  it("emits thumbState='hover' when non-default", () => {
    expect(snippet({ value: 40, thumbState: "hover" })).toContain('thumbState="hover"');
  });
  it("emits thumbState='press' when non-default", () => {
    expect(snippet({ value: 40, thumbState: "press" })).toContain('thumbState="press"');
  });
  it("emits width={480} when non-default", () => {
    expect(snippet({ value: 40, width: 480 })).toContain("width={480}");
  });
  it("emits showValue (boolean shorthand) when true", () => {
    const out = snippet({ value: 40, showValue: true });
    expect(out).toContain("showValue");
    expect(out).not.toContain("showValue={true}");
  });
});

describe("sliderConfig.snippet: thumbState options round-trip", () => {
  it("emits correct thumbState for every non-default option", () => {
    const ctrl = sliderConfig.controls.thumbState;
    if (ctrl.type !== "select") throw new Error("expected select");
    const nonDefault = ctrl.options.filter((o) => o !== "idle");
    for (const thumbState of nonDefault) {
      expect(snippet({ value: 40, thumbState })).toContain(`thumbState="${thumbState}"`);
    }
  });
});

describe("sliderConfig.snippet: value numeric round-trip", () => {
  it("emits the correct value for various inputs", () => {
    for (const v of [0, 25, 40, 75, 100]) {
      expect(snippet({ value: v })).toContain(`value={${v}}`);
    }
  });
});
