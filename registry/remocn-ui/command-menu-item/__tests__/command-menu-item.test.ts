
import { describe, expect, it } from "bun:test";
import {
  commandMenuItemStyle,
  commandMenuItemStyleContext,
  type CommandMenuItemState,
} from "../index";
import {
  tweenCommandMenuItemStyle,
  DEFAULT_DURATION,
} from "../use-command-menu-item-transition";
import { commandMenuItemConfig } from "../config";
import { defaultLightTheme, defaultDarkTheme } from "@/lib/remocn-ui";

const VALID_STATES: readonly CommandMenuItemState[] = [
  "idle",
  "hover",
  "press",
  "selected",
];

const ctx = commandMenuItemStyleContext(defaultLightTheme);

type SnippetValues = {
  state?: string;
  label?: string;
  icon?: string;
  shortcut?: string;
  mode?: string;
};
const snippet = (values: SnippetValues): string =>
  commandMenuItemConfig.snippet(values as Record<string, unknown>);

describe("DEFAULT_DURATION", () => {
  it("is 8 frames (item default — shorter than container's 12)", () => {
    expect(DEFAULT_DURATION).toBe(8);
  });
});

describe("commandMenuItemStyleContext: maps theme tokens correctly", () => {
  it("idleBg equals theme.popover", () => {
    expect(ctx.idleBg).toBe(defaultLightTheme.popover);
  });

  it("hoverBg equals theme.accent", () => {
    expect(ctx.hoverBg).toBe(defaultLightTheme.accent);
  });

  it("selectedBg equals theme.accent", () => {
    expect(ctx.selectedBg).toBe(defaultLightTheme.accent);
  });

  it("idleFg equals theme.popoverForeground", () => {
    expect(ctx.idleFg).toBe(defaultLightTheme.popoverForeground);
  });

  it("selectedFg equals theme.accentForeground", () => {
    expect(ctx.selectedFg).toBe(defaultLightTheme.accentForeground);
  });

  it("idleIcon equals theme.mutedForeground", () => {
    expect(ctx.idleIcon).toBe(defaultLightTheme.mutedForeground);
  });

  it("selectedIcon equals theme.foreground", () => {
    expect(ctx.selectedIcon).toBe(defaultLightTheme.foreground);
  });

  it("kbdBg equals theme.muted", () => {
    expect(ctx.kbdBg).toBe(defaultLightTheme.muted);
  });

  it("kbdFg equals theme.mutedForeground", () => {
    expect(ctx.kbdFg).toBe(defaultLightTheme.mutedForeground);
  });

  it("kbdBorder equals theme.border", () => {
    expect(ctx.kbdBorder).toBe(defaultLightTheme.border);
  });
});

describe("commandMenuItemStyleContext: pressBg is a derived (non-empty) color string", () => {
  it("pressBg is a non-empty string", () => {
    expect(typeof ctx.pressBg).toBe("string");
    expect(ctx.pressBg.length).toBeGreaterThan(0);
  });

  it("pressBg differs from hoverBg (mixOklch adds a tint)", () => {
    expect(ctx.pressBg).not.toBe(ctx.hoverBg);
  });
});

describe("commandMenuItemStyleContext: all fields are non-empty strings", () => {
  it("every field is a non-empty string", () => {
    for (const [key, value] of Object.entries(ctx)) {
      expect(typeof value).toBe("string");
      expect((value as string).length).toBeGreaterThan(0);
    }
  });
});

describe("commandMenuItemStyleContext: theme independence — different themes produce different values", () => {
  const ctxDark = commandMenuItemStyleContext(defaultDarkTheme);

  it("idleBg differs between light and dark themes", () => {
    expect(ctx.idleBg).not.toBe(ctxDark.idleBg);
  });

  it("idleIcon differs between light and dark themes", () => {
    expect(ctx.idleIcon).not.toBe(ctxDark.idleIcon);
  });
});

describe("commandMenuItemStyle: idle state", () => {
  const s = commandMenuItemStyle("idle", ctx);

  it("background is ctx.idleBg", () => {
    expect(s.background).toBe(ctx.idleBg);
  });

  it("labelColor is ctx.idleFg", () => {
    expect(s.labelColor).toBe(ctx.idleFg);
  });

  it("iconColor is ctx.idleIcon", () => {
    expect(s.iconColor).toBe(ctx.idleIcon);
  });

  it("scale is 1 (full size, at rest)", () => {
    expect(s.scale).toBe(1);
  });
});

describe("commandMenuItemStyle: hover state", () => {
  const s = commandMenuItemStyle("hover", ctx);

  it("background is ctx.hoverBg", () => {
    expect(s.background).toBe(ctx.hoverBg);
  });

  it("labelColor is ctx.idleFg", () => {
    expect(s.labelColor).toBe(ctx.idleFg);
  });

  it("iconColor is ctx.selectedIcon (icon brightens on hover)", () => {
    expect(s.iconColor).toBe(ctx.selectedIcon);
  });

  it("scale is 1", () => {
    expect(s.scale).toBe(1);
  });
});

describe("commandMenuItemStyle: press state", () => {
  const s = commandMenuItemStyle("press", ctx);

  it("background is ctx.pressBg", () => {
    expect(s.background).toBe(ctx.pressBg);
  });

  it("labelColor is ctx.idleFg", () => {
    expect(s.labelColor).toBe(ctx.idleFg);
  });

  it("iconColor is ctx.selectedIcon", () => {
    expect(s.iconColor).toBe(ctx.selectedIcon);
  });

  it("scale is 0.98 (slight shrink on press)", () => {
    expect(s.scale).toBeCloseTo(0.98, 10);
  });
});

describe("commandMenuItemStyle: selected state", () => {
  const s = commandMenuItemStyle("selected", ctx);

  it("background is ctx.selectedBg", () => {
    expect(s.background).toBe(ctx.selectedBg);
  });

  it("labelColor is ctx.selectedFg", () => {
    expect(s.labelColor).toBe(ctx.selectedFg);
  });

  it("iconColor is ctx.selectedIcon", () => {
    expect(s.iconColor).toBe(ctx.selectedIcon);
  });

  it("scale is 1 (full size when selected)", () => {
    expect(s.scale).toBe(1);
  });
});

describe("commandMenuItemStyle: scale invariants across all states", () => {
  it("idle: scale=1", () => {
    expect(commandMenuItemStyle("idle", ctx).scale).toBe(1);
  });

  it("hover: scale=1", () => {
    expect(commandMenuItemStyle("hover", ctx).scale).toBe(1);
  });

  it("press: scale=0.98", () => {
    expect(commandMenuItemStyle("press", ctx).scale).toBeCloseTo(0.98, 10);
  });

  it("selected: scale=1", () => {
    expect(commandMenuItemStyle("selected", ctx).scale).toBe(1);
  });

  it("only press has scale < 1", () => {
    for (const state of VALID_STATES) {
      const s = commandMenuItemStyle(state, ctx);
      if (state === "press") {
        expect(s.scale).toBeLessThan(1);
      } else {
        expect(s.scale).toBe(1);
      }
    }
  });
});

describe("commandMenuItemStyle: every state produces complete CommandMenuItemStyle", () => {
  it("all fields are defined for every state", () => {
    for (const state of VALID_STATES) {
      const s = commandMenuItemStyle(state, ctx);
      expect(typeof s.background).toBe("string");
      expect(s.background.length).toBeGreaterThan(0);
      expect(typeof s.labelColor).toBe("string");
      expect(s.labelColor.length).toBeGreaterThan(0);
      expect(typeof s.iconColor).toBe("string");
      expect(s.iconColor.length).toBeGreaterThan(0);
      expect(typeof s.scale).toBe("number");
    }
  });
});

describe("tweenCommandMenuItemStyle: t=0 returns values equal to `a`", () => {
  const a = commandMenuItemStyle("idle", ctx);
  const b = commandMenuItemStyle("selected", ctx);
  const r = tweenCommandMenuItemStyle(a, b, 0);

  it("scale equals a.scale at t=0", () => {
    expect(r.scale).toBeCloseTo(a.scale, 10);
  });

  it("background is a non-empty string at t=0", () => {
    expect(typeof r.background).toBe("string");
    expect(r.background.length).toBeGreaterThan(0);
  });

  it("labelColor is a non-empty string at t=0", () => {
    expect(typeof r.labelColor).toBe("string");
    expect(r.labelColor.length).toBeGreaterThan(0);
  });

  it("iconColor is a non-empty string at t=0", () => {
    expect(typeof r.iconColor).toBe("string");
    expect(r.iconColor.length).toBeGreaterThan(0);
  });
});

describe("tweenCommandMenuItemStyle: t=1 returns values equal to `b`", () => {
  const a = commandMenuItemStyle("idle", ctx);
  const b = commandMenuItemStyle("selected", ctx);
  const r = tweenCommandMenuItemStyle(a, b, 1);

  it("scale equals b.scale at t=1", () => {
    expect(r.scale).toBeCloseTo(b.scale, 10);
  });

  it("background is a non-empty string at t=1", () => {
    expect(typeof r.background).toBe("string");
    expect(r.background.length).toBeGreaterThan(0);
  });

  it("labelColor is a non-empty string at t=1", () => {
    expect(typeof r.labelColor).toBe("string");
    expect(r.labelColor.length).toBeGreaterThan(0);
  });

  it("iconColor is a non-empty string at t=1", () => {
    expect(typeof r.iconColor).toBe("string");
    expect(r.iconColor.length).toBeGreaterThan(0);
  });
});

describe("tweenCommandMenuItemStyle: t=0.5 midpoint — numeric field (idle → press)", () => {
  const a = commandMenuItemStyle("idle", ctx);
  const b = commandMenuItemStyle("press", ctx);
  const r = tweenCommandMenuItemStyle(a, b, 0.5);

  it("scale midpoint: 1 → 0.98 gives 0.99", () => {
    expect(r.scale).toBeCloseTo(0.99, 10);
  });

  it("background is a non-empty string at midpoint", () => {
    expect(typeof r.background).toBe("string");
    expect(r.background.length).toBeGreaterThan(0);
  });
});

describe("tweenCommandMenuItemStyle: t=0.5 midpoint — numeric field (idle → hover)", () => {
  const a = commandMenuItemStyle("idle", ctx);
  const b = commandMenuItemStyle("hover", ctx);
  const r = tweenCommandMenuItemStyle(a, b, 0.5);

  it("scale midpoint: 1 → 1 gives 1 (identity)", () => {
    expect(r.scale).toBeCloseTo(1, 10);
  });
});

describe("tweenCommandMenuItemStyle: identity (a === b, any t)", () => {
  const s = commandMenuItemStyle("selected", ctx);

  it("scale is unchanged when both endpoints are the same", () => {
    expect(tweenCommandMenuItemStyle(s, s, 0.5).scale).toBeCloseTo(s.scale, 10);
  });

  it("background is a non-empty string for identity case", () => {
    expect(typeof tweenCommandMenuItemStyle(s, s, 0.5).background).toBe("string");
    expect(tweenCommandMenuItemStyle(s, s, 0.5).background.length).toBeGreaterThan(0);
  });
});

describe("tweenCommandMenuItemStyle: all four fields are present in the result", () => {
  const a = commandMenuItemStyle("idle", ctx);
  const b = commandMenuItemStyle("hover", ctx);
  const r = tweenCommandMenuItemStyle(a, b, 0.5);

  it("result has background field", () => {
    expect(r).toHaveProperty("background");
  });

  it("result has labelColor field", () => {
    expect(r).toHaveProperty("labelColor");
  });

  it("result has iconColor field", () => {
    expect(r).toHaveProperty("iconColor");
  });

  it("result has scale field", () => {
    expect(r).toHaveProperty("scale");
  });
});

describe("commandMenuItemConfig.controls: state", () => {
  it("state is a select control", () => {
    expect(commandMenuItemConfig.controls.state.type).toBe("select");
  });

  it("state options are ['idle','hover','press','selected']", () => {
    const ctrl = commandMenuItemConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    expect(ctrl.options).toEqual(["idle", "hover", "press", "selected"]);
  });

  it("state default is 'selected'", () => {
    expect(commandMenuItemConfig.controls.state.default).toBe("selected");
  });

  it("every state option is a valid CommandMenuItemState", () => {
    const ctrl = commandMenuItemConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    for (const opt of ctrl.options) {
      expect(VALID_STATES).toContain(opt as CommandMenuItemState);
    }
  });
});

describe("commandMenuItemConfig.controls: icon", () => {
  it("icon is a select control", () => {
    expect(commandMenuItemConfig.controls.icon.type).toBe("select");
  });

  it("icon options are ['search','settings','user','file']", () => {
    const ctrl = commandMenuItemConfig.controls.icon;
    if (ctrl.type !== "select") throw new Error("expected select");
    expect(ctrl.options).toEqual(["search", "settings", "user", "file"]);
  });

  it("icon default is 'settings'", () => {
    expect(commandMenuItemConfig.controls.icon.default).toBe("settings");
  });
});

describe("commandMenuItemConfig.controls: label and shortcut", () => {
  it("label is a text control", () => {
    expect(commandMenuItemConfig.controls.label.type).toBe("text");
  });

  it("label default is 'Settings'", () => {
    expect(commandMenuItemConfig.controls.label.default).toBe("Settings");
  });

  it("shortcut is a text control", () => {
    expect(commandMenuItemConfig.controls.shortcut.type).toBe("text");
  });
});

describe("commandMenuItemConfig.controls: mode", () => {
  it("mode is a select control", () => {
    expect(commandMenuItemConfig.controls.mode.type).toBe("select");
  });

  it("mode options are ['light','dark']", () => {
    const ctrl = commandMenuItemConfig.controls.mode;
    if (ctrl.type !== "select") throw new Error("expected select");
    expect(ctrl.options).toEqual(["light", "dark"]);
  });

  it("mode default is 'light'", () => {
    expect(commandMenuItemConfig.controls.mode.default).toBe("light");
  });
});

describe("commandMenuItemConfig.snippet: import line", () => {
  it("includes 'import { CommandMenuItem }' from the correct path", () => {
    const out = snippet({ state: "selected" });
    expect(out).toContain("import { CommandMenuItem }");
    expect(out).toContain('from "@/components/remocn/command-menu-item"');
  });
});

describe("commandMenuItemConfig.snippet: structural invariants", () => {
  it("contains a <CommandMenuItem JSX element", () => {
    expect(snippet({ state: "selected" })).toContain("<CommandMenuItem");
  });

  it("ends with a self-closing />", () => {
    expect(snippet({ state: "selected" }).trimEnd().endsWith("/>")).toBe(true);
  });

  it("state is always emitted", () => {
    for (const state of VALID_STATES) {
      expect(snippet({ state })).toContain(`state="${state}"`);
    }
  });
});

describe("commandMenuItemConfig.snippet: default props are omitted", () => {
  it("omits label when it equals the default 'Settings'", () => {
    expect(snippet({ state: "selected", label: "Settings" })).not.toContain("label=");
  });

  it("omits icon when it equals the default 'settings'", () => {
    expect(snippet({ state: "selected", icon: "settings" })).not.toContain("icon=");
  });

  it("omits mode when it equals the default 'light'", () => {
    expect(snippet({ state: "selected", mode: "light" })).not.toContain("mode=");
  });

  it("omits shortcut when it is an empty string", () => {
    expect(snippet({ state: "selected", shortcut: "" })).not.toContain("shortcut=");
  });
});

describe("commandMenuItemConfig.snippet: non-default props are emitted", () => {
  it("emits a non-default label", () => {
    expect(snippet({ state: "selected", label: "Profile" })).toContain('label="Profile"');
  });

  it("emits icon='search' when non-default", () => {
    expect(snippet({ state: "selected", icon: "search" })).toContain('icon="search"');
  });

  it("emits icon='user' when non-default", () => {
    expect(snippet({ state: "selected", icon: "user" })).toContain('icon="user"');
  });

  it("emits icon='file' when non-default", () => {
    expect(snippet({ state: "selected", icon: "file" })).toContain('icon="file"');
  });

  it("emits mode='dark' when non-default", () => {
    expect(snippet({ state: "selected", mode: "dark" })).toContain('mode="dark"');
  });

  it("emits shortcut when non-empty", () => {
    expect(snippet({ state: "selected", shortcut: "⌘ S" })).toContain('shortcut="⌘ S"');
  });
});

describe("commandMenuItemConfig.snippet: state options round-trip", () => {
  it("emits the correct state for every control option", () => {
    const ctrl = commandMenuItemConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    for (const state of ctrl.options) {
      expect(snippet({ state })).toContain(`state="${state}"`);
    }
  });
});
