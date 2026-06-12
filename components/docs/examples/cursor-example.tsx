"use client";

import { Cursor } from "@/registry/remocn-ui/cursor";
import { useCursorPath } from "@/registry/remocn-ui/cursor/use-cursor-path";
import { Button } from "@/registry/remocn-ui/button";
import { useButtonTransition } from "@/registry/remocn-ui/button/use-button-transition";

const BTN_X = 620; // cursor tip target X (the pointer hotspot lands here)
const BTN_Y = 360; // cursor tip target Y

export interface CursorExampleProps {
  variant?: "arrow" | "pointer";
  size?: number;
  rippleColor?: string;
  mode?: "light" | "dark";
}

export const cursorExampleControls = [
  "variant",
  "size",
  "rippleColor",
  "mode",
] as const;

export const CursorExampleScene = (p: CursorExampleProps = {}) => {
  const cursorStyle = useCursorPath([
    { at: 0, x: 80, y: 60 },
    { at: 40, x: BTN_X, y: BTN_Y, duration: 28 },
    { at: 72, x: BTN_X, y: BTN_Y, click: true, duration: 0 },
  ]);

  const buttonStyle = useButtonTransition(
    [
      { at: 40, state: "hover", duration: 16 },
      { at: 68, state: "press", duration: 8 },
      { at: 76, state: "loading", duration: 6 },
      { at: 108, state: "success", duration: 16 },
    ],
    { mode: p.mode },
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
        <Button label="Continue" style={buttonStyle} mode={p.mode ?? "light"} />
      </div>
      <Cursor
        style={cursorStyle}
        variant={p.variant ?? "arrow"}
        size={p.size ?? 28}
        rippleColor={p.rippleColor}
        mode={p.mode ?? "light"}
      />
    </div>
  );
};

export const cursorExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const variant = values.variant as string | undefined;
  const size = values.size as number | undefined;
  const rippleColor = values.rippleColor as string | undefined;
  const mode = values.mode as string | undefined;

  // Button trigger keeps just `mode`; the <Cursor> shows the full honored set.
  const modeStr = mode !== undefined && mode !== "light" ? ` mode="${mode}"` : "";

  const cursorProps: string[] = [];
  if (variant !== undefined && variant !== "arrow")
    cursorProps.push(`variant="${variant}"`);
  if (size !== undefined && size !== 28) cursorProps.push(`size={${size}}`);
  if (rippleColor !== undefined && rippleColor !== "#171717")
    cursorProps.push(`rippleColor="${rippleColor}"`);
  if (mode !== undefined && mode !== "light") cursorProps.push(`mode="${mode}"`);
  const cursorPropsStr = cursorProps.length ? ` ${cursorProps.join(" ")}` : "";

  const hookOpts: string[] = [];
  if (mode !== undefined && mode !== "light") hookOpts.push(`mode: "${mode}"`);
  const optsStr = hookOpts.length ? `, { ${hookOpts.join(", ")} }` : "";

  return `import { Cursor } from "@/components/remocn/cursor";
import { useCursorPath } from "@/components/remocn/use-cursor-path";
import { Button } from "@/components/remocn/button";
import { useButtonTransition } from "@/components/remocn/use-button-transition";

const BTN_X = 280;
const BTN_Y = 160;

export const Scene = () => {
  // The cursor is value-channel driven: useCursorPath reads the frame and
  // returns the animated CursorStyle; <Cursor> itself stays pure.
  const cursorStyle = useCursorPath([
    { at: 0, x: 80, y: 60 },
    { at: 40, x: BTN_X, y: BTN_Y, duration: 28 },
    { at: 72, x: BTN_X, y: BTN_Y, click: true, duration: 0 },
  ]);

  // Button timeline is frame-synced with the cursor path above.
  const buttonStyle = useButtonTransition([
    { at: 40, state: "hover", duration: 16 },
    { at: 68, state: "press", duration: 8 },
    { at: 76, state: "loading", duration: 6 },
    { at: 108, state: "success", duration: 16 },
  ]${optsStr});

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
        <Button label="Continue" style={buttonStyle}${modeStr} />
      </div>
      <Cursor style={cursorStyle}${cursorPropsStr} />
    </div>
  );
};`;
};
