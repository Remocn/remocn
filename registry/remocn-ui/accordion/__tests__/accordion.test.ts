import { describe, expect, it } from "bun:test";
import { defaultLightTheme } from "@/lib/remocn-ui";
import { accordionConfig } from "../config";
import {
  type AccordionState,
  accordionStyle,
  accordionStyleContext,
} from "../index";
import {
  DEFAULT_DURATION,
  tweenAccordionStyle,
} from "../use-accordion-transition";

const VALID_STATES: readonly AccordionState[] = ["opened", "closed"];

type SnippetValues = {
  state?: string;
  title?: string;
  content?: string;
  variant?: string;
};

const snippet = (values: SnippetValues): string =>
  accordionConfig.snippet(values as Record<string, unknown>);

const ctx = accordionStyleContext("default", defaultLightTheme);

describe("AccordionState union", () => {
  it("contains exactly the two documented states", () => {
    const control = accordionConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(control.options).toEqual(["opened", "closed"]);
  });

  it("every VALID_STATES entry is assignable (no typos in the fixture)", () => {
    const control = accordionConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(VALID_STATES).toHaveLength(2);
    for (const s of VALID_STATES) {
      expect(control.options).toContain(s);
    }
  });
});

describe("accordionConfig.controls.state", () => {
  it("is a select control", () => {
    expect(accordionConfig.controls.state.type).toBe("select");
  });

  it("has exactly the two AccordionState options in order", () => {
    const control = accordionConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(control.options).toEqual(["opened", "closed"]);
  });

  it("defaults to 'opened' so the preview showcases the revealed panel", () => {
    const control = accordionConfig.controls.state;
    expect(control.default).toBe("opened");
  });

  it("every option is a member of the AccordionState union", () => {
    const control = accordionConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    for (const option of control.options) {
      expect(VALID_STATES).toContain(option as AccordionState);
    }
  });
});

describe("accordionConfig.controls.variant", () => {
  it("is a select control", () => {
    expect(accordionConfig.controls.variant.type).toBe("select");
  });

  it("has exactly the two variant options in order", () => {
    const control = accordionConfig.controls.variant;
    if (control.type !== "select")
      throw new Error("variant control must be a select");
    expect(control.options).toEqual(["default", "ghost"]);
  });

  it("defaults to 'default'", () => {
    expect(accordionConfig.controls.variant.default).toBe("default");
  });
});

describe("accordionConfig.snippet: state prop emission", () => {
  it('emits state="opened" for the opened option', () => {
    expect(snippet({ state: "opened" })).toContain('state="opened"');
  });

  it('emits state="closed" for the closed option', () => {
    expect(snippet({ state: "closed" })).toContain('state="closed"');
  });

  it("emits the correct state for every control option", () => {
    const control = accordionConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    for (const state of control.options) {
      const out = snippet({ state });
      expect(out).toContain(`state="${state}"`);
    }
  });
});

describe("accordionConfig.snippet: NEVER emits steps or action", () => {
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

describe("accordionConfig.snippet: import line", () => {
  it("includes `import { Accordion }` from the correct path", () => {
    const out = snippet({ state: "opened" });
    expect(out).toContain("import { Accordion }");
    expect(out).toContain('from "@/components/remocn/accordion"');
  });
});

describe("accordionConfig.snippet: default props are omitted", () => {
  const allDefaults = snippet({
    state: "opened",
    title: "Is it accessible?",
    content: "Yes. It adheres to the WAI-ARIA design pattern.",
    variant: "default",
  });

  it("omits title when it equals the default 'Is it accessible?'", () => {
    expect(allDefaults).not.toContain("title=");
  });

  it("omits content when it equals the default WAI-ARIA text", () => {
    expect(allDefaults).not.toContain("content=");
  });

  it("omits variant when it equals the default 'default'", () => {
    expect(allDefaults).not.toContain("variant=");
  });
});

describe("accordionConfig.snippet: non-default props are emitted", () => {
  it("emits a non-default title", () => {
    expect(
      snippet({ state: "opened", title: "How do I reset my password?" }),
    ).toContain('title="How do I reset my password?"');
  });

  it("emits a non-default content", () => {
    expect(
      snippet({ state: "opened", content: "Click the forgot password link." }),
    ).toContain('content="Click the forgot password link."');
  });

  it("emits a non-default variant", () => {
    expect(snippet({ state: "opened", variant: "ghost" })).toContain(
      'variant="ghost"',
    );
  });
});

describe("accordionConfig.snippet: structural round-trip", () => {
  const out = snippet({ state: "opened" });

  it("starts with the import line", () => {
    expect(out.startsWith("import { Accordion }")).toBe(true);
  });

  it("contains a <Accordion JSX opening", () => {
    expect(out).toContain("<Accordion");
  });

  it("ends with a self-closing />", () => {
    expect(out.trimEnd().endsWith("/>")).toBe(true);
  });
});

describe("accordionStyle: closed state", () => {
  const s = accordionStyle("closed", ctx);

  it("panelHeight is 0 (panel fully collapsed)", () => {
    expect(s.panelHeight).toBe(0);
  });

  it("panelOpacity is 0 (panel content invisible)", () => {
    expect(s.panelOpacity).toBe(0);
  });

  it("chevronRotation is 0 (chevron points down, closed)", () => {
    expect(s.chevronRotation).toBe(0);
  });

  it("background is a non-empty string", () => {
    expect(typeof s.background).toBe("string");
    expect(s.background.length).toBeGreaterThan(0);
  });
});

describe("accordionStyle: opened state", () => {
  const s = accordionStyle("opened", ctx);

  it("panelHeight is 1 (panel fully revealed)", () => {
    expect(s.panelHeight).toBe(1);
  });

  it("panelOpacity is 1 (panel content fully visible)", () => {
    expect(s.panelOpacity).toBe(1);
  });

  it("chevronRotation is 180 (chevron flipped upward, opened)", () => {
    expect(s.chevronRotation).toBe(180);
  });

  it("background is a non-empty string", () => {
    expect(typeof s.background).toBe("string");
    expect(s.background.length).toBeGreaterThan(0);
  });
});

describe("accordionStyle: closed/opened invariant", () => {
  it("closed has panelHeight 0, panelOpacity 0, chevronRotation 0", () => {
    const s = accordionStyle("closed", ctx);
    expect(s.panelHeight).toBe(0);
    expect(s.panelOpacity).toBe(0);
    expect(s.chevronRotation).toBe(0);
  });

  it("opened has panelHeight 1, panelOpacity 1, chevronRotation 180", () => {
    const s = accordionStyle("opened", ctx);
    expect(s.panelHeight).toBe(1);
    expect(s.panelOpacity).toBe(1);
    expect(s.chevronRotation).toBe(180);
  });

  it("closed background equals ctx.closedBg", () => {
    const s = accordionStyle("closed", ctx);
    expect(s.background).toBe(ctx.closedBg);
  });

  it("opened background equals ctx.openBg", () => {
    const s = accordionStyle("opened", ctx);
    expect(s.background).toBe(ctx.openBg);
  });
});

describe("tweenAccordionStyle: t=0 returns values equal to `a`", () => {
  const a = accordionStyle("closed", ctx);
  const b = accordionStyle("opened", ctx);
  const r = tweenAccordionStyle(a, b, 0);

  it("panelHeight equals a.panelHeight at t=0", () => {
    expect(r.panelHeight).toBeCloseTo(a.panelHeight, 10);
  });

  it("panelOpacity equals a.panelOpacity at t=0", () => {
    expect(r.panelOpacity).toBeCloseTo(a.panelOpacity, 10);
  });

  it("chevronRotation equals a.chevronRotation at t=0", () => {
    expect(r.chevronRotation).toBeCloseTo(a.chevronRotation, 10);
  });

  it("background is a non-empty string at t=0", () => {
    expect(typeof r.background).toBe("string");
    expect(r.background.length).toBeGreaterThan(0);
  });
});

describe("tweenAccordionStyle: t=1 returns values equal to `b`", () => {
  const a = accordionStyle("closed", ctx);
  const b = accordionStyle("opened", ctx);
  const r = tweenAccordionStyle(a, b, 1);

  it("panelHeight equals b.panelHeight at t=1", () => {
    expect(r.panelHeight).toBeCloseTo(b.panelHeight, 10);
  });

  it("panelOpacity equals b.panelOpacity at t=1", () => {
    expect(r.panelOpacity).toBeCloseTo(b.panelOpacity, 10);
  });

  it("chevronRotation equals b.chevronRotation at t=1", () => {
    expect(r.chevronRotation).toBeCloseTo(b.chevronRotation, 10);
  });

  it("background is a non-empty string at t=1", () => {
    expect(typeof r.background).toBe("string");
    expect(r.background.length).toBeGreaterThan(0);
  });
});

describe("tweenAccordionStyle: t=0.5 midpoint numeric lerp (closed → opened)", () => {
  const a = accordionStyle("closed", ctx);
  const b = accordionStyle("opened", ctx);
  const r = tweenAccordionStyle(a, b, 0.5);

  it("panelHeight midpoint: 0 → 1 gives 0.5", () => {
    expect(r.panelHeight).toBeCloseTo(0.5, 10);
  });

  it("panelOpacity midpoint: 0 → 1 gives 0.5", () => {
    expect(r.panelOpacity).toBeCloseTo(0.5, 10);
  });

  it("chevronRotation midpoint: 0 → 180 gives 90", () => {
    expect(r.chevronRotation).toBeCloseTo(90, 10);
  });

  it("background is a non-empty string at t=0.5", () => {
    expect(typeof r.background).toBe("string");
    expect(r.background.length).toBeGreaterThan(0);
  });
});

describe("tweenAccordionStyle: t=0.5 midpoint numeric lerp (opened → closed)", () => {
  const a = accordionStyle("opened", ctx);
  const b = accordionStyle("closed", ctx);
  const r = tweenAccordionStyle(a, b, 0.5);

  it("panelHeight midpoint: 1 → 0 gives 0.5", () => {
    expect(r.panelHeight).toBeCloseTo(0.5, 10);
  });

  it("panelOpacity midpoint: 1 → 0 gives 0.5", () => {
    expect(r.panelOpacity).toBeCloseTo(0.5, 10);
  });

  it("chevronRotation midpoint: 180 → 0 gives 90", () => {
    expect(r.chevronRotation).toBeCloseTo(90, 10);
  });

  it("background is a non-empty string at t=0.5", () => {
    expect(typeof r.background).toBe("string");
    expect(r.background.length).toBeGreaterThan(0);
  });
});

describe("DEFAULT_DURATION", () => {
  it("is a positive number", () => {
    expect(typeof DEFAULT_DURATION).toBe("number");
    expect(DEFAULT_DURATION).toBeGreaterThan(0);
  });

  it("equals 14 (the authored value)", () => {
    expect(DEFAULT_DURATION).toBe(14);
  });
});
