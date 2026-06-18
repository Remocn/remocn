"use client";

import { Cursor } from "@/registry/remocn-ui/cursor";
import { useCursorPath } from "@/registry/remocn-ui/cursor/use-cursor-path";
import { ToggleGroup } from "@/registry/remocn-ui/toggle-group";
import { useToggleGroupTransition } from "@/registry/remocn-ui/toggle-group/use-toggle-group-transition";

// Default size geometry: pad=4, segMinWidth=88, 2 segments.
// Container width = 4 + 88 + 88 + 4 = 184px. Centered on 1280px canvas:
// left edge = (1280 - 184) / 2 = 548px.
// "Monthly" center X: 548 + 4 + 44 = 596. "Yearly" center X: 548 + 4 + 88 + 44 = 684. Y = 360.
const MONTHLY_X = 596;
const YEARLY_X  = 684;
const TOGGLE_Y  = 360;

export interface ToggleGroupExampleProps {
  mode?: "light" | "dark";
}

export const toggleGroupExampleControls = ["mode"] as const;

export const ToggleGroupExampleScene = (p: ToggleGroupExampleProps = {}) => {
  // Cursor: park → ease to "Yearly" → click → ease to "Monthly" → click.
  const cursorStyle = useCursorPath([
    { at: 0,  x: 80,        y: 60        },
    { at: 32, x: YEARLY_X,  y: TOGGLE_Y, duration: 28 },
    { at: 44, x: YEARLY_X,  y: TOGGLE_Y, click: true, duration: 0 },
    { at: 80, x: MONTHLY_X, y: TOGGLE_Y, duration: 20 },
    { at: 90, x: MONTHLY_X, y: TOGGLE_Y, click: true, duration: 0 },
  ]);

  // Toggle: starts on "Monthly", slides to "Yearly" on first click, back on second.
  // Forward mode so the animated track/segment colors track the theme.
  const toggleStyle = useToggleGroupTransition(
    [
      { at: 46, state: "Yearly",  duration: 14 },
      { at: 92, state: "Monthly", duration: 14 },
    ],
    { mode: p.mode },
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* ToggleGroup renders position:absolute;inset:0 — it centers itself. */}
      <ToggleGroup style={toggleStyle} mode={p.mode ?? "light"} />
      <Cursor style={cursorStyle} variant="pointer" />
    </div>
  );
};

export const toggleGroupExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const mode = values.mode as string | undefined;

  const modeStr = mode !== undefined && mode !== "light" ? ` mode="${mode}"` : "";
  const hookOptsStr =
    mode !== undefined && mode !== "light" ? `, { mode: "${mode}" }` : "";

  return `import { Cursor } from "@/components/remocn/cursor";
import { useCursorPath } from "@/components/remocn/use-cursor-path";
import { ToggleGroup } from "@/components/remocn/toggle-group";
import { useToggleGroupTransition } from "@/components/remocn/use-toggle-group-transition";

// Default size geometry: pad=4, segMinWidth=88, 2 segments → container 184px wide.
// Centered on a 1280×720 canvas; adjust for your own canvas and segment count.
const MONTHLY_X = 596;
const YEARLY_X  = 684;
const TOGGLE_Y  = 360;

export const Scene = () => {
  // Cursor eases to "Yearly", clicks, then eases to "Monthly" and clicks again.
  const cursorStyle = useCursorPath([
    { at: 0,  x: 80,        y: 60       },
    { at: 32, x: YEARLY_X,  y: TOGGLE_Y, duration: 28 },
    { at: 44, x: YEARLY_X,  y: TOGGLE_Y, click: true, duration: 0 },
    { at: 80, x: MONTHLY_X, y: TOGGLE_Y, duration: 20 },
    { at: 90, x: MONTHLY_X, y: TOGGLE_Y, click: true, duration: 0 },
  ]);

  // Toggle slides "Monthly" → "Yearly" → "Monthly", frame-synced with cursor clicks.
  const toggleStyle = useToggleGroupTransition([
    { at: 46, state: "Yearly",  duration: 14 },
    { at: 92, state: "Monthly", duration: 14 },
  ]${hookOptsStr});

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <ToggleGroup style={toggleStyle}${modeStr} />
      <Cursor style={cursorStyle} variant="pointer"${modeStr} />
    </div>
  );
};`;
};
