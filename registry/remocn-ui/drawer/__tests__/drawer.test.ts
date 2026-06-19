
import { describe, expect, it } from "bun:test";
import {
  type DrawerState,
  drawerStyle,
  drawerStyleContext,
} from "../index";
import { tweenDrawerStyle, DEFAULT_DURATION } from "../use-drawer-transition";
import { drawerConfig } from "../config";
import { defaultLightTheme } from "@/lib/remocn-ui";

const VALID_STATES: readonly DrawerState[] = ["opened", "closed"];

type SnippetValues = {
  state?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  cancelLabel?: string;
};

const snippet = (values: SnippetValues): string =>
  drawerConfig.snippet(values as Record<string, unknown>);

const ctx = drawerStyleContext(defaultLightTheme);

describe("DrawerState union", () => {
  it("contains exactly the two documented states", () => {
    const control = drawerConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    expect(control.options).toEqual(["opened", "closed"]);
  });

  it("every VALID_STATES entry is assignable (no typos in the fixture)", () => {
    const control = drawerConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    expect(VALID_STATES).toHaveLength(2);
    for (const s of VALID_STATES) {
      expect(control.options).toContain(s);
    }
  });
});

describe("drawerConfig.controls.state", () => {
  it("is a select control", () => {
    expect(drawerConfig.controls.state.type).toBe("select");
  });

  it("has exactly the two DrawerState options in order", () => {
    const control = drawerConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    expect(control.options).toEqual(["opened", "closed"]);
  });

  it("defaults to 'opened' so the preview showcases the panel", () => {
    const control = drawerConfig.controls.state;
    expect(control.default).toBe("opened");
  });

  it("every option is a member of the DrawerState union", () => {
    const control = drawerConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    for (const option of control.options) {
      expect(VALID_STATES).toContain(option as DrawerState);
    }
  });
});

describe("drawerConfig.snippet: state prop emission", () => {
  it("emits state=\"opened\" for the opened option", () => {
    expect(snippet({ state: "opened" })).toContain('state="opened"');
  });

  it("emits state=\"closed\" for the closed option", () => {
    expect(snippet({ state: "closed" })).toContain('state="closed"');
  });

  it("emits the correct state for every control option", () => {
    const control = drawerConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    for (const state of control.options) {
      const out = snippet({ state });
      expect(out).toContain(`state="${state}"`);
    }
  });
});

describe("drawerConfig.snippet: NEVER emits steps", () => {
  it("never emits `steps` in any state", () => {
    for (const state of VALID_STATES) {
      expect(snippet({ state })).not.toContain("steps");
    }
  });
});

describe("drawerConfig.snippet: import line", () => {
  it("includes `import { Drawer }` from the correct path", () => {
    const out = snippet({ state: "opened" });
    expect(out).toContain('import { Drawer }');
    expect(out).toContain('from "@/components/remocn/drawer"');
  });
});

describe("drawerConfig.snippet: default props are omitted", () => {
  const allDefaults = snippet({
    state: "opened",
    title: "Edit profile",
    description: "Make changes to your profile here. Click save when you're done.",
    actionLabel: "Save changes",
    cancelLabel: "Cancel",
  });

  it("omits title when it equals the default 'Edit profile'", () => {
    expect(allDefaults).not.toContain("title=");
  });

  it("omits description when it equals the default text", () => {
    expect(allDefaults).not.toContain("description=");
  });

  it("omits actionLabel when it equals the default 'Save changes'", () => {
    expect(allDefaults).not.toContain("actionLabel=");
  });

  it("omits cancelLabel when it equals the default 'Cancel'", () => {
    expect(allDefaults).not.toContain("cancelLabel=");
  });
});

describe("drawerConfig.snippet: non-default props are emitted", () => {
  it("emits a non-default title", () => {
    expect(snippet({ state: "opened", title: "Edit workspace settings" }))
      .toContain('title="Edit workspace settings"');
  });

  it("emits a non-default description", () => {
    expect(snippet({ state: "opened", description: "Update your workspace name and settings." }))
      .toContain('description="Update your workspace name and settings."');
  });

  it("emits a non-default actionLabel", () => {
    expect(snippet({ state: "opened", actionLabel: "Confirm" }))
      .toContain('actionLabel="Confirm"');
  });

  it("emits a non-default cancelLabel", () => {
    expect(snippet({ state: "opened", cancelLabel: "Go back" }))
      .toContain('cancelLabel="Go back"');
  });
});

describe("drawerConfig.snippet: structural round-trip", () => {
  const out = snippet({ state: "opened" });

  it("starts with the import line", () => {
    expect(out.startsWith('import { Drawer }')).toBe(true);
  });

  it("contains a <Drawer JSX opening", () => {
    expect(out).toContain("<Drawer");
  });

  it("ends with a self-closing />", () => {
    expect(out.trimEnd().endsWith("/>")).toBe(true);
  });
});

describe("drawerStyleContext: field types from defaultLightTheme", () => {
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

describe("drawerStyle: closed state", () => {
  const s = drawerStyle("closed", ctx);

  it("overlayOpacity is 0 (overlay fully hidden)", () => {
    expect(s.overlayOpacity).toBe(0);
  });

  it("panelOpacity is 0 (panel fully hidden)", () => {
    expect(s.panelOpacity).toBe(0);
  });

  it("panelTranslateY is 320 (panel off-screen below the bottom edge)", () => {
    expect(s.panelTranslateY).toBe(320);
  });
});

describe("drawerStyle: opened state", () => {
  const s = drawerStyle("opened", ctx);

  it("overlayOpacity is 1 (overlay fully revealed)", () => {
    expect(s.overlayOpacity).toBe(1);
  });

  it("panelOpacity is 1 (panel fully visible)", () => {
    expect(s.panelOpacity).toBe(1);
  });

  it("panelTranslateY is 0 (panel at its resting position)", () => {
    expect(s.panelTranslateY).toBe(0);
  });
});

describe("drawerStyle: closed/opened invariant", () => {
  it("closed: overlayOpacity 0, panelOpacity 0, panelTranslateY 320", () => {
    const s = drawerStyle("closed", ctx);
    expect(s.overlayOpacity).toBe(0);
    expect(s.panelOpacity).toBe(0);
    expect(s.panelTranslateY).toBe(320);
  });

  it("opened: overlayOpacity 1, panelOpacity 1, panelTranslateY 0", () => {
    const s = drawerStyle("opened", ctx);
    expect(s.overlayOpacity).toBe(1);
    expect(s.panelOpacity).toBe(1);
    expect(s.panelTranslateY).toBe(0);
  });
});

describe("tweenDrawerStyle: t=0 returns values equal to `a`", () => {
  const a = drawerStyle("closed", ctx);
  const b = drawerStyle("opened", ctx);
  const r = tweenDrawerStyle(a, b, 0);

  it("overlayOpacity equals a.overlayOpacity at t=0", () => {
    expect(r.overlayOpacity).toBeCloseTo(a.overlayOpacity, 10);
  });

  it("panelOpacity equals a.panelOpacity at t=0", () => {
    expect(r.panelOpacity).toBeCloseTo(a.panelOpacity, 10);
  });

  it("panelTranslateY equals a.panelTranslateY at t=0", () => {
    expect(r.panelTranslateY).toBeCloseTo(a.panelTranslateY, 10);
  });
});

describe("tweenDrawerStyle: t=1 returns values equal to `b`", () => {
  const a = drawerStyle("closed", ctx);
  const b = drawerStyle("opened", ctx);
  const r = tweenDrawerStyle(a, b, 1);

  it("overlayOpacity equals b.overlayOpacity at t=1", () => {
    expect(r.overlayOpacity).toBeCloseTo(b.overlayOpacity, 10);
  });

  it("panelOpacity equals b.panelOpacity at t=1", () => {
    expect(r.panelOpacity).toBeCloseTo(b.panelOpacity, 10);
  });

  it("panelTranslateY equals b.panelTranslateY at t=1", () => {
    expect(r.panelTranslateY).toBeCloseTo(b.panelTranslateY, 10);
  });
});

describe("tweenDrawerStyle: t=0.5 midpoint numeric lerp (closed → opened)", () => {
  const a = drawerStyle("closed", ctx);
  const b = drawerStyle("opened", ctx);
  const r = tweenDrawerStyle(a, b, 0.5);

  it("overlayOpacity midpoint: 0 → 1 gives 0.5", () => {
    expect(r.overlayOpacity).toBeCloseTo(0.5, 10);
  });

  it("panelOpacity midpoint: 0 → 1 gives 0.5", () => {
    expect(r.panelOpacity).toBeCloseTo(0.5, 10);
  });

  it("panelTranslateY midpoint: 320 → 0 gives 160", () => {
    expect(r.panelTranslateY).toBeCloseTo(160, 10);
  });
});

describe("tweenDrawerStyle: t=0.5 midpoint numeric lerp (opened → closed)", () => {
  const a = drawerStyle("opened", ctx);
  const b = drawerStyle("closed", ctx);
  const r = tweenDrawerStyle(a, b, 0.5);

  it("overlayOpacity midpoint: 1 → 0 gives 0.5", () => {
    expect(r.overlayOpacity).toBeCloseTo(0.5, 10);
  });

  it("panelOpacity midpoint: 1 → 0 gives 0.5", () => {
    expect(r.panelOpacity).toBeCloseTo(0.5, 10);
  });

  it("panelTranslateY midpoint: 0 → 320 gives 160", () => {
    expect(r.panelTranslateY).toBeCloseTo(160, 10);
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
