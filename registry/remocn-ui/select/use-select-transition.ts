"use client";

import {
  easings,
  type RemocnTheme,
  type Step,
  useRemocnTheme,
  useStateTransition,
} from "@/lib/remocn-ui";
import {
  selectStyle,
  selectStyleContext,
  type SelectState,
  type SelectStyle,
} from "@/components/remocn/select";

export const DEFAULT_DURATION = 12;

export function tweenSelectStyle(
  a: SelectStyle,
  b: SelectStyle,
  t: number,
): SelectStyle {
  return {
    panelOpacity: a.panelOpacity + (b.panelOpacity - a.panelOpacity) * t,
    panelScale: a.panelScale + (b.panelScale - a.panelScale) * t,
    panelTranslateY:
      a.panelTranslateY + (b.panelTranslateY - a.panelTranslateY) * t,
    chevronRotation:
      a.chevronRotation + (b.chevronRotation - a.chevronRotation) * t,
  };
}

export interface SelectTransitionOptions {
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  speed?: number;
  defaultDuration?: number;
}

export function useSelectTransition(
  steps: Step<SelectState>[],
  opts: SelectTransitionOptions = {},
): SelectStyle {
  const { theme: themeOverride, mode, speed = 1, defaultDuration = DEFAULT_DURATION } =
    opts;
  const theme = useRemocnTheme(themeOverride, mode);
  const ctx = selectStyleContext(theme);
  const { from, to, progress } = useStateTransition(
    steps,
    "closed",
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);
  return tweenSelectStyle(selectStyle(from, ctx), selectStyle(to, ctx), t);
}
