"use client";

import {
  type CheckboxState,
  type CheckboxStyle,
  checkboxStyle,
  checkboxStyleContext,
} from "@/components/remocn/checkbox";
import {
  easings,
  mixOklch,
  type RemocnTheme,
  type Step,
  useRemocnTheme,
  useStateTransition,
} from "@/lib/remocn-ui";

export const DEFAULT_DURATION = 10;

export function tweenCheckboxStyle(
  a: CheckboxStyle,
  b: CheckboxStyle,
  t: number,
): CheckboxStyle {
  return {
    boxBackground: mixOklch(a.boxBackground, b.boxBackground, t),
    boxBorderColor: mixOklch(a.boxBorderColor, b.boxBorderColor, t),
    checkOpacity: a.checkOpacity + (b.checkOpacity - a.checkOpacity) * t,
    checkScale: a.checkScale + (b.checkScale - a.checkScale) * t,
    checkDraw: a.checkDraw + (b.checkDraw - a.checkDraw) * t,
  };
}

export interface CheckboxTransitionOptions {
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  primary?: string;
  speed?: number;
  defaultDuration?: number;
}

export function useCheckboxTransition(
  steps: Step<CheckboxState>[],
  opts: CheckboxTransitionOptions = {},
): CheckboxStyle {
  const {
    theme: themeOverride,
    mode,
    primary,
    speed = 1,
    defaultDuration = DEFAULT_DURATION,
  } = opts;
  const theme = useRemocnTheme(
    { ...themeOverride, ...(primary ? { primary } : {}) },
    mode,
  );
  const ctx = checkboxStyleContext(theme);
  const { from, to, progress } = useStateTransition(
    steps,
    "unchecked",
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);
  return tweenCheckboxStyle(
    checkboxStyle(from, ctx),
    checkboxStyle(to, ctx),
    t,
  );
}
