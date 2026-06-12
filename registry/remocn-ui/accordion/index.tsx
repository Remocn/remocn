"use client";

import { mixOklch, type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type AccordionState = "opened" | "closed";

type AccordionVariant = "default" | "ghost";

export interface AccordionProps {
  state?: AccordionState;
  style?: AccordionStyle;
  title?: string;
  content?: string;
  contentHeight?: number;
  variant?: AccordionVariant;
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  className?: string;
}

const CARD_WIDTH = 440;

interface VariantTokens {
  bordered: boolean;
  closedBg: string;
  openBg: string;
}

function variantTokens(
  variant: AccordionVariant,
  theme: RemocnTheme,
): VariantTokens {
  const variants = {
    ghost: {
      bordered: false,
      closedBg: theme.background,
      openBg: mixOklch(theme.background, theme.muted, 0.25),
    },
    default: {
      bordered: true,
      closedBg: theme.background,
      openBg: mixOklch(theme.background, theme.muted, 0.5),
    },
  };

  return variants[variant] ?? variants.default;
}

export interface AccordionStyle {
  panelHeight: number;
  panelOpacity: number;
  chevronRotation: number;
  background: string;
}

export interface AccordionStyleContext {
  bordered: boolean;
  closedBg: string;
  openBg: string;
  border: string;
  foreground: string;
  mutedForeground: string;
}

export function accordionStyleContext(
  variant: AccordionVariant,
  theme: RemocnTheme,
): AccordionStyleContext {
  const tokens = variantTokens(variant, theme);
  return {
    bordered: tokens.bordered,
    closedBg: tokens.closedBg,
    openBg: tokens.openBg,
    border: theme.border,
    foreground: theme.foreground,
    mutedForeground: theme.mutedForeground,
  };
}

export function accordionStyle(
  state: AccordionState,
  ctx: AccordionStyleContext,
): AccordionStyle {
  switch (state) {
    case "opened":
      return {
        panelHeight: 1,
        panelOpacity: 1,
        chevronRotation: 180,
        background: ctx.openBg,
      };
    default:
      return {
        panelHeight: 0,
        panelOpacity: 0,
        chevronRotation: 0,
        background: ctx.closedBg,
      };
  }
}

export function Accordion({
  state = "closed",
  style,
  title = "Is it accessible?",
  content = "Yes. It adheres to the WAI-ARIA design pattern.",
  contentHeight = 64,
  variant = "default",
  theme: themeOverride,
  mode,
  className,
}: AccordionProps) {
  const theme = useRemocnTheme(themeOverride, mode);

  const ctx = accordionStyleContext(variant, theme);
  const v = style ?? accordionStyle(state, ctx);

  return (
    <div
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
      <div
        className={className}
        style={{
          width: CARD_WIDTH,
          background: v.background,
          border: ctx.bordered
            ? `1px solid ${ctx.border}`
            : "1px solid transparent",
          borderRadius: theme.radius,
          overflow: "hidden",
        }}
      >
        {}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            padding: 16,
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            color: ctx.foreground,
          }}
        >
          <span>{title}</span>
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
              stroke={ctx.mutedForeground}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {}
        <div
          style={{
            height: contentHeight * v.panelHeight,
            opacity: v.panelOpacity,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "0 16px 16px",
              fontSize: 14,
              lineHeight: 1.5,
              color: ctx.mutedForeground,
            }}
          >
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}
