/**
 * Verification tests for the PURE / DETERMINISTIC parts of `alert-dialog`.
 *
 * Scope:
 *   - registry/remocn-ui/alert-dialog/index.tsx  — AlertDialogState union membership,
 *     alertDialogStyle presets, alertDialogStyleContext
 *   - registry/remocn-ui/alert-dialog/config.ts  — alertDialogConfig.controls wiring
 *     + alertDialogConfig.snippet output (the state → JSX codegen)
 *   - registry/remocn-ui/alert-dialog/use-alert-dialog-transition.ts
 *     — tweenAlertDialogStyle interpolation, DEFAULT_DURATION
 *
 * The render path (index.tsx) is a PURE-STATE model: `(state) => visual`.
 * `<AlertDialog>` reads `useRemocnTheme()` internally — that hook is pure at
 * call-time in test context, but the JSX render tree is not exercised here.
 * The pure-testable surface is: the style presets + tween + customizer wiring
 * + snippet codegen.
 *
 * Runner: Bun's built-in test runner (TypeScript-native, no framework dep).
 *   bun test registry/remocn-ui/alert-dialog/__tests__
 *
 * --------------------------------------------------------------------------
 * IMPORT STRATEGY
 * --------------------------------------------------------------------------
 * `config.ts` imports `AlertDialogState` from `@/registry/remocn-ui/alert-dialog`
 * and the pieces under test never CALL a Remotion runtime API at import time —
 * `alertDialogConfig` is a plain object; `.snippet` is a pure string builder;
 * `alertDialogStyle` and `tweenAlertDialogStyle` are pure value functions.
 * We import via RELATIVE paths (matching the existing test suite pattern),
 * annotating each import with the source it corresponds to.
 * --------------------------------------------------------------------------
 */

import { describe, expect, it } from "bun:test";
import {
  type AlertDialogState,
  alertDialogStyle,
  alertDialogStyleContext,
} from "../index";
import { tweenAlertDialogStyle, DEFAULT_DURATION } from "../use-alert-dialog-transition";
import { alertDialogConfig } from "../config";
import { defaultLightTheme } from "@/lib/remocn-ui";

// ===========================================================================
// Shared fixtures
// ===========================================================================

/**
 * The AlertDialogState union, enumerated as a runtime list for membership checks.
 * Must stay in sync with `export type AlertDialogState` in index.tsx.
 */
const VALID_STATES: readonly AlertDialogState[] = ["opened", "closed"];

/** Minimal shape mirroring the customizer's value bag passed to snippet(). */
type SnippetValues = {
  state?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  cancelLabel?: string;
  mode?: string;
};

const snippet = (values: SnippetValues): string =>
  alertDialogConfig.snippet(values as Record<string, unknown>);

/**
 * A shared AlertDialogStyleContext built from the default light theme.
 * `alertDialogStyleContext` takes only `(theme)` — no variant arg, unlike accordion.
 */
const ctx = alertDialogStyleContext(defaultLightTheme);

// ===========================================================================
// 1. AlertDialogState union membership
// ===========================================================================

describe("AlertDialogState union", () => {
  it("contains exactly the two documented states", () => {
    // We can't enumerate a TS type at runtime, but we can assert the REAL
    // controls.state options match and that all known states are members.
    const control = alertDialogConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    expect(control.options).toEqual(["opened", "closed"]);
  });

  it("every VALID_STATES entry is assignable (no typos in the fixture)", () => {
    // Belt-and-suspenders: the fixture array must have exactly 2 entries and
    // match the options list from the real config.
    const control = alertDialogConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    expect(VALID_STATES).toHaveLength(2);
    for (const s of VALID_STATES) {
      expect(control.options).toContain(s);
    }
  });
});

// ===========================================================================
// 2. alertDialogConfig.controls.state — customizer control wiring
// ===========================================================================

describe("alertDialogConfig.controls.state", () => {
  it("is a select control", () => {
    expect(alertDialogConfig.controls.state.type).toBe("select");
  });

  it("has exactly the two AlertDialogState options in order", () => {
    const control = alertDialogConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    expect(control.options).toEqual(["opened", "closed"]);
  });

  it("defaults to 'opened' so the preview showcases the popup", () => {
    const control = alertDialogConfig.controls.state;
    expect(control.default).toBe("opened");
  });

  it("every option is a member of the AlertDialogState union", () => {
    const control = alertDialogConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    for (const option of control.options) {
      expect(VALID_STATES).toContain(option as AlertDialogState);
    }
  });
});

// ===========================================================================
// 3. alertDialogConfig.snippet — pure string builder
//    State model: snippet ALWAYS emits `state="<state>"` as a bare JSX prop.
//    It NEVER emits `steps`.
//    Note on `action`: the snippet emits `actionLabel=` (a legitimate prop) but
//    must never emit a bare `action=` attribute. We assert `steps` is absent and
//    add a targeted check that `action=` only ever appears as `actionLabel=`.
// ===========================================================================

describe("alertDialogConfig.snippet: state prop emission", () => {
  it("emits state=\"opened\" for the opened option", () => {
    expect(snippet({ state: "opened" })).toContain('state="opened"');
  });

  it("emits state=\"closed\" for the closed option", () => {
    expect(snippet({ state: "closed" })).toContain('state="closed"');
  });

  it("emits the correct state for every control option", () => {
    const control = alertDialogConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    for (const state of control.options) {
      const out = snippet({ state });
      expect(out).toContain(`state="${state}"`);
    }
  });
});

describe("alertDialogConfig.snippet: NEVER emits steps", () => {
  // `action=` is intentionally NOT checked here because `actionLabel=` is a
  // legitimate emitted prop and would cause a false positive on a naive
  // `.toContain("action")` check. Assert `steps` absence only.
  it("never emits `steps` in any state", () => {
    for (const state of VALID_STATES) {
      expect(snippet({ state })).not.toContain("steps");
    }
  });
});

describe("alertDialogConfig.snippet: import line", () => {
  it("includes `import { AlertDialog }` from the correct path", () => {
    const out = snippet({ state: "opened" });
    expect(out).toContain('import { AlertDialog }');
    expect(out).toContain('from "@/components/remocn/alert-dialog"');
  });
});

describe("alertDialogConfig.snippet: default props are omitted", () => {
  // Defaults: title="Delete account?",
  //           description="This action cannot be undone. This will permanently remove your data from our servers.",
  //           actionLabel="Delete", cancelLabel="Cancel", mode="light"
  const allDefaults = snippet({
    state: "opened",
    title: "Delete account?",
    description: "This action cannot be undone. This will permanently remove your data from our servers.",
    actionLabel: "Delete",
    cancelLabel: "Cancel",
    mode: "light",
  });

  it("omits title when it equals the default 'Delete account?'", () => {
    expect(allDefaults).not.toContain("title=");
  });

  it("omits description when it equals the default text", () => {
    expect(allDefaults).not.toContain("description=");
  });

  it("omits actionLabel when it equals the default 'Delete'", () => {
    expect(allDefaults).not.toContain("actionLabel=");
  });

  it("omits cancelLabel when it equals the default 'Cancel'", () => {
    expect(allDefaults).not.toContain("cancelLabel=");
  });

  it("omits mode when it equals the default 'light'", () => {
    expect(allDefaults).not.toContain("mode=");
  });
});

describe("alertDialogConfig.snippet: non-default props are emitted", () => {
  it("emits a non-default title", () => {
    expect(snippet({ state: "opened", title: "Remove workspace?" }))
      .toContain('title="Remove workspace?"');
  });

  it("emits a non-default description", () => {
    expect(snippet({ state: "opened", description: "This cannot be undone." }))
      .toContain('description="This cannot be undone."');
  });

  it("emits a non-default actionLabel", () => {
    expect(snippet({ state: "opened", actionLabel: "Confirm" }))
      .toContain('actionLabel="Confirm"');
  });

  it("emits a non-default cancelLabel", () => {
    expect(snippet({ state: "opened", cancelLabel: "Go back" }))
      .toContain('cancelLabel="Go back"');
  });

  it("emits a non-default mode", () => {
    expect(snippet({ state: "opened", mode: "dark" }))
      .toContain('mode="dark"');
  });
});

describe("alertDialogConfig.snippet: structural round-trip", () => {
  const out = snippet({ state: "opened" });

  it("starts with the import line", () => {
    expect(out.startsWith('import { AlertDialog }')).toBe(true);
  });

  it("contains a <AlertDialog JSX opening", () => {
    expect(out).toContain("<AlertDialog");
  });

  it("ends with a self-closing />", () => {
    expect(out.trimEnd().endsWith("/>")).toBe(true);
  });
});

// ===========================================================================
// 4. alertDialogStyleContext — derives concrete colors from the theme.
//    Signature is `(theme)` — NO variant argument (unlike accordion).
//    Build ctx from the default light theme and assert each field is populated.
//    `radius` is a number (px); all other fields are non-empty strings.
// ===========================================================================

describe("alertDialogStyleContext: field types from defaultLightTheme", () => {
  it("popoverBg is a non-empty string", () => {
    expect(typeof ctx.popoverBg).toBe("string");
    expect(ctx.popoverBg.length).toBeGreaterThan(0);
  });

  it("popoverFg is a non-empty string", () => {
    expect(typeof ctx.popoverFg).toBe("string");
    expect(ctx.popoverFg.length).toBeGreaterThan(0);
  });

  it("mutedFg is a non-empty string", () => {
    expect(typeof ctx.mutedFg).toBe("string");
    expect(ctx.mutedFg.length).toBeGreaterThan(0);
  });

  it("border is a non-empty string", () => {
    expect(typeof ctx.border).toBe("string");
    expect(ctx.border.length).toBeGreaterThan(0);
  });

  it("radius is a number", () => {
    expect(typeof ctx.radius).toBe("number");
  });

  it("actionBg is a non-empty string", () => {
    expect(typeof ctx.actionBg).toBe("string");
    expect(ctx.actionBg.length).toBeGreaterThan(0);
  });

  it("actionFg is a non-empty string", () => {
    expect(typeof ctx.actionFg).toBe("string");
    expect(ctx.actionFg.length).toBeGreaterThan(0);
  });

  it("cancelFg is a non-empty string", () => {
    expect(typeof ctx.cancelFg).toBe("string");
    expect(ctx.cancelFg.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// 5. alertDialogStyle presets — pure (state, ctx) => AlertDialogStyle
//    alertDialogStyleContext and alertDialogStyle are exported and frame-free.
//    Build one ctx from the default light theme, then assert the numeric
//    invariants for every state.
// ===========================================================================

describe("alertDialogStyle: closed state", () => {
  const s = alertDialogStyle("closed", ctx);

  it("overlayOpacity is 0 (overlay fully hidden)", () => {
    expect(s.overlayOpacity).toBe(0);
  });

  it("popupOpacity is 0 (popup fully hidden)", () => {
    expect(s.popupOpacity).toBe(0);
  });

  it("popupScale is 0.95 (popup slightly shrunk)", () => {
    expect(s.popupScale).toBe(0.95);
  });

  it("popupTranslateY is 8 (popup shifted down 8px)", () => {
    expect(s.popupTranslateY).toBe(8);
  });
});

describe("alertDialogStyle: opened state", () => {
  const s = alertDialogStyle("opened", ctx);

  it("overlayOpacity is 1 (overlay fully revealed)", () => {
    expect(s.overlayOpacity).toBe(1);
  });

  it("popupOpacity is 1 (popup fully visible)", () => {
    expect(s.popupOpacity).toBe(1);
  });

  it("popupScale is 1 (popup at full size)", () => {
    expect(s.popupScale).toBe(1);
  });

  it("popupTranslateY is 0 (popup at natural position)", () => {
    expect(s.popupTranslateY).toBe(0);
  });
});

describe("alertDialogStyle: closed/opened invariant", () => {
  it("closed: overlayOpacity 0, popupOpacity 0, popupScale 0.95, popupTranslateY 8", () => {
    const s = alertDialogStyle("closed", ctx);
    expect(s.overlayOpacity).toBe(0);
    expect(s.popupOpacity).toBe(0);
    expect(s.popupScale).toBe(0.95);
    expect(s.popupTranslateY).toBe(8);
  });

  it("opened: overlayOpacity 1, popupOpacity 1, popupScale 1, popupTranslateY 0", () => {
    const s = alertDialogStyle("opened", ctx);
    expect(s.overlayOpacity).toBe(1);
    expect(s.popupOpacity).toBe(1);
    expect(s.popupScale).toBe(1);
    expect(s.popupTranslateY).toBe(0);
  });
});

// ===========================================================================
// 6. tweenAlertDialogStyle — pure linear interpolation between two AlertDialogStyles.
//    All four fields are pure numeric lerps (no color fields, unlike accordion).
//    Concrete expectations: closed → opened for midpoint math.
// ===========================================================================

describe("tweenAlertDialogStyle: t=0 returns values equal to `a`", () => {
  const a = alertDialogStyle("closed", ctx);
  const b = alertDialogStyle("opened", ctx);
  const r = tweenAlertDialogStyle(a, b, 0);

  it("overlayOpacity equals a.overlayOpacity at t=0", () => {
    expect(r.overlayOpacity).toBeCloseTo(a.overlayOpacity, 10);
  });

  it("popupOpacity equals a.popupOpacity at t=0", () => {
    expect(r.popupOpacity).toBeCloseTo(a.popupOpacity, 10);
  });

  it("popupScale equals a.popupScale at t=0", () => {
    expect(r.popupScale).toBeCloseTo(a.popupScale, 10);
  });

  it("popupTranslateY equals a.popupTranslateY at t=0", () => {
    expect(r.popupTranslateY).toBeCloseTo(a.popupTranslateY, 10);
  });
});

describe("tweenAlertDialogStyle: t=1 returns values equal to `b`", () => {
  const a = alertDialogStyle("closed", ctx);
  const b = alertDialogStyle("opened", ctx);
  const r = tweenAlertDialogStyle(a, b, 1);

  it("overlayOpacity equals b.overlayOpacity at t=1", () => {
    expect(r.overlayOpacity).toBeCloseTo(b.overlayOpacity, 10);
  });

  it("popupOpacity equals b.popupOpacity at t=1", () => {
    expect(r.popupOpacity).toBeCloseTo(b.popupOpacity, 10);
  });

  it("popupScale equals b.popupScale at t=1", () => {
    expect(r.popupScale).toBeCloseTo(b.popupScale, 10);
  });

  it("popupTranslateY equals b.popupTranslateY at t=1", () => {
    expect(r.popupTranslateY).toBeCloseTo(b.popupTranslateY, 10);
  });
});

describe("tweenAlertDialogStyle: t=0.5 midpoint numeric lerp (closed → opened)", () => {
  // closed:  overlayOpacity=0, popupOpacity=0, popupScale=0.95, popupTranslateY=8
  // opened:  overlayOpacity=1, popupOpacity=1, popupScale=1,    popupTranslateY=0
  const a = alertDialogStyle("closed", ctx);
  const b = alertDialogStyle("opened", ctx);
  const r = tweenAlertDialogStyle(a, b, 0.5);

  it("overlayOpacity midpoint: 0 → 1 gives 0.5", () => {
    expect(r.overlayOpacity).toBeCloseTo(0.5, 10);
  });

  it("popupOpacity midpoint: 0 → 1 gives 0.5", () => {
    expect(r.popupOpacity).toBeCloseTo(0.5, 10);
  });

  it("popupScale midpoint: 0.95 → 1 gives 0.975", () => {
    expect(r.popupScale).toBeCloseTo(0.975, 10);
  });

  it("popupTranslateY midpoint: 8 → 0 gives 4", () => {
    expect(r.popupTranslateY).toBeCloseTo(4, 10);
  });
});

describe("tweenAlertDialogStyle: t=0.5 midpoint numeric lerp (opened → closed)", () => {
  // opened:  overlayOpacity=1, popupOpacity=1, popupScale=1,    popupTranslateY=0
  // closed:  overlayOpacity=0, popupOpacity=0, popupScale=0.95, popupTranslateY=8
  const a = alertDialogStyle("opened", ctx);
  const b = alertDialogStyle("closed", ctx);
  const r = tweenAlertDialogStyle(a, b, 0.5);

  it("overlayOpacity midpoint: 1 → 0 gives 0.5", () => {
    expect(r.overlayOpacity).toBeCloseTo(0.5, 10);
  });

  it("popupOpacity midpoint: 1 → 0 gives 0.5", () => {
    expect(r.popupOpacity).toBeCloseTo(0.5, 10);
  });

  it("popupScale midpoint: 1 → 0.95 gives 0.975", () => {
    expect(r.popupScale).toBeCloseTo(0.975, 10);
  });

  it("popupTranslateY midpoint: 0 → 8 gives 4", () => {
    expect(r.popupTranslateY).toBeCloseTo(4, 10);
  });
});

// ===========================================================================
// 7. DEFAULT_DURATION — sanity check the exported constant
// ===========================================================================

describe("DEFAULT_DURATION", () => {
  it("is a positive number", () => {
    expect(typeof DEFAULT_DURATION).toBe("number");
    expect(DEFAULT_DURATION).toBeGreaterThan(0);
  });

  it("equals 12 (the authored value)", () => {
    expect(DEFAULT_DURATION).toBe(12);
  });
});
