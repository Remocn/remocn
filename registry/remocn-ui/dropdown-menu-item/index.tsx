"use client";

import { mixOklch, type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type DropdownMenuItemState = "idle" | "hover" | "press";

export interface DropdownMenuItemStyle {
  background: string;
  labelColor: string;
  scale: number;
}

export interface DropdownMenuItemStyleContext {
  idleBg: string;
  hoverBg: string;
  pressBg: string;
  idleFg: string;
}

export function dropdownMenuItemStyleContext(
  theme: RemocnTheme,
): DropdownMenuItemStyleContext {
  return {
    idleBg: theme.popover,
    hoverBg: theme.accent,
    pressBg: mixOklch(theme.accent, theme.foreground, 0.08),
    idleFg: theme.popoverForeground,
  };
}

export function dropdownMenuItemStyle(
  state: DropdownMenuItemState,
  ctx: DropdownMenuItemStyleContext,
): DropdownMenuItemStyle {
  switch (state) {
    case "hover":
      return { background: ctx.hoverBg, labelColor: ctx.idleFg, scale: 1 };
    case "press":
      return { background: ctx.pressBg, labelColor: ctx.idleFg, scale: 0.98 };
    default:
      return { background: ctx.idleBg, labelColor: ctx.idleFg, scale: 1 };
  }
}

const ROW_WIDTH = 240;

export interface DropdownMenuItemRowProps {
  style?: DropdownMenuItemStyle;
  state?: DropdownMenuItemState;
  label?: string;
  width?: number;
  theme?: Partial<RemocnTheme>;
}

export function DropdownMenuItemRow({
  style,
  state = "idle",
  label = "Profile",
  width = ROW_WIDTH,
  theme: themeOverride,
}: DropdownMenuItemRowProps) {
  const theme = useRemocnTheme(themeOverride, "light");
  const ctx = dropdownMenuItemStyleContext(theme);
  const v = style ?? dropdownMenuItemStyle(state, ctx);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        width,
        padding: "8px 12px",
        borderRadius: theme.radius,
        background: v.background,
        color: v.labelColor,
        transform: `scale(${v.scale})`,
        fontSize: 14,
        letterSpacing: "-0.01em",
        boxSizing: "border-box",
      }}
    >
      <span>{label}</span>
    </div>
  );
}

export interface DropdownMenuItemProps extends DropdownMenuItemRowProps {
  className?: string;
}

export function DropdownMenuItem({
  style,
  state = "idle",
  label = "Profile",
  width = ROW_WIDTH,
  theme: themeOverride,
  className,
}: DropdownMenuItemProps) {
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <DropdownMenuItemRow
        style={style}
        state={state}
        label={label}
        width={width}
        theme={themeOverride}
      />
    </div>
  );
}
