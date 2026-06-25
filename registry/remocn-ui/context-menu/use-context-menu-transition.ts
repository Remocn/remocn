"use client";

import {
  easings,
  type RemocnTheme,
  type Step,
  useRemocnTheme,
  useStateTransition,
} from "@/lib/remocn-ui";
import {
  contextMenuStyle,
  contextMenuStyleContext,
  type ContextMenuState,
  type ContextMenuStyle,
} from "@/components/remocn/context-menu";

export const DEFAULT_DURATION = 10;

export function tweenContextMenuStyle(
  a: ContextMenuStyle,
  b: ContextMenuStyle,
  t: number,
): ContextMenuStyle {
  return {
    opacity: a.opacity + (b.opacity - a.opacity) * t,
    scale: a.scale + (b.scale - a.scale) * t,
    translateY: a.translateY + (b.translateY - a.translateY) * t,
  };
}

export interface ContextMenuTransitionOptions {
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  speed?: number;
  defaultDuration?: number;
}

export function useContextMenuTransition(
  steps: Step<ContextMenuState>[],
  opts: ContextMenuTransitionOptions = {},
): ContextMenuStyle {
  const {
    theme: themeOverride,
    mode,
    speed = 1,
    defaultDuration = DEFAULT_DURATION,
  } = opts;
  const theme = useRemocnTheme(themeOverride, mode);
  const ctx = contextMenuStyleContext(theme);
  const { from, to, progress } = useStateTransition(
    steps,
    "closed",
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);
  return tweenContextMenuStyle(
    contextMenuStyle(from, ctx),
    contextMenuStyle(to, ctx),
    t,
  );
}
