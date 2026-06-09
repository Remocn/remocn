"use client";

import {
  easings,
  type RemocnTheme,
  type Step,
  useRemocnTheme,
  useStateTransition,
} from "@/lib/remocn-ui";
import {
  alertDialogStyle,
  alertDialogStyleContext,
  type AlertDialogState,
  type AlertDialogStyle,
} from "@/components/remocn/alert-dialog";
// ^ install path; resolves in-repo via the @/components/remocn/* tsconfig alias.

/** Default transition length (frames) when a step omits `duration`. Tune to taste. */
export const DEFAULT_DURATION = 12;

/** Blend two alert-dialog visuals: all four fields are pure numeric lerps. */
export function tweenAlertDialogStyle(
  a: AlertDialogStyle,
  b: AlertDialogStyle,
  t: number,
): AlertDialogStyle {
  return {
    overlayOpacity: a.overlayOpacity + (b.overlayOpacity - a.overlayOpacity) * t,
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

/**
 * Timeline → resolved (eased, tweened) AlertDialogStyle. The CALLER invokes this;
 * it reads the frame, the `<AlertDialog>` component does not. Feed the result to
 * `<AlertDialog style={...} />` for smooth open/close transitions.
 */
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
