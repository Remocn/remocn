import { describe, expect, it } from "bun:test";
import { defaultLightTheme } from "@/lib/remocn-ui";
import { selectMenuConfig } from "../config";
import {
  type SelectMenuStyle,
  selectMenuStyle,
  selectMenuStyleContext,
} from "../index";
import {
  computeSelectMenuClick,
  DEFAULT_DURATION,
  tweenSelectMenuStyle,
} from "../use-select-menu-transition";

const DEFAULT_OPTIONS = ["New Game", "Continue", "Settings", "Quit"];

const ctx = selectMenuStyleContext(DEFAULT_OPTIONS, "soft", defaultLightTheme);
const solidCtx = selectMenuStyleContext(
  DEFAULT_OPTIONS,
  "solid",
  defaultLightTheme,
);

describe("selectMenuStyle", () => {
  it("maps a selected index to an indicatorOffset of the same value", () => {
    const s = selectMenuStyle(1, ctx);
    expect(s.indicatorOffset).toBe(1);
  });

  it("maps index 0 to offset 0 (first row)", () => {
    expect(selectMenuStyle(0, ctx).indicatorOffset).toBe(0);
  });

  it("clamps a negative index to 0", () => {
    expect(selectMenuStyle(-3, ctx).indicatorOffset).toBe(0);
  });

  it("clamps an out-of-range index to the last row", () => {
    const last = DEFAULT_OPTIONS.length - 1;
    expect(selectMenuStyle(99, ctx).indicatorOffset).toBe(last);
  });

  it("clamps indexOf(-1) results (unknown state value) to 0", () => {
    // A state value not present in options maps to index -1 → clamped to 0.
    expect(
      selectMenuStyle(DEFAULT_OPTIONS.indexOf("Unknown"), ctx).indicatorOffset,
    ).toBe(0);
  });

  it("reports selectProgress 1 and press 0 — selected fully, no press", () => {
    expect(selectMenuStyle(2, ctx).selectProgress).toBe(1);
    expect(selectMenuStyle(2, ctx).press).toBe(0);
    expect(selectMenuStyle(0, solidCtx).selectProgress).toBe(1);
  });
});

describe("selectMenuStyleContext", () => {
  it("carries the option list and a default first option", () => {
    expect(ctx.options).toEqual(DEFAULT_OPTIONS);
    expect(ctx.options[0]).toBe("New Game");
  });

  it("soft variant uses accent-based highlight with a primary accent bar", () => {
    expect(ctx.variant).toBe("soft");
    expect(ctx.highlightBg).toBeTypeOf("string");
    expect(typeof ctx.accent).toBe("string");
    // highlight (accent) and inactive label are both non-empty oklch strings
    expect(ctx.highlightBg.length).toBeGreaterThan(0);
    expect(ctx.inactiveFg.length).toBeGreaterThan(0);
  });

  it("solid variant uses primary background and primaryForeground accent", () => {
    expect(solidCtx.variant).toBe("solid");
    expect(solidCtx.highlightBg).toBe(defaultLightTheme.primary);
    expect(solidCtx.accent).toBe(defaultLightTheme.primaryForeground);
  });

  it("inactive foreground is non-empty for both variants", () => {
    expect(ctx.inactiveFg.length).toBeGreaterThan(0);
    expect(solidCtx.inactiveFg.length).toBeGreaterThan(0);
  });

  it("carries the theme foreground for the press darkening", () => {
    expect(ctx.foreground).toBe(defaultLightTheme.foreground);
  });
});

describe("computeSelectMenuClick", () => {
  it("is fully at rest before the click window", () => {
    const r = computeSelectMenuClick(0, 60);
    expect(r.press).toBe(0);
    expect(r.selectProgress).toBe(0);
  });

  it("presses over the first portion and releases by the window end", () => {
    // With dur 10, pressEnd = 4.
    const half = computeSelectMenuClick(50, 48, 10); // t = 2 → mid-press
    expect(half.press).toBeCloseTo(0.5, 10);
    expect(half.selectProgress).toBe(0); // check not risen yet
    expect(computeSelectMenuClick(48 + 4, 48, 10).press).toBeCloseTo(1, 10);
    expect(computeSelectMenuClick(48 + 10, 48, 10).press).toBe(0);
  });

  it("rises selectProgress during the release and persists once selected", () => {
    const r = computeSelectMenuClick(48 + 10 + 30, 48, 10); // long after
    expect(r.selectProgress).toBe(1);
  });

  it("keeps selected persistent when no hold is configured", () => {
    const late = computeSelectMenuClick(60 + 200, 60, DEFAULT_DURATION);
    expect(late.press).toBe(0);
    expect(late.selectProgress).toBe(1);
  });

  it("decays selectProgress back to 0 after the hold", () => {
    // clickAt=60, dur=10, hold=5, decay=10 → decayStart at 75.
    const opts = { hold: 5, decayDuration: 10 };
    const atHoldEnd = computeSelectMenuClick(75, 60, 10, opts); // t=15
    expect(atHoldEnd.selectProgress).toBe(1);
    expect(atHoldEnd.press).toBe(0);
    const midDecay = computeSelectMenuClick(80, 60, 10, opts); // t=20, decay 0.5
    expect(midDecay.selectProgress).toBeCloseTo(0.5, 10);
    const fullyDecayed = computeSelectMenuClick(85 + 40, 60, 10, opts);
    expect(fullyDecayed.selectProgress).toBe(0);
    // Decay never replays the press.
    expect(fullyDecayed.press).toBe(0);
    expect(midDecay.press).toBe(0);
  });
});

describe("tweenSelectMenuStyle", () => {
  it("t=0 equals `a`", () => {
    const a: SelectMenuStyle = {
      indicatorOffset: 0,
      press: 0,
      selectProgress: 0,
    };
    const b: SelectMenuStyle = {
      indicatorOffset: 3,
      press: 1,
      selectProgress: 1,
    };
    const r = tweenSelectMenuStyle(a, b, 0);
    expect(r.indicatorOffset).toBeCloseTo(0, 10);
    expect(r.press).toBeCloseTo(0, 10);
    expect(r.selectProgress).toBeCloseTo(0, 10);
  });

  it("t=1 equals `b`", () => {
    const a: SelectMenuStyle = {
      indicatorOffset: 0,
      press: 0,
      selectProgress: 0,
    };
    const b: SelectMenuStyle = {
      indicatorOffset: 3,
      press: 1,
      selectProgress: 1,
    };
    const r = tweenSelectMenuStyle(a, b, 1);
    expect(r.indicatorOffset).toBeCloseTo(3, 10);
    expect(r.press).toBeCloseTo(1, 10);
    expect(r.selectProgress).toBeCloseTo(1, 10);
  });

  it("t=0.5 is the exact midpoint (0 → 3 gives 1.5)", () => {
    const a: SelectMenuStyle = {
      indicatorOffset: 0,
      press: 0,
      selectProgress: 0,
    };
    const b: SelectMenuStyle = {
      indicatorOffset: 3,
      press: 1,
      selectProgress: 1,
    };
    const r = tweenSelectMenuStyle(a, b, 0.5);
    expect(r.indicatorOffset).toBeCloseTo(1.5, 10);
    expect(r.press).toBeCloseTo(0.5, 10);
    expect(r.selectProgress).toBeCloseTo(0.5, 10);
  });

  it("t=0.5 between 1 and 2 gives 1.5 (adjacent rows)", () => {
    const a: SelectMenuStyle = {
      indicatorOffset: 1,
      press: 0,
      selectProgress: 0,
    };
    const b: SelectMenuStyle = {
      indicatorOffset: 2,
      press: 0,
      selectProgress: 1,
    };
    expect(tweenSelectMenuStyle(a, b, 0.5).indicatorOffset).toBeCloseTo(
      1.5,
      10,
    );
  });

  it("handles a same-row tween (both offsets equal)", () => {
    const a: SelectMenuStyle = {
      indicatorOffset: 2,
      press: 0.3,
      selectProgress: 0.6,
    };
    const b: SelectMenuStyle = {
      indicatorOffset: 2,
      press: 0.3,
      selectProgress: 0.6,
    };
    const r = tweenSelectMenuStyle(a, b, 0.37);
    expect(r.indicatorOffset).toBeCloseTo(2, 10);
    expect(r.press).toBeCloseTo(0.3, 10);
    expect(r.selectProgress).toBeCloseTo(0.6, 10);
  });

  it("interpolates press and selectProgress linearly", () => {
    const a: SelectMenuStyle = {
      indicatorOffset: 0,
      press: 0,
      selectProgress: 0,
    };
    const b: SelectMenuStyle = {
      indicatorOffset: 0,
      press: 1,
      selectProgress: 1,
    };
    expect(tweenSelectMenuStyle(a, b, 0.25).press).toBeCloseTo(0.25, 10);
    expect(tweenSelectMenuStyle(a, b, 0.75).selectProgress).toBeCloseTo(
      0.75,
      10,
    );
  });
});

describe("selectMenuConfig.controls", () => {
  it("selectedIndex is a number control clamped to the option range", () => {
    const ctrl = selectMenuConfig.controls.selectedIndex;
    expect(ctrl.type).toBe("number");
    if (ctrl.type !== "number") throw new Error("expected number control");
    expect(ctrl.min).toBe(0);
    expect(ctrl.max).toBe(3);
    expect(ctrl.default).toBe(1);
  });

  it("variant is an enum control with soft/solid options", () => {
    const ctrl = selectMenuConfig.controls.variant;
    expect(ctrl.type).toBe("enum");
    if (ctrl.type !== "enum") throw new Error("expected enum control");
    expect(Object.keys(ctrl.variants).sort()).toEqual(["soft", "solid"]);
    expect(ctrl.default).toBe("soft");
  });
});

describe("selectMenuConfig.snippet", () => {
  type SnippetValues = { selectedIndex?: number; variant?: string };

  const snippet = (values: SnippetValues): string =>
    selectMenuConfig.snippet(values as Record<string, unknown>);

  it("includes the import line from the install path", () => {
    const out = snippet({ selectedIndex: 1 });
    expect(out).toContain("import { SelectMenu }");
    expect(out).toContain('from "@/components/remocn/select-menu"');
  });

  it("emits selectedIndex always (primary controlled prop)", () => {
    const out = snippet({ selectedIndex: 1 });
    expect(out).toContain("selectedIndex={1}");
  });

  it("emits a non-default selectedIndex", () => {
    expect(snippet({ selectedIndex: 3 })).toContain("selectedIndex={3}");
  });

  it("omits a default-equal variant (soft)", () => {
    expect(snippet({ selectedIndex: 1, variant: "soft" })).not.toContain(
      "variant=",
    );
  });

  it("emits a non-default variant (solid)", () => {
    expect(snippet({ selectedIndex: 1, variant: "solid" })).toContain(
      'variant="solid"',
    );
  });

  it("includes the options array with the default values", () => {
    const out = snippet({ selectedIndex: 0 });
    expect(out).toContain("New Game");
    expect(out).toContain("Quit");
  });

  it("ends with a self-closing />", () => {
    expect(snippet({ selectedIndex: 2 }).trimEnd().endsWith("/>")).toBe(true);
  });
});
