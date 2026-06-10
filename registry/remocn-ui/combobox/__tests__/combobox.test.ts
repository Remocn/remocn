/**
 * Verification tests for the PURE / DETERMINISTIC parts of `combobox`.
 *
 * Scope:
 *   - registry/remocn-ui/combobox/index.tsx
 *       filterComboboxItems(items, query, revealCount) — exported pure filter
 *       comboboxStyle(state, ctx)                      — complete state→visual map
 *   - registry/remocn-ui/combobox/use-combobox-transition.ts
 *       tweenComboboxStyle(a, b, t)     — pure lerp across all three fields
 *       DEFAULT_DURATION constant
 *       useComboboxTransition resolver — mirrored as resolveComboboxTransition
 *         with frame injected as `raw` (annotated source lines)
 *   - registry/remocn-ui/combobox/config.ts
 *       comboboxConfig.controls wiring + comboboxConfig.snippet codegen
 *
 * The render path (index.tsx) imports `useRemocnTheme` / `useRemocnTheme` which
 * requires React context and cannot run headlessly — it is NOT exercised here.
 * `comboboxStyleContext` re-delegates to `inputStyleContext` and
 * `selectItemStyleContext`, both of which also require no React; they ARE called
 * here for fixture construction, but their internal correctness is covered by
 * the select/__tests__ suite.
 *
 * Runner: Bun's built-in test runner (TypeScript-native, no framework dep).
 *   bun test registry/remocn-ui/combobox/__tests__
 *
 * --------------------------------------------------------------------------
 * IMPORT STRATEGY
 * --------------------------------------------------------------------------
 * Relative imports for component source; `@/lib/remocn-ui` alias for core.
 * `useComboboxTransition` is NOT imported — it reads `useCurrentFrame()`.
 * Its pure body is mirrored as `resolveComboboxTransition` with frame injected.
 * --------------------------------------------------------------------------
 */

import { describe, expect, it } from "bun:test";
import {
  filterComboboxItems,
  comboboxStyle,
  comboboxStyleContext,
  type ComboboxState,
  type ComboboxStyle,
} from "../index";
import {
  tweenComboboxStyle,
  DEFAULT_DURATION,
} from "../use-combobox-transition";
import { comboboxConfig } from "../config";
import { defaultLightTheme, defaultDarkTheme, easings } from "@/lib/remocn-ui";
import type { Step } from "@/lib/remocn-ui";

// ===========================================================================
// Shared fixtures
// ===========================================================================

const VALID_STATES: readonly ComboboxState[] = ["opened", "closed"];

const SAMPLE_ITEMS = ["Apple", "Banana", "Orange", "Grape"];

/** Build a shared ctx for style assertions (no React needed — pure function). */
const ctx = comboboxStyleContext(defaultLightTheme);

/** Convenience wrapper for snippet(). */
type SnippetValues = {
  state?: string;
  query?: string;
  revealCount?: number;
  placeholder?: string;
  selectedIndex?: number;
  highlightedIndex?: number;
  mode?: string;
};
const snippet = (values: SnippetValues): string =>
  comboboxConfig.snippet(values as Record<string, unknown>);

// ===========================================================================
// 1. DEFAULT_DURATION constant
// ===========================================================================

describe("DEFAULT_DURATION", () => {
  it("is 12 frames", () => {
    expect(DEFAULT_DURATION).toBe(12);
  });
});

// ===========================================================================
// 2. filterComboboxItems — exported pure filter
//    MIRROR of index.tsx lines 77-89
//    Case-insensitive substring on query.slice(0, revealCount).
//    Items are plain strings (unlike command-menu's .label entries).
// ===========================================================================

describe("filterComboboxItems: empty visible prefix → all items returned", () => {
  it("returns all items when query is empty string", () => {
    expect(filterComboboxItems(SAMPLE_ITEMS, "", undefined)).toHaveLength(4);
  });

  it("returns the same array contents when query is empty", () => {
    const result = filterComboboxItems(SAMPLE_ITEMS, "", undefined);
    expect(result).toEqual(SAMPLE_ITEMS);
  });

  it("returns all items when revealCount=0 (visible prefix is empty)", () => {
    expect(filterComboboxItems(SAMPLE_ITEMS, "apple", 0)).toHaveLength(4);
  });

  it("returns all items when query is whitespace only (trim collapses to empty)", () => {
    expect(filterComboboxItems(SAMPLE_ITEMS, "   ", undefined)).toHaveLength(4);
  });

  it("returns empty array when items list is empty", () => {
    expect(filterComboboxItems([], "apple", undefined)).toHaveLength(0);
  });
});

describe("filterComboboxItems: prefix narrows results", () => {
  it("'Apple' matches exactly one item", () => {
    const result = filterComboboxItems(SAMPLE_ITEMS, "Apple", undefined);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("Apple");
  });

  it("'an' matches Banana and Orange (substring in both)", () => {
    const result = filterComboboxItems(SAMPLE_ITEMS, "an", undefined);
    expect(result).toHaveLength(2);
    expect(result).toContain("Banana");
    expect(result).toContain("Orange");
  });

  it("'gra' matches Grape", () => {
    const result = filterComboboxItems(SAMPLE_ITEMS, "gra", undefined);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("Grape");
  });

  it("'a' matches Apple, Banana, Orange, Grape (all contain 'a')", () => {
    // Apple(a), Banana(a), Orange(a), Grape(a)
    const result = filterComboboxItems(SAMPLE_ITEMS, "a", undefined);
    expect(result).toHaveLength(4);
  });
});

describe("filterComboboxItems: no-match → empty array", () => {
  it("returns empty array when query matches nothing", () => {
    expect(filterComboboxItems(SAMPLE_ITEMS, "xyz", undefined)).toHaveLength(0);
  });

  it("returns empty array for a long non-matching query", () => {
    expect(filterComboboxItems(SAMPLE_ITEMS, "zzzzzzzz", undefined)).toHaveLength(0);
  });
});

describe("filterComboboxItems: case-insensitivity", () => {
  it("uppercase query matches lowercase item chars", () => {
    expect(filterComboboxItems(SAMPLE_ITEMS, "APPLE", undefined)).toHaveLength(1);
    expect(filterComboboxItems(SAMPLE_ITEMS, "APPLE", undefined)[0]).toBe("Apple");
  });

  it("mixed case query matches item", () => {
    expect(filterComboboxItems(SAMPLE_ITEMS, "gRaPe", undefined)).toHaveLength(1);
  });

  it("lowercase query matches mixed-case item ('orange')", () => {
    const result = filterComboboxItems(SAMPLE_ITEMS, "orange", undefined);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("Orange");
  });
});

describe("filterComboboxItems: revealCount slices the query", () => {
  it("revealCount=2 on 'apple' uses only 'ap' → matches Apple", () => {
    const result = filterComboboxItems(SAMPLE_ITEMS, "apple", 2);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("Apple");
  });

  it("revealCount=1 on 'banana' uses only 'b' → matches Banana", () => {
    const result = filterComboboxItems(SAMPLE_ITEMS, "banana", 1);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("Banana");
  });

  it("revealCount=2 on 'orange' uses only 'or' → matches Orange", () => {
    const result = filterComboboxItems(SAMPLE_ITEMS, "orange", 2);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("Orange");
  });

  it("revealCount > query length uses full query (no index error)", () => {
    // query='ap' (2 chars), revealCount=100 → uses full 'ap'
    const result = filterComboboxItems(SAMPLE_ITEMS, "ap", 100);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("Apple");
  });
});

describe("filterComboboxItems: result preserves original string references", () => {
  it("filtered items are the same string references (no cloning)", () => {
    const result = filterComboboxItems(SAMPLE_ITEMS, "apple", undefined);
    // strings are primitives — identity check via toBe confirms no mutation
    expect(result[0]).toBe(SAMPLE_ITEMS[0]);
  });
});

// ===========================================================================
// 3. comboboxStyle — pure (state, ctx) => ComboboxStyle presets
//    MIRROR of index.tsx lines 138-148
//    Every field is asserted for both states.
// ===========================================================================

describe("comboboxStyle: closed state — off-screen keyframe", () => {
  const s = comboboxStyle("closed", ctx);

  it("panelOpacity is 0 (panel invisible)", () => {
    expect(s.panelOpacity).toBe(0);
  });

  it("panelScale is 0.96 (slightly shrunken)", () => {
    expect(s.panelScale).toBeCloseTo(0.96, 10);
  });

  it("panelTranslateY is -4 (lifted 4px above rest position)", () => {
    expect(s.panelTranslateY).toBe(-4);
  });
});

describe("comboboxStyle: opened state — resting keyframe", () => {
  const s = comboboxStyle("opened", ctx);

  it("panelOpacity is 1 (panel fully visible)", () => {
    expect(s.panelOpacity).toBe(1);
  });

  it("panelScale is 1 (full size)", () => {
    expect(s.panelScale).toBe(1);
  });

  it("panelTranslateY is 0 (at rest position)", () => {
    expect(s.panelTranslateY).toBe(0);
  });
});

describe("comboboxStyle: closed and opened have distinct values on every field", () => {
  const closed = comboboxStyle("closed", ctx);
  const opened = comboboxStyle("opened", ctx);

  it("panelOpacity: 0 vs 1", () => {
    expect(closed.panelOpacity).not.toBe(opened.panelOpacity);
  });

  it("panelScale: 0.96 vs 1", () => {
    expect(closed.panelScale).not.toBe(opened.panelScale);
  });

  it("panelTranslateY: -4 vs 0", () => {
    expect(closed.panelTranslateY).not.toBe(opened.panelTranslateY);
  });
});

describe("comboboxStyle: every state produces a complete ComboboxStyle", () => {
  it("all three fields are numeric for every state", () => {
    for (const state of VALID_STATES) {
      const s = comboboxStyle(state, ctx);
      expect(typeof s.panelOpacity).toBe("number");
      expect(typeof s.panelScale).toBe("number");
      expect(typeof s.panelTranslateY).toBe("number");
    }
  });
});

// ===========================================================================
// 4. tweenComboboxStyle — pure lerp across all three numeric fields
//    MIRROR of use-combobox-transition.ts lines 22-33
//    All fields are numbers — straight lerp on everything.
// ===========================================================================

describe("tweenComboboxStyle: t=0 returns values equal to `a`", () => {
  const a = comboboxStyle("closed", ctx);
  const b = comboboxStyle("opened", ctx);
  const r = tweenComboboxStyle(a, b, 0);

  it("panelOpacity equals a.panelOpacity at t=0", () => {
    expect(r.panelOpacity).toBeCloseTo(a.panelOpacity, 10);
  });

  it("panelScale equals a.panelScale at t=0", () => {
    expect(r.panelScale).toBeCloseTo(a.panelScale, 10);
  });

  it("panelTranslateY equals a.panelTranslateY at t=0", () => {
    expect(r.panelTranslateY).toBeCloseTo(a.panelTranslateY, 10);
  });
});

describe("tweenComboboxStyle: t=1 returns values equal to `b`", () => {
  const a = comboboxStyle("closed", ctx);
  const b = comboboxStyle("opened", ctx);
  const r = tweenComboboxStyle(a, b, 1);

  it("panelOpacity equals b.panelOpacity at t=1", () => {
    expect(r.panelOpacity).toBeCloseTo(b.panelOpacity, 10);
  });

  it("panelScale equals b.panelScale at t=1", () => {
    expect(r.panelScale).toBeCloseTo(b.panelScale, 10);
  });

  it("panelTranslateY equals b.panelTranslateY at t=1", () => {
    expect(r.panelTranslateY).toBeCloseTo(b.panelTranslateY, 10);
  });
});

describe("tweenComboboxStyle: t=0.5 midpoint (closed → opened)", () => {
  // closed: panelOpacity=0, panelScale=0.96, panelTranslateY=-4
  // opened: panelOpacity=1, panelScale=1,    panelTranslateY=0
  // midpoint: 0.5,           0.98,            -2
  const a = comboboxStyle("closed", ctx);
  const b = comboboxStyle("opened", ctx);
  const r = tweenComboboxStyle(a, b, 0.5);

  it("panelOpacity midpoint: 0 → 1 gives 0.5", () => {
    expect(r.panelOpacity).toBeCloseTo(0.5, 10);
  });

  it("panelScale midpoint: 0.96 → 1 gives 0.98", () => {
    expect(r.panelScale).toBeCloseTo(0.98, 10);
  });

  it("panelTranslateY midpoint: -4 → 0 gives -2", () => {
    expect(r.panelTranslateY).toBeCloseTo(-2, 10);
  });
});

describe("tweenComboboxStyle: t=0.25 quarter-point (closed → opened)", () => {
  // panelOpacity: 0.25, panelScale: 0.97, panelTranslateY: -3
  const a = comboboxStyle("closed", ctx);
  const b = comboboxStyle("opened", ctx);
  const r = tweenComboboxStyle(a, b, 0.25);

  it("panelOpacity at t=0.25 is 0.25", () => {
    expect(r.panelOpacity).toBeCloseTo(0.25, 10);
  });

  it("panelScale at t=0.25 is 0.97", () => {
    expect(r.panelScale).toBeCloseTo(0.97, 10);
  });

  it("panelTranslateY at t=0.25 is -3", () => {
    expect(r.panelTranslateY).toBeCloseTo(-3, 10);
  });
});

describe("tweenComboboxStyle: identity (a === b)", () => {
  const s = comboboxStyle("opened", ctx);

  it("all fields unchanged when both endpoints are identical", () => {
    const r = tweenComboboxStyle(s, s, 0.5);
    expect(r.panelOpacity).toBeCloseTo(s.panelOpacity, 10);
    expect(r.panelScale).toBeCloseTo(s.panelScale, 10);
    expect(r.panelTranslateY).toBeCloseTo(s.panelTranslateY, 10);
  });
});

describe("tweenComboboxStyle: reverse direction (opened → closed)", () => {
  const a = comboboxStyle("opened", ctx);
  const b = comboboxStyle("closed", ctx);
  const r = tweenComboboxStyle(a, b, 0.5);

  it("panelOpacity midpoint: 1 → 0 gives 0.5", () => {
    expect(r.panelOpacity).toBeCloseTo(0.5, 10);
  });

  it("panelTranslateY midpoint: 0 → -4 gives -2", () => {
    expect(r.panelTranslateY).toBeCloseTo(-2, 10);
  });
});

// ===========================================================================
// 5. useComboboxTransition resolver replica
//    MIRRORS use-combobox-transition.ts lines 47-71.
//    `useComboboxTransition` calls `useStateTransition` (reads useCurrentFrame())
//    then applies `easings.out(progress)` and `tweenComboboxStyle`.
//    We inject `raw` in place of useCurrentFrame().
//
//    The key additional contract: progress is eased with `easings.out` before
//    the tween, making the result non-linear (confirmed: out(0.5) = 0.875).
//
//    MAINTENANCE CONTRACT: if use-combobox-transition.ts lines 47-71 change,
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
 * MIRROR of use-combobox-transition.ts:useComboboxTransition (lines 47-71).
 * `raw` is injected in place of useCurrentFrame().
 * Annotated source lines:
 *   line 54: destructure speed + defaultDuration from opts
 *   lines 59-64: useStateTransition (mirrored as resolveStateTransition)
 *   line 65: t = easings.out(progress)                     ← MIRROR line 65
 *   lines 66-70: tweenComboboxStyle(from, to, t)           ← MIRROR lines 66-70
 */
function resolveComboboxTransition(
  raw: number,                                          // injected useCurrentFrame() — MIRROR line 59
  steps: Step<ComboboxState>[],
  speed = 1,
  defaultDuration = DEFAULT_DURATION,
): ComboboxStyle & { from: ComboboxState; to: ComboboxState; progress: number } {
  const { from, to, progress } = resolveStateTransition(   // MIRROR lines 59-64
    raw,
    steps,
    "closed",
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);                          // MIRROR line 65
  const style = tweenComboboxStyle(                         // MIRROR lines 66-70
    comboboxStyle(from as ComboboxState, ctx),
    comboboxStyle(to as ComboboxState, ctx),
    t,
  );
  return { ...style, from: from as ComboboxState, to: to as ComboboxState, progress };
}

// ---------------------------------------------------------------------------
// Before any step: holds at closed (progress=1, tween(closed,closed,out(1)))
// ---------------------------------------------------------------------------

describe("resolveComboboxTransition: before any step — holds at closed", () => {
  it("returns the closed style when no steps have started", () => {
    const r = resolveComboboxTransition(0, []);
    const closed = comboboxStyle("closed", ctx);
    expect(r.panelOpacity).toBeCloseTo(closed.panelOpacity, 10);
    expect(r.panelScale).toBeCloseTo(closed.panelScale, 10);
    expect(r.panelTranslateY).toBeCloseTo(closed.panelTranslateY, 10);
  });

  it("from and to are both 'closed' before any step", () => {
    const { from, to } = resolveComboboxTransition(0, []);
    expect(from).toBe("closed");
    expect(to).toBe("closed");
  });
});

// ---------------------------------------------------------------------------
// Exactly at a step boundary: progress=0, t=out(0)=0 → closed style
// ---------------------------------------------------------------------------

describe("resolveComboboxTransition: exactly at closed→opened step boundary", () => {
  const steps: Step<ComboboxState>[] = [{ at: 10, state: "opened" }];

  it("at raw=10, progress=0, t=out(0)=0 → style equals closed (from)", () => {
    const r = resolveComboboxTransition(10, steps);
    const closed = comboboxStyle("closed", ctx);
    expect(r.progress).toBe(0);
    expect(r.panelOpacity).toBeCloseTo(closed.panelOpacity, 10);
    expect(r.panelScale).toBeCloseTo(closed.panelScale, 10);
  });

  it("from='closed', to='opened' at the step boundary", () => {
    const { from, to } = resolveComboboxTransition(10, steps);
    expect(from).toBe("closed");
    expect(to).toBe("opened");
  });
});

// ---------------------------------------------------------------------------
// Mid-window: easings.out applied — non-linear (not raw 0.5)
// out(0.5) = 1-(1-0.5)^3 = 1-0.125 = 0.875
// ---------------------------------------------------------------------------

describe("resolveComboboxTransition: mid-window uses easings.out (not linear)", () => {
  // step at=0, defaultDuration=12. At raw=6: linear progress=0.5, out(0.5)=0.875
  const steps: Step<ComboboxState>[] = [{ at: 0, state: "opened" }];

  it("panelOpacity at raw=6 is out(0.5)=0.875 (not linear 0.5)", () => {
    const r = resolveComboboxTransition(6, steps, 1, 12);
    const t = easings.out(0.5); // 0.875
    // tween(0, 1, 0.875) = 0.875
    expect(r.panelOpacity).toBeCloseTo(t, 8);
  });

  it("panelScale at raw=6 is 0.96 + 0.04*out(0.5) = 0.995", () => {
    const r = resolveComboboxTransition(6, steps, 1, 12);
    const t = easings.out(0.5); // 0.875
    const expected = 0.96 + (1 - 0.96) * t; // 0.995
    expect(r.panelScale).toBeCloseTo(expected, 8);
  });

  it("panelTranslateY at raw=6 is -4*(1-out(0.5)) = -0.5", () => {
    const r = resolveComboboxTransition(6, steps, 1, 12);
    const t = easings.out(0.5); // 0.875
    const expected = -4 + (0 - (-4)) * t; // -4 + 4*0.875 = -0.5
    expect(r.panelTranslateY).toBeCloseTo(expected, 8);
  });

  it("easing is confirmed non-linear: panelOpacity at raw=6 is not 0.5", () => {
    const r = resolveComboboxTransition(6, steps, 1, 12);
    expect(r.panelOpacity).not.toBeCloseTo(0.5, 2);
  });
});

// ---------------------------------------------------------------------------
// Past the window: fully opened
// ---------------------------------------------------------------------------

describe("resolveComboboxTransition: past the window → fully opened", () => {
  const steps: Step<ComboboxState>[] = [{ at: 0, state: "opened" }];

  it("panelOpacity is 1 after DEFAULT_DURATION frames", () => {
    expect(resolveComboboxTransition(DEFAULT_DURATION, steps).panelOpacity).toBeCloseTo(1, 10);
  });

  it("panelScale is 1 after DEFAULT_DURATION frames", () => {
    expect(resolveComboboxTransition(DEFAULT_DURATION, steps).panelScale).toBeCloseTo(1, 10);
  });

  it("panelTranslateY is 0 after DEFAULT_DURATION frames", () => {
    expect(resolveComboboxTransition(DEFAULT_DURATION, steps).panelTranslateY).toBeCloseTo(0, 10);
  });
});

// ---------------------------------------------------------------------------
// Speed contract
// ---------------------------------------------------------------------------

describe("resolveComboboxTransition: speed contract", () => {
  const steps: Step<ComboboxState>[] = [{ at: 12, state: "opened" }];

  it("speed=2: step at=12 fires at raw=6 (effectiveFrame=12)", () => {
    expect(resolveComboboxTransition(6, steps, 2).to).toBe("opened");
  });

  it("speed=2: step at=12 has NOT fired at raw=5 (effectiveFrame=10 < 12)", () => {
    expect(resolveComboboxTransition(5, steps, 2).to).toBe("closed");
  });
});

// ===========================================================================
// 6. comboboxConfig.controls — customizer control wiring
// ===========================================================================

describe("comboboxConfig.controls: state", () => {
  it("state is a select control", () => {
    expect(comboboxConfig.controls.state.type).toBe("select");
  });

  it("state options are ['opened','closed']", () => {
    const ctrl = comboboxConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    expect(ctrl.options).toEqual(["opened", "closed"]);
  });

  it("state default is 'opened' (panel visible in preview)", () => {
    expect(comboboxConfig.controls.state.default).toBe("opened");
  });

  it("every state option is a valid ComboboxState", () => {
    const ctrl = comboboxConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    for (const opt of ctrl.options) {
      expect(VALID_STATES).toContain(opt as ComboboxState);
    }
  });
});

describe("comboboxConfig.controls: query", () => {
  it("query is a text control", () => {
    expect(comboboxConfig.controls.query.type).toBe("text");
  });

  it("query default is empty string", () => {
    expect(comboboxConfig.controls.query.default).toBe("");
  });
});

describe("comboboxConfig.controls: revealCount", () => {
  it("revealCount is a number control", () => {
    expect(comboboxConfig.controls.revealCount.type).toBe("number");
  });

  it("revealCount default is 0", () => {
    expect(comboboxConfig.controls.revealCount.default).toBe(0);
  });

  it("revealCount min is 0", () => {
    const ctrl = comboboxConfig.controls.revealCount;
    if (ctrl.type !== "number") throw new Error("expected number");
    expect(ctrl.min).toBe(0);
  });
});

describe("comboboxConfig.controls: selectedIndex and highlightedIndex", () => {
  it("selectedIndex is a number control with default -1", () => {
    expect(comboboxConfig.controls.selectedIndex.type).toBe("number");
    expect(comboboxConfig.controls.selectedIndex.default).toBe(-1);
  });

  it("highlightedIndex is a number control with default 0 (first row pre-highlighted)", () => {
    expect(comboboxConfig.controls.highlightedIndex.type).toBe("number");
    expect(comboboxConfig.controls.highlightedIndex.default).toBe(0);
  });
});

describe("comboboxConfig.controls: mode", () => {
  it("mode is a select control", () => {
    expect(comboboxConfig.controls.mode.type).toBe("select");
  });

  it("mode default is 'light'", () => {
    expect(comboboxConfig.controls.mode.default).toBe("light");
  });
});

// ===========================================================================
// 7. comboboxConfig.snippet — pure JSX string builder
// ===========================================================================

describe("comboboxConfig.snippet: import line", () => {
  it("includes 'import { Combobox }' from the correct path", () => {
    const out = snippet({ state: "opened" });
    expect(out).toContain("import { Combobox }");
    expect(out).toContain('from "@/components/remocn/combobox"');
  });
});

describe("comboboxConfig.snippet: structural invariants", () => {
  it("contains a <Combobox JSX element", () => {
    expect(snippet({ state: "opened" })).toContain("<Combobox");
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

describe("comboboxConfig.snippet: default props are omitted", () => {
  it("omits query when it is empty string (the default)", () => {
    expect(snippet({ state: "opened", query: "" })).not.toContain("query=");
  });

  it("omits revealCount when it equals 0 (default)", () => {
    expect(snippet({ state: "opened", revealCount: 0 })).not.toContain("revealCount=");
  });

  it("omits placeholder when it equals the default value", () => {
    expect(
      snippet({ state: "opened", placeholder: "Select a fruit…" })
    ).not.toContain("placeholder=");
  });

  it("omits selectedIndex when it equals -1 (default)", () => {
    expect(snippet({ state: "opened", selectedIndex: -1 })).not.toContain("selectedIndex=");
  });

  it("omits highlightedIndex when it equals -1 (no highlight)", () => {
    expect(snippet({ state: "opened", highlightedIndex: -1 })).not.toContain("highlightedIndex=");
  });

  it("omits mode when it equals 'light'", () => {
    expect(snippet({ state: "opened", mode: "light" })).not.toContain("mode=");
  });
});

describe("comboboxConfig.snippet: non-default props are emitted", () => {
  it("emits query when non-empty", () => {
    expect(snippet({ state: "opened", query: "apple" })).toContain('query="apple"');
  });

  it("emits revealCount when non-zero", () => {
    expect(snippet({ state: "opened", revealCount: 3 })).toContain("revealCount={3}");
  });

  it("emits placeholder when non-default", () => {
    expect(snippet({ state: "opened", placeholder: "Search…" })).toContain('placeholder="Search…"');
  });

  it("emits selectedIndex when not -1", () => {
    expect(snippet({ state: "opened", selectedIndex: 1 })).toContain("selectedIndex={1}");
  });

  it("emits highlightedIndex when not -1 (e.g. 0 means first row)", () => {
    expect(snippet({ state: "opened", highlightedIndex: 0 })).toContain("highlightedIndex={0}");
  });

  it("emits mode='dark' when non-default", () => {
    expect(snippet({ state: "opened", mode: "dark" })).toContain('mode="dark"');
  });
});

describe("comboboxConfig.snippet: state options round-trip", () => {
  it("emits the correct state for every control option", () => {
    const ctrl = comboboxConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    for (const state of ctrl.options) {
      expect(snippet({ state })).toContain(`state="${state}"`);
    }
  });
});
