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
  accordionStyle,
  accordionStyleContext,
  type AccordionState,
  type AccordionStyle,
} from "@/components/remocn/accordion";

export const DEFAULT_DURATION = 14;

export function tweenAccordionStyle(
  a: AccordionStyle,
  b: AccordionStyle,
  t: number,
): AccordionStyle {
  return {
    panelHeight: a.panelHeight + (b.panelHeight - a.panelHeight) * t,
    panelOpacity: a.panelOpacity + (b.panelOpacity - a.panelOpacity) * t,
    chevronRotation:
      a.chevronRotation + (b.chevronRotation - a.chevronRotation) * t,
    background: mixOklch(a.background, b.background, t),
  };
}

export interface AccordionTransitionOptions {
  variant?: "default" | "ghost";
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  speed?: number;
  defaultDuration?: number;
}

export function useAccordionTransition(
  steps: Step<AccordionState>[],
  opts: AccordionTransitionOptions = {},
): AccordionStyle {
  const {
    variant = "default",
    theme: themeOverride,
    mode,
    speed = 1,
    defaultDuration = DEFAULT_DURATION,
  } = opts;
  const theme = useRemocnTheme(themeOverride, mode);
  const ctx = accordionStyleContext(variant, theme);
  const { from, to, progress } = useStateTransition(
    steps,
    "closed",
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);
  return tweenAccordionStyle(
    accordionStyle(from, ctx),
    accordionStyle(to, ctx),
    t,
  );
}
