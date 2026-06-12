"use client";

import { useRemocnTheme } from "@/lib/remocn-ui";
import { Progress } from "@/registry/remocn-ui/progress";

export interface ProgressPreviewProps {
  value?: number;
  width?: number;
  showLabel?: boolean;
  mode?: "light" | "dark";
}

export function ProgressPreview({
  value = 62,
  width = 320,
  showLabel = true,
  mode,
}: ProgressPreviewProps) {
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
      <Progress value={value} width={width} showLabel={showLabel} mode={mode} />
    </div>
  );
}
