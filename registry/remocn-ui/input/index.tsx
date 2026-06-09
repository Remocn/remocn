"use client";

import { mixOklch, type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type InputState = "idle" | "hover" | "active" | "typing" | "invalid";

type InputSize = "sm" | "default" | "lg";

export interface InputProps {
  /** Current visual state (snap path). State changes snap (no enter-tweens). */
  state?: InputState;
  /**
   * Resolved animated visual (smooth path). When provided, takes precedence over
   * `state` — feed it an interpolated `InputStyle` from `useInputTransition`.
   */
  style?: InputStyle;
  /** Placeholder text shown while the field is empty (idle/hover/active). */
  placeholder?: string;
  /** The "typed" value revealed in the typing/invalid states. */
  value?: string;
  /**
   * Natural width (px) of the value text at full reveal. Remotion's headless
   * render can't measure text, so the resting width is authored, not measured —
   * the value clips to `valueWidth * valueReveal` and the caret sits at its end.
   */
  valueWidth?: number;
  size?: InputSize;
  theme?: Partial<RemocnTheme>;
  /** Convenience override for the `primary` theme token — merged into `theme`. */
  primary?: string;
  mode?: "light" | "dark";
  className?: string;
}

/** Field width (px) of the rendered input. */
const FIELD_WIDTH = 320;

const SIZE_STYLES: Record<
  InputSize,
  { height: number; padding: number; fontSize: number }
> = {
  sm: { height: 36, padding: 12, fontSize: 13 },
  default: { height: 40, padding: 14, fontSize: 15 },
  lg: { height: 48, padding: 16, fontSize: 17 },
};

// ===========================================================================
// Input visual — the COMPLETE animated look for a moment in time. A `state` is
// a named preset of this visual (`inputStyle`); the smooth path feeds an
// interpolated `InputStyle` straight through. The component is a pure renderer
// of whichever `InputStyle` it receives.
// ===========================================================================

export interface InputStyle {
  /** Animated border color (a concrete color, never "transparent"). */
  borderColor: string;
  /** Animated focus-ring color (concrete; softened toward the page bg). */
  ringColor: string;
  /** Focus-ring spread in px (box-shadow). 0 = no ring. */
  ringWidth: number;
  /** Animated field background (a concrete color, never "transparent"). */
  background: string;
  /** Caret bar opacity 0→1. */
  caretOpacity: number;
  /** Value reveal 0→1; multiplies `valueWidth` to clip the text + place the caret. */
  valueReveal: number;
  /** Placeholder opacity 0→1 (fades out as the value reveals). */
  placeholderOpacity: number;
}

/** Concrete colors for the active theme, resolved once per render. */
export interface InputStyleContext {
  idleBorder: string;
  hoverBorder: string;
  activeBorder: string;
  invalidBorder: string;
  /** Resting focus ring (shadcn `ring/50` — ring mixed halfway to the bg). */
  ring: string;
  invalidRing: string;
  background: string;
  /** Subtle hover wash over the page background. */
  hoverBackground: string;
  foreground: string;
  mutedForeground: string;
}

/**
 * Derive the concrete colors for a theme. Pure — call it once and reuse the
 * result for every `inputStyle(state, ctx)` preset.
 */
export function inputStyleContext(theme: RemocnTheme): InputStyleContext {
  return {
    idleBorder: theme.input,
    hoverBorder: mixOklch(theme.input, theme.foreground, 0.18),
    activeBorder: theme.ring,
    invalidBorder: theme.destructive,
    // shadcn focus ring is `ring/50` — soften toward the page background so the
    // mix has a concrete endpoint (never pass "transparent" to mixOklch).
    ring: mixOklch(theme.background, theme.ring, 0.5),
    invalidRing: mixOklch(theme.background, theme.destructive, 0.4),
    background: theme.background,
    hoverBackground: mixOklch(theme.background, theme.muted, 0.4),
    foreground: theme.foreground,
    mutedForeground: theme.mutedForeground,
  };
}

/**
 * The COMPLETE resting visual for a state — a pure `(state, ctx) => InputStyle`
 * map. To change how a state looks, edit one entry.
 */
export function inputStyle(
  state: InputState,
  ctx: InputStyleContext,
): InputStyle {
  switch (state) {
    case "hover":
      return {
        borderColor: ctx.hoverBorder,
        ringColor: ctx.ring,
        ringWidth: 0,
        background: ctx.hoverBackground,
        caretOpacity: 0,
        valueReveal: 0,
        placeholderOpacity: 1,
      };
    case "active":
      return {
        borderColor: ctx.activeBorder,
        ringColor: ctx.ring,
        ringWidth: 3,
        background: ctx.background,
        caretOpacity: 1,
        valueReveal: 0,
        placeholderOpacity: 1,
      };
    case "typing":
      return {
        borderColor: ctx.activeBorder,
        ringColor: ctx.ring,
        ringWidth: 3,
        background: ctx.background,
        caretOpacity: 1,
        valueReveal: 1,
        placeholderOpacity: 0,
      };
    case "invalid":
      return {
        borderColor: ctx.invalidBorder,
        ringColor: ctx.invalidRing,
        ringWidth: 3,
        background: ctx.background,
        caretOpacity: 0,
        valueReveal: 1,
        placeholderOpacity: 0,
      };
    default:
      return {
        borderColor: ctx.idleBorder,
        ringColor: ctx.ring,
        ringWidth: 0,
        background: ctx.background,
        caretOpacity: 0,
        valueReveal: 0,
        placeholderOpacity: 1,
      };
  }
}

export function Input({
  state = "idle",
  style,
  placeholder = "you@example.com",
  value = "remotion@remocn.dev",
  valueWidth = 168,
  size = "default",
  theme: themeOverride,
  primary,
  mode,
  className,
}: InputProps) {
  const theme = useRemocnTheme(
    { ...themeOverride, ...(primary ? { primary } : {}) },
    mode,
  );

  const sizeStyle = SIZE_STYLES[size];
  const ctx = inputStyleContext(theme);
  const v = style ?? inputStyle(state, ctx);

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
          position: "relative",
          display: "flex",
          alignItems: "center",
          width: FIELD_WIDTH,
          height: sizeStyle.height,
          padding: `0 ${sizeStyle.padding}px`,
          fontSize: sizeStyle.fontSize,
          letterSpacing: "-0.01em",
          background: v.background,
          border: `1px solid ${v.borderColor}`,
          borderRadius: theme.radius,
          // Focus ring — an outset box-shadow that grows from 0 (no ring) to a
          // 3px spread when focused/invalid. Not clipped by overflow.
          boxShadow: `0 0 0 ${v.ringWidth}px ${v.ringColor}`,
        }}
      >
        {/* Placeholder — absolute layer. It vanishes the INSTANT the value
            starts revealing (typing begins), rather than cross-fading, so the
            field never shows placeholder + typed text at once. */}
        <span
          style={{
            position: "absolute",
            left: sizeStyle.padding,
            color: ctx.mutedForeground,
            opacity: v.valueReveal > 0 ? 0 : v.placeholderOpacity,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {placeholder}
        </span>
        {/* Value + caret. The value clips to `valueWidth * valueReveal` — an
            authored width (headless render can't measure text) — so the caret
            sits flush against the end of the revealed text, typewriter-style.
            With no value revealed (the `active` focus state) the value box is
            0-wide, so the caret rests flush at the field's start. The caret is
            shown only by `caretOpacity` (on in `active`/`typing`, off
            otherwise) — never floating away from where the value would be. */}
        <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
          <span
            style={{
              display: "inline-block",
              width: valueWidth * v.valueReveal,
              overflow: "hidden",
              whiteSpace: "nowrap",
              color: ctx.foreground,
            }}
          >
            {value}
          </span>
          <span
            style={{
              flexShrink: 0,
              width: 2,
              height: Math.round(sizeStyle.fontSize * 1.1),
              borderRadius: 1,
              background: ctx.foreground,
              opacity: v.caretOpacity,
            }}
          />
        </div>
      </div>
    </div>
  );
}
