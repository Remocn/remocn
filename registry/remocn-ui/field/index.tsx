"use client";

import type { CSSProperties, ReactNode } from "react";
import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export interface FieldGroupProps {
  children: ReactNode;
  gap?: number;
  style?: CSSProperties;
}

export function FieldGroup({ children, gap = 16, style }: FieldGroupProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>
      {children}
    </div>
  );
}

export interface FieldProps {
  children: ReactNode;
  gap?: number;
  style?: CSSProperties;
}

export function Field({ children, gap = 6, style }: FieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>
      {children}
    </div>
  );
}

export interface FieldLabelProps {
  children: ReactNode;
  theme?: Partial<RemocnTheme>;
  style?: CSSProperties;
}

export function FieldLabel({ children, theme, style }: FieldLabelProps) {
  const t = useRemocnTheme(theme, "light");
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
  align?: "start" | "center";
  theme?: Partial<RemocnTheme>;
  style?: CSSProperties;
}

export function FieldDescription({
  children,
  align = "start",
  theme,
  style,
}: FieldDescriptionProps) {
  const t = useRemocnTheme(theme, "light");
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
  height?: number;
  style?: CSSProperties;
}

export function FieldControl({
  children,
  height = 40,
  style,
}: FieldControlProps) {
  return (
    <div style={{ position: "relative", height, ...style }}>{children}</div>
  );
}
