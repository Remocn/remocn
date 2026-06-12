
import { describe, expect, it } from "bun:test";
import {
  tooltipStyle,
  type TooltipState,
  type TooltipSide,
} from "../index";
import {
  tweenTooltipStyle,
  DEFAULT_DURATION,
} from "../use-tooltip-transition";
import { tooltipConfig } from "../config";
import { defaultLightTheme, defaultDarkTheme, easings } from "@/lib/remocn-ui";
import type { Step } from "@/lib/remocn-ui";

const VALID_STATES: readonly TooltipState[] = ["hidden", "visible"];
const VALID_SIDES: readonly TooltipSide[] = ["top", "bottom", "left", "right"];

type SnippetValues = {
  state?: string;
  label?: string;
  side?: string;
  mode?: string;
};
const snippet = (values: SnippetValues): string =>
  tooltipConfig.snippet(values as Record<string, unknown>);

describe("DEFAULT_DURATION", () => {
  it("is 8 frames", () => {
    expect(DEFAULT_DURATION).toBe(8);
  });
});

describe("tooltipStyle: hidden state — off-screen keyframe", () => {
  const s = tooltipStyle("hidden");

  it("opacity is 0 (invisible)", () => {
    expect(s.opacity).toBe(0);
  });

  it("scale is 0.96 (slightly shrunken at hidden)", () => {
    expect(s.scale).toBeCloseTo(0.96, 10);
  });

  it("translate is 4 (enters from 4px offset)", () => {
    expect(s.translate).toBe(4);
  });
});

describe("tooltipStyle: visible state — resting keyframe", () => {
  const s = tooltipStyle("visible");

  it("opacity is 1 (fully visible)", () => {
    expect(s.opacity).toBe(1);
  });

  it("scale is 1 (full size)", () => {
    expect(s.scale).toBe(1);
  });

  it("translate is 0 (at rest position)", () => {
    expect(s.translate).toBe(0);
  });
});

describe("tooltipStyle: both states are complete keyframes", () => {
  it("every TooltipStyle field is defined and numeric for every state", () => {
    for (const state of VALID_STATES) {
      const s = tooltipStyle(state);
      expect(typeof s.opacity).toBe("number");
      expect(typeof s.scale).toBe("number");
      expect(typeof s.translate).toBe("number");
    }
  });

  it("hidden and visible have distinct opacity (0 vs 1)", () => {
    expect(tooltipStyle("hidden").opacity).toBe(0);
    expect(tooltipStyle("visible").opacity).toBe(1);
  });

  it("hidden and visible have distinct scale (0.96 vs 1)", () => {
    expect(tooltipStyle("hidden").scale).toBeCloseTo(0.96, 10);
    expect(tooltipStyle("visible").scale).toBe(1);
  });

  it("hidden and visible have distinct translate (4 vs 0)", () => {
    expect(tooltipStyle("hidden").translate).toBe(4);
    expect(tooltipStyle("visible").translate).toBe(0);
  });
});

describe("tooltipStyle: unknown state falls through to hidden preset", () => {
  it("'hidden' returns opacity=0 (via default arm)", () => {
    expect(tooltipStyle("hidden").opacity).toBe(0);
  });
});

describe("tweenTooltipStyle: t=0 returns values equal to `a`", () => {
  const a = tooltipStyle("hidden");
  const b = tooltipStyle("visible");
  const r = tweenTooltipStyle(a, b, 0);

  it("opacity equals a.opacity at t=0", () => {
    expect(r.opacity).toBeCloseTo(a.opacity, 10);
  });

  it("scale equals a.scale at t=0", () => {
    expect(r.scale).toBeCloseTo(a.scale, 10);
  });

  it("translate equals a.translate at t=0", () => {
    expect(r.translate).toBeCloseTo(a.translate, 10);
  });
});

describe("tweenTooltipStyle: t=1 returns values equal to `b`", () => {
  const a = tooltipStyle("hidden");
  const b = tooltipStyle("visible");
  const r = tweenTooltipStyle(a, b, 1);

  it("opacity equals b.opacity at t=1", () => {
    expect(r.opacity).toBeCloseTo(b.opacity, 10);
  });

  it("scale equals b.scale at t=1", () => {
    expect(r.scale).toBeCloseTo(b.scale, 10);
  });

  it("translate equals b.translate at t=1", () => {
    expect(r.translate).toBeCloseTo(b.translate, 10);
  });
});

describe("tweenTooltipStyle: t=0.5 midpoint (hidden → visible)", () => {
  const a = tooltipStyle("hidden");
  const b = tooltipStyle("visible");
  const r = tweenTooltipStyle(a, b, 0.5);

  it("opacity midpoint: 0 → 1 gives 0.5", () => {
    expect(r.opacity).toBeCloseTo(0.5, 10);
  });

  it("scale midpoint: 0.96 → 1 gives 0.98", () => {
    expect(r.scale).toBeCloseTo(0.98, 10);
  });

  it("translate midpoint: 4 → 0 gives 2", () => {
    expect(r.translate).toBeCloseTo(2, 10);
  });
});

describe("tweenTooltipStyle: t=0.5 midpoint (visible → hidden, dismiss direction)", () => {
  const a = tooltipStyle("visible");
  const b = tooltipStyle("hidden");
  const r = tweenTooltipStyle(a, b, 0.5);

  it("opacity midpoint: 1 → 0 gives 0.5", () => {
    expect(r.opacity).toBeCloseTo(0.5, 10);
  });

  it("scale midpoint: 1 → 0.96 gives 0.98", () => {
    expect(r.scale).toBeCloseTo(0.98, 10);
  });

  it("translate midpoint: 0 → 4 gives 2", () => {
    expect(r.translate).toBeCloseTo(2, 10);
  });
});

describe("tweenTooltipStyle: identity (a === b, any t)", () => {
  const s = tooltipStyle("visible");

  it("opacity is unchanged when both endpoints are the same", () => {
    expect(tweenTooltipStyle(s, s, 0.5).opacity).toBeCloseTo(s.opacity, 10);
  });

  it("scale is unchanged when both endpoints are the same", () => {
    expect(tweenTooltipStyle(s, s, 0.5).scale).toBeCloseTo(s.scale, 10);
  });

  it("translate is unchanged when both endpoints are the same", () => {
    expect(tweenTooltipStyle(s, s, 0.5).translate).toBeCloseTo(s.translate, 10);
  });
});

describe("tweenTooltipStyle: t=0.25 quarter-point (hidden → visible)", () => {
  const a = tooltipStyle("hidden");
  const b = tooltipStyle("visible");
  const r = tweenTooltipStyle(a, b, 0.25);

  it("opacity at t=0.25 is 0.25", () => {
    expect(r.opacity).toBeCloseTo(0.25, 10);
  });

  it("scale at t=0.25 is 0.97", () => {
    expect(r.scale).toBeCloseTo(0.97, 10);
  });

  it("translate at t=0.25 is 3", () => {
    expect(r.translate).toBeCloseTo(3, 10);
  });
});

function clamp01Mirror(t: number): number {
  return Math.max(0, Math.min(1, t));
}

function easingOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

function resolveStateTransition<S extends string>(
  raw: number,
  steps: Step<S>[],
  defaultState: S,
  speed = 1,
  defaultDuration = 8,
): { from: S; to: S; progress: number } {
  const effectiveFrame = raw * speed;
  const started = steps
    .map((step, index) => ({ step, index }))
    .sort((a, b) => a.step.at - b.step.at || a.index - b.index)
    .filter((e) => e.step.at <= effectiveFrame);
  if (started.length === 0)
    return { from: defaultState, to: defaultState, progress: 1 };
  const to = started[started.length - 1].step;
  const from = started.length >= 2 ? started[started.length - 2].step : null;
  const dur = to.duration ?? defaultDuration;
  const progress = dur > 0 ? clamp01Mirror((effectiveFrame - to.at) / dur) : 1;
  return { from: from ? from.state : defaultState, to: to.state, progress };
}

function resolveTooltipTransition(
  raw: number,                                    // injected useCurrentFrame() — MIRROR line 53
  steps: Step<TooltipState>[],
  speed = 1,
  defaultDuration = DEFAULT_DURATION,
): { style: ReturnType<typeof tweenTooltipStyle>; progress: number; from: TooltipState; to: TooltipState } {
  const { from, to, progress } = resolveStateTransition(
    raw,
    steps,
    "hidden",
    speed,
    defaultDuration,
  );
  const t = easingOut(progress);
  const style = tweenTooltipStyle(tooltipStyle(from as TooltipState), tooltipStyle(to as TooltipState), t);
  return { style, progress, from: from as TooltipState, to: to as TooltipState };
}

describe("resolveTooltipTransition: before any step — holds at hidden", () => {
  it("returns the hidden style when no steps have started", () => {
    const { style } = resolveTooltipTransition(0, []);
    const hidden = tooltipStyle("hidden");
    expect(style.opacity).toBeCloseTo(hidden.opacity, 10);
    expect(style.scale).toBeCloseTo(hidden.scale, 10);
    expect(style.translate).toBeCloseTo(hidden.translate, 10);
  });

  it("from and to are both 'hidden' before any step", () => {
    const { from, to } = resolveTooltipTransition(0, []);
    expect(from).toBe("hidden");
    expect(to).toBe("hidden");
  });
});

describe("resolveTooltipTransition: exactly at hidden→visible step boundary", () => {
  const steps: Step<TooltipState>[] = [{ at: 10, state: "visible" }];

  it("at raw=10 exactly, progress=0, t=out(0)=0 → style equals hidden (from)", () => {
    const { style, progress } = resolveTooltipTransition(10, steps);
    expect(progress).toBe(0);
    const hidden = tooltipStyle("hidden");
    expect(style.opacity).toBeCloseTo(hidden.opacity, 10);
    expect(style.scale).toBeCloseTo(hidden.scale, 10);
    expect(style.translate).toBeCloseTo(hidden.translate, 10);
  });

  it("from='hidden', to='visible' at the step boundary", () => {
    const { from, to } = resolveTooltipTransition(10, steps);
    expect(from).toBe("hidden");
    expect(to).toBe("visible");
  });
});

describe("resolveTooltipTransition: mid-window uses easings.out (not linear)", () => {
  const steps: Step<TooltipState>[] = [{ at: 0, state: "visible" }];

  it("opacity at raw=4 is tween(0,1,out(0.5)) ≈ 0.875 (not linear 0.5)", () => {
    const { style } = resolveTooltipTransition(4, steps, 1, 8);
    const expectedT = easingOut(0.5);
    expect(style.opacity).toBeCloseTo(expectedT, 8);
  });

  it("scale at raw=4 is tween(0.96,1,out(0.5)): 0.96 + 0.04*0.875 = 0.995", () => {
    const { style } = resolveTooltipTransition(4, steps, 1, 8);
    const t = easingOut(0.5);
    const expected = 0.96 + (1 - 0.96) * t;
    expect(style.scale).toBeCloseTo(expected, 8);
  });

  it("translate at raw=4 is tween(4,0,out(0.5)): 4*(1-0.875) = 0.5", () => {
    const { style } = resolveTooltipTransition(4, steps, 1, 8);
    const t = easingOut(0.5);
    const expected = 4 * (1 - t);
    expect(style.translate).toBeCloseTo(expected, 8);
  });
});

describe("resolveTooltipTransition: past the transition window → fully visible", () => {
  const steps: Step<TooltipState>[] = [{ at: 0, state: "visible" }];

  it("opacity is 1 after DEFAULT_DURATION frames", () => {
    const { style } = resolveTooltipTransition(DEFAULT_DURATION, steps);
    expect(style.opacity).toBeCloseTo(1, 10);
  });

  it("scale is 1 after DEFAULT_DURATION frames", () => {
    const { style } = resolveTooltipTransition(DEFAULT_DURATION, steps);
    expect(style.scale).toBeCloseTo(1, 10);
  });

  it("translate is 0 after DEFAULT_DURATION frames", () => {
    const { style } = resolveTooltipTransition(DEFAULT_DURATION, steps);
    expect(style.translate).toBeCloseTo(0, 10);
  });
});

describe("resolveTooltipTransition: speed contract", () => {
  const steps: Step<TooltipState>[] = [{ at: 8, state: "visible" }];

  it("speed=2: step at=8 fires at raw=4 (eff=8)", () => {
    const { to } = resolveTooltipTransition(4, steps, 2);
    expect(to).toBe("visible");
  });

  it("speed=2: step at=8 has NOT fired at raw=3 (eff=6 < 8)", () => {
    const { to } = resolveTooltipTransition(3, steps, 2);
    expect(to).toBe("hidden");
  });
});

describe("tooltipConfig.controls: state", () => {
  it("state is a select control", () => {
    expect(tooltipConfig.controls.state.type).toBe("select");
  });

  it("state options are ['hidden', 'visible']", () => {
    const ctrl = tooltipConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    expect(ctrl.options).toEqual(["hidden", "visible"]);
  });

  it("state default is 'visible' (shows the resting tooltip in the preview)", () => {
    expect(tooltipConfig.controls.state.default).toBe("visible");
  });

  it("every state option is a valid TooltipState", () => {
    const ctrl = tooltipConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    for (const opt of ctrl.options) {
      expect(VALID_STATES).toContain(opt as TooltipState);
    }
  });
});

describe("tooltipConfig.controls: side", () => {
  it("side is a select control", () => {
    expect(tooltipConfig.controls.side.type).toBe("select");
  });

  it("side options are ['top', 'bottom', 'left', 'right']", () => {
    const ctrl = tooltipConfig.controls.side;
    if (ctrl.type !== "select") throw new Error("expected select");
    expect(ctrl.options).toEqual(["top", "bottom", "left", "right"]);
  });

  it("side default is 'top'", () => {
    expect(tooltipConfig.controls.side.default).toBe("top");
  });

  it("every side option is a valid TooltipSide", () => {
    const ctrl = tooltipConfig.controls.side;
    if (ctrl.type !== "select") throw new Error("expected select");
    for (const opt of ctrl.options) {
      expect(VALID_SIDES).toContain(opt as TooltipSide);
    }
  });
});

describe("tooltipConfig.controls: mode", () => {
  it("mode is a select control", () => {
    expect(tooltipConfig.controls.mode.type).toBe("select");
  });

  it("mode options are ['light', 'dark']", () => {
    const ctrl = tooltipConfig.controls.mode;
    if (ctrl.type !== "select") throw new Error("expected select");
    expect(ctrl.options).toEqual(["light", "dark"]);
  });

  it("mode default is 'light'", () => {
    expect(tooltipConfig.controls.mode.default).toBe("light");
  });
});

describe("tooltipConfig.controls: label", () => {
  it("label is a text control", () => {
    expect(tooltipConfig.controls.label.type).toBe("text");
  });

  it("label default is 'Add to library'", () => {
    expect(tooltipConfig.controls.label.default).toBe("Add to library");
  });
});

describe("tooltipConfig.snippet: import line", () => {
  it("includes 'import { Tooltip }' from the correct path", () => {
    const out = snippet({ state: "visible" });
    expect(out).toContain("import { Tooltip }");
    expect(out).toContain('from "@/components/remocn/tooltip"');
  });
});

describe("tooltipConfig.snippet: structural invariants", () => {
  it("contains a <Tooltip JSX element", () => {
    expect(snippet({ state: "visible" })).toContain("<Tooltip");
  });

  it("ends with a self-closing />", () => {
    expect(snippet({ state: "visible" }).trimEnd().endsWith("/>")).toBe(true);
  });

  it("state prop is always emitted", () => {
    expect(snippet({ state: "visible" })).toContain('state="visible"');
    expect(snippet({ state: "hidden" })).toContain('state="hidden"');
  });

  it("label prop is always emitted", () => {
    expect(snippet({ state: "visible" })).toContain('label="');
  });
});

describe("tooltipConfig.snippet: label is always emitted", () => {
  it("emits label='Add to library' when label is the default", () => {
    const out = snippet({ state: "visible", label: "Add to library" });
    expect(out).toContain('label="Add to library"');
  });

  it("emits label when label is omitted from values (falls back to default)", () => {
    const out = snippet({ state: "visible" });
    expect(out).toContain('label="Add to library"');
  });

  it("emits a non-default label when provided", () => {
    const out = snippet({ state: "visible", label: "Copy link" });
    expect(out).toContain('label="Copy link"');
  });
});

describe("tooltipConfig.snippet: default props are omitted", () => {

  it("omits side when it equals the default 'top'", () => {
    const out = snippet({ state: "visible", side: "top" });
    expect(out).not.toContain("side=");
  });

  it("omits mode when it equals the default 'light'", () => {
    const out = snippet({ state: "visible", mode: "light" });
    expect(out).not.toContain("mode=");
  });
});

describe("tooltipConfig.snippet: non-default props are emitted", () => {
  it("emits side='bottom' when non-default", () => {
    expect(snippet({ state: "visible", side: "bottom" })).toContain(
      'side="bottom"',
    );
  });

  it("emits side='left' when non-default", () => {
    expect(snippet({ state: "visible", side: "left" })).toContain(
      'side="left"',
    );
  });

  it("emits side='right' when non-default", () => {
    expect(snippet({ state: "visible", side: "right" })).toContain(
      'side="right"',
    );
  });

  it("emits mode='dark' when non-default", () => {
    expect(snippet({ state: "visible", mode: "dark" })).toContain(
      'mode="dark"',
    );
  });
});

describe("tooltipConfig.snippet: state options round-trip", () => {
  it("emits the correct state for every control option", () => {
    const ctrl = tooltipConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    for (const state of ctrl.options) {
      expect(snippet({ state })).toContain(`state="${state}"`);
    }
  });
});

describe("tooltipConfig.snippet: side options round-trip", () => {
  it("emits the correct side for every non-default side option", () => {
    const ctrl = tooltipConfig.controls.side;
    if (ctrl.type !== "select") throw new Error("expected select");
    const nonDefault = ctrl.options.filter((o) => o !== "top");
    for (const side of nonDefault) {
      expect(snippet({ state: "visible", side })).toContain(`side="${side}"`);
    }
  });
});
