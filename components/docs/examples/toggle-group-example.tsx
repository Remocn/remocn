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
const YEARLY_X = 684;
const TOGGLE_Y = 360;

export type ToggleGroupExampleProps = Record<string, never>;

export const toggleGroupExampleControls = [] as const;

export const ToggleGroupExampleScene = (_p: ToggleGroupExampleProps = {}) => {
  // Cursor: park → ease to "Yearly" → click → ease to "Monthly" → click.
  const cursorStyle = useCursorPath([
    { at: 0, x: 80, y: 60 },
    { at: 32, x: YEARLY_X, y: TOGGLE_Y, duration: 28 },
    { at: 44, x: YEARLY_X, y: TOGGLE_Y, click: true, duration: 0 },
    { at: 80, x: MONTHLY_X, y: TOGGLE_Y, duration: 20 },
    { at: 90, x: MONTHLY_X, y: TOGGLE_Y, click: true, duration: 0 },
  ]);

  // Toggle: starts on "Monthly", slides to "Yearly" on first click, back on second.
  const toggleStyle = useToggleGroupTransition([
    { at: 46, state: "Yearly", duration: 14 },
    { at: 92, state: "Monthly", duration: 14 },
  ]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* ToggleGroup renders position:absolute;inset:0 — it centers itself. */}
      <ToggleGroup style={toggleStyle} />
      <Cursor style={cursorStyle} variant="pointer" />
    </div>
  );
};

export const toggleGroupExampleCode = (
  _values: Record<string, unknown> = {},
): string => {
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
  ]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <ToggleGroup style={toggleStyle} />
      <Cursor style={cursorStyle} variant="pointer" />
    </div>
  );
};`;
};
