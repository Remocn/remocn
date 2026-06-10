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
  /** Current visual state (snap path). State changes snap (no enter-tweens). */
  state?: ContextMenuState;
  /**
   * Resolved animated visual (smooth path). When provided, takes precedence over
   * `state` — feed it an interpolated `ContextMenuStyle` from `useContextMenuTransition`.
   */
  style?: ContextMenuStyle;
  /** Menu rows — plain string labels (same format as DropdownMenu). */
  items?: string[];
  /** Row currently highlighted (hover); `-1` for none. */
  highlightedIndex?: number;
  /** Row currently pressed; `-1` for none. */
  pressedIndex?: number;
  /**
   * Smooth per-row override. When an entry is present it wins over the
   * index→state derivation, letting the example tween a single row.
   */
  itemStyles?: (DropdownMenuItemStyle | undefined)[];
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  className?: string;
}

/** Panel width (px). */
const WIDTH = 200;

// ===========================================================================
// Context-menu visual — the COMPLETE animated look for a moment in time. A
// `state` is a named preset of this visual (`contextMenuStyle`); the smooth path
// feeds an interpolated `ContextMenuStyle` straight through. The component is a
// pure renderer of whichever style it receives. Unlike DropdownMenu there is NO
// trigger — a context menu opens AT the click point, so it scales from its
// top-left corner and the CALLER positions it (transparent placement).
// ===========================================================================

export interface ContextMenuStyle {
  /** Panel fade 0 (closed) → 1 (opened). */
  opacity: number;
  /** Panel zoom 0.95 (closed) → 1 (opened), growing from the top-left corner. */
  scale: number;
  /** Panel lift -4 (closed) → 0 (opened) px. */
  translateY: number;
}

/** Concrete colors for the active theme, resolved once per render. */
export interface ContextMenuStyleContext {
  panelBg: string;
  panelBorder: string;
  radius: number;
  /** Row presets for the panel items. */
  itemCtx: DropdownMenuItemStyleContext;
}

/**
 * Derive the concrete colors for a theme. Pure — call it once and reuse the
 * result for every `contextMenuStyle(state, ctx)` preset.
 */
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

/**
 * The COMPLETE resting visual for a state — a pure
 * `(state, ctx) => ContextMenuStyle` map. To change how a state looks, edit one
 * entry.
 */
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

/** Resolve one row's state from the index props. */
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
  mode,
  className,
}: ContextMenuProps) {
  const theme = useRemocnTheme(themeOverride, mode);
  const ctx = contextMenuStyleContext(theme);
  const v = style ?? contextMenuStyle(state, ctx);

  return (
    // TRANSPARENT wrapper — a context menu opens AT the click point; the caller
    // positions this with an absolute wrapper (no x/y props here). It paints no
    // opaque background and does not center the panel itself.
    <div
      className={className}
      style={{
        width: WIDTH,
        opacity: v.opacity,
        // Grows from the top-left corner — where the cursor "clicked".
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
            mode={mode}
          />
        );
      })}
    </div>
  );
}
