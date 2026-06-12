"use client";

import {
  easings,
  type RemocnTheme,
  type Step,
  useRemocnTheme,
  useStateTransition,
} from "@/lib/remocn-ui";
import {
  comboboxStyle,
  comboboxStyleContext,
  type ComboboxState,
  type ComboboxStyle,
} from "@/components/remocn/combobox";

export const DEFAULT_DURATION = 12;

export function tweenComboboxStyle(
  a: ComboboxStyle,
  b: ComboboxStyle,
  t: number,
): ComboboxStyle {
  return {
    panelOpacity: a.panelOpacity + (b.panelOpacity - a.panelOpacity) * t,
    panelScale: a.panelScale + (b.panelScale - a.panelScale) * t,
    panelTranslateY:
      a.panelTranslateY + (b.panelTranslateY - a.panelTranslateY) * t,
  };
}

export interface ComboboxTransitionOptions {
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  speed?: number;
  defaultDuration?: number;
}

export function useComboboxTransition(
  steps: Step<ComboboxState>[],
  opts: ComboboxTransitionOptions = {},
): ComboboxStyle {
  const {
    theme: themeOverride,
    mode,
    speed = 1,
    defaultDuration = DEFAULT_DURATION,
  } = opts;
  const theme = useRemocnTheme(themeOverride, mode);
  const ctx = comboboxStyleContext(theme);
  const { from, to, progress } = useStateTransition(
    steps,
    "closed",
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);
  return tweenComboboxStyle(
    comboboxStyle(from, ctx),
    comboboxStyle(to, ctx),
    t,
  );
}
