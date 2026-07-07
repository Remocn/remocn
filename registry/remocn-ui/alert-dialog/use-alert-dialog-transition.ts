"use client";

import {
  type AlertDialogState,
  type AlertDialogStyle,
  alertDialogStyle,
  alertDialogStyleContext,
} from "@/components/remocn/alert-dialog";
import {
  easings,
  type RemocnTheme,
  type Step,
  useRemocnTheme,
  useStateTransition,
} from "@/lib/remocn-ui";

export const DEFAULT_DURATION = 12;

export function tweenAlertDialogStyle(
  a: AlertDialogStyle,
  b: AlertDialogStyle,
  t: number,
): AlertDialogStyle {
  return {
    overlayOpacity:
      a.overlayOpacity + (b.overlayOpacity - a.overlayOpacity) * t,
    popupOpacity: a.popupOpacity + (b.popupOpacity - a.popupOpacity) * t,
    popupScale: a.popupScale + (b.popupScale - a.popupScale) * t,
    popupTranslateY:
      a.popupTranslateY + (b.popupTranslateY - a.popupTranslateY) * t,
  };
}

export interface AlertDialogTransitionOptions {
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  speed?: number;
  defaultDuration?: number;
}

export function useAlertDialogTransition(
  steps: Step<AlertDialogState>[],
  opts: AlertDialogTransitionOptions = {},
): AlertDialogStyle {
  const {
    theme: themeOverride,
    mode,
    speed = 1,
    defaultDuration = DEFAULT_DURATION,
  } = opts;
  const theme = useRemocnTheme(themeOverride, mode);
  const ctx = alertDialogStyleContext(theme);
  const { from, to, progress } = useStateTransition(
    steps,
    "closed",
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);
  return tweenAlertDialogStyle(
    alertDialogStyle(from, ctx),
    alertDialogStyle(to, ctx),
    t,
  );
}
