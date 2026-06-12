"use client";

import { Cursor } from "@/registry/remocn-ui/cursor";
import { useCursorPath } from "@/registry/remocn-ui/cursor/use-cursor-path";
import { Button } from "@/registry/remocn-ui/button";
import { useButtonTransition } from "@/registry/remocn-ui/button/use-button-transition";
import { Tooltip } from "@/registry/remocn-ui/tooltip";
import { useTooltipTransition } from "@/registry/remocn-ui/tooltip/use-tooltip-transition";

// Cursor tip lands at the button center.
const BTN_X = 620;
const BTN_Y = 360;

// Cursor parks away from button after tooltip dismisses.
const AWAY_X = 200;
const AWAY_Y = 200;

export const tooltipExampleControls = [
  "label", "mode",
] as const;

export interface TooltipExampleProps {
  label?: string;
  mode?: "light" | "dark";
}

export const TooltipExampleScene = (p: TooltipExampleProps = {}) => {
  // Cursor: park top-left → ease onto button (arrives 28) → hover →
  // move away at frame 90 (arrives 110).
  const cursorStyle = useCursorPath([
    { at: 0, x: 80, y: 60 },
    { at: 28, x: BTN_X, y: BTN_Y, duration: 24 },
    { at: 110, x: AWAY_X, y: AWAY_Y, duration: 20 },
  ]);

  // Button: idle → hover as cursor arrives, back to idle as cursor leaves.
  const buttonStyle = useButtonTransition(
    [
      { at: 28, state: "hover", duration: 8 },
      { at: 100, state: "idle", duration: 8 },
    ],
    { mode: p.mode },
  );

  // Tooltip: fades in shortly after cursor arrives, fades out as cursor leaves.
  const tooltipStyle = useTooltipTransition(
    [
      { at: 36, state: "visible", duration: 8 },
      { at: 100, state: "hidden", duration: 8 },
    ],
    { mode: p.mode },
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Anchor — the button is centered in the canvas. */}
      <div
        style={{
          width: "100%",
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Button label="Hover me" style={buttonStyle} mode={p.mode ?? "light"} />

        {/* Tooltip is anchored relative to the button: centered above it. */}
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 32px)",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <Tooltip
            label={p.label ?? "Add to library"}
            side="top"
            mode={p.mode ?? "light"}
            style={tooltipStyle}
          />
        </div>
      </div>

      <Cursor style={cursorStyle} variant="pointer" />
    </div>
  );
};

export const tooltipExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const label = values.label as string | undefined;
  const mode = values.mode as string | undefined;

  const labelStr = label ?? "Add to library";
  const hookOpts: string[] = [];
  if (mode !== undefined && mode !== "light") hookOpts.push(`mode: "${mode}"`);
  const optsStr = hookOpts.length ? `, { ${hookOpts.join(", ")} }` : "";

  const modeStr =
    mode !== undefined && mode !== "light" ? ` mode="${mode}"` : "";

  return `import { Cursor } from "@/components/remocn/cursor";
import { useCursorPath } from "@/components/remocn/use-cursor-path";
import { Button } from "@/components/remocn/button";
import { useButtonTransition } from "@/components/remocn/use-button-transition";
import { Tooltip } from "@/components/remocn/tooltip";
import { useTooltipTransition } from "@/components/remocn/use-tooltip-transition";

const BTN_X = 320;
const BTN_Y = 180;
const AWAY_X = 100;
const AWAY_Y = 100;

export const Scene = () => {
  // Cursor eases onto the button, triggers a hover + tooltip, then leaves.
  const cursorStyle = useCursorPath([
    { at: 0,   x: 80,    y: 60    },
    { at: 28,  x: BTN_X, y: BTN_Y, duration: 24 },
    { at: 110, x: AWAY_X, y: AWAY_Y, duration: 20 },
  ]);

  // Button responds to the cursor arriving and leaving.
  const buttonStyle = useButtonTransition(
    [
      { at: 28,  state: "hover", duration: 8 },
      { at: 100, state: "idle",  duration: 8 },
    ]${optsStr},
  );

  // Tooltip fades in shortly after hover, then fades out as cursor leaves.
  const tooltipStyle = useTooltipTransition(
    [
      { at: 36,  state: "visible", duration: 8 },
      { at: 100, state: "hidden",  duration: 8 },
    ]${optsStr},
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Button label="Hover me" style={buttonStyle}${modeStr} />

        {/* Tooltip sits above the button; the caller owns the anchor position. */}
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 32px)",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <Tooltip label="${labelStr}" side="top"${modeStr} style={tooltipStyle} />
        </div>
      </div>

      <Cursor style={cursorStyle} variant="pointer" />
    </div>
  );
};`;
};
