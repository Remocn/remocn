"use client";

import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";
import {
  DropdownMenuItemRow,
  dropdownMenuItemStyle,
  dropdownMenuItemStyleContext,
  type DropdownMenuItemState,
  type DropdownMenuItemStyle,
  type DropdownMenuItemStyleContext,
} from "@/components/remocn/dropdown-menu-item";

export type ContextMenuState = "opened" | "closed";

export interface ContextMenuProps {
  state?: ContextMenuState;
  style?: ContextMenuStyle;
  items?: string[];
  highlightedIndex?: number;
  pressedIndex?: number;
  itemStyles?: (DropdownMenuItemStyle | undefined)[];
  theme?: Partial<RemocnTheme>;
  className?: string;
}

const WIDTH = 200;

export interface ContextMenuStyle {
  opacity: number;
  scale: number;
  translateY: number;
}

export interface ContextMenuStyleContext {
  panelBg: string;
  panelBorder: string;
  radius: number;
  itemCtx: DropdownMenuItemStyleContext;
}

export function contextMenuStyleContext(
  theme: RemocnTheme,
): ContextMenuStyleContext {
  return {
    panelBg: theme.popover,
    panelBorder: theme.border,
    radius: theme.radius,
    itemCtx: dropdownMenuItemStyleContext(theme),
  };
}

export function contextMenuStyle(
  state: ContextMenuState,
  _ctx: ContextMenuStyleContext,
): ContextMenuStyle {
  switch (state) {
    case "opened":
      return { opacity: 1, scale: 1, translateY: 0 };
    default:
      return { opacity: 0, scale: 0.95, translateY: -4 };
  }
}

function rowState(
  i: number,
  highlightedIndex: number,
  pressedIndex: number,
): DropdownMenuItemState {
  if (i === pressedIndex) return "press";
  if (i === highlightedIndex) return "hover";
  return "idle";
}

export function ContextMenu({
  state = "closed",
  style,
  items = ["Back", "Reload", "Save As…", "Inspect"],
  highlightedIndex = -1,
  pressedIndex = -1,
  itemStyles,
  theme: themeOverride,
  className,
}: ContextMenuProps) {
  const theme = useRemocnTheme(themeOverride, "light");
  const ctx = contextMenuStyleContext(theme);
  const v = style ?? contextMenuStyle(state, ctx);

  return (
    <div
      className={className}
      style={{
        width: WIDTH,
        opacity: v.opacity,
        transformOrigin: "top left",
        transform: `translateY(${v.translateY}px) scale(${v.scale})`,
        background: ctx.panelBg,
        border: `1px solid ${ctx.panelBorder}`,
        borderRadius: ctx.radius + 2,
        padding: 4,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        boxShadow: "0 12px 32px -8px rgba(0,0,0,0.18)",
        boxSizing: "border-box",
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {items.map((item, i) => {
        const override = itemStyles?.[i];
        const rowStyle =
          override ??
          dropdownMenuItemStyle(
            rowState(i, highlightedIndex, pressedIndex),
            ctx.itemCtx,
          );
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
  );
}
