"use client";

import {
  type CommandMenuState,
  type CommandMenuStyle,
  commandMenuStyle,
  commandMenuStyleContext,
} from "@/components/remocn/command-menu";
import {
  easings,
  type RemocnTheme,
  type Step,
  useRemocnTheme,
  useStateTransition,
} from "@/lib/remocn-ui";

export const DEFAULT_DURATION = 12;

export function tweenCommandMenuStyle(
  a: CommandMenuStyle,
  b: CommandMenuStyle,
  t: number,
): CommandMenuStyle {
  return {
    backdropOpacity:
      a.backdropOpacity + (b.backdropOpacity - a.backdropOpacity) * t,
    panelOpacity: a.panelOpacity + (b.panelOpacity - a.panelOpacity) * t,
    panelScale: a.panelScale + (b.panelScale - a.panelScale) * t,
    panelTranslateY:
      a.panelTranslateY + (b.panelTranslateY - a.panelTranslateY) * t,
  };
}

export interface CommandMenuTransitionOptions {
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  speed?: number;
  defaultDuration?: number;
}

export function useCommandMenuTransition(
  steps: Step<CommandMenuState>[],
  opts: CommandMenuTransitionOptions = {},
): CommandMenuStyle {
  const {
    theme: themeOverride,
    mode,
    speed = 1,
    defaultDuration = DEFAULT_DURATION,
  } = opts;
  const theme = useRemocnTheme(themeOverride, mode);
  const ctx = commandMenuStyleContext(theme);
  const { from, to, progress } = useStateTransition(
    steps,
    "closed",
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);
  return tweenCommandMenuStyle(
    commandMenuStyle(from, ctx),
    commandMenuStyle(to, ctx),
    t,
  );
}
