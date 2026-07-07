import { describe, expect, it } from "bun:test";
import { defaultLightTheme } from "@/lib/remocn-ui";
import { selectConfig } from "../config";
import { type SelectState, selectStyle, selectStyleContext } from "../index";
import { DEFAULT_DURATION, tweenSelectStyle } from "../use-select-transition";

const VALID_STATES: readonly SelectState[] = ["opened", "closed"];

type SnippetValues = {
  state?: string;
  label?: string;
  selectedIndex?: number;
  highlightedIndex?: number;
};

const snippet = (values: SnippetValues): string =>
  selectConfig.snippet(values as Record<string, unknown>);

const ctx = selectStyleContext(defaultLightTheme);

describe("SelectState union", () => {
  it("contains exactly the two documented states", () => {
    const control = selectConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(control.options).toEqual(["opened", "closed"]);
  });

  it("every VALID_STATES entry is assignable (no typos in the fixture)", () => {
    const control = selectConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(VALID_STATES).toHaveLength(2);
    for (const s of VALID_STATES) {
      expect(control.options).toContain(s);
    }
  });
});

describe("selectConfig.controls.state", () => {
  it("is a select control", () => {
    expect(selectConfig.controls.state.type).toBe("select");
  });

  it("has exactly the two SelectState options in order", () => {
    const control = selectConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(control.options).toEqual(["opened", "closed"]);
  });

  it("defaults to 'opened' so the preview shows the revealed panel", () => {
    const control = selectConfig.controls.state;
    expect(control.default).toBe("opened");
  });

  it("every option is a member of the SelectState union", () => {
    const control = selectConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    for (const option of control.options) {
      expect(VALID_STATES).toContain(option as SelectState);
    }
  });
});

describe("selectConfig.snippet: state prop emission", () => {
  it('emits state="opened" for the opened option', () => {
    expect(snippet({ state: "opened" })).toContain('state="opened"');
  });

  it('emits state="closed" for the closed option', () => {
    expect(snippet({ state: "closed" })).toContain('state="closed"');
  });

  it("emits the correct state for every control option", () => {
    const control = selectConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    for (const state of control.options) {
      const out = snippet({ state });
      expect(out).toContain(`state="${state}"`);
    }
  });
});

describe("selectConfig.snippet: import line", () => {
  it("includes `import { Select }` from the correct path", () => {
    const out = snippet({ state: "opened" });
    expect(out).toContain("import { Select }");
    expect(out).toContain('from "@/components/remocn/select"');
  });
});

describe("selectConfig.snippet: default props are omitted", () => {
  const allDefaults = snippet({
    state: "opened",
    label: "Select a fruit",
    selectedIndex: -1,
    highlightedIndex: -1,
  });

  it("omits label when it equals the default 'Select a fruit'", () => {
    expect(allDefaults).not.toContain("label=");
  });

  it("omits selectedIndex when it equals the default -1", () => {
    expect(allDefaults).not.toContain("selectedIndex=");
  });

  it("omits highlightedIndex when it equals the default -1", () => {
    expect(allDefaults).not.toContain("highlightedIndex=");
  });
});

describe("selectConfig.snippet: non-default props are emitted", () => {
  it("emits a non-default label", () => {
    expect(snippet({ state: "opened", label: "Choose a color" })).toContain(
      'label="Choose a color"',
    );
  });

  it("emits a non-default selectedIndex", () => {
    expect(snippet({ state: "opened", selectedIndex: 2 })).toContain(
      "selectedIndex={2}",
    );
  });

  it("emits a non-default highlightedIndex", () => {
    expect(snippet({ state: "opened", highlightedIndex: 1 })).toContain(
      "highlightedIndex={1}",
    );
  });
});

describe("selectConfig.snippet: structural round-trip", () => {
  const out = snippet({ state: "opened" });

  it("starts with the import line", () => {
    expect(out.startsWith("import { Select }")).toBe(true);
  });

  it("contains a <Select JSX opening", () => {
    expect(out).toContain("<Select");
  });

  it("ends with a self-closing />", () => {
    expect(out.trimEnd().endsWith("/>")).toBe(true);
  });
});

describe("selectStyleContext: field types from defaultLightTheme", () => {
  it("panelBg is a non-empty string", () => {
    expect(typeof ctx.panelBg).toBe("string");
    expect(ctx.panelBg.length).toBeGreaterThan(0);
  });

  it("panelBorder is a non-empty string", () => {
    expect(typeof ctx.panelBorder).toBe("string");
    expect(ctx.panelBorder.length).toBeGreaterThan(0);
  });

  it("triggerFg is a non-empty string", () => {
    expect(typeof ctx.triggerFg).toBe("string");
    expect(ctx.triggerFg.length).toBeGreaterThan(0);
  });

  it("mutedFg is a non-empty string", () => {
    expect(typeof ctx.mutedFg).toBe("string");
    expect(ctx.mutedFg.length).toBeGreaterThan(0);
  });

  it("radius is a number", () => {
    expect(typeof ctx.radius).toBe("number");
  });

  it("triggerCtx is a non-null object (ButtonStyleContext)", () => {
    expect(typeof ctx.triggerCtx).toBe("object");
    expect(ctx.triggerCtx).not.toBeNull();
  });

  it("itemCtx is a non-null object (SelectItemStyleContext)", () => {
    expect(typeof ctx.itemCtx).toBe("object");
    expect(ctx.itemCtx).not.toBeNull();
  });
});

describe("selectStyleContext: maps theme tokens correctly", () => {
  it("panelBg equals theme.popover", () => {
    expect(ctx.panelBg).toBe(defaultLightTheme.popover);
  });

  it("panelBorder equals theme.border", () => {
    expect(ctx.panelBorder).toBe(defaultLightTheme.border);
  });

  it("triggerFg equals theme.foreground", () => {
    expect(ctx.triggerFg).toBe(defaultLightTheme.foreground);
  });

  it("mutedFg equals theme.mutedForeground", () => {
    expect(ctx.mutedFg).toBe(defaultLightTheme.mutedForeground);
  });

  it("radius equals theme.radius", () => {
    expect(ctx.radius).toBe(defaultLightTheme.radius);
  });
});

describe("selectStyle: opened state", () => {
  const s = selectStyle("opened", ctx);

  it("panelOpacity is 1 (panel fully visible)", () => {
    expect(s.panelOpacity).toBe(1);
  });

  it("panelScale is 1 (panel at full size)", () => {
    expect(s.panelScale).toBe(1);
  });

  it("panelTranslateY is 0 (panel at natural position)", () => {
    expect(s.panelTranslateY).toBe(0);
  });

  it("chevronRotation is 180 (chevron flipped)", () => {
    expect(s.chevronRotation).toBe(180);
  });
});

describe("selectStyle: closed state", () => {
  const s = selectStyle("closed", ctx);

  it("panelOpacity is 0 (panel fully hidden)", () => {
    expect(s.panelOpacity).toBe(0);
  });

  it("panelScale is 0.96 (panel slightly shrunk)", () => {
    expect(s.panelScale).toBe(0.96);
  });

  it("panelTranslateY is -4 (panel lifted -4px)", () => {
    expect(s.panelTranslateY).toBe(-4);
  });

  it("chevronRotation is 0 (chevron pointing down)", () => {
    expect(s.chevronRotation).toBe(0);
  });
});

describe("selectStyle: closed/opened invariant", () => {
  it("closed: panelOpacity=0, panelScale=0.96, panelTranslateY=-4, chevronRotation=0", () => {
    const s = selectStyle("closed", ctx);
    expect(s.panelOpacity).toBe(0);
    expect(s.panelScale).toBe(0.96);
    expect(s.panelTranslateY).toBe(-4);
    expect(s.chevronRotation).toBe(0);
  });

  it("opened: panelOpacity=1, panelScale=1, panelTranslateY=0, chevronRotation=180", () => {
    const s = selectStyle("opened", ctx);
    expect(s.panelOpacity).toBe(1);
    expect(s.panelScale).toBe(1);
    expect(s.panelTranslateY).toBe(0);
    expect(s.chevronRotation).toBe(180);
  });
});

describe("tweenSelectStyle: t=0 returns values equal to `a`", () => {
  const a = selectStyle("closed", ctx);
  const b = selectStyle("opened", ctx);
  const r = tweenSelectStyle(a, b, 0);

  it("panelOpacity equals a.panelOpacity at t=0", () => {
    expect(r.panelOpacity).toBeCloseTo(a.panelOpacity, 10);
  });

  it("panelScale equals a.panelScale at t=0", () => {
    expect(r.panelScale).toBeCloseTo(a.panelScale, 10);
  });

  it("panelTranslateY equals a.panelTranslateY at t=0", () => {
    expect(r.panelTranslateY).toBeCloseTo(a.panelTranslateY, 10);
  });

  it("chevronRotation equals a.chevronRotation at t=0", () => {
    expect(r.chevronRotation).toBeCloseTo(a.chevronRotation, 10);
  });
});

describe("tweenSelectStyle: t=1 returns values equal to `b`", () => {
  const a = selectStyle("closed", ctx);
  const b = selectStyle("opened", ctx);
  const r = tweenSelectStyle(a, b, 1);

  it("panelOpacity equals b.panelOpacity at t=1", () => {
    expect(r.panelOpacity).toBeCloseTo(b.panelOpacity, 10);
  });

  it("panelScale equals b.panelScale at t=1", () => {
    expect(r.panelScale).toBeCloseTo(b.panelScale, 10);
  });

  it("panelTranslateY equals b.panelTranslateY at t=1", () => {
    expect(r.panelTranslateY).toBeCloseTo(b.panelTranslateY, 10);
  });

  it("chevronRotation equals b.chevronRotation at t=1", () => {
    expect(r.chevronRotation).toBeCloseTo(b.chevronRotation, 10);
  });
});

describe("tweenSelectStyle: t=0.5 midpoint numeric lerp (closed → opened)", () => {
  const a = selectStyle("closed", ctx);
  const b = selectStyle("opened", ctx);
  const r = tweenSelectStyle(a, b, 0.5);

  it("panelOpacity midpoint: 0 → 1 gives 0.5", () => {
    expect(r.panelOpacity).toBeCloseTo(0.5, 10);
  });

  it("panelScale midpoint: 0.96 → 1 gives 0.98", () => {
    expect(r.panelScale).toBeCloseTo(0.98, 10);
  });

  it("panelTranslateY midpoint: -4 → 0 gives -2", () => {
    expect(r.panelTranslateY).toBeCloseTo(-2, 10);
  });

  it("chevronRotation midpoint: 0 → 180 gives 90", () => {
    expect(r.chevronRotation).toBeCloseTo(90, 10);
  });
});

describe("tweenSelectStyle: t=0.5 midpoint numeric lerp (opened → closed)", () => {
  const a = selectStyle("opened", ctx);
  const b = selectStyle("closed", ctx);
  const r = tweenSelectStyle(a, b, 0.5);

  it("panelOpacity midpoint: 1 → 0 gives 0.5", () => {
    expect(r.panelOpacity).toBeCloseTo(0.5, 10);
  });

  it("panelScale midpoint: 1 → 0.96 gives 0.98", () => {
    expect(r.panelScale).toBeCloseTo(0.98, 10);
  });

  it("panelTranslateY midpoint: 0 → -4 gives -2", () => {
    expect(r.panelTranslateY).toBeCloseTo(-2, 10);
  });

  it("chevronRotation midpoint: 180 → 0 gives 90", () => {
    expect(r.chevronRotation).toBeCloseTo(90, 10);
  });
});

describe("DEFAULT_DURATION", () => {
  it("is a positive number", () => {
    expect(typeof DEFAULT_DURATION).toBe("number");
    expect(DEFAULT_DURATION).toBeGreaterThan(0);
  });

  it("equals 12 (container default — longer than item's 8)", () => {
    expect(DEFAULT_DURATION).toBe(12);
  });
});
