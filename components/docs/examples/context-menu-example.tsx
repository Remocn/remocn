"use client";

import { Cursor } from "@/registry/remocn-ui/cursor";
import { useCursorPath } from "@/registry/remocn-ui/cursor/use-cursor-path";
import { ContextMenu } from "@/registry/remocn-ui/context-menu";
import { useContextMenuTransition } from "@/registry/remocn-ui/context-menu/use-context-menu-transition";
import { useDropdownMenuItemTransition } from "@/registry/remocn-ui/dropdown-menu-item/use-dropdown-menu-item-transition";
import { useCurrentState } from "@/lib/remocn-ui";

// The cursor right-clicks near the center of the file card.
// The context menu opens AT this point (its top-left corner = click position).
const CLICK_X = 660;
const CLICK_Y = 385;
// Row 1 ("Reload") sits ~one row + paddings below the menu's top-left and
// ~a third across the 200px panel — the cursor travels here to select it.
const ROW1_X = CLICK_X + 70;
const ROW1_Y = CLICK_Y + 60;

export const ContextMenuExampleScene = () => {
  // Cursor: park → ease to card → right-click → move DOWN onto row 1 → click it → leave.
  const cursorStyle = useCursorPath([
    { at: 0,   x: 80,      y: 60  },
    { at: 30,  x: CLICK_X, y: CLICK_Y, duration: 26 },
    { at: 42,  x: CLICK_X, y: CLICK_Y, click: true, duration: 0 },
    { at: 58,  x: ROW1_X,  y: ROW1_Y,  duration: 14 },
    { at: 72,  x: ROW1_X,  y: ROW1_Y,  click: true, duration: 0 },
    { at: 104, x: ROW1_X + 180, y: ROW1_Y + 80, duration: 20 },
  ]);

  // Menu: opens just after the right-click, closes after the row interaction.
  const menuStyle = useContextMenuTransition([
    { at: 44,  state: "opened", duration: 10 },
    { at: 92,  state: "closed", duration: 10 },
  ]);

  // Row 1 ("Reload"): idle → hover → press → idle.
  const rowState = useCurrentState(
    [
      { at: 60, state: "hover" },
      { at: 72, state: "press" },
      { at: 82, state: "idle"  },
    ],
    "idle",
  );
  const rowStyle = useDropdownMenuItemTransition([{ at: 0, state: rowState }]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* File card — the target the cursor right-clicks on. */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 200,
          padding: "16px 20px",
          background: "oklch(0.97 0 0)",
          border: "1px solid oklch(0.9 0 0)",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
            stroke="oklch(0.55 0 0)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M14 2v6h6" stroke="oklch(0.55 0 0)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: 14, fontWeight: 500, color: "oklch(0.3 0 0)" }}>
          report.pdf
        </span>
      </div>

      {/* Context menu anchored at the cursor click point (top-left = click position). */}
      <div
        style={{
          position: "absolute",
          left: CLICK_X,
          top: CLICK_Y,
        }}
      >
        <ContextMenu
          style={menuStyle}
          itemStyles={[undefined, rowStyle, undefined, undefined]}
        />
      </div>

      <Cursor style={cursorStyle} variant="pointer" />
    </div>
  );
};

export const contextMenuExampleCode = `import { Cursor } from "@/components/remocn/cursor";
import { useCursorPath } from "@/components/remocn/use-cursor-path";
import { ContextMenu } from "@/components/remocn/context-menu";
import { useContextMenuTransition } from "@/components/remocn/use-context-menu-transition";
import { useDropdownMenuItemTransition } from "@/components/remocn/use-dropdown-menu-item-transition";
import { useCurrentState } from "@/lib/remocn-ui";

// The context menu's top-left corner sits at the cursor click point.
const CLICK_X = 340;
const CLICK_Y = 200;
// Row 1 ("Reload"): ~one row + paddings down, ~a third across the 200px panel.
const ROW1_X = CLICK_X + 70;
const ROW1_Y = CLICK_Y + 60;

export const Scene = () => {
  // Cursor eases to the card, right-clicks, then moves down onto row 1 and clicks it.
  const cursorStyle = useCursorPath([
    { at: 0,   x: 80,      y: 60      },
    { at: 30,  x: CLICK_X, y: CLICK_Y, duration: 26 },
    { at: 42,  x: CLICK_X, y: CLICK_Y, click: true, duration: 0 },
    { at: 58,  x: ROW1_X,  y: ROW1_Y,  duration: 14 },
    { at: 72,  x: ROW1_X,  y: ROW1_Y,  click: true, duration: 0 },
    { at: 104, x: ROW1_X + 180, y: ROW1_Y + 80, duration: 20 },
  ]);

  // Menu opens at the click point, closes after the row interaction.
  const menuStyle = useContextMenuTransition([
    { at: 44,  state: "opened", duration: 10 },
    { at: 92,  state: "closed", duration: 10 },
  ]);

  // Animate row 1 ("Reload"): idle → hover → press → idle.
  const rowState = useCurrentState(
    [
      { at: 60, state: "hover" },
      { at: 72, state: "press" },
      { at: 82, state: "idle"  },
    ],
    "idle",
  );
  const rowStyle = useDropdownMenuItemTransition([{ at: 0, state: rowState }]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* File card — right-click target */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 200,
          padding: "16px 20px",
          background: "oklch(0.97 0 0)",
          border: "1px solid oklch(0.9 0 0)",
          borderRadius: 10,
        }}
      >
        report.pdf
      </div>

      {/* Context menu positioned at the click point — caller owns placement. */}
      <div style={{ position: "absolute", left: CLICK_X, top: CLICK_Y }}>
        <ContextMenu
          style={menuStyle}
          itemStyles={[undefined, rowStyle, undefined, undefined]}
        />
      </div>

      <Cursor style={cursorStyle} variant="pointer" />
    </div>
  );
};`;
