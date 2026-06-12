"use client";

import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";
import {
  CommandMenuItemRow,
  commandMenuItemStyle,
  commandMenuItemStyleContext,
  type CommandMenuIcon,
  type CommandMenuItemState,
  type CommandMenuItemStyle,
  type CommandMenuItemStyleContext,
} from "@/components/remocn/command-menu-item";

export type CommandMenuState = "opened" | "closed";

export interface CommandMenuEntry {
  icon?: CommandMenuIcon;
  label: string;
  shortcut?: string;
}

export interface CommandMenuProps {
  state?: CommandMenuState;
  style?: CommandMenuStyle;
  query?: string;
  revealCount?: number;
  items?: CommandMenuEntry[];
  selectedIndex?: number;
  highlightedIndex?: number;
  pressedIndex?: number;
  itemStyles?: (CommandMenuItemStyle | undefined)[];
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  className?: string;
}

const PANEL_WIDTH = 440;
const CONTENT_WIDTH = PANEL_WIDTH - 16;
const MAX_OVERLAY_ALPHA = 0.5;

export function filterCommandItems(
  items: CommandMenuEntry[],
  query: string,
  revealCount?: number,
): CommandMenuEntry[] {
  const visible = (
    revealCount === undefined ? query : query.slice(0, revealCount)
  )
    .trim()
    .toLowerCase();
  if (visible === "") return items;
  return items.filter((item) => item.label.toLowerCase().includes(visible));
}

export interface CommandMenuStyle {
  backdropOpacity: number;
  panelOpacity: number;
  panelScale: number;
  panelTranslateY: number;
}

export interface CommandMenuStyleContext {
  panelBg: string;
  panelBorder: string;
  inputFg: string;
  placeholderFg: string;
  mutedFg: string;
  divider: string;
  caret: string;
  radius: number;
  itemCtx: CommandMenuItemStyleContext;
}

export function commandMenuStyleContext(
  theme: RemocnTheme,
): CommandMenuStyleContext {
  return {
    panelBg: theme.popover,
    panelBorder: theme.border,
    inputFg: theme.popoverForeground,
    placeholderFg: theme.mutedForeground,
    mutedFg: theme.mutedForeground,
    divider: theme.border,
    caret: theme.foreground,
    radius: theme.radius,
    itemCtx: commandMenuItemStyleContext(theme),
  };
}

export function commandMenuStyle(
  state: CommandMenuState,
  _ctx: CommandMenuStyleContext,
): CommandMenuStyle {
  switch (state) {
    case "opened":
      return {
        backdropOpacity: 1,
        panelOpacity: 1,
        panelScale: 1,
        panelTranslateY: 0,
      };
    default:
      return {
        backdropOpacity: 0,
        panelOpacity: 0,
        panelScale: 0.96,
        panelTranslateY: 8,
      };
  }
}

function rowState(
  i: number,
  selectedIndex: number,
  highlightedIndex: number,
  pressedIndex: number,
): CommandMenuItemState {
  if (i === pressedIndex) return "press";
  if (i === selectedIndex) return "selected";
  if (i === highlightedIndex) return "hover";
  return "idle";
}

export function CommandMenu({
  state = "closed",
  style,
  query = "",
  revealCount,
  items = [
    { icon: "user", label: "Profile", shortcut: "⌘ P" },
    { icon: "settings", label: "Settings", shortcut: "⌘ S" },
    { icon: "file", label: "New File", shortcut: "⌘ N" },
    { icon: "search", label: "Search docs" },
  ],
  selectedIndex = -1,
  highlightedIndex = -1,
  pressedIndex = -1,
  itemStyles,
  theme: themeOverride,
  mode,
  className,
}: CommandMenuProps) {
  const theme = useRemocnTheme(themeOverride, mode);
  const ctx = commandMenuStyleContext(theme);
  const v = style ?? commandMenuStyle(state, ctx);

  const visibleQuery =
    revealCount === undefined ? query : query.slice(0, revealCount);
  const filtered = filterCommandItems(items, query, revealCount);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "18%",
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `rgba(0, 0, 0, ${MAX_OVERLAY_ALPHA * v.backdropOpacity})`,
        }}
      />
      <div
        className={className}
        style={{
          position: "relative",
          width: PANEL_WIDTH,
          boxSizing: "border-box",
          transformOrigin: "top",
          transform: `translateY(${v.panelTranslateY}px) scale(${v.panelScale})`,
          opacity: v.panelOpacity,
          background: ctx.panelBg,
          border: `1px solid ${ctx.panelBorder}`,
          borderRadius: ctx.radius + 6,
          padding: 8,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 48px -12px rgba(0,0,0,0.25)",
        }}
      >
        {}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 10px",
          }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <path
              d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-3.5-3.5"
              stroke={ctx.mutedFg}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 15,
              letterSpacing: "-0.01em",
              color: visibleQuery ? ctx.inputFg : ctx.placeholderFg,
            }}
          >
            {visibleQuery || "Type a command or search…"}
            {}
            <span
              style={{
                display: "inline-block",
                width: 1.5,
                height: 18,
                marginLeft: 1,
                background: ctx.caret,
              }}
            />
          </span>
        </div>
        {}
        <div
          style={{
            height: 1,
            background: ctx.divider,
            margin: "4px 0",
          }}
        />
        {}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            padding: "4px 0",
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "20px 12px",
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
                <CommandMenuItemRow
                  key={item.label}
                  style={
                    override ??
                    commandMenuItemStyle(
                      rowState(
                        i,
                        selectedIndex,
                        highlightedIndex,
                        pressedIndex,
                      ),
                      ctx.itemCtx,
                    )
                  }
                  ctx={ctx.itemCtx}
                  label={item.label}
                  icon={item.icon}
                  shortcut={item.shortcut}
                  width={CONTENT_WIDTH}
                  radius={theme.radius}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
