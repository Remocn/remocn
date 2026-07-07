"use client";

import {
  type ButtonStyle,
  type ButtonStyleContext,
  buttonStyle,
  buttonStyleContext,
} from "@/components/remocn/button";
import {
  DropdownMenuItemRow,
  type DropdownMenuItemStyle,
  type DropdownMenuItemStyleContext,
  dropdownMenuItemStyle,
  dropdownMenuItemStyleContext,
} from "@/components/remocn/dropdown-menu-item";
import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type DropdownMenuState = "opened" | "closed";

export interface DropdownMenuStyle {
  panelOpacity: number;
  panelScale: number;
  panelTranslateY: number;
  chevronRotation: number;
}

export interface DropdownMenuStyleContext {
  triggerCtx: ButtonStyleContext;
  panelBg: string;
  panelBorder: string;
  triggerFg: string;
  mutedFg: string;
  radius: number;
  itemCtx: DropdownMenuItemStyleContext;
}

export function dropdownMenuStyleContext(
  theme: RemocnTheme,
): DropdownMenuStyleContext {
  return {
    triggerCtx: buttonStyleContext("outline", theme),
    panelBg: theme.popover,
    panelBorder: theme.border,
    triggerFg: theme.foreground,
    mutedFg: theme.mutedForeground,
    radius: theme.radius,
    itemCtx: dropdownMenuItemStyleContext(theme),
  };
}

export function dropdownMenuStyle(
  state: DropdownMenuState,
  _ctx: DropdownMenuStyleContext,
): DropdownMenuStyle {
  switch (state) {
    case "opened":
      return {
        panelOpacity: 1,
        panelScale: 1,
        panelTranslateY: 0,
        chevronRotation: 180,
      };
    default:
      return {
        panelOpacity: 0,
        panelScale: 0.96,
        panelTranslateY: -4,
        chevronRotation: 0,
      };
  }
}

const WIDTH = 240;

export interface DropdownMenuProps {
  state?: DropdownMenuState;
  style?: DropdownMenuStyle;
  label?: string;
  items?: string[];
  highlightedIndex?: number;
  pressedIndex?: number;
  itemStyles?: (DropdownMenuItemStyle | undefined)[];
  triggerStyle?: ButtonStyle;
  theme?: Partial<RemocnTheme>;
  className?: string;
}

export function DropdownMenu({
  state = "closed",
  style,
  label = "Options",
  items = ["Profile", "Billing", "Settings", "Log out"],
  highlightedIndex = -1,
  pressedIndex = -1,
  itemStyles,
  triggerStyle,
  theme: themeOverride,
  className,
}: DropdownMenuProps) {
  const theme = useRemocnTheme(themeOverride, "light");

  const ctx = dropdownMenuStyleContext(theme);
  const v = style ?? dropdownMenuStyle(state, ctx);

  const trigger = triggerStyle ?? buttonStyle("idle", ctx.triggerCtx);

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 220,
        background: "transparent",
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ position: "relative", width: WIDTH }}>
        {}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            width: WIDTH,
            height: 40,
            padding: "0 16px",
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            color: ctx.triggerFg,
            background: trigger.background,
            border: `1px solid ${ctx.panelBorder}`,
            borderRadius: ctx.radius,
            transform: `translateY(${trigger.translateY}px) scale(${trigger.scale})`,
            boxSizing: "border-box",
          }}
        >
          <span>{label}</span>
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            style={{
              flexShrink: 0,
              transform: `rotate(${v.chevronRotation}deg)`,
            }}
          >
            <path
              d="M6 9l6 6 6-6"
              stroke={ctx.mutedFg}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {}
        <div
          style={{
            position: "absolute",
            top: 48,
            left: 0,
            width: WIDTH,
            opacity: v.panelOpacity,
            transform: `translateY(${v.panelTranslateY}px) scale(${v.panelScale})`,
            transformOrigin: "top",
            background: ctx.panelBg,
            border: `1px solid ${ctx.panelBorder}`,
            borderRadius: ctx.radius + 2,
            padding: 4,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            boxShadow: "0 12px 32px -8px rgba(0,0,0,0.18)",
            boxSizing: "border-box",
          }}
        >
          {items.map((item, i) => {
            const override = itemStyles?.[i];
            const rowState =
              i === pressedIndex
                ? "press"
                : i === highlightedIndex
                  ? "hover"
                  : "idle";
            const rowStyle =
              override ?? dropdownMenuItemStyle(rowState, ctx.itemCtx);
            return (
              <DropdownMenuItemRow
                key={item}
                style={rowStyle}
                label={item}
                width={WIDTH - 8}
                theme={themeOverride}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
