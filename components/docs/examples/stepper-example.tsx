"use client";

import { Stepper } from "@/registry/remocn-ui/stepper";
import { useStepperTransition } from "@/registry/remocn-ui/stepper/use-stepper-transition";

export interface StepperExampleProps {
  steps?: string[];
}

export const stepperExampleControls = ["steps"] as const;

export const StepperExampleScene = (p: StepperExampleProps = {}) => {
  // Advance through 3 steps: "Account" (0) → "Plan" (1) → "Done" (2).
  // Start explicitly at index 0 (else the timeline holds the first step's index
  // before it fires); each step arrives at the end of a 24-frame ease.
  const stepperStyle = useStepperTransition([
    { at: 0,   index: 0 },
    { at: 50,  index: 1, duration: 24 },
    { at: 110, index: 2, duration: 24 },
  ]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Stepper renders position:absolute;inset:0 — it fills and centers itself. */}
      <Stepper
        style={stepperStyle}
        steps={p.steps ?? ["Account", "Plan", "Done"]}
      />
    </div>
  );
};

export const stepperExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const steps = values.steps as string[] | undefined;

  const props: string[] = [];
  if (steps !== undefined) props.push(`steps={${JSON.stringify(steps)}}`);
  const extraProps = props.length ? `\n        ${props.join("\n        ")}\n        ` : "";

  return `import { Stepper } from "@/components/remocn/stepper";
import { useStepperTransition } from "@/components/remocn/use-stepper-transition";

export const Scene = () => {
  // Advance through 3 steps: "Account" → "Plan" → "Done".
  // Start explicitly at index 0; each step arrives after a 24-frame ease.
  const stepperStyle = useStepperTransition([
    { at: 0,   index: 0 },
    { at: 50,  index: 1, duration: 24 },
    { at: 110, index: 2, duration: 24 },
  ]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Stepper${extraProps}style={stepperStyle} />
    </div>
  );
};`;
};
