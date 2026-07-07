import { describe, expect, it } from "bun:test";
import { defaultDarkTheme, defaultLightTheme } from "@/lib/remocn-ui";
import { resizableConfig } from "../config";
import {
  type ResizableHandleState,
  resizableHandleStyle,
  resizableStyle,
  resizableStyleContext,
} from "../index";
import {
  DEFAULT_DURATION,
  type ResizableStep,
  resizableStyleAt,
  tweenResizableStyle,
} from "../use-resizable-transition";

const VALID_HANDLE_STATES: readonly ResizableHandleState[] = [
  "idle",
  "hover",
  "press",
];

type SnippetValues = {
  ratio?: number;
  handleState?: string;
  direction?: string;
};
const snippet = (values: SnippetValues): string =>
  resizableConfig.snippet(values as Record<string, unknown>);

describe("DEFAULT_DURATION", () => {
  it("is 18 frames", () => {
    expect(DEFAULT_DURATION).toBe(18);
  });
});

describe("resizableHandleStyle: idle state — resting handle", () => {
  const s = resizableHandleStyle("idle");

  it("handleScale is 1 (no zoom)", () => {
    expect(s.handleScale).toBe(1);
  });

  it("handleRingOpacity is 0 (ring hidden)", () => {
    expect(s.handleRingOpacity).toBe(0);
  });
});

describe("resizableHandleStyle: hover state — grown handle + visible ring", () => {
  const s = resizableHandleStyle("hover");

  it("handleScale is 1.15", () => {
    expect(s.handleScale).toBeCloseTo(1.15, 10);
  });

  it("handleRingOpacity is 1 (ring fully visible)", () => {
    expect(s.handleRingOpacity).toBe(1);
  });
});

describe("resizableHandleStyle: press state — larger handle + visible ring", () => {
  const s = resizableHandleStyle("press");

  it("handleScale is 1.25 (larger than hover)", () => {
    expect(s.handleScale).toBeCloseTo(1.25, 10);
  });

  it("handleRingOpacity is 1 (ring fully visible)", () => {
    expect(s.handleRingOpacity).toBe(1);
  });
});

describe("resizableHandleStyle: press > hover > idle handleScale ordering", () => {
  it("press handleScale > hover handleScale > idle handleScale", () => {
    expect(resizableHandleStyle("press").handleScale).toBeGreaterThan(
      resizableHandleStyle("hover").handleScale,
    );
    expect(resizableHandleStyle("hover").handleScale).toBeGreaterThan(
      resizableHandleStyle("idle").handleScale,
    );
  });
});

describe("resizableHandleStyle: hover and press have identical handleRingOpacity", () => {
  it("hover.handleRingOpacity === press.handleRingOpacity === 1", () => {
    expect(resizableHandleStyle("hover").handleRingOpacity).toBe(1);
    expect(resizableHandleStyle("press").handleRingOpacity).toBe(1);
  });
});

describe("resizableHandleStyle: every state returns numeric fields", () => {
  it("every handleState produces numeric handleScale and handleRingOpacity", () => {
    for (const state of VALID_HANDLE_STATES) {
      const s = resizableHandleStyle(state);
      expect(typeof s.handleScale).toBe("number");
      expect(typeof s.handleRingOpacity).toBe("number");
    }
  });
});

function clampRatio(ratio: number, minRatio: number, maxRatio: number): number {
  return Math.min(maxRatio, Math.max(minRatio, ratio));
}

describe("clampRatio: below-range values clamp to minRatio", () => {
  it("ratio=0.1 clamps to minRatio=0.15", () => {
    expect(clampRatio(0.1, 0.15, 0.85)).toBeCloseTo(0.15, 10);
  });

  it("ratio=0 clamps to minRatio=0.15", () => {
    expect(clampRatio(0, 0.15, 0.85)).toBeCloseTo(0.15, 10);
  });

  it("ratio=-0.5 clamps to minRatio=0.15", () => {
    expect(clampRatio(-0.5, 0.15, 0.85)).toBeCloseTo(0.15, 10);
  });
});

describe("clampRatio: above-range values clamp to maxRatio", () => {
  it("ratio=0.9 clamps to maxRatio=0.85", () => {
    expect(clampRatio(0.9, 0.15, 0.85)).toBeCloseTo(0.85, 10);
  });

  it("ratio=1 clamps to maxRatio=0.85", () => {
    expect(clampRatio(1, 0.15, 0.85)).toBeCloseTo(0.85, 10);
  });

  it("ratio=1.5 clamps to maxRatio=0.85", () => {
    expect(clampRatio(1.5, 0.15, 0.85)).toBeCloseTo(0.85, 10);
  });
});

describe("clampRatio: boundary values are inclusive", () => {
  it("ratio=0.15 (exactly minRatio) passes through unchanged", () => {
    expect(clampRatio(0.15, 0.15, 0.85)).toBeCloseTo(0.15, 10);
  });

  it("ratio=0.85 (exactly maxRatio) passes through unchanged", () => {
    expect(clampRatio(0.85, 0.15, 0.85)).toBeCloseTo(0.85, 10);
  });
});

describe("clampRatio: in-range values pass through unchanged", () => {
  it("ratio=0.5 returns 0.5", () => {
    expect(clampRatio(0.5, 0.15, 0.85)).toBeCloseTo(0.5, 10);
  });

  it("ratio=0.3 returns 0.3", () => {
    expect(clampRatio(0.3, 0.15, 0.85)).toBeCloseTo(0.3, 10);
  });

  it("ratio=0.75 returns 0.75", () => {
    expect(clampRatio(0.75, 0.15, 0.85)).toBeCloseTo(0.75, 10);
  });
});

describe("resizableStyleContext: light theme — token mapping", () => {
  const ctx = resizableStyleContext(defaultLightTheme);

  it("containerBg equals theme.background", () => {
    expect(ctx.containerBg).toBe(defaultLightTheme.background);
  });

  it("border equals theme.border", () => {
    expect(ctx.border).toBe(defaultLightTheme.border);
  });

  it("panelBg equals theme.muted", () => {
    expect(ctx.panelBg).toBe(defaultLightTheme.muted);
  });

  it("grip equals theme.border", () => {
    expect(ctx.grip).toBe(defaultLightTheme.border);
  });

  it("ring is a non-empty string (mixOklch blend of theme.ring + background)", () => {
    expect(typeof ctx.ring).toBe("string");
    expect(ctx.ring.length).toBeGreaterThan(0);
  });

  it("placeholderFg equals theme.mutedForeground", () => {
    expect(ctx.placeholderFg).toBe(defaultLightTheme.mutedForeground);
  });

  it("radius equals theme.radius", () => {
    expect(ctx.radius).toBe(defaultLightTheme.radius);
  });
});

describe("resizableStyleContext: dark theme differs from light on theme-derived fields", () => {
  const ctxLight = resizableStyleContext(defaultLightTheme);
  const ctxDark = resizableStyleContext(defaultDarkTheme);

  it("ring color differs between light and dark (uses theme.ring token)", () => {
    expect(ctxLight.ring).not.toBe(ctxDark.ring);
  });

  it("containerBg differs between light and dark (uses theme.background)", () => {
    expect(ctxLight.containerBg).not.toBe(ctxDark.containerBg);
  });
});

describe("resizableStyleContext: all fields are present and correctly typed", () => {
  it("every ResizableStyleContext field is a non-empty string or number for light theme", () => {
    const ctx = resizableStyleContext(defaultLightTheme);
    for (const key of [
      "containerBg",
      "border",
      "panelBg",
      "grip",
      "ring",
      "placeholderFg",
    ] as const) {
      expect(typeof ctx[key]).toBe("string");
      expect(ctx[key].length).toBeGreaterThan(0);
    }
    expect(typeof ctx.radius).toBe("number");
  });
});

describe("resizableStyle: idle handle preset", () => {
  const s = resizableStyle(0.5, "idle");
  const preset = resizableHandleStyle("idle");

  it("ratio equals the input ratio", () => {
    expect(s.ratio).toBeCloseTo(0.5, 10);
  });

  it("handleScale matches idle preset", () => {
    expect(s.handleScale).toBeCloseTo(preset.handleScale, 10);
  });

  it("handleRingOpacity matches idle preset (0)", () => {
    expect(s.handleRingOpacity).toBeCloseTo(preset.handleRingOpacity, 10);
  });
});

describe("resizableStyle: hover handle preset", () => {
  const s = resizableStyle(0.3, "hover");
  const preset = resizableHandleStyle("hover");

  it("ratio equals the input ratio", () => {
    expect(s.ratio).toBeCloseTo(0.3, 10);
  });

  it("handleScale matches hover preset (1.15)", () => {
    expect(s.handleScale).toBeCloseTo(preset.handleScale, 10);
  });

  it("handleRingOpacity matches hover preset (1)", () => {
    expect(s.handleRingOpacity).toBeCloseTo(preset.handleRingOpacity, 10);
  });
});

describe("resizableStyle: press handle preset", () => {
  const s = resizableStyle(0.7, "press");
  const preset = resizableHandleStyle("press");

  it("ratio equals the input ratio", () => {
    expect(s.ratio).toBeCloseTo(0.7, 10);
  });

  it("handleScale matches press preset (1.25)", () => {
    expect(s.handleScale).toBeCloseTo(preset.handleScale, 10);
  });

  it("handleRingOpacity matches press preset (1)", () => {
    expect(s.handleRingOpacity).toBeCloseTo(preset.handleRingOpacity, 10);
  });
});

describe("resizableStyle: ratio is preserved regardless of handle state", () => {
  it("ratio=0.2 is preserved with idle", () => {
    expect(resizableStyle(0.2, "idle").ratio).toBeCloseTo(0.2, 10);
  });

  it("ratio=0.8 is preserved with press", () => {
    expect(resizableStyle(0.8, "press").ratio).toBeCloseTo(0.8, 10);
  });
});

describe("resizableStyle: all three ResizableStyle fields are present", () => {
  it("returns an object with ratio, handleScale, handleRingOpacity", () => {
    const s = resizableStyle(0.5, "idle");
    expect("ratio" in s).toBe(true);
    expect("handleScale" in s).toBe(true);
    expect("handleRingOpacity" in s).toBe(true);
  });
});

describe("tweenResizableStyle: t=0 returns values equal to `a`", () => {
  const a = resizableStyle(0.3, "idle");
  const b = resizableStyle(0.7, "hover");
  const r = tweenResizableStyle(a, b, 0);

  it("ratio equals a.ratio at t=0", () => {
    expect(r.ratio).toBeCloseTo(a.ratio, 10);
  });
  it("handleScale equals a.handleScale at t=0", () => {
    expect(r.handleScale).toBeCloseTo(a.handleScale, 10);
  });
  it("handleRingOpacity equals a.handleRingOpacity at t=0", () => {
    expect(r.handleRingOpacity).toBeCloseTo(a.handleRingOpacity, 10);
  });
});

describe("tweenResizableStyle: t=1 returns values equal to `b`", () => {
  const a = resizableStyle(0.3, "idle");
  const b = resizableStyle(0.7, "hover");
  const r = tweenResizableStyle(a, b, 1);

  it("ratio equals b.ratio at t=1", () => {
    expect(r.ratio).toBeCloseTo(b.ratio, 10);
  });
  it("handleScale equals b.handleScale at t=1", () => {
    expect(r.handleScale).toBeCloseTo(b.handleScale, 10);
  });
  it("handleRingOpacity equals b.handleRingOpacity at t=1", () => {
    expect(r.handleRingOpacity).toBeCloseTo(b.handleRingOpacity, 10);
  });
});

describe("tweenResizableStyle: t=0.5 midpoint", () => {
  const a = resizableStyle(0.3, "idle");
  const b = resizableStyle(0.7, "hover");
  const r = tweenResizableStyle(a, b, 0.5);

  it("ratio midpoint: 0.3→0.7 gives 0.5", () => {
    expect(r.ratio).toBeCloseTo(0.5, 10);
  });
  it("handleScale midpoint: 1→1.15 gives 1.075", () => {
    expect(r.handleScale).toBeCloseTo(1.075, 10);
  });
  it("handleRingOpacity midpoint: 0→1 gives 0.5", () => {
    expect(r.handleRingOpacity).toBeCloseTo(0.5, 10);
  });
});

describe("tweenResizableStyle: identity (a === b, any t)", () => {
  const s = resizableStyle(0.5, "idle");

  it("all fields unchanged when both endpoints are the same", () => {
    const r = tweenResizableStyle(s, s, 0.5);
    expect(r.ratio).toBeCloseTo(s.ratio, 10);
    expect(r.handleScale).toBeCloseTo(s.handleScale, 10);
    expect(r.handleRingOpacity).toBeCloseTo(s.handleRingOpacity, 10);
  });
});

describe("tweenResizableStyle: idle → press handle channel", () => {
  const a = resizableStyle(0.5, "idle");
  const b = resizableStyle(0.5, "press");
  const r = tweenResizableStyle(a, b, 0.5);

  it("handleScale midpoint idle→press: (1+1.25)/2 = 1.125", () => {
    expect(r.handleScale).toBeCloseTo(1.125, 10);
  });
  it("handleRingOpacity midpoint idle→press: 0.5", () => {
    expect(r.handleRingOpacity).toBeCloseTo(0.5, 10);
  });
});

describe("tweenResizableStyle: hover → press handle channel", () => {
  const a = resizableStyle(0.5, "hover");
  const b = resizableStyle(0.5, "press");
  const r = tweenResizableStyle(a, b, 0.5);

  it("handleScale midpoint hover→press: (1.15+1.25)/2 = 1.2", () => {
    expect(r.handleScale).toBeCloseTo(1.2, 10);
  });
  it("handleRingOpacity stays at 1 (both hover and press have full ring)", () => {
    expect(r.handleRingOpacity).toBeCloseTo(1, 10);
  });
});

describe("resizableStyleAt: empty steps → ratio=0.5, handle=idle", () => {
  it("empty steps returns {ratio:0.5, handleScale:1, handleRingOpacity:0}", () => {
    const r = resizableStyleAt([], 0);
    expect(r.ratio).toBe(0.5);
    expect(r.handleScale).toBe(resizableHandleStyle("idle").handleScale);
    expect(r.handleRingOpacity).toBe(
      resizableHandleStyle("idle").handleRingOpacity,
    );
  });
});

describe("resizableStyleAt: before first ratio step — holds at first.ratio", () => {
  const steps: ResizableStep[] = [{ at: 10, ratio: 0.6 }];

  it("raw=5 < first.at=10 → holds at first.ratio=0.6", () => {
    expect(resizableStyleAt(steps, 5).ratio).toBeCloseTo(0.6, 10);
  });

  it("raw=10 = first.at → holds at first.ratio=0.6 (raw <= first.at)", () => {
    expect(resizableStyleAt(steps, 10).ratio).toBeCloseTo(0.6, 10);
  });
});

describe("resizableStyleAt: before first handle step — holds at first.handleState preset", () => {
  const steps: ResizableStep[] = [{ at: 10, handleState: "hover" }];

  it("raw=5 holds at hover preset (handleScale=1.15)", () => {
    expect(resizableStyleAt(steps, 5).handleScale).toBeCloseTo(1.15, 10);
  });

  it("raw=5 holds at hover preset (handleRingOpacity=1)", () => {
    expect(resizableStyleAt(steps, 5).handleRingOpacity).toBeCloseTo(1, 10);
  });
});

describe("resizableStyleAt: past last ratio step — rests at last.ratio", () => {
  const steps: ResizableStep[] = [
    { at: 0, ratio: 0.3 },
    { at: 18, ratio: 0.7 },
  ];

  it("raw=50 → ratio=0.7 (rests at last)", () => {
    expect(resizableStyleAt(steps, 50).ratio).toBeCloseTo(0.7, 10);
  });
});

describe("resizableStyleAt: past last handle step — rests at last.handleState preset", () => {
  const steps: ResizableStep[] = [
    { at: 0, handleState: "idle" },
    { at: 18, handleState: "press" },
  ];

  it("raw=50 → handleScale=1.25 (press preset, rests at last)", () => {
    expect(resizableStyleAt(steps, 50).handleScale).toBeCloseTo(
      resizableHandleStyle("press").handleScale,
      10,
    );
  });

  it("raw=50 → handleRingOpacity=1 (press preset)", () => {
    expect(resizableStyleAt(steps, 50).handleRingOpacity).toBeCloseTo(1, 10);
  });
});

describe("resizableStyleAt: ratio channel mid-window uses easings.out", () => {
  const steps: ResizableStep[] = [
    { at: 0, ratio: 0.3 },
    { at: 18, ratio: 0.7 },
  ];

  it("ratio at raw=9 is 0.65 (out-eased, not linear 0.5)", () => {
    expect(resizableStyleAt(steps, 9).ratio).toBeCloseTo(0.65, 8);
  });

  it("ratio is NOT linear at midpoint (0.65 ≠ 0.5)", () => {
    const r = resizableStyleAt(steps, 9);
    expect(r.ratio).not.toBeCloseTo(0.5, 1);
  });
});

describe("resizableStyleAt: handle channel mid-window uses easings.out", () => {
  const steps: ResizableStep[] = [
    { at: 0, handleState: "idle" },
    { at: 18, handleState: "hover" },
  ];

  it("handleScale at raw=9 is 1.13125 (out-eased)", () => {
    expect(resizableStyleAt(steps, 9).handleScale).toBeCloseTo(1.13125, 8);
  });

  it("handleRingOpacity at raw=9 is 0.875 (out-eased, not linear 0.5)", () => {
    expect(resizableStyleAt(steps, 9).handleRingOpacity).toBeCloseTo(0.875, 8);
  });
});

describe("resizableStyleAt: dual-channel steps fold independently", () => {
  const steps: ResizableStep[] = [
    { at: 0, ratio: 0.3, handleState: "idle" },
    { at: 18, ratio: 0.7, handleState: "hover" },
  ];

  it("both channels are active at raw=9", () => {
    const r = resizableStyleAt(steps, 9);
    expect(r.ratio).toBeCloseTo(0.65, 8);
    expect(r.handleRingOpacity).toBeCloseTo(0.875, 8);
  });

  it("ratio channel at raw=18 (past last) → ratio=0.7", () => {
    expect(resizableStyleAt(steps, 18).ratio).toBeCloseTo(0.7, 10);
  });

  it("handle channel at raw=18 (past last) → hover preset values", () => {
    const r = resizableStyleAt(steps, 18);
    expect(r.handleScale).toBeCloseTo(
      resizableHandleStyle("hover").handleScale,
      10,
    );
    expect(r.handleRingOpacity).toBeCloseTo(
      resizableHandleStyle("hover").handleRingOpacity,
      10,
    );
  });
});

describe("resizableStyleAt: channels can have different step counts", () => {
  const ratioOnlySteps: ResizableStep[] = [
    { at: 0, ratio: 0.3 },
    { at: 18, ratio: 0.7 },
  ];

  it("handle is idle when no handle steps are present", () => {
    const r = resizableStyleAt(ratioOnlySteps, 9);
    expect(r.handleScale).toBe(resizableHandleStyle("idle").handleScale);
    expect(r.handleRingOpacity).toBe(
      resizableHandleStyle("idle").handleRingOpacity,
    );
  });

  const handleOnlySteps: ResizableStep[] = [
    { at: 0, handleState: "idle" },
    { at: 18, handleState: "hover" },
  ];

  it("ratio is 0.5 (default center) when no ratio steps are present", () => {
    expect(resizableStyleAt(handleOnlySteps, 9).ratio).toBe(0.5);
  });
});

describe("resizableStyleAt: past last with both channels — single-step timeline", () => {
  const steps: ResizableStep[] = [
    { at: 18, ratio: 0.75, handleState: "press" },
  ];

  it("raw=50 → ratio=0.75, handle=press preset", () => {
    const r = resizableStyleAt(steps, 50);
    expect(r.ratio).toBeCloseTo(0.75, 10);
    expect(r.handleScale).toBeCloseTo(
      resizableHandleStyle("press").handleScale,
      10,
    );
    expect(r.handleRingOpacity).toBeCloseTo(
      resizableHandleStyle("press").handleRingOpacity,
      10,
    );
  });
});

describe("resizableStyleAt: before first with both channels — single-step timeline", () => {
  const steps: ResizableStep[] = [{ at: 10, ratio: 0.6, handleState: "hover" }];

  it("raw=0 → ratio=0.6 (first ratio), handleScale=1.15 (first hover)", () => {
    const r = resizableStyleAt(steps, 0);
    expect(r.ratio).toBeCloseTo(0.6, 10);
    expect(r.handleScale).toBeCloseTo(1.15, 10);
  });
});

describe("resizableStyleAt: custom defaultDuration override", () => {
  const steps: ResizableStep[] = [
    { at: 0, ratio: 0.3 },
    { at: 9, ratio: 0.7 },
  ];

  it("custom defaultDuration=9 adjusts window width correctly at raw=4.5", () => {
    const r = resizableStyleAt(steps, 4.5, { defaultDuration: 9 });
    expect(r.ratio).toBeCloseTo(0.65, 8);
  });
});

describe("resizableConfig.controls: ratio", () => {
  it("ratio is a number control", () => {
    expect(resizableConfig.controls.ratio.type).toBe("number");
  });
  it("ratio default is 0.5", () => {
    expect(resizableConfig.controls.ratio.default).toBe(0.5);
  });
  it("ratio min=0, max=1", () => {
    const ctrl = resizableConfig.controls.ratio;
    if (ctrl.type !== "number") throw new Error("expected number");
    expect(ctrl.min).toBe(0);
    expect(ctrl.max).toBe(1);
  });
});

describe("resizableConfig.controls: handleState", () => {
  it("handleState is a select control", () => {
    expect(resizableConfig.controls.handleState.type).toBe("select");
  });
  it("handleState options are ['idle', 'hover', 'press']", () => {
    const ctrl = resizableConfig.controls.handleState;
    if (ctrl.type !== "select") throw new Error("expected select");
    expect(ctrl.options).toEqual(["idle", "hover", "press"]);
  });
  it("handleState default is 'idle'", () => {
    expect(resizableConfig.controls.handleState.default).toBe("idle");
  });
  it("every handleState option is a valid ResizableHandleState", () => {
    const ctrl = resizableConfig.controls.handleState;
    if (ctrl.type !== "select") throw new Error("expected select");
    for (const opt of ctrl.options) {
      expect(VALID_HANDLE_STATES).toContain(opt as ResizableHandleState);
    }
  });
});

describe("resizableConfig.controls: direction", () => {
  it("direction is a select control", () => {
    expect(resizableConfig.controls.direction.type).toBe("select");
  });
  it("direction options include 'horizontal' and 'vertical'", () => {
    const ctrl = resizableConfig.controls.direction;
    if (ctrl.type !== "select") throw new Error("expected select");
    expect(ctrl.options).toContain("horizontal");
    expect(ctrl.options).toContain("vertical");
  });
  it("direction default is 'horizontal'", () => {
    expect(resizableConfig.controls.direction.default).toBe("horizontal");
  });
});

describe("resizableConfig.snippet: import line", () => {
  it("includes 'import { Resizable }' from the correct path", () => {
    const out = snippet({ ratio: 0.5 });
    expect(out).toContain("import { Resizable }");
    expect(out).toContain('from "@/components/remocn/resizable"');
  });
});

describe("resizableConfig.snippet: structural invariants", () => {
  it("contains a <Resizable JSX element", () => {
    expect(snippet({ ratio: 0.5 })).toContain("<Resizable");
  });
  it("ends with a self-closing />", () => {
    expect(snippet({ ratio: 0.5 }).trimEnd().endsWith("/>")).toBe(true);
  });
  it("ratio prop is always emitted", () => {
    expect(snippet({ ratio: 0.5 })).toContain("ratio={0.5}");
    expect(snippet({ ratio: 0.3 })).toContain("ratio={0.3}");
  });
  it("ratio is emitted as {0.5} when omitted from values (falls back to default 0.5)", () => {
    expect(snippet({})).toContain("ratio={0.5}");
  });
});

describe("resizableConfig.snippet: default props are omitted", () => {
  it("omits handleState when it equals the default 'idle'", () => {
    const out = snippet({ ratio: 0.5, handleState: "idle" });
    expect(out).not.toContain("handleState=");
  });
  it("omits direction when it equals the default 'horizontal'", () => {
    const out = snippet({ ratio: 0.5, direction: "horizontal" });
    expect(out).not.toContain("direction=");
  });
});

describe("resizableConfig.snippet: non-default props are emitted", () => {
  it("emits handleState='hover' when non-default", () => {
    expect(snippet({ ratio: 0.5, handleState: "hover" })).toContain(
      'handleState="hover"',
    );
  });
  it("emits handleState='press' when non-default", () => {
    expect(snippet({ ratio: 0.5, handleState: "press" })).toContain(
      'handleState="press"',
    );
  });
  it("emits direction='vertical' when non-default", () => {
    expect(snippet({ ratio: 0.5, direction: "vertical" })).toContain(
      'direction="vertical"',
    );
  });
});

describe("resizableConfig.snippet: handleState options round-trip", () => {
  it("emits correct handleState for every non-default option", () => {
    const ctrl = resizableConfig.controls.handleState;
    if (ctrl.type !== "select") throw new Error("expected select");
    const nonDefault = ctrl.options.filter((o) => o !== "idle");
    for (const handleState of nonDefault) {
      expect(snippet({ ratio: 0.5, handleState })).toContain(
        `handleState="${handleState}"`,
      );
    }
  });
});

describe("resizableConfig.snippet: ratio numeric round-trip", () => {
  it("emits the correct ratio for various inputs", () => {
    for (const r of [0.15, 0.3, 0.5, 0.7, 0.85]) {
      expect(snippet({ ratio: r })).toContain(`ratio={${r}}`);
    }
  });
});
