import { describe, expect, it } from "bun:test";
import { defaultLightTheme } from "@/lib/remocn-ui";
import { selectItemConfig } from "../config";
import {
  type SelectItemState,
  selectItemStyle,
  selectItemStyleContext,
} from "../index";
import {
  DEFAULT_DURATION,
  tweenSelectItemStyle,
} from "../use-select-item-transition";

const VALID_STATES: readonly SelectItemState[] = [
  "idle",
  "hover",
  "press",
  "selected",
];

type SnippetValues = {
  state?: string;
  label?: string;
};

const snippet = (values: SnippetValues): string =>
  selectItemConfig.snippet(values as Record<string, unknown>);

const ctx = selectItemStyleContext(defaultLightTheme);

describe("SelectItemState union", () => {
  it("contains exactly the four documented states", () => {
    const control = selectItemConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(control.options).toEqual(["idle", "hover", "press", "selected"]);
  });

  it("every VALID_STATES entry is assignable (no typos in the fixture)", () => {
    const control = selectItemConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(VALID_STATES).toHaveLength(4);
    for (const s of VALID_STATES) {
      expect(control.options).toContain(s);
    }
  });
});

describe("selectItemConfig.controls.state", () => {
  it("is a select control", () => {
    expect(selectItemConfig.controls.state.type).toBe("select");
  });

  it("has exactly the four SelectItemState options in order", () => {
    const control = selectItemConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(control.options).toEqual(["idle", "hover", "press", "selected"]);
  });

  it("defaults to 'selected' so the preview shows the check icon + accent", () => {
    const control = selectItemConfig.controls.state;
    expect(control.default).toBe("selected");
  });

  it("every option is a member of the SelectItemState union", () => {
    const control = selectItemConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    for (const option of control.options) {
      expect(VALID_STATES).toContain(option as SelectItemState);
    }
  });
});

describe("selectItemConfig.snippet: state prop emission", () => {
  it('emits state="idle" for the idle option', () => {
    expect(snippet({ state: "idle" })).toContain('state="idle"');
  });

  it('emits state="hover" for the hover option', () => {
    expect(snippet({ state: "hover" })).toContain('state="hover"');
  });

  it('emits state="press" for the press option', () => {
    expect(snippet({ state: "press" })).toContain('state="press"');
  });

  it('emits state="selected" for the selected option', () => {
    expect(snippet({ state: "selected" })).toContain('state="selected"');
  });

  it("emits the correct state for every control option", () => {
    const control = selectItemConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    for (const state of control.options) {
      const out = snippet({ state });
      expect(out).toContain(`state="${state}"`);
    }
  });
});

describe("selectItemConfig.snippet: import line", () => {
  it("includes `import { SelectItem }` from the correct path", () => {
    const out = snippet({ state: "selected" });
    expect(out).toContain("import { SelectItem }");
    expect(out).toContain('from "@/components/remocn/select-item"');
  });
});

describe("selectItemConfig.snippet: default props are omitted", () => {
  const allDefaults = snippet({
    state: "selected",
    label: "Banana",
  });

  it("omits label when it equals the default 'Banana'", () => {
    expect(allDefaults).not.toContain("label=");
  });
});

describe("selectItemConfig.snippet: non-default props are emitted", () => {
  it("emits a non-default label", () => {
    expect(snippet({ state: "selected", label: "Mango" })).toContain(
      'label="Mango"',
    );
  });
});

describe("selectItemConfig.snippet: structural round-trip", () => {
  const out = snippet({ state: "selected" });

  it("starts with the import line", () => {
    expect(out.startsWith("import { SelectItem }")).toBe(true);
  });

  it("contains a <SelectItem JSX opening", () => {
    expect(out).toContain("<SelectItem");
  });

  it("ends with a self-closing />", () => {
    expect(out.trimEnd().endsWith("/>")).toBe(true);
  });
});

describe("selectItemStyleContext: field types from defaultLightTheme", () => {
  it("idleBg is a non-empty string", () => {
    expect(typeof ctx.idleBg).toBe("string");
    expect(ctx.idleBg.length).toBeGreaterThan(0);
  });

  it("hoverBg is a non-empty string", () => {
    expect(typeof ctx.hoverBg).toBe("string");
    expect(ctx.hoverBg.length).toBeGreaterThan(0);
  });

  it("pressBg is a non-empty string", () => {
    expect(typeof ctx.pressBg).toBe("string");
    expect(ctx.pressBg.length).toBeGreaterThan(0);
  });

  it("selectedBg is a non-empty string", () => {
    expect(typeof ctx.selectedBg).toBe("string");
    expect(ctx.selectedBg.length).toBeGreaterThan(0);
  });

  it("idleFg is a non-empty string", () => {
    expect(typeof ctx.idleFg).toBe("string");
    expect(ctx.idleFg.length).toBeGreaterThan(0);
  });

  it("selectedFg is a non-empty string", () => {
    expect(typeof ctx.selectedFg).toBe("string");
    expect(ctx.selectedFg.length).toBeGreaterThan(0);
  });

  it("check is a non-empty string", () => {
    expect(typeof ctx.check).toBe("string");
    expect(ctx.check.length).toBeGreaterThan(0);
  });
});

describe("selectItemStyleContext: maps theme tokens correctly", () => {
  it("idleBg equals theme.popover", () => {
    expect(ctx.idleBg).toBe(defaultLightTheme.popover);
  });

  it("hoverBg equals theme.accent", () => {
    expect(ctx.hoverBg).toBe(defaultLightTheme.accent);
  });

  it("selectedBg equals theme.accent", () => {
    expect(ctx.selectedBg).toBe(defaultLightTheme.accent);
  });

  it("idleFg equals theme.popoverForeground", () => {
    expect(ctx.idleFg).toBe(defaultLightTheme.popoverForeground);
  });

  it("selectedFg equals theme.accentForeground", () => {
    expect(ctx.selectedFg).toBe(defaultLightTheme.accentForeground);
  });

  it("check equals theme.primary", () => {
    expect(ctx.check).toBe(defaultLightTheme.primary);
  });
});

describe("selectItemStyle: idle state", () => {
  const s = selectItemStyle("idle", ctx);

  it("background is ctx.idleBg", () => {
    expect(s.background).toBe(ctx.idleBg);
  });

  it("labelColor is ctx.idleFg", () => {
    expect(s.labelColor).toBe(ctx.idleFg);
  });

  it("checkOpacity is 0 (no check icon)", () => {
    expect(s.checkOpacity).toBe(0);
  });

  it("scale is 1 (full size)", () => {
    expect(s.scale).toBe(1);
  });
});

describe("selectItemStyle: hover state", () => {
  const s = selectItemStyle("hover", ctx);

  it("background is ctx.hoverBg", () => {
    expect(s.background).toBe(ctx.hoverBg);
  });

  it("labelColor is ctx.idleFg", () => {
    expect(s.labelColor).toBe(ctx.idleFg);
  });

  it("checkOpacity is 0 (no check icon)", () => {
    expect(s.checkOpacity).toBe(0);
  });

  it("scale is 1 (full size)", () => {
    expect(s.scale).toBe(1);
  });
});

describe("selectItemStyle: press state", () => {
  const s = selectItemStyle("press", ctx);

  it("background is ctx.pressBg", () => {
    expect(s.background).toBe(ctx.pressBg);
  });

  it("labelColor is ctx.idleFg", () => {
    expect(s.labelColor).toBe(ctx.idleFg);
  });

  it("checkOpacity is 0 (no check icon)", () => {
    expect(s.checkOpacity).toBe(0);
  });

  it("scale is 0.98 (slightly shrunk)", () => {
    expect(s.scale).toBe(0.98);
  });
});

describe("selectItemStyle: selected state", () => {
  const s = selectItemStyle("selected", ctx);

  it("background is ctx.selectedBg", () => {
    expect(s.background).toBe(ctx.selectedBg);
  });

  it("labelColor is ctx.selectedFg", () => {
    expect(s.labelColor).toBe(ctx.selectedFg);
  });

  it("checkOpacity is 1 (check icon fully visible)", () => {
    expect(s.checkOpacity).toBe(1);
  });

  it("scale is 1 (full size)", () => {
    expect(s.scale).toBe(1);
  });
});

describe("selectItemStyle: state invariant summary", () => {
  it("idle: checkOpacity=0, scale=1", () => {
    const s = selectItemStyle("idle", ctx);
    expect(s.checkOpacity).toBe(0);
    expect(s.scale).toBe(1);
  });

  it("hover: checkOpacity=0, scale=1", () => {
    const s = selectItemStyle("hover", ctx);
    expect(s.checkOpacity).toBe(0);
    expect(s.scale).toBe(1);
  });

  it("press: checkOpacity=0, scale=0.98", () => {
    const s = selectItemStyle("press", ctx);
    expect(s.checkOpacity).toBe(0);
    expect(s.scale).toBe(0.98);
  });

  it("selected: checkOpacity=1, scale=1", () => {
    const s = selectItemStyle("selected", ctx);
    expect(s.checkOpacity).toBe(1);
    expect(s.scale).toBe(1);
  });
});

describe("tweenSelectItemStyle: t=0 returns values equal to `a`", () => {
  const a = selectItemStyle("idle", ctx);
  const b = selectItemStyle("selected", ctx);
  const r = tweenSelectItemStyle(a, b, 0);

  it("checkOpacity equals a.checkOpacity at t=0", () => {
    expect(r.checkOpacity).toBeCloseTo(a.checkOpacity, 10);
  });

  it("scale equals a.scale at t=0", () => {
    expect(r.scale).toBeCloseTo(a.scale, 10);
  });

  it("background is a non-empty string at t=0", () => {
    expect(typeof r.background).toBe("string");
    expect(r.background.length).toBeGreaterThan(0);
  });

  it("labelColor is a non-empty string at t=0", () => {
    expect(typeof r.labelColor).toBe("string");
    expect(r.labelColor.length).toBeGreaterThan(0);
  });
});

describe("tweenSelectItemStyle: t=1 returns values equal to `b`", () => {
  const a = selectItemStyle("idle", ctx);
  const b = selectItemStyle("selected", ctx);
  const r = tweenSelectItemStyle(a, b, 1);

  it("checkOpacity equals b.checkOpacity at t=1", () => {
    expect(r.checkOpacity).toBeCloseTo(b.checkOpacity, 10);
  });

  it("scale equals b.scale at t=1", () => {
    expect(r.scale).toBeCloseTo(b.scale, 10);
  });

  it("background is a non-empty string at t=1", () => {
    expect(typeof r.background).toBe("string");
    expect(r.background.length).toBeGreaterThan(0);
  });

  it("labelColor is a non-empty string at t=1", () => {
    expect(typeof r.labelColor).toBe("string");
    expect(r.labelColor.length).toBeGreaterThan(0);
  });
});

describe("tweenSelectItemStyle: t=0.5 midpoint numeric lerp (idle → selected)", () => {
  const a = selectItemStyle("idle", ctx);
  const b = selectItemStyle("selected", ctx);
  const r = tweenSelectItemStyle(a, b, 0.5);

  it("checkOpacity midpoint: 0 → 1 gives 0.5", () => {
    expect(r.checkOpacity).toBeCloseTo(0.5, 10);
  });

  it("scale midpoint: 1 → 1 gives 1", () => {
    expect(r.scale).toBeCloseTo(1, 10);
  });
});

describe("tweenSelectItemStyle: t=0.5 midpoint numeric lerp (idle → press)", () => {
  const a = selectItemStyle("idle", ctx);
  const b = selectItemStyle("press", ctx);
  const r = tweenSelectItemStyle(a, b, 0.5);

  it("scale midpoint: 1 → 0.98 gives 0.99", () => {
    expect(r.scale).toBeCloseTo(0.99, 10);
  });

  it("checkOpacity midpoint: 0 → 0 gives 0", () => {
    expect(r.checkOpacity).toBeCloseTo(0, 10);
  });
});

describe("DEFAULT_DURATION", () => {
  it("is a positive number", () => {
    expect(typeof DEFAULT_DURATION).toBe("number");
    expect(DEFAULT_DURATION).toBeGreaterThan(0);
  });

  it("equals 8 (item default — shorter than container's 12)", () => {
    expect(DEFAULT_DURATION).toBe(8);
  });
});
