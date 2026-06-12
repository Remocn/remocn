"use client";

import { mixOklch, type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type SelectItemState = "idle" | "hover" | "press" | "selected";

export interface SelectItemProps {
  state?: SelectItemState;
  style?: SelectItemStyle;
  label?: string;
  width?: number;
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  className?: string;
}

const ROW_WIDTH = 260;

export interface SelectItemStyle {
  background: string;
  labelColor: string;
  checkOpacity: number;
  scale: number;
}

export interface SelectItemStyleContext {
  idleBg: string;
  hoverBg: string;
  pressBg: string;
  selectedBg: string;
  idleFg: string;
  selectedFg: string;
  check: string;
}

export function selectItemStyleContext(
  theme: RemocnTheme,
): SelectItemStyleContext {
  return {
    idleBg: theme.popover,
    hoverBg: theme.accent,
    pressBg: mixOklch(theme.accent, theme.foreground, 0.08),
    selectedBg: theme.accent,
    idleFg: theme.popoverForeground,
    selectedFg: theme.accentForeground,
    check: theme.primary,
  };
}

export function selectItemStyle(
  state: SelectItemState,
  ctx: SelectItemStyleContext,
): SelectItemStyle {
  switch (state) {
    case "hover":
      return {
        background: ctx.hoverBg,
        labelColor: ctx.idleFg,
        checkOpacity: 0,
        scale: 1,
      };
    case "press":
      return {
        background: ctx.pressBg,
        labelColor: ctx.idleFg,
        checkOpacity: 0,
        scale: 0.98,
      };
    case "selected":
      return {
        background: ctx.selectedBg,
        labelColor: ctx.selectedFg,
        checkOpacity: 1,
        scale: 1,
      };
    default:
      return {
        background: ctx.idleBg,
        labelColor: ctx.idleFg,
        checkOpacity: 0,
        scale: 1,
      };
  }
}

export interface SelectItemRowProps {
  style?: SelectItemStyle;
  state?: SelectItemState;
  ctx: SelectItemStyleContext;
  label: string;
  width: number;
  radius: number;
  check: string;
}

export function SelectItemRow({
  style,
  state = "idle",
  ctx,
  label,
  width,
  radius,
  check,
}: SelectItemRowProps) {
  const v = style ?? selectItemStyle(state, ctx);
  return (
    <div
      className={undefined}
      style={{
        width,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "8px 12px",
        borderRadius: radius,
        transform: `scale(${v.scale})`,
        background: v.background,
        color: v.labelColor,
        fontSize: 14,
        letterSpacing: "-0.01em",
      }}
    >
      <span>{label}</span>
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        style={{ flexShrink: 0, opacity: v.checkOpacity }}
      >
        <path
          d="M5 12.5l4.5 4.5L19 7"
          stroke={check}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function SelectItem({
  state = "idle",
  style,
  label = "Banana",
  width = ROW_WIDTH,
  theme: themeOverride,
  mode,
  className,
}: SelectItemProps) {
  const theme = useRemocnTheme(themeOverride, mode);
  const ctx = selectItemStyleContext(theme);

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
      <SelectItemRow
        style={style}
        state={state}
        ctx={ctx}
        label={label}
        width={width}
        radius={theme.radius}
        check={ctx.check}
      />
    </div>
  );
}
