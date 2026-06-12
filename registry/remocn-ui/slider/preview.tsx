"use client";

import { useRemocnTheme } from "@/lib/remocn-ui";
import { Slider, type SliderThumbState } from "@/registry/remocn-ui/slider";

export interface SliderPreviewProps {
  value?: number;
  thumbState?: SliderThumbState;
  width?: number;
  showValue?: boolean;
  mode?: "light" | "dark";
}

export function SliderPreview({
  value = 40,
  thumbState = "idle",
  width = 320,
  showValue = true,
  mode,
}: SliderPreviewProps) {
  const theme = useRemocnTheme(undefined, mode);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: theme.background,
      }}
    >
      <Slider
        value={value}
        thumbState={thumbState}
        width={width}
        showValue={showValue}
        mode={mode}
      />
    </div>
  );
}
