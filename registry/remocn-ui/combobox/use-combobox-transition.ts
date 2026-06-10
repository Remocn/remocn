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
// ^ install path; resolves in-repo via the @/components/remocn/* tsconfig alias.

/** Default transition length (frames) when a step omits `duration`. Tune to taste. */
export const DEFAULT_DURATION = 12;

/** Blend two combobox visuals: all fields are numbers, so a straight lerp. */
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

/**
 * Timeline → resolved (eased, tweened) ComboboxStyle. The CALLER invokes this;
 * it reads the frame, the `<Combobox>` component does not. Feed the result to
 * `<Combobox style={...} />` for a smooth open/close.
 */
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
