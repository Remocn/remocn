"use client";

import { mixOklch, type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type TabsState = string;

type TabsVariant = "pill" | "underline";

export interface TabsProps {
  state?: TabsState;
  style?: TabsStyle;
  items?: string[];
  contents?: string[];
  contentHeight?: number;
  variant?: TabsVariant;
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  className?: string;
}

const WIDTH = 440;

const DEFAULT_ITEMS = ["Account", "Password", "Settings"];

const DEFAULT_CONTENTS = [
  "Make changes to your account here.",
  "Change your password here.",
  "Manage your notification settings.",
];

export interface TabsStyle {
  indicatorOffset: number;
}

export interface TabsStyleContext {
  items: string[];
  variant: TabsVariant;
  trackBg: string;
  activeFg: string;
  inactiveFg: string;
  indicatorBg: string;
  border: string;
  radius: number;
  panelFg: string;
}

export function tabsStyleContext(
  items: string[],
  variant: TabsVariant,
  theme: RemocnTheme,
): TabsStyleContext {
  return {
    items,
    variant,
    trackBg: theme.muted,
    activeFg: theme.foreground,
    inactiveFg: theme.mutedForeground,
    indicatorBg: variant === "underline" ? theme.primary : theme.background,
    border: theme.border,
    radius: theme.radius,
    panelFg: theme.mutedForeground,
  };
}

export function tabsStyle(state: TabsState, ctx: TabsStyleContext): TabsStyle {
  const i = ctx.items.indexOf(state);
  return { indicatorOffset: i < 0 ? 0 : i };
}

export function Tabs({
  state = DEFAULT_ITEMS[0],
  style,
  items = DEFAULT_ITEMS,
  contents = DEFAULT_CONTENTS,
  contentHeight = 72,
  variant = "pill",
  theme: themeOverride,
  mode,
  className,
}: TabsProps) {
  const theme = useRemocnTheme(themeOverride, mode);

  const ctx = tabsStyleContext(items, variant, theme);
  const v = style ?? tabsStyle(state, ctx);

  const isPill = ctx.variant === "pill";
  const trackPad = isPill ? 4 : 0;
  const innerWidth = WIDTH - trackPad * 2;
  const segmentWidth = innerWidth / items.length;
  const rowHeight = 40;
  const indicatorX = trackPad + v.indicatorOffset * segmentWidth;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: theme.background,
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ width: WIDTH }}>
        {}
        <div
          style={{
            position: "relative",
            height: rowHeight,
            padding: trackPad,
            boxSizing: "border-box",
            display: "flex",
            background: isPill ? ctx.trackBg : "transparent",
            borderRadius: isPill ? ctx.radius : 0,
            borderBottom: isPill ? undefined : `1px solid ${ctx.border}`,
          }}
        >
          {}
          <div
            style={
              isPill
                ? {
                    position: "absolute",
                    top: trackPad,
                    left: indicatorX,
                    width: segmentWidth,
                    height: rowHeight - trackPad * 2,
                    background: ctx.indicatorBg,
                    borderRadius: ctx.radius - 3,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  }
                : {
                    position: "absolute",
                    bottom: 0,
                    left: indicatorX,
                    width: segmentWidth,
                    height: 2,
                    background: ctx.indicatorBg,
                  }
            }
          />
          {}
          {items.map((item, i) => {
            const proximity = Math.max(0, 1 - Math.abs(i - v.indicatorOffset));
            return (
              <span
                key={item}
                style={{
                  position: "relative",
                  width: segmentWidth,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  color: mixOklch(ctx.inactiveFg, ctx.activeFg, proximity),
                }}
              >
                {item}
              </span>
            );
          })}
        </div>
        {}
        <div
          style={{
            position: "relative",
            height: contentHeight,
            marginTop: 16,
          }}
        >
          {items.map((item, i) => {
            const proximity = Math.max(0, 1 - Math.abs(i - v.indicatorOffset));
            return (
              <div
                key={item}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: proximity,
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: ctx.panelFg,
                }}
              >
                {contents[i]}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
