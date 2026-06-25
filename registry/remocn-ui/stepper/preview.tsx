"use client";

import { Stepper } from "@/registry/remocn-ui/stepper";

export interface StepperPreviewProps {
  activeIndex?: number;
}

const DEMO_STEPS = ["Account", "Plan", "Done"];

export function StepperPreview({ activeIndex = 1 }: StepperPreviewProps) {
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
      <Stepper steps={DEMO_STEPS} activeIndex={activeIndex} />
    </div>
  );
}
