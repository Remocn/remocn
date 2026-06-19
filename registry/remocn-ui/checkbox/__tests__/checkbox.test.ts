
import { describe, expect, it } from "bun:test";
import {
  type CheckboxState,
  checkboxStyle,
  checkboxStyleContext,
} from "../index";
import { tweenCheckboxStyle } from "../use-checkbox-transition";
import { checkboxConfig } from "../config";
import { defaultLightTheme } from "@/lib/remocn-ui";

const VALID_STATES: readonly CheckboxState[] = ["unchecked", "checked"];

type SnippetValues = {
  state?: string;
  label?: string;
  size?: string;
  primary?: string;
};

const snippet = (values: SnippetValues): string =>
  checkboxConfig.snippet(values as Record<string, unknown>);

describe("CheckboxState union", () => {
  it("contains exactly the two documented states", () => {
    const control = checkboxConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    expect(control.options).toEqual(["unchecked", "checked"]);
  });

  it("every VALID_STATES entry is assignable (no typos in the fixture)", () => {
    const control = checkboxConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    expect(VALID_STATES).toHaveLength(2);
    for (const s of VALID_STATES) {
      expect(control.options).toContain(s);
    }
  });
});

describe("checkboxConfig.controls.state", () => {
  it("is a select control", () => {
    expect(checkboxConfig.controls.state.type).toBe("select");
  });

  it("has exactly the two CheckboxState options in order", () => {
    const control = checkboxConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    expect(control.options).toEqual(["unchecked", "checked"]);
  });

  it("defaults to 'checked' so the preview shows the filled box and checkmark", () => {
    const control = checkboxConfig.controls.state;
    expect(control.default).toBe("checked");
  });

  it("every option is a member of the CheckboxState union", () => {
    const control = checkboxConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    for (const option of control.options) {
      expect(VALID_STATES).toContain(option as CheckboxState);
    }
  });
});

describe("checkboxConfig.snippet: state prop emission", () => {
  it("emits state=\"unchecked\" for the unchecked option", () => {
    expect(snippet({ state: "unchecked" })).toContain('state="unchecked"');
  });

  it("emits state=\"checked\" for the checked option", () => {
    expect(snippet({ state: "checked" })).toContain('state="checked"');
  });

  it("emits the correct state for every control option", () => {
    const control = checkboxConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    for (const state of control.options) {
      const out = snippet({ state });
      expect(out).toContain(`state="${state}"`);
    }
  });
});

describe("checkboxConfig.snippet: NEVER emits steps or action", () => {
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

describe("checkboxConfig.snippet: import line", () => {
  it("includes `import { Checkbox }` from the correct path", () => {
    const out = snippet({ state: "checked" });
    expect(out).toContain('import { Checkbox }');
    expect(out).toContain('from "@/components/remocn/checkbox"');
  });
});

describe("checkboxConfig.snippet: default props are omitted", () => {
  const allDefaults = snippet({
    state: "checked",
    label: "",
    size: "default",
    primary: "#171717",
  });

  it("omits label when it equals the default (empty string)", () => {
    expect(allDefaults).not.toContain("label=");
  });

  it("omits size when it equals the default 'default'", () => {
    expect(allDefaults).not.toContain("size=");
  });

  it("omits primary when it equals the default '#171717'", () => {
    expect(allDefaults).not.toContain("primary=");
  });
});

describe("checkboxConfig.snippet: non-default props are emitted", () => {
  it("emits a non-default label", () => {
    expect(snippet({ state: "checked", label: "Accept terms" })).toContain('label="Accept terms"');
  });

  it("emits a non-default size", () => {
    expect(snippet({ state: "checked", size: "lg" })).toContain('size="lg"');
  });

  it("emits a non-default primary color", () => {
    expect(snippet({ state: "checked", primary: "#6366f1" })).toContain('primary="#6366f1"');
  });
});

describe("checkboxConfig.snippet: structural round-trip", () => {
  const out = snippet({ state: "checked" });

  it("starts with the import line", () => {
    expect(out.startsWith('import { Checkbox }')).toBe(true);
  });

  it("contains a <Checkbox JSX opening", () => {
    expect(out).toContain("<Checkbox");
  });

  it("ends with a self-closing />", () => {
    expect(out.trimEnd().endsWith("/>")).toBe(true);
  });
});

const ctx = checkboxStyleContext(defaultLightTheme);

describe("checkboxStyle: unchecked state", () => {
  const s = checkboxStyle("unchecked", ctx);

  it("checkOpacity is 0 (check hidden)", () => {
    expect(s.checkOpacity).toBe(0);
  });

  it("checkScale is 0.6 (slight shrink, pre-pop position)", () => {
    expect(s.checkScale).toBeCloseTo(0.6, 10);
  });

  it("checkDraw is 0 (stroke not drawn)", () => {
    expect(s.checkDraw).toBe(0);
  });

  it("boxBackground is a non-empty string", () => {
    expect(typeof s.boxBackground).toBe("string");
    expect(s.boxBackground.length).toBeGreaterThan(0);
  });

  it("boxBorderColor is a non-empty string", () => {
    expect(typeof s.boxBorderColor).toBe("string");
    expect(s.boxBorderColor.length).toBeGreaterThan(0);
  });
});

describe("checkboxStyle: checked state", () => {
  const s = checkboxStyle("checked", ctx);

  it("checkOpacity is 1 (check fully visible)", () => {
    expect(s.checkOpacity).toBe(1);
  });

  it("checkScale is 1 (full size, post-pop)", () => {
    expect(s.checkScale).toBe(1);
  });

  it("checkDraw is 1 (stroke fully drawn)", () => {
    expect(s.checkDraw).toBe(1);
  });

  it("boxBackground is a non-empty string", () => {
    expect(typeof s.boxBackground).toBe("string");
    expect(s.boxBackground.length).toBeGreaterThan(0);
  });

  it("boxBorderColor is a non-empty string", () => {
    expect(typeof s.boxBorderColor).toBe("string");
    expect(s.boxBorderColor.length).toBeGreaterThan(0);
  });
});

describe("checkboxStyle: invariants — unchecked hides mark, checked shows mark", () => {
  it("unchecked has checkOpacity 0 and checkDraw 0", () => {
    const s = checkboxStyle("unchecked", ctx);
    expect(s.checkOpacity).toBe(0);
    expect(s.checkDraw).toBe(0);
  });

  it("checked has checkOpacity 1 and checkDraw 1", () => {
    const s = checkboxStyle("checked", ctx);
    expect(s.checkOpacity).toBe(1);
    expect(s.checkDraw).toBe(1);
  });
});

describe("tweenCheckboxStyle: t=0 returns values equal to `a`", () => {
  const a = checkboxStyle("unchecked", ctx);
  const b = checkboxStyle("checked", ctx);
  const r = tweenCheckboxStyle(a, b, 0);

  it("checkOpacity equals a.checkOpacity at t=0", () => {
    expect(r.checkOpacity).toBeCloseTo(a.checkOpacity, 10);
  });

  it("checkScale equals a.checkScale at t=0", () => {
    expect(r.checkScale).toBeCloseTo(a.checkScale, 10);
  });

  it("checkDraw equals a.checkDraw at t=0", () => {
    expect(r.checkDraw).toBeCloseTo(a.checkDraw, 10);
  });

  it("boxBackground is a non-empty string at t=0", () => {
    expect(typeof r.boxBackground).toBe("string");
    expect(r.boxBackground.length).toBeGreaterThan(0);
  });

  it("boxBorderColor is a non-empty string at t=0", () => {
    expect(typeof r.boxBorderColor).toBe("string");
    expect(r.boxBorderColor.length).toBeGreaterThan(0);
  });
});

describe("tweenCheckboxStyle: t=1 returns values equal to `b`", () => {
  const a = checkboxStyle("unchecked", ctx);
  const b = checkboxStyle("checked", ctx);
  const r = tweenCheckboxStyle(a, b, 1);

  it("checkOpacity equals b.checkOpacity at t=1", () => {
    expect(r.checkOpacity).toBeCloseTo(b.checkOpacity, 10);
  });

  it("checkScale equals b.checkScale at t=1", () => {
    expect(r.checkScale).toBeCloseTo(b.checkScale, 10);
  });

  it("checkDraw equals b.checkDraw at t=1", () => {
    expect(r.checkDraw).toBeCloseTo(b.checkDraw, 10);
  });

  it("boxBackground is a non-empty string at t=1", () => {
    expect(typeof r.boxBackground).toBe("string");
    expect(r.boxBackground.length).toBeGreaterThan(0);
  });

  it("boxBorderColor is a non-empty string at t=1", () => {
    expect(typeof r.boxBorderColor).toBe("string");
    expect(r.boxBorderColor.length).toBeGreaterThan(0);
  });
});

describe("tweenCheckboxStyle: t=0.5 midpoint numeric lerp (unchecked → checked)", () => {
  const a = checkboxStyle("unchecked", ctx);
  const b = checkboxStyle("checked", ctx);
  const r = tweenCheckboxStyle(a, b, 0.5);

  it("checkOpacity midpoint: 0 → 1 gives 0.5", () => {
    expect(r.checkOpacity).toBeCloseTo(0.5, 10);
  });

  it("checkScale midpoint: 0.6 → 1 gives 0.8", () => {
    expect(r.checkScale).toBeCloseTo(0.8, 10);
  });

  it("checkDraw midpoint: 0 → 1 gives 0.5", () => {
    expect(r.checkDraw).toBeCloseTo(0.5, 10);
  });

  it("boxBackground is a non-empty string at t=0.5", () => {
    expect(typeof r.boxBackground).toBe("string");
    expect(r.boxBackground.length).toBeGreaterThan(0);
  });

  it("boxBorderColor is a non-empty string at t=0.5", () => {
    expect(typeof r.boxBorderColor).toBe("string");
    expect(r.boxBorderColor.length).toBeGreaterThan(0);
  });
});
