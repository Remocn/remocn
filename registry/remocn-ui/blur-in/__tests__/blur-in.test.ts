/**
 * Verification tests for the PURE / DETERMINISTIC parts of `blur-in`.
 *
 * Scope:
 *   - registry/remocn-ui/blur-in/index.tsx  — BlurInState union membership,
 *     blurInStyleContext (direction → axis/sign), blurInStyle presets
 *   - registry/remocn-ui/blur-in/config.ts  — blurInConfig.controls.state
 *     wiring + blurInConfig.snippet output (the state → JSX codegen)
 *   - registry/remocn-ui/blur-in/use-blur-in-transition.ts — tweenBlurInStyle lerp
 *
 * The render path (index.tsx) is a PURE-STATE model: `(state) => visual`.
 * Every visual is the complete resting look for that state — state changes
 * snap (no tweening). `useBlurInTransition` reads `useCurrentFrame()` via
 * `useStateTransition`; it cannot run outside a Remotion render tree.
 * So BlurIn render is NOT exercised here. The pure-testable surface is the
 * customizer wiring + snippet codegen + style presets + tween (below).
 *
 * blur-in is THEME-INDEPENDENT: no theme/mode/primary anywhere, and the
 * "context" is a MOTION config (blur/distance/axis/sign), so no theme fixture
 * is imported here (unlike the other state atoms).
 *
 * Runner: Bun's built-in test runner (TypeScript-native, no framework dep).
 *   bun test registry/remocn-ui/blur-in/__tests__
 *
 * --------------------------------------------------------------------------
 * IMPORT STRATEGY
 * --------------------------------------------------------------------------
 * The pieces under test never CALL a Remotion runtime API at import time —
 * `blurInConfig` is a plain object; `.snippet` is a pure string builder;
 * `blurInStyle`/`blurInStyleContext` are pure value functions;
 * `tweenBlurInStyle` is a pure lerp function.
 * We import via RELATIVE paths (matching the existing test suite pattern),
 * annotating each import with the source it corresponds to.
 * --------------------------------------------------------------------------
 */

import { describe, expect, it } from "bun:test";
import {
  type BlurInDirection,
  type BlurInState,
  blurInStyle,
  blurInStyleContext,
} from "../index";
import { tweenBlurInStyle } from "../use-blur-in-transition";
import { blurInConfig } from "../config";

// ===========================================================================
// Shared fixtures
// ===========================================================================

/**
 * The BlurInState union, enumerated as a runtime list for membership checks.
 * Must stay in sync with `export type BlurInState` in index.tsx.
 */
const VALID_STATES: readonly BlurInState[] = ["hidden", "revealed"];

/** The BlurInDirection union, enumerated as a runtime list. */
const VALID_DIRECTIONS: readonly BlurInDirection[] = [
  "up",
  "down",
  "left",
  "right",
];

/** Minimal shape mirroring the customizer's value bag passed to snippet(). */
type SnippetValues = {
  state?: string;
  blur?: number;
  distance?: number;
  direction?: string;
};

const snippet = (values: SnippetValues): string =>
  blurInConfig.snippet(values as Record<string, unknown>);

// ===========================================================================
// 1. BlurInState union membership
// ===========================================================================

describe("BlurInState union", () => {
  it("contains exactly the two documented states", () => {
    const control = blurInConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(control.options).toEqual(["hidden", "revealed"]);
  });

  it("every VALID_STATES entry is assignable (no typos in the fixture)", () => {
    const control = blurInConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(VALID_STATES).toHaveLength(2);
    for (const s of VALID_STATES) {
      expect(control.options).toContain(s);
    }
  });
});

// ===========================================================================
// 2. blurInConfig.controls — customizer control wiring
// ===========================================================================

describe("blurInConfig.controls.state", () => {
  it("is a select control", () => {
    expect(blurInConfig.controls.state.type).toBe("select");
  });

  it("has exactly the two BlurInState options in order", () => {
    const control = blurInConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(control.options).toEqual(["hidden", "revealed"]);
  });

  it("defaults to 'revealed' so the preview shows the settled child", () => {
    expect(blurInConfig.controls.state.default).toBe("revealed");
  });
});

describe("blurInConfig.controls.direction", () => {
  it("is a select with the four directions, default 'up'", () => {
    const control = blurInConfig.controls.direction;
    if (control.type !== "select")
      throw new Error("direction control must be a select");
    expect(control.options).toEqual(["up", "down", "left", "right"]);
    expect(control.default).toBe("up");
  });
});

describe("blurInConfig.controls numeric knobs", () => {
  it("blur defaults to 8 within [0, 40]", () => {
    const control = blurInConfig.controls.blur;
    if (control.type !== "number")
      throw new Error("blur control must be a number");
    expect(control.default).toBe(8);
    expect(control.min).toBe(0);
    expect(control.max).toBe(40);
  });

  it("distance defaults to 12 within [0, 80]", () => {
    const control = blurInConfig.controls.distance;
    if (control.type !== "number")
      throw new Error("distance control must be a number");
    expect(control.default).toBe(12);
    expect(control.min).toBe(0);
    expect(control.max).toBe(80);
  });
});

// ===========================================================================
// 3. blurInStyleContext — direction → motion config (axis + sign)
//    up    → y / +1   (starts BELOW, travels up into place)
//    down  → y / −1   (starts above, travels down into place)
//    left  → x / +1   (starts to the right, travels left into place)
//    right → x / −1   (starts to the left, travels right into place)
// ===========================================================================

describe("blurInStyleContext: direction → axis + sign", () => {
  it("up → axis y, sign +1", () => {
    const ctx = blurInStyleContext(8, "up", 12);
    expect(ctx.axis).toBe("y");
    expect(ctx.sign).toBe(1);
  });

  it("down → axis y, sign −1", () => {
    const ctx = blurInStyleContext(8, "down", 12);
    expect(ctx.axis).toBe("y");
    expect(ctx.sign).toBe(-1);
  });

  it("left → axis x, sign +1", () => {
    const ctx = blurInStyleContext(8, "left", 12);
    expect(ctx.axis).toBe("x");
    expect(ctx.sign).toBe(1);
  });

  it("right → axis x, sign −1", () => {
    const ctx = blurInStyleContext(8, "right", 12);
    expect(ctx.axis).toBe("x");
    expect(ctx.sign).toBe(-1);
  });

  it("carries blur and distance straight through", () => {
    const ctx = blurInStyleContext(16, "up", 40);
    expect(ctx.blur).toBe(16);
    expect(ctx.distance).toBe(40);
  });

  it("every direction yields a valid axis/sign pair", () => {
    for (const direction of VALID_DIRECTIONS) {
      const ctx = blurInStyleContext(8, direction, 12);
      expect(["x", "y"]).toContain(ctx.axis);
      expect([1, -1]).toContain(ctx.sign);
    }
  });
});

// ===========================================================================
// 4. blurInStyle presets — pure (state, ctx) => BlurInStyle
//    revealed is always { blur:0, opacity:1, translateX:0, translateY:0 }.
//    hidden carries ctx.blur, opacity 0, and the directional offset on the
//    ctx axis (ctx.sign * ctx.distance), the other axis 0.
//    Built with blur=8, distance=12 ctx (the control defaults).
// ===========================================================================

describe("blurInStyle: revealed preset (direction-independent)", () => {
  for (const direction of VALID_DIRECTIONS) {
    const ctx = blurInStyleContext(8, direction, 12);
    const s = blurInStyle("revealed", ctx);

    it(`revealed (${direction}) → blur 0, opacity 1, no offset`, () => {
      expect(s.blur).toBe(0);
      expect(s.opacity).toBe(1);
      expect(s.translateX).toBe(0);
      expect(s.translateY).toBe(0);
    });
  }
});

describe("blurInStyle: hidden preset per direction (blur=8, distance=12)", () => {
  it("up → blur 8, opacity 0, translateY +12, translateX 0", () => {
    const s = blurInStyle("hidden", blurInStyleContext(8, "up", 12));
    expect(s.blur).toBe(8);
    expect(s.opacity).toBe(0);
    expect(s.translateY).toBe(12);
    expect(s.translateX).toBe(0);
  });

  it("down → blur 8, opacity 0, translateY −12, translateX 0", () => {
    const s = blurInStyle("hidden", blurInStyleContext(8, "down", 12));
    expect(s.translateY).toBe(-12);
    expect(s.translateX).toBe(0);
  });

  it("left → blur 8, opacity 0, translateX +12, translateY 0", () => {
    const s = blurInStyle("hidden", blurInStyleContext(8, "left", 12));
    expect(s.translateX).toBe(12);
    expect(s.translateY).toBe(0);
  });

  it("right → blur 8, opacity 0, translateX −12, translateY 0", () => {
    const s = blurInStyle("hidden", blurInStyleContext(8, "right", 12));
    expect(s.translateX).toBe(-12);
    expect(s.translateY).toBe(0);
  });

  it("hidden blur equals ctx.blur (not hardcoded)", () => {
    const s = blurInStyle("hidden", blurInStyleContext(20, "up", 12));
    expect(s.blur).toBe(20);
  });

  it("distance 0 disables the offset on both axes", () => {
    for (const direction of VALID_DIRECTIONS) {
      const s = blurInStyle("hidden", blurInStyleContext(8, direction, 0));
      expect(s.translateX).toBe(0);
      expect(s.translateY).toBe(0);
    }
  });
});

// ===========================================================================
// 5. tweenBlurInStyle — pure linear interpolation between two BlurInStyles.
//    All four fields are numbers and lerp linearly.
// ===========================================================================

describe("tweenBlurInStyle: t=0 returns values equal to `a`", () => {
  const a = blurInStyle("hidden", blurInStyleContext(8, "up", 12));
  const b = blurInStyle("revealed", blurInStyleContext(8, "up", 12));
  const r = tweenBlurInStyle(a, b, 0);

  it("blur equals a.blur at t=0", () => {
    expect(r.blur).toBeCloseTo(a.blur, 10);
  });
  it("opacity equals a.opacity at t=0", () => {
    expect(r.opacity).toBeCloseTo(a.opacity, 10);
  });
  it("translateX equals a.translateX at t=0", () => {
    expect(r.translateX).toBeCloseTo(a.translateX, 10);
  });
  it("translateY equals a.translateY at t=0", () => {
    expect(r.translateY).toBeCloseTo(a.translateY, 10);
  });
});

describe("tweenBlurInStyle: t=1 returns values equal to `b`", () => {
  const a = blurInStyle("hidden", blurInStyleContext(8, "up", 12));
  const b = blurInStyle("revealed", blurInStyleContext(8, "up", 12));
  const r = tweenBlurInStyle(a, b, 1);

  it("blur equals b.blur at t=1", () => {
    expect(r.blur).toBeCloseTo(b.blur, 10);
  });
  it("opacity equals b.opacity at t=1", () => {
    expect(r.opacity).toBeCloseTo(b.opacity, 10);
  });
  it("translateX equals b.translateX at t=1", () => {
    expect(r.translateX).toBeCloseTo(b.translateX, 10);
  });
  it("translateY equals b.translateY at t=1", () => {
    expect(r.translateY).toBeCloseTo(b.translateY, 10);
  });
});

describe("tweenBlurInStyle: t=0.5 midpoint numeric lerp (hidden up → revealed)", () => {
  // hidden(up):  blur=8, opacity=0, translateX=0, translateY=12
  // revealed:    blur=0, opacity=1, translateX=0, translateY=0
  const a = blurInStyle("hidden", blurInStyleContext(8, "up", 12));
  const b = blurInStyle("revealed", blurInStyleContext(8, "up", 12));
  const r = tweenBlurInStyle(a, b, 0.5);

  it("blur midpoint: 8 → 0 gives 4", () => {
    expect(r.blur).toBeCloseTo(4, 10);
  });
  it("opacity midpoint: 0 → 1 gives 0.5", () => {
    expect(r.opacity).toBeCloseTo(0.5, 10);
  });
  it("translateX midpoint: 0 → 0 gives 0", () => {
    expect(r.translateX).toBeCloseTo(0, 10);
  });
  it("translateY midpoint: 12 → 0 gives 6", () => {
    expect(r.translateY).toBeCloseTo(6, 10);
  });
});

describe("tweenBlurInStyle: t=0.5 midpoint on the x axis (hidden left → revealed)", () => {
  // hidden(left): blur=8, opacity=0, translateX=12, translateY=0
  const a = blurInStyle("hidden", blurInStyleContext(8, "left", 12));
  const b = blurInStyle("revealed", blurInStyleContext(8, "left", 12));
  const r = tweenBlurInStyle(a, b, 0.5);

  it("translateX midpoint: 12 → 0 gives 6", () => {
    expect(r.translateX).toBeCloseTo(6, 10);
  });
  it("translateY midpoint: 0 → 0 gives 0", () => {
    expect(r.translateY).toBeCloseTo(0, 10);
  });
});

// ===========================================================================
// 6. blurInConfig.snippet — pure string builder
//    Emits `state="<state>"` always; emits direction/blur/distance ONLY when
//    they differ from the control defaults (up / 8 / 12); never the speed knob.
// ===========================================================================

describe("blurInConfig.snippet: state prop emission", () => {
  it('emits state="hidden" for the hidden option', () => {
    expect(snippet({ state: "hidden" })).toContain('state="hidden"');
  });

  it('emits state="revealed" for the revealed option', () => {
    expect(snippet({ state: "revealed" })).toContain('state="revealed"');
  });

  it("emits the correct state for every control option", () => {
    for (const state of VALID_STATES) {
      expect(snippet({ state })).toContain(`state="${state}"`);
    }
  });
});

describe("blurInConfig.snippet: import line", () => {
  it("includes `import { BlurIn }` from the correct path", () => {
    const out = snippet({ state: "revealed" });
    expect(out).toContain("import { BlurIn }");
    expect(out).toContain('from "@/components/remocn/blur-in"');
  });
});

describe("blurInConfig.snippet: default props are omitted", () => {
  const allDefaults = snippet({
    state: "revealed",
    direction: "up",
    blur: 8,
    distance: 12,
  });

  it("omits direction when it equals the default 'up'", () => {
    expect(allDefaults).not.toContain("direction=");
  });
  it("omits blur when it equals the default 8", () => {
    expect(allDefaults).not.toContain("blur=");
  });
  it("omits distance when it equals the default 12", () => {
    expect(allDefaults).not.toContain("distance=");
  });
  it("never emits the preview-only speed knob", () => {
    expect(snippet({ state: "revealed" })).not.toContain("speed");
  });
});

describe("blurInConfig.snippet: non-default props are emitted", () => {
  it("emits a non-default direction", () => {
    expect(snippet({ state: "revealed", direction: "down" })).toContain(
      'direction="down"',
    );
  });
  it("emits a non-default blur", () => {
    expect(snippet({ state: "revealed", blur: 16 })).toContain("blur={16}");
  });
  it("emits a non-default distance", () => {
    expect(snippet({ state: "revealed", distance: 40 })).toContain(
      "distance={40}",
    );
  });
});

describe("blurInConfig.snippet: structural round-trip", () => {
  const out = snippet({ state: "revealed" });

  it("starts with the import line", () => {
    expect(out.startsWith("import { BlurIn }")).toBe(true);
  });
  it("contains a <BlurIn JSX opening", () => {
    expect(out).toContain("<BlurIn");
  });
  it("closes with </BlurIn>", () => {
    expect(out.trimEnd().endsWith("</BlurIn>")).toBe(true);
  });
});
