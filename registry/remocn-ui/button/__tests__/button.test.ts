
import { describe, expect, it } from "bun:test";
import { type ButtonState, buttonStyle, buttonStyleContext } from "../index";
import { tweenButtonStyle } from "../use-button-transition";
import { buttonConfig } from "../config";
import { defaultLightTheme } from "@/lib/remocn-ui";

const VALID_STATES: readonly ButtonState[] = [
  "idle",
  "hover",
  "press",
  "loading",
  "success",
];

type SnippetValues = {
  state?: string;
  label?: string;
  variant?: string;
  size?: string;
  primary?: string;
};

const snippet = (values: SnippetValues): string =>
  buttonConfig.snippet(values as Record<string, unknown>);

describe("ButtonState union", () => {
  it("contains exactly the five documented states", () => {
    const control = buttonConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    expect(control.options).toEqual([
      "idle",
      "hover",
      "press",
      "loading",
      "success",
    ]);
  });

  it("every VALID_STATES entry is assignable (no typos in the fixture)", () => {
    const control = buttonConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    expect(VALID_STATES).toHaveLength(5);
    for (const s of VALID_STATES) {
      expect(control.options).toContain(s);
    }
  });
});

describe("buttonConfig.controls.state", () => {
  it("is a select control", () => {
    expect(buttonConfig.controls.state.type).toBe("select");
  });

  it("has exactly the five ButtonState options in order", () => {
    const control = buttonConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    expect(control.options).toEqual([
      "idle",
      "hover",
      "press",
      "loading",
      "success",
    ]);
  });

  it("defaults to 'loading' so the preview showcases the live Spinner", () => {
    const control = buttonConfig.controls.state;
    expect(control.default).toBe("loading");
  });

  it("every option is a member of the ButtonState union", () => {
    const control = buttonConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    for (const option of control.options) {
      expect(VALID_STATES).toContain(option as ButtonState);
    }
  });
});

describe("buttonConfig.snippet: state prop emission", () => {
  it("emits state=\"idle\" for the idle option", () => {
    expect(snippet({ state: "idle" })).toContain('state="idle"');
  });

  it("emits state=\"hover\" for the hover option", () => {
    expect(snippet({ state: "hover" })).toContain('state="hover"');
  });

  it("emits state=\"press\" for the press option", () => {
    expect(snippet({ state: "press" })).toContain('state="press"');
  });

  it("emits state=\"loading\" for the loading option", () => {
    expect(snippet({ state: "loading" })).toContain('state="loading"');
  });

  it("emits state=\"success\" for the success option", () => {
    expect(snippet({ state: "success" })).toContain('state="success"');
  });

  it("emits the correct state for every control option", () => {
    const control = buttonConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    for (const state of control.options) {
      const out = snippet({ state });
      expect(out).toContain(`state="${state}"`);
    }
  });
});

describe("buttonConfig.snippet: NEVER emits steps or action", () => {
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

describe("buttonConfig.snippet: import line", () => {
  it("includes `import { Button }` from the correct path", () => {
    const out = snippet({ state: "loading" });
    expect(out).toContain('import { Button }');
    expect(out).toContain('from "@/components/remocn/button"');
  });
});

describe("buttonConfig.snippet: default props are omitted", () => {
  const allDefaults = snippet({
    state: "loading",
    label: "Continue",
    variant: "default",
    size: "default",
    primary: "#171717",
  });

  it("omits label when it equals the default 'Continue'", () => {
    expect(allDefaults).not.toContain("label=");
  });

  it("omits variant when it equals the default 'default'", () => {
    expect(allDefaults).not.toContain("variant=");
  });

  it("omits size when it equals the default 'default'", () => {
    expect(allDefaults).not.toContain("size=");
  });

  it("omits primary when it equals the default '#171717'", () => {
    expect(allDefaults).not.toContain("primary=");
  });
});

describe("buttonConfig.snippet: non-default props are emitted", () => {
  it("emits a non-default label", () => {
    expect(snippet({ state: "success", label: "Submit" })).toContain('label="Submit"');
  });

  it("emits a non-default variant", () => {
    expect(snippet({ state: "success", variant: "destructive" })).toContain('variant="destructive"');
  });

  it("emits a non-default size", () => {
    expect(snippet({ state: "success", size: "lg" })).toContain('size="lg"');
  });

  it("emits a non-default primary color", () => {
    expect(snippet({ state: "success", primary: "#6366f1" })).toContain('primary="#6366f1"');
  });
});

describe("buttonConfig.snippet: structural round-trip", () => {
  const out = snippet({ state: "loading" });

  it("starts with the import line", () => {
    expect(out.startsWith('import { Button }')).toBe(true);
  });

  it("contains a <Button JSX opening", () => {
    expect(out).toContain("<Button");
  });

  it("ends with a self-closing />", () => {
    expect(out.trimEnd().endsWith("/>")).toBe(true);
  });
});

const ctx = buttonStyleContext("default", defaultLightTheme);

describe("buttonStyle: idle state", () => {
  const s = buttonStyle("idle", ctx);

  it("translateY is 0 (at rest, not lifted)", () => {
    expect(s.translateY).toBe(0);
  });

  it("scale is 1 (no shrink)", () => {
    expect(s.scale).toBe(1);
  });

  it("labelOpacity is 1 (label visible)", () => {
    expect(s.labelOpacity).toBe(1);
  });

  it("spinnerOpacity is 0 (spinner hidden)", () => {
    expect(s.spinnerOpacity).toBe(0);
  });

  it("checkOpacity is 0 (check hidden)", () => {
    expect(s.checkOpacity).toBe(0);
  });

  it("background is a non-empty string", () => {
    expect(typeof s.background).toBe("string");
    expect(s.background.length).toBeGreaterThan(0);
  });
});

describe("buttonStyle: hover state", () => {
  const s = buttonStyle("hover", ctx);

  it("translateY is -1 (button lifts)", () => {
    expect(s.translateY).toBe(-1);
  });

  it("scale is 1 (no shrink on hover)", () => {
    expect(s.scale).toBe(1);
  });

  it("labelOpacity is 1 (label stays visible)", () => {
    expect(s.labelOpacity).toBe(1);
  });

  it("spinnerOpacity is 0", () => {
    expect(s.spinnerOpacity).toBe(0);
  });

  it("checkOpacity is 0", () => {
    expect(s.checkOpacity).toBe(0);
  });

  it("background is a non-empty string", () => {
    expect(typeof s.background).toBe("string");
    expect(s.background.length).toBeGreaterThan(0);
  });
});

describe("buttonStyle: press state", () => {
  const s = buttonStyle("press", ctx);

  it("translateY is -1", () => {
    expect(s.translateY).toBe(-1);
  });

  it("scale is 0.97 (slight shrink on press)", () => {
    expect(s.scale).toBeCloseTo(0.97, 10);
  });

  it("labelOpacity is 1", () => {
    expect(s.labelOpacity).toBe(1);
  });

  it("spinnerOpacity is 0", () => {
    expect(s.spinnerOpacity).toBe(0);
  });

  it("checkOpacity is 0", () => {
    expect(s.checkOpacity).toBe(0);
  });

  it("background is a non-empty string", () => {
    expect(typeof s.background).toBe("string");
    expect(s.background.length).toBeGreaterThan(0);
  });
});

describe("buttonStyle: loading state", () => {
  const s = buttonStyle("loading", ctx);

  it("labelOpacity is 0 (label hidden while loading)", () => {
    expect(s.labelOpacity).toBe(0);
  });

  it("spinnerOpacity is 1 (spinner fully visible)", () => {
    expect(s.spinnerOpacity).toBe(1);
  });

  it("checkOpacity is 0 (check not yet shown)", () => {
    expect(s.checkOpacity).toBe(0);
  });

  it("background is a non-empty string", () => {
    expect(typeof s.background).toBe("string");
    expect(s.background.length).toBeGreaterThan(0);
  });
});

describe("buttonStyle: success state", () => {
  const s = buttonStyle("success", ctx);

  it("labelOpacity is 0 (label replaced by check)", () => {
    expect(s.labelOpacity).toBe(0);
  });

  it("spinnerOpacity is 0 (spinner gone)", () => {
    expect(s.spinnerOpacity).toBe(0);
  });

  it("checkOpacity is 1 (checkmark fully visible)", () => {
    expect(s.checkOpacity).toBe(1);
  });

  it("background is a non-empty string", () => {
    expect(typeof s.background).toBe("string");
    expect(s.background.length).toBeGreaterThan(0);
  });
});

describe("buttonStyle: opacity invariant — exactly one of label/spinner/check is visible per non-idle state", () => {
  const states: ButtonState[] = ["idle", "hover", "press", "loading", "success"];

  it("sum of label+spinner+check opacities equals 1 for every state (exactly one is shown)", () => {
    for (const state of states) {
      const s = buttonStyle(state, ctx);
      const sum = s.labelOpacity + s.spinnerOpacity + s.checkOpacity;
      expect(sum).toBe(1);
    }
  });
});

describe("tweenButtonStyle: t=0 returns values equal to `a`", () => {
  const a = buttonStyle("idle", ctx);
  const b = buttonStyle("hover", ctx);
  const r = tweenButtonStyle(a, b, 0);

  it("translateY equals a.translateY at t=0", () => {
    expect(r.translateY).toBeCloseTo(a.translateY, 10);
  });

  it("scale equals a.scale at t=0", () => {
    expect(r.scale).toBeCloseTo(a.scale, 10);
  });

  it("labelOpacity equals a.labelOpacity at t=0", () => {
    expect(r.labelOpacity).toBeCloseTo(a.labelOpacity, 10);
  });

  it("spinnerOpacity equals a.spinnerOpacity at t=0", () => {
    expect(r.spinnerOpacity).toBeCloseTo(a.spinnerOpacity, 10);
  });

  it("checkOpacity equals a.checkOpacity at t=0", () => {
    expect(r.checkOpacity).toBeCloseTo(a.checkOpacity, 10);
  });

  it("background is a non-empty string at t=0", () => {
    expect(typeof r.background).toBe("string");
    expect(r.background.length).toBeGreaterThan(0);
  });
});

describe("tweenButtonStyle: t=1 returns values equal to `b`", () => {
  const a = buttonStyle("idle", ctx);
  const b = buttonStyle("hover", ctx);
  const r = tweenButtonStyle(a, b, 1);

  it("translateY equals b.translateY at t=1", () => {
    expect(r.translateY).toBeCloseTo(b.translateY, 10);
  });

  it("scale equals b.scale at t=1", () => {
    expect(r.scale).toBeCloseTo(b.scale, 10);
  });

  it("labelOpacity equals b.labelOpacity at t=1", () => {
    expect(r.labelOpacity).toBeCloseTo(b.labelOpacity, 10);
  });

  it("spinnerOpacity equals b.spinnerOpacity at t=1", () => {
    expect(r.spinnerOpacity).toBeCloseTo(b.spinnerOpacity, 10);
  });

  it("checkOpacity equals b.checkOpacity at t=1", () => {
    expect(r.checkOpacity).toBeCloseTo(b.checkOpacity, 10);
  });

  it("background is a non-empty string at t=1", () => {
    expect(typeof r.background).toBe("string");
    expect(r.background.length).toBeGreaterThan(0);
  });
});

describe("tweenButtonStyle: t=0.5 midpoint numeric lerp (idle → hover)", () => {
  const a = buttonStyle("idle", ctx);
  const b = buttonStyle("hover", ctx);
  const r = tweenButtonStyle(a, b, 0.5);

  it("translateY midpoint: 0 → -1 gives -0.5", () => {
    expect(r.translateY).toBeCloseTo(-0.5, 10);
  });

  it("scale midpoint: 1 → 1 gives 1 (both same)", () => {
    expect(r.scale).toBeCloseTo(1, 10);
  });

  it("labelOpacity midpoint: 1 → 1 gives 1 (both same)", () => {
    expect(r.labelOpacity).toBeCloseTo(1, 10);
  });

  it("background is a non-empty string at t=0.5", () => {
    expect(typeof r.background).toBe("string");
    expect(r.background.length).toBeGreaterThan(0);
  });
});

describe("tweenButtonStyle: t=0.5 midpoint numeric lerp (idle → loading)", () => {
  const a = buttonStyle("idle", ctx);
  const b = buttonStyle("loading", ctx);
  const r = tweenButtonStyle(a, b, 0.5);

  it("translateY midpoint: 0 → -1 gives -0.5", () => {
    expect(r.translateY).toBeCloseTo(-0.5, 10);
  });

  it("scale midpoint: 1 → 1 gives 1", () => {
    expect(r.scale).toBeCloseTo(1, 10);
  });

  it("labelOpacity midpoint: 1 → 0 gives 0.5", () => {
    expect(r.labelOpacity).toBeCloseTo(0.5, 10);
  });

  it("spinnerOpacity midpoint: 0 → 1 gives 0.5", () => {
    expect(r.spinnerOpacity).toBeCloseTo(0.5, 10);
  });

  it("checkOpacity midpoint: 0 → 0 gives 0", () => {
    expect(r.checkOpacity).toBeCloseTo(0, 10);
  });

  it("background is a non-empty string at t=0.5", () => {
    expect(typeof r.background).toBe("string");
    expect(r.background.length).toBeGreaterThan(0);
  });
});

describe("tweenButtonStyle: t=0.5 midpoint numeric lerp (hover → press)", () => {
  const a = buttonStyle("hover", ctx);
  const b = buttonStyle("press", ctx);
  const r = tweenButtonStyle(a, b, 0.5);

  it("translateY midpoint: -1 → -1 gives -1 (both same)", () => {
    expect(r.translateY).toBeCloseTo(-1, 10);
  });

  it("scale midpoint: 1 → 0.97 gives 0.985", () => {
    expect(r.scale).toBeCloseTo(0.985, 10);
  });
});
