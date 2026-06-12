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
  radioStyle,
  radioStyleContext,
  type RadioState,
  type RadioStyle,
} from "@/components/remocn/radio";

export const DEFAULT_DURATION = 10;

export function tweenRadioStyle(
  a: RadioStyle,
  b: RadioStyle,
  t: number,
): RadioStyle {
  return {
    ringBorderColor: mixOklch(a.ringBorderColor, b.ringBorderColor, t),
    dotOpacity: a.dotOpacity + (b.dotOpacity - a.dotOpacity) * t,
    dotScale: a.dotScale + (b.dotScale - a.dotScale) * t,
  };
}

export interface RadioTransitionOptions {
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  primary?: string;
  speed?: number;
  defaultDuration?: number;
}

export function useRadioTransition(
  steps: Step<RadioState>[],
  opts: RadioTransitionOptions = {},
): RadioStyle {
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
  const ctx = radioStyleContext(theme);
  const { from, to, progress } = useStateTransition(
    steps,
    "unchecked",
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);
  return tweenRadioStyle(radioStyle(from, ctx), radioStyle(to, ctx), t);
}
