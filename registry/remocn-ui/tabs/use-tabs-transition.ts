"use client";

import {
  easings,
  type RemocnTheme,
  type Step,
  useRemocnTheme,
  useStateTransition,
} from "@/lib/remocn-ui";
import {
  tabsStyle,
  tabsStyleContext,
  type TabsState,
  type TabsStyle,
} from "@/components/remocn/tabs";

const DEFAULT_ITEMS = ["Account", "Password", "Settings"];

export const DEFAULT_DURATION = 14;

export function tweenTabsStyle(
  a: TabsStyle,
  b: TabsStyle,
  t: number,
): TabsStyle {
  return {
    indicatorOffset:
      a.indicatorOffset + (b.indicatorOffset - a.indicatorOffset) * t,
  };
}

export interface TabsTransitionOptions {
  items?: string[];
  variant?: "pill" | "underline";
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  speed?: number;
  defaultDuration?: number;
}

export function useTabsTransition(
  steps: Step<TabsState>[],
  opts: TabsTransitionOptions = {},
): TabsStyle {
  const {
    items = DEFAULT_ITEMS,
    variant = "pill",
    theme: themeOverride,
    mode,
    speed = 1,
    defaultDuration = DEFAULT_DURATION,
  } = opts;
  const theme = useRemocnTheme(themeOverride, mode);
  const ctx = tabsStyleContext(items, variant, theme);
  const { from, to, progress } = useStateTransition(
    steps,
    items[0],
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);
  return tweenTabsStyle(tabsStyle(from, ctx), tabsStyle(to, ctx), t);
}
