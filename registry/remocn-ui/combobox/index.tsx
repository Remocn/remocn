"use client";

import { type RemocnTheme, revealedText, useRemocnTheme } from "@/lib/remocn-ui";
import {
  inputStyle,
  inputStyleContext,
  type InputStyle,
  type InputStyleContext,
} from "@/components/remocn/input";
import {
  SelectItemRow,
  selectItemStyle,
  selectItemStyleContext,
  type SelectItemState,
  type SelectItemStyle,
  type SelectItemStyleContext,
} from "@/components/remocn/select-item";

export type ComboboxState = "opened" | "closed";

export interface ComboboxProps {
  state?: ComboboxState;
  style?: ComboboxStyle;
  query?: string;
  revealCount?: number;
  placeholder?: string;
  items?: string[];
  selectedIndex?: number;
  highlightedIndex?: number;
  pressedIndex?: number;
  itemStyles?: (SelectItemStyle | undefined)[];
  inputStyle?: InputStyle;
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  className?: string;
}

const WIDTH = 280;

export function filterComboboxItems(
  items: string[],
  query: string,
  revealCount?: number,
): string[] {
  const visible = (
    revealCount === undefined ? query : revealedText(query, revealCount)
  )
    .trim()
    .toLowerCase();
  if (visible === "") return items;
  return items.filter((item) => item.toLowerCase().includes(visible));
}

export interface ComboboxStyle {
  panelOpacity: number;
  panelScale: number;
  panelTranslateY: number;
}

export interface ComboboxStyleContext {
  triggerCtx: InputStyleContext;
  panelBg: string;
  panelBorder: string;
  mutedFg: string;
  radius: number;
  itemCtx: SelectItemStyleContext;
}

export function comboboxStyleContext(theme: RemocnTheme): ComboboxStyleContext {
  return {
    triggerCtx: inputStyleContext(theme),
    panelBg: theme.popover,
    panelBorder: theme.border,
    mutedFg: theme.mutedForeground,
    radius: theme.radius,
    itemCtx: selectItemStyleContext(theme),
  };
}

export function comboboxStyle(
  state: ComboboxState,
  _ctx: ComboboxStyleContext,
): ComboboxStyle {
  switch (state) {
    case "opened":
      return { panelOpacity: 1, panelScale: 1, panelTranslateY: 0 };
    default:
      return { panelOpacity: 0, panelScale: 0.96, panelTranslateY: -4 };
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

export function Combobox({
  state = "closed",
  style,
  query = "",
  revealCount,
  placeholder = "Select a fruit…",
  items = ["Apple", "Banana", "Orange", "Grape"],
  selectedIndex = -1,
  highlightedIndex = -1,
  pressedIndex = -1,
  itemStyles,
  inputStyle: inputStyleOverride,
  theme: themeOverride,
  mode,
  className,
}: ComboboxProps) {
  const theme = useRemocnTheme(themeOverride, mode);
  const ctx = comboboxStyleContext(theme);
  const v = style ?? comboboxStyle(state, ctx);

  const visibleQuery =
    revealCount === undefined ? query : revealedText(query, revealCount);
  const filtered = filterComboboxItems(items, query, revealCount);

  const trigger: InputStyle =
    inputStyleOverride ??
    inputStyle(visibleQuery ? "typing" : "idle", ctx.triggerCtx);

  const valueWidth = visibleQuery.length * 8;

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
            position: "relative",
            display: "flex",
            alignItems: "center",
            width: WIDTH,
            boxSizing: "border-box",
            height: 40,
            padding: "0 14px",
            fontSize: 15,
            letterSpacing: "-0.01em",
            background: trigger.background,
            border: `1px solid ${trigger.borderColor}`,
            borderRadius: theme.radius,
            boxShadow: `0 0 0 ${trigger.ringWidth}px ${trigger.ringColor}`,
          }}
        >
          {}
          <span
            style={{
              position: "absolute",
              left: 14,
              color: ctx.triggerCtx.mutedForeground,
              opacity: trigger.valueReveal > 0 ? 0 : trigger.placeholderOpacity,
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            {placeholder}
          </span>
          {}
          <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
            <span
              style={{
                display: "inline-block",
                width: valueWidth * trigger.valueReveal,
                overflow: "hidden",
                whiteSpace: "nowrap",
                color: ctx.triggerCtx.foreground,
              }}
            >
              {visibleQuery}
            </span>
            <span
              style={{
                flexShrink: 0,
                width: 2,
                height: 17,
                borderRadius: 1,
                background: ctx.triggerCtx.foreground,
                opacity: trigger.caretOpacity,
              }}
            />
          </div>
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
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "12px",
                textAlign: "center",
                fontSize: 14,
                color: ctx.mutedFg,
              }}
            >
              No results found.
            </div>
          ) : (
            filtered.map((item, i) => {
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
            })
          )}
        </div>
      </div>
    </div>
  );
}
