"use client";

import { Cursor } from "@/registry/remocn-ui/cursor";
import { useCursorPath } from "@/registry/remocn-ui/cursor/use-cursor-path";
import { Popover } from "@/registry/remocn-ui/popover";
import { usePopoverTransition } from "@/registry/remocn-ui/popover/use-popover-transition";

// The "@username" chip is centered on the 1280×720 canvas.
const CHIP_X = 640;
const CHIP_Y = 360;

export const PopoverExampleScene = () => {
  // Cursor: park top-left → ease onto the chip → hover → leave.
  const cursorStyle = useCursorPath([
    { at: 0,   x: 80,     y: 60     },
    { at: 28,  x: CHIP_X, y: CHIP_Y, duration: 24 },
    { at: 110, x: 200,    y: 200,    duration: 20 },
  ]);

  // Hover-card popover: opens shortly after the cursor arrives, closes as it leaves.
  const popoverStyle = usePopoverTransition([
    { at: 36,  state: "opened", duration: 10 },
    { at: 100, state: "closed", duration: 10 },
  ]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Anchor — the @username chip centered in the canvas. */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          display: "inline-block",
        }}
      >
        {/* Chip */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 999,
            background: "oklch(0.94 0 0)",
            border: "1px solid oklch(0.87 0 0)",
            fontSize: 14,
            fontWeight: 500,
            fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
            color: "oklch(0.3 0 0)",
            cursor: "default",
          }}
        >
          @alexsmith
        </div>

        {/* Popover anchored above the chip, centered horizontally. */}
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 12px)",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <Popover
            style={popoverStyle}
            side="top"
            width={240}
          >
            {/* Hover-card content: avatar + name + bio */}
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              {/* Avatar placeholder */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  background: "oklch(0.75 0.08 260)",
                  flexShrink: 0,
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
                  }}
                >
                  Alex Smith
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "oklch(0.55 0 0)",
                    fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
                  }}
                >
                  @alexsmith
                </span>
                <span
                  style={{
                    fontSize: 13,
                    lineHeight: 1.4,
                    color: "oklch(0.4 0 0)",
                    marginTop: 4,
                    fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
                  }}
                >
                  Product designer. Building in public.
                </span>
              </div>
            </div>
          </Popover>
        </div>
      </div>

      <Cursor style={cursorStyle} variant="pointer" />
    </div>
  );
};

export const popoverExampleCode = `import { Cursor } from "@/components/remocn/cursor";
import { useCursorPath } from "@/components/remocn/use-cursor-path";
import { Popover } from "@/components/remocn/popover";
import { usePopoverTransition } from "@/components/remocn/use-popover-transition";

const CHIP_X = 320;
const CHIP_Y = 180;

export const Scene = () => {
  // Cursor eases onto the chip, triggers the hover-card, then leaves.
  const cursorStyle = useCursorPath([
    { at: 0,   x: 80,     y: 60     },
    { at: 28,  x: CHIP_X, y: CHIP_Y, duration: 24 },
    { at: 110, x: 100,    y: 100,    duration: 20 },
  ]);

  // Hover-card opens shortly after the cursor arrives, closes as it leaves.
  const popoverStyle = usePopoverTransition([
    { at: 36,  state: "opened", duration: 10 },
    { at: 100, state: "closed", duration: 10 },
  ]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Anchor — the @username chip. */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          display: "inline-block",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 10px",
            borderRadius: 999,
            background: "oklch(0.94 0 0)",
            border: "1px solid oklch(0.87 0 0)",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          @alexsmith
        </div>

        {/* Popover anchored above the chip, centered horizontally. */}
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 12px)",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <Popover style={popoverStyle} side="top" width={240}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  background: "oklch(0.75 0.08 260)",
                  flexShrink: 0,
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Alex Smith</span>
                <span style={{ fontSize: 12, color: "oklch(0.55 0 0)" }}>@alexsmith</span>
                <span style={{ fontSize: 13, lineHeight: 1.4, color: "oklch(0.4 0 0)", marginTop: 4 }}>
                  Product designer. Building in public.
                </span>
              </div>
            </div>
          </Popover>
        </div>
      </div>

      <Cursor style={cursorStyle} variant="pointer" />
    </div>
  );
};`;
