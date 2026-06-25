"use client";

import { Progress } from "@/registry/remocn-ui/progress";

export interface ProgressPreviewProps {
  value?: number;
  width?: number;
  showLabel?: boolean;
}

export function ProgressPreview({
  value = 62,
  width = 320,
  showLabel = true,
}: ProgressPreviewProps) {
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
      <Progress value={value} width={width} showLabel={showLabel} />
    </div>
  );
}
