
import { describe, expect, it } from "bun:test";
import {
  type RadioState,
  radioStyle,
  radioStyleContext,
} from "../index";
import { tweenRadioStyle } from "../use-radio-transition";
import { radioConfig } from "../config";
import { defaultLightTheme } from "@/lib/remocn-ui";

const VALID_STATES: readonly RadioState[] = ["unchecked", "checked"];

type SnippetValues = {
  state?: string;
  label?: string;
  size?: string;
  primary?: string;
};

const snippet = (values: SnippetValues): string =>
  radioConfig.snippet(values as Record<string, unknown>);

describe("RadioState union", () => {
  it("contains exactly the two documented states", () => {
    const control = radioConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    expect(control.options).toEqual(["unchecked", "checked"]);
  });

  it("every VALID_STATES entry is assignable (no typos in the fixture)", () => {
    const control = radioConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    expect(VALID_STATES).toHaveLength(2);
    for (const s of VALID_STATES) {
      expect(control.options).toContain(s);
    }
  });
});

describe("radioConfig.controls.state", () => {
  it("is a select control", () => {
    expect(radioConfig.controls.state.type).toBe("select");
  });

  it("has exactly the two RadioState options in order", () => {
    const control = radioConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    expect(control.options).toEqual(["unchecked", "checked"]);
  });

  it("defaults to 'checked' so the preview shows the filled dot", () => {
    const control = radioConfig.controls.state;
    expect(control.default).toBe("checked");
  });

  it("every option is a member of the RadioState union", () => {
    const control = radioConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    for (const option of control.options) {
      expect(VALID_STATES).toContain(option as RadioState);
    }
  });
});

describe("radioConfig.snippet: state prop emission", () => {
  it("emits state=\"unchecked\" for the unchecked option", () => {
    expect(snippet({ state: "unchecked" })).toContain('state="unchecked"');
  });

  it("emits state=\"checked\" for the checked option", () => {
    expect(snippet({ state: "checked" })).toContain('state="checked"');
  });

  it("emits the correct state for every control option", () => {
    const control = radioConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    for (const state of control.options) {
      const out = snippet({ state });
      expect(out).toContain(`state="${state}"`);
    }
  });
});

describe("radioConfig.snippet: NEVER emits steps or action", () => {
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

describe("radioConfig.snippet: import line", () => {
  it("includes `import { Radio }` from the correct path", () => {
    const out = snippet({ state: "checked" });
    expect(out).toContain('import { Radio }');
    expect(out).toContain('from "@/components/remocn/radio"');
  });
});

describe("radioConfig.snippet: default props are omitted", () => {
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

describe("radioConfig.snippet: non-default props are emitted", () => {
  it("emits a non-default label", () => {
    expect(snippet({ state: "checked", label: "Option A" })).toContain('label="Option A"');
  });

  it("emits a non-default size", () => {
    expect(snippet({ state: "checked", size: "lg" })).toContain('size="lg"');
  });

  it("emits a non-default primary color", () => {
    expect(snippet({ state: "checked", primary: "#6366f1" })).toContain('primary="#6366f1"');
  });
});

describe("radioConfig.snippet: structural round-trip", () => {
  const out = snippet({ state: "checked" });

  it("starts with the import line", () => {
    expect(out.startsWith('import { Radio }')).toBe(true);
  });

  it("contains a <Radio JSX opening", () => {
    expect(out).toContain("<Radio");
  });

  it("ends with a self-closing />", () => {
    expect(out.trimEnd().endsWith("/>")).toBe(true);
  });
});

const ctx = radioStyleContext(defaultLightTheme);

describe("radioStyle: unchecked state", () => {
  const s = radioStyle("unchecked", ctx);

  it("dotOpacity is 0 (dot hidden)", () => {
    expect(s.dotOpacity).toBe(0);
  });

  it("dotScale is 0.4 (pre-pop position, slight shrink)", () => {
    expect(s.dotScale).toBeCloseTo(0.4, 10);
  });

  it("ringBorderColor is a non-empty string", () => {
    expect(typeof s.ringBorderColor).toBe("string");
    expect(s.ringBorderColor.length).toBeGreaterThan(0);
  });
});

describe("radioStyle: checked state", () => {
  const s = radioStyle("checked", ctx);

  it("dotOpacity is 1 (dot fully visible)", () => {
    expect(s.dotOpacity).toBe(1);
  });

  it("dotScale is 1 (full size, post-pop)", () => {
    expect(s.dotScale).toBe(1);
  });

  it("ringBorderColor is a non-empty string", () => {
    expect(typeof s.ringBorderColor).toBe("string");
    expect(s.ringBorderColor.length).toBeGreaterThan(0);
  });
});

describe("radioStyle: invariants — unchecked hides dot, checked shows dot", () => {
  it("unchecked has dotOpacity 0 (dot invisible)", () => {
    const s = radioStyle("unchecked", ctx);
    expect(s.dotOpacity).toBe(0);
  });

  it("checked has dotOpacity 1 (dot fully visible)", () => {
    const s = radioStyle("checked", ctx);
    expect(s.dotOpacity).toBe(1);
  });
});

describe("tweenRadioStyle: t=0 returns values equal to `a`", () => {
  const a = radioStyle("unchecked", ctx);
  const b = radioStyle("checked", ctx);
  const r = tweenRadioStyle(a, b, 0);

  it("dotOpacity equals a.dotOpacity at t=0", () => {
    expect(r.dotOpacity).toBeCloseTo(a.dotOpacity, 10);
  });

  it("dotScale equals a.dotScale at t=0", () => {
    expect(r.dotScale).toBeCloseTo(a.dotScale, 10);
  });

  it("ringBorderColor is a non-empty string at t=0", () => {
    expect(typeof r.ringBorderColor).toBe("string");
    expect(r.ringBorderColor.length).toBeGreaterThan(0);
  });
});

describe("tweenRadioStyle: t=1 returns values equal to `b`", () => {
  const a = radioStyle("unchecked", ctx);
  const b = radioStyle("checked", ctx);
  const r = tweenRadioStyle(a, b, 1);

  it("dotOpacity equals b.dotOpacity at t=1", () => {
    expect(r.dotOpacity).toBeCloseTo(b.dotOpacity, 10);
  });

  it("dotScale equals b.dotScale at t=1", () => {
    expect(r.dotScale).toBeCloseTo(b.dotScale, 10);
  });

  it("ringBorderColor is a non-empty string at t=1", () => {
    expect(typeof r.ringBorderColor).toBe("string");
    expect(r.ringBorderColor.length).toBeGreaterThan(0);
  });
});

describe("tweenRadioStyle: t=0.5 midpoint numeric lerp (unchecked → checked)", () => {
  const a = radioStyle("unchecked", ctx);
  const b = radioStyle("checked", ctx);
  const r = tweenRadioStyle(a, b, 0.5);

  it("dotOpacity midpoint: 0 → 1 gives 0.5", () => {
    expect(r.dotOpacity).toBeCloseTo(0.5, 10);
  });

  it("dotScale midpoint: 0.4 → 1 gives 0.7", () => {
    expect(r.dotScale).toBeCloseTo(0.7, 10);
  });

  it("ringBorderColor is a non-empty string at t=0.5", () => {
    expect(typeof r.ringBorderColor).toBe("string");
    expect(r.ringBorderColor.length).toBeGreaterThan(0);
  });
});
