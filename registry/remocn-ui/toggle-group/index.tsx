"use client";

import type { ReactNode } from "react";
import { mixOklch, type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type ToggleGroupState = string;

export type ToggleGroupSize = "default" | "sm";

export interface ToggleGroupItem {
  value: string;
  label: string;
  icon?: ReactNode;
}

export interface ToggleGroupProps {
  state?: ToggleGroupState;
  style?: ToggleGroupStyle;
  items?: ToggleGroupItem[];
  size?: ToggleGroupSize;
  theme?: Partial<RemocnTheme>;
  align?: "start" | "center" | "end";
  className?: string;
}

function justify(align: "start" | "center" | "end"): string {
  return align === "start"
    ? "flex-start"
    : align === "end"
      ? "flex-end"
      : "center";
}

const DEFAULT_ITEMS: ToggleGroupItem[] = [
  { value: "Monthly", label: "Monthly" },
  { value: "Yearly", label: "Yearly" },
];

const SIZE_STYLES: Record<
  ToggleGroupSize,
  { height: number; segMinWidth: number; fontSize: number; pad: number; gap: number }
> = {
  sm: { height: 32, segMinWidth: 72, fontSize: 13, pad: 3, gap: 6 },
  default: { height: 36, segMinWidth: 88, fontSize: 14, pad: 4, gap: 8 },
};

export interface ToggleGroupStyle {
  indicatorOffset: number;
}

export interface ToggleGroupStyleContext {
  items: ToggleGroupItem[];
  trackBg: string;
  thumbBg: string;
  activeFg: string;
  inactiveFg: string;
  radius: number;
}

export function toggleGroupStyleContext(
  items: ToggleGroupItem[],
  theme: RemocnTheme,
): ToggleGroupStyleContext {
  return {
    items,
    trackBg: theme.muted,
    thumbBg: theme.background,
    activeFg: theme.foreground,
    inactiveFg: theme.mutedForeground,
    radius: theme.radius,
  };
}

export function toggleGroupStyle(
  state: ToggleGroupState,
  ctx: ToggleGroupStyleContext,
): ToggleGroupStyle {
  const i = ctx.items.findIndex((it) => it.value === state);
  return { indicatorOffset: i < 0 ? 0 : i };
}

export function ToggleGroup({
  state = DEFAULT_ITEMS[0].value,
  style,
  items = DEFAULT_ITEMS,
  size = "default",
  theme: themeOverride,
  align = "center",
  className,
}: ToggleGroupProps) {
  const theme = useRemocnTheme(themeOverride, "light");
  const ctx = toggleGroupStyleContext(items, theme);
  const v = style ?? toggleGroupStyle(state, ctx);

  const sizeStyle = SIZE_STYLES[size];
  const { pad } = sizeStyle;
  const segmentWidth = sizeStyle.segMinWidth;
  const thumbX = pad + v.indicatorOffset * segmentWidth;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: justify(align),
        background: "transparent",
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          height: sizeStyle.height,
          padding: pad,
          boxSizing: "border-box",
          background: ctx.trackBg,
          borderRadius: ctx.radius,
        }}
      >
        {}
        <div
          style={{
            position: "absolute",
            top: pad,
            left: thumbX,
            width: segmentWidth,
            height: sizeStyle.height - pad * 2,
            background: ctx.thumbBg,
            borderRadius: Math.max(2, ctx.radius - 3),
            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
          }}
        />
        {}
        {items.map((item, i) => {
          const proximity = Math.max(0, 1 - Math.abs(i - v.indicatorOffset));
          return (
            <span
              key={item.value}
              style={{
                position: "relative",
                width: segmentWidth,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: sizeStyle.gap,
                fontSize: sizeStyle.fontSize,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                color: mixOklch(ctx.inactiveFg, ctx.activeFg, proximity),
              }}
            >
              {item.icon}
              {item.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
