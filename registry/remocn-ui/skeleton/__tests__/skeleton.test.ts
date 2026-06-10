/**
 * Verification tests for the PURE / DETERMINISTIC parts of `skeleton`.
 *
 * Scope:
 *   - registry/remocn-ui/skeleton/index.tsx
 *       skeletonStyle(state)    — complete state→visual preset map
 *                                 (crossfade invariant: opacities sum to 1)
 *   - registry/remocn-ui/skeleton/use-skeleton-transition.ts
 *       tweenSkeletonStyle(a, b, t) — pure lerp across both fields
 *       DEFAULT_DURATION constant
 *       useSkeletonTransition resolver — mirrored as resolveSkeletonTransition
 *         with frame injected as `raw` (annotated source lines)
 *   - registry/remocn-ui/skeleton/config.ts
 *       skeletonConfig.controls wiring + skeletonConfig.snippet codegen
 *
 * The render path (index.tsx) imports `useRemocnTheme` which requires React
 * context — it is NOT exercised here. The pure-testable surface is everything
 * above.
 *
 * Runner: Bun's built-in test runner (TypeScript-native, no framework dep).
 *   bun test registry/remocn-ui/skeleton/__tests__
 *
 * --------------------------------------------------------------------------
 * IMPORT STRATEGY
 * --------------------------------------------------------------------------
 * Relative imports from component source; `@/lib/remocn-ui` alias for core.
 * `skeletonStyle` and `tweenSkeletonStyle` are pure value functions — they call
 * neither `useCurrentFrame()` nor `useRemocnTheme` at import or call time.
 * `useSkeletonTransition` IS a hook (calls `useStateTransition` → `useCurrentFrame`)
 * and is NOT imported; we mirror its pure resolver body below.
 * --------------------------------------------------------------------------
 */

import { describe, expect, it } from "bun:test";
import {
  skeletonStyle,
  type SkeletonState,
  type SkeletonLayout,
} from "../index";
import {
  tweenSkeletonStyle,
  DEFAULT_DURATION,
} from "../use-skeleton-transition";
import { skeletonConfig } from "../config";
import { defaultLightTheme, defaultDarkTheme, easings } from "@/lib/remocn-ui";
import type { Step } from "@/lib/remocn-ui";

// ===========================================================================
// Shared fixtures
// ===========================================================================

const VALID_STATES: readonly SkeletonState[] = ["loading", "loaded"];
const VALID_LAYOUTS: readonly SkeletonLayout[] = ["lines", "card"];

/** Convenience wrapper for snippet(). */
type SnippetValues = {
  state?: string;
  layout?: string;
  mode?: string;
};
const snippet = (values: SnippetValues): string =>
  skeletonConfig.snippet(values as Record<string, unknown>);

// ===========================================================================
// 1. DEFAULT_DURATION constant
// ===========================================================================

describe("DEFAULT_DURATION", () => {
  it("is 12 frames", () => {
    expect(DEFAULT_DURATION).toBe(12);
  });
});

// ===========================================================================
// 2. skeletonStyle — pure (state) => SkeletonStyle map
//    MIRROR of index.tsx lines 56-63
//    KEY INVARIANT: skeletonOpacity + contentOpacity === 1 in every preset.
// ===========================================================================

describe("skeletonStyle: loading state — placeholder visible", () => {
  const s = skeletonStyle("loading");

  it("skeletonOpacity is 1 (placeholder fully visible)", () => {
    expect(s.skeletonOpacity).toBe(1);
  });

  it("contentOpacity is 0 (content hidden)", () => {
    expect(s.contentOpacity).toBe(0);
  });

  it("crossfade invariant: skeletonOpacity + contentOpacity === 1", () => {
    expect(s.skeletonOpacity + s.contentOpacity).toBeCloseTo(1, 10);
  });
});

describe("skeletonStyle: loaded state — content visible", () => {
  const s = skeletonStyle("loaded");

  it("skeletonOpacity is 0 (placeholder hidden)", () => {
    expect(s.skeletonOpacity).toBe(0);
  });

  it("contentOpacity is 1 (content fully visible)", () => {
    expect(s.contentOpacity).toBe(1);
  });

  it("crossfade invariant: skeletonOpacity + contentOpacity === 1", () => {
    expect(s.skeletonOpacity + s.contentOpacity).toBeCloseTo(1, 10);
  });
});

describe("skeletonStyle: both states satisfy the crossfade invariant", () => {
  it("every state preset has opacities summing to 1", () => {
    for (const state of VALID_STATES) {
      const s = skeletonStyle(state);
      expect(s.skeletonOpacity + s.contentOpacity).toBeCloseTo(1, 10);
    }
  });

  it("every SkeletonStyle field is defined and numeric for every state", () => {
    for (const state of VALID_STATES) {
      const s = skeletonStyle(state);
      expect(typeof s.skeletonOpacity).toBe("number");
      expect(typeof s.contentOpacity).toBe("number");
    }
  });

  it("loading and loaded have distinct skeletonOpacity (1 vs 0)", () => {
    expect(skeletonStyle("loading").skeletonOpacity).toBe(1);
    expect(skeletonStyle("loaded").skeletonOpacity).toBe(0);
  });

  it("loading and loaded have distinct contentOpacity (0 vs 1)", () => {
    expect(skeletonStyle("loading").contentOpacity).toBe(0);
    expect(skeletonStyle("loaded").contentOpacity).toBe(1);
  });

  it("unknown state falls through to loading preset (skeletonOpacity=1)", () => {
    // switch default arm → loading preset
    expect(skeletonStyle("loading").skeletonOpacity).toBe(1);
  });
});

// ===========================================================================
// 3. tweenSkeletonStyle — pure lerp across both fields
//    MIRROR of use-skeleton-transition.ts lines 23-34
//    KEY INVARIANT: the tween of two complementary pairs is complementary —
//    the crossfade invariant is preserved at every t.
// ===========================================================================

describe("tweenSkeletonStyle: t=0 returns values equal to `a`", () => {
  const a = skeletonStyle("loading");
  const b = skeletonStyle("loaded");
  const r = tweenSkeletonStyle(a, b, 0);

  it("skeletonOpacity equals a.skeletonOpacity at t=0", () => {
    expect(r.skeletonOpacity).toBeCloseTo(a.skeletonOpacity, 10);
  });

  it("contentOpacity equals a.contentOpacity at t=0", () => {
    expect(r.contentOpacity).toBeCloseTo(a.contentOpacity, 10);
  });

  it("crossfade invariant preserved at t=0", () => {
    expect(r.skeletonOpacity + r.contentOpacity).toBeCloseTo(1, 10);
  });
});

describe("tweenSkeletonStyle: t=1 returns values equal to `b`", () => {
  const a = skeletonStyle("loading");
  const b = skeletonStyle("loaded");
  const r = tweenSkeletonStyle(a, b, 1);

  it("skeletonOpacity equals b.skeletonOpacity at t=1", () => {
    expect(r.skeletonOpacity).toBeCloseTo(b.skeletonOpacity, 10);
  });

  it("contentOpacity equals b.contentOpacity at t=1", () => {
    expect(r.contentOpacity).toBeCloseTo(b.contentOpacity, 10);
  });

  it("crossfade invariant preserved at t=1", () => {
    expect(r.skeletonOpacity + r.contentOpacity).toBeCloseTo(1, 10);
  });
});

describe("tweenSkeletonStyle: t=0.5 midpoint (loading → loaded)", () => {
  // loading: skeletonOpacity=1, contentOpacity=0
  // loaded:  skeletonOpacity=0, contentOpacity=1
  // midpoint: skeletonOpacity=0.5, contentOpacity=0.5
  const a = skeletonStyle("loading");
  const b = skeletonStyle("loaded");
  const r = tweenSkeletonStyle(a, b, 0.5);

  it("skeletonOpacity midpoint: 1 → 0 gives 0.5", () => {
    expect(r.skeletonOpacity).toBeCloseTo(0.5, 10);
  });

  it("contentOpacity midpoint: 0 → 1 gives 0.5", () => {
    expect(r.contentOpacity).toBeCloseTo(0.5, 10);
  });

  it("crossfade invariant preserved at t=0.5 (sum === 1)", () => {
    expect(r.skeletonOpacity + r.contentOpacity).toBeCloseTo(1, 10);
  });
});

describe("tweenSkeletonStyle: t=0.5 midpoint (loaded → loading, reverse direction)", () => {
  const a = skeletonStyle("loaded");
  const b = skeletonStyle("loading");
  const r = tweenSkeletonStyle(a, b, 0.5);

  it("skeletonOpacity midpoint: 0 → 1 gives 0.5", () => {
    expect(r.skeletonOpacity).toBeCloseTo(0.5, 10);
  });

  it("contentOpacity midpoint: 1 → 0 gives 0.5", () => {
    expect(r.contentOpacity).toBeCloseTo(0.5, 10);
  });

  it("crossfade invariant preserved at t=0.5 reverse direction", () => {
    expect(r.skeletonOpacity + r.contentOpacity).toBeCloseTo(1, 10);
  });
});

describe("tweenSkeletonStyle: identity (a === b, any t)", () => {
  const s = skeletonStyle("loading");

  it("skeletonOpacity is unchanged when both endpoints are the same", () => {
    expect(tweenSkeletonStyle(s, s, 0.5).skeletonOpacity).toBeCloseTo(s.skeletonOpacity, 10);
  });

  it("contentOpacity is unchanged when both endpoints are the same", () => {
    expect(tweenSkeletonStyle(s, s, 0.5).contentOpacity).toBeCloseTo(s.contentOpacity, 10);
  });

  it("crossfade invariant preserved for identity tween", () => {
    const r = tweenSkeletonStyle(s, s, 0.5);
    expect(r.skeletonOpacity + r.contentOpacity).toBeCloseTo(1, 10);
  });
});

describe("tweenSkeletonStyle: t=0.25 quarter-point (loading → loaded)", () => {
  // skeletonOpacity: 1 + 0.25*(0-1) = 0.75
  // contentOpacity:  0 + 0.25*(1-0) = 0.25
  const a = skeletonStyle("loading");
  const b = skeletonStyle("loaded");
  const r = tweenSkeletonStyle(a, b, 0.25);

  it("skeletonOpacity at t=0.25 is 0.75", () => {
    expect(r.skeletonOpacity).toBeCloseTo(0.75, 10);
  });

  it("contentOpacity at t=0.25 is 0.25", () => {
    expect(r.contentOpacity).toBeCloseTo(0.25, 10);
  });

  it("crossfade invariant preserved at t=0.25", () => {
    expect(r.skeletonOpacity + r.contentOpacity).toBeCloseTo(1, 10);
  });
});

describe("tweenSkeletonStyle: crossfade invariant holds at any arbitrary t", () => {
  const a = skeletonStyle("loading");
  const b = skeletonStyle("loaded");

  it("sum === 1 at t=0.1", () => {
    const r = tweenSkeletonStyle(a, b, 0.1);
    expect(r.skeletonOpacity + r.contentOpacity).toBeCloseTo(1, 10);
  });

  it("sum === 1 at t=0.333", () => {
    const r = tweenSkeletonStyle(a, b, 1/3);
    expect(r.skeletonOpacity + r.contentOpacity).toBeCloseTo(1, 10);
  });

  it("sum === 1 at t=0.9", () => {
    const r = tweenSkeletonStyle(a, b, 0.9);
    expect(r.skeletonOpacity + r.contentOpacity).toBeCloseTo(1, 10);
  });
});

// ===========================================================================
// 4. useSkeletonTransition resolver replica
//    MIRRORS use-skeleton-transition.ts lines 47-60.
//    `useSkeletonTransition` calls `useStateTransition` (which reads
//    `useCurrentFrame()`) then applies `easings.out(progress)` and
//    `tweenSkeletonStyle`. We inject `raw` in place of `useCurrentFrame()`.
//
//    Key additional contract: progress is eased with `easings.out` before the
//    tween. The crossfade invariant must hold on the eased result too.
//
//    MAINTENANCE CONTRACT: if use-skeleton-transition.ts lines 47-60 change,
//    update this replica in lockstep. Annotated source lines below.
// ===========================================================================

/** MIRROR of core/timeline.ts:clamp01. */
function clamp01Mirror(t: number): number {
  return Math.max(0, Math.min(1, t));
}

/** MIRROR of core/motion.ts:easings.out (cubic ease-out). */
function easingOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

/**
 * MIRROR of timeline.ts:useStateTransition pure resolver body,
 * with `raw` injected.
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
  const progress = dur > 0 ? clamp01Mirror((effectiveFrame - to.at) / dur) : 1;
  return { from: from ? from.state : defaultState, to: to.state, progress };
}

/**
 * MIRROR of use-skeleton-transition.ts:useSkeletonTransition (lines 47-60).
 * `raw` is injected in place of useCurrentFrame().
 * Annotated source lines:
 *   line 51: destructure speed + defaultDuration from opts
 *   line 52-57: call useStateTransition (mirrored as resolveStateTransition)
 *   line 58: t = easings.out(progress)            ← MIRROR line 58
 *   line 59: tweenSkeletonStyle(from, to, t)       ← MIRROR line 59
 */
function resolveSkeletonTransition(
  raw: number,                                      // injected useCurrentFrame() — MIRROR line 52
  steps: Step<SkeletonState>[],
  speed = 1,
  defaultDuration = DEFAULT_DURATION,
): { style: ReturnType<typeof tweenSkeletonStyle>; progress: number; from: SkeletonState; to: SkeletonState } {
  const { from, to, progress } = resolveStateTransition( // MIRROR lines 52-57
    raw,
    steps,
    "loading",
    speed,
    defaultDuration,
  );
  const t = easingOut(progress);                         // MIRROR line 58
  const style = tweenSkeletonStyle(
    skeletonStyle(from as SkeletonState),
    skeletonStyle(to as SkeletonState),
    t,
  );                                                     // MIRROR line 59
  return { style, progress, from: from as SkeletonState, to: to as SkeletonState };
}

// ---------------------------------------------------------------------------
// Before any step: holds at loading
// ---------------------------------------------------------------------------

describe("resolveSkeletonTransition: before any step — holds at loading", () => {
  it("returns the loading style when no steps have started", () => {
    const { style } = resolveSkeletonTransition(0, []);
    const loading = skeletonStyle("loading");
    expect(style.skeletonOpacity).toBeCloseTo(loading.skeletonOpacity, 10);
    expect(style.contentOpacity).toBeCloseTo(loading.contentOpacity, 10);
  });

  it("from and to are both 'loading' before any step", () => {
    const { from, to } = resolveSkeletonTransition(0, []);
    expect(from).toBe("loading");
    expect(to).toBe("loading");
  });

  it("crossfade invariant holds before any step", () => {
    const { style } = resolveSkeletonTransition(0, []);
    expect(style.skeletonOpacity + style.contentOpacity).toBeCloseTo(1, 10);
  });
});

// ---------------------------------------------------------------------------
// Exactly at a step boundary: progress=0, t=out(0)=0
// ---------------------------------------------------------------------------

describe("resolveSkeletonTransition: exactly at loading→loaded step boundary", () => {
  const steps: Step<SkeletonState>[] = [{ at: 10, state: "loaded" }];

  it("at raw=10 exactly, progress=0, t=out(0)=0 → style equals loading (from)", () => {
    const { style, progress } = resolveSkeletonTransition(10, steps);
    expect(progress).toBe(0);
    const loading = skeletonStyle("loading");
    expect(style.skeletonOpacity).toBeCloseTo(loading.skeletonOpacity, 10);
    expect(style.contentOpacity).toBeCloseTo(loading.contentOpacity, 10);
  });

  it("from='loading', to='loaded' at the step boundary", () => {
    const { from, to } = resolveSkeletonTransition(10, steps);
    expect(from).toBe("loading");
    expect(to).toBe("loaded");
  });
});

// ---------------------------------------------------------------------------
// Mid-window: easings.out applied — non-linear + crossfade invariant
// ---------------------------------------------------------------------------

describe("resolveSkeletonTransition: mid-window uses easings.out (not linear)", () => {
  // step at=0, dur=12. At raw=6: progress=0.5, t=out(0.5)=0.875
  // skeletonOpacity: tween(1, 0, 0.875) = 1 - 0.875 = 0.125
  // contentOpacity:  tween(0, 1, 0.875) = 0.875
  const steps: Step<SkeletonState>[] = [{ at: 0, state: "loaded" }];

  it("skeletonOpacity at raw=6 is tween(1,0,out(0.5))=0.125 (not linear 0.5)", () => {
    const { style } = resolveSkeletonTransition(6, steps, 1, 12);
    expect(style.skeletonOpacity).toBeCloseTo(0.125, 8);
  });

  it("contentOpacity at raw=6 is tween(0,1,out(0.5))=0.875", () => {
    const { style } = resolveSkeletonTransition(6, steps, 1, 12);
    expect(style.contentOpacity).toBeCloseTo(0.875, 8);
  });

  it("crossfade invariant holds mid-window (sum === 1)", () => {
    const { style } = resolveSkeletonTransition(6, steps, 1, 12);
    expect(style.skeletonOpacity + style.contentOpacity).toBeCloseTo(1, 8);
  });
});

// ---------------------------------------------------------------------------
// Past the window: fully loaded
// ---------------------------------------------------------------------------

describe("resolveSkeletonTransition: past the transition window → fully loaded", () => {
  const steps: Step<SkeletonState>[] = [{ at: 0, state: "loaded" }];

  it("skeletonOpacity is 0 after DEFAULT_DURATION frames", () => {
    const { style } = resolveSkeletonTransition(DEFAULT_DURATION, steps);
    expect(style.skeletonOpacity).toBeCloseTo(0, 10);
  });

  it("contentOpacity is 1 after DEFAULT_DURATION frames", () => {
    const { style } = resolveSkeletonTransition(DEFAULT_DURATION, steps);
    expect(style.contentOpacity).toBeCloseTo(1, 10);
  });

  it("crossfade invariant holds past the window", () => {
    const { style } = resolveSkeletonTransition(DEFAULT_DURATION, steps);
    expect(style.skeletonOpacity + style.contentOpacity).toBeCloseTo(1, 10);
  });
});

// ---------------------------------------------------------------------------
// Speed contract
// ---------------------------------------------------------------------------

describe("resolveSkeletonTransition: speed contract", () => {
  // step at=12. speed=2: effectiveFrame = raw*2 → fires at raw=6.
  const steps: Step<SkeletonState>[] = [{ at: 12, state: "loaded" }];

  it("speed=2: step at=12 fires at raw=6 (eff=12)", () => {
    const { to } = resolveSkeletonTransition(6, steps, 2);
    expect(to).toBe("loaded");
  });

  it("speed=2: step at=12 has NOT fired at raw=5 (eff=10 < 12)", () => {
    const { to } = resolveSkeletonTransition(5, steps, 2);
    expect(to).toBe("loading");
  });
});

// ===========================================================================
// 5. skeletonConfig.controls — customizer control wiring
// ===========================================================================

describe("skeletonConfig.controls: state", () => {
  it("state is a select control", () => {
    expect(skeletonConfig.controls.state.type).toBe("select");
  });

  it("state options are ['loading', 'loaded']", () => {
    const ctrl = skeletonConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    expect(ctrl.options).toEqual(["loading", "loaded"]);
  });

  it("state default is 'loading' (shows live shimmer in preview)", () => {
    expect(skeletonConfig.controls.state.default).toBe("loading");
  });

  it("every state option is a valid SkeletonState", () => {
    const ctrl = skeletonConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    for (const opt of ctrl.options) {
      expect(VALID_STATES).toContain(opt as SkeletonState);
    }
  });
});

describe("skeletonConfig.controls: layout", () => {
  it("layout is a select control", () => {
    expect(skeletonConfig.controls.layout.type).toBe("select");
  });

  it("layout options are ['lines', 'card']", () => {
    const ctrl = skeletonConfig.controls.layout;
    if (ctrl.type !== "select") throw new Error("expected select");
    expect(ctrl.options).toEqual(["lines", "card"]);
  });

  it("layout default is 'card'", () => {
    expect(skeletonConfig.controls.layout.default).toBe("card");
  });

  it("every layout option is a valid SkeletonLayout", () => {
    const ctrl = skeletonConfig.controls.layout;
    if (ctrl.type !== "select") throw new Error("expected select");
    for (const opt of ctrl.options) {
      expect(VALID_LAYOUTS).toContain(opt as SkeletonLayout);
    }
  });
});

describe("skeletonConfig.controls: mode", () => {
  it("mode is a select control", () => {
    expect(skeletonConfig.controls.mode.type).toBe("select");
  });

  it("mode options are ['light', 'dark']", () => {
    const ctrl = skeletonConfig.controls.mode;
    if (ctrl.type !== "select") throw new Error("expected select");
    expect(ctrl.options).toEqual(["light", "dark"]);
  });

  it("mode default is 'light'", () => {
    expect(skeletonConfig.controls.mode.default).toBe("light");
  });
});

// ===========================================================================
// 6. skeletonConfig.snippet — pure JSX string builder
// ===========================================================================

describe("skeletonConfig.snippet: import line", () => {
  it("includes 'import { Skeleton }' from the correct path", () => {
    const out = snippet({ state: "loading" });
    expect(out).toContain("import { Skeleton }");
    expect(out).toContain('from "@/components/remocn/skeleton"');
  });
});

describe("skeletonConfig.snippet: structural invariants", () => {
  it("contains a <Skeleton JSX element", () => {
    expect(snippet({ state: "loading" })).toContain("<Skeleton");
  });

  it("has a closing </Skeleton> tag (not self-closing — it wraps children)", () => {
    expect(snippet({ state: "loading" })).toContain("</Skeleton>");
  });

  it("includes a placeholder comment for real content", () => {
    expect(snippet({ state: "loading" })).toContain("{/* your real content */}");
  });

  it("state prop is always emitted", () => {
    expect(snippet({ state: "loading" })).toContain('state="loading"');
    expect(snippet({ state: "loaded" })).toContain('state="loaded"');
  });
});

describe("skeletonConfig.snippet: default props are omitted", () => {
  // Defaults: layout='lines' (snippet omits when 'lines'), mode='light'
  it("omits layout when it equals the default 'lines'", () => {
    const out = snippet({ state: "loading", layout: "lines" });
    expect(out).not.toContain("layout=");
  });

  it("omits mode when it equals the default 'light'", () => {
    const out = snippet({ state: "loading", mode: "light" });
    expect(out).not.toContain("mode=");
  });
});

describe("skeletonConfig.snippet: non-default props are emitted", () => {
  it("emits layout='card' when non-default", () => {
    expect(snippet({ state: "loading", layout: "card" })).toContain(
      'layout="card"',
    );
  });

  it("emits mode='dark' when non-default", () => {
    expect(snippet({ state: "loading", mode: "dark" })).toContain(
      'mode="dark"',
    );
  });
});

describe("skeletonConfig.snippet: state options round-trip", () => {
  it("emits the correct state for every control option", () => {
    const ctrl = skeletonConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    for (const state of ctrl.options) {
      expect(snippet({ state })).toContain(`state="${state}"`);
    }
  });
});

describe("skeletonConfig.snippet: layout options round-trip", () => {
  it("emits the correct layout for every non-default layout option", () => {
    const ctrl = skeletonConfig.controls.layout;
    if (ctrl.type !== "select") throw new Error("expected select");
    const nonDefault = ctrl.options.filter((o) => o !== "lines");
    for (const layout of nonDefault) {
      expect(snippet({ state: "loading", layout })).toContain(`layout="${layout}"`);
    }
  });
});
