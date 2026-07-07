import { describe, expect, it } from "bun:test";
import { defaultLightTheme } from "@/lib/remocn-ui";
import { inputConfig } from "../config";
import { type InputState, inputStyle, inputStyleContext } from "../index";
import { tweenInputStyle } from "../use-input-transition";

const VALID_STATES: readonly InputState[] = [
  "idle",
  "hover",
  "active",
  "typing",
  "blur",
  "invalid",
];

type SnippetValues = {
  state?: string;
  placeholder?: string;
  value?: string;
  size?: string;
  primary?: string;
};

const snippet = (values: SnippetValues): string =>
  inputConfig.snippet(values as Record<string, unknown>);

describe("InputState union", () => {
  it("contains exactly the six documented states", () => {
    const control = inputConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(control.options).toEqual([
      "idle",
      "hover",
      "active",
      "typing",
      "blur",
      "invalid",
    ]);
  });

  it("every VALID_STATES entry is assignable (no typos in the fixture)", () => {
    const control = inputConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(VALID_STATES).toHaveLength(6);
    for (const s of VALID_STATES) {
      expect(control.options).toContain(s);
    }
  });
});

describe("inputConfig.controls.state", () => {
  it("is a select control", () => {
    expect(inputConfig.controls.state.type).toBe("select");
  });

  it("has exactly the six InputState options in order", () => {
    const control = inputConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(control.options).toEqual([
      "idle",
      "hover",
      "active",
      "typing",
      "blur",
      "invalid",
    ]);
  });

  it("defaults to 'typing' so the preview shows the caret + revealed value", () => {
    const control = inputConfig.controls.state;
    expect(control.default).toBe("typing");
  });

  it("every option is a member of the InputState union", () => {
    const control = inputConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    for (const option of control.options) {
      expect(VALID_STATES).toContain(option as InputState);
    }
  });
});

describe("inputConfig.snippet: state prop emission", () => {
  it('emits state="idle" for the idle option', () => {
    expect(snippet({ state: "idle" })).toContain('state="idle"');
  });

  it('emits state="hover" for the hover option', () => {
    expect(snippet({ state: "hover" })).toContain('state="hover"');
  });

  it('emits state="active" for the active option', () => {
    expect(snippet({ state: "active" })).toContain('state="active"');
  });

  it('emits state="typing" for the typing option', () => {
    expect(snippet({ state: "typing" })).toContain('state="typing"');
  });

  it('emits state="blur" for the blur option', () => {
    expect(snippet({ state: "blur" })).toContain('state="blur"');
  });

  it('emits state="invalid" for the invalid option', () => {
    expect(snippet({ state: "invalid" })).toContain('state="invalid"');
  });

  it("emits the correct state for every control option", () => {
    const control = inputConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    for (const state of control.options) {
      const out = snippet({ state });
      expect(out).toContain(`state="${state}"`);
    }
  });
});

describe("inputConfig.snippet: NEVER emits steps or action", () => {
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

describe("inputConfig.snippet: import line", () => {
  it("includes `import { Input }` from the correct path", () => {
    const out = snippet({ state: "typing" });
    expect(out).toContain("import { Input }");
    expect(out).toContain('from "@/components/remocn/input"');
  });
});

describe("inputConfig.snippet: default props are omitted", () => {
  const allDefaults = snippet({
    state: "typing",
    placeholder: "you@example.com",
    value: "remotion@remocn.dev",
    size: "default",
    primary: "#171717",
  });

  it("omits placeholder when it equals the default 'you@example.com'", () => {
    expect(allDefaults).not.toContain("placeholder=");
  });

  it("omits value when it equals the default 'remotion@remocn.dev'", () => {
    expect(allDefaults).not.toContain("value=");
  });

  it("omits size when it equals the default 'default'", () => {
    expect(allDefaults).not.toContain("size=");
  });

  it("omits primary when it equals the default '#171717'", () => {
    expect(allDefaults).not.toContain("primary=");
  });
});

describe("inputConfig.snippet: non-default props are emitted", () => {
  it("emits a non-default placeholder", () => {
    expect(
      snippet({ state: "idle", placeholder: "name@company.com" }),
    ).toContain('placeholder="name@company.com"');
  });

  it("emits a non-default value", () => {
    expect(snippet({ state: "typing", value: "user@test.io" })).toContain(
      'value="user@test.io"',
    );
  });

  it("emits a non-default size", () => {
    expect(snippet({ state: "typing", size: "lg" })).toContain('size="lg"');
  });

  it("emits a non-default primary color", () => {
    expect(snippet({ state: "typing", primary: "#6366f1" })).toContain(
      'primary="#6366f1"',
    );
  });
});

describe("inputConfig.snippet: structural round-trip", () => {
  const out = snippet({ state: "typing" });

  it("starts with the import line", () => {
    expect(out.startsWith("import { Input }")).toBe(true);
  });

  it("contains a <Input JSX opening", () => {
    expect(out).toContain("<Input");
  });

  it("ends with a self-closing />", () => {
    expect(out.trimEnd().endsWith("/>")).toBe(true);
  });
});

const ctx = inputStyleContext(defaultLightTheme);

describe("inputStyle: idle state", () => {
  const s = inputStyle("idle", ctx);

  it("ringWidth is 0 (no focus ring)", () => {
    expect(s.ringWidth).toBe(0);
  });

  it("caretOpacity is 0 (caret hidden)", () => {
    expect(s.caretOpacity).toBe(0);
  });

  it("valueReveal is 0 (value not shown)", () => {
    expect(s.valueReveal).toBe(0);
  });

  it("placeholderOpacity is 1 (placeholder fully visible)", () => {
    expect(s.placeholderOpacity).toBe(1);
  });

  it("borderColor is a non-empty string", () => {
    expect(typeof s.borderColor).toBe("string");
    expect(s.borderColor.length).toBeGreaterThan(0);
  });

  it("ringColor is a non-empty string", () => {
    expect(typeof s.ringColor).toBe("string");
    expect(s.ringColor.length).toBeGreaterThan(0);
  });

  it("background is a non-empty string", () => {
    expect(typeof s.background).toBe("string");
    expect(s.background.length).toBeGreaterThan(0);
  });
});

describe("inputStyle: hover state", () => {
  const s = inputStyle("hover", ctx);

  it("ringWidth is 0 (no focus ring on hover)", () => {
    expect(s.ringWidth).toBe(0);
  });

  it("caretOpacity is 0 (caret hidden)", () => {
    expect(s.caretOpacity).toBe(0);
  });

  it("valueReveal is 0 (value not shown)", () => {
    expect(s.valueReveal).toBe(0);
  });

  it("placeholderOpacity is 1 (placeholder fully visible)", () => {
    expect(s.placeholderOpacity).toBe(1);
  });

  it("borderColor is a non-empty string", () => {
    expect(typeof s.borderColor).toBe("string");
    expect(s.borderColor.length).toBeGreaterThan(0);
  });

  it("ringColor is a non-empty string", () => {
    expect(typeof s.ringColor).toBe("string");
    expect(s.ringColor.length).toBeGreaterThan(0);
  });

  it("background is a non-empty string", () => {
    expect(typeof s.background).toBe("string");
    expect(s.background.length).toBeGreaterThan(0);
  });
});

describe("inputStyle: active state", () => {
  const s = inputStyle("active", ctx);

  it("ringWidth is 3 (focus ring visible)", () => {
    expect(s.ringWidth).toBe(3);
  });

  it("caretOpacity is 1 (caret visible)", () => {
    expect(s.caretOpacity).toBe(1);
  });

  it("valueReveal is 0 (value not yet revealed)", () => {
    expect(s.valueReveal).toBe(0);
  });

  it("placeholderOpacity is 1 (placeholder still visible)", () => {
    expect(s.placeholderOpacity).toBe(1);
  });

  it("borderColor is a non-empty string", () => {
    expect(typeof s.borderColor).toBe("string");
    expect(s.borderColor.length).toBeGreaterThan(0);
  });

  it("ringColor is a non-empty string", () => {
    expect(typeof s.ringColor).toBe("string");
    expect(s.ringColor.length).toBeGreaterThan(0);
  });

  it("background is a non-empty string", () => {
    expect(typeof s.background).toBe("string");
    expect(s.background.length).toBeGreaterThan(0);
  });
});

describe("inputStyle: typing state", () => {
  const s = inputStyle("typing", ctx);

  it("ringWidth is 3 (focus ring visible)", () => {
    expect(s.ringWidth).toBe(3);
  });

  it("caretOpacity is 1 (caret visible while typing)", () => {
    expect(s.caretOpacity).toBe(1);
  });

  it("valueReveal is 1 (value fully revealed)", () => {
    expect(s.valueReveal).toBe(1);
  });

  it("placeholderOpacity is 0 (placeholder hidden by value)", () => {
    expect(s.placeholderOpacity).toBe(0);
  });

  it("borderColor is a non-empty string", () => {
    expect(typeof s.borderColor).toBe("string");
    expect(s.borderColor.length).toBeGreaterThan(0);
  });

  it("ringColor is a non-empty string", () => {
    expect(typeof s.ringColor).toBe("string");
    expect(s.ringColor.length).toBeGreaterThan(0);
  });

  it("background is a non-empty string", () => {
    expect(typeof s.background).toBe("string");
    expect(s.background.length).toBeGreaterThan(0);
  });
});

describe("inputStyle: blur state", () => {
  const s = inputStyle("blur", ctx);

  it("ringWidth is 0 (no focus ring — field is unfocused)", () => {
    expect(s.ringWidth).toBe(0);
  });

  it("caretOpacity is 0 (caret hidden when blurred)", () => {
    expect(s.caretOpacity).toBe(0);
  });

  it("valueReveal is 1 (value stays fully shown — no un-typing)", () => {
    expect(s.valueReveal).toBe(1);
  });

  it("placeholderOpacity is 0 (placeholder stays hidden — value is shown)", () => {
    expect(s.placeholderOpacity).toBe(0);
  });

  it("borderColor is a non-empty string", () => {
    expect(typeof s.borderColor).toBe("string");
    expect(s.borderColor.length).toBeGreaterThan(0);
  });

  it("ringColor is a non-empty string", () => {
    expect(typeof s.ringColor).toBe("string");
    expect(s.ringColor.length).toBeGreaterThan(0);
  });

  it("background is a non-empty string", () => {
    expect(typeof s.background).toBe("string");
    expect(s.background.length).toBeGreaterThan(0);
  });
});

describe("inputStyle: invalid state", () => {
  const s = inputStyle("invalid", ctx);

  it("ringWidth is 3 (error ring visible)", () => {
    expect(s.ringWidth).toBe(3);
  });

  it("caretOpacity is 0 (caret hidden after invalid submit)", () => {
    expect(s.caretOpacity).toBe(0);
  });

  it("valueReveal is 1 (value stays revealed)", () => {
    expect(s.valueReveal).toBe(1);
  });

  it("placeholderOpacity is 0 (placeholder still hidden)", () => {
    expect(s.placeholderOpacity).toBe(0);
  });

  it("borderColor is a non-empty string", () => {
    expect(typeof s.borderColor).toBe("string");
    expect(s.borderColor.length).toBeGreaterThan(0);
  });

  it("ringColor is a non-empty string", () => {
    expect(typeof s.ringColor).toBe("string");
    expect(s.ringColor.length).toBeGreaterThan(0);
  });

  it("background is a non-empty string", () => {
    expect(typeof s.background).toBe("string");
    expect(s.background.length).toBeGreaterThan(0);
  });
});

describe("inputStyle: string-field invariant — borderColor/ringColor/background are non-empty for every state", () => {
  it("all three color fields are non-empty strings in every state", () => {
    for (const state of VALID_STATES) {
      const s = inputStyle(state, ctx);
      expect(s.borderColor.length).toBeGreaterThan(0);
      expect(s.ringColor.length).toBeGreaterThan(0);
      expect(s.background.length).toBeGreaterThan(0);
    }
  });
});

describe("tweenInputStyle: t=0 returns values equal to `a`", () => {
  const a = inputStyle("idle", ctx);
  const b = inputStyle("active", ctx);
  const r = tweenInputStyle(a, b, 0);

  it("ringWidth equals a.ringWidth at t=0", () => {
    expect(r.ringWidth).toBeCloseTo(a.ringWidth, 10);
  });

  it("caretOpacity equals a.caretOpacity at t=0", () => {
    expect(r.caretOpacity).toBeCloseTo(a.caretOpacity, 10);
  });

  it("valueReveal equals a.valueReveal at t=0", () => {
    expect(r.valueReveal).toBeCloseTo(a.valueReveal, 10);
  });

  it("placeholderOpacity equals a.placeholderOpacity at t=0", () => {
    expect(r.placeholderOpacity).toBeCloseTo(a.placeholderOpacity, 10);
  });

  it("borderColor is a non-empty string at t=0", () => {
    expect(typeof r.borderColor).toBe("string");
    expect(r.borderColor.length).toBeGreaterThan(0);
  });

  it("ringColor is a non-empty string at t=0", () => {
    expect(typeof r.ringColor).toBe("string");
    expect(r.ringColor.length).toBeGreaterThan(0);
  });

  it("background is a non-empty string at t=0", () => {
    expect(typeof r.background).toBe("string");
    expect(r.background.length).toBeGreaterThan(0);
  });
});

describe("tweenInputStyle: t=1 returns values equal to `b`", () => {
  const a = inputStyle("idle", ctx);
  const b = inputStyle("active", ctx);
  const r = tweenInputStyle(a, b, 1);

  it("ringWidth equals b.ringWidth at t=1", () => {
    expect(r.ringWidth).toBeCloseTo(b.ringWidth, 10);
  });

  it("caretOpacity equals b.caretOpacity at t=1", () => {
    expect(r.caretOpacity).toBeCloseTo(b.caretOpacity, 10);
  });

  it("valueReveal equals b.valueReveal at t=1", () => {
    expect(r.valueReveal).toBeCloseTo(b.valueReveal, 10);
  });

  it("placeholderOpacity equals b.placeholderOpacity at t=1", () => {
    expect(r.placeholderOpacity).toBeCloseTo(b.placeholderOpacity, 10);
  });

  it("borderColor is a non-empty string at t=1", () => {
    expect(typeof r.borderColor).toBe("string");
    expect(r.borderColor.length).toBeGreaterThan(0);
  });

  it("ringColor is a non-empty string at t=1", () => {
    expect(typeof r.ringColor).toBe("string");
    expect(r.ringColor.length).toBeGreaterThan(0);
  });

  it("background is a non-empty string at t=1", () => {
    expect(typeof r.background).toBe("string");
    expect(r.background.length).toBeGreaterThan(0);
  });
});

describe("tweenInputStyle: t=0.5 midpoint numeric lerp (idle → active)", () => {
  const a = inputStyle("idle", ctx);
  const b = inputStyle("active", ctx);
  const r = tweenInputStyle(a, b, 0.5);

  it("ringWidth midpoint: 0 → 3 gives 1.5", () => {
    expect(r.ringWidth).toBeCloseTo(1.5, 10);
  });

  it("caretOpacity midpoint: 0 → 1 gives 0.5", () => {
    expect(r.caretOpacity).toBeCloseTo(0.5, 10);
  });

  it("valueReveal midpoint: 0 → 0 gives 0 (both same)", () => {
    expect(r.valueReveal).toBeCloseTo(0, 10);
  });

  it("placeholderOpacity midpoint: 1 → 1 gives 1 (both same)", () => {
    expect(r.placeholderOpacity).toBeCloseTo(1, 10);
  });

  it("borderColor is a non-empty string at t=0.5", () => {
    expect(typeof r.borderColor).toBe("string");
    expect(r.borderColor.length).toBeGreaterThan(0);
  });

  it("ringColor is a non-empty string at t=0.5", () => {
    expect(typeof r.ringColor).toBe("string");
    expect(r.ringColor.length).toBeGreaterThan(0);
  });

  it("background is a non-empty string at t=0.5", () => {
    expect(typeof r.background).toBe("string");
    expect(r.background.length).toBeGreaterThan(0);
  });
});

describe("tweenInputStyle: t=0.5 midpoint numeric lerp (active → typing)", () => {
  const a = inputStyle("active", ctx);
  const b = inputStyle("typing", ctx);
  const r = tweenInputStyle(a, b, 0.5);

  it("ringWidth midpoint: 3 → 3 gives 3 (both same)", () => {
    expect(r.ringWidth).toBeCloseTo(3, 10);
  });

  it("caretOpacity midpoint: 1 → 1 gives 1 (both same)", () => {
    expect(r.caretOpacity).toBeCloseTo(1, 10);
  });

  it("valueReveal midpoint: 0 → 1 gives 0.5", () => {
    expect(r.valueReveal).toBeCloseTo(0.5, 10);
  });

  it("placeholderOpacity midpoint: 1 → 0 gives 0.5", () => {
    expect(r.placeholderOpacity).toBeCloseTo(0.5, 10);
  });

  it("background is a non-empty string at t=0.5", () => {
    expect(typeof r.background).toBe("string");
    expect(r.background.length).toBeGreaterThan(0);
  });
});

describe("tweenInputStyle: t=0.5 midpoint numeric lerp (typing → invalid)", () => {
  const a = inputStyle("typing", ctx);
  const b = inputStyle("invalid", ctx);
  const r = tweenInputStyle(a, b, 0.5);

  it("ringWidth midpoint: 3 → 3 gives 3 (both same)", () => {
    expect(r.ringWidth).toBeCloseTo(3, 10);
  });

  it("caretOpacity midpoint: 1 → 0 gives 0.5", () => {
    expect(r.caretOpacity).toBeCloseTo(0.5, 10);
  });

  it("valueReveal midpoint: 1 → 1 gives 1 (both same)", () => {
    expect(r.valueReveal).toBeCloseTo(1, 10);
  });

  it("placeholderOpacity midpoint: 0 → 0 gives 0 (both same)", () => {
    expect(r.placeholderOpacity).toBeCloseTo(0, 10);
  });

  it("borderColor is a non-empty string at t=0.5", () => {
    expect(typeof r.borderColor).toBe("string");
    expect(r.borderColor.length).toBeGreaterThan(0);
  });

  it("ringColor is a non-empty string at t=0.5", () => {
    expect(typeof r.ringColor).toBe("string");
    expect(r.ringColor.length).toBeGreaterThan(0);
  });
});
