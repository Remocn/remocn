
import { describe, expect, it } from "bun:test";
import {
  type AlertDialogState,
  alertDialogStyle,
  alertDialogStyleContext,
} from "../index";
import { tweenAlertDialogStyle, DEFAULT_DURATION } from "../use-alert-dialog-transition";
import { alertDialogConfig } from "../config";
import { defaultLightTheme } from "@/lib/remocn-ui";

const VALID_STATES: readonly AlertDialogState[] = ["opened", "closed"];

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

const ctx = alertDialogStyleContext(defaultLightTheme);

describe("AlertDialogState union", () => {
  it("contains exactly the two documented states", () => {
    const control = alertDialogConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    expect(control.options).toEqual(["opened", "closed"]);
  });

  it("every VALID_STATES entry is assignable (no typos in the fixture)", () => {
    const control = alertDialogConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    expect(VALID_STATES).toHaveLength(2);
    for (const s of VALID_STATES) {
      expect(control.options).toContain(s);
    }
  });
});

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

describe("DEFAULT_DURATION", () => {
  it("is a positive number", () => {
    expect(typeof DEFAULT_DURATION).toBe("number");
    expect(DEFAULT_DURATION).toBeGreaterThan(0);
  });

  it("equals 12 (the authored value)", () => {
    expect(DEFAULT_DURATION).toBe(12);
  });
});
