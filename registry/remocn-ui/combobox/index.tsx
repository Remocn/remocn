"use client";

import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";
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
  /** Current visual state (snap path). State changes snap (no enter-tweens). */
  state?: ComboboxState;
  /**
   * Resolved animated visual (smooth path). When provided, takes precedence over
   * `state` — feed it an interpolated `ComboboxStyle` from `useComboboxTransition`.
   */
  style?: ComboboxStyle;
  /** Full typed query (the visible prefix is `query.slice(0, revealCount)`). */
  query?: string;
  /**
   * Number of query characters revealed so far (the caller computes this with
   * core `revealCount`). Omitted → the whole `query` is shown.
   */
  revealCount?: number;
  /** Trigger placeholder shown before any query is typed. */
  placeholder?: string;
  /** The full option list (before filtering). */
  items?: string[];
  /** Index (into the FILTERED list) of the persisted selection. `-1` for none. */
  selectedIndex?: number;
  /** Index (into the FILTERED list) of the row under the pointer. `-1` for none. */
  highlightedIndex?: number;
  /** Index (into the FILTERED list) of the row being pressed. `-1` for none. */
  pressedIndex?: number;
  /**
   * Per-item resolved visual override (smooth path), indexed into the FILTERED
   * list. When present it wins over the index→state derivation.
   */
  itemStyles?: (SelectItemStyle | undefined)[];
  /**
   * Resolved Input visual for the trigger (smooth path). Drive it with
   * `useInputTransition` for focus-ring + typed-text reveal. Defaults to the
   * resting `idle` look (or `typing` once a query is revealed).
   */
  inputStyle?: InputStyle;
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  className?: string;
}

/** Trigger width = panel width (px). */
const WIDTH = 280;

/**
 * Filter option strings by the visible query prefix. PURE — a case-insensitive
 * substring match on `query.slice(0, revealCount)`. An empty visible prefix
 * matches everything. Exported so tests can mirror it and the example can keep
 * its filtered indices in sync.
 *
 * NOTE: this is intentionally the SAME logic as command-menu's
 * `filterCommandItems` (deliberate duplication — the core is frozen, so the two
 * filters are kept textually parallel rather than extracted). The only
 * difference is the item shape: here `items` are plain strings, so the match is
 * on the string itself rather than an entry `.label`.
 */
export function filterComboboxItems(
  items: string[],
  query: string,
  revealCount?: number,
): string[] {
  const visible = (
    revealCount === undefined ? query : query.slice(0, revealCount)
  )
    .trim()
    .toLowerCase();
  if (visible === "") return items;
  return items.filter((item) => item.toLowerCase().includes(visible));
}

// ===========================================================================
// Combobox visual — the COMPLETE animated look for a moment in time. A `state`
// is a named preset of this visual (`comboboxStyle`); the smooth path feeds an
// interpolated `ComboboxStyle` straight through. The component is a pure renderer
// of whichever `ComboboxStyle` it receives. The trigger reuses the Input
// presets and the panel rows reuse SelectItemRow — neither markup is duplicated.
// ===========================================================================

export interface ComboboxStyle {
  /** Panel fade 0 (closed) → 1 (opened). */
  panelOpacity: number;
  /** Panel zoom 0.96 (closed) → 1 (opened). */
  panelScale: number;
  /** Panel lift -4 (closed) → 0 (opened) px. */
  panelTranslateY: number;
}

/** Concrete colors for the active theme, resolved once per render. */
export interface ComboboxStyleContext {
  /** Input presets — reused so the trigger IS the Input look. */
  triggerCtx: InputStyleContext;
  panelBg: string;
  panelBorder: string;
  mutedFg: string;
  radius: number;
  itemCtx: SelectItemStyleContext;
}

/**
 * Derive the concrete colors for a theme. Pure — call it once and reuse the
 * result for every `comboboxStyle(state, ctx)` preset.
 */
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

/**
 * The COMPLETE resting visual for a state — a pure `(state, ctx) =>
 * ComboboxStyle` map. To change how a state looks, edit one entry.
 */
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

/** Resolve one row's state from the index props (used when no itemStyle override). */
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
    revealCount === undefined ? query : query.slice(0, revealCount);
  const filtered = filterComboboxItems(items, query, revealCount);

  // The trigger reuses the Input visual. Input itself is a full-frame scene
  // (absolute inset:0) and can't nest inline, so — like Select reuses the Button
  // presets for its trigger — the trigger is rendered inline from the Input
  // presets. Defaults to `typing` once a query is revealed, else `idle`; the
  // caller can pass a tweened `inputStyle` (from useInputTransition) instead.
  const trigger: InputStyle =
    inputStyleOverride ??
    inputStyle(visibleQuery ? "typing" : "idle", ctx.triggerCtx);

  // The reveal width tracks the visible query length so the caret sits at its
  // end (headless render can't measure text; ~8px per char is a good monospace-
  // ish estimate for the trigger value).
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
        // OPAQUE wrapper — a combobox is a self-contained widget, not a modal
        // layer (mirrors Select).
        background: theme.background,
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ position: "relative", width: WIDTH }}>
        {/* Trigger — the Input look, rendered inline. */}
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
          {/* Placeholder — hidden the instant the value starts revealing. */}
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
          {/* Value + caret — the typed query. */}
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
        {/* Panel — opacity/scale/lift animate the reveal below the trigger. */}
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
