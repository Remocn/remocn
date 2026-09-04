import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const signupFlowConfig: ComponentConfig = {
  componentName: "SignupFlow",
  importPath: "@/components/remocn/signup-flow",
  controls: {},
  durationInFrames: 380,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(0.97 0 0)" },
};
