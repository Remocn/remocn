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
  switchStyle,
  switchStyleContext,
  type SwitchState,
  type SwitchStyle,
} from "@/components/remocn/switch";

export const DEFAULT_DURATION = 10;

export function tweenSwitchStyle(
  a: SwitchStyle,
  b: SwitchStyle,
  t: number,
): SwitchStyle {
  return {
    trackBackground: mixOklch(a.trackBackground, b.trackBackground, t),
    thumbOffset: a.thumbOffset + (b.thumbOffset - a.thumbOffset) * t,
  };
}

export interface SwitchTransitionOptions {
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  primary?: string;
  speed?: number;
  defaultDuration?: number;
}

export function useSwitchTransition(
  steps: Step<SwitchState>[],
  opts: SwitchTransitionOptions = {},
): SwitchStyle {
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
  const ctx = switchStyleContext(theme);
  const { from, to, progress } = useStateTransition(
    steps,
    "unchecked",
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);
  return tweenSwitchStyle(switchStyle(from, ctx), switchStyle(to, ctx), t);
}
