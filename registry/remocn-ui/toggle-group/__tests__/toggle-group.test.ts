
import { describe, expect, it } from "bun:test";
import {
  type ToggleGroupState,
  type ToggleGroupItem,
  toggleGroupStyle,
  toggleGroupStyleContext,
} from "../index";
import {
  tweenToggleGroupStyle,
  DEFAULT_DURATION,
} from "../use-toggle-group-transition";
import { toggleGroupConfig } from "../config";
import { defaultLightTheme } from "@/lib/remocn-ui";

const DEFAULT_ITEMS: ToggleGroupItem[] = [
  { value: "Monthly", label: "Monthly" },
  { value: "Yearly", label: "Yearly" },
];

type SnippetValues = {
  state?: string;
  size?: string;
};

const snippet = (values: SnippetValues): string =>
  toggleGroupConfig.snippet(values as Record<string, unknown>);

const ctx = toggleGroupStyleContext(DEFAULT_ITEMS, defaultLightTheme);

describe("DEFAULT_DURATION", () => {
  it("is a positive number", () => {
    expect(typeof DEFAULT_DURATION).toBe("number");
    expect(DEFAULT_DURATION).toBeGreaterThan(0);
  });

  it("equals 14 (the authored value)", () => {
    expect(DEFAULT_DURATION).toBe(14);
  });
});

describe("toggleGroupStyleContext: token mapping (light theme)", () => {
  it("trackBg equals theme.muted", () => {
    expect(ctx.trackBg).toBe(defaultLightTheme.muted);
  });

  it("thumbBg equals theme.background", () => {
    expect(ctx.thumbBg).toBe(defaultLightTheme.background);
  });

  it("activeFg equals theme.foreground", () => {
    expect(ctx.activeFg).toBe(defaultLightTheme.foreground);
  });

  it("inactiveFg equals theme.mutedForeground", () => {
    expect(ctx.inactiveFg).toBe(defaultLightTheme.mutedForeground);
  });

  it("radius equals theme.radius", () => {
    expect(ctx.radius).toBe(defaultLightTheme.radius);
  });
});

describe("toggleGroupStyleContext: items round-trip", () => {
  it("ctx.items is the same array reference passed in", () => {
    expect(ctx.items).toBe(DEFAULT_ITEMS);
  });

  it("ctx.items has the expected length", () => {
    expect(ctx.items).toHaveLength(2);
  });

  it("ctx.items[0].value is 'Monthly'", () => {
    expect(ctx.items[0].value).toBe("Monthly");
  });

  it("ctx.items[1].value is 'Yearly'", () => {
    expect(ctx.items[1].value).toBe("Yearly");
  });
});

describe("toggleGroupStyleContext: light and dark produce independent token sets", () => {
  it("a dark-mode theme produces a different trackBg than the light theme", () => {
    const darkTheme = {
      ...defaultLightTheme,
      muted: "hsl(217 33% 17%)",
      background: "hsl(222 47% 11%)",
      foreground: "hsl(213 31% 91%)",
      mutedForeground: "hsl(215 20% 65%)",
    };
    const darkCtx = toggleGroupStyleContext(DEFAULT_ITEMS, darkTheme);
    expect(darkCtx.trackBg).not.toBe(ctx.trackBg);
  });
});

describe("toggleGroupStyle: Monthly state", () => {
  it("indicatorOffset is 0 (first item, index 0)", () => {
    expect(toggleGroupStyle("Monthly", ctx).indicatorOffset).toBe(0);
  });
});

describe("toggleGroupStyle: Yearly state", () => {
  it("indicatorOffset is 1 (second item, index 1)", () => {
    expect(toggleGroupStyle("Yearly", ctx).indicatorOffset).toBe(1);
  });
});

describe("toggleGroupStyle: unknown state", () => {
  it("returns indicatorOffset 0 as the safe fallback for an unknown state", () => {
    expect(toggleGroupStyle("Unknown", ctx).indicatorOffset).toBe(0);
  });

  it("returns indicatorOffset 0 for an empty-string state", () => {
    expect(toggleGroupStyle("", ctx).indicatorOffset).toBe(0);
  });
});

describe("toggleGroupStyle: each default item maps to its own index", () => {
  const items: ToggleGroupItem[] = [
    { value: "Monthly", label: "Monthly" },
    { value: "Yearly", label: "Yearly" },
  ];
  const twoCtx = toggleGroupStyleContext(items, defaultLightTheme);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    it(`${item.value} → indicatorOffset ${i}`, () => {
      expect(toggleGroupStyle(item.value, twoCtx).indicatorOffset).toBe(i);
    });
  }
});

describe("toggleGroupStyle: 3-item list index round-trip", () => {
  const threeItems: ToggleGroupItem[] = [
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" },
  ];
  const threeCtx = toggleGroupStyleContext(threeItems, defaultLightTheme);

  it("A → indicatorOffset 0", () => {
    expect(toggleGroupStyle("A", threeCtx).indicatorOffset).toBe(0);
  });

  it("B → indicatorOffset 1", () => {
    expect(toggleGroupStyle("B", threeCtx).indicatorOffset).toBe(1);
  });

  it("C → indicatorOffset 2", () => {
    expect(toggleGroupStyle("C", threeCtx).indicatorOffset).toBe(2);
  });

  it("unknown state returns 0 in a 3-item context", () => {
    expect(toggleGroupStyle("D", threeCtx).indicatorOffset).toBe(0);
  });
});

describe("tweenToggleGroupStyle: t=0 returns values equal to a", () => {
  const a = toggleGroupStyle("Monthly", ctx);
  const b = toggleGroupStyle("Yearly", ctx);
  const r = tweenToggleGroupStyle(a, b, 0);

  it("indicatorOffset equals a.indicatorOffset at t=0", () => {
    expect(r.indicatorOffset).toBeCloseTo(0, 10);
  });
});

describe("tweenToggleGroupStyle: t=1 returns values equal to b", () => {
  const a = toggleGroupStyle("Monthly", ctx);
  const b = toggleGroupStyle("Yearly", ctx);
  const r = tweenToggleGroupStyle(a, b, 1);

  it("indicatorOffset equals b.indicatorOffset at t=1", () => {
    expect(r.indicatorOffset).toBeCloseTo(1, 10);
  });
});

describe("tweenToggleGroupStyle: t=0.5 midpoint (Monthly → Yearly)", () => {
  const a = toggleGroupStyle("Monthly", ctx);
  const b = toggleGroupStyle("Yearly", ctx);
  const r = tweenToggleGroupStyle(a, b, 0.5);

  it("indicatorOffset midpoint: 0 → 1 gives 0.5", () => {
    expect(r.indicatorOffset).toBeCloseTo(0.5, 10);
  });
});

describe("tweenToggleGroupStyle: t=0.5 midpoint (Yearly → Monthly, reverse)", () => {
  const a = toggleGroupStyle("Yearly", ctx);
  const b = toggleGroupStyle("Monthly", ctx);
  const r = tweenToggleGroupStyle(a, b, 0.5);

  it("indicatorOffset midpoint: 1 → 0 gives 0.5", () => {
    expect(r.indicatorOffset).toBeCloseTo(0.5, 10);
  });
});

describe("tweenToggleGroupStyle: identity (a === b)", () => {
  const a = toggleGroupStyle("Monthly", ctx);
  const r = tweenToggleGroupStyle(a, a, 0.5);

  it("indicatorOffset is unchanged when tweening a style to itself", () => {
    expect(r.indicatorOffset).toBeCloseTo(a.indicatorOffset, 10);
  });
});

describe("tweenToggleGroupStyle: t=0.25 quarter-way", () => {
  const a = toggleGroupStyle("Monthly", ctx);
  const b = toggleGroupStyle("Yearly", ctx);
  const r = tweenToggleGroupStyle(a, b, 0.25);

  it("indicatorOffset quarter-way: 0 → 1 gives 0.25", () => {
    expect(r.indicatorOffset).toBeCloseTo(0.25, 10);
  });
});

function resolveToggleGroupTransition(
  steps: Array<{ from: number; state: ToggleGroupState; duration?: number }>,
  frame: number, // injected as `raw` — mirrors useCurrentFrame() in the real hook
  items: ToggleGroupItem[] = DEFAULT_ITEMS,
  speed: number = 1,
  defaultDuration: number = DEFAULT_DURATION,
) {
  const localCtx = toggleGroupStyleContext(items, defaultLightTheme);
  const defaultState: ToggleGroupState = items[0].value;

  let from: ToggleGroupState = defaultState;
  let to: ToggleGroupState = defaultState;
  let progress = 0;

  for (let si = 0; si < steps.length; si++) {
    const step = steps[si];
    const stepStart = step.from;
    const stepDuration = (step.duration ?? defaultDuration) / speed;
    const stepEnd = stepStart + stepDuration;
    const next = steps[si + 1];

    if (frame < stepStart) {
      break;
    }

    if (frame >= stepStart) {
      from = step.state;
      to = next?.state ?? step.state;

      if (frame >= stepEnd || !next) {
        from = next?.state ?? step.state;
        to = from;
        progress = 0;
      } else {
        progress = (frame - stepStart) / stepDuration;
      }
    }
  }

  const t = 1 - (1 - progress) ** 3;
  return tweenToggleGroupStyle(
    toggleGroupStyle(from, localCtx),
    toggleGroupStyle(to, localCtx),
    t,
  );
}

describe("resolveToggleGroupTransition: before first step", () => {
  const steps = [{ from: 10, state: "Yearly" as ToggleGroupState }];
  const r = resolveToggleGroupTransition(steps, 0);

  it("holds at Monthly (indicatorOffset=0) before first step fires", () => {
    expect(r.indicatorOffset).toBeCloseTo(0, 10);
  });
});

describe("resolveToggleGroupTransition: at boundary (progress=0, t=0)", () => {
  const steps = [{ from: 10, state: "Yearly" as ToggleGroupState, duration: 14 }];
  const r = resolveToggleGroupTransition(steps, 10);

  it("indicatorOffset is 0 at the step boundary (progress=0, eased=0)", () => {
    expect(r.indicatorOffset).toBeCloseTo(0, 5);
  });
});

describe("resolveToggleGroupTransition: mid-window eased (frame 7 of 14)", () => {
  const steps = [
    { from: 0, state: "Monthly" as ToggleGroupState, duration: 14 },
    { from: 14, state: "Yearly" as ToggleGroupState },
  ];
  const r = resolveToggleGroupTransition(steps, 7);

  it("indicatorOffset at frame 7 is 0.875 (cubic ease-out applied)", () => {
    expect(r.indicatorOffset).toBeCloseTo(0.875, 5);
  });
});

describe("resolveToggleGroupTransition: past window snaps to target state", () => {
  const steps = [
    { from: 0, state: "Monthly" as ToggleGroupState, duration: 14 },
    { from: 14, state: "Yearly" as ToggleGroupState },
  ];
  const r = resolveToggleGroupTransition(steps, 30);

  it("indicatorOffset is 1 (Yearly) after transition completes", () => {
    expect(r.indicatorOffset).toBeCloseTo(1, 5);
  });
});

describe("resolveToggleGroupTransition: speed contract", () => {
  const steps = [
    { from: 0, state: "Monthly" as ToggleGroupState, duration: 14 },
    { from: 7, state: "Yearly" as ToggleGroupState },
  ];
  const r = resolveToggleGroupTransition(steps, 3, /* items */ DEFAULT_ITEMS, /* speed */ 2);

  it("speed=2 accelerates transition: indicatorOffset is closer to 1 at frame 3", () => {
    expect(r.indicatorOffset).toBeGreaterThan(0.6);
  });
});

describe("toggleGroupConfig.controls.state", () => {
  it("is a select control", () => {
    expect(toggleGroupConfig.controls.state.type).toBe("select");
  });

  it("defaults to 'Monthly' so the preview opens on the first segment", () => {
    expect(toggleGroupConfig.controls.state.default).toBe("Monthly");
  });

  it("has exactly the two documented state options in order", () => {
    const control = toggleGroupConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    expect(control.options).toEqual(["Monthly", "Yearly"]);
  });
});

describe("toggleGroupConfig.controls.size", () => {
  it("is a select control", () => {
    expect(toggleGroupConfig.controls.size.type).toBe("select");
  });

  it("defaults to 'default'", () => {
    expect(toggleGroupConfig.controls.size.default).toBe("default");
  });

  it("has exactly the two size options in order", () => {
    const control = toggleGroupConfig.controls.size;
    if (control.type !== "select") throw new Error("size control must be a select");
    expect(control.options).toEqual(["default", "sm"]);
  });
});

describe("toggleGroupConfig.snippet: import line", () => {
  it("includes `import { ToggleGroup }` from the correct path", () => {
    const out = snippet({ state: "Monthly" });
    expect(out).toContain("import { ToggleGroup }");
    expect(out).toContain('from "@/components/remocn/toggle-group"');
  });
});

describe("toggleGroupConfig.snippet: state prop always emitted", () => {
  it("emits state=\"Monthly\" for the Monthly option", () => {
    expect(snippet({ state: "Monthly" })).toContain('state="Monthly"');
  });

  it("emits state=\"Yearly\" for the Yearly option", () => {
    expect(snippet({ state: "Yearly" })).toContain('state="Yearly"');
  });

  it("emits the correct state for every control option", () => {
    const control = toggleGroupConfig.controls.state;
    if (control.type !== "select") throw new Error("state control must be a select");
    for (const state of control.options) {
      expect(snippet({ state })).toContain(`state="${state}"`);
    }
  });
});

describe("toggleGroupConfig.snippet: items inline literal always emitted", () => {
  it("always emits the items JSX array regardless of state", () => {
    for (const state of ["Monthly", "Yearly"]) {
      const out = snippet({ state });
      expect(out).toContain("items={[");
      expect(out).toContain('{ value: "Monthly", label: "Monthly" }');
      expect(out).toContain('{ value: "Yearly", label: "Yearly" }');
    }
  });

  it("emits items even when all defaults are set", () => {
    const out = snippet({ state: "Monthly", size: "default" });
    expect(out).toContain("items={[");
  });
});

describe("toggleGroupConfig.snippet: default props are omitted", () => {
  const allDefaults = snippet({ state: "Monthly", size: "default" });

  it("omits size when it equals the default 'default'", () => {
    expect(allDefaults).not.toContain("size=");
  });
});

describe("toggleGroupConfig.snippet: non-default props are emitted", () => {
  it("emits size=\"sm\" when size is non-default", () => {
    expect(snippet({ state: "Monthly", size: "sm" })).toContain('size="sm"');
  });

  it("emits size when non-default alongside a non-default state", () => {
    const out = snippet({ state: "Yearly", size: "sm" });
    expect(out).toContain('size="sm"');
  });
});

describe("toggleGroupConfig.snippet: structural round-trip", () => {
  const out = snippet({ state: "Monthly" });

  it("starts with the import line", () => {
    expect(out.startsWith("import { ToggleGroup }")).toBe(true);
  });

  it("contains a <ToggleGroup JSX opening", () => {
    expect(out).toContain("<ToggleGroup");
  });

  it("ends with a self-closing />", () => {
    expect(out.trimEnd().endsWith("/>")).toBe(true);
  });
});
