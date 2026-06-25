
import { describe, expect, it } from "bun:test";
import {
  filterCommandItems,
  commandMenuStyle,
  commandMenuStyleContext,
  type CommandMenuState,
  type CommandMenuEntry,
} from "../index";
import {
  tweenCommandMenuStyle,
  DEFAULT_DURATION,
} from "../use-command-menu-transition";
import { commandMenuConfig } from "../config";
import { defaultLightTheme, defaultDarkTheme, easings } from "@/lib/remocn-ui";
import type { Step } from "@/lib/remocn-ui";

const VALID_STATES: readonly CommandMenuState[] = ["opened", "closed"];

const SAMPLE_ITEMS: CommandMenuEntry[] = [
  { icon: "user",     label: "Profile",     shortcut: "⌘ P" },
  { icon: "settings", label: "Settings",    shortcut: "⌘ S" },
  { icon: "file",     label: "New File",    shortcut: "⌘ N" },
  { icon: "search",   label: "Search docs" },
];

const ctx = commandMenuStyleContext(defaultLightTheme);

type SnippetValues = {
  state?: string;
  query?: string;
  revealCount?: number;
  selectedIndex?: number;
  highlightedIndex?: number;
};
const snippet = (values: SnippetValues): string =>
  commandMenuConfig.snippet(values as Record<string, unknown>);

describe("DEFAULT_DURATION", () => {
  it("is 12 frames (container default — longer than item's 8)", () => {
    expect(DEFAULT_DURATION).toBe(12);
  });
});

describe("filterCommandItems: empty visible prefix → all items returned", () => {
  it("returns all items when query is empty string", () => {
    expect(filterCommandItems(SAMPLE_ITEMS, "", undefined)).toHaveLength(4);
  });

  it("returns all items when query is empty and revealCount is undefined", () => {
    const result = filterCommandItems(SAMPLE_ITEMS, "", undefined);
    expect(result).toEqual(SAMPLE_ITEMS);
  });

  it("returns all items when revealCount=0 (visible prefix is empty)", () => {
    expect(filterCommandItems(SAMPLE_ITEMS, "settings", 0)).toHaveLength(4);
  });

  it("returns all items when query is whitespace only", () => {
    expect(filterCommandItems(SAMPLE_ITEMS, "   ", undefined)).toHaveLength(4);
  });

  it("returns empty array when items list is empty", () => {
    expect(filterCommandItems([], "profile", undefined)).toHaveLength(0);
  });
});

describe("filterCommandItems: prefix narrows results", () => {
  it("'profile' matches exactly one item (Profile)", () => {
    const result = filterCommandItems(SAMPLE_ITEMS, "profile", undefined);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Profile");
  });

  it("'se' matches Settings and Search docs (substring in label)", () => {
    const result = filterCommandItems(SAMPLE_ITEMS, "se", undefined);
    expect(result).toHaveLength(2);
    const labels = result.map((i) => i.label);
    expect(labels).toContain("Settings");
    expect(labels).toContain("Search docs");
  });

  it("'file' matches New File (substring in middle of label)", () => {
    const result = filterCommandItems(SAMPLE_ITEMS, "file", undefined);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("New File");
  });

  it("'new' matches New File", () => {
    const result = filterCommandItems(SAMPLE_ITEMS, "new", undefined);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("New File");
  });
});

describe("filterCommandItems: no-match → empty array", () => {
  it("returns empty array when query matches nothing", () => {
    expect(filterCommandItems(SAMPLE_ITEMS, "xyz", undefined)).toHaveLength(0);
  });

  it("returns empty array for a long non-matching query", () => {
    expect(filterCommandItems(SAMPLE_ITEMS, "zzzzzzz", undefined)).toHaveLength(0);
  });
});

describe("filterCommandItems: case-insensitivity", () => {
  it("uppercase query matches lowercase label", () => {
    expect(filterCommandItems(SAMPLE_ITEMS, "PROFILE", undefined)).toHaveLength(1);
  });

  it("mixed case query matches label", () => {
    expect(filterCommandItems(SAMPLE_ITEMS, "SeTtInGs", undefined)).toHaveLength(1);
  });

  it("lowercase query matches mixed-case label ('new file')", () => {
    const result = filterCommandItems(SAMPLE_ITEMS, "new file", undefined);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("New File");
  });
});

describe("filterCommandItems: revealCount slices the query", () => {
  it("revealCount=2 on 'settings' uses only 'se' → 2 matches", () => {
    const result = filterCommandItems(SAMPLE_ITEMS, "settings", 2);
    expect(result).toHaveLength(2);
    const labels = result.map((i) => i.label);
    expect(labels).toContain("Settings");
    expect(labels).toContain("Search docs");
  });

  it("revealCount=8 on 'settings' uses full 'settings' → 1 match", () => {
    const result = filterCommandItems(SAMPLE_ITEMS, "settings", 8);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Settings");
  });

  it("revealCount=1 on 'profile' uses only 'p' → Profile matches", () => {
    const result = filterCommandItems(SAMPLE_ITEMS, "profile", 1);
    const labels = result.map((i) => i.label);
    expect(labels).toContain("Profile");
  });

  it("revealCount > query length uses full query (no index error)", () => {
    const result = filterCommandItems(SAMPLE_ITEMS, "se", 100);
    expect(result).toHaveLength(2);
  });
});

describe("filterCommandItems: result preserves original item objects", () => {
  it("filtered items are the same object references (no cloning)", () => {
    const result = filterCommandItems(SAMPLE_ITEMS, "profile", undefined);
    expect(result[0]).toBe(SAMPLE_ITEMS[0]);
  });
});

describe("commandMenuStyleContext: maps theme tokens correctly", () => {
  it("panelBg equals theme.popover", () => {
    expect(ctx.panelBg).toBe(defaultLightTheme.popover);
  });

  it("panelBorder equals theme.border", () => {
    expect(ctx.panelBorder).toBe(defaultLightTheme.border);
  });

  it("inputFg equals theme.popoverForeground", () => {
    expect(ctx.inputFg).toBe(defaultLightTheme.popoverForeground);
  });

  it("placeholderFg equals theme.mutedForeground", () => {
    expect(ctx.placeholderFg).toBe(defaultLightTheme.mutedForeground);
  });

  it("mutedFg equals theme.mutedForeground", () => {
    expect(ctx.mutedFg).toBe(defaultLightTheme.mutedForeground);
  });

  it("divider equals theme.border", () => {
    expect(ctx.divider).toBe(defaultLightTheme.border);
  });

  it("caret equals theme.foreground", () => {
    expect(ctx.caret).toBe(defaultLightTheme.foreground);
  });

  it("radius equals theme.radius", () => {
    expect(ctx.radius).toBe(defaultLightTheme.radius);
  });
});

describe("commandMenuStyleContext: itemCtx is a nested CommandMenuItemStyleContext", () => {
  it("itemCtx is an object", () => {
    expect(typeof ctx.itemCtx).toBe("object");
    expect(ctx.itemCtx).not.toBeNull();
  });

  it("itemCtx.idleBg equals theme.popover (delegated to commandMenuItemStyleContext)", () => {
    expect(ctx.itemCtx.idleBg).toBe(defaultLightTheme.popover);
  });
});

describe("commandMenuStyleContext: theme independence", () => {
  const ctxDark = commandMenuStyleContext(defaultDarkTheme);

  it("panelBg differs between light and dark themes", () => {
    expect(ctx.panelBg).not.toBe(ctxDark.panelBg);
  });
});

describe("commandMenuStyle: closed state — off-screen keyframe", () => {
  const s = commandMenuStyle("closed", ctx);

  it("backdropOpacity is 0 (backdrop hidden)", () => {
    expect(s.backdropOpacity).toBe(0);
  });

  it("panelOpacity is 0 (panel invisible)", () => {
    expect(s.panelOpacity).toBe(0);
  });

  it("panelScale is 0.96 (slightly shrunken)", () => {
    expect(s.panelScale).toBeCloseTo(0.96, 10);
  });

  it("panelTranslateY is 8 (enters from 8px above rest)", () => {
    expect(s.panelTranslateY).toBe(8);
  });
});

describe("commandMenuStyle: opened state — resting keyframe", () => {
  const s = commandMenuStyle("opened", ctx);

  it("backdropOpacity is 1 (backdrop fully visible)", () => {
    expect(s.backdropOpacity).toBe(1);
  });

  it("panelOpacity is 1 (panel fully visible)", () => {
    expect(s.panelOpacity).toBe(1);
  });

  it("panelScale is 1 (full size)", () => {
    expect(s.panelScale).toBe(1);
  });

  it("panelTranslateY is 0 (at rest position)", () => {
    expect(s.panelTranslateY).toBe(0);
  });
});

describe("commandMenuStyle: closed and opened have distinct values on every field", () => {
  const closed = commandMenuStyle("closed", ctx);
  const opened = commandMenuStyle("opened", ctx);

  it("backdropOpacity: 0 vs 1", () => {
    expect(closed.backdropOpacity).not.toBe(opened.backdropOpacity);
  });

  it("panelOpacity: 0 vs 1", () => {
    expect(closed.panelOpacity).not.toBe(opened.panelOpacity);
  });

  it("panelScale: 0.96 vs 1", () => {
    expect(closed.panelScale).not.toBe(opened.panelScale);
  });

  it("panelTranslateY: 8 vs 0", () => {
    expect(closed.panelTranslateY).not.toBe(opened.panelTranslateY);
  });
});

describe("commandMenuStyle: every state produces complete CommandMenuStyle", () => {
  it("all four fields are numeric for every state", () => {
    for (const state of VALID_STATES) {
      const s = commandMenuStyle(state, ctx);
      expect(typeof s.backdropOpacity).toBe("number");
      expect(typeof s.panelOpacity).toBe("number");
      expect(typeof s.panelScale).toBe("number");
      expect(typeof s.panelTranslateY).toBe("number");
    }
  });
});

describe("tweenCommandMenuStyle: t=0 returns values equal to `a`", () => {
  const a = commandMenuStyle("closed", ctx);
  const b = commandMenuStyle("opened", ctx);
  const r = tweenCommandMenuStyle(a, b, 0);

  it("backdropOpacity equals a.backdropOpacity at t=0", () => {
    expect(r.backdropOpacity).toBeCloseTo(a.backdropOpacity, 10);
  });

  it("panelOpacity equals a.panelOpacity at t=0", () => {
    expect(r.panelOpacity).toBeCloseTo(a.panelOpacity, 10);
  });

  it("panelScale equals a.panelScale at t=0", () => {
    expect(r.panelScale).toBeCloseTo(a.panelScale, 10);
  });

  it("panelTranslateY equals a.panelTranslateY at t=0", () => {
    expect(r.panelTranslateY).toBeCloseTo(a.panelTranslateY, 10);
  });
});

describe("tweenCommandMenuStyle: t=1 returns values equal to `b`", () => {
  const a = commandMenuStyle("closed", ctx);
  const b = commandMenuStyle("opened", ctx);
  const r = tweenCommandMenuStyle(a, b, 1);

  it("backdropOpacity equals b.backdropOpacity at t=1", () => {
    expect(r.backdropOpacity).toBeCloseTo(b.backdropOpacity, 10);
  });

  it("panelOpacity equals b.panelOpacity at t=1", () => {
    expect(r.panelOpacity).toBeCloseTo(b.panelOpacity, 10);
  });

  it("panelScale equals b.panelScale at t=1", () => {
    expect(r.panelScale).toBeCloseTo(b.panelScale, 10);
  });

  it("panelTranslateY equals b.panelTranslateY at t=1", () => {
    expect(r.panelTranslateY).toBeCloseTo(b.panelTranslateY, 10);
  });
});

describe("tweenCommandMenuStyle: t=0.5 midpoint (closed → opened)", () => {
  const a = commandMenuStyle("closed", ctx);
  const b = commandMenuStyle("opened", ctx);
  const r = tweenCommandMenuStyle(a, b, 0.5);

  it("backdropOpacity midpoint: 0 → 1 gives 0.5", () => {
    expect(r.backdropOpacity).toBeCloseTo(0.5, 10);
  });

  it("panelOpacity midpoint: 0 → 1 gives 0.5", () => {
    expect(r.panelOpacity).toBeCloseTo(0.5, 10);
  });

  it("panelScale midpoint: 0.96 → 1 gives 0.98", () => {
    expect(r.panelScale).toBeCloseTo(0.98, 10);
  });

  it("panelTranslateY midpoint: 8 → 0 gives 4", () => {
    expect(r.panelTranslateY).toBeCloseTo(4, 10);
  });
});

describe("tweenCommandMenuStyle: t=0.25 quarter-point (closed → opened)", () => {
  const a = commandMenuStyle("closed", ctx);
  const b = commandMenuStyle("opened", ctx);
  const r = tweenCommandMenuStyle(a, b, 0.25);

  it("backdropOpacity at t=0.25 is 0.25", () => {
    expect(r.backdropOpacity).toBeCloseTo(0.25, 10);
  });

  it("panelOpacity at t=0.25 is 0.25", () => {
    expect(r.panelOpacity).toBeCloseTo(0.25, 10);
  });

  it("panelScale at t=0.25 is 0.97", () => {
    expect(r.panelScale).toBeCloseTo(0.97, 10);
  });

  it("panelTranslateY at t=0.25 is 6", () => {
    expect(r.panelTranslateY).toBeCloseTo(6, 10);
  });
});

describe("tweenCommandMenuStyle: identity (a === b)", () => {
  const s = commandMenuStyle("opened", ctx);

  it("all fields unchanged when both endpoints are identical", () => {
    const r = tweenCommandMenuStyle(s, s, 0.5);
    expect(r.backdropOpacity).toBeCloseTo(s.backdropOpacity, 10);
    expect(r.panelOpacity).toBeCloseTo(s.panelOpacity, 10);
    expect(r.panelScale).toBeCloseTo(s.panelScale, 10);
    expect(r.panelTranslateY).toBeCloseTo(s.panelTranslateY, 10);
  });
});

describe("tweenCommandMenuStyle: reverse direction (opened → closed)", () => {
  const a = commandMenuStyle("opened", ctx);
  const b = commandMenuStyle("closed", ctx);
  const r = tweenCommandMenuStyle(a, b, 0.5);

  it("backdropOpacity midpoint: 1 → 0 gives 0.5", () => {
    expect(r.backdropOpacity).toBeCloseTo(0.5, 10);
  });

  it("panelTranslateY midpoint: 0 → 8 gives 4", () => {
    expect(r.panelTranslateY).toBeCloseTo(4, 10);
  });
});

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

function resolveStateTransition<S extends string>(
  raw: number,
  steps: Step<S>[],
  defaultState: S,
  speed = 1,
  defaultDuration = 8,
): { from: S; to: S; progress: number } {
  const effectiveFrame = raw * speed;
  const started = steps
    .map((step, index) => ({ step, index }))
    .sort((a, b) => a.step.at - b.step.at || a.index - b.index)
    .filter((e) => e.step.at <= effectiveFrame);
  if (started.length === 0)
    return { from: defaultState, to: defaultState, progress: 1 };
  const to = started[started.length - 1].step;
  const from = started.length >= 2 ? started[started.length - 2].step : null;
  const dur = to.duration ?? defaultDuration;
  const progress = dur > 0 ? clamp01((effectiveFrame - to.at) / dur) : 1;
  return { from: from ? from.state : defaultState, to: to.state, progress };
}

function resolveCommandMenuTransition(
  raw: number,                                         // injected useCurrentFrame() — MIRROR line 61
  steps: Step<CommandMenuState>[],
  speed = 1,
  defaultDuration = DEFAULT_DURATION,
): ReturnType<typeof tweenCommandMenuStyle> & { from: CommandMenuState; to: CommandMenuState; progress: number } {
  const { from, to, progress } = resolveStateTransition(
    raw,
    steps,
    "closed",
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);
  const style = tweenCommandMenuStyle(
    commandMenuStyle(from as CommandMenuState, ctx),
    commandMenuStyle(to as CommandMenuState, ctx),
    t,
  );
  return { ...style, from: from as CommandMenuState, to: to as CommandMenuState, progress };
}

describe("resolveCommandMenuTransition: before any step — holds at closed", () => {
  it("returns the closed style when no steps have started", () => {
    const r = resolveCommandMenuTransition(0, []);
    const closed = commandMenuStyle("closed", ctx);
    expect(r.backdropOpacity).toBeCloseTo(closed.backdropOpacity, 10);
    expect(r.panelOpacity).toBeCloseTo(closed.panelOpacity, 10);
    expect(r.panelScale).toBeCloseTo(closed.panelScale, 10);
    expect(r.panelTranslateY).toBeCloseTo(closed.panelTranslateY, 10);
  });

  it("from and to are both 'closed' before any step", () => {
    const { from, to } = resolveCommandMenuTransition(0, []);
    expect(from).toBe("closed");
    expect(to).toBe("closed");
  });
});

describe("resolveCommandMenuTransition: exactly at closed→opened step boundary", () => {
  const steps: Step<CommandMenuState>[] = [{ at: 10, state: "opened" }];

  it("at raw=10, progress=0, t=out(0)=0 → style equals closed (from)", () => {
    const r = resolveCommandMenuTransition(10, steps);
    const closed = commandMenuStyle("closed", ctx);
    expect(r.progress).toBe(0);
    expect(r.backdropOpacity).toBeCloseTo(closed.backdropOpacity, 10);
    expect(r.panelOpacity).toBeCloseTo(closed.panelOpacity, 10);
  });

  it("from='closed', to='opened' at the step boundary", () => {
    const { from, to } = resolveCommandMenuTransition(10, steps);
    expect(from).toBe("closed");
    expect(to).toBe("opened");
  });
});

describe("resolveCommandMenuTransition: mid-window uses easings.out (not linear)", () => {
  const steps: Step<CommandMenuState>[] = [{ at: 0, state: "opened" }];

  it("backdropOpacity at raw=6 is out(0.5) ≈ 0.875 (not linear 0.5)", () => {
    const r = resolveCommandMenuTransition(6, steps, 1, 12);
    const t = easings.out(0.5);
    expect(r.backdropOpacity).toBeCloseTo(t, 8);
  });

  it("panelTranslateY at raw=6 is 8*(1-out(0.5)): 8*0.125=1", () => {
    const r = resolveCommandMenuTransition(6, steps, 1, 12);
    const t = easings.out(0.5);
    const expected = 8 * (1 - t);
    expect(r.panelTranslateY).toBeCloseTo(expected, 8);
  });

  it("panelScale at raw=6 is 0.96 + (1-0.96)*out(0.5)", () => {
    const r = resolveCommandMenuTransition(6, steps, 1, 12);
    const t = easings.out(0.5);
    const expected = 0.96 + (1 - 0.96) * t;
    expect(r.panelScale).toBeCloseTo(expected, 8);
  });
});

describe("resolveCommandMenuTransition: past the window → fully opened", () => {
  const steps: Step<CommandMenuState>[] = [{ at: 0, state: "opened" }];

  it("backdropOpacity is 1 after DEFAULT_DURATION frames", () => {
    expect(resolveCommandMenuTransition(DEFAULT_DURATION, steps).backdropOpacity).toBeCloseTo(1, 10);
  });

  it("panelOpacity is 1 after DEFAULT_DURATION frames", () => {
    expect(resolveCommandMenuTransition(DEFAULT_DURATION, steps).panelOpacity).toBeCloseTo(1, 10);
  });

  it("panelScale is 1 after DEFAULT_DURATION frames", () => {
    expect(resolveCommandMenuTransition(DEFAULT_DURATION, steps).panelScale).toBeCloseTo(1, 10);
  });

  it("panelTranslateY is 0 after DEFAULT_DURATION frames", () => {
    expect(resolveCommandMenuTransition(DEFAULT_DURATION, steps).panelTranslateY).toBeCloseTo(0, 10);
  });
});

describe("resolveCommandMenuTransition: speed contract", () => {
  const steps: Step<CommandMenuState>[] = [{ at: 12, state: "opened" }];

  it("speed=2: step at=12 fires at raw=6 (eff=12)", () => {
    expect(resolveCommandMenuTransition(6, steps, 2).to).toBe("opened");
  });

  it("speed=2: step at=12 has NOT fired at raw=5 (eff=10 < 12)", () => {
    expect(resolveCommandMenuTransition(5, steps, 2).to).toBe("closed");
  });
});

describe("commandMenuConfig.controls: state", () => {
  it("state is a select control", () => {
    expect(commandMenuConfig.controls.state.type).toBe("select");
  });

  it("state options are ['opened','closed']", () => {
    const ctrl = commandMenuConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    expect(ctrl.options).toEqual(["opened", "closed"]);
  });

  it("state default is 'opened'", () => {
    expect(commandMenuConfig.controls.state.default).toBe("opened");
  });

  it("every state option is a valid CommandMenuState", () => {
    const ctrl = commandMenuConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    for (const opt of ctrl.options) {
      expect(VALID_STATES).toContain(opt as CommandMenuState);
    }
  });
});

describe("commandMenuConfig.controls: query", () => {
  it("query is a text control", () => {
    expect(commandMenuConfig.controls.query.type).toBe("text");
  });

  it("query default is empty string", () => {
    expect(commandMenuConfig.controls.query.default).toBe("");
  });
});

describe("commandMenuConfig.controls: revealCount", () => {
  it("revealCount is a number control", () => {
    expect(commandMenuConfig.controls.revealCount.type).toBe("number");
  });

  it("revealCount default is 0", () => {
    expect(commandMenuConfig.controls.revealCount.default).toBe(0);
  });

  it("revealCount min is 0", () => {
    const ctrl = commandMenuConfig.controls.revealCount;
    if (ctrl.type !== "number") throw new Error("expected number");
    expect(ctrl.min).toBe(0);
  });
});

describe("commandMenuConfig.controls: selectedIndex and highlightedIndex", () => {
  it("selectedIndex is a number control with default -1", () => {
    expect(commandMenuConfig.controls.selectedIndex.type).toBe("number");
    expect(commandMenuConfig.controls.selectedIndex.default).toBe(-1);
  });

  it("highlightedIndex is a number control with default 0", () => {
    expect(commandMenuConfig.controls.highlightedIndex.type).toBe("number");
    expect(commandMenuConfig.controls.highlightedIndex.default).toBe(0);
  });
});

describe("commandMenuConfig.snippet: import line", () => {
  it("includes 'import { CommandMenu }' from the correct path", () => {
    const out = snippet({ state: "opened" });
    expect(out).toContain("import { CommandMenu }");
    expect(out).toContain('from "@/components/remocn/command-menu"');
  });
});

describe("commandMenuConfig.snippet: structural invariants", () => {
  it("contains a <CommandMenu JSX element", () => {
    expect(snippet({ state: "opened" })).toContain("<CommandMenu");
  });

  it("ends with a self-closing />", () => {
    expect(snippet({ state: "opened" }).trimEnd().endsWith("/>")).toBe(true);
  });

  it("state is always emitted", () => {
    for (const state of VALID_STATES) {
      expect(snippet({ state })).toContain(`state="${state}"`);
    }
  });
});

describe("commandMenuConfig.snippet: default props are omitted", () => {
  it("omits query when it is empty string (the default)", () => {
    expect(snippet({ state: "opened", query: "" })).not.toContain("query=");
  });

  it("omits revealCount when it equals 0 (default)", () => {
    expect(snippet({ state: "opened", revealCount: 0 })).not.toContain("revealCount=");
  });

  it("omits selectedIndex when it equals -1 (default)", () => {
    expect(snippet({ state: "opened", selectedIndex: -1 })).not.toContain("selectedIndex=");
  });

  it("omits highlightedIndex when it equals -1 (no highlight)", () => {
    expect(snippet({ state: "opened", highlightedIndex: -1 })).not.toContain("highlightedIndex=");
  });

});

describe("commandMenuConfig.snippet: non-default props are emitted", () => {
  it("emits query when non-empty", () => {
    expect(snippet({ state: "opened", query: "settings" })).toContain('query="settings"');
  });

  it("emits revealCount when non-zero", () => {
    expect(snippet({ state: "opened", revealCount: 3 })).toContain("revealCount={3}");
  });

  it("emits selectedIndex when not -1", () => {
    expect(snippet({ state: "opened", selectedIndex: 1 })).toContain("selectedIndex={1}");
  });

  it("emits highlightedIndex when not -1", () => {
    expect(snippet({ state: "opened", highlightedIndex: 0 })).toContain("highlightedIndex={0}");
  });

});

describe("commandMenuConfig.snippet: state options round-trip", () => {
  it("emits the correct state for every control option", () => {
    const ctrl = commandMenuConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    for (const state of ctrl.options) {
      expect(snippet({ state })).toContain(`state="${state}"`);
    }
  });
});
