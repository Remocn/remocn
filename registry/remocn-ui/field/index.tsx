"use client";

import type { CSSProperties, ReactNode } from "react";
import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

/**
 * Field — a small, static layout family for composing labeled form controls,
 * modeled on shadcn's Field (FieldGroup ▸ Field ▸ FieldLabel / control /
 * FieldDescription). It reads no frame and holds no state; colors come from the
 * resolved theme. Stack note: remocn-ui controls (Input, Button) render
 * `position:absolute; inset:0`, so a control goes inside `FieldControl` — a
 * relative, fixed-height slot the absolute atom fills.
 */

export interface FieldGroupProps {
  children: ReactNode;
  /** Vertical space (px) between stacked fields. */
  gap?: number;
  style?: CSSProperties;
}

/** Stacks multiple `Field`s in a column with uniform vertical rhythm. */
export function FieldGroup({ children, gap = 16, style }: FieldGroupProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>
      {children}
    </div>
  );
}

export interface FieldProps {
  children: ReactNode;
  /** Vertical space (px) between the label, control, and description. */
  gap?: number;
  style?: CSSProperties;
}

/** One field: label + control + optional description, stacked. */
export function Field({ children, gap = 6, style }: FieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>
      {children}
    </div>
  );
}

export interface FieldLabelProps {
  children: ReactNode;
  mode?: "light" | "dark";
  theme?: Partial<RemocnTheme>;
  style?: CSSProperties;
}

/** Field label — foreground, medium weight. Single line (predictable height). */
export function FieldLabel({ children, mode, theme, style }: FieldLabelProps) {
  const t = useRemocnTheme(theme, mode);
  return (
    <div
      style={{
        fontSize: 13,
        lineHeight: "18px",
        fontWeight: 500,
        letterSpacing: "-0.01em",
        color: t.foreground,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export interface FieldDescriptionProps {
  children: ReactNode;
  /** Text alignment within the field column. */
  align?: "start" | "center";
  mode?: "light" | "dark";
  theme?: Partial<RemocnTheme>;
  style?: CSSProperties;
}

/** Muted helper text under a control (or a centered footer line). */
export function FieldDescription({
  children,
  align = "start",
  mode,
  theme,
  style,
}: FieldDescriptionProps) {
  const t = useRemocnTheme(theme, mode);
  return (
    <div
      style={{
        fontSize: 12,
        lineHeight: "16px",
        color: t.mutedForeground,
        textAlign: align === "center" ? "center" : "left",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export interface FieldControlProps {
  children: ReactNode;
  /** Slot height (px) — the absolute control fills it. Matches the control's size. */
  height?: number;
  style?: CSSProperties;
}

/**
 * Relative, fixed-height slot for an absolute remocn-ui control (Input/Button,
 * which render `position:absolute; inset:0`). The control fills the slot.
 */
export function FieldControl({ children, height = 40, style }: FieldControlProps) {
  return (
    <div style={{ position: "relative", height, ...style }}>{children}</div>
  );
}
