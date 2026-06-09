/**
 * Verification tests for the PURE / DETERMINISTIC parts of `input`.
 *
 * Scope:
 *   - registry/remocn-ui/input/index.tsx  — InputState union membership,
 *     inputStyleContext, inputStyle presets
 *   - registry/remocn-ui/input/config.ts  — inputConfig.controls.state
 *     wiring + inputConfig.snippet output (the state → JSX codegen)
 *   - registry/remocn-ui/input/use-input-transition.ts — tweenInputStyle lerp
 *
 * The render path (index.tsx) is a PURE-STATE model: `(state) => visual`.
 * Every visual is the complete resting look for that state — state changes
 * snap (no tweening). `useInputTransition` reads `useCurrentFrame()` via
 * `useStateTransition`; it cannot run outside a Remotion render tree.
 * So Input render is NOT exercised here. The pure-testable surface is the
 * customizer wiring + snippet codegen + style presets + tween (below).
 *
 * Runner: Bun's built-in test runner (TypeScript-native, no framework dep).
 *   bun test registry/remocn-ui/input/__tests__
 *
 * --------------------------------------------------------------------------
 * IMPORT STRATEGY
 * --------------------------------------------------------------------------
 * `config.ts` imports `InputState` from `@/registry/remocn-ui/input` and
 * the pieces under test never CALL a Remotion runtime API at import time —
 * `inputConfig` is a plain object; `.snippet` is a pure string builder;
 * `inputStyle`/`inputStyleContext` are pure value functions; `tweenInputStyle`
 * is a pure lerp function.
 * We import via RELATIVE paths (matching the existing test suite pattern),
 * annotating each import with the source it corresponds to.
 * --------------------------------------------------------------------------
 */

import { describe, expect, it } from "bun:test";
import { type InputState, inputStyle, inputStyleContext } from "../index";
import { tweenInputStyle } from "../use-input-transition";
import { inputConfig } from "../config";
import { defaultLightTheme } from "@/lib/remocn-ui";

// ===========================================================================
// Shared fixtures
// ===========================================================================

/**
 * The InputState union, enumerated as a runtime list for membership checks.
 * Must stay in sync with `export type InputState` in index.tsx.
 */
const VALID_STATES: readonly InputState[] = [
  "idle",
  "hover",
  "active",
  "typing",
  "invalid",
];

/** Minimal shape mirroring the customizer's value bag passed to snippet(). */
type SnippetValues = {
  state?: string;
  placeholder?: string;
  value?: string;
  size?: string;
  mode?: string;
  primary?: string;
};

const snippet = (values: SnippetValues): string =>
  inputConfig.snippet(values as Record<string, unknown>);

// ===========================================================================
// 1. InputState union membership
// ===========================================================================

describe("InputState union", () => {
  it("contains exactly the five documented states", () => {
    // We can't enumerate a TS type at runtime, but we can assert the REAL
    // controls.state options match and that all known states are members.
    const control = inputConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    expect(control.options).toEqual([
      "idle",
      "hover",
      "active",
      "typing",
      "invalid",
    ]);
  });

  it("every VALID_STATES entry is assignable (no typos in the fixture)", () => {
    // Belt-and-suspenders: the fixture array must have exactly 5 entries and
    // match the options list from the real config.
    const control = inputConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    expect(VALID_STATES).toHaveLength(5);
    for (const s of VALID_STATES) {
      expect(control.options).toContain(s);
    }
  });
});

// ===========================================================================
// 2. inputConfig.controls.state — customizer control wiring
// ===========================================================================

describe("inputConfig.controls.state", () => {
  it("is a select control", () => {
    expect(inputConfig.controls.state.type).toBe("select");
  });

  it("has exactly the five InputState options in order", () => {
    const control = inputConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    expect(control.options).toEqual([
      "idle",
      "hover",
      "active",
      "typing",
      "invalid",
    ]);
  });

  it("defaults to 'typing' so the preview shows the caret + revealed value", () => {
    const control = inputConfig.controls.state;
    expect(control.default).toBe("typing");
  });

  it("every option is a member of the InputState union", () => {
    const control = inputConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    for (const option of control.options) {
      expect(VALID_STATES).toContain(option as InputState);
    }
  });
});

// ===========================================================================
// 3. inputConfig.snippet — pure string builder
//    State model: snippet emits `state="<state>"` as a bare JSX prop.
//    It NEVER emits `steps` or `action`.
// ===========================================================================

describe("inputConfig.snippet: state prop emission", () => {
  it("emits state=\"idle\" for the idle option", () => {
    expect(snippet({ state: "idle" })).toContain('state="idle"');
  });

  it("emits state=\"hover\" for the hover option", () => {
    expect(snippet({ state: "hover" })).toContain('state="hover"');
  });

  it("emits state=\"active\" for the active option", () => {
    expect(snippet({ state: "active" })).toContain('state="active"');
  });

  it("emits state=\"typing\" for the typing option", () => {
    expect(snippet({ state: "typing" })).toContain('state="typing"');
  });

  it("emits state=\"invalid\" for the invalid option", () => {
    expect(snippet({ state: "invalid" })).toContain('state="invalid"');
  });

  it("emits the correct state for every control option", () => {
    const control = inputConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    for (const state of control.options) {
      const out = snippet({ state });
      expect(out).toContain(`state="${state}"`);
    }
  });
});

describe("inputConfig.snippet: NEVER emits steps or action", () => {
  it("never emits `steps` in any state", () => {
    for (const state of VALID_STATES) {
      expect(snippet({ state })).not.toContain("steps");
    }
  });

  it("never emits `action` in any state", () => {
    for (const state of VALID_STATES) {
      expect(snippet({ state })).not.toContain("action");
    }
  });
});

describe("inputConfig.snippet: import line", () => {
  it("includes `import { Input }` from the correct path", () => {
    const out = snippet({ state: "typing" });
    expect(out).toContain('import { Input }');
    expect(out).toContain('from "@/components/remocn/input"');
  });
});

describe("inputConfig.snippet: default props are omitted", () => {
  // Defaults: placeholder=you@example.com, value=remotion@remocn.dev,
  //           size=default, mode=light, primary=#171717
  const allDefaults = snippet({
    state: "typing",
    placeholder: "you@example.com",
    value: "remotion@remocn.dev",
    size: "default",
    mode: "light",
    primary: "#171717",
  });

  it("omits placeholder when it equals the default 'you@example.com'", () => {
    expect(allDefaults).not.toContain("placeholder=");
  });

  it("omits value when it equals the default 'remotion@remocn.dev'", () => {
    expect(allDefaults).not.toContain("value=");
  });

  it("omits size when it equals the default 'default'", () => {
    expect(allDefaults).not.toContain("size=");
  });

  it("omits mode when it equals the default 'light'", () => {
    expect(allDefaults).not.toContain("mode=");
  });

  it("omits primary when it equals the default '#171717'", () => {
    expect(allDefaults).not.toContain("primary=");
  });
});

describe("inputConfig.snippet: non-default props are emitted", () => {
  it("emits a non-default placeholder", () => {
    expect(snippet({ state: "idle", placeholder: "name@company.com" })).toContain('placeholder="name@company.com"');
  });

  it("emits a non-default value", () => {
    expect(snippet({ state: "typing", value: "user@test.io" })).toContain('value="user@test.io"');
  });

  it("emits a non-default size", () => {
    expect(snippet({ state: "typing", size: "lg" })).toContain('size="lg"');
  });

  it("emits a non-default mode", () => {
    expect(snippet({ state: "typing", mode: "dark" })).toContain('mode="dark"');
  });

  it("emits a non-default primary color", () => {
    expect(snippet({ state: "typing", primary: "#6366f1" })).toContain('primary="#6366f1"');
  });
});

describe("inputConfig.snippet: structural round-trip", () => {
  const out = snippet({ state: "typing" });

  it("starts with the import line", () => {
    expect(out.startsWith('import { Input }')).toBe(true);
  });

  it("contains a <Input JSX opening", () => {
    expect(out).toContain("<Input");
  });

  it("ends with a self-closing />", () => {
    expect(out.trimEnd().endsWith("/>")).toBe(true);
  });
});

// ===========================================================================
// 4. inputStyle presets — pure (state, ctx) => InputStyle
//    inputStyleContext and inputStyle are exported and frame-free.
//    Build one ctx from the default light theme, then assert the
//    numeric/opacity invariants for every state.
//    borderColor/ringColor/background are derived strings — asserted non-empty
//    only (exact values are implementation details of mixOklch).
// ===========================================================================

const ctx = inputStyleContext(defaultLightTheme);

describe("inputStyle: idle state", () => {
  const s = inputStyle("idle", ctx);

  it("ringWidth is 0 (no focus ring)", () => {
    expect(s.ringWidth).toBe(0);
  });

  it("caretOpacity is 0 (caret hidden)", () => {
    expect(s.caretOpacity).toBe(0);
  });

  it("valueReveal is 0 (value not shown)", () => {
    expect(s.valueReveal).toBe(0);
  });

  it("placeholderOpacity is 1 (placeholder fully visible)", () => {
    expect(s.placeholderOpacity).toBe(1);
  });

  it("borderColor is a non-empty string", () => {
    expect(typeof s.borderColor).toBe("string");
    expect(s.borderColor.length).toBeGreaterThan(0);
  });

  it("ringColor is a non-empty string", () => {
    expect(typeof s.ringColor).toBe("string");
    expect(s.ringColor.length).toBeGreaterThan(0);
  });

  it("background is a non-empty string", () => {
    expect(typeof s.background).toBe("string");
    expect(s.background.length).toBeGreaterThan(0);
  });
});

describe("inputStyle: hover state", () => {
  const s = inputStyle("hover", ctx);

  it("ringWidth is 0 (no focus ring on hover)", () => {
    expect(s.ringWidth).toBe(0);
  });

  it("caretOpacity is 0 (caret hidden)", () => {
    expect(s.caretOpacity).toBe(0);
  });

  it("valueReveal is 0 (value not shown)", () => {
    expect(s.valueReveal).toBe(0);
  });

  it("placeholderOpacity is 1 (placeholder fully visible)", () => {
    expect(s.placeholderOpacity).toBe(1);
  });

  it("borderColor is a non-empty string", () => {
    expect(typeof s.borderColor).toBe("string");
    expect(s.borderColor.length).toBeGreaterThan(0);
  });

  it("ringColor is a non-empty string", () => {
    expect(typeof s.ringColor).toBe("string");
    expect(s.ringColor.length).toBeGreaterThan(0);
  });

  it("background is a non-empty string", () => {
    expect(typeof s.background).toBe("string");
    expect(s.background.length).toBeGreaterThan(0);
  });
});

describe("inputStyle: active state", () => {
  const s = inputStyle("active", ctx);

  it("ringWidth is 3 (focus ring visible)", () => {
    expect(s.ringWidth).toBe(3);
  });

  it("caretOpacity is 1 (caret visible)", () => {
    expect(s.caretOpacity).toBe(1);
  });

  it("valueReveal is 0 (value not yet revealed)", () => {
    expect(s.valueReveal).toBe(0);
  });

  it("placeholderOpacity is 1 (placeholder still visible)", () => {
    expect(s.placeholderOpacity).toBe(1);
  });

  it("borderColor is a non-empty string", () => {
    expect(typeof s.borderColor).toBe("string");
    expect(s.borderColor.length).toBeGreaterThan(0);
  });

  it("ringColor is a non-empty string", () => {
    expect(typeof s.ringColor).toBe("string");
    expect(s.ringColor.length).toBeGreaterThan(0);
  });

  it("background is a non-empty string", () => {
    expect(typeof s.background).toBe("string");
    expect(s.background.length).toBeGreaterThan(0);
  });
});

describe("inputStyle: typing state", () => {
  const s = inputStyle("typing", ctx);

  it("ringWidth is 3 (focus ring visible)", () => {
    expect(s.ringWidth).toBe(3);
  });

  it("caretOpacity is 1 (caret visible while typing)", () => {
    expect(s.caretOpacity).toBe(1);
  });

  it("valueReveal is 1 (value fully revealed)", () => {
    expect(s.valueReveal).toBe(1);
  });

  it("placeholderOpacity is 0 (placeholder hidden by value)", () => {
    expect(s.placeholderOpacity).toBe(0);
  });

  it("borderColor is a non-empty string", () => {
    expect(typeof s.borderColor).toBe("string");
    expect(s.borderColor.length).toBeGreaterThan(0);
  });

  it("ringColor is a non-empty string", () => {
    expect(typeof s.ringColor).toBe("string");
    expect(s.ringColor.length).toBeGreaterThan(0);
  });

  it("background is a non-empty string", () => {
    expect(typeof s.background).toBe("string");
    expect(s.background.length).toBeGreaterThan(0);
  });
});

describe("inputStyle: invalid state", () => {
  const s = inputStyle("invalid", ctx);

  it("ringWidth is 3 (error ring visible)", () => {
    expect(s.ringWidth).toBe(3);
  });

  it("caretOpacity is 0 (caret hidden after invalid submit)", () => {
    expect(s.caretOpacity).toBe(0);
  });

  it("valueReveal is 1 (value stays revealed)", () => {
    expect(s.valueReveal).toBe(1);
  });

  it("placeholderOpacity is 0 (placeholder still hidden)", () => {
    expect(s.placeholderOpacity).toBe(0);
  });

  it("borderColor is a non-empty string", () => {
    expect(typeof s.borderColor).toBe("string");
    expect(s.borderColor.length).toBeGreaterThan(0);
  });

  it("ringColor is a non-empty string", () => {
    expect(typeof s.ringColor).toBe("string");
    expect(s.ringColor.length).toBeGreaterThan(0);
  });

  it("background is a non-empty string", () => {
    expect(typeof s.background).toBe("string");
    expect(s.background.length).toBeGreaterThan(0);
  });
});

describe("inputStyle: string-field invariant — borderColor/ringColor/background are non-empty for every state", () => {
  it("all three color fields are non-empty strings in every state", () => {
    for (const state of VALID_STATES) {
      const s = inputStyle(state, ctx);
      expect(s.borderColor.length).toBeGreaterThan(0);
      expect(s.ringColor.length).toBeGreaterThan(0);
      expect(s.background.length).toBeGreaterThan(0);
    }
  });
});

// ===========================================================================
// 5. tweenInputStyle — pure linear interpolation between two InputStyles.
//    Numbers lerp linearly; colors are oklch strings at all t.
//    Concrete pair checks below cover the seven fields.
// ===========================================================================

describe("tweenInputStyle: t=0 returns values equal to `a`", () => {
  const a = inputStyle("idle", ctx);
  const b = inputStyle("active", ctx);
  const r = tweenInputStyle(a, b, 0);

  it("ringWidth equals a.ringWidth at t=0", () => {
    expect(r.ringWidth).toBeCloseTo(a.ringWidth, 10);
  });

  it("caretOpacity equals a.caretOpacity at t=0", () => {
    expect(r.caretOpacity).toBeCloseTo(a.caretOpacity, 10);
  });

  it("valueReveal equals a.valueReveal at t=0", () => {
    expect(r.valueReveal).toBeCloseTo(a.valueReveal, 10);
  });

  it("placeholderOpacity equals a.placeholderOpacity at t=0", () => {
    expect(r.placeholderOpacity).toBeCloseTo(a.placeholderOpacity, 10);
  });

  it("borderColor is a non-empty string at t=0", () => {
    expect(typeof r.borderColor).toBe("string");
    expect(r.borderColor.length).toBeGreaterThan(0);
  });

  it("ringColor is a non-empty string at t=0", () => {
    expect(typeof r.ringColor).toBe("string");
    expect(r.ringColor.length).toBeGreaterThan(0);
  });

  it("background is a non-empty string at t=0", () => {
    expect(typeof r.background).toBe("string");
    expect(r.background.length).toBeGreaterThan(0);
  });
});

describe("tweenInputStyle: t=1 returns values equal to `b`", () => {
  const a = inputStyle("idle", ctx);
  const b = inputStyle("active", ctx);
  const r = tweenInputStyle(a, b, 1);

  it("ringWidth equals b.ringWidth at t=1", () => {
    expect(r.ringWidth).toBeCloseTo(b.ringWidth, 10);
  });

  it("caretOpacity equals b.caretOpacity at t=1", () => {
    expect(r.caretOpacity).toBeCloseTo(b.caretOpacity, 10);
  });

  it("valueReveal equals b.valueReveal at t=1", () => {
    expect(r.valueReveal).toBeCloseTo(b.valueReveal, 10);
  });

  it("placeholderOpacity equals b.placeholderOpacity at t=1", () => {
    expect(r.placeholderOpacity).toBeCloseTo(b.placeholderOpacity, 10);
  });

  it("borderColor is a non-empty string at t=1", () => {
    expect(typeof r.borderColor).toBe("string");
    expect(r.borderColor.length).toBeGreaterThan(0);
  });

  it("ringColor is a non-empty string at t=1", () => {
    expect(typeof r.ringColor).toBe("string");
    expect(r.ringColor.length).toBeGreaterThan(0);
  });

  it("background is a non-empty string at t=1", () => {
    expect(typeof r.background).toBe("string");
    expect(r.background.length).toBeGreaterThan(0);
  });
});

describe("tweenInputStyle: t=0.5 midpoint numeric lerp (idle → active)", () => {
  // idle:   ringWidth=0, caretOpacity=0, valueReveal=0, placeholderOpacity=1
  // active: ringWidth=3, caretOpacity=1, valueReveal=0, placeholderOpacity=1
  const a = inputStyle("idle", ctx);
  const b = inputStyle("active", ctx);
  const r = tweenInputStyle(a, b, 0.5);

  it("ringWidth midpoint: 0 → 3 gives 1.5", () => {
    expect(r.ringWidth).toBeCloseTo(1.5, 10);
  });

  it("caretOpacity midpoint: 0 → 1 gives 0.5", () => {
    expect(r.caretOpacity).toBeCloseTo(0.5, 10);
  });

  it("valueReveal midpoint: 0 → 0 gives 0 (both same)", () => {
    expect(r.valueReveal).toBeCloseTo(0, 10);
  });

  it("placeholderOpacity midpoint: 1 → 1 gives 1 (both same)", () => {
    expect(r.placeholderOpacity).toBeCloseTo(1, 10);
  });

  it("borderColor is a non-empty string at t=0.5", () => {
    expect(typeof r.borderColor).toBe("string");
    expect(r.borderColor.length).toBeGreaterThan(0);
  });

  it("ringColor is a non-empty string at t=0.5", () => {
    expect(typeof r.ringColor).toBe("string");
    expect(r.ringColor.length).toBeGreaterThan(0);
  });

  it("background is a non-empty string at t=0.5", () => {
    expect(typeof r.background).toBe("string");
    expect(r.background.length).toBeGreaterThan(0);
  });
});

describe("tweenInputStyle: t=0.5 midpoint numeric lerp (active → typing)", () => {
  // active: ringWidth=3, caretOpacity=1, valueReveal=0, placeholderOpacity=1
  // typing: ringWidth=3, caretOpacity=1, valueReveal=1, placeholderOpacity=0
  const a = inputStyle("active", ctx);
  const b = inputStyle("typing", ctx);
  const r = tweenInputStyle(a, b, 0.5);

  it("ringWidth midpoint: 3 → 3 gives 3 (both same)", () => {
    expect(r.ringWidth).toBeCloseTo(3, 10);
  });

  it("caretOpacity midpoint: 1 → 1 gives 1 (both same)", () => {
    expect(r.caretOpacity).toBeCloseTo(1, 10);
  });

  it("valueReveal midpoint: 0 → 1 gives 0.5", () => {
    expect(r.valueReveal).toBeCloseTo(0.5, 10);
  });

  it("placeholderOpacity midpoint: 1 → 0 gives 0.5", () => {
    expect(r.placeholderOpacity).toBeCloseTo(0.5, 10);
  });

  it("background is a non-empty string at t=0.5", () => {
    expect(typeof r.background).toBe("string");
    expect(r.background.length).toBeGreaterThan(0);
  });
});

describe("tweenInputStyle: t=0.5 midpoint numeric lerp (typing → invalid)", () => {
  // typing: ringWidth=3, caretOpacity=1, valueReveal=1, placeholderOpacity=0
  // invalid: ringWidth=3, caretOpacity=0, valueReveal=1, placeholderOpacity=0
  const a = inputStyle("typing", ctx);
  const b = inputStyle("invalid", ctx);
  const r = tweenInputStyle(a, b, 0.5);

  it("ringWidth midpoint: 3 → 3 gives 3 (both same)", () => {
    expect(r.ringWidth).toBeCloseTo(3, 10);
  });

  it("caretOpacity midpoint: 1 → 0 gives 0.5", () => {
    expect(r.caretOpacity).toBeCloseTo(0.5, 10);
  });

  it("valueReveal midpoint: 1 → 1 gives 1 (both same)", () => {
    expect(r.valueReveal).toBeCloseTo(1, 10);
  });

  it("placeholderOpacity midpoint: 0 → 0 gives 0 (both same)", () => {
    expect(r.placeholderOpacity).toBeCloseTo(0, 10);
  });

  it("borderColor is a non-empty string at t=0.5", () => {
    expect(typeof r.borderColor).toBe("string");
    expect(r.borderColor.length).toBeGreaterThan(0);
  });

  it("ringColor is a non-empty string at t=0.5", () => {
    expect(typeof r.ringColor).toBe("string");
    expect(r.ringColor.length).toBeGreaterThan(0);
  });
});
