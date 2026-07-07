"use client";

import { Cursor } from "@/registry/remocn-ui/cursor";
import { useCursorPath } from "@/registry/remocn-ui/cursor/use-cursor-path";
import type { ResizableDirection } from "@/registry/remocn-ui/resizable";
import { Resizable } from "@/registry/remocn-ui/resizable";
import { useResizableTransition } from "@/registry/remocn-ui/resizable/use-resizable-transition";

const X_CENTER = 640;
const X_RIGHT = 750;
const X_LEFT = 530;
const HANDLE_Y = 360;

export interface ResizableExampleProps {
  direction?: ResizableDirection;
}

export const resizableExampleControls = ["direction"] as const;

export const ResizableExampleScene = (p: ResizableExampleProps = {}) => {
  const cursorStyle = useCursorPath([
    { at: 0, x: 80, y: 60 },
    { at: 32, x: X_CENTER, y: HANDLE_Y, duration: 28 },
    { at: 44, x: X_CENTER, y: HANDLE_Y, press: true, duration: 0 },
    { at: 84, x: X_RIGHT, y: HANDLE_Y, press: true, duration: 40 },
    { at: 132, x: X_LEFT, y: HANDLE_Y, press: true, duration: 48 },
    { at: 176, x: X_CENTER, y: HANDLE_Y, press: true, duration: 44 },
    { at: 184, x: X_CENTER, y: HANDLE_Y, duration: 0 },
  ]);

  const resizableStyle = useResizableTransition([
    { at: 0, ratio: 0.5, handleState: "idle" },
    { at: 32, handleState: "hover", duration: 8 },
    { at: 46, handleState: "press", duration: 4 },
    { at: 44, ratio: 0.5 },
    { at: 84, ratio: 0.75, duration: 40, easing: "inOut" },
    { at: 132, ratio: 0.25, duration: 48, easing: "inOut" },
    { at: 176, ratio: 0.5, duration: 44, easing: "inOut" },
    { at: 184, handleState: "idle", duration: 8 },
  ]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Resizable
        style={resizableStyle}
        direction={p.direction ?? "horizontal"}
      />
      <Cursor style={cursorStyle} variant="pointer" />
    </div>
  );
};

export const resizableExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const direction = values.direction as string | undefined;

  const props: string[] = [];
  if (direction !== undefined && direction !== "horizontal")
    props.push(`direction="${direction}"`);
  const resizableExtraProps = props.length
    ? `\n      ${props.join("\n      ")}\n      `
    : "";

  return `import { Cursor } from "@/components/remocn/cursor";
import { useCursorPath } from "@/components/remocn/use-cursor-path";
import { Resizable } from "@/components/remocn/resizable";
import { useResizableTransition } from "@/components/remocn/use-resizable-transition";

const X_CENTER = 640;
const X_RIGHT = 750;
const X_LEFT = 530;
const HANDLE_Y = 360;

export const Scene = () => {

  const cursorStyle = useCursorPath([
    { at: 0,   x: 80,       y: 60       },
    { at: 32,  x: X_CENTER, y: HANDLE_Y, duration: 28 },
    { at: 44,  x: X_CENTER, y: HANDLE_Y, press: true, duration: 0 },
    { at: 84,  x: X_RIGHT,  y: HANDLE_Y, press: true, duration: 40 },
    { at: 132, x: X_LEFT,   y: HANDLE_Y, press: true, duration: 48 },
    { at: 176, x: X_CENTER, y: HANDLE_Y, press: true, duration: 44 },
    { at: 184, x: X_CENTER, y: HANDLE_Y, duration: 0 },
  ]);

  const resizableStyle = useResizableTransition([
    { at: 0,   ratio: 0.5, handleState: "idle"  },
    { at: 32,  handleState: "hover", duration: 8  },
    { at: 46,  handleState: "press", duration: 4  },
    { at: 44,  ratio: 0.5 },
    { at: 84,  ratio: 0.75, duration: 40, easing: "inOut" },
    { at: 132, ratio: 0.25, duration: 48, easing: "inOut" },
    { at: 176, ratio: 0.5,  duration: 44, easing: "inOut" },
    { at: 184, handleState: "idle", duration: 8 },
  ]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Resizable${resizableExtraProps}style={resizableStyle} />
      <Cursor style={cursorStyle} variant="pointer" />
    </div>
  );
};`;
};
