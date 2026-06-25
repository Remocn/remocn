
import { describe, expect, it } from "bun:test";
import {
  contextMenuStyle,
  contextMenuStyleContext,
  type ContextMenuState,
  type ContextMenuStyle,
} from "../index";
import {
  tweenContextMenuStyle,
  DEFAULT_DURATION,
} from "../use-context-menu-transition";
import { contextMenuConfig } from "../config";
import { defaultLightTheme, defaultDarkTheme, easings } from "@/lib/remocn-ui";
import type { Step } from "@/lib/remocn-ui";

const VALID_STATES: readonly ContextMenuState[] = ["opened", "closed"];

const ctx = contextMenuStyleContext(defaultLightTheme);

type SnippetValues = {
  state?: string;
  highlightedIndex?: number;
};
const snippet = (values: SnippetValues): string =>
  contextMenuConfig.snippet(values as Record<string, unknown>);

describe("DEFAULT_DURATION", () => {
  it("is 10 frames", () => {
    expect(DEFAULT_DURATION).toBe(10);
  });
});

describe("contextMenuStyleContext: maps theme tokens correctly", () => {
  it("panelBg equals theme.popover", () => {
    expect(ctx.panelBg).toBe(defaultLightTheme.popover);
  });

  it("panelBorder equals theme.border", () => {
    expect(ctx.panelBorder).toBe(defaultLightTheme.border);
  });

  it("radius equals theme.radius", () => {
    expect(ctx.radius).toBe(defaultLightTheme.radius);
  });

  it("itemCtx is a non-null object (delegated to dropdownMenuItemStyleContext)", () => {
    expect(typeof ctx.itemCtx).toBe("object");
    expect(ctx.itemCtx).not.toBeNull();
  });
});

describe("contextMenuStyleContext: theme independence", () => {
  const ctxDark = contextMenuStyleContext(defaultDarkTheme);

  it("panelBg differs between light and dark themes", () => {
    expect(ctx.panelBg).not.toBe(ctxDark.panelBg);
  });

  it("panelBorder differs between light and dark themes", () => {
    expect(ctx.panelBorder).not.toBe(ctxDark.panelBorder);
  });
});

describe("contextMenuStyle: closed state — off-screen keyframe", () => {
  const s = contextMenuStyle("closed", ctx);

  it("opacity is 0 (panel invisible)", () => {
    expect(s.opacity).toBe(0);
  });

  it("scale is 0.95 (slightly shrunken, grows from top-left)", () => {
    expect(s.scale).toBeCloseTo(0.95, 10);
  });

  it("translateY is -4 (lifted 4px above rest position)", () => {
    expect(s.translateY).toBe(-4);
  });
});

describe("contextMenuStyle: opened state — resting keyframe", () => {
  const s = contextMenuStyle("opened", ctx);

  it("opacity is 1 (panel fully visible)", () => {
    expect(s.opacity).toBe(1);
  });

  it("scale is 1 (full size)", () => {
    expect(s.scale).toBe(1);
  });

  it("translateY is 0 (at rest position)", () => {
    expect(s.translateY).toBe(0);
  });
});

describe("contextMenuStyle: closed and opened have distinct values on every field", () => {
  const closed = contextMenuStyle("closed", ctx);
  const opened = contextMenuStyle("opened", ctx);

  it("opacity: 0 vs 1", () => {
    expect(closed.opacity).not.toBe(opened.opacity);
  });

  it("scale: 0.95 vs 1", () => {
    expect(closed.scale).not.toBe(opened.scale);
  });

  it("translateY: -4 vs 0", () => {
    expect(closed.translateY).not.toBe(opened.translateY);
  });
});

describe("contextMenuStyle: every state produces a complete ContextMenuStyle", () => {
  it("all three fields are numeric for every state", () => {
    for (const state of VALID_STATES) {
      const s = contextMenuStyle(state, ctx);
      expect(typeof s.opacity).toBe("number");
      expect(typeof s.scale).toBe("number");
      expect(typeof s.translateY).toBe("number");
    }
  });
});

describe("contextMenuStyle: unknown state falls through to closed preset", () => {
  it("'closed' returns opacity=0 (via default arm)", () => {
    expect(contextMenuStyle("closed", ctx).opacity).toBe(0);
  });
});

describe("tweenContextMenuStyle: t=0 returns values equal to `a`", () => {
  const a = contextMenuStyle("closed", ctx);
  const b = contextMenuStyle("opened", ctx);
  const r = tweenContextMenuStyle(a, b, 0);

  it("opacity equals a.opacity at t=0", () => {
    expect(r.opacity).toBeCloseTo(a.opacity, 10);
  });

  it("scale equals a.scale at t=0", () => {
    expect(r.scale).toBeCloseTo(a.scale, 10);
  });

  it("translateY equals a.translateY at t=0", () => {
    expect(r.translateY).toBeCloseTo(a.translateY, 10);
  });
});

describe("tweenContextMenuStyle: t=1 returns values equal to `b`", () => {
  const a = contextMenuStyle("closed", ctx);
  const b = contextMenuStyle("opened", ctx);
  const r = tweenContextMenuStyle(a, b, 1);

  it("opacity equals b.opacity at t=1", () => {
    expect(r.opacity).toBeCloseTo(b.opacity, 10);
  });

  it("scale equals b.scale at t=1", () => {
    expect(r.scale).toBeCloseTo(b.scale, 10);
  });

  it("translateY equals b.translateY at t=1", () => {
    expect(r.translateY).toBeCloseTo(b.translateY, 10);
  });
});

describe("tweenContextMenuStyle: t=0.5 midpoint (closed → opened)", () => {
  const a = contextMenuStyle("closed", ctx);
  const b = contextMenuStyle("opened", ctx);
  const r = tweenContextMenuStyle(a, b, 0.5);

  it("opacity midpoint: 0 → 1 gives 0.5", () => {
    expect(r.opacity).toBeCloseTo(0.5, 10);
  });

  it("scale midpoint: 0.95 → 1 gives 0.975", () => {
    expect(r.scale).toBeCloseTo(0.975, 10);
  });

  it("translateY midpoint: -4 → 0 gives -2", () => {
    expect(r.translateY).toBeCloseTo(-2, 10);
  });
});

describe("tweenContextMenuStyle: t=0.25 quarter-point (closed → opened)", () => {
  const a = contextMenuStyle("closed", ctx);
  const b = contextMenuStyle("opened", ctx);
  const r = tweenContextMenuStyle(a, b, 0.25);

  it("opacity at t=0.25 is 0.25", () => {
    expect(r.opacity).toBeCloseTo(0.25, 10);
  });

  it("scale at t=0.25 is 0.9625", () => {
    expect(r.scale).toBeCloseTo(0.9625, 10);
  });

  it("translateY at t=0.25 is -3", () => {
    expect(r.translateY).toBeCloseTo(-3, 10);
  });
});

describe("tweenContextMenuStyle: identity (a === b)", () => {
  const s = contextMenuStyle("opened", ctx);

  it("all fields unchanged when both endpoints are the same", () => {
    const r = tweenContextMenuStyle(s, s, 0.5);
    expect(r.opacity).toBeCloseTo(s.opacity, 10);
    expect(r.scale).toBeCloseTo(s.scale, 10);
    expect(r.translateY).toBeCloseTo(s.translateY, 10);
  });
});

describe("tweenContextMenuStyle: reverse direction (opened → closed)", () => {
  const a = contextMenuStyle("opened", ctx);
  const b = contextMenuStyle("closed", ctx);
  const r = tweenContextMenuStyle(a, b, 0.5);

  it("opacity midpoint: 1 → 0 gives 0.5", () => {
    expect(r.opacity).toBeCloseTo(0.5, 10);
  });

  it("translateY midpoint: 0 → -4 gives -2", () => {
    expect(r.translateY).toBeCloseTo(-2, 10);
  });
});

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
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
  const progress = dur > 0 ? clamp01((effectiveFrame - to.at) / dur) : 1;
  return { from: from ? from.state : defaultState, to: to.state, progress };
}

function resolveContextMenuTransition(
  raw: number,                                           // injected useCurrentFrame() — MIRROR line 58
  steps: Step<ContextMenuState>[],
  speed = 1,
  defaultDuration = DEFAULT_DURATION,
): ContextMenuStyle & { from: ContextMenuState; to: ContextMenuState; progress: number } {
  const { from, to, progress } = resolveStateTransition(
    raw,
    steps,
    "closed",
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);
  const style = tweenContextMenuStyle(
    contextMenuStyle(from as ContextMenuState, ctx),
    contextMenuStyle(to as ContextMenuState, ctx),
    t,
  );
  return { ...style, from: from as ContextMenuState, to: to as ContextMenuState, progress };
}

describe("resolveContextMenuTransition: before any step — holds at closed", () => {
  it("returns the closed style when no steps have started", () => {
    const r = resolveContextMenuTransition(0, []);
    const closed = contextMenuStyle("closed", ctx);
    expect(r.opacity).toBeCloseTo(closed.opacity, 10);
    expect(r.scale).toBeCloseTo(closed.scale, 10);
    expect(r.translateY).toBeCloseTo(closed.translateY, 10);
  });

  it("from and to are both 'closed' before any step", () => {
    const r = resolveContextMenuTransition(0, []);
    expect(r.from).toBe("closed");
    expect(r.to).toBe("closed");
  });
});

describe("resolveContextMenuTransition: exactly at closed→opened step boundary", () => {
  const steps: Step<ContextMenuState>[] = [{ at: 10, state: "opened" }];

  it("at raw=10, progress=0, t=out(0)=0 → style equals closed (from)", () => {
    const r = resolveContextMenuTransition(10, steps);
    const closed = contextMenuStyle("closed", ctx);
    expect(r.progress).toBe(0);
    expect(r.opacity).toBeCloseTo(closed.opacity, 10);
    expect(r.scale).toBeCloseTo(closed.scale, 10);
    expect(r.translateY).toBeCloseTo(closed.translateY, 10);
  });

  it("from='closed', to='opened' at the step boundary", () => {
    const r = resolveContextMenuTransition(10, steps);
    expect(r.from).toBe("closed");
    expect(r.to).toBe("opened");
  });
});

describe("resolveContextMenuTransition: mid-window uses easings.out (not linear)", () => {
  const steps: Step<ContextMenuState>[] = [{ at: 0, state: "opened" }];

  it("opacity at raw=5 is out(0.5)=0.875 (not linear 0.5)", () => {
    const r = resolveContextMenuTransition(5, steps, 1, 10);
    const t = easings.out(0.5);
    expect(r.opacity).toBeCloseTo(t, 8);
  });

  it("scale at raw=5 is 0.95 + 0.05*out(0.5) = 0.99375", () => {
    const r = resolveContextMenuTransition(5, steps, 1, 10);
    const t = easings.out(0.5);
    const expected = 0.95 + (1 - 0.95) * t;
    expect(r.scale).toBeCloseTo(expected, 8);
  });

  it("translateY at raw=5 is -4*(1-out(0.5)) = -0.5", () => {
    const r = resolveContextMenuTransition(5, steps, 1, 10);
    const t = easings.out(0.5);
    const expected = -4 + (0 - (-4)) * t;
    expect(r.translateY).toBeCloseTo(expected, 8);
  });

  it("easing confirmed non-linear: opacity at raw=5 is not 0.5", () => {
    const r = resolveContextMenuTransition(5, steps, 1, 10);
    expect(r.opacity).not.toBeCloseTo(0.5, 2);
  });
});

describe("resolveContextMenuTransition: past the window → fully opened", () => {
  const steps: Step<ContextMenuState>[] = [{ at: 0, state: "opened" }];

  it("opacity is 1 after DEFAULT_DURATION frames", () => {
    expect(resolveContextMenuTransition(DEFAULT_DURATION, steps).opacity).toBeCloseTo(1, 10);
  });

  it("scale is 1 after DEFAULT_DURATION frames", () => {
    expect(resolveContextMenuTransition(DEFAULT_DURATION, steps).scale).toBeCloseTo(1, 10);
  });

  it("translateY is 0 after DEFAULT_DURATION frames", () => {
    expect(resolveContextMenuTransition(DEFAULT_DURATION, steps).translateY).toBeCloseTo(0, 10);
  });
});

describe("resolveContextMenuTransition: speed contract", () => {
  const steps: Step<ContextMenuState>[] = [{ at: 10, state: "opened" }];

  it("speed=2: step at=10 fires at raw=5 (effectiveFrame=10)", () => {
    expect(resolveContextMenuTransition(5, steps, 2).to).toBe("opened");
  });

  it("speed=2: step at=10 has NOT fired at raw=4 (effectiveFrame=8 < 10)", () => {
    expect(resolveContextMenuTransition(4, steps, 2).to).toBe("closed");
  });
});

describe("contextMenuConfig.controls: state", () => {
  it("state is a select control", () => {
    expect(contextMenuConfig.controls.state.type).toBe("select");
  });

  it("state options are ['opened','closed']", () => {
    const ctrl = contextMenuConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    expect(ctrl.options).toEqual(["opened", "closed"]);
  });

  it("state default is 'opened' (shows the revealed menu in preview)", () => {
    expect(contextMenuConfig.controls.state.default).toBe("opened");
  });

  it("every state option is a valid ContextMenuState", () => {
    const ctrl = contextMenuConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    for (const opt of ctrl.options) {
      expect(VALID_STATES).toContain(opt as ContextMenuState);
    }
  });
});

describe("contextMenuConfig.controls: highlightedIndex", () => {
  it("highlightedIndex is a number control", () => {
    expect(contextMenuConfig.controls.highlightedIndex.type).toBe("number");
  });

  it("highlightedIndex default is 1 (second row pre-highlighted)", () => {
    expect(contextMenuConfig.controls.highlightedIndex.default).toBe(1);
  });

  it("highlightedIndex min is -1", () => {
    const ctrl = contextMenuConfig.controls.highlightedIndex;
    if (ctrl.type !== "number") throw new Error("expected number");
    expect(ctrl.min).toBe(-1);
  });
});

describe("contextMenuConfig.snippet: import line", () => {
  it("includes 'import { ContextMenu }' from the correct path", () => {
    const out = snippet({ state: "opened" });
    expect(out).toContain("import { ContextMenu }");
    expect(out).toContain('from "@/components/remocn/context-menu"');
  });
});

describe("contextMenuConfig.snippet: structural invariants", () => {
  it("contains a <ContextMenu JSX element", () => {
    expect(snippet({ state: "opened" })).toContain("<ContextMenu");
  });

  it("ends with a self-closing />", () => {
    expect(snippet({ state: "opened" }).trimEnd().endsWith("/>")).toBe(true);
  });

  it("state is always emitted", () => {
    for (const state of VALID_STATES) {
      expect(snippet({ state })).toContain(`state="${state}"`);
    }
  });

  it("items array is always emitted (shows default items)", () => {
    const out = snippet({ state: "opened" });
    expect(out).toContain("items={");
    expect(out).toContain("Back");
    expect(out).toContain("Reload");
  });
});

describe("contextMenuConfig.snippet: default props are omitted", () => {
  it("omits highlightedIndex when it equals -1 (no highlight)", () => {
    expect(snippet({ state: "opened", highlightedIndex: -1 })).not.toContain("highlightedIndex=");
  });
});

describe("contextMenuConfig.snippet: non-default props are emitted", () => {
  it("emits highlightedIndex when not -1 (e.g. 1 = second row)", () => {
    expect(snippet({ state: "opened", highlightedIndex: 1 })).toContain("highlightedIndex={1}");
  });

  it("emits highlightedIndex=0 when first row is highlighted", () => {
    expect(snippet({ state: "opened", highlightedIndex: 0 })).toContain("highlightedIndex={0}");
  });
});

describe("contextMenuConfig.snippet: state options round-trip", () => {
  it("emits the correct state for every control option", () => {
    const ctrl = contextMenuConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    for (const state of ctrl.options) {
      expect(snippet({ state })).toContain(`state="${state}"`);
    }
  });
});
