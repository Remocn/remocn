import { describe, expect, it } from "bun:test";
import { defaultLightTheme } from "@/lib/remocn-ui";
import { switchConfig } from "../config";
import { type SwitchState, switchStyle, switchStyleContext } from "../index";
import { tweenSwitchStyle } from "../use-switch-transition";

const VALID_STATES: readonly SwitchState[] = ["unchecked", "checked"];

type SnippetValues = {
  state?: string;
  label?: string;
  size?: string;
  primary?: string;
};

const snippet = (values: SnippetValues): string =>
  switchConfig.snippet(values as Record<string, unknown>);

describe("SwitchState union", () => {
  it("contains exactly the two documented states", () => {
    const control = switchConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(control.options).toEqual(["unchecked", "checked"]);
  });

  it("every VALID_STATES entry is assignable (no typos in the fixture)", () => {
    const control = switchConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(VALID_STATES).toHaveLength(2);
    for (const s of VALID_STATES) {
      expect(control.options).toContain(s);
    }
  });
});

describe("switchConfig.controls.state", () => {
  it("is a select control", () => {
    expect(switchConfig.controls.state.type).toBe("select");
  });

  it("has exactly the two SwitchState options in order", () => {
    const control = switchConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(control.options).toEqual(["unchecked", "checked"]);
  });

  it("defaults to 'checked' so the preview shows the filled track and slid thumb", () => {
    const control = switchConfig.controls.state;
    expect(control.default).toBe("checked");
  });

  it("every option is a member of the SwitchState union", () => {
    const control = switchConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    for (const option of control.options) {
      expect(VALID_STATES).toContain(option as SwitchState);
    }
  });
});

describe("switchConfig.snippet: state prop emission", () => {
  it('emits state="unchecked" for the unchecked option', () => {
    expect(snippet({ state: "unchecked" })).toContain('state="unchecked"');
  });

  it('emits state="checked" for the checked option', () => {
    expect(snippet({ state: "checked" })).toContain('state="checked"');
  });

  it("emits the correct state for every control option", () => {
    const control = switchConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    for (const state of control.options) {
      const out = snippet({ state });
      expect(out).toContain(`state="${state}"`);
    }
  });
});

describe("switchConfig.snippet: NEVER emits steps or action", () => {
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

describe("switchConfig.snippet: import line", () => {
  it("includes `import { Switch }` from the correct path", () => {
    const out = snippet({ state: "checked" });
    expect(out).toContain("import { Switch }");
    expect(out).toContain('from "@/components/remocn/switch"');
  });
});

describe("switchConfig.snippet: default props are omitted", () => {
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

describe("switchConfig.snippet: non-default props are emitted", () => {
  it("emits a non-default label", () => {
    expect(
      snippet({ state: "checked", label: "Enable notifications" }),
    ).toContain('label="Enable notifications"');
  });

  it("emits a non-default size", () => {
    expect(snippet({ state: "checked", size: "lg" })).toContain('size="lg"');
  });

  it("emits a non-default primary color", () => {
    expect(snippet({ state: "checked", primary: "#6366f1" })).toContain(
      'primary="#6366f1"',
    );
  });
});

describe("switchConfig.snippet: structural round-trip", () => {
  const out = snippet({ state: "checked" });

  it("starts with the import line", () => {
    expect(out.startsWith("import { Switch }")).toBe(true);
  });

  it("contains a <Switch JSX opening", () => {
    expect(out).toContain("<Switch");
  });

  it("ends with a self-closing />", () => {
    expect(out.trimEnd().endsWith("/>")).toBe(true);
  });
});

const ctx = switchStyleContext(defaultLightTheme);

describe("switchStyle: unchecked state", () => {
  const s = switchStyle("unchecked", ctx);

  it("thumbOffset is 0 (thumb at left / unchecked position)", () => {
    expect(s.thumbOffset).toBe(0);
  });

  it("trackBackground is a non-empty string", () => {
    expect(typeof s.trackBackground).toBe("string");
    expect(s.trackBackground.length).toBeGreaterThan(0);
  });
});

describe("switchStyle: checked state", () => {
  const s = switchStyle("checked", ctx);

  it("thumbOffset is 1 (thumb at right / checked position)", () => {
    expect(s.thumbOffset).toBe(1);
  });

  it("trackBackground is a non-empty string", () => {
    expect(typeof s.trackBackground).toBe("string");
    expect(s.trackBackground.length).toBeGreaterThan(0);
  });
});

describe("switchStyle: invariants — unchecked thumb at left, checked thumb at right", () => {
  it("unchecked has thumbOffset 0 (thumb at left)", () => {
    const s = switchStyle("unchecked", ctx);
    expect(s.thumbOffset).toBe(0);
  });

  it("checked has thumbOffset 1 (thumb at right)", () => {
    const s = switchStyle("checked", ctx);
    expect(s.thumbOffset).toBe(1);
  });
});

describe("tweenSwitchStyle: t=0 returns values equal to `a`", () => {
  const a = switchStyle("unchecked", ctx);
  const b = switchStyle("checked", ctx);
  const r = tweenSwitchStyle(a, b, 0);

  it("thumbOffset equals a.thumbOffset at t=0", () => {
    expect(r.thumbOffset).toBeCloseTo(a.thumbOffset, 10);
  });

  it("trackBackground is a non-empty string at t=0", () => {
    expect(typeof r.trackBackground).toBe("string");
    expect(r.trackBackground.length).toBeGreaterThan(0);
  });
});

describe("tweenSwitchStyle: t=1 returns values equal to `b`", () => {
  const a = switchStyle("unchecked", ctx);
  const b = switchStyle("checked", ctx);
  const r = tweenSwitchStyle(a, b, 1);

  it("thumbOffset equals b.thumbOffset at t=1", () => {
    expect(r.thumbOffset).toBeCloseTo(b.thumbOffset, 10);
  });

  it("trackBackground is a non-empty string at t=1", () => {
    expect(typeof r.trackBackground).toBe("string");
    expect(r.trackBackground.length).toBeGreaterThan(0);
  });
});

describe("tweenSwitchStyle: t=0.5 midpoint numeric lerp (unchecked → checked)", () => {
  const a = switchStyle("unchecked", ctx);
  const b = switchStyle("checked", ctx);
  const r = tweenSwitchStyle(a, b, 0.5);

  it("thumbOffset midpoint: 0 → 1 gives 0.5", () => {
    expect(r.thumbOffset).toBeCloseTo(0.5, 10);
  });

  it("trackBackground is a non-empty string at t=0.5", () => {
    expect(typeof r.trackBackground).toBe("string");
    expect(r.trackBackground.length).toBeGreaterThan(0);
  });
});
