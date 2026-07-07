"use client";

import { Cursor } from "@/registry/remocn-ui/cursor";
import { useCursorPath } from "@/registry/remocn-ui/cursor/use-cursor-path";
import { Slider } from "@/registry/remocn-ui/slider";
import { useSliderTransition } from "@/registry/remocn-ui/slider/use-slider-transition";

// Track is 320px wide, centered on the 1280×720 canvas.
// Track left edge: (1280 - 320) / 2 = 480px. Track vertical center: 360px.
// Value 20% → thumb x: 480 + 0.20 × 320 = 544. Value 80% → thumb x: 480 + 0.80 × 320 = 736.
const THUMB_START_X = 544; // canvas x at value 20
const THUMB_END_X = 736; // canvas x at value 80
const THUMB_Y = 360; // canvas y of track center

export const sliderExampleControls = ["showValue"] as const;

export interface SliderExampleProps {
  showValue?: boolean;
}

export const SliderExampleScene = (p: SliderExampleProps = {}) => {
  // Cursor: park top-left → ease to thumb (arrives frame 30) → drag to end (arrives frame 100) → release.
  const cursorStyle = useCursorPath([
    { at: 0, x: 80, y: 60 },
    { at: 30, x: THUMB_START_X, y: THUMB_Y, duration: 26 },
    { at: 44, x: THUMB_START_X, y: THUMB_Y, press: true, duration: 0 },
    { at: 100, x: THUMB_END_X, y: THUMB_Y, press: true, duration: 56 },
    { at: 108, x: THUMB_END_X, y: THUMB_Y, duration: 0 },
  ]);

  // Slider: dual-channel — value eases 20 → 80 during the drag; thumb idles → hover → press → idle.
  const sliderStyle = useSliderTransition([
    { at: 0, value: 20, thumbState: "idle" },
    { at: 30, thumbState: "hover", duration: 8 },
    { at: 44, thumbState: "press", duration: 6 },
    { at: 44, value: 20 },
    // Match the cursor's default inOut easing so the thumb tracks the cursor exactly.
    { at: 100, value: 80, duration: 56, easing: "inOut" },
    { at: 108, thumbState: "idle", duration: 8 },
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
        <Slider
          style={sliderStyle}
          width={320}
          showValue={p.showValue ?? true}
        />
      </div>
      <Cursor style={cursorStyle} variant="pointer" />
    </div>
  );
};

export const sliderExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const showValue = values.showValue as boolean | undefined;

  const props: string[] = [];
  if (showValue !== undefined && showValue !== true)
    props.push(`showValue={${showValue}}`);

  const sliderPropsStr = props.length ? ` ${props.join(" ")}` : "";
  return `import { Cursor } from "@/components/remocn/cursor";
import { useCursorPath } from "@/components/remocn/use-cursor-path";
import { Slider } from "@/components/remocn/slider";
import { useSliderTransition } from "@/components/remocn/use-slider-transition";

// Track is 320px wide, centered on the canvas.
// Adjust these to match your canvas dimensions and slider position.
const THUMB_START_X = 544; // canvas x at value 20
const THUMB_END_X   = 736; // canvas x at value 80
const THUMB_Y       = 360; // canvas y of track center

export const Scene = () => {
  // Cursor eases to the thumb, holds press, drags to the right, then releases.
  const cursorStyle = useCursorPath([
    { at: 0,   x: 80,           y: 60      },
    { at: 30,  x: THUMB_START_X, y: THUMB_Y, duration: 26 },
    { at: 44,  x: THUMB_START_X, y: THUMB_Y, press: true,  duration: 0 },
    { at: 100, x: THUMB_END_X,   y: THUMB_Y, press: true,  duration: 56 },
    { at: 108, x: THUMB_END_X,   y: THUMB_Y, duration: 0 },
  ]);

  // Slider dual-channel: value eases 20 → 80 in sync with the cursor drag;
  // thumb visual transitions idle → hover → press → idle.
  const sliderStyle = useSliderTransition([
    { at: 0,   value: 20, thumbState: "idle"  },
    { at: 30,  thumbState: "hover", duration: 8 },
    { at: 44,  thumbState: "press", duration: 6 },
    { at: 44,  value: 20 },
    // Match the cursor's default inOut easing so the thumb tracks the cursor exactly.
    { at: 100, value: 80,           duration: 56, easing: "inOut" },
    { at: 108, thumbState: "idle",  duration: 8 },
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
        <Slider style={sliderStyle} width={320}${sliderPropsStr} />
      </div>
      <Cursor style={cursorStyle} variant="pointer" />
    </div>
  );
};`;
};
