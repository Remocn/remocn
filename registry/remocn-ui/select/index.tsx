"use client";

import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";
import {
  buttonStyle,
  buttonStyleContext,
  type ButtonStyle,
  type ButtonStyleContext,
} from "@/components/remocn/button";
import {
  SelectItemRow,
  selectItemStyle,
  selectItemStyleContext,
  type SelectItemState,
  type SelectItemStyle,
  type SelectItemStyleContext,
} from "@/components/remocn/select-item";

export type SelectState = "opened" | "closed";

export interface SelectProps {
  state?: SelectState;
  style?: SelectStyle;
  label?: string;
  triggerStyle?: ButtonStyle;
  items?: string[];
  selectedIndex?: number;
  highlightedIndex?: number;
  pressedIndex?: number;
  itemStyles?: (SelectItemStyle | undefined)[];
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  className?: string;
}

const WIDTH = 260;

export interface SelectStyle {
  panelOpacity: number;
  panelScale: number;
  panelTranslateY: number;
  chevronRotation: number;
}

export interface SelectStyleContext {
  triggerCtx: ButtonStyleContext;
  panelBg: string;
  panelBorder: string;
  triggerFg: string;
  mutedFg: string;
  radius: number;
  itemCtx: SelectItemStyleContext;
}

export function selectStyleContext(theme: RemocnTheme): SelectStyleContext {
  return {
    triggerCtx: buttonStyleContext("outline", theme),
    panelBg: theme.popover,
    panelBorder: theme.border,
    triggerFg: theme.foreground,
    mutedFg: theme.mutedForeground,
    radius: theme.radius,
    itemCtx: selectItemStyleContext(theme),
  };
}

export function selectStyle(
  state: SelectState,
  _ctx: SelectStyleContext,
): SelectStyle {
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

function rowState(
  i: number,
  selectedIndex: number,
  highlightedIndex: number,
  pressedIndex: number,
): SelectItemState {
  if (i === pressedIndex) return "press";
  if (i === selectedIndex) return "selected";
  if (i === highlightedIndex) return "hover";
  return "idle";
}

export function Select({
  state = "closed",
  style,
  label = "Select a fruit",
  triggerStyle,
  items = ["Apple", "Banana", "Orange", "Grape"],
  selectedIndex = -1,
  highlightedIndex = -1,
  pressedIndex = -1,
  itemStyles,
  theme: themeOverride,
  mode,
  className,
}: SelectProps) {
  const theme = useRemocnTheme(themeOverride, mode);
  const ctx = selectStyleContext(theme);
  const v = style ?? selectStyle(state, ctx);

  const trigger: ButtonStyle =
    triggerStyle ?? buttonStyle("idle", ctx.triggerCtx);

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
      <div style={{ position: "relative", width: WIDTH }}>
        {}
        <div
          style={{
            width: WIDTH,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            height: 40,
            padding: "0 16px",
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            color: ctx.triggerFg,
            transform: `translateY(${trigger.translateY}px) scale(${trigger.scale})`,
            background: trigger.background,
            border: `1px solid ${ctx.panelBorder}`,
            borderRadius: ctx.radius,
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
            top: "calc(100% + 6px)",
            left: 0,
            width: WIDTH,
            boxSizing: "border-box",
            transformOrigin: "top",
            transform: `translateY(${v.panelTranslateY}px) scale(${v.panelScale})`,
            opacity: v.panelOpacity,
            background: ctx.panelBg,
            border: `1px solid ${ctx.panelBorder}`,
            borderRadius: ctx.radius,
            padding: 4,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            boxShadow: "0 16px 32px -12px rgba(0,0,0,0.25)",
          }}
        >
          {items.map((item, i) => {
            const override = itemStyles?.[i];
            return (
              <SelectItemRow
                key={item}
                style={
                  override ??
                  selectItemStyle(
                    rowState(i, selectedIndex, highlightedIndex, pressedIndex),
                    ctx.itemCtx,
                  )
                }
                ctx={ctx.itemCtx}
                label={item}
                width={WIDTH - 8}
                radius={theme.radius}
                check={ctx.itemCtx.check}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
