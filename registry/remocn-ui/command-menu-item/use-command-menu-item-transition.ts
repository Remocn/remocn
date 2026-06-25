"use client";

import {
  easings,
  mixOklch,
  type RemocnTheme,
  type Step,
  useRemocnTheme,
  useStateTransition,
} from "@/lib/remocn-ui";
import {
  commandMenuItemStyle,
  commandMenuItemStyleContext,
  type CommandMenuItemState,
  type CommandMenuItemStyle,
} from "@/components/remocn/command-menu-item";

export const DEFAULT_DURATION = 8;

export function tweenCommandMenuItemStyle(
  a: CommandMenuItemStyle,
  b: CommandMenuItemStyle,
  t: number,
): CommandMenuItemStyle {
  return {
    background: mixOklch(a.background, b.background, t),
    labelColor: mixOklch(a.labelColor, b.labelColor, t),
    iconColor: mixOklch(a.iconColor, b.iconColor, t),
    scale: a.scale + (b.scale - a.scale) * t,
  };
}

export interface CommandMenuItemTransitionOptions {
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  speed?: number;
  defaultDuration?: number;
}

export function useCommandMenuItemTransition(
  steps: Step<CommandMenuItemState>[],
  opts: CommandMenuItemTransitionOptions = {},
): CommandMenuItemStyle {
  const {
    theme: themeOverride,
    mode,
    speed = 1,
    defaultDuration = DEFAULT_DURATION,
  } = opts;
  const theme = useRemocnTheme(themeOverride, mode);
  const ctx = commandMenuItemStyleContext(theme);
  const { from, to, progress } = useStateTransition(
    steps,
    "idle",
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);
  return tweenCommandMenuItemStyle(
    commandMenuItemStyle(from, ctx),
    commandMenuItemStyle(to, ctx),
    t,
  );
}
