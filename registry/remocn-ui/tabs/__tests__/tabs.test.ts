import { describe, expect, it } from "bun:test";
import { defaultLightTheme } from "@/lib/remocn-ui";
import { tabsConfig } from "../config";
import { type TabsState, tabsStyle, tabsStyleContext } from "../index";
import { DEFAULT_DURATION, tweenTabsStyle } from "../use-tabs-transition";

const VALID_STATES: readonly TabsState[] = ["Account", "Password", "Settings"];

type SnippetValues = {
  state?: string;
  variant?: string;
};

const snippet = (values: SnippetValues): string =>
  tabsConfig.snippet(values as Record<string, unknown>);

const ctx = tabsStyleContext(
  ["Account", "Password", "Settings"],
  "pill",
  defaultLightTheme,
);

describe("TabsState / state options", () => {
  it("controls.state is a select control", () => {
    expect(tabsConfig.controls.state.type).toBe("select");
  });

  it("contains exactly the three documented states", () => {
    const control = tabsConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(control.options).toEqual(["Account", "Password", "Settings"]);
  });

  it("defaults to 'Account' so the preview opens on the first tab", () => {
    expect(tabsConfig.controls.state.default).toBe("Account");
  });

  it("every VALID_STATES entry is present in the options list (no typos in fixture)", () => {
    const control = tabsConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    expect(VALID_STATES).toHaveLength(3);
    for (const s of VALID_STATES) {
      expect(control.options).toContain(s);
    }
  });
});

describe("tabsConfig.controls.variant", () => {
  it("is a select control", () => {
    expect(tabsConfig.controls.variant.type).toBe("select");
  });

  it("has exactly the two variant options in order", () => {
    const control = tabsConfig.controls.variant;
    if (control.type !== "select")
      throw new Error("variant control must be a select");
    expect(control.options).toEqual(["pill", "underline"]);
  });

  it("defaults to 'pill'", () => {
    expect(tabsConfig.controls.variant.default).toBe("pill");
  });
});

describe("tabsConfig.snippet: state prop emission", () => {
  it('emits state="Account" for the Account option', () => {
    expect(snippet({ state: "Account" })).toContain('state="Account"');
  });

  it('emits state="Password" for the Password option', () => {
    expect(snippet({ state: "Password" })).toContain('state="Password"');
  });

  it('emits state="Settings" for the Settings option', () => {
    expect(snippet({ state: "Settings" })).toContain('state="Settings"');
  });

  it("emits the correct state for every control option", () => {
    const control = tabsConfig.controls.state;
    if (control.type !== "select")
      throw new Error("state control must be a select");
    for (const state of control.options) {
      const out = snippet({ state });
      expect(out).toContain(`state="${state}"`);
    }
  });
});

describe("tabsConfig.snippet: NEVER emits steps", () => {
  it("never emits `steps` for any state option", () => {
    for (const state of VALID_STATES) {
      expect(snippet({ state })).not.toContain("steps");
    }
  });
});

describe("tabsConfig.snippet: import line", () => {
  it("includes `import { Tabs }` from the correct path", () => {
    const out = snippet({ state: "Account" });
    expect(out).toContain("import { Tabs }");
    expect(out).toContain('from "@/components/remocn/tabs"');
  });
});

describe("tabsConfig.snippet: default props are omitted", () => {
  const allDefaults = snippet({
    state: "Account",
    variant: "pill",
  });

  it("omits variant when it equals the default 'pill'", () => {
    expect(allDefaults).not.toContain("variant=");
  });
});

describe("tabsConfig.snippet: non-default props are emitted", () => {
  it("emits a non-default variant='underline'", () => {
    expect(snippet({ state: "Account", variant: "underline" })).toContain(
      'variant="underline"',
    );
  });
});

describe("tabsConfig.snippet: structural round-trip", () => {
  const out = snippet({ state: "Account" });

  it("starts with the import line", () => {
    expect(out.startsWith("import { Tabs }")).toBe(true);
  });

  it("contains a <Tabs JSX opening", () => {
    expect(out).toContain("<Tabs");
  });

  it("ends with a self-closing />", () => {
    expect(out.trimEnd().endsWith("/>")).toBe(true);
  });
});

describe("tabsStyle: Account state", () => {
  it("indicatorOffset is 0 (first tab)", () => {
    expect(tabsStyle("Account", ctx).indicatorOffset).toBe(0);
  });
});

describe("tabsStyle: Password state", () => {
  it("indicatorOffset is 1 (second tab)", () => {
    expect(tabsStyle("Password", ctx).indicatorOffset).toBe(1);
  });
});

describe("tabsStyle: Settings state", () => {
  it("indicatorOffset is 2 (third tab)", () => {
    expect(tabsStyle("Settings", ctx).indicatorOffset).toBe(2);
  });
});

describe("tabsStyle: unknown state", () => {
  it("returns indicatorOffset 0 as the safe fallback for an unknown state", () => {
    expect(tabsStyle("Nope", ctx).indicatorOffset).toBe(0);
  });

  it("returns indicatorOffset 0 for an empty-string state", () => {
    expect(tabsStyle("", ctx).indicatorOffset).toBe(0);
  });
});

describe("tabsStyle: each item maps to its own index", () => {
  const items = ["Account", "Password", "Settings"];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    it(`${item} → indicatorOffset ${i}`, () => {
      expect(tabsStyle(item, ctx).indicatorOffset).toBe(i);
    });
  }
});

describe("tabsStyle: indicatorOffset invariant across variants", () => {
  const underlineCtx = tabsStyleContext(
    ["Account", "Password", "Settings"],
    "underline",
    defaultLightTheme,
  );

  it("Account → 0 in underline variant", () => {
    expect(tabsStyle("Account", underlineCtx).indicatorOffset).toBe(0);
  });

  it("Password → 1 in underline variant", () => {
    expect(tabsStyle("Password", underlineCtx).indicatorOffset).toBe(1);
  });

  it("Settings → 2 in underline variant", () => {
    expect(tabsStyle("Settings", underlineCtx).indicatorOffset).toBe(2);
  });
});

describe("tweenTabsStyle: t=0 returns values equal to `a`", () => {
  const a = tabsStyle("Account", ctx);
  const b = tabsStyle("Settings", ctx);
  const r = tweenTabsStyle(a, b, 0);

  it("indicatorOffset equals a.indicatorOffset at t=0", () => {
    expect(r.indicatorOffset).toBeCloseTo(a.indicatorOffset, 10);
  });
});

describe("tweenTabsStyle: t=1 returns values equal to `b`", () => {
  const a = tabsStyle("Account", ctx);
  const b = tabsStyle("Settings", ctx);
  const r = tweenTabsStyle(a, b, 1);

  it("indicatorOffset equals b.indicatorOffset at t=1", () => {
    expect(r.indicatorOffset).toBeCloseTo(b.indicatorOffset, 10);
  });
});

describe("tweenTabsStyle: t=0.5 midpoint numeric lerp (Account → Settings)", () => {
  const a = tabsStyle("Account", ctx);
  const b = tabsStyle("Settings", ctx);
  const r = tweenTabsStyle(a, b, 0.5);

  it("indicatorOffset midpoint: 0 → 2 gives 1", () => {
    expect(r.indicatorOffset).toBeCloseTo(1, 10);
  });
});

describe("tweenTabsStyle: t=0.5 midpoint numeric lerp (Settings → Account)", () => {
  const a = tabsStyle("Settings", ctx);
  const b = tabsStyle("Account", ctx);
  const r = tweenTabsStyle(a, b, 0.5);

  it("indicatorOffset midpoint: 2 → 0 gives 1", () => {
    expect(r.indicatorOffset).toBeCloseTo(1, 10);
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
