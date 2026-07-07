"use client";

import { Button } from "@/registry/remocn-ui/button";
import { useButtonTransition } from "@/registry/remocn-ui/button/use-button-transition";
import { Cursor } from "@/registry/remocn-ui/cursor";
import { useCursorPath } from "@/registry/remocn-ui/cursor/use-cursor-path";
import { Toast } from "@/registry/remocn-ui/toast";
import { useToastTransition } from "@/registry/remocn-ui/toast/use-toast-transition";

// Button is centered in the preview canvas; cursor starts top-left and clicks it.
const BTN_X = 620; // cursor tip target X (the pointer hotspot lands here)
const BTN_Y = 360; // cursor tip target Y

export const toastExampleControls = [
  "title",
  "description",
  "variant",
] as const;

export interface ToastExampleProps {
  title?: string;
  description?: string;
  variant?: "default" | "success" | "error";
}

export const ToastExampleScene = (p: ToastExampleProps = {}) => {
  // Cursor: park top-left → ease onto button (arrives 40) → click at 68.
  const cursorStyle = useCursorPath([
    { at: 0, x: 80, y: 60 },
    { at: 40, x: BTN_X, y: BTN_Y, duration: 28 },
    { at: 68, x: BTN_X, y: BTN_Y, click: true, duration: 0 },
  ]);

  // Button: idle → hover (cursor on button) → press → idle after click.
  // The click lands at 68; press starts just before so the dip is visible.
  const buttonStyle = useButtonTransition([
    { at: 40, state: "hover", duration: 16 },
    { at: 62, state: "press", duration: 8 },
    { at: 76, state: "idle", duration: 10 },
  ]);

  // Toast: slides in from below right after the click, holds ~60 frames, then
  // auto-dismisses. DEFAULT_DURATION is 12; explicit durations here are clear.
  const toastStyle = useToastTransition([
    { at: 84, state: "visible", duration: 12 },
    { at: 144, state: "hidden", duration: 12 },
  ]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Button centered in canvas */}
      <div
        style={{
          width: "100%",
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Button label="Show toast" style={buttonStyle} />
      </div>

      {/* Toast anchored bottom-right, 24px from edges */}
      <div
        style={{
          position: "absolute",
          right: 24,
          bottom: 24,
        }}
      >
        <Toast
          title={p.title ?? "Changes saved"}
          description={p.description ?? "Your profile has been updated."}
          variant={p.variant ?? "success"}
          style={toastStyle}
        />
      </div>

      <Cursor style={cursorStyle} variant="pointer" />
    </div>
  );
};

export const toastExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const title = values.title as string | undefined;
  const description = values.description as string | undefined;
  const variant = values.variant as string | undefined;

  const toastProps: string[] = [];
  if (title !== undefined && title !== "Changes saved")
    toastProps.push(`title="${title}"`);
  if (
    description !== undefined &&
    description !== "Your profile has been updated."
  )
    toastProps.push(`description="${description}"`);
  if (variant !== undefined && variant !== "success")
    toastProps.push(`variant="${variant}"`);

  const toastPropsStr = toastProps.length
    ? `\n          ${toastProps.join("\n          ")}\n        `
    : "";

  return `import { Cursor } from "@/components/remocn/cursor";
import { useCursorPath } from "@/components/remocn/use-cursor-path";
import { Button } from "@/components/remocn/button";
import { useButtonTransition } from "@/components/remocn/use-button-transition";
import { Toast } from "@/components/remocn/toast";
import { useToastTransition } from "@/components/remocn/use-toast-transition";

const BTN_X = 320;
const BTN_Y = 180;

export const Scene = () => {
  // Cursor moves to the button and clicks it at frame 68.
  const cursorStyle = useCursorPath([
    { at: 0,  x: 80,  y: 60 },
    { at: 40, x: BTN_X, y: BTN_Y, duration: 28 },
    { at: 68, x: BTN_X, y: BTN_Y, click: true, duration: 0 },
  ]);

  // Button responds to the cursor: hover → press → back to idle.
  const buttonStyle = useButtonTransition([
    { at: 40, state: "hover",   duration: 16 },
    { at: 62, state: "press",   duration: 8  },
    { at: 76, state: "idle",    duration: 10 },
  ]);

  // Toast slides in after the click, holds ~60 frames, then auto-dismisses.
  const toastStyle = useToastTransition([
    { at: 84,  state: "visible", duration: 12 },
    { at: 144, state: "hidden",  duration: 12 },
  ]);

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
        <Button label="Show toast" style={buttonStyle} />
      </div>

      <div style={{ position: "absolute", right: 24, bottom: 24 }}>
        <Toast${toastPropsStr === "" ? '\n          title="Changes saved"\n          description="Your profile has been updated."\n          variant="success"\n        ' : toastPropsStr}style={toastStyle} />
      </div>

      <Cursor style={cursorStyle} variant="pointer" />
    </div>
  );
};`;
};
