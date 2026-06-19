"use client";

import { Slider, type SliderThumbState } from "@/registry/remocn-ui/slider";

export interface SliderPreviewProps {
  value?: number;
  thumbState?: SliderThumbState;
  width?: number;
  showValue?: boolean;
}

export function SliderPreview({
  value = 40,
  thumbState = "idle",
  width = 320,
  showValue = true,
}: SliderPreviewProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      <Slider
        value={value}
        thumbState={thumbState}
        width={width}
        showValue={showValue}
      />
    </div>
  );
}
