"use client";

import { useCurrentFrame } from "remotion";
import {
  type SelectMenuState,
  type SelectMenuStyle,
  type SelectMenuVariant,
  selectMenuStyle,
  selectMenuStyleContext,
} from "@/components/remocn/select-menu";
import {
  clamp01,
  easings,
  type RemocnTheme,
  type Step,
  useRemocnTheme,
  useStateTransition,
} from "@/lib/remocn-ui";

const DEFAULT_OPTIONS = ["New Game", "Continue", "Settings", "Quit"];

export const DEFAULT_DURATION = 14;
export const DEFAULT_DECAY_DURATION = 8;
export const PRESS_PORTION = 0.4;

export function tweenSelectMenuStyle(
  a: SelectMenuStyle,
  b: SelectMenuStyle,
  t: number,
): SelectMenuStyle {
  return {
    indicatorOffset:
      a.indicatorOffset + (b.indicatorOffset - a.indicatorOffset) * t,
    press: a.press + (b.press - a.press) * t,
    selectProgress:
      a.selectProgress + (b.selectProgress - a.selectProgress) * t,
  };
}

export interface SelectMenuClickOptions {
  hold?: number;
  decayDuration?: number;
}

export function computeSelectMenuClick(
  frame: number,
  clickAt: number,
  clickDuration = DEFAULT_DURATION,
  opts: SelectMenuClickOptions = {},
): Pick<SelectMenuStyle, "press" | "selectProgress"> {
  const t = frame - clickAt;
  const dur = Math.max(1, clickDuration);
  const pressEnd = dur * PRESS_PORTION;

  const press =
    t <= 0 || t >= dur
      ? 0
      : t < pressEnd
        ? clamp01(t / pressEnd)
        : clamp01(1 - (t - pressEnd) / Math.max(1, dur - pressEnd));

  const riseStart = pressEnd;
  const rise = clamp01((t - riseStart) / Math.max(1, dur - riseStart));

  let selectProgress = rise;
  if (opts.hold !== undefined) {
    const decayStart = dur + opts.hold;
    const decay = clamp01(
      (t - decayStart) /
        Math.max(1, opts.decayDuration ?? DEFAULT_DECAY_DURATION),
    );
    selectProgress = clamp01(rise - decay);
  }

  return { press, selectProgress };
}

export interface SelectMenuTransitionOptions extends SelectMenuClickOptions {
  options?: string[];
  variant?: SelectMenuVariant;
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  speed?: number;
  defaultDuration?: number;
  clickAt?: number;
  clickDuration?: number;
}

export function useSelectMenuTransition(
  steps: Step<SelectMenuState>[],
  opts: SelectMenuTransitionOptions = {},
): SelectMenuStyle {
  const {
    options = DEFAULT_OPTIONS,
    variant = "soft",
    theme: themeOverride,
    mode,
    speed = 1,
    defaultDuration = DEFAULT_DURATION,
    clickAt,
    clickDuration = DEFAULT_DURATION,
    hold,
    decayDuration,
  } = opts;
  const theme = useRemocnTheme(themeOverride, mode);
  const ctx = selectMenuStyleContext(options, variant, theme);
  const { from, to, progress } = useStateTransition(
    steps,
    options[0] ?? "",
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);
  const style = tweenSelectMenuStyle(
    selectMenuStyle(options.indexOf(from), ctx),
    selectMenuStyle(options.indexOf(to), ctx),
    t,
  );

  const frame = useCurrentFrame() * speed;
  const click =
    clickAt === undefined
      ? { press: 0, selectProgress: 0 }
      : computeSelectMenuClick(frame, clickAt, clickDuration, {
          hold,
          decayDuration,
        });

  return { ...style, ...click };
}
