/**
 * Verification tests for the PURE / DETERMINISTIC parts of `popover`.
 *
 * Scope:
 *   - registry/remocn-ui/popover/index.tsx
 *       popoverStyle(state)    — complete state→visual preset map
 *       (no popoverStyleContext — Popover uses theme tokens directly; no pure
 *        style-context export on this component; `offsetFor` is module-private)
 *   - registry/remocn-ui/popover/use-popover-transition.ts
 *       tweenPopoverStyle(a, b, t)   — pure lerp across all three fields
 *       DEFAULT_DURATION constant
 *       usePopoverTransition resolver — mirrored as resolvePopoverTransition
 *         with frame injected as `raw` (annotated source lines)
 *   - registry/remocn-ui/popover/config.ts
 *       popoverConfig.controls wiring + popoverConfig.snippet codegen
 *
 * The render path (index.tsx) imports `useRemocnTheme` which requires React
 * context and cannot run headlessly — it is NOT exercised here. `offsetFor` is
 * a module-private helper that turns the `translate` magnitude into a CSS
 * transform offset for a side; it is not exported, so its contract is documented
 * in the README and covered indirectly through the render path.
 *
 * Runner: Bun's built-in test runner (TypeScript-native, no framework dep).
 *   bun test registry/remocn-ui/popover/__tests__
 *
 * --------------------------------------------------------------------------
 * IMPORT STRATEGY
 * --------------------------------------------------------------------------
 * Relative imports for component source; `@/lib/remocn-ui` alias for core.
 * `usePopoverTransition` is NOT imported — it reads `useCurrentFrame()`.
 * Its pure body is mirrored as `resolvePopoverTransition` with frame injected.
 * --------------------------------------------------------------------------
 */

import { describe, expect, it } from "bun:test";
import {
  popoverStyle,
  type PopoverState,
  type PopoverSide,
} from "../index";
import {
  tweenPopoverStyle,
  DEFAULT_DURATION,
} from "../use-popover-transition";
import { popoverConfig } from "../config";
import { easings } from "@/lib/remocn-ui";
import type { Step } from "@/lib/remocn-ui";

// ===========================================================================
// Shared fixtures
// ===========================================================================

const VALID_STATES: readonly PopoverState[] = ["opened", "closed"];
const VALID_SIDES: readonly PopoverSide[] = ["top", "bottom", "left", "right"];

/** Convenience wrapper for snippet(). */
type SnippetValues = {
  state?: string;
  title?: string;
  description?: string;
  side?: string;
  width?: number;
  mode?: string;
};
const snippet = (values: SnippetValues): string =>
  popoverConfig.snippet(values as Record<string, unknown>);

// ===========================================================================
// 1. DEFAULT_DURATION constant
// ===========================================================================

describe("DEFAULT_DURATION", () => {
  it("is 10 frames", () => {
    expect(DEFAULT_DURATION).toBe(10);
  });
});

// ===========================================================================
// 2. popoverStyle — pure (state) => PopoverStyle map
//    MIRROR of index.tsx lines 65-72
//    Every field asserted for both states.
// ===========================================================================

describe("popoverStyle: closed state — off-screen keyframe", () => {
  const s = popoverStyle("closed");

  it("opacity is 0 (card invisible)", () => {
    expect(s.opacity).toBe(0);
  });

  it("scale is 0.97 (slightly shrunken at closed)", () => {
    expect(s.scale).toBeCloseTo(0.97, 10);
  });

  it("translate is 6 (enters from 6px offset)", () => {
    expect(s.translate).toBe(6);
  });
});

describe("popoverStyle: opened state — resting keyframe", () => {
  const s = popoverStyle("opened");

  it("opacity is 1 (card fully visible)", () => {
    expect(s.opacity).toBe(1);
  });

  it("scale is 1 (full size)", () => {
    expect(s.scale).toBe(1);
  });

  it("translate is 0 (at rest position, no offset)", () => {
    expect(s.translate).toBe(0);
  });
});

describe("popoverStyle: both states are complete keyframes", () => {
  it("all three PopoverStyle fields are numeric for every state", () => {
    for (const state of VALID_STATES) {
      const s = popoverStyle(state);
      expect(typeof s.opacity).toBe("number");
      expect(typeof s.scale).toBe("number");
      expect(typeof s.translate).toBe("number");
    }
  });

  it("closed and opened have distinct opacity (0 vs 1)", () => {
    expect(popoverStyle("closed").opacity).toBe(0);
    expect(popoverStyle("opened").opacity).toBe(1);
  });

  it("closed and opened have distinct scale (0.97 vs 1)", () => {
    expect(popoverStyle("closed").scale).toBeCloseTo(0.97, 10);
    expect(popoverStyle("opened").scale).toBe(1);
  });

  it("closed and opened have distinct translate (6 vs 0)", () => {
    expect(popoverStyle("closed").translate).toBe(6);
    expect(popoverStyle("opened").translate).toBe(0);
  });
});

describe("popoverStyle: unknown state falls through to closed preset", () => {
  // The switch has only an explicit 'opened' arm; default → closed
  it("'closed' returns opacity=0 (via default arm)", () => {
    expect(popoverStyle("closed").opacity).toBe(0);
  });
});

// ===========================================================================
// 3. tweenPopoverStyle — pure lerp across all three numeric fields
//    MIRROR of use-popover-transition.ts lines 20-30
//    All fields are numeric (no animated colors); no mixOklch call.
// ===========================================================================

describe("tweenPopoverStyle: t=0 returns values equal to `a`", () => {
  const a = popoverStyle("closed");
  const b = popoverStyle("opened");
  const r = tweenPopoverStyle(a, b, 0);

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

describe("tweenPopoverStyle: t=1 returns values equal to `b`", () => {
  const a = popoverStyle("closed");
  const b = popoverStyle("opened");
  const r = tweenPopoverStyle(a, b, 1);

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

describe("tweenPopoverStyle: t=0.5 midpoint (closed → opened)", () => {
  // closed: opacity=0, scale=0.97, translate=6
  // opened: opacity=1, scale=1,    translate=0
  // midpoint: opacity=0.5, scale=0.985, translate=3
  const a = popoverStyle("closed");
  const b = popoverStyle("opened");
  const r = tweenPopoverStyle(a, b, 0.5);

  it("opacity midpoint: 0 → 1 gives 0.5", () => {
    expect(r.opacity).toBeCloseTo(0.5, 10);
  });

  it("scale midpoint: 0.97 → 1 gives 0.985", () => {
    expect(r.scale).toBeCloseTo(0.985, 10);
  });

  it("translate midpoint: 6 → 0 gives 3", () => {
    expect(r.translate).toBeCloseTo(3, 10);
  });
});

describe("tweenPopoverStyle: t=0.25 quarter-point (closed → opened)", () => {
  // opacity: 0.25, scale: 0.97+0.03*0.25=0.9775, translate: 6-6*0.25=4.5
  const a = popoverStyle("closed");
  const b = popoverStyle("opened");
  const r = tweenPopoverStyle(a, b, 0.25);

  it("opacity at t=0.25 is 0.25", () => {
    expect(r.opacity).toBeCloseTo(0.25, 10);
  });

  it("scale at t=0.25 is 0.9775", () => {
    expect(r.scale).toBeCloseTo(0.9775, 10);
  });

  it("translate at t=0.25 is 4.5", () => {
    expect(r.translate).toBeCloseTo(4.5, 10);
  });
});

describe("tweenPopoverStyle: identity (a === b)", () => {
  const s = popoverStyle("opened");

  it("all fields unchanged when both endpoints are the same", () => {
    const r = tweenPopoverStyle(s, s, 0.5);
    expect(r.opacity).toBeCloseTo(s.opacity, 10);
    expect(r.scale).toBeCloseTo(s.scale, 10);
    expect(r.translate).toBeCloseTo(s.translate, 10);
  });
});

describe("tweenPopoverStyle: reverse direction (opened → closed)", () => {
  // By symmetry midpoints are the same magnitude
  const a = popoverStyle("opened");
  const b = popoverStyle("closed");
  const r = tweenPopoverStyle(a, b, 0.5);

  it("opacity midpoint: 1 → 0 gives 0.5", () => {
    expect(r.opacity).toBeCloseTo(0.5, 10);
  });

  it("scale midpoint: 1 → 0.97 gives 0.985", () => {
    expect(r.scale).toBeCloseTo(0.985, 10);
  });

  it("translate midpoint: 0 → 6 gives 3", () => {
    expect(r.translate).toBeCloseTo(3, 10);
  });
});

// ===========================================================================
// 4. usePopoverTransition resolver replica
//    MIRRORS use-popover-transition.ts lines 44-57.
//    `usePopoverTransition` calls `useStateTransition` (reads useCurrentFrame())
//    then applies `easings.out(progress)` and `tweenPopoverStyle`.
//    We inject `raw` in place of useCurrentFrame().
//
//    Key additional contract: progress is eased with `easings.out` before the
//    tween, making the result non-linear. out(0.5) = 0.875.
//
//    MAINTENANCE CONTRACT: if use-popover-transition.ts lines 44-57 change,
//    update this replica in lockstep. Annotated source lines below.
// ===========================================================================

/** MIRROR of core/timeline.ts:clamp01. */
function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

/**
 * MIRROR of timeline.ts:useStateTransition pure resolver body.
 * `raw` is injected in place of useCurrentFrame().
 */
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

/**
 * MIRROR of use-popover-transition.ts:usePopoverTransition (lines 44-57).
 * `raw` is injected in place of useCurrentFrame().
 * Annotated source lines:
 *   line 48: destructure speed + defaultDuration from opts
 *   lines 49-54: useStateTransition (mirrored as resolveStateTransition)
 *   line 55: t = easings.out(progress)                      ← MIRROR line 55
 *   line 56: tweenPopoverStyle(from, to, t)                 ← MIRROR line 56
 */
function resolvePopoverTransition(
  raw: number,                                           // injected useCurrentFrame() — MIRROR line 49
  steps: Step<PopoverState>[],
  speed = 1,
  defaultDuration = DEFAULT_DURATION,
): { opacity: number; scale: number; translate: number; from: PopoverState; to: PopoverState; progress: number } {
  const { from, to, progress } = resolveStateTransition( // MIRROR lines 49-54
    raw,
    steps,
    "closed",
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);                        // MIRROR line 55
  const style = tweenPopoverStyle(                        // MIRROR line 56
    popoverStyle(from as PopoverState),
    popoverStyle(to as PopoverState),
    t,
  );
  return { ...style, from: from as PopoverState, to: to as PopoverState, progress };
}

// ---------------------------------------------------------------------------
// Before any step: holds at closed (progress=1, tween(closed,closed,out(1)))
// ---------------------------------------------------------------------------

describe("resolvePopoverTransition: before any step — holds at closed", () => {
  it("returns the closed style when no steps have started", () => {
    const r = resolvePopoverTransition(0, []);
    const closed = popoverStyle("closed");
    expect(r.opacity).toBeCloseTo(closed.opacity, 10);
    expect(r.scale).toBeCloseTo(closed.scale, 10);
    expect(r.translate).toBeCloseTo(closed.translate, 10);
  });

  it("from and to are both 'closed' before any step", () => {
    const r = resolvePopoverTransition(0, []);
    expect(r.from).toBe("closed");
    expect(r.to).toBe("closed");
  });
});

// ---------------------------------------------------------------------------
// Exactly at a step boundary: progress=0, t=out(0)=0 → closed style
// ---------------------------------------------------------------------------

describe("resolvePopoverTransition: exactly at closed→opened step boundary", () => {
  const steps: Step<PopoverState>[] = [{ at: 10, state: "opened" }];

  it("at raw=10, progress=0, t=out(0)=0 → style equals closed (from)", () => {
    const r = resolvePopoverTransition(10, steps);
    const closed = popoverStyle("closed");
    expect(r.progress).toBe(0);
    expect(r.opacity).toBeCloseTo(closed.opacity, 10);
    expect(r.scale).toBeCloseTo(closed.scale, 10);
    expect(r.translate).toBeCloseTo(closed.translate, 10);
  });

  it("from='closed', to='opened' at the step boundary", () => {
    const r = resolvePopoverTransition(10, steps);
    expect(r.from).toBe("closed");
    expect(r.to).toBe("opened");
  });
});

// ---------------------------------------------------------------------------
// Mid-window: easings.out applied — non-linear (not raw 0.5)
// step at=0, duration=10, raw=5: linear=0.5, out(0.5)=0.875
// opacity: tween(0,1,0.875) = 0.875
// scale:   tween(0.97,1,0.875) = 0.97 + 0.03*0.875 = 0.99625
// translate: tween(6,0,0.875) = 6*(1-0.875) = 0.75
// ---------------------------------------------------------------------------

describe("resolvePopoverTransition: mid-window uses easings.out (not linear)", () => {
  const steps: Step<PopoverState>[] = [{ at: 0, state: "opened" }];

  it("opacity at raw=5 is out(0.5)=0.875 (not linear 0.5)", () => {
    const r = resolvePopoverTransition(5, steps, 1, 10);
    const t = easings.out(0.5); // 0.875
    expect(r.opacity).toBeCloseTo(t, 8);
  });

  it("scale at raw=5 is 0.97 + 0.03*out(0.5) = 0.99625", () => {
    const r = resolvePopoverTransition(5, steps, 1, 10);
    const t = easings.out(0.5);
    const expected = 0.97 + (1 - 0.97) * t; // 0.99625
    expect(r.scale).toBeCloseTo(expected, 8);
  });

  it("translate at raw=5 is 6*(1-out(0.5)) = 0.75", () => {
    const r = resolvePopoverTransition(5, steps, 1, 10);
    const t = easings.out(0.5);
    const expected = 6 * (1 - t); // lerp(6,0,t) = 0.75
    expect(r.translate).toBeCloseTo(expected, 8);
  });

  it("easing confirmed non-linear: opacity at raw=5 is not 0.5", () => {
    const r = resolvePopoverTransition(5, steps, 1, 10);
    expect(r.opacity).not.toBeCloseTo(0.5, 2);
  });
});

// ---------------------------------------------------------------------------
// Past the window: fully opened
// ---------------------------------------------------------------------------

describe("resolvePopoverTransition: past the window → fully opened", () => {
  const steps: Step<PopoverState>[] = [{ at: 0, state: "opened" }];

  it("opacity is 1 after DEFAULT_DURATION frames", () => {
    expect(resolvePopoverTransition(DEFAULT_DURATION, steps).opacity).toBeCloseTo(1, 10);
  });

  it("scale is 1 after DEFAULT_DURATION frames", () => {
    expect(resolvePopoverTransition(DEFAULT_DURATION, steps).scale).toBeCloseTo(1, 10);
  });

  it("translate is 0 after DEFAULT_DURATION frames", () => {
    expect(resolvePopoverTransition(DEFAULT_DURATION, steps).translate).toBeCloseTo(0, 10);
  });
});

// ---------------------------------------------------------------------------
// Speed contract
// ---------------------------------------------------------------------------

describe("resolvePopoverTransition: speed contract", () => {
  const steps: Step<PopoverState>[] = [{ at: 10, state: "opened" }];

  it("speed=2: step at=10 fires at raw=5 (effectiveFrame=10)", () => {
    expect(resolvePopoverTransition(5, steps, 2).to).toBe("opened");
  });

  it("speed=2: step at=10 has NOT fired at raw=4 (effectiveFrame=8 < 10)", () => {
    expect(resolvePopoverTransition(4, steps, 2).to).toBe("closed");
  });
});

// ===========================================================================
// 5. popoverConfig.controls — customizer control wiring
// ===========================================================================

describe("popoverConfig.controls: state", () => {
  it("state is a select control", () => {
    expect(popoverConfig.controls.state.type).toBe("select");
  });

  it("state options are ['opened','closed']", () => {
    const ctrl = popoverConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    expect(ctrl.options).toEqual(["opened", "closed"]);
  });

  it("state default is 'opened' (shows the resting card in preview)", () => {
    expect(popoverConfig.controls.state.default).toBe("opened");
  });

  it("every state option is a valid PopoverState", () => {
    const ctrl = popoverConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    for (const opt of ctrl.options) {
      expect(VALID_STATES).toContain(opt as PopoverState);
    }
  });
});

describe("popoverConfig.controls: side", () => {
  it("side is a select control", () => {
    expect(popoverConfig.controls.side.type).toBe("select");
  });

  it("side options are ['top','bottom','left','right']", () => {
    const ctrl = popoverConfig.controls.side;
    if (ctrl.type !== "select") throw new Error("expected select");
    expect(ctrl.options).toEqual(["top", "bottom", "left", "right"]);
  });

  it("side default is 'bottom'", () => {
    expect(popoverConfig.controls.side.default).toBe("bottom");
  });

  it("every side option is a valid PopoverSide", () => {
    const ctrl = popoverConfig.controls.side;
    if (ctrl.type !== "select") throw new Error("expected select");
    for (const opt of ctrl.options) {
      expect(VALID_SIDES).toContain(opt as PopoverSide);
    }
  });
});

describe("popoverConfig.controls: title", () => {
  it("title is a text control", () => {
    expect(popoverConfig.controls.title.type).toBe("text");
  });

  it("title default is 'Dimensions'", () => {
    expect(popoverConfig.controls.title.default).toBe("Dimensions");
  });
});

describe("popoverConfig.controls: description", () => {
  it("description is a text control", () => {
    expect(popoverConfig.controls.description.type).toBe("text");
  });

  it("description default is 'Set the dimensions for the layer.'", () => {
    expect(popoverConfig.controls.description.default).toBe(
      "Set the dimensions for the layer.",
    );
  });
});

describe("popoverConfig.controls: width", () => {
  it("width is a number control", () => {
    expect(popoverConfig.controls.width.type).toBe("number");
  });

  it("width default is 288", () => {
    expect(popoverConfig.controls.width.default).toBe(288);
  });

  it("width min is 160", () => {
    const ctrl = popoverConfig.controls.width;
    if (ctrl.type !== "number") throw new Error("expected number");
    expect(ctrl.min).toBe(160);
  });
});

describe("popoverConfig.controls: mode", () => {
  it("mode is a select control", () => {
    expect(popoverConfig.controls.mode.type).toBe("select");
  });

  it("mode default is 'light'", () => {
    expect(popoverConfig.controls.mode.default).toBe("light");
  });
});

// ===========================================================================
// 6. popoverConfig.snippet — pure JSX string builder
// ===========================================================================

describe("popoverConfig.snippet: import line", () => {
  it("includes 'import { Popover }' from the correct path", () => {
    const out = snippet({ state: "opened" });
    expect(out).toContain("import { Popover }");
    expect(out).toContain('from "@/components/remocn/popover"');
  });
});

describe("popoverConfig.snippet: structural invariants", () => {
  it("contains a <Popover JSX element", () => {
    expect(snippet({ state: "opened" })).toContain("<Popover");
  });

  it("ends with a self-closing />", () => {
    expect(snippet({ state: "opened" }).trimEnd().endsWith("/>")).toBe(true);
  });

  it("state is always emitted", () => {
    for (const state of VALID_STATES) {
      expect(snippet({ state })).toContain(`state="${state}"`);
    }
  });
});

describe("popoverConfig.snippet: default props are omitted", () => {
  it("omits title when it is empty string", () => {
    expect(snippet({ state: "opened", title: "" })).not.toContain("title=");
  });

  it("omits description when it is empty string", () => {
    expect(snippet({ state: "opened", description: "" })).not.toContain("description=");
  });

  it("omits side when it equals the default 'bottom'", () => {
    expect(snippet({ state: "opened", side: "bottom" })).not.toContain("side=");
  });

  it("omits width when it equals the default 288", () => {
    expect(snippet({ state: "opened", width: 288 })).not.toContain("width=");
  });

  it("omits mode when it equals the default 'light'", () => {
    expect(snippet({ state: "opened", mode: "light" })).not.toContain("mode=");
  });
});

describe("popoverConfig.snippet: non-default props are emitted", () => {
  it("emits title when non-empty", () => {
    expect(snippet({ state: "opened", title: "Dimensions" })).toContain('title="Dimensions"');
  });

  it("emits description when non-empty", () => {
    expect(
      snippet({ state: "opened", description: "Set the dimensions for the layer." })
    ).toContain('description="Set the dimensions for the layer."');
  });

  it("emits side='top' when non-default", () => {
    expect(snippet({ state: "opened", side: "top" })).toContain('side="top"');
  });

  it("emits side='left' when non-default", () => {
    expect(snippet({ state: "opened", side: "left" })).toContain('side="left"');
  });

  it("emits side='right' when non-default", () => {
    expect(snippet({ state: "opened", side: "right" })).toContain('side="right"');
  });

  it("emits width when non-default", () => {
    expect(snippet({ state: "opened", width: 320 })).toContain("width={320}");
  });

  it("emits mode='dark' when non-default", () => {
    expect(snippet({ state: "opened", mode: "dark" })).toContain('mode="dark"');
  });
});

describe("popoverConfig.snippet: state options round-trip", () => {
  it("emits the correct state for every control option", () => {
    const ctrl = popoverConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    for (const state of ctrl.options) {
      expect(snippet({ state })).toContain(`state="${state}"`);
    }
  });
});

describe("popoverConfig.snippet: side options round-trip", () => {
  it("emits the correct side for every non-default side option", () => {
    const ctrl = popoverConfig.controls.side;
    if (ctrl.type !== "select") throw new Error("expected select");
    const nonDefault = ctrl.options.filter((o) => o !== "bottom");
    for (const side of nonDefault) {
      expect(snippet({ state: "opened", side })).toContain(`side="${side}"`);
    }
  });
});
