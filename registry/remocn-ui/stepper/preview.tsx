"use client";

import { useRemocnTheme } from "@/lib/remocn-ui";
import { Stepper } from "@/registry/remocn-ui/stepper";

export interface StepperPreviewProps {
  activeIndex?: number;
  mode?: "light" | "dark";
}

const DEMO_STEPS = ["Account", "Plan", "Done"];

export function StepperPreview({ activeIndex = 1, mode }: StepperPreviewProps) {
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
      <Stepper steps={DEMO_STEPS} activeIndex={activeIndex} mode={mode} />
    </div>
  );
}
