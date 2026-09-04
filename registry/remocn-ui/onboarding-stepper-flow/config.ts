import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const onboardingStepperFlowConfig: ComponentConfig = {
  componentName: "OnboardingStepperFlow",
  importPath: "@/components/remocn/onboarding-stepper-flow",
  controls: {},
  durationInFrames: 175,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
};
