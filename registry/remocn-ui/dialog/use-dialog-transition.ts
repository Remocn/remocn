"use client";

import {
  easings,
  type RemocnTheme,
  type Step,
  useRemocnTheme,
  useStateTransition,
} from "@/lib/remocn-ui";
import {
  dialogStyle,
  dialogStyleContext,
  type DialogState,
  type DialogStyle,
} from "@/components/remocn/dialog";

export const DEFAULT_DURATION = 12;

export function tweenDialogStyle(
  a: DialogStyle,
  b: DialogStyle,
  t: number,
): DialogStyle {
  return {
    overlayOpacity: a.overlayOpacity + (b.overlayOpacity - a.overlayOpacity) * t,
    popupOpacity: a.popupOpacity + (b.popupOpacity - a.popupOpacity) * t,
    popupScale: a.popupScale + (b.popupScale - a.popupScale) * t,
    popupTranslateY:
      a.popupTranslateY + (b.popupTranslateY - a.popupTranslateY) * t,
  };
}

export interface DialogTransitionOptions {
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  speed?: number;
  defaultDuration?: number;
}

export function useDialogTransition(
  steps: Step<DialogState>[],
  opts: DialogTransitionOptions = {},
): DialogStyle {
  const {
    theme: themeOverride,
    mode,
    speed = 1,
    defaultDuration = DEFAULT_DURATION,
  } = opts;
  const theme = useRemocnTheme(themeOverride, mode);
  const ctx = dialogStyleContext(theme);
  const { from, to, progress } = useStateTransition(
    steps,
    "closed",
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);
  return tweenDialogStyle(dialogStyle(from, ctx), dialogStyle(to, ctx), t);
}
