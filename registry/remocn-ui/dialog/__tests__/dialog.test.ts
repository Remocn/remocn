import { describe, expect, it } from "bun:test";
import { defaultLightTheme } from "@/lib/remocn-ui";
import { dialogConfig } from "../config";
import { type DialogState, dialogStyle, dialogStyleContext } from "../index";
import { DEFAULT_DURATION, tweenDialogStyle } from "../use-dialog-transition";

const VALID_STATES: readonly DialogState[] = ["opened", "closed"];

type SnippetValues = {
  state?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  cancelLabel?: string;
};

const snippet = (values: SnippetValues): string =>
  dialogConfig.snippet(values as Record<string, unknown>);

const ctx = dialogStyleContext(defaultLightTheme);

describe("DialogState union", () => {
  it("contains exactly the two documented states", () => {
    const control = dialogConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(control.options).toEqual(["opened", "closed"]);
  });

  it("every VALID_STATES entry is assignable (no typos in the fixture)", () => {
    const control = dialogConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(VALID_STATES).toHaveLength(2);
    for (const s of VALID_STATES) {
      expect(control.options).toContain(s);
    }
  });
});

describe("dialogConfig.controls.state", () => {
  it("is a select control", () => {
    expect(dialogConfig.controls.state.type).toBe("select");
  });

  it("has exactly the two DialogState options in order", () => {
    const control = dialogConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(control.options).toEqual(["opened", "closed"]);
  });

  it("defaults to 'opened' so the preview showcases the popup", () => {
    const control = dialogConfig.controls.state;
    expect(control.default).toBe("opened");
  });

  it("every option is a member of the DialogState union", () => {
    const control = dialogConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    for (const option of control.options) {
      expect(VALID_STATES).toContain(option as DialogState);
    }
  });
});

describe("dialogConfig.snippet: state prop emission", () => {
  it('emits state="opened" for the opened option', () => {
    expect(snippet({ state: "opened" })).toContain('state="opened"');
  });

  it('emits state="closed" for the closed option', () => {
    expect(snippet({ state: "closed" })).toContain('state="closed"');
  });

  it("emits the correct state for every control option", () => {
    const control = dialogConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    for (const state of control.options) {
      const out = snippet({ state });
      expect(out).toContain(`state="${state}"`);
    }
  });
});

describe("dialogConfig.snippet: NEVER emits steps", () => {
  it("never emits `steps` in any state", () => {
    for (const state of VALID_STATES) {
      expect(snippet({ state })).not.toContain("steps");
    }
  });
});

describe("dialogConfig.snippet: import line", () => {
  it("includes `import { Dialog }` from the correct path", () => {
    const out = snippet({ state: "opened" });
    expect(out).toContain("import { Dialog }");
    expect(out).toContain('from "@/components/remocn/dialog"');
  });
});

describe("dialogConfig.snippet: default props are omitted", () => {
  const allDefaults = snippet({
    state: "opened",
    title: "Edit profile",
    description:
      "Make changes to your profile here. Click save when you're done.",
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

describe("dialogConfig.snippet: non-default props are emitted", () => {
  it("emits a non-default title", () => {
    expect(
      snippet({ state: "opened", title: "Edit workspace settings" }),
    ).toContain('title="Edit workspace settings"');
  });

  it("emits a non-default description", () => {
    expect(
      snippet({
        state: "opened",
        description: "Update your workspace name and settings.",
      }),
    ).toContain('description="Update your workspace name and settings."');
  });

  it("emits a non-default actionLabel", () => {
    expect(snippet({ state: "opened", actionLabel: "Confirm" })).toContain(
      'actionLabel="Confirm"',
    );
  });

  it("emits a non-default cancelLabel", () => {
    expect(snippet({ state: "opened", cancelLabel: "Go back" })).toContain(
      'cancelLabel="Go back"',
    );
  });
});

describe("dialogConfig.snippet: structural round-trip", () => {
  const out = snippet({ state: "opened" });

  it("starts with the import line", () => {
    expect(out.startsWith("import { Dialog }")).toBe(true);
  });

  it("contains a <Dialog JSX opening", () => {
    expect(out).toContain("<Dialog");
  });

  it("ends with a self-closing />", () => {
    expect(out.trimEnd().endsWith("/>")).toBe(true);
  });
});

describe("dialogStyleContext: field types from defaultLightTheme", () => {
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

describe("dialogStyle: closed state", () => {
  const s = dialogStyle("closed", ctx);

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

describe("dialogStyle: opened state", () => {
  const s = dialogStyle("opened", ctx);

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

describe("dialogStyle: closed/opened invariant", () => {
  it("closed: overlayOpacity 0, popupOpacity 0, popupScale 0.95, popupTranslateY 8", () => {
    const s = dialogStyle("closed", ctx);
    expect(s.overlayOpacity).toBe(0);
    expect(s.popupOpacity).toBe(0);
    expect(s.popupScale).toBe(0.95);
    expect(s.popupTranslateY).toBe(8);
  });

  it("opened: overlayOpacity 1, popupOpacity 1, popupScale 1, popupTranslateY 0", () => {
    const s = dialogStyle("opened", ctx);
    expect(s.overlayOpacity).toBe(1);
    expect(s.popupOpacity).toBe(1);
    expect(s.popupScale).toBe(1);
    expect(s.popupTranslateY).toBe(0);
  });
});

describe("tweenDialogStyle: t=0 returns values equal to `a`", () => {
  const a = dialogStyle("closed", ctx);
  const b = dialogStyle("opened", ctx);
  const r = tweenDialogStyle(a, b, 0);

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

describe("tweenDialogStyle: t=1 returns values equal to `b`", () => {
  const a = dialogStyle("closed", ctx);
  const b = dialogStyle("opened", ctx);
  const r = tweenDialogStyle(a, b, 1);

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

describe("tweenDialogStyle: t=0.5 midpoint numeric lerp (closed → opened)", () => {
  const a = dialogStyle("closed", ctx);
  const b = dialogStyle("opened", ctx);
  const r = tweenDialogStyle(a, b, 0.5);

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

describe("tweenDialogStyle: t=0.5 midpoint numeric lerp (opened → closed)", () => {
  const a = dialogStyle("opened", ctx);
  const b = dialogStyle("closed", ctx);
  const r = tweenDialogStyle(a, b, 0.5);

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
